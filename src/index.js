/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

export { FEAScriptModel } from "./FEAScript.js";
export { importGmshQuadTri } from "./readers/gmshReaderScript.js"; //TODO rename importGmshQuadTri to importGmsh
export { logSystem } from "./utilities/loggingScript.js";
export { plotSolution, plotInterpolatedSolution } from "./visualization/plotlyPlotScript.js";
export {
  plotSolutionVtk,
  plotInterpolatedSolutionVtk,
  createColorScale,
  createContourLineOptions,
  transformSolverOutputToVtkData,
  transformSolverOutputToVTP,
  transformSolverOutputToMLBuffers,
} from "./visualization/vtkPlotScript.js";
export { FEAScriptWorker } from "./workers/workerScript.js";
export const printVersion = "0.3.0 (RC)";
