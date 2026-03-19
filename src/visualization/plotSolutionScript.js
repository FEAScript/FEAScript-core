/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import {
  prepareMesh,
  pointInsideQuadrilateral,
  computeNodeNeighbors,
  getBoundarySegments,
} from "../mesh/meshUtilsScript.js";
import { BasisFunctions } from "../mesh/basisFunctionsScript.js";
import { errorLog } from "../utilities/loggingScript.js";

let _vtkModules = null;

/**
 * Lazily loads and caches vtk.js modules required for rendering
 * @returns {Promise<object>} Object containing vtk.js module references
 */
async function loadVtkModules() {
  if (_vtkModules) return _vtkModules;
  await import("@kitware/vtk.js/Rendering/Profiles/Geometry.js");
  const [
    { default: vtkActor },
    { default: vtkColorTransferFunction },
    { default: vtkColorMaps },
    { default: vtkDataArray },
    { default: vtkImageData },
    { default: vtkImageMarchingSquares },
    { default: vtkGenericRenderWindow },
    { default: vtkMapper },
    { default: vtkPolyData },
    { default: vtkScalarBarActor },
  ] = await Promise.all([
    import("@kitware/vtk.js/Rendering/Core/Actor.js"),
    import("@kitware/vtk.js/Rendering/Core/ColorTransferFunction.js"),
    import("@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps.js"),
    import("@kitware/vtk.js/Common/Core/DataArray.js"),
    import("@kitware/vtk.js/Common/DataModel/ImageData.js"),
    import("@kitware/vtk.js/Filters/General/ImageMarchingSquares.js"),
    import("@kitware/vtk.js/Rendering/Misc/GenericRenderWindow.js"),
    import("@kitware/vtk.js/Rendering/Core/Mapper.js"),
    import("@kitware/vtk.js/Common/DataModel/PolyData.js"),
    import("@kitware/vtk.js/Rendering/Core/ScalarBarActor.js"),
  ]);
  _vtkModules = {
    vtkActor,
    vtkColorTransferFunction,
    vtkColorMaps,
    vtkDataArray,
    vtkImageData,
    vtkImageMarchingSquares,
    vtkGenericRenderWindow,
    vtkMapper,
    vtkPolyData,
    vtkScalarBarActor,
  };
  return _vtkModules;
}

const rendererCache = new Map();

/**
 * Creates a color scale configuration for visualization
 * @param {object} options - Color scale options
 * @param {string} [options.presetName="Cool to Warm"] - Color map preset name
 * @param {boolean} [options.reverse=false] - Whether to reverse the color map
 * @param {boolean} [options.showScalarBar=true] - Whether to display the scalar bar
 * @param {string} [options.scalarBarTitle="Solution"] - Title for the scalar bar
 * @returns {object} Color scale configuration object
 */
export function createColorScale(options = {}) {
  return {
    presetName: options.presetName ?? "Cool to Warm",
    reverse: options.reverse ?? false,
    showScalarBar: options.showScalarBar ?? true,
    scalarBarTitle: options.scalarBarTitle ?? "Solution",
  };
}

/**
 * Creates contour line options for visualization
 * @param {object} options - Contour line options
 * @param {boolean} [options.enabled=true] - Whether contour lines are enabled
 * @param {number} [options.numberOfContours=12] - Number of contour lines
 * @param {Array<number>} [options.color=[0.15,0.15,0.15]] - RGB color array for contour lines
 * @param {number} [options.lineWidth=1] - Width of contour lines
 * @returns {object} Contour line configuration object
 */
export function createContourLineOptions(options = {}) {
  return {
    enabled: options.enabled ?? true,
    numberOfContours: options.numberOfContours ?? 12,
    color: options.color ?? [0.15, 0.15, 0.15],
    lineWidth: options.lineWidth ?? 1,
  };
}

/**
 * Plots the FEA solution using either Plotly or VTK.js backend
 * @param {object} model - FEAScript model containing mesh and solver configuration
 * @param {object} result - Object containing solution vector and node coordinates
 * @param {string} plotType - The type of plot (e.g., "line", "contour")
 * @param {string} plotDivId - The id of the HTML element for rendering
 * @param {object} [renderOptions={}] - Rendering options including backend, colorScale, contourLines
 */
