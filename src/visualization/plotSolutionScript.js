/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import {
  prepareMesh,
  pointInsideTriangle,
  pointInsideQuadrilateral,
  computeNodeNeighbors,
  getBoundarySegments,
} from "../mesh/meshUtilsScript.js";
import { BasisFunctions } from "../mesh/basisFunctionsScript.js";
import { initializeFEA } from "../mesh/meshUtilsScript.js";
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Function to create plots of the solution vector
 * @param {object} result - Object containing solution vector and mesh information
 * @param {object} model - Object containing model properties
 * @param {string} plotType - The type of plot
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 */
export function plotSolution(model, result, plotType, plotDivId) {
  console.time("plottingTime");
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
  const solutionVector = result.solutionVector;
  const solverConfig = model.solverConfig;
  const meshDimension = model.meshConfig.meshDimension;
  const meshData = prepareMesh(model.meshConfig); // Retrieve mesh connectivity details (used in splitQuadrilateral)

  if (meshDimension === "1D" && plotType === "line") {
    // Check if solutionVector is a nested array
    let yData;
    if (solutionVector.length > 0 && Array.isArray(solutionVector[0])) {
      yData = solutionVector.map((arr) => arr[0]);
    } else {
      yData = solutionVector;
    }
    let xData = Array.from(nodesXCoordinates);

    let lineData = {
      x: nodesXCoordinates,
      y: yData,
      mode: "lines",
      type: "scatter",
      line: { color: "rgb(219, 64, 82)", width: 2 },
      name: "Solution",
    };

    let maxWindowWidth = Math.min(window.innerWidth, 700);
    let plotWidth = Math.min(maxWindowWidth, 600);
    let plotHeight = 300;

    let layout = {
      title: `line plot - ${solverConfig}`,
      width: plotWidth,
      height: plotHeight,
      xaxis: { title: "x" },
      yaxis: { title: "Solution" },
      margin: { l: 50, r: 50, t: 50, b: 50 },
    };

    Plotly.newPlot(plotDivId, [lineData], layout, { responsive: true });
    console.timeEnd("plottingTime");
  } else if (meshDimension === "2D" && plotType === "contour") {
    // Check if solutionVector is a nested array
    let zData;
    if (Array.isArray(solutionVector[0])) {
      zData = solutionVector.map((val) => val[0]);
    } else {
      zData = solutionVector;
    }

    // Plot sizing parameters
    let maxWindowWidth = Math.min(window.innerWidth, 700);
    let minX = Math.min(...nodesXCoordinates);
    let maxX = Math.max(...nodesXCoordinates);
    let minY = Math.min(...nodesYCoordinates);
    let maxY = Math.max(...nodesYCoordinates);
    let lengthX = maxX - minX;
    let lengthY = maxY - minY;
    let aspectRatio = lengthY / lengthX;
    let plotWidth = Math.min(maxWindowWidth, 600);
    let plotHeight = plotWidth * aspectRatio;

    // Layout properties
    let layout = {
      title: `${plotType} plot - ${solverConfig}`,
      width: plotWidth,
      height: plotHeight,
      xaxis: { title: "x" },
      yaxis: {
        title: "y",
        scaleanchor: "x",
        scaleratio: 1,
      },
      margin: { l: 50, r: 50, t: 50, b: 50 },
      hovermode: "closest",
    };

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
      colorbar: {
        title: "Solution",
      },
      name: "Solution Field",
    };

    Plotly.newPlot(plotDivId, [contourData], layout, { responsive: true });
    console.timeEnd("plottingTime");
  }
}

