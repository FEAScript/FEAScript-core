/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { readGeometry, shown } from "./geometry.js";
import { FEAScriptError } from "../utilities/errors.js";
import { basicLog, debugLog } from "../utilities/logging.js";

/**
 * Structured meshes: a line of 1D elements, and a quadrilateral (a rectangle, a trapezoid or any convex
 * four-sided shape) mapped from a grid of quadrilateral elements. The mesh objects they return are in the form
 * that `model.setMesh(mesh)` takes, the same as the meshes of `generateTriangleMesh` and `importGmshMesh`:
 *  - nodesXCoordinates, nodesYCoordinates: the coordinates of the nodes
 *  - nodalNumbering: for each element, its nodes (numbered from 1)
 *  - boundaryElements: for each boundary name, the [elementIndex, side] pairs on it
 *  - aliases: other keys accepted for the boundaries (the numeric keys of FEAScript 0.3), with a warning
 *  - meshDimension, elementOrder, elementShape ("line", "quad" or "triangle")
 */

/**
 * Function to read the number of divisions of an edge from the mesh configuration: `divisions`, or the edge
 * length over `size`
 */
function divisionCount(length, size, divisions, label, problems) {
  if (divisions !== undefined) {
    if (!(Number.isInteger(divisions) && divisions > 0)) {
      problems.push(`${label} must be a positive integer; got ${shown(divisions)}.`);
      return 1;
    }
    return divisions;
  }
  if (!(Number.isFinite(size) && size > 0)) {
    problems.push(`size must be a positive number, the length of an element side; got ${shown(size)}.`);
    return 1;
  }
  return Math.max(1, Math.round(length / size));
}

function checkElementOrder(elementOrder, problems) {
  if (elementOrder !== "linear" && elementOrder !== "quadratic") {
    problems.push(`elementOrder must be "linear" or "quadratic"; got ${shown(elementOrder)}.`);
  }
}

/**
 * Function to generate a mesh of a line, from x = 0 to x = length, with the boundaries "left" and "right"
 * @param {number} length - The length of the domain
 * @param {object} options - The mesh settings
 * @param {string} [options.elementOrder="linear"] - "linear" (2-node) or "quadratic" (3-node) elements
 * @param {number} [options.size] - The length of the elements (rounded to a whole number of elements)
 * @param {number} [options.divisions] - The number of elements, instead of `size`
 * @returns {object} The mesh, for `model.setMesh(mesh)`
 * @throws {FEAScriptError} "INVALID_INPUT" for a setting out of range
 */
export function generateLineMesh(length, { elementOrder = "linear", size, divisions } = {}) {
  const problems = [];
  if (!(Number.isFinite(length) && length > 0)) {
    problems.push(`line must be a positive number, the length of the domain; got ${shown(length)}.`);
  }
  checkElementOrder(elementOrder, problems);
  const numElements = divisionCount(length, size, divisions, "divisions", problems);
  FEAScriptError.throwIfAny("INVALID_INPUT", problems);

  const quadratic = elementOrder === "quadratic";
  const totalNodes = quadratic ? 2 * numElements + 1 : numElements + 1;
  const nodesXCoordinates = [];
  const step = length / numElements / (quadratic ? 2 : 1);
  for (let nodeIndex = 0; nodeIndex < totalNodes; nodeIndex++) {
    nodesXCoordinates.push(nodeIndex * step);
  }
  nodesXCoordinates[totalNodes - 1] = length;

  /**
   * Linear 1D elements:  1 --- 2      Quadratic 1D elements:  1--2--3
   */
  const nodalNumbering = [];
  for (let elementIndex = 0; elementIndex < numElements; elementIndex++) {
    const first = quadratic ? 2 * elementIndex + 1 : elementIndex + 1;
    nodalNumbering.push(quadratic ? [first, first + 1, first + 2] : [first, first + 1]);
  }

  // Side 0 is the left node of an element, side 1 its right node
  const boundaryElements = { left: [[0, 0]], right: [[numElements - 1, 1]] };
  debugLog("Generated node X coordinates: " + JSON.stringify(nodesXCoordinates));
  basicLog(`Generated a line mesh of ${totalNodes} nodes and ${numElements} ${elementOrder} elements`);
  return {
    meshDimension: "1D",
    elementOrder,
    elementShape: "line",
    nodesXCoordinates,
    nodesYCoordinates: [],
    nodalNumbering,
    boundaryElements,
    aliases: { 0: "left", 1: "right" },
    totalNodesX: totalNodes,
    totalNodesY: 1,
  };
}