export async function plotSolution(model, result, plotType, plotDivId, renderOptions = {}) {
  console.time("plottingTime");
  const backend = renderOptions.backend ?? "plotly";

  if (backend === "plotly") {
    await renderPlotlyScene(model, result, plotType, plotDivId, false, renderOptions);
  } else {
    const meshDimension = model.meshConfig.meshDimension;
    const meshData = prepareMesh(model.meshConfig);
    const vtkData = await transformSolverOutputToVtkData(model, result, meshData, {
      mode: meshDimension === "1D" && plotType === "line" ? "line" : "surface",
    });
    await renderVtkScene(vtkData, plotDivId, model.solverConfig, plotType, renderOptions);
  }
  console.timeEnd("plottingTime");
}

/**
 * Plots the FEA solution using the VTK.js backend
 * @param {object} model - FEAScript model containing mesh and solver configuration
 * @param {object} result - Object containing solution vector and node coordinates
 * @param {string} plotType - The type of plot (e.g., "line", "contour")
 * @param {string} plotDivId - The id of the HTML element for rendering
 * @param {object} [renderOptions={}] - Rendering options including colorScale, contourLines
 */
export async function plotSolutionVtk(model, result, plotType, plotDivId, renderOptions = {}) {
  return plotSolution(model, result, plotType, plotDivId, { ...renderOptions, backend: "vtk" });
}

/**
 * Plots an interpolated FEA solution using either Plotly or VTK.js backend
 * @param {object} model - FEAScript model containing mesh and solver configuration
 * @param {object} result - Object containing solution vector and node coordinates
 * @param {string} plotType - The type of plot (e.g., "contour")
 * @param {string} plotDivId - The id of the HTML element for rendering
 * @param {object} [renderOptions={}] - Rendering options including backend, colorScale, contourLines
 */
export async function plotInterpolatedSolution(model, result, plotType, plotDivId, renderOptions = {}) {
  console.time("plottingTime");
  const backend = renderOptions.backend ?? "plotly";

  if (backend === "plotly") {
    if (model.meshConfig.meshDimension === "2D" && plotType === "contour") {
      const meshData = prepareMesh(model.meshConfig);
      const grid = await buildInterpolatedGridValues(model, result, meshData);
      await renderPlotlyScene(model, result, plotType, plotDivId, true, renderOptions, grid);
    } else {
      await renderPlotlyScene(model, result, plotType, plotDivId, false, renderOptions);
    }
  } else {
    if (model.meshConfig.meshDimension !== "2D" || plotType !== "contour") {
      await plotSolution(model, result, plotType, plotDivId, { ...renderOptions, backend: "vtk" });
      return;
    }
    const meshData = prepareMesh(model.meshConfig);
    const interpolatedVtkData = await buildInterpolatedVtkData(model, result, meshData);
    await renderVtkScene(
      interpolatedVtkData,
      plotDivId,
      model.solverConfig,
      `${plotType}-interpolated`,
      renderOptions,
    );
  }
  console.timeEnd("plottingTime");
}

/**
 * Plots an interpolated FEA solution using the VTK.js backend
 * @param {object} model - FEAScript model containing mesh and solver configuration
 * @param {object} result - Object containing solution vector and node coordinates
 * @param {string} plotType - The type of plot (e.g., "contour")
 * @param {string} plotDivId - The id of the HTML element for rendering
 * @param {object} [renderOptions={}] - Rendering options including colorScale, contourLines
 */
export async function plotInterpolatedSolutionVtk(model, result, plotType, plotDivId, renderOptions = {}) {
  return plotInterpolatedSolution(model, result, plotType, plotDivId, { ...renderOptions, backend: "vtk" });
}

/**
 * Transforms solver output into VTK-compatible data structures
 * @param {object} model - FEAScript model containing mesh and solver configuration
 * @param {object} result - Object containing solution vector and node coordinates
 * @param {object|null} [meshData=null] - Pre-prepared mesh data, or null to auto-prepare
 * @param {object} [options={}] - Options including mode ("surface" or "line")
 * @returns {Promise<object>} VTK data object with points, scalars, cells, polyData, and metadata
 */
