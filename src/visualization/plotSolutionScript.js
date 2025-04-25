//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

/**
 * Create plots of the solution vector
 * @param {*} solutionVector - The computed solution vector
 * @param {*} nodesCoordinates - Object containing x and y coordinates for the nodes
 * @param {string} solverConfig - Parameter specifying the type of solver
 * @param {string} meshDimension - The dimension of the solution
 * @param {string} plotType - The type of plot
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 * @param {boolean} showMesh - Flag to indicate if the mesh would be rendered
 */
export function plotSolution(
  solutionVector,
  nodesCoordinates,
  solverConfig,
  meshDimension,
  plotType,
  plotDivId,
  showMesh = false // Currently only for rectangular domains
) {
  const { nodesXCoordinates, nodesYCoordinates } = nodesCoordinates;

  if (meshDimension === "1D" && plotType === "line") {
    // Flatten solutionVector
    let yData = solutionVector.map(arr => arr[0]);
    let xData = Array.from(nodesXCoordinates);

    let lineData = {
      x: xData,
      y: yData,
      mode: "lines",
      type: "scatter",
      line: { color: "rgb(219, 64, 82)", width: 2 },
      name: "Solution"
    };

    let maxWindowWidth = Math.min(window.innerWidth, 700);
    let maxPlotWidth = Math.max(...xData);
    let zoomFactor = maxWindowWidth / maxPlotWidth;
    let plotWidth = Math.max(zoomFactor * maxPlotWidth, 400);
    let plotHeight = 350;

    let layout = {
      title: `line plot - ${solverConfig}`,
      width: plotWidth,
      height: plotHeight,
      xaxis: { title: "x" },
      yaxis: { title: "Solution" },
      margin: { l: 70, r: 40, t: 50, b: 50 }
    };

    Plotly.newPlot(plotDivId, [lineData], layout, { responsive: true });
  } else if (meshDimension === "2D" && plotType === "contour") {
    // Calculate the number of nodes along the x-axis and y-axis
    const numNodesX = new Set(nodesXCoordinates).size;
    const numNodesY = new Set(nodesYCoordinates).size;

    // Reshape the nodesXCoordinates and nodesYCoordinates arrays to match the grid dimensions
    let reshapedXCoordinates = math.reshape(Array.from(nodesXCoordinates), [
      numNodesX,
      numNodesY,
    ]);
    let reshapedYCoordinates = math.reshape(Array.from(nodesYCoordinates), [
      numNodesX,
      numNodesY,
    ]);

    // Reshape the solution array to match the grid dimensions
    let reshapedSolution = math.reshape(Array.from(solutionVector), [
      numNodesX,
      numNodesY,
    ]);

    // Transpose the reshapedSolution array to get column-wise data
    let transposedSolution = math.transpose(reshapedSolution);

    // Create an array for x-coordinates used in the contour plot
    let reshapedXForPlot = [];
    for (let i = 0; i < numNodesX * numNodesY; i += numNodesY) {
      let xValue = nodesXCoordinates[i];
      reshapedXForPlot.push(xValue);
    }

    // Create the data structure for the contour plot
    let contourData = {
      z: transposedSolution,
      type: "contour",
      contours: {
        coloring: "heatmap",
      },
      x: reshapedXForPlot,
      y: reshapedYCoordinates[0],
    };

    // Create mesh lines for the computational grid if showMesh is true
    let meshData = [];
    if (showMesh) {
      let meshLinesX = [];
      let meshLinesY = [];

      // Horizontal mesh lines
      for (let i = 0; i < numNodesY; i++) {
        meshLinesX.push(...reshapedXCoordinates.map((row) => row[i]), null);
        meshLinesY.push(...reshapedYCoordinates.map((row) => row[i]), null);
      }

      // Vertical mesh lines
      for (let i = 0; i < numNodesX; i++) {
        meshLinesX.push(...reshapedXCoordinates[i], null);
        meshLinesY.push(...reshapedYCoordinates[i], null);
      }

      // Create the data structure for the mesh lines
      meshData = {
        x: meshLinesX,
        y: meshLinesY,
        mode: "lines",
        type: "scatter",
        line: {
          color: "palegoldenrod",
          width: 1,
        },
        showlegend: false,
      };
    }

    // Set a fixed maximum window size for the plot
    let maxWindowWidth = Math.min(window.innerWidth, 700);
    let maxPlotWidth = Math.max(...reshapedXForPlot);
    let maxPlotHeight = Math.max(...reshapedYCoordinates[0]);
    let zoomFactor = maxWindowWidth / maxPlotWidth;
    let plotWidth = zoomFactor * maxPlotWidth;
    let plotHeight = zoomFactor * maxPlotHeight;

    // Set the layout for the contour plot
    let layout = {
      title: `${plotType} plot${
        showMesh ? " with mesh" : ""
      } - ${solverConfig}`,
      width: plotWidth,
      height: plotHeight,
      xaxis: { title: "x" },
      yaxis: { title: "y" },
    };

    // Create the plot using Plotly
    let plotData = [contourData];
    if (showMesh) {
      plotData.push(meshData);
    }
    Plotly.newPlot(plotDivId, plotData, layout, { responsive: true });
  }
}