/**
 * Function to generate a dense visualization grid and interpolate the FEM solution on it
 * @param {object} result - Object containing solution vector and mesh information
 * @param {object} model - Object containing model properties
 * @param {string} plotType - The type of plot
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 */
export function plotInterpolatedSolution(model, result, plotType, plotDivId) {
  console.time("plottingTime");
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates; // TODO: Check if we should place it inside the 2D block
  const meshDimension = model.meshConfig.meshDimension;
  const meshData = prepareMesh(model.meshConfig); // Retrieve mesh connectivity details

  // Initialize BasisFunctions once here to avoid creating it inside the loop
  const basisFunctions = new BasisFunctions({
    meshDimension: model.meshConfig.meshDimension,
    elementOrder: model.meshConfig.elementOrder,
  });

  if (meshDimension === "1D" && plotType === "line") {
    // 1D plot region
  } else if (meshDimension === "2D" && plotType === "contour") {
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

    const visNodeCoordinates = { visNodeXCoordinates, visNodeYCoordinates };

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
          boundarySegments
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
            basisFunctions
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
            basisFunctions
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

    // Plot sizing parameters
    let maxWindowWidth = Math.min(window.innerWidth, 700);
    let aspectRatio = lengthY / lengthX;
    let plotWidth = Math.min(maxWindowWidth, 600);
    let plotHeight = plotWidth * aspectRatio;

    // Layout properties
    let layout = {
      title: `${plotType} plot (interpolated) - ${model.solverConfig}`,
      width: plotWidth,
      height: plotHeight,
      xaxis: { title: "x" },
      yaxis: {
        title: "y",
        scaleanchor: "x",
        scaleratio: 1,
      },
      margin: { l: 50, r: 50, t: 50, b: 50 },
      hovermode: "closest",
    };

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
      colorbar: {
        title: "Solution",
      },
      name: "Interpolated Solution Field",
    };

    Plotly.newPlot(plotDivId, [contourData], layout, { responsive: true });
    console.timeEnd("plottingTime");
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
  basisFunctions
) {
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
  const nodesPerElement = meshData.nop[currentElement].length;

  if (nodesPerElement === 4) {
    // Linear quadrilateral element
    let vertices = [
      [
        nodesXCoordinates[meshData.nop[currentElement][0] - 1],
        nodesYCoordinates[meshData.nop[currentElement][0] - 1],
      ],
      [
        nodesXCoordinates[meshData.nop[currentElement][1] - 1],
        nodesYCoordinates[meshData.nop[currentElement][1] - 1],
      ],
      [
        nodesXCoordinates[meshData.nop[currentElement][2] - 1],
        nodesYCoordinates[meshData.nop[currentElement][2] - 1],
      ],
      [
        nodesXCoordinates[meshData.nop[currentElement][3] - 1],
        nodesYCoordinates[meshData.nop[currentElement][3] - 1],
      ],
    ];
    const pointCheck = pointInsideQuadrilateral(visNodeXCoordinate, visNodeYCoordinate, vertices);
    if (pointCheck.inside) {
      return {
        inside: true,
        value: solutionInterpolation(
          model,
          meshData,
          result,
          currentElement,
          pointCheck.ksi,
          pointCheck.eta,
          basisFunctions
        ),
      };
    }
  } else if (nodesPerElement === 9) {
    // Quadratic quadrilateral element
    let vertices = [
      [
        nodesXCoordinates[meshData.nop[currentElement][0] - 1],
        nodesYCoordinates[meshData.nop[currentElement][0] - 1],
      ],
      [
        nodesXCoordinates[meshData.nop[currentElement][2] - 1],
        nodesYCoordinates[meshData.nop[currentElement][2] - 1],
      ],
      [
        nodesXCoordinates[meshData.nop[currentElement][6] - 1],
        nodesYCoordinates[meshData.nop[currentElement][6] - 1],
      ],
      [
        nodesXCoordinates[meshData.nop[currentElement][8] - 1],
        nodesYCoordinates[meshData.nop[currentElement][8] - 1],
      ],
    ];
    const pointCheck = pointInsideQuadrilateral(visNodeXCoordinate, visNodeYCoordinate, vertices);
    if (pointCheck.inside) {
      return {
        inside: true,
        value: solutionInterpolation(
          model,
          meshData,
          result,
          currentElement,
          pointCheck.ksi,
          pointCheck.eta,
          basisFunctions
        ),
      };
    }
  } // TODO: Add also triangular element cases
  return { inside: false, value: null };
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

  // Check if solutionVector is a nested array
  let zData;
  if (Array.isArray(solutionVector[0])) {
    zData = solutionVector.map((val) => val[0]);
  } else {
    zData = solutionVector;
  }

  // Interpolate solution
  let solutionInterpolationValue = 0;
  for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
    solutionInterpolationValue +=
      zData[meshData.nop[elementIndex][localNodeIndex] - 1] * basisFunction[localNodeIndex];
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
  let inside = false;
  for (let i = 0; i < segments.length; i++) {
    const [[x1, y1], [x2, y2]] = segments[i];
    const intersect = y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1;
    if (intersect) inside = !inside;
  }
  return inside;
}