export async function transformSolverOutputToVtkData(model, result, meshData = null, options = {}) {
  const preparedMesh = meshData ?? prepareMesh(model.meshConfig);
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
  const solutionArray = extractScalarSolution(result.solutionVector, nodesXCoordinates.length);
  const points = buildPointsArray(nodesXCoordinates, nodesYCoordinates);

  const mode = options.mode ?? "surface";
  const cells =
    mode === "line"
      ? buildLineCellsFromPoints(nodesXCoordinates.length)
      : buildCellArrayFromNop(preparedMesh.nop ?? []);

  const polyData = await buildPolyData(points, solutionArray, cells, mode);

  return {
    points,
    scalars: solutionArray,
    cells,
    polyData,
    mode,
    metadata: {
      solverConfig: model.solverConfig,
      meshDimension: model.meshConfig.meshDimension,
      numberOfPoints: points.length / 3,
      numberOfCells: countPackedCells(cells),
    },
  };
}

/**
 * Transforms solver output into a VTP (VTK PolyData XML) string
 * @param {object} model - FEAScript model containing mesh and solver configuration
 * @param {object} result - Object containing solution vector and node coordinates
 * @param {object|null} [meshData=null] - Pre-prepared mesh data, or null to auto-prepare
 * @param {object} [options={}] - Options including mode ("surface" or "line")
 * @returns {Promise<string>} VTP XML string
 */
export async function transformSolverOutputToVTP(model, result, meshData = null, options = {}) {
  const vtkData = await transformSolverOutputToVtkData(model, result, meshData, options);
  return buildVTPString(vtkData);
}

/**
 * Transforms solver output into typed array buffers suitable for ML pipelines
 * @param {object} result - Object containing solution vector and node coordinates
 * @returns {object} Object with features (Float32Array), featuresShape, labels, and points
 */
export function transformSolverOutputToMLBuffers(result) {
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
  const scalars = extractScalarSolution(result.solutionVector, nodesXCoordinates.length);
  const features = new Float32Array(nodesXCoordinates.length * 3);

  for (let i = 0; i < nodesXCoordinates.length; i++) {
    const base = i * 3;
    features[base] = Number(nodesXCoordinates[i]) || 0;
    features[base + 1] = Number(nodesYCoordinates[i]) || 0;
    features[base + 2] = scalars[i];
  }

  return {
    features,
    featuresShape: [nodesXCoordinates.length, 3],
    labels: scalars,
    points: buildPointsArray(nodesXCoordinates, nodesYCoordinates),
  };
}

async function renderVtkScene(vtkData, plotDivId, solverConfig, plotType, renderOptions = {}) {
  if (typeof document === "undefined") {
    errorLog("vtk.js visualization requires a browser environment");
    return;
  }
  const {
    vtkActor,
    vtkColorTransferFunction,
    vtkColorMaps,
    vtkGenericRenderWindow,
    vtkMapper,
    vtkScalarBarActor,
  } = await loadVtkModules();

  const container = document.getElementById(plotDivId);
  if (!container) {
    errorLog(`Could not find plot container with id: ${plotDivId}`);
    return;
  }

  if (rendererCache.has(plotDivId)) {
    rendererCache.get(plotDivId).delete();
    rendererCache.delete(plotDivId);
  }

  container.innerHTML = "";
  container.style.position = "relative";
  container.style.width = container.style.width || "100%";
  container.style.height = container.style.height || "420px";

  const genericRenderWindow = vtkGenericRenderWindow.newInstance({ background: [1, 1, 1] });
  genericRenderWindow.setContainer(container);
  genericRenderWindow.resize();

  const renderer = genericRenderWindow.getRenderer();
  const renderWindow = genericRenderWindow.getRenderWindow();

  const mapper = vtkMapper.newInstance();
  mapper.setInputData(vtkData.polyData);
  mapper.setScalarModeToUsePointData();
  mapper.setColorModeToMapScalars();
  mapper.setScalarVisibility(true);

  const scalarRange = getScalarRange(vtkData.scalars);
  mapper.setScalarRange(scalarRange[0], scalarRange[1]);

  const colorScale = renderOptions.colorScale ?? createColorScale({});
  const lookupTable = vtkColorTransferFunction.newInstance();
  const preset =
    vtkColorMaps.getPresetByName(colorScale.presetName) ?? vtkColorMaps.getPresetByName("Cool to Warm");
  const mappedPreset = reverseColorMapPreset(preset, colorScale.reverse);
  lookupTable.applyColorMap(mappedPreset);
  lookupTable.setMappingRange(scalarRange[0], scalarRange[1]);
  lookupTable.updateRange();
  mapper.setLookupTable(lookupTable);

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  if (vtkData.mode === "line") actor.getProperty().setLineWidth(3);
  renderer.addActor(actor);

  if (colorScale.showScalarBar) {
    const scalarBarActor = vtkScalarBarActor.newInstance({
      drawNanAnnotation: false,
      generateTicks: (helper) => {
        const bounds = helper.getLastTickBounds();
        if (!bounds || bounds.length < 2) return;
        const [minVal, maxVal] = bounds;
        const count = 5;
        const step = (maxVal - minVal) / (count - 1);
        const ticks = Array.from({ length: count }, (_, i) => minVal + i * step);
        helper.setTicks(ticks);
        helper.setTickStrings(
          ticks.map((v) => {
            const abs = Math.abs(v);
            if (abs === 0) return "0";
            if (abs >= 0.01 && abs < 10000) return parseFloat(v.toPrecision(4)).toString();
            return v.toExponential(2);
          }),
        );
      },
    });
    scalarBarActor.setTickTextStyle({ fontColor: "black" });
    scalarBarActor.setAxisTextStyle({ fontColor: "black" });
    scalarBarActor.setAxisLabel(colorScale.scalarBarTitle);
    scalarBarActor.setScalarsToColors(lookupTable);
    renderer.addActor2D(scalarBarActor);
  }

  const contourLines = createContourLineOptions(renderOptions.contourLines ?? { enabled: false });
  if (contourLines.enabled && vtkData.mode !== "line") {
    await addContourLinesToRenderer(renderer, vtkData, scalarRange, contourLines);
  }

  renderer.resetCamera();
  renderWindow.render();
  rendererCache.set(plotDivId, genericRenderWindow);
  container.title = `${plotType} plot - ${solverConfig}`;
}

