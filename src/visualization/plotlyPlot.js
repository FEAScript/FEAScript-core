/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
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
 * Function to stop a plot whose container does not exist (Plotly would otherwise fail with a plain Error). Outside
 * a browser there is no document to check, and the call is left to Plotly
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 * @throws {FEAScriptError} INVALID_INPUT
 */
function validatePlotContainer(plotDivId) {
  if (typeof document === "undefined" || document.getElementById(plotDivId)) return;
  throw new FEAScriptError("INVALID_INPUT", `Could not find plot container with id: ${plotDivId}`);
}

// Plot sizing: a plot fills the width of its container, up to the largest size below, and a 2D plot keeps one scale
// for x and y. The colour bar of a 2D plot sits in a fixed right margin, with its title on its side, so plots of
// different fields get the same drawing area
const largestPlotSize = { width: 600, height: 600 };
const linePlotHeight = 300;
const contourMargin = { l: 50, r: 100, t: 50, b: 50 };

/**
 * Function to find the width available to a plot: the width of its container, up to the largest plot width
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 * @returns {number} The width, in pixels
 */
function availablePlotWidth(plotDivId) {
  // Without a page (as in Node.js tests) the width of the window is used
  const containerWidth = globalThis.document?.getElementById(plotDivId)?.clientWidth || window.innerWidth;
  return Math.min(containerWidth, largestPlotSize.width);
}

/**
 * Function to find the largest plot of a given shape, so that x and y have one scale and no space goes unused
 * @param {number} lengthX - The length of the domain along x
 * @param {number} lengthY - The length of the domain along y
 * @param {object} margins - The margins `l`, `r`, `t` and `b`, in pixels
 * @param {object} box - The `width` and `height` available, in pixels
 * @returns {object} The `width` and `height` of the plot, in pixels
 */
function fittedPlotSize(lengthX, lengthY, { l, r, t, b }, box) {
  const scale = Math.min((box.width - l - r) / lengthX, (box.height - t - b) / lengthY);
  return { width: Math.round(scale * lengthX) + l + r, height: Math.round(scale * lengthY) + t + b };
}

/**
 * Function to draw a 2D contour plot that fills the width of its container, with one scale for x and y
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 * @param {object} contourData - The Plotly contour trace
 * @param {string} title - The title of the plot
 * @param {number[]} xCoordinates - The x-coordinates of the points
 * @param {number[]} yCoordinates - The y-coordinates of the points
 * @param {string} colorbarTitle - The name of the plotted field
 */
function drawContourPlot(plotDivId, contourData, title, xCoordinates, yCoordinates, colorbarTitle) {
  const minX = Math.min(...xCoordinates);
  const maxX = Math.max(...xCoordinates);
  const minY = Math.min(...yCoordinates);
  const maxY = Math.max(...yCoordinates);
  const box = { width: availablePlotWidth(plotDivId), height: largestPlotSize.height };

  const layout = {
    title,
    ...fittedPlotSize(maxX - minX, maxY - minY, contourMargin, box),
    xaxis: { title: "x", range: [minX, maxX] },
    yaxis: { title: "y", range: [minY, maxY], scaleanchor: "x", scaleratio: 1 },
    margin: contourMargin,
    hovermode: "closest",
  };
  const trace = {
    ...contourData,
    colorbar: { title: { text: colorbarTitle, side: "right" }, thickness: 15 },
  };
  Plotly.newPlot(plotDivId, [trace], layout, { responsive: true });

  // Very long colour bar labels can still widen the margins. Fit the plot again to the margins Plotly used
  const margins = globalThis.document?.getElementById(plotDivId)?._fullLayout?._size;
  if (margins && (margins.l !== contourMargin.l || margins.r !== contourMargin.r)) {
    Plotly.relayout(plotDivId, fittedPlotSize(maxX - minX, maxY - minY, margins, box));
  }
}

