/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// External imports
import * as Comlink from "../vendor/comlink.mjs";
import * as ti from "../vendor/taichi.esm.js";

// Internal imports
import { WebGPUComputeEngine } from "../solvers/webgpuJacobiSolver.js";

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
  async initialize(powerPreference = "high-performance") {
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
   * @param {array} systemMatrix - The system matrix
   * @param {array} rightHandSideVector - The right-hand side vector
   * @param {array} initialGuess - The initial guess
   * @param {object} [options] - Optional parameters for the solver, such as `maxIterations` and `tolerance`
   * @returns {Promise<object>} An object containing the solution vector, iterations, and convergence status
   */
  async webgpuJacobiSolver(systemMatrix, rightHandSideVector, initialGuess, options = {}) {
    await this.initialize();
    return this.computeEngine.webgpuJacobiSolver(systemMatrix, rightHandSideVector, initialGuess, options);
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
