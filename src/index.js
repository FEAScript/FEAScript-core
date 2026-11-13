/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

export { FEAScriptModel } from "./FEAScript.js";
export { importGmshMesh } from "./io/gmshReader.js";
export { generateTriangleMesh } from "./mesh/triangleMesh.js";
export { generateQuadrilateralMesh } from "./mesh/structuredMesh.js";
export { FEAScriptError } from "./utilities/errors.js";
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

// Types of the public API, for TypeScript and editors (types.js has no runtime code)
export * from "./types.js";

/** The version of FEAScript, as in its npm package (e.g. "0.4.0") */
export const version = "0.4.0-rc.2";

/**
 * The version of FEAScript, as text
 * @deprecated Use `version`; printVersion will be removed in a future version
 */
export const printVersion = "0.4.0 (RC)";
