/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { FEAScriptError } from "../utilities/errors.js";

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
export async function assertWebGPUAvailable(
  where = typeof document !== "undefined" ? "this browser" : "this environment",
) {
  const gpu = globalThis.navigator?.gpu;
  const alternative = 'Use a CPU solver instead, such as "lusolve" with solve()';
  if (!gpu) {
    throw new FEAScriptError(
      "UNSUPPORTED_SOLVER",
      `"jacobi-gpu" needs WebGPU, which ${where} does not provide (navigator.gpu is undefined). ` +
        `WebGPU may be turned off in the browser settings. ${alternative}`,
    );
  }
  const adapter = await gpu.requestAdapter({ powerPreference: "high-performance" }).catch(() => null);
  if (!adapter) {
    throw new FEAScriptError(
      "UNSUPPORTED_SOLVER",
      `"jacobi-gpu" needs a GPU through WebGPU, but WebGPU found no GPU adapter in ${where}. The browser may ` +
        `keep WebGPU off for this GPU or driver (Chrome on Linux, for example, needs "Unsafe WebGPU Support" and ` +
        `Vulkan turned on in chrome://flags). ${alternative}`,
    );
  }
}
