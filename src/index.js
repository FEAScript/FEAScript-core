/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 (RC) | https://feascript.com
 *  MIT License © 2023–2025 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

export { FEAScriptModel } from "./FEAScript.js";
export { importGmshQuadTri } from "./readers/gmshReaderScript.js";
export { logSystem } from "./utilities/loggingScript.js";
export { plotSolution } from "./visualization/plotSolutionScript.js";
export { FEAScriptWorker } from "./workers/workerScript.js";
export const printVersion = "0.2.0 (RC)";