async function addContourLinesToRenderer(renderer, vtkData, scalarRange, contourOptions) {
  const gridMeta = vtkData.metadata?.interpolationGrid;
  if (!gridMeta) {
    return;
  }
  const { vtkActor, vtkDataArray, vtkImageData, vtkImageMarchingSquares, vtkMapper } = await loadVtkModules();

  const imageData = vtkImageData.newInstance();
  imageData.setDimensions(gridMeta.nx, gridMeta.ny, 1);
  imageData.setOrigin(gridMeta.origin[0], gridMeta.origin[1], 0);
  imageData.setSpacing(gridMeta.spacing[0], gridMeta.spacing[1], 1);

  const imageScalars = vtkDataArray.newInstance({
    name: "solution",
    numberOfComponents: 1,
    values: gridMeta.imageScalars,
  });
  imageData.getPointData().setScalars(imageScalars);

  const contourFilter = vtkImageMarchingSquares.newInstance({
    slicingMode: 2,
    slice: 0,
    mergePoints: true,
  });
  contourFilter.setInputData(imageData);

  const n = Math.max(2, contourOptions.numberOfContours);
  const minValue = scalarRange[0];
  const maxValue = scalarRange[1];
  const step = (maxValue - minValue) / (n - 1);
  const contourValues = [];
  for (let i = 0; i < n; i++) {
    contourValues.push(minValue + i * step);
  }
  contourFilter.setContourValues(contourValues);
  contourFilter.update();

  const contourMapper = vtkMapper.newInstance();
  contourMapper.setInputData(contourFilter.getOutputData());
  contourMapper.setScalarVisibility(false);

  const contourActor = vtkActor.newInstance();
  contourActor.setMapper(contourMapper);
  contourActor.getProperty().setColor(...contourOptions.color);
  contourActor.getProperty().setLineWidth(contourOptions.lineWidth);
  renderer.addActor(contourActor);
}

