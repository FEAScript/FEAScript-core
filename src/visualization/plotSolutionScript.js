/**
 * ════════════════════════════════════════════════════════════
 *  FEAScript Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.1.4 | https://feascript.com
 * ════════════════════════════════════════════════════════════
 */

import { prepareMesh } from "../mesh/meshUtilsScript.js";

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
 * Function to split the quadrilateral elements into two triangles
 * @param {object} meshData - Object containing mesh connectivity (nop)
 * @param {number} elementIndex - Index of the element to process
 * @returns {array} Array of element connectivity for the two triangles
 */
export function splitQuadrilateral(meshData) {
  const elementConnectivity = meshData.nop[elementIndex];
  // Check if the element is linear quadrilateral
  if (elementConnectivity.length === 4) {
    const splitElementConnectivity = elementConnectivity;
    return [
      [splitElementConnectivity[0], splitElementConnectivity[1], splitElementConnectivity[3]],
      [splitElementConnectivity[0], splitElementConnectivity[2], splitElementConnectivity[3]],
    ];
    // Check if the element is quadratic quadrilateral
  } else if (elementConnectivity.length === 9) {
    const splitElementConnectivity = elementConnectivity;
    return [
      [splitElementConnectivity[0], splitElementConnectivity[2], splitElementConnectivity[8]],
      [splitElementConnectivity[0], splitElementConnectivity[6], splitElementConnectivity[8]],
    ];
  }
}

/**
 * Function to create a dense visualization grid
 * @param {object} result - Object containing solution vector and mesh information
 * @param {object} model - Object containing model properties
 * @returns {object} An object containing visualization grid coordinates
 * @returns {array} Solution on the visualization grid
 */
export function visGrid(result, model) {
  const visNodeXCoordinates = [];
  const visNodeYCoordinates = [];
  let visSolution = [];
  const visNodesX = 1e3; // number of nodes along the x-axis of the visualization grid
  const visNodesY = 1e3; // number of nodes along the y-axis of the visualization grid

  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
  const deltavisX = (Math.max(...nodesXCoordinates) - Math.min(...nodesXCoordinates)) / visNodesX;
  const deltavisY = (Math.max(...nodesYCoordinates) - Math.min(...nodesYCoordinates)) / visNodesY;

  if (meshDimension === "2D") {
    visNodeXCoordinates[0] = minX;
    visNodeYCoordinates[0] = minY;

    for (let nodeIndexY = 1; nodeIndexY < visNodesY; nodeIndexY++) {
      visNodeXCoordinates[nodeIndexY] = visNodeXCoordinates[0];
      visNodeYCoordinates[nodeIndexY] = visNodeYCoordinates[0] + nodeIndexY * deltavisY;
    }

    for (let nodeIndexX = 1; nodeIndexX < visNodesX; nodeIndexX++) {
      const nnode = nodeIndexX * visNodesY;
      visNodeXCoordinates[nnode] = visNodeXCoordinates[0] + nodeIndexX * deltavisX;
      visNodeYCoordinates[nnode] = visNodeYCoordinates[0];

      for (let nodeIndexY = 1; nodeIndexY < visNodesY; nodeIndexY++) {
        visNodeXCoordinates[nnode + nodeIndexY] = visNodeXCoordinates[nnode];
        visNodeYCoordinates[nnode + nodeIndexY] = visNodeYCoordinates[nnode] + nodeIndexY * deltavisY;
      }
    }
  }

  const visNodeCoordinates = { visNodeXCoordinates, visNodeYCoordinates };

  // Initialize visSolution with null for all visualization nodes
  visSolution = new Array(visNodesX * visNodesY).fill(null);

  return { visNodeCoordinates, visSolution };
}
