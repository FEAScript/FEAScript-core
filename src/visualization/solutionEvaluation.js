/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.1 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import {
  prepareMesh,
  computeNodeNeighbors,
  getBoundarySegments,
  getModelMeshDimension,
} from "../mesh/meshUtils.js";
import { locatePointInElement } from "../elements/elementGeometry.js";
import { BasisFunctions } from "../elements/basisFunctions.js";
import { selectSolutionField } from "./solutionFields.js";
import { FEAScriptError } from "../utilities/errors.js";

/** @import { PlotModel, PlotResult } from "../types.js" */

/**
 * Function to evaluate a 2D solution at given points, e.g. to sample it on a grid of another program or to read
 * it along a line. Each point is located in the mesh and the nodal values of its element are interpolated with the
 * element basis functions, so the values are exact for the fields the elements reproduce (linear fields on linear
 * elements, quadratic fields on straight-sided quadratic elements)
 * @param {PlotModel} model - The FEAScriptModel, or the model information of a worker (FEAScriptWorker.getModelInfo())
 * @param {PlotResult} result - The result of solve(), with the solution vector and the node coordinates
 * @param {Array<[number, number]>} points - The points, as [x, y] pairs
 * @param {{ field?: string }} [options] - Evaluation options:
 *  - field: The named field to evaluate, for models with more than one unknown per node; defaults to the main field of the model
 * @returns {Float64Array} The value at each point, in the order of the points; NaN for a point outside the mesh
 *  (outside the domain or inside a hole). Points on the boundary count as inside
 * @throws {FEAScriptError} INVALID_INPUT
 */
export function evaluateSolution(model, result, points, options = {}) {
  const meshDimension = getModelMeshDimension(model);
  if (meshDimension !== "2D") {
    throw new FEAScriptError(
      "INVALID_INPUT",
      `evaluateSolution supports 2D meshes in this version; this model has a ${meshDimension} mesh.`,
    );
  }
  if (!Array.isArray(points)) {
    throw new FEAScriptError(
      "INVALID_INPUT",
      "evaluateSolution expects the points as an array of [x, y] pairs.",
    );
  }

  const { values: nodalValues } = selectSolutionField(model, result, options.field);
  const locate = createSolutionLocator(model, result.nodesCoordinates, nodalValues);
  const values = new Float64Array(points.length);
  for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
    const point = points[pointIndex];
    const x = point?.[0];
    const y = point?.[1];
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new FEAScriptError(
        "INVALID_INPUT",
        `Point ${pointIndex} is ${JSON.stringify(
          point,
        )}; each point must be an [x, y] pair of finite numbers.`,
      );
    }
    values[pointIndex] = locate(x, y) ?? NaN;
  }
  return values;
}

/**
 * Function to prepare the location of points in a 2D mesh and the interpolation of nodal values there
 *
 * A point outside the boundary (ray casting) is rejected first. Otherwise the elements around the nodes of the
 * element that held the previous point are tried (quick search, for points that follow each other, as on a grid),
 * then all elements (slow search)
 * @param {PlotModel} model - The FEAScriptModel, or the model information of a worker
 * @param {{ nodesXCoordinates: ArrayLike<number>, nodesYCoordinates: ArrayLike<number> }} nodesCoordinates - The
 *  node coordinates of the result
 * @param {ArrayLike<number>} nodalValues - One value per mesh node
 * @returns {(x: number, y: number) => number | null} A function giving the interpolated value at a point, or null
 *  for a point outside the mesh
 */
export function createSolutionLocator(model, nodesCoordinates, nodalValues) {
  const { nodesXCoordinates, nodesYCoordinates } = nodesCoordinates;
  const meshData = prepareMesh(model);
  const { nop, elementShape } = meshData;
  const basisFunctions = new BasisFunctions({
    meshDimension: "2D",
    elementOrder: meshData.elementOrder,
    elementShape,
  });
  const boundarySegments = getBoundarySegments(meshData);
  const { nodeNeighbors, neighborCount } = computeNodeNeighbors(meshData);

  // Function to interpolate the nodal values at a point of an element, or give null if the point is not in it
  const valueInElement = (elementIndex, x, y) => {
    // All element nodes are passed, as the edges of quadratic elements may be curved
    const elementNodes = nop[elementIndex].map((globalNodeNumber) => [
      nodesXCoordinates[globalNodeNumber - 1],
      nodesYCoordinates[globalNodeNumber - 1],
    ]);
    const pointCheck = locatePointInElement(x, y, elementNodes, elementShape, basisFunctions);
    if (!pointCheck.inside) return null;
    const { basisFunction } = basisFunctions.getBasisFunctions(pointCheck.ksi, pointCheck.eta);
    let value = 0;
    for (let localNodeIndex = 0; localNodeIndex < nop[elementIndex].length; localNodeIndex++) {
      value += nodalValues[nop[elementIndex][localNodeIndex] - 1] * basisFunction[localNodeIndex];
    }
    return value;
  };

  let lastParentElement = 0;
  return (x, y) => {
    if (!pointInsidePolygon(x, y, boundarySegments)) return null;

    // Quick search: the elements around the nodes of the last element that held a point
    for (const globalNodeNumber of nop[lastParentElement]) {
      const globalNodeIndex = globalNodeNumber - 1;
      for (let neighborIndex = 0; neighborIndex < neighborCount[globalNodeIndex]; neighborIndex++) {
        const elementIndex = nodeNeighbors[globalNodeIndex][neighborIndex];
        const value = valueInElement(elementIndex, x, y);
        if (value !== null) {
          lastParentElement = elementIndex;
          return value;
        }
      }
    }

    // Slow search: all elements
    for (let elementIndex = 0; elementIndex < nop.length; elementIndex++) {
      const value = valueInElement(elementIndex, x, y);
      if (value !== null) {
        lastParentElement = elementIndex;
        return value;
      }
    }
    return null;
  };
}

/**
 * Function to check if a point is inside a polygon using ray casting algorithm
 * @param {number} x - X-coordinate of the point
 * @param {number} y - Y-coordinate of the point
 * @param {array} segments - Array of boundary segments
 * @returns {boolean} True if the point is inside the polygon
 */
function pointInsidePolygon(x, y, segments) {
  // Points on the boundary count as inside: ray casting alone keeps the bottom and left edges of a
  // domain but drops the top and right ones, so the plot would stop one grid step short there
  let inside = false;
  for (let i = 0; i < segments.length; i++) {
    const [[x1, y1], [x2, y2]] = segments[i];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const tolerance = 1e-9 * (Math.abs(dx) + Math.abs(dy)); // Relative to the segment length
    if (
      x >= Math.min(x1, x2) - tolerance &&
      x <= Math.max(x1, x2) + tolerance &&
      y >= Math.min(y1, y2) - tolerance &&
      y <= Math.max(y1, y2) + tolerance &&
      Math.abs(dx * (y - y1) - dy * (x - x1)) <= tolerance * Math.hypot(dx, dy)
    ) {
      return true;
    }
    const intersect = y1 > y !== y2 > y && x < (dx * (y - y1)) / dy + x1;
    if (intersect) inside = !inside;
  }
  return inside;
}
