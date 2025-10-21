//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

import * as Comlink from "../vendor/comlink.mjs";
import { WebGPUComputeEngine } from "../utilities/webgpuComputeEngine.js";

/**
 * Function to solve a system of linear equations using the Jacobi iterative method
 * This version uses the WebGPU compute engine for maximum performance and reusability
 * @param {array} A - The coefficient matrix (must be square)
 * @param {array} b - The right-hand side vector
 * @param {array} x0 - Initial guess for solution vector
 * @param {number} [maxIterations=100] - Maximum number of iterations
 * @param {number} [tolerance=1e-7] - Convergence tolerance
 * @param {boolean} [useFloat64=true] - Whether to use Float64Array for higher precision
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 */
export async function jacobiMethod(A, b, x0, maxIterations = 100, tolerance = 1e-7, useFloat64 = true) {
  // Use the dedicated worker file
  const worker = new Worker('./workers/webgpuJacobiWorker.js', { type: 'module' });
  const jacobiWorker = Comlink.wrap(worker);

  try {
    const result = await jacobiWorker.jacobiMethod(A, b, x0, maxIterations, tolerance, useFloat64);
    return result;
  } catch (error) {
    console.error("Error in WebGPU Jacobi method:", error);
    throw error;
  } finally {
    worker.terminate();
  }
}