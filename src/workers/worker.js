/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// External imports
import * as Comlink from "../vendor/comlink.mjs";

// Internal imports
import { serializeFunctions } from "./functionSerialization.js";
import "./errorTransfer.js"; // Keeps the code of a FEAScriptError thrown in the worker

const readyTimeout = 50000; // Milliseconds. A slow connection can take a while to load the worker bundle

/**
 * Class to facilitate communication with web workers for FEAScript operations
 */
export class FEAScriptWorker {
  /**
   * Constructor to initialize the FEAScriptWorker class
   * Sets up the worker and initializes the workerWrapper
   */
  constructor() {
    this.worker = null;
    this.feaWorker = null;
    this.isReady = false;

    this.started = this._initWorker();
  }

  /**
   * Function to initialize the web worker and wrap it using Comlink
   * @private
   * @throws Will throw an error if the worker fails to initialize
   */
  async _initWorker() {
    try {
      // Determine the worker file based on how this module was loaded:
      //   - Source mode (URL contains /src/workers/): use the pre-built bundle so that
      //     all bare-specifier deps (mathjs, @stdlib/*) are inlined; Firefox module
      //     workers do not inherit the page's import map so bare specifiers would fail.
      //   - Bundle mode (feascript.esm.js in dist/): the worker bundle is a sibling file.
      const base = import.meta.url;
      const workerFile = base.includes("/src/workers/")
        ? "../../dist/feascript-worker.esm.js"
        : "./feascript-worker.esm.js";
      const wrapperUrl = new URL(workerFile, base).href;
      const workerCode = `import "${wrapperUrl}";`;
      const blob = new Blob([workerCode], { type: "application/javascript" });
      this.worker = new Worker(URL.createObjectURL(blob), {
        type: "module",
      });

      this.worker.onerror = (event) => {
        console.error("FEAScriptWorker: Worker error:", event);
      };
      const workerWrapper = Comlink.wrap(this.worker);

      this.feaWorker = await new workerWrapper();

      this.isReady = true;
    } catch (error) {
      console.error("Failed to initialize worker", error);
      throw error;
    }
  }

  /**
   * Function to ensure that the worker is ready before performing any operations
   * @private
   * @returns {Promise<void>} Resolves as soon as the worker is ready
   * @throws Will throw an error if the worker fails to start, or is not ready within the timeout period
   */
  async _ensureReady() {
    if (this.isReady) return;

    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("Timeout waiting for worker to be ready")), readyTimeout);
    });
    try {
      await Promise.race([this.started, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Function to set the model configuration in the worker
   * @param {string} modelConfig - The model configuration to set
   * @param {object} [options] - Optional additional configuration, as in FEAScriptModel.setModelConfig. The
   *  coefficient functions are sent to the worker as source code, so they must be self-contained (no outer variables)
   * @returns {Promise<boolean>} Resolves when the configuration is set
   */
  async setModelConfig(modelConfig, options = {}) {
    await this._ensureReady();
    return this.feaWorker.setModelConfig(modelConfig, serializeFunctions(options));
  }

  /**
   * Function to set the mesh configuration in the worker
   * @param {object} meshConfig - The mesh configuration to set
   * @returns {Promise<boolean>} Resolves when the configuration is set
   */
  /**
   * Function to set the geometry in the worker
   * @param {object} geometry - The geometry, as in FEAScriptModel.setGeometry
   * @returns {Promise<boolean>} Resolves when the geometry is set
   */
  async setGeometry(geometry) {
    await this.ensureInitialized();
    return this.feaWorker.setGeometry(geometry);
  }

  /**
   * Function to set the mesh in the worker directly (a mesh of importGmshMesh, generateTriangleMesh or
   * generateQuadrilateralMesh)
   * @param {object} mesh - The mesh object, as in FEAScriptModel.setMesh
   * @returns {Promise<boolean>} Resolves when the mesh is set
   */
  async setMesh(mesh) {
    await this.ensureInitialized();
    return this.feaWorker.setMesh(mesh);
  }

  async setMeshConfig(meshConfig) {
    await this._ensureReady();
    return this.feaWorker.setMeshConfig(serializeFunctions(meshConfig));
  }

  /**
   * Function to add a boundary condition to the worker
   * @param {string} boundaryKey - The key identifying the boundary
   * @param {array} condition - The boundary condition to add
   * @returns {Promise<boolean>} Resolves when the boundary condition is added
   */
  async addBoundaryCondition(boundaryKey, condition) {
    await this._ensureReady();
    return this.feaWorker.addBoundaryCondition(boundaryKey, condition);
  }

  /**
   * Function to set the solver method in the worker
   * @param {string} solverMethod - The solver method to set
   * @returns {Promise<boolean>} Resolves when the solver method is set
   */
  async setSolverMethod(solverMethod) {
    await this._ensureReady();
    return this.feaWorker.setSolverMethod(solverMethod);
  }

  /**
   * Function to request the worker to solve the problem
   * @param {object} [options] - Additional parameters for the solver, such as `maxIterations` and `tolerance`
   * @returns {Promise<object>} Resolves with the solution result
   */
  async solve(options = {}) {
    await this._ensureReady();
    return this.feaWorker.solve(options);
  }

  /**
   * Function to retrieve model information from the worker
   * @returns {Promise<object>} Resolves with the model information
   */
  async getModelInfo() {
    await this._ensureReady();
    return this.feaWorker.getModelInfo();
  }

  /**
   * Function to send a ping request to the worker to check its availability
   * @returns {Promise<boolean>} Resolves if the worker responds
   */
  async ping() {
    await this._ensureReady();
    return this.feaWorker.ping();
  }

  /**
   * Function to terminate the worker and clean up resources
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.feaWorker = null;
      this.isReady = false;
    }
  }
}