async function renderPlotlyScene(
  model,
  result,
  plotType,
  plotDivId,
  interpolated,
  renderOptions = {},
  prebuiltGrid = null,
) {
  if (typeof document === "undefined") {
    errorLog("Plotly visualization requires a browser environment");
    return;
  }
  let Plotly = typeof window !== "undefined" ? window.Plotly : undefined;
  if (!Plotly) {
    try {
      ({ default: Plotly } = await import("plotly.js"));
    } catch {
      errorLog(
        "plotly.js is not available. Load it via a <script> tag or install it with `npm install plotly.js`.",
      );
      return;
    }
  }
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
  const meshDimension = model.meshConfig.meshDimension;
  const plotWidth = typeof window !== "undefined" ? Math.min(window.innerWidth, 600) : 600;
  const colorScale = renderOptions.colorScale ?? {};
  const plotlyColorscale = colorScale.reverse ? "RdBu" : "RdBu_r";
  const scalarBarTitle = colorScale.scalarBarTitle ?? "Solution";

  let traces, layout;

  if (meshDimension === "1D") {
    const scalars = extractScalarSolution(result.solutionVector, nodesXCoordinates.length);
    traces = [
      {
        x: Array.from(nodesXCoordinates),
        y: Array.from(scalars),
        mode: "lines",
        type: "scatter",
        line: { color: "royalblue" },
      },
    ];
    layout = {
      title: `${plotType} plot - ${model.solverConfig}`,
      xaxis: { title: "x" },
      yaxis: { title: "Solution" },
      width: plotWidth,
    };
  } else if (interpolated && prebuiltGrid) {
    const { visNodesX, visNodesY, visSolution, insideMask, minX, minY, deltaX, deltaY, lengthX, lengthY } =
      prebuiltGrid;
    const xVals = Array.from({ length: visNodesX }, (_, i) => minX + i * deltaX);
    const yVals = Array.from({ length: visNodesY }, (_, i) => minY + i * deltaY);
    // Plotly contour expects z[iy][ix]
    const zGrid = Array.from({ length: visNodesY }, (_, iy) =>
      Array.from({ length: visNodesX }, (_, ix) => {
        const idx = ix * visNodesY + iy;
        return insideMask[idx] ? visSolution[idx] : null;
      }),
    );
    traces = [
      {
        x: xVals,
        y: yVals,
        z: zGrid,
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
        colorbar: {
          title: "Solution",
        },
        name: "Interpolated Solution Field",
      },
    ];
    layout = {
      title: `${plotType} plot (interpolated) - ${model.solverConfig}`,
      xaxis: { title: "x", scaleanchor: "y", scaleratio: 1 },
      yaxis: { title: "y" },
      width: plotWidth,
      height: plotWidth * (lengthY / lengthX),
    };
  } else {
    const scalars = extractScalarSolution(result.solutionVector, nodesXCoordinates.length);
    const minX = Math.min(...nodesXCoordinates);
    const maxX = Math.max(...nodesXCoordinates);
    const minY = Math.min(...nodesYCoordinates);
    const maxY = Math.max(...nodesYCoordinates);
    const lengthX = maxX - minX;
    const lengthY = maxY - minY;
    const aspectRatio = lengthY / lengthX;
    traces = [
      {
        x: Array.from(nodesXCoordinates),
        y: Array.from(nodesYCoordinates),
        z: Array.from(scalars),
        type: "contour",
        line: {
          smoothing: 0.85,
        },
        contours: {
          coloring: "heatmap",
          showlabels: false,
        },
        colorbar: {
          title: "Solution",
        },
        name: "Solution Field",
      },
    ];
    layout = {
      title: `${plotType} plot - ${model.solverConfig}`,
      width: plotWidth,
      height: plotWidth * aspectRatio,
      xaxis: { title: "x" },
      yaxis: {
        title: "y",
        scaleanchor: "x",
        scaleratio: 1,
      },
      margin: { l: 50, r: 50, t: 50, b: 50 },
      hovermode: "closest",
    };
  }

  await Plotly.newPlot(plotDivId, traces, layout, { responsive: true });
}

function reverseColorMapPreset(preset, reverse) {
  if (!reverse || !preset?.RGBPoints?.length) return preset;
  const rgb = preset.RGBPoints;
  const minX = rgb[0];
  const maxX = rgb[rgb.length - 4];
  const reversed = [];
  for (let i = rgb.length - 4; i >= 0; i -= 4) {
    reversed.push(maxX - (rgb[i] - minX), rgb[i + 1], rgb[i + 2], rgb[i + 3]);
  }
  return { ...preset, RGBPoints: reversed };
}

