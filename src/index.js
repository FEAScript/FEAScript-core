/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

export { FEAScriptModel } from "./FEAScript.js";
export { importGmshMesh } from "./readers/gmshReader.js";
export { logSystem } from "./utilities/logging.js";
export { plotSolution, plotInterpolatedSolution } from "./visualization/plotlyPlot.js";
export {
  plotSolutionVtk,
  plotInterpolatedSolutionVtk,
  createColorScale,
  createContourLineOptions,
  transformSolverOutputToVtkData,
  transformSolverOutputToVTP,
  transformSolverOutputToMLBuffers,
} from "./visualization/vtkPlot.js";
export { FEAScriptWorker } from "./workers/worker.js";
export const printVersion = "0.3.0 (RC)";
