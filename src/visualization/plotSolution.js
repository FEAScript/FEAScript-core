/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Plotly-based plotting functions are provided by plotlyPlot.js
 * VTK.js-based plotting and data transformation functions are provided by vtkPlot.js
 */

export { plotSolution, plotInterpolatedSolution } from "./plotlyPlot.js";

export {
  plotSolutionVtk,
  plotInterpolatedSolutionVtk,
  createColorScale,
  createContourLineOptions,
  transformSolverOutputToVtkData,
  transformSolverOutputToVTP,
  transformSolverOutputToMLBuffers,
} from "./vtkPlot.js";