async function buildPolyData(points, scalars, cells, mode = "surface") {
  const { vtkPolyData, vtkDataArray } = await loadVtkModules();
  const polyData = vtkPolyData.newInstance();
  polyData.getPoints().setData(points, 3);
  if (cells.length > 0) {
    if (mode === "line") polyData.getLines().setData(cells);
    else polyData.getPolys().setData(cells);
  }
  const scalarData = vtkDataArray.newInstance({
    name: "solution",
    numberOfComponents: 1,
    values: scalars,
  });
  polyData.getPointData().setScalars(scalarData);
  return polyData;
}

function buildPointsArray(nodesXCoordinates, nodesYCoordinates) {
  const points = new Float32Array(nodesXCoordinates.length * 3);
  for (let i = 0; i < nodesXCoordinates.length; i++) {
    const base = i * 3;
    points[base] = Number(nodesXCoordinates[i]) || 0;
    points[base + 1] = Number(nodesYCoordinates?.[i]) || 0;
    points[base + 2] = 0;
  }
  return points;
}

function extractScalarSolution(solutionVector, expectedLength) {
  const scalars = new Float32Array(expectedLength);
  for (let i = 0; i < expectedLength; i++) {
    const value = solutionVector?.[i];
    scalars[i] = Number(Array.isArray(value) ? value[0] : value) || 0;
  }
  return scalars;
}

function buildLineCellsFromPoints(totalPoints) {
  if (totalPoints < 2) return new Uint32Array(0);
  const packed = new Uint32Array((totalPoints - 1) * 3);
  let offset = 0;
  for (let i = 0; i < totalPoints - 1; i++) {
    packed[offset++] = 2;
    packed[offset++] = i;
    packed[offset++] = i + 1;
  }
  return packed;
}

function buildCellArrayFromNop(nop) {
  const packed = [];
  for (let i = 0; i < nop.length; i++) {
    const cell = convertElementNodesToLinearCell(nop[i]);
    packed.push(cell.length, ...cell);
  }
  return Uint32Array.from(packed);
}

function convertElementNodesToLinearCell(elementNodes) {
  const indices = elementNodes.map((node) => node - 1);
  const n = indices.length;

  if (n === 2 || n === 3) {
    return indices;
  }

  if (n === 4) {
    // FEAScript quad numbering:
    //   1 --- 3
    //   |     |
    //   0 --- 2
    // Perimeter order for VTK polygon: 0 -> 2 -> 3 -> 1
    return [indices[0], indices[2], indices[3], indices[1]];
  }

  if (n === 6) {
    return [indices[0], indices[2], indices[5]];
  }

  if (n === 8) {
    // Perimeter corners for FEAScript serendipity quad:
    //   2 --- 6
    //   |     |
    //   0 --- 4
    return [indices[0], indices[4], indices[6], indices[2]];
  }

  if (n === 9) {
    // FEAScript 9-node quad numbering:
    //   2 -- 5 -- 8
    //   |         |
    //   1 -- 4 -- 7
    //   |         |
    //   0 -- 3 -- 6
    // Corner perimeter order for VTK polygon: 0 -> 6 -> 8 -> 2
    return [indices[0], indices[6], indices[8], indices[2]];
  }

  // Generic fallback for polygonal/high-order cells.
  return indices.slice(0, Math.min(4, indices.length));
}

function getScalarRange(scalars) {
  if (!scalars?.length) return [0, 1];
  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < scalars.length; i++) {
    const value = scalars[i];
    if (!Number.isFinite(value)) continue;
    if (value < minValue) minValue = value;
    if (value > maxValue) maxValue = value;
  }
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) return [0, 1];
  if (minValue === maxValue) return [minValue - 1, maxValue + 1];
  return [minValue, maxValue];
}

function countPackedCells(packedCells) {
  let count = 0,
    offset = 0;
  while (offset < packedCells.length) {
    offset += packedCells[offset] + 1;
    count++;
  }
  return count;
}

function packedCellsToConnectivityAndOffsets(packedCells) {
  const connectivity = [],
    offsets = [];
  let offset = 0,
    running = 0;
  while (offset < packedCells.length) {
    const npts = packedCells[offset++];
    for (let i = 0; i < npts; i++) connectivity.push(packedCells[offset++]);
    running += npts;
    offsets.push(running);
  }
  return { connectivity, offsets };
}

