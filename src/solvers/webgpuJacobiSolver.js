/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.1 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// External imports
import * as ti from "../vendor/taichi.esm.js";

// Internal imports
import { debugLog, errorLog } from "../utilities/logging.js";

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
   * @param {array} systemMatrix - The system matrix
   * @param {array} rightHandSideVector - The right-hand side vector
   * @param {array} initialGuess - Initial guess for solution vector
   * @param {object} [options] - Optional parameters for the solver, such as `maxIterations` and `tolerance`
   * @returns {Promise<object>} Result object containing the solution, iteration count, and convergence flag
   */
  async webgpuJacobiSolver(systemMatrix, rightHandSideVector, initialGuess, options = {}) {
    await this.initialize();
    const { maxIterations, tolerance } = options;
    const n = rightHandSideVector.length;
    const flatSystemMatrix = systemMatrix.flat();

    if (!this.fields || this.cachedSize !== n) {
      this.fields = {
        systemMatrixField: ti.field(ti.f32, [n * n]),
        rightHandSideField: ti.field(ti.f32, [n]),
        solutionField: ti.field(ti.f32, [n]),
        updatedSolutionField: ti.field(ti.f32, [n]),
        diagField: ti.field(ti.f32, [n]),
        maxResidualField: ti.field(ti.f32, [1]),
      };
      this.cachedSize = n;
    }

    const {
      systemMatrixField,
      rightHandSideField,
      solutionField,
      updatedSolutionField,
      diagField,
      maxResidualField,
    } = this.fields;

    systemMatrixField.fromArray(flatSystemMatrix);
    rightHandSideField.fromArray(rightHandSideVector);
    solutionField.fromArray(initialGuess);
    updatedSolutionField.fromArray(initialGuess);

    ti.addToKernelScope({
      systemMatrixField,
      rightHandSideField,
      solutionField,
      updatedSolutionField,
      diagField,
      maxResidualField,
    });
    if (!this.extractDiagonalKernel) {
      this.extractDiagonalKernel = ti.kernel((size) => {
        for (let i of ti.ndrange(size)) {
          diagField[i] = systemMatrixField[ti.i32(i) * ti.i32(size) + ti.i32(i)];
        }
      });

      this.jacobiStepKernel = ti.kernel((size) => {
        maxResidualField[0] = 0.0;
        for (let i of ti.ndrange(size)) {
          let sum = 0.0;
          for (let j of ti.ndrange(size)) {
            sum += systemMatrixField[ti.i32(i) * ti.i32(size) + ti.i32(j)] * solutionField[j];
          }
          const residual = rightHandSideField[i] - sum;
          updatedSolutionField[i] = solutionField[i] + residual / diagField[i];
          ti.atomicMax(maxResidualField[0], ti.abs(residual));
        }
      });

      this.swapSolutionKernel = ti.kernel((size) => {
        for (let i of ti.ndrange(size)) {
          solutionField[i] = updatedSolutionField[i];
        }
      });
    }

    this.extractDiagonalKernel(n);

    const residualCheckInterval = Math.max(1, Math.min(10, Math.floor(maxIterations / 4) || 1));
    let iterations = maxIterations;
    let converged = false;

    for (let iter = 0; iter < maxIterations; iter++) {
      this.jacobiStepKernel(n);
      this.swapSolutionKernel(n);

      const shouldCheckResidual = (iter + 1) % residualCheckInterval === 0 || iter === maxIterations - 1;
      if (!shouldCheckResidual) {
        continue;
      }

      const rnorm = (await maxResidualField.toArray())[0];
      iterations = iter + 1;
      debugLog(`Jacobi: Iteration ${iterations}, residual norm: ${rnorm}`);
      if (rnorm < tolerance) {
        converged = true;
        break;
      }
    }

    if (!converged) {
      errorLog(`Jacobi: Did not converge in ${maxIterations} iterations`);
    }

    return {
      solutionVector: await solutionField.toArray(),
      iterations,
      converged,
    };
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