/**
 * Function to create plots of the solution vector
 * @param {PlotModel} model - The model, or its information from FEAScriptWorker.getModelInfo()
 * @param {PlotResult} result - The result of solve(), with the solution vector and the node coordinates
 * @param {string} plotType - The type of plot
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 * @param {{ field?: string }} [options] - Plot options:
 *  - field: The named field to plot, for models with more than one unknown per node (e.g. "u", "v", "p" for
 *    creeping flow, "w", "theta" for the Euler-Bernoulli beam); defaults to the main field of the model
 */
export function plotSolution(model, result, plotType, plotDivId, options = {}) {
  validatePlotContainer(plotDivId);
  console.time("plottingTime");
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
  const { values: solutionVector, fieldName } = selectSolutionField(model, result, options.field);
  const solutionLabel = fieldName ?? "Solution";
  const solverConfig = model.solverConfig;
  const meshDimension = getModelMeshDimension(model);

  if (meshDimension === "1D" && plotType === "line") {
    const yData = Array.from(solutionVector);

    let lineData = {
      x: nodesXCoordinates,
      y: yData,
      mode: "lines",
      type: "scatter",
      line: { color: "rgb(219, 64, 82)", width: 2 },
      name: solutionLabel,
    };

    let layout = {
      title: `line plot - ${solverConfig}`,
      width: availablePlotWidth(plotDivId),
      height: linePlotHeight,
      xaxis: { title: "x" },
      yaxis: { title: solutionLabel },
      margin: { l: 50, r: 50, t: 50, b: 50 },
    };

    Plotly.newPlot(plotDivId, [lineData], layout, { responsive: true });
    console.timeEnd("plottingTime");
  } else if (meshDimension === "2D" && plotType === "contour") {
    const zData = Array.from(solutionVector);

    // Create the plot
    let contourData = {
      x: nodesXCoordinates,
      y: nodesYCoordinates,
      z: zData,
      type: "contour",
      line: {
        smoothing: 0.85,
      },
      contours: {
        coloring: "heatmap",
        showlabels: false,
      },
      //colorscale: 'Viridis',
      name: "Solution Field",
    };

    drawContourPlot(
      plotDivId,
      contourData,
      `${plotType} plot - ${solverConfig}`,
      nodesXCoordinates,
      nodesYCoordinates,
      solutionLabel,
    );
    console.timeEnd("plottingTime");
  } else {
    console.timeEnd("plottingTime");
    throw new FEAScriptError(
      "INVALID_INPUT",
      `plotSolution cannot draw a "${plotType}" plot of a ${meshDimension} mesh. Supported: "line" for 1D and "contour" for 2D meshes.`,
    );
  }
}

/**
 * Function to generate a dense visualization grid and interpolate the FEM solution on it
 * @param {PlotModel} model - The model, or its information from FEAScriptWorker.getModelInfo()
 * @param {PlotResult} result - The result of solve(), with the solution vector and the node coordinates
 * @param {string} plotType - The type of plot
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 * @param {{ field?: string }} [options] - Plot options:
 *  - field: The named field to plot, for models with more than one unknown per node; defaults to the main field of the model
 */
