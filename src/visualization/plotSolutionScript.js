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
 * Function to create plots of the solution vector
 * @param {*} solutionVector - The computed solution vector
 * @param {*} nodesCoordinates - Object containing x and y coordinates for the nodes
 * @param {string} solverConfig - Parameter specifying the type of solver
 * @param {string} meshDimension - The dimension of the solution
 * @param {string} plotType - The type of plot
 * @param {string} [meshType="structured"] - Type of mesh: "structured" or "unstructured"
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 */
export function plotSolution(
  solutionVector,
  nodesCoordinates,
  solverConfig,
  meshDimension,
  plotType,
  meshType = "structured",
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
      x: xData,
      y: yData,
      mode: "lines",
      type: "scatter",
      line: { color: "rgb(219, 64, 82)", width: 2 },
      name: "Solution",
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
      margin: { l: 70, r: 40, t: 50, b: 50 },
    };

    Plotly.newPlot(plotDivId, [lineData], layout, { responsive: true });
  } else if (meshDimension === "2D" && plotType === "contour") {
    // Use the user-provided mesh type
    const isStructured = meshType === "structured";

    // For auto-detection (if needed)
    const uniqueXCoords = new Set(nodesXCoordinates).size;
    const uniqueYCoords = new Set(nodesYCoordinates).size;

    // Extract scalar values from solution vector
    let zValues;
    if (Array.isArray(solutionVector[0])) {
      zValues = solutionVector.map((val) => val[0]);
    } else {
      zValues = solutionVector;
    }

    // Common sizing parameters for both plot types
    let maxWindowWidth = Math.min(window.innerWidth, 700);
    let maxX = Math.max(...nodesXCoordinates);
    let maxY = Math.max(...nodesYCoordinates);
    let aspectRatio = maxY / maxX;
    let plotWidth = Math.min(maxWindowWidth, 600);
    let plotHeight = plotWidth * aspectRatio * 0.8; // Slightly reduce height for better appearance

    // Common layout properties
    let layout = {
      title: `${plotType} plot - ${solverConfig}`,
      width: plotWidth,
      height: plotHeight,
      xaxis: { title: "x" },
      yaxis: { title: "y" },
      margin: { l: 50, r: 50, t: 50, b: 50 },
      hovermode: "closest",
    };

    if (isStructured) {
      // Calculate the number of nodes along the x-axis and y-axis
      const numNodesX = uniqueXCoords;
      const numNodesY = uniqueYCoords;

      // Reshape the nodesXCoordinates and nodesYCoordinates arrays to match the grid dimensions
      let reshapedXCoordinates = math.reshape(Array.from(nodesXCoordinates), [numNodesX, numNodesY]);
      let reshapedYCoordinates = math.reshape(Array.from(nodesYCoordinates), [numNodesX, numNodesY]);

      // Reshape the solution array to match the grid dimensions
      let reshapedSolution = math.reshape(Array.from(solutionVector), [numNodesX, numNodesY]);

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
          showlabels: false,
        },
        //colorscale: 'Viridis',
        colorbar: {
          title: "Solution",
        },
        x: reshapedXForPlot,
        y: reshapedYCoordinates[0],
        name: "Solution Field",
      };

      // Create the plot using Plotly
      Plotly.newPlot(plotDivId, [contourData], layout, { responsive: true });
    } else {
      // Create an interpolated contour plot for the unstructured mesh
      let contourData = {
        x: nodesXCoordinates,
        y: nodesYCoordinates,
        z: zValues,
        type: "contour",
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

      // Create the plot using only the contour fill
      Plotly.newPlot(plotDivId, [contourData], layout, { responsive: true });
    }
  }
}
