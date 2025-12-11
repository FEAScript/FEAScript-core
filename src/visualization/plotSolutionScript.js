/**
 * ════════════════════════════════════════════════════════════
 *  FEAScript Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.1.4 | https://feascript.com
 * ════════════════════════════════════════════════════════════
 */

// Internal imports
import {
  prepareMesh,
  splitQuadrilateral,
  pointInsideTriangle,
  computeNodeNeighbors,
} from "../mesh/meshUtilsScript.js";
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Function to create plots of the solution vector
 * @param {object} result - Object containing solution vector and mesh information
 * @param {object} model - Object containing model properties
 * @param {string} plotType - The type of plot
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 */
export function plotSolution(result, model, plotType, plotDivId) {
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
export function plotInterpolatedSolution(result, model, plotType, plotDivId) {
  if (meshDimension === "1D" && plotType === "line") {
    // 1D plot region
  } else if (meshDimension === "2D" && plotType === "contour") {
    const visNodeXCoordinates = [];
    const visNodeYCoordinates = [];
    let visSolution = [];
    const visNodesX = 1e3; // number of nodes along the x-axis of the visualization grid
    const visNodesY = 1e3; // number of nodes along the y-axis of the visualization grid

    const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
    const deltavisX = (Math.max(...nodesXCoordinates) - Math.min(...nodesXCoordinates)) / visNodesX;
    const deltavisY = (Math.max(...nodesYCoordinates) - Math.min(...nodesYCoordinates)) / visNodesY;

    visNodeXCoordinates[0] = minX;
    visNodeYCoordinates[0] = minY;

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

    // Perform adjacency-based search to find which element (triangular) contains a given point
    const { nodeNeighbors, neighborCount } = computeNodeNeighbors(meshData);
    lastParentElement = 0;
    for (let visNodeIndex = 0; visNodeIndex < visNodesX * visNodesY; visNodeIndex++) {
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
          currentElement = nodeNeighbors[globalNodeIndex][neighborElementsIndex];
        }
      }
    }
  }
}