function buildVTPString(vtkData) {
  const { connectivity, offsets } = packedCellsToConnectivityAndOffsets(vtkData.cells);
  const numberOfPoints = vtkData.points.length / 3;
  const isLine = vtkData.mode === "line";
  const topologyTag = isLine ? "Lines" : "Polys";
  return [
    '<?xml version="1.0"?>',
    '<VTKFile type="PolyData" version="0.1" byte_order="LittleEndian">',
    "  <PolyData>",
    `    <Piece NumberOfPoints="${numberOfPoints}" NumberOfVerts="0" NumberOfLines="${isLine ? offsets.length : 0}" NumberOfStrips="0" NumberOfPolys="${isLine ? 0 : offsets.length}">`,
    '      <PointData Scalars="solution">',
    `        <DataArray type="Float32" Name="solution" NumberOfComponents="1" format="ascii">${Array.from(vtkData.scalars).join(" ")}</DataArray>`,
    "      </PointData>",
    "      <Points>",
    `        <DataArray type="Float32" NumberOfComponents="3" format="ascii">${Array.from(vtkData.points).join(" ")}</DataArray>`,
    "      </Points>",
    `      <${topologyTag}>`,
    `        <DataArray type="Int32" Name="connectivity" format="ascii">${connectivity.join(" ")}</DataArray>`,
    `        <DataArray type="Int32" Name="offsets" format="ascii">${offsets.join(" ")}</DataArray>`,
    `      </${topologyTag}>`,
    "    </Piece>",
    "  </PolyData>",
    "</VTKFile>",
  ].join("\n");
}

async function buildInterpolatedGridValues(model, result, meshData) {
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
  const basisFunctions = new BasisFunctions({
    meshDimension: model.meshConfig.meshDimension,
    elementOrder: model.meshConfig.elementOrder,
  });

  let minX = nodesXCoordinates[0];
  let maxX = nodesXCoordinates[0];
  let minY = nodesYCoordinates[0];
  let maxY = nodesYCoordinates[0];
  for (let i = 1; i < nodesXCoordinates.length; i++) {
    const x = nodesXCoordinates[i];
    const y = nodesYCoordinates[i];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const lengthX = maxX - minX;
  const lengthY = maxY - minY;
  const visPointsPerUnit = 50;

  const visNodesX = Math.max(2, Math.round(lengthX * visPointsPerUnit));
  const visNodesY = Math.max(2, Math.round(lengthY * visPointsPerUnit));

  const deltaX = lengthX / (visNodesX - 1);
  const deltaY = lengthY / (visNodesY - 1);

  const totalVisNodes = visNodesX * visNodesY;
  const visNodeXCoordinates = new Float32Array(totalVisNodes);
  const visNodeYCoordinates = new Float32Array(totalVisNodes);
  const visSolution = new Float32Array(totalVisNodes);
  visSolution.fill(Number.NaN);
  const insideMask = new Uint8Array(totalVisNodes);

  const boundarySegments = getBoundarySegments(meshData);
  const { nodeNeighbors, neighborCount } = computeNodeNeighbors(meshData);

  let lastParentElement = 0;
  for (let ix = 0; ix < visNodesX; ix++) {
    for (let iy = 0; iy < visNodesY; iy++) {
      const visNodeIndex = ix * visNodesY + iy;
      const x = minX + ix * deltaX;
      const y = minY + iy * deltaY;

      visNodeXCoordinates[visNodeIndex] = x;
      visNodeYCoordinates[visNodeIndex] = y;

      if (!pointInsidePolygon(x, y, boundarySegments)) {
        continue;
      }

      let found = false;
      for (
        let localNodeIndex = 0;
        localNodeIndex < meshData.nop[lastParentElement].length;
        localNodeIndex++
      ) {
        const globalNodeIndex = meshData.nop[lastParentElement][localNodeIndex] - 1;
        for (let ni = 0; ni < neighborCount[globalNodeIndex]; ni++) {
          const currentElement = nodeNeighbors[globalNodeIndex][ni];
          const searchResult = pointSearch(model, meshData, result, currentElement, x, y, basisFunctions);

          if (searchResult.inside) {
            lastParentElement = currentElement;
            visSolution[visNodeIndex] = searchResult.value;
            insideMask[visNodeIndex] = 1;
            found = true;
            break;
          }
        }
        if (found) break;
      }

      if (!found) {
        for (let currentElement = 0; currentElement < meshData.nop.length; currentElement++) {
          const searchResult = pointSearch(model, meshData, result, currentElement, x, y, basisFunctions);

          if (searchResult.inside) {
            lastParentElement = currentElement;
            visSolution[visNodeIndex] = searchResult.value;
            insideMask[visNodeIndex] = 1;
            break;
          }
        }
      }
    }
  }

  return {
    visNodesX,
    visNodesY,
    minX,
    minY,
    deltaX,
    deltaY,
    lengthX,
    lengthY,
    visNodeXCoordinates,
    visNodeYCoordinates,
    visSolution,
    insideMask,
  };
}

async function buildInterpolatedVtkData(model, result, meshData) {
  const grid = await buildInterpolatedGridValues(model, result, meshData);
  const {
    visNodesX,
    visNodesY,
    minX,
    minY,
    deltaX,
    deltaY,
    visNodeXCoordinates,
    visNodeYCoordinates,
    visSolution,
    insideMask,
  } = grid;

  const points = buildPointsArray(visNodeXCoordinates, visNodeYCoordinates);
  const cells = buildStructuredGridCells(visNodesX, visNodesY, insideMask);
  const polyData = await buildPolyData(points, visSolution, cells, "surface");

  return {
    points,
    scalars: visSolution,
    cells,
    polyData,
    mode: "surface",
    metadata: {
      meshDimension: "2D",
      numberOfPoints: points.length / 3,
      numberOfCells: countPackedCells(cells),
      interpolationGrid: {
        nx: visNodesX,
        ny: visNodesY,
        origin: [minX, minY],
        spacing: [deltaX, deltaY],
        imageScalars: reorderStructuredScalarsForImage(visSolution, visNodesX, visNodesY),
      },
    },
  };
}

function reorderStructuredScalarsForImage(values, nx, ny) {
  // FEAScript interpolation uses index = ix * ny + iy (y-fast).
  // vtkImageData expects index = ix + iy * nx (x-fast).
  const reordered = new Float32Array(nx * ny);
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      reordered[ix + iy * nx] = values[ix * ny + iy];
    }
  }
  return reordered;
}

