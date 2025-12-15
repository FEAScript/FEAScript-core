/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 (RC) | https://feascript.com
 *  MIT License © 2023–2025 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import {
  prepareMesh,
  pointInsideTriangle,
  pointInsideQuadrilateral,
  computeNodeNeighbors,
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
  } else if (meshDimension === "2D" && plotType === "contour") {
    // Check if solutionVector is a nested array
    let zData;
    if (Array.isArray(solutionVector[0])) {
      zData = solutionVector.map((val) => val[0]);
    } else {
      zData = solutionVector;
    }

    // Sizing parameters
    let maxWindowWidth = Math.min(window.innerWidth, 700);
    let maxX = Math.max(...nodesXCoordinates);
    let maxY = Math.max(...nodesYCoordinates);
    let aspectRatio = maxY / maxX;
    let plotWidth = Math.min(maxWindowWidth, 600);
    let plotHeight = plotWidth * aspectRatio;

    // Layout properties
    let layout = {
      title: `${plotType} plot - ${solverConfig}`,
      width: plotWidth,
      height: plotHeight,
      xaxis: { title: "x" },
      yaxis: { title: "y" },
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
  }
}

/**
 * Function to create a dense visualization grid
 * @param {object} result - Object containing solution vector and mesh information
 * @param {object} model - Object containing model properties
 * @param {string} plotType - The type of plot
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 */
export function plotInterpolatedSolution(model, result, plotType, plotDivId) {
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates; // Check if we should place it inside 2D block
  const meshDimension = model.meshConfig.meshDimension;
  if (meshDimension === "1D" && plotType === "line") {
    // 1D plot region
  } else if (meshDimension === "2D" && plotType === "contour") {
    const visNodeXCoordinates = [];
    const visNodeYCoordinates = [];
    let visSolution = [];
    const visNodesX = 1e2; // number of nodes along the x-axis of the visualization grid
    const visNodesY = 1e2; // number of nodes along the y-axis of the visualization grid

    const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
    const deltavisX = (Math.max(...nodesXCoordinates) - Math.min(...nodesXCoordinates)) / visNodesX;
    const deltavisY = (Math.max(...nodesYCoordinates) - Math.min(...nodesYCoordinates)) / visNodesY;

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

    // Perform adjacency-based search to find which element contains a given point (quick search)
    const { nodeNeighbors, neighborCount } = computeNodeNeighbors(meshData);
    lastParentElement = 0;
    for (let visNodeIndex = 0; visNodeIndex < visNodesX * visNodesY; visNodeIndex++) {
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
            visNodeYCoordinates[visNodeIndex]
          );

          if (searchResult.inside) {
            lastParentElement = currentElement;
            visSolution[visNodeIndex] = searchResult.value;
            found = true;
            break;
          } // TODO: Add also triangular element cases
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
            visNodeYCoordinates[visNodeIndex]
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
    // TODO: build Plotly contour from visNodeXCoordinates/visNodeYCoordinates/visSolution
  }
}

/**
 * Function to search if a point is inside an element and interpolate the solution
 * @param {object} model - Object containing model properties
 * @param {object} meshData - Object containing mesh data
 * @param {object} result - Object containing solution vector and mesh information
 * @param {number} currentElement - Index of the element to check
 * @param {number} visNodeX - X coordinate of the point
 * @param {number} visNodeY - Y coordinate of the point
 * @returns {object} Object containing inside boolean and interpolated value
 */
function pointSearch(model, meshData, result, currentElement, visNodeX, visNodeY) {
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
  const nodesPerElement = meshData.nop[currentElement].length;

  if (nodesPerElement === 4) {
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
    const pointCheck = pointInsideQuadrilateral(visNodeX, visNodeY, vertices);
    if (pointCheck.inside) {
      return {
        inside: true,
        value: solutionInterpolation(model, meshData, result, currentElement, pointCheck.ksi, pointCheck.eta),
      };
    }
  } else if (nodesPerElement === 9) {
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
    const pointCheck = pointInsideQuadrilateral(visNodeX, visNodeY, vertices);
    if (pointCheck.inside) {
      return {
        inside: true,
        value: solutionInterpolation(model, meshData, result, currentElement, pointCheck.ksi, pointCheck.eta),
      };
    }
  }
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
 * @returns {number} Interpolated solution value
 */
function solutionInterpolation(model, meshData, result, elementIndex, ksi, eta) {
  // Initialize FEA components
  const basisFunctions = new BasisFunctions({
    meshDimension: meshData.meshDimension,
    elementOrder: meshData.elementOrder,
  });
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
