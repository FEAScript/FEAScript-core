/**
 * ════════════════════════════════════════════════════════════
 *  FEAScript Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.1.4 | https://feascript.com
 * ════════════════════════════════════════════════════════════
 */

/**
 * Function to create plots of the solution vector
 * @param {*} solutionVector - The computed solution vector
 * @param {*} nodesCoordinates - Object containing x and y coordinates for the nodes
 * @param {string} solverConfig - Parameter specifying the type of solver
 * @param {string} meshDimension - The dimension of the solution
 * @param {string} plotType - The type of plot
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 */
export function plotSolution(
  solutionVector,
  nodesCoordinates,
  solverConfig,
  meshDimension,
  plotType,
  plotDivId
) {
  const { nodesXCoordinates, nodesYCoordinates } = nodesCoordinates;

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
    let plotHeight = 350;

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