function buildStructuredGridCells(nx, ny, insideMask) {
  const packed = [];

  for (let ix = 0; ix < nx - 1; ix++) {
    for (let iy = 0; iy < ny - 1; iy++) {
      const n0 = ix * ny + iy;
      const n1 = (ix + 1) * ny + iy;
      const n2 = (ix + 1) * ny + (iy + 1);
      const n3 = ix * ny + (iy + 1);

      if (!insideMask[n0] || !insideMask[n1] || !insideMask[n2] || !insideMask[n3]) {
        continue;
      }

      packed.push(4, n0, n1, n2, n3);
    }
  }

  return Uint32Array.from(packed);
}

function pointSearch(
  model,
  meshData,
  result,
  currentElement,
  visNodeXCoordinate,
  visNodeYCoordinate,
  basisFunctions,
) {
  const { nodesXCoordinates, nodesYCoordinates } = result.nodesCoordinates;
  const nodesPerElement = meshData.nop[currentElement].length;

  if (nodesPerElement === 4) {
    const vertices = [
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
          basisFunctions,
        ),
      };
    }
  } else if (nodesPerElement === 9) {
    const vertices = [
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
          basisFunctions,
        ),
      };
    }
  }

  return { inside: false, value: null };
}

function solutionInterpolation(model, meshData, result, elementIndex, ksi, eta, basisFunctions) {
  const solutionVector = result.solutionVector;
  const nodesPerElement = meshData.nop[elementIndex].length;
  const basisFunctionsAndDerivatives = basisFunctions.getBasisFunctions(ksi, eta);
  const basisFunction = basisFunctionsAndDerivatives.basisFunction;

  const zData = Array.isArray(solutionVector[0]) ? solutionVector.map((value) => value[0]) : solutionVector;

  let interpolatedValue = 0;
  for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
    interpolatedValue +=
      zData[meshData.nop[elementIndex][localNodeIndex] - 1] * basisFunction[localNodeIndex];
  }

  return interpolatedValue;
}

function pointInsidePolygon(x, y, segments) {
  let inside = false;
  for (let i = 0; i < segments.length; i++) {
    const [[x1, y1], [x2, y2]] = segments[i];
    const intersect = y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1;
    if (intersect) inside = !inside;
  }
  return inside;
}
