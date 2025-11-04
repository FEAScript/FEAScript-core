//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

// External imports
import * as ti from "../vendor/taichi.esm.js";

// Internal imports
import { debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Class providing GPU-accelerated Jacobi solver using Taichi.js/WebGPU.
 * Offloads iterative linear algebra to the GPU for improved performance on large systems.
 */
export class WebGPUComputeEngine {
  /**
   * Creates a WebGPUComputeEngine instance.
   * The engine remains uninitialized until initialize() is called.
   */
  constructor() {
    this.initialized = false;
  }

  /**
   * Function to initialize the WebGPU compute engine
   * @returns {Promise<void>} Resolves when Taichi.js has finished binding to WebGPU
   */
  async initialize() {
    if (this.initialized) {
      return;
    }
    await ti.init();
    this.initialized = true;
  }

  /**
   * Function to solve a system of linear equations using the Jacobi iterative method (GPU asynchronous version)
   * @param {number[][]} A - The system matrix (dense, n×n)
   * @param {number[]} b - The right-hand side vector (length n)
   * @param {number[]} x0 - Initial guess for solution vector (length n)
   * @param {number} maxIter - Maximum number of iterations
   * @param {number} tol - Convergence tolerance for the residual norm
   * @returns {Promise<{solutionVector: number[], iterations: number, converged: boolean}>} Result object containing the solution, iteration count, and convergence flag
   */
  async webgpuJacobiSolver(A, b, x0, maxIter, tol) {
    const n = b.length;
    const flatA = A.flat();

    const AField = ti.field(ti.f32, [n * n]);
    const bField = ti.field(ti.f32, [n]);
    const xField = ti.field(ti.f32, [n]);
    const xNewField = ti.field(ti.f32, [n]);
    const diagField = ti.field(ti.f32, [n]);
    const maxResidualField = ti.field(ti.f32, [1]);

    AField.fromArray(flatA);
    bField.fromArray(b);
    xField.fromArray(x0);
    xNewField.fromArray(x0);

    ti.addToKernelScope({ AField, bField, xField, xNewField, diagField, maxResidualField });

    ti.kernel((size) => {
      for (let i of ti.ndrange(size)) {
        diagField[i] = AField[ti.i32(i) * ti.i32(size) + ti.i32(i)];
      }
    })(n);

    const jacobiStep = ti.kernel((size) => {
      maxResidualField[0] = 0.0;
      for (let i of ti.ndrange(size)) {
        let sum = 0.0;
        for (let j of ti.ndrange(size)) {
          sum += AField[ti.i32(i) * ti.i32(size) + ti.i32(j)] * xField[j];
        }
        const residual = bField[i] - sum;
        xNewField[i] = xField[i] + residual / diagField[i];
        ti.atomicMax(maxResidualField[0], ti.abs(residual));
      }
    });

    const swapSolution = ti.kernel((size) => {
      for (let i of ti.ndrange(size)) {
        xField[i] = xNewField[i];
      }
    });

    for (let iter = 0; iter < maxIter; iter++) {
      jacobiStep(n);
      const rnorm = (await maxResidualField.toArray())[0];
      debugLog(`Jacobi: Iteration ${iter + 1}, residual norm: ${rnorm}`);
      if (rnorm < tol) {
        return { solutionVector: await xNewField.toArray(), iterations: iter + 1, converged: true };
      }
      swapSolution(n);
    }

    errorLog(`Jacobi: Did not converge in ${maxIter} iterations`);
    return { solutionVector: await xField.toArray(), iterations: maxIter, converged: false };
  }

  /**
   * Function to destroy the compute engine and clean up resources
   * @returns {Promise<void>} Resolves when GPU resources have been released
   */
  async destroy() {
    if (!this.initialized) {
      return;
    }
    if (typeof ti.destroy === "function") {
      await ti.destroy();
    }
    this.initialized = false;
  }
}