export function plotInterpolatedSolution(model, result, plotType, plotDivId, options = {}) {
  validatePlotContainer(plotDivId);
  console.time("plottingTime");
  const { values, fieldName } = selectSolutionField(model, result, options.field);
  result = { ...result, solutionVector: values, fields: undefined }; // Interpolate the selected field
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates; // TODO: Check if we should place it inside the 2D block
  const meshDimension = getModelMeshDimension(model);
  const meshData = prepareMesh(model); // Retrieve mesh connectivity details

  // Initialize BasisFunctions once here to avoid creating it inside the loop
  const basisFunctions = new BasisFunctions({
    meshDimension: getModelMeshDimension(model),
    elementOrder: meshData.elementOrder,
    elementShape: meshData.elementShape,
  });

  if (meshDimension === "2D" && plotType === "contour") {
    const visNodeXCoordinates = [];
    const visNodeYCoordinates = [];
    const lengthX = Math.max(...nodesXCoordinates) - Math.min(...nodesXCoordinates);
    const lengthY = Math.max(...nodesYCoordinates) - Math.min(...nodesYCoordinates);
    const visPoinsPerUnit = 50; // Number of nodes per one length unit of the visualization grid
    const visNodesX = Math.round(lengthX * visPoinsPerUnit); // Number of nodes along the x-axis of the visualization grid
    const visNodesY = Math.round(lengthY * visPoinsPerUnit); // Number of nodes along the y-axis of the visualization grid
    const deltavisX = lengthX / (visNodesX - 1);
    const deltavisY = lengthY / (visNodesY - 1);
    let visSolution = [];

    visNodeXCoordinates[0] = Math.min(...nodesXCoordinates);
    visNodeYCoordinates[0] = Math.min(...nodesYCoordinates);

    for (let visNodeIndexY = 1; visNodeIndexY < visNodesY; visNodeIndexY++) {
      visNodeXCoordinates[visNodeIndexY] = visNodeXCoordinates[0];
      visNodeYCoordinates[visNodeIndexY] = visNodeYCoordinates[0] + visNodeIndexY * deltavisY;
    }

    for (let visNodeIndexX = 1; visNodeIndexX < visNodesX; visNodeIndexX++) {
      const nnode = visNodeIndexX * visNodesY;
      visNodeXCoordinates[nnode] = visNodeXCoordinates[0] + visNodeIndexX * deltavisX;
      visNodeYCoordinates[nnode] = visNodeYCoordinates[0];

      for (let visNodeIndexY = 1; visNodeIndexY < visNodesY; visNodeIndexY++) {
        visNodeXCoordinates[nnode + visNodeIndexY] = visNodeXCoordinates[nnode];
        visNodeYCoordinates[nnode + visNodeIndexY] = visNodeYCoordinates[nnode] + visNodeIndexY * deltavisY;
      }
    }

    // Initialize visSolution with null for all visualization nodes
    visSolution = new Array(visNodesX * visNodesY).fill(null);

    // Get boundary segments for ray casting
    const boundarySegments = getBoundarySegments(meshData);

    // Perform adjacency-based search to find which element contains a given point (quick search)
    const { nodeNeighbors, neighborCount } = computeNodeNeighbors(meshData);
    let lastParentElement = 0;
    for (let visNodeIndex = 0; visNodeIndex < visNodesX * visNodesY; visNodeIndex++) {
      // Ray casting check
      if (
        !pointInsidePolygon(
          visNodeXCoordinates[visNodeIndex],
          visNodeYCoordinates[visNodeIndex],
          boundarySegments,
        )
      ) {
        continue;
      }
      let found = false;
      for (
        let localNodeIndex = 0;
        localNodeIndex < meshData.nop[lastParentElement].length;
        localNodeIndex++
      ) {
        let globalNodeIndex = meshData.nop[lastParentElement][localNodeIndex] - 1;
        for (
          let neighborElementsIndex = 0;
          neighborElementsIndex < neighborCount[globalNodeIndex];
          neighborElementsIndex++
        ) {
          let currentElement = nodeNeighbors[globalNodeIndex][neighborElementsIndex];
          const searchResult = pointSearch(
            model,
            meshData,
            result,
            currentElement,
            visNodeXCoordinates[visNodeIndex],
            visNodeYCoordinates[visNodeIndex],
            basisFunctions,
          );

          if (searchResult.inside) {
            lastParentElement = currentElement;
            visSolution[visNodeIndex] = searchResult.value;
            found = true;
            break;
          }
        }
        if (found) break;
      }

      // Scan all elements to find which element contains a given point (slow search)
      if (!found) {
        for (let currentElement = 0; currentElement < meshData.nop.length; currentElement++) {
          const searchResult = pointSearch(
            model,
            meshData,
            result,
            currentElement,
            visNodeXCoordinates[visNodeIndex],
            visNodeYCoordinates[visNodeIndex],
            basisFunctions,
          );

          if (searchResult.inside) {
            lastParentElement = currentElement;
            visSolution[visNodeIndex] = searchResult.value;
            found = true;
            break;
          }
        }
      }
    }

    // Create the plot
    let contourData = {
      x: visNodeXCoordinates,
      y: visNodeYCoordinates,
      z: visSolution,
      type: "contour",
      connectgaps: false,
      hoverongaps: false,
      line: {
        smoothing: 0.85,
      },
      contours: {
        coloring: "heatmap",
        showlabels: false,
      },
      //colorscale: 'Viridis',
      name: "Interpolated Solution Field",
    };

    drawContourPlot(
      plotDivId,
      contourData,
      `${plotType} plot (interpolated) - ${model.solverConfig}`,
      visNodeXCoordinates,
      visNodeYCoordinates,
      fieldName ?? "Solution",
    );
    console.timeEnd("plottingTime");
  } else {
    console.timeEnd("plottingTime");
    throw new FEAScriptError(
      "INVALID_INPUT",
      `plotInterpolatedSolution cannot draw a "${plotType}" plot of a ${meshDimension} mesh. Supported: "contour" for 2D meshes (use plotSolution for 1D).`,
    );
  }
}

