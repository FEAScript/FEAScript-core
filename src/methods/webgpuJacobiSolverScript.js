/**
 * ════════════════════════════════════════════════════════════
 *  FEAScript Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.1.4 | https://feascript.com
 * ════════════════════════════════════════════════════════════
 */

// External imports
import * as ti from "../vendor/taichi.esm.js";

// Internal imports
import { debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Class to provide GPU-accelerated Jacobi solver using Taichi.js/WebGPU
 * Offloads iterative linear algebra to the GPU for improved performance on large systems
 */
export class WebGPUComputeEngine {
  /**
   * Constructor to creates a WebGPUComputeEngine instance
   * The engine remains uninitialized until initialize() is called
   */
  constructor() {
    this.initialized = false;
    this.extractDiagonalKernel = null;
    this.jacobiStepKernel = null;
    this.swapSolutionKernel = null;
    this.cachedSize = null;
    this.fields = null;
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
   * @returns {Promise<object>} Result object containing the solution, iteration count, and convergence flag
   */
  async webgpuJacobiSolver(A, b, x0, maxIter, tol) {
    await this.initialize();
    const n = b.length;
    const flatA = A.flat();

    if (!this.fields || this.cachedSize !== n) {
      this.fields = {
        AField: ti.field(ti.f32, [n * n]),
        bField: ti.field(ti.f32, [n]),
        xField: ti.field(ti.f32, [n]),
        xNewField: ti.field(ti.f32, [n]),
        diagField: ti.field(ti.f32, [n]),
        maxResidualField: ti.field(ti.f32, [1]),
      };
      this.cachedSize = n;
    }

    const { AField, bField, xField, xNewField, diagField, maxResidualField } = this.fields;

    AField.fromArray(flatA);
    bField.fromArray(b);
    xField.fromArray(x0);
    xNewField.fromArray(x0);

    ti.addToKernelScope({ AField, bField, xField, xNewField, diagField, maxResidualField });
    if (!this.extractDiagonalKernel) {
      this.extractDiagonalKernel = ti.kernel((size) => {
        for (let i of ti.ndrange(size)) {
          diagField[i] = AField[ti.i32(i) * ti.i32(size) + ti.i32(i)];
        }
      });

      this.jacobiStepKernel = ti.kernel((size) => {
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

      this.swapSolutionKernel = ti.kernel((size) => {
        for (let i of ti.ndrange(size)) {
          xField[i] = xNewField[i];
        }
      });
    }

    this.extractDiagonalKernel(n);

    const residualCheckInterval = Math.max(1, Math.min(10, Math.floor(maxIter / 4) || 1));
    let iterations = maxIter;
    let converged = false;

    for (let iter = 0; iter < maxIter; iter++) {
      this.jacobiStepKernel(n);
      this.swapSolutionKernel(n);

      const shouldCheckResidual = (iter + 1) % residualCheckInterval === 0 || iter === maxIter - 1;
      if (!shouldCheckResidual) {
        continue;
      }

      const rnorm = (await maxResidualField.toArray())[0];
      iterations = iter + 1;
      debugLog(`Jacobi: Iteration ${iterations}, residual norm: ${rnorm}`);
      if (rnorm < tol) {
        converged = true;
        break;
      }
    }

    if (!converged) {
      errorLog(`Jacobi: Did not converge in ${maxIter} iterations`);
    }

    return { solutionVector: await xField.toArray(), iterations, converged };
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
    this.extractDiagonalKernel = null;
    this.jacobiStepKernel = null;
    this.swapSolutionKernel = null;
    this.cachedSize = null;
    this.fields = null;
  }
}
