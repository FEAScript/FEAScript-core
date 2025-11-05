/**
 * ════════════════════════════════════════════════════════════
 *  FEAScript Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.1.4 | https://feascript.com
 * ════════════════════════════════════════════════════════════
 */

export { FEAScriptModel } from "./FEAScript.js";
export { importGmshQuadTri } from "./readers/gmshReaderScript.js";
export { logSystem } from "./utilities/loggingScript.js";
export { plotSolution } from "./visualization/plotSolutionScript.js";
export { FEAScriptWorker } from "./workers/workerScript.js";
export const printVersion = "0.1.4";