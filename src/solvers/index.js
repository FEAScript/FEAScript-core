/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

export { jacobiSolver } from "./jacobiSolver.js";
export { mathjsLUSolver } from "./mathjsLUSolver.js";
export { solveLinearSystem, solveLinearSystemAsync } from "./linearSystemSolver.js";
export { runFrontalSolver } from "./frontalSolver.js";
export { newtonRaphson } from "./newtonRaphson.js";
// WebGPUComputeEngine (webgpuJacobiSolver.js) is not re-exported, since importing it loads taichi.js;
// it is used only by the WebGPU worker