/**
 * Function to generate a mesh of quadrilateral elements in a four-sided shape: a grid of nx by ny elements
 * mapped onto the shape by its corners (a bilinear map), so that the rows of nodes run from the bottom side
 * to the top side and the columns from the left side to the right side. The nodes are numbered column by
 * column, along y first
 * @param {object} geometry - The geometry (see geometry.js): a rectangle, or one shape of exactly four points
 *  without holes or points
 * @param {object} options - The mesh settings
 * @param {string} [options.elementOrder="linear"] - "linear" (4-node) or "quadratic" (9-node) elements
 * @param {number} [options.size] - The length of an element side; each side of the shape is divided into
 *  round(length / size) elements, the longer of two opposite sides deciding
 * @param {number[]} [options.divisions] - [nx, ny], the number of elements along the bottom and the left
 *  side, instead of `size`
 * @returns {object} The mesh, for `model.setMesh(mesh)`
 * @throws {FEAScriptError} "INVALID_INPUT" for a shape that is not a quadrilateral or a setting out of range
 */
export function generateQuadrilateralMesh(geometry, { elementOrder = "linear", size, divisions } = {}) {
  const normalized = geometry?.kind ? geometry : readGeometry(geometry);
  const problems = [];
  if (normalized.meshDimension !== "2D") {
    problems.push("Quadrilateral elements need a 2D geometry: a rectangle or a shape of four points.");
  } else {
    const shape = normalized.shapes[0];
    if (shape.points.length !== 4) {
      problems.push(
        `Quadrilateral elements need a shape of exactly 4 points in this version; the shape has ${shape.points.length}. Use elements: "triangles" for other shapes, or split the domain into blocks (0.5.0).`,
      );
    }
    if (normalized.holes.length > 0) {
      problems.push(
        'Quadrilateral elements cannot mesh a shape with holes in this version; use elements: "triangles".',
      );
    }
    if (normalized.points.length > 0) {
      problems.push('Quadrilateral elements cannot embed points in this version; use elements: "triangles".');
    }
  }
  checkElementOrder(elementOrder, problems);
  if (typeof size === "function") {
    problems.push(
      'size as a function of position is for elements: "triangles" in this version; give quadrilateral elements a number, or divisions: [nx, ny].',
    );
  }
  if (divisions !== undefined && !(Array.isArray(divisions) && divisions.length === 2)) {
    problems.push(`divisions must be [nx, ny] for quadrilateral elements; got ${shown(divisions)}.`);
  }
  FEAScriptError.throwIfAny("INVALID_INPUT", problems);

  // The corners, counter-clockwise from the first point: bottom side P0 to P1, right P1 to P2, top P2 to P3,
  // left P3 to P0 (the names of the sides are those of the edges, whatever their direction)
  const shape = normalized.shapes[0];
  let corners = shape.points.map((point) => point.slice());
  let names = shape.names.slice();
  const signedArea = corners.reduce((sum, [x, y], i) => {
    const [nx, ny] = corners[(i + 1) % 4];
    return sum + x * ny - nx * y;
  }, 0);
  if (signedArea < 0) {
    // Clockwise input: reverse the points so that the mapping keeps a positive Jacobian. The edge i of the
    // reversed polygon is the edge from point i + 1 to point i of the input
    corners = [corners[0], corners[3], corners[2], corners[1]];
    names = [names[3], names[2], names[1], names[0]];
  }
  // A convex check: every corner turns the same way
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = corners[i];
    const [bx, by] = corners[(i + 1) % 4];
    const [cx, cy] = corners[(i + 2) % 4];
    if ((bx - ax) * (cy - by) - (by - ay) * (cx - bx) <= 0) {
      throw new FEAScriptError(
        "INVALID_INPUT",
        `Quadrilateral elements need a convex shape; the corner (${bx}, ${by}) turns inwards. Use elements: "triangles" for this shape.`,
      );
    }
  }
  const [P0, P1, P2, P3] = corners;
  const length = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const numElementsX = divisionCount(
    Math.max(length(P0, P1), length(P3, P2)),
    size,
    divisions?.[0],
    "divisions[0]",
    problems,
  );
  const numElementsY = divisionCount(
    Math.max(length(P1, P2), length(P0, P3)),
    size,
    divisions?.[1],
    "divisions[1]",
    problems,
  );
  FEAScriptError.throwIfAny("INVALID_INPUT", problems);

  const quadratic = elementOrder === "quadratic";
  const totalNodesX = quadratic ? 2 * numElementsX + 1 : numElementsX + 1;
  const totalNodesY = quadratic ? 2 * numElementsY + 1 : numElementsY + 1;
  const nodesXCoordinates = new Array(totalNodesX * totalNodesY);
  const nodesYCoordinates = new Array(totalNodesX * totalNodesY);
  for (let nodeIndexX = 0; nodeIndexX < totalNodesX; nodeIndexX++) {
    const s = nodeIndexX / (totalNodesX - 1);
    for (let nodeIndexY = 0; nodeIndexY < totalNodesY; nodeIndexY++) {
      const t = nodeIndexY / (totalNodesY - 1);
      const node = nodeIndexX * totalNodesY + nodeIndexY;
      // Bilinear map of the unit square onto the shape
      nodesXCoordinates[node] =
        (1 - s) * (1 - t) * P0[0] + s * (1 - t) * P1[0] + s * t * P2[0] + (1 - s) * t * P3[0];
      nodesYCoordinates[node] =
        (1 - s) * (1 - t) * P0[1] + s * (1 - t) * P1[1] + s * t * P2[1] + (1 - s) * t * P3[1];
    }
  }

  const nodalNumbering = [];
  if (!quadratic) {
    /**
     * Linear quadrilateral elements:
     *   1 --- 3
     *   |     |
     *   0 --- 2
     */
    let rowCounter = 0;
    let columnCounter = 2;
    for (let elementIndex = 0; elementIndex < numElementsX * numElementsY; elementIndex++) {
      rowCounter += 1;
      const first = elementIndex + columnCounter - 1;
      nodalNumbering.push([first, first + 1, first + numElementsY + 1, first + numElementsY + 2]);
      if (rowCounter === numElementsY) {
        columnCounter += 1;
        rowCounter = 0;
      }
    }
  } else {
    /**
     * Quadratic quadrilateral elements:
     *   2--5--8
     *   |     |
     *   1  4  7
     *   |     |
     *   0--3--6
     */
    for (let elementIndexX = 1; elementIndexX <= numElementsX; elementIndexX++) {
      for (let elementIndexY = 1; elementIndexY <= numElementsY; elementIndexY++) {
        const element = [];
        for (let column = 1; column <= 3; column++) {
          const first = totalNodesY * (2 * elementIndexX + column - 3) + 2 * elementIndexY - 1;
          element.push(first, first + 1, first + 2);
        }
        nodalNumbering.push(element);
      }
    }
  }

  // The sides of the reference element: 0 bottom, 1 left, 2 top, 3 right. The side names are the edge names of
  // the shape: edge 0 (P0 to P1) is the bottom, edge 1 the right, edge 2 the top and edge 3 the left
  const sideNames = { 0: names[0], 3: names[1], 2: names[2], 1: names[3] };
  const boundaryElements = {};
  normalized.boundaryNames.forEach((name) => {
    boundaryElements[name] = [];
  });
  for (let elementIndexX = 0; elementIndexX < numElementsX; elementIndexX++) {
    for (let elementIndexY = 0; elementIndexY < numElementsY; elementIndexY++) {
      const elementIndex = elementIndexX * numElementsY + elementIndexY;
      if (elementIndexY === 0) boundaryElements[sideNames[0]].push([elementIndex, 0]);
      if (elementIndexX === 0) boundaryElements[sideNames[1]].push([elementIndex, 1]);
      if (elementIndexY === numElementsY - 1) boundaryElements[sideNames[2]].push([elementIndex, 2]);
      if (elementIndexX === numElementsX - 1) boundaryElements[sideNames[3]].push([elementIndex, 3]);
    }
  }

  debugLog("Generated node X coordinates: " + JSON.stringify(nodesXCoordinates));
  debugLog("Generated node Y coordinates: " + JSON.stringify(nodesYCoordinates));
  basicLog(
    `Generated a quadrilateral mesh of ${nodesXCoordinates.length} nodes and ${nodalNumbering.length} ${elementOrder} elements (${numElementsX} by ${numElementsY})`,
  );
  return {
    meshDimension: "2D",
    elementOrder,
    elementShape: "quad",
    nodesXCoordinates,
    nodesYCoordinates,
    nodalNumbering,
    boundaryElements,
    aliases: { ...normalized.aliases },
    totalNodesX,
    totalNodesY,
  };
}