/**
 * Function to search if a point is inside an element and interpolate the solution
 * @param {object} model - Object containing model properties
 * @param {object} meshData - Object containing mesh data
 * @param {object} result - Object containing solution vector and mesh information
 * @param {number} currentElement - Index of the element to check
 * @param {number} visNodeXCoordinate - X-coordinate of the point
 * @param {number} visNodeYCoordinate - Y-coordinate of the point
 * @param {object} basisFunctions - Instance of BasisFunctions class
 * @returns {object} Object containing inside boolean and interpolated value
 */
function pointSearch(
  model,
  meshData,
  result,
  currentElement,
  visNodeXCoordinate,
  visNodeYCoordinate,
  basisFunctions,
) {
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
  // All element nodes are passed, as the edges of quadratic elements may be curved
  const elementNodes = meshData.nop[currentElement].map((globalNodeNumber) => [
    nodesXCoordinates[globalNodeNumber - 1],
    nodesYCoordinates[globalNodeNumber - 1],
  ]);
  const pointCheck = locatePointInElement(
    visNodeXCoordinate,
    visNodeYCoordinate,
    elementNodes,
    meshData.elementShape,
    basisFunctions,
  );
  if (!pointCheck.inside) return { inside: false, value: null };
  return {
    inside: true,
    value: solutionInterpolation(
      model,
      meshData,
      result,
      currentElement,
      pointCheck.ksi,
      pointCheck.eta,
      basisFunctions,
    ),
  };
}

/**
 * Function to interpolate the solution at a specific point (ksi, eta) within an element
 * @param {object} model - Object containing model properties
 * @param {object} meshData - Object containing mesh data
 * @param {object} result - Object containing solution vector and mesh information
 * @param {number} elementIndex - Index of the element containing the point
 * @param {number} ksi - First natural coordinate (ksi)
 * @param {number} eta - Second natural coordinate (eta)
 * @param {object} basisFunctions - Instance of BasisFunctions class
 * @returns {number} Interpolated solution value
 */
function solutionInterpolation(model, meshData, result, elementIndex, ksi, eta, basisFunctions) {
  // Initialize FEA components
  const solutionVector = result.solutionVector;
  const nodesPerElement = meshData.nop[elementIndex].length;

  // Get basis functions for the current point
  const basisFunctionsAndDerivatives = basisFunctions.getBasisFunctions(ksi, eta);
  let basisFunction = basisFunctionsAndDerivatives.basisFunction;

  // Interpolate solution
  let solutionInterpolationValue = 0;
  for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
    solutionInterpolationValue +=
      solutionVector[meshData.nop[elementIndex][localNodeIndex] - 1] * basisFunction[localNodeIndex];
  }

  return solutionInterpolationValue;
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
