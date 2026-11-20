/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.1 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { getModelMeshDimension } from "../mesh/meshUtils.js";
import { selectSolutionField } from "./solutionFields.js";
import { createSolutionLocator } from "./solutionEvaluation.js";
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
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
  const meshDimension = getModelMeshDimension(model);

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

    // Locate each visualization node in the mesh and interpolate the solution there (null outside the domain)
    const locateSolution = createSolutionLocator(model, result.nodesCoordinates, values);
    visSolution = visNodeXCoordinates.map((visNodeX, visNodeIndex) =>
      locateSolution(visNodeX, visNodeYCoordinates[visNodeIndex]),
    );

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
