/**
 * ════════════════════════════════════════════════════════════
 *  FEAScript Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.1.4 | https://feascript.com
 * ════════════════════════════════════════════════════════════
 */

// External imports
import * as Comlink from "../vendor/comlink.mjs";
import * as ti from "../vendor/taichi.esm.js";

// Internal imports
import { WebGPUComputeEngine } from "../methods/webgpuJacobiSolverScript.js";

/**
 * Worker for handling FEAScript WebGPU Jacobi solver computations
 */
class webgpuFEAScriptWorker {
  /**
   * Constructor to create the compute engine instance
   */
  constructor() {
    this.computeEngine = null;
    this.initialized = false;
  }

  /**
   * Function to initialize the WebGPU worker and compute engine
   * @param {string} [powerPreference='high-performance'] - The power preference for the GPU adapter
   */
  async initialize(powerPreference = 'high-performance') {
    if (!this.initialized) {
      const originalRequestAdapter = navigator.gpu.requestAdapter.bind(navigator.gpu);
      navigator.gpu.requestAdapter = async (options = {}) => {
        return originalRequestAdapter({ ...options, powerPreference });
      };

      await ti.init();
      this.initialized = true;
    }
    if (!this.computeEngine) {
      this.computeEngine = new WebGPUComputeEngine();
    }
  }

  /**
   * Function to solve a linear system using the Jacobi method
   * @param {array} A - The system matrix
   * @param {array} b - The right-hand side vector
   * @param {array} x0 - The initial guess
   * @param {object} [options] - Additional options for the solver
   * @param {number} [options.maxIterations=1000] - The maximum number of iterations
   * @param {number} [options.tolerance=1e-6] - The convergence tolerance
   * @returns {Promise<object>} An object containing the solution vector, iterations, and convergence status
   */
  async webgpuJacobiSolver(A, b, x0, options = {}) {
    await this.initialize();
    const { maxIterations, tolerance } = options;
    return this.computeEngine.webgpuJacobiSolver(A, b, x0, maxIterations, tolerance);
  }

  /**
   * Function to destroy the compute engine and release resources
   */
  async destroy() {
    if (this.computeEngine) {
      this.computeEngine.destroy();
      this.computeEngine = null;
    }
    this.initialized = false;
  }
}

Comlink.expose(new webgpuFEAScriptWorker());