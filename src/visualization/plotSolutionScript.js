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
 * @param {string} [meshType="structured"] - Type of mesh: "structured" or "unstructured"
 */
export function plotSolution(
  solutionVector,
  nodesCoordinates,
  solverConfig,
  meshDimension,
  plotType,
  plotDivId,
  meshType = "structured",
  showMesh = false
) {
  const { nodesXCoordinates, nodesYCoordinates } = nodesCoordinates;
  const nop = nodesCoordinates.nop;
  const totalElements = nop.length;

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

    // Determine unique x and y coordinates
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
      xaxis: {
        title: "x",
        range: [Math.min(...nodesXCoordinates), Math.max(...nodesXCoordinates)]
      },
      yaxis: {
        title: "y",
        range: [Math.min(...nodesYCoordinates), Math.max(...nodesYCoordinates)]
      },
      margin: { l: 50, r: 50, t: 50, b: 50 },
      hovermode: "closest",
    };

    if (meshType === "structured") {
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
        let xData = nodesXCoordinates[i];
        reshapedXForPlot.push(xData);
      }

      // Create the data structure for the contour plot
      let contourData = [];
      contourData.push({
        z: transposedSolution,
        type: "contour",
        contours: {
          coloring: "heatmap",
          showlabels: false,
          // showlines: false,
        },
        //colorscale: 'Viridis',
        colorbar: {
          title: "Solution",
        },
        x: reshapedXForPlot,
        y: reshapedYCoordinates[0],
        name: "Solution Field",
      });

      // Create the plot using Plotly
      Plotly.newPlot(plotDivId, contourData, layout, { responsive: true });
    } else if (meshType === "unstructured") {
      // Create an interpolated contour plot for the unstructured mesh
      let contourData = [];
      contourData.push({
        x: nodesXCoordinates,
        y: nodesYCoordinates,
        z: zValues,
        type: "contour",
        contours: {
          coloring: "heatmap",
          showlabels: false,
          // showlines: false,
        },
        //colorscale: 'Viridis',
        colorbar: {
          title: "Solution",
        },
        name: "Solution Field",
      });

      let contourDataUnstructured = [];
      // Helper function to interpolate color based on solution value (Viridis colormap)
      function solutionToColor(value, minVal, maxVal) {
        const t = Math.max(0, Math.min(1, (value - minVal) / (maxVal - minVal)));

        // Colormap approximation
        const heatmapColors = [
          [0, 40, 120],
          [60, 100, 200],
          [150, 170, 210],
          [200, 185, 150],
          [215, 140, 95],
          [175, 20, 30]
        ];

        const scaledT = t * (heatmapColors.length - 1);
        const idx = Math.floor(scaledT);
        const localT = scaledT - idx;

        const idx1 = Math.min(idx, heatmapColors.length - 1);
        const idx2 = Math.min(idx + 1, heatmapColors.length - 1);

        const r = Math.round(heatmapColors[idx1][0] + (heatmapColors[idx2][0] - heatmapColors[idx1][0]) * localT);
        const g = Math.round(heatmapColors[idx1][1] + (heatmapColors[idx2][1] - heatmapColors[idx1][1]) * localT);
        const b = Math.round(heatmapColors[idx1][2] + (heatmapColors[idx2][2] - heatmapColors[idx1][2]) * localT);

        return `rgb(${r}, ${g}, ${b})`;
      }

      const minSolution = Math.min(...zValues);
      const maxSolution = Math.max(...zValues);

      // Convert all elements to triangles for visualization
      let triangles = [];

      for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
        const elementNodes = nop[elementIndex];

        // Check element type by number of nodes and split into 2 triangles
        if (elementNodes.length === 9) { // TODO: Add also other element types
          // Quadrilateral (quadratic: 9 nodes)
          triangles.push([elementNodes[0], elementNodes[2], elementNodes[8]]);
          triangles.push([elementNodes[0], elementNodes[6], elementNodes[8]]);
        }
      }

      // Plot each triangle
      triangles.forEach(tri => {

        // Extract coordinates for this triangle's nodes and close the polygon
        const xData = tri.map(nodeIndex => nodesXCoordinates[nodeIndex - 1]).concat(nodesXCoordinates[tri[0] - 1]);
        const yData = tri.map(nodeIndex => nodesYCoordinates[nodeIndex - 1]).concat(nodesYCoordinates[tri[0] - 1]);

        // Calculate average solution value for this triangle
        const avgSolution = (zValues[tri[0] - 1] + zValues[tri[1] - 1] + zValues[tri[2] - 1]) / 3;
        const fillColor = solutionToColor(avgSolution, minSolution, maxSolution);

        contourDataUnstructured.push({
          type: "scatter",
          mode: "lines",
          x: xData,
          y: yData,
          fill: "toself",
          fillcolor: fillColor,
          line: { width: 0 },
          hoverinfo: "skip",
          showlegend: false
        });
      });

      // Add mesh edges
      if (showMesh) {
        for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
          const elem = nop[elementIndex];

          // Extract corner nodes only (for quadratic elements, use nodes 0, 2, 8, 6)
          let cornerNodes;
          if (elem.length === 9) {
            cornerNodes = [elem[0], elem[2], elem[8], elem[6]];
          } else {
            cornerNodes = elem; // TODO: Add also other element types
          }

          contourDataUnstructured.push({
            type: "scatter",
            mode: "lines",
            x: cornerNodes.map(i => nodesXCoordinates[i - 1]).concat(nodesXCoordinates[cornerNodes[0] - 1]),
            y: cornerNodes.map(i => nodesYCoordinates[i - 1]).concat(nodesYCoordinates[cornerNodes[0] - 1]),
            line: { color: "black", width: 1.5 },
            hoverinfo: "none",
            showlegend: false
          });
        }
      }

      // Add invisible trace for colorbar
      contourDataUnstructured.push({
        x: [Math.min(...nodesXCoordinates), Math.max(...nodesXCoordinates)],
        y: [Math.min(...nodesYCoordinates), Math.max(...nodesYCoordinates)],
        z: [[minSolution, maxSolution]],
        type: "heatmap",
        showscale: true,
        colorbar: {
          title: "Solution",
        },
        hoverinfo: "none",
        showlegend: false,
        opacity: 0,  // Make it invisible
        colorscale: [
          [0.0, 'rgb(0,40,120)'],
          [0.2, 'rgb(60,100,200)'],
          [0.4, 'rgb(150,170,210)'],
          [0.6, 'rgb(200,185,150)'],
          [0.8, 'rgb(215,140,95)'],
          [1.0, 'rgb(175,20,30)']
        ]
      });

      // Create the plot using filled triangles
      Plotly.newPlot(plotDivId, contourDataUnstructured, layout, { responsive: true });
    }
  }
}
