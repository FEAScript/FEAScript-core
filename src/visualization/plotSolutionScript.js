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
    // Extract scalar values from solution vector
    let zValues;
    if (Array.isArray(solutionVector[0])) {
      zValues = solutionVector.map((val) => val[0]);
    } else {
      zValues = solutionVector;
    }

    // Common sizing parameters
    let maxWindowWidth = Math.min(window.innerWidth, 700);
    const minX = Math.min(...nodesXCoordinates);
    const maxX = Math.max(...nodesXCoordinates);
    const minY = Math.min(...nodesYCoordinates);
    const maxY = Math.max(...nodesYCoordinates);
    const spanX = Math.max(maxX - minX, 1e-6);
    const spanY = Math.max(maxY - minY, 1e-6);
    const padX = Math.max(spanX * 0.03, 1e-3);
    const padY = Math.max(spanY * 0.03, 1e-3);
    const paddedXRange = [minX - padX, maxX + padX];
    const paddedYRange = [minY - padY, maxY + padY];
    let aspectRatio = maxY / maxX;
    let plotWidth = Math.min(maxWindowWidth, 600);
    let plotHeight = plotWidth * aspectRatio * 0.8; // Slightly reduce height for better appearance

    // Layout properties
    let layout = {
      title: `${plotType} plot - ${solverConfig}`,
      width: plotWidth,
      height: plotHeight,
      xaxis: {
        title: "x",
        range: paddedXRange,
        ticks: "outside",
        ticklen: 6,
        showline: true,
        linecolor: "#444",
        automargin: true
      },
      yaxis: {
        title: "y",
        range: paddedYRange,
        ticks: "outside",
        ticklen: 6,
        showline: true,
        linecolor: "#444",
        automargin: true
      },
      margin: { l: 50, r: 50, t: 50, b: 50 },
      hovermode: "closest",
    };

    let contourDataUnstructured = [];

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

    // Prepare mesh3d data for interpolated colors
    const i = []; // First vertex index for each triangle
    const j = []; // Second vertex index for each triangle
    const k = []; // Third vertex index for each triangle

    triangles.forEach(tri => {
      // mesh3d uses 0-based indexing
      i.push(tri[0] - 1);
      j.push(tri[1] - 1);
      k.push(tri[2] - 1);
    });

    // Add mesh3d trace with vertex-based color interpolation
    contourDataUnstructured.push({
      type: "mesh3d",
      x: Array.from(nodesXCoordinates),
      y: Array.from(nodesYCoordinates),
      z: new Array(nodesXCoordinates.length).fill(0), // 2D mesh, so z=0
      i: i,
      j: j,
      k: k,
      intensity: zValues, // Color based on solution values at vertices
      intensitymode: "vertex",
      colorscale: [
        [0.0, 'rgb(0,40,120)'],
        [0.2, 'rgb(60,100,200)'],
        [0.4, 'rgb(150,170,210)'],
        [0.6, 'rgb(200,185,150)'],
        [0.8, 'rgb(215,140,95)'],
        [1.0, 'rgb(175,20,30)']
      ],
      colorbar: {
        title: "Solution",
        x: 1.0,
        y: 0.5
      },
      flatshading: false, // Enable smooth shading for interpolation
      lighting: {
        ambient: 1.0,
        diffuse: 0.0,
        specular: 0.0,
        roughness: 1.0,
        fresnel: 0.0
      },
      lightposition: { x: 0, y: 0, z: 1 },
      showscale: true,
      hovertemplate: 'x: %{x:.3f}<br>y: %{y:.3f}<br>Solution: %{intensity:.3f}<extra></extra>',
      showlegend: false
    });

    // Add mesh edges in 3D scene so they stay aligned with mesh3d trace
    if (showMesh) {
      const edgeX = [];
      const edgeY = [];
      const edgeZ = [];

      for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
        const elem = nop[elementIndex];

        // Extract corner nodes only (for quadratic elements, use nodes 0, 2, 8, 6)
        let cornerNodes;
        if (elem.length === 9) {
          cornerNodes = [elem[0], elem[2], elem[8], elem[6]];
        } else {
          cornerNodes = elem; // TODO: Add also other element types
        }

        const closedLoop = [...cornerNodes, cornerNodes[0]];
        closedLoop.forEach(idx => {
          edgeX.push(nodesXCoordinates[idx - 1]);
          edgeY.push(nodesYCoordinates[idx - 1]);
          edgeZ.push(0);
        });

        // separator between polygons
        edgeX.push(null);
        edgeY.push(null);
        edgeZ.push(null);
      }

      contourDataUnstructured.push({
        type: "scatter3d",
        mode: "lines",
        x: edgeX,
        y: edgeY,
        z: edgeZ,
        line: { color: "black", width: 1 },
        hoverinfo: "none",
        showlegend: false
      });
    }

    const createCameraDefaults = () => ({
      eye: { x: 0, y: 0, z: 2 },
      up: { x: 0, y: 1, z: 0 },
      center: { x: 0, y: 0, z: 0 },
      projection: { type: "orthographic" }
    });

    // Force a top-down orthographic camera so 2D meshes render without perspective
    layout.scene = {
      xaxis: {
        title: "x",
        range: paddedXRange,
        showgrid: false,
        zeroline: false,
        showline: true,
        linecolor: "#444",
        ticks: "outside",
        ticklen: 6,
        tickcolor: "#444",
        automargin: true
      },
      yaxis: {
        title: "y",
        range: paddedYRange,
        showgrid: false,
        zeroline: false,
        showline: true,
        linecolor: "#444",
        ticks: "outside",
        ticklen: 6,
        tickcolor: "#444",
        automargin: true
      },
      zaxis: {
        visible: false,
        showgrid: false,
        zeroline: false
      },
      aspectmode: "manual",
      aspectratio: {
        x: spanX,
        y: spanY,
        z: 0.01 * Math.max(spanX, spanY)
      },
      dragmode: "pan",
      uirevision: "topView",
      camera: createCameraDefaults()
    };

    const meshPlotConfig = {
      responsive: true,
      modeBarButtonsToRemove: ["resetCameraDefault3d", "resetCameraLastSave3d"],
      modeBarButtonsToAdd: [
        {
          name: "Reset top view",
          title: "Reset to orthographic top-down view",
          icon: Plotly.Icons.home,
          click: (gd) => {
            Plotly.relayout(gd, {
              "scene.camera": createCameraDefaults()
            });
          }
        }
      ]
    };

    // Create the plot using filled triangles
    Plotly.newPlot(plotDivId, contourDataUnstructured, layout, meshPlotConfig);
  }
}
