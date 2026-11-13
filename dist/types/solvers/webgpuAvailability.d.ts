/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to check that WebGPU can run the "jacobi-gpu" solver here, before Taichi.js tries to. Without it, a
 * missing navigator.gpu fails with a TypeError, and a missing adapter makes Taichi.js call alert(), which does
 * not exist in a worker, so the reason is lost and the solve never returns. Called on the main thread before the
 * worker starts, and again in the worker, since a browser can offer WebGPU on the page but not in workers
 * @param {string} [where] - Where the check runs, for the message; by default "this browser" on a page and "this
 *  environment" elsewhere (Node.js)
 * @returns {Promise<void>} Resolves when a GPU adapter is available
 * @throws {FEAScriptError} UNSUPPORTED_SOLVER if WebGPU or a GPU adapter is not available
 */
export function assertWebGPUAvailable(where?: string): Promise<void>;
