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
import * as Comlink from "../vendor/comlink.mjs";
import * as ti from "../vendor/taichi.esm.js";

// Internal imports
import { WebGPUComputeEngine } from "../methods/webgpuComputeEngineScript.js";

/**
 * Worker for handling FEAScript WebGPU computations
 */
class webgpuFEAScriptWorker {
  /**
   * Function to construct the WebGPU worker
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
   * Function to perform vector addition
   * @param {array} a - The first vector
   * @param {array} b - The second vector
   * @returns {array} The resulting vector
   */
  async vecAdd(a, b) {
    await this.initialize();
    return this.computeEngine.vecAdd(a, b);
  }

  /**
   * Function to perform matrix-vector multiplication
   * @param {array} A - The matrix
   * @param {array} x - The vector
   * @returns {array} The resulting vector
   */
  async matVecMul(A, x) {
    await this.initialize();
    return this.computeEngine.matVecMul(A, x);
  }

  /**
   * Function to transpose a matrix
   * @param {array} A - The matrix to transpose
   * @returns {array} The transposed matrix
   */
  async transpose(A) {
    await this.initialize();
    return this.computeEngine.transpose(A);
  }

  /**
   * Function to extract the diagonal of a matrix
   * @param {array} A - The input matrix
   * @returns {array} The diagonal vector
   */
  async diagonal(A) {
    await this.initialize();
    return this.computeEngine.diagonal(A);
  }

  /**
   * Function to perform sparse matrix-vector multiplication
   * @param {object} sparseMatrix - The sparse matrix in CSR format
   * @param {array} x - The vector
   * @returns {array} The resulting vector
   */
  async sparseMatVecMul(sparseMatrix, x) {
    await this.initialize();
    return this.computeEngine.sparseMatVecMul(sparseMatrix, x);
  }

  /**
   * Function to compute the dot product of two vectors
   * @param {array} a - The first vector
   * @param {array} b - The second vector
   * @returns {number} The dot product
   */
  async dotProduct(a, b) {
    await this.initialize();
    return this.computeEngine.dotProduct(a, b);
  }

  /**
   * Function to compute the L2 norm of a vector
   * @param {array} vector - The input vector
   * @returns {number} The L2 norm
   */
  async norm(vector) {
    await this.initialize();
    return this.computeEngine.norm(vector);
  }

  /**
   * Function to normalize a vector
   * @param {array} vector - The vector to normalize
   * @returns {array} The normalized vector
   */
  async normalize(vector) {
    await this.initialize();
    return this.computeEngine.normalize(vector);
  }

  /**
   * Function to create a deep copy of a vector or matrix
   * @param {array} data - The data to copy
   * @returns {array} The copied data
   */
  async copy(data) {
    await this.initialize();
    return this.computeEngine.copy(data);
  }

  /**
   * Function to fill a vector or matrix with a value
   * @param {array} data - The data structure to fill
   * @param {number} value - The value to fill with
   * @returns {array} The filled data structure
   */
  async fill(data, value) {
    await this.initialize();
    return this.computeEngine.fill(data, value);
  }

  /**
   * Function to scale a vector or matrix by a scalar
   * @param {array} data - The data to scale
   * @param {number} scalar - The scalar value
   * @returns {array} The scaled data
   */
  async scale(data, scalar) {
    await this.initialize();
    return this.computeEngine.scale(data, scalar);
  }

  /**
   * Function to compute the residual vector r = b - A*x
   * @param {array} A - The matrix
   * @param {array} x - The vector
   * @param {array} b - The right-hand side vector
   * @returns {array} The residual vector
   */
  async residual(A, x, b) {
    await this.initialize();
    return this.computeEngine.residual(A, x, b);
  }

  /**
   * Function to apply a preconditioner
   * @param {array} A - The system matrix
   * @param {array} r - The residual vector
   * @param {string} [type='jacobi'] - The preconditioner type
   * @param {number} [omega=1.0] - The relaxation factor
   * @returns {array} The result of the preconditioning step
   */
  async preconditioner(A, r, type = 'jacobi', omega = 1.0) {
    await this.initialize();
    return this.computeEngine.preconditioner(A, r, type, omega);
  }

  /**
   * Function to solve a linear system using the Conjugate Gradient method
   * @param {array} A - The system matrix
   * @param {array} b - The right-hand side vector
   * @param {array} [x0=null] - The initial guess
   * @param {number} [tol=1e-6] - The convergence tolerance
   * @param {number} [maxIter=1000] - The maximum number of iterations
   * @param {string} [preconditionerType=null] - The type of preconditioner
   * @returns {array} The solution vector
   */
  async conjugateGradient(A, b, x0 = null, tol = 1e-6, maxIter = 1000, preconditionerType = null) {
    await this.initialize();
    return this.computeEngine.conjugateGradient(A, b, x0, tol, maxIter, preconditionerType);
  }

  /**
   * Function to solve a linear system using the Jacobi method
   * @param {array} A - The system matrix
   * @param {array} b - The right-hand side vector
   * @param {array} x0 - The initial guess
   * @param {number} [maxIter=1000] - The maximum number of iterations
   * @param {number} [tol=1e-6] - The convergence tolerance
   * @returns {array} The solution vector
   */
  async webgpuJacobiSolver(A, b, x0, maxIter = 1000, tol = 1e-6) {
    await this.initialize();
    try {
      return await this.computeEngine.webgpuJacobiSolver(A, b, x0, maxIter, tol);
    } catch (e) {
      console.error('Error in webgpuJacobiSolver:', e);
      throw new Error('Jacobi solve failed: ' + e.message);
    }
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