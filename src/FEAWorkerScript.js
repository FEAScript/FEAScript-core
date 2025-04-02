//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

import * as Comlink from "https://unpkg.com/comlink/dist/esm/comlink.mjs";
import { basicLog } from "./utilities/utilitiesScript.js";

export class FEAWorkerScript {
  /**
   * Constructor to initialize the FEAWorkerScript class
   * Sets up the worker and initializes the FEAWorkerWrapper.
   */
  constructor() {
    this.worker = null;
    this.feaWorker = null;
    this.isReady = false;

    this._initWorker();
  }

  /**
   * Initializes the web worker and wraps it using Comlink.
   * @private
   * @throws Will throw an error if the worker fails to initialize.
   */
  async _initWorker() {
    try {
      this.worker = new Worker(
        new URL("./FEAWrapperScript.js", import.meta.url),
        {
          type: "module",
        }
      );

      this.worker.onerror = (event) => {
        console.error("FEAWorkerScript: Worker error:", event);
      };
      const FEAWorkerWrapper = Comlink.wrap(this.worker);

      this.feaWorker = await new FEAWorkerWrapper();

      this.isReady = true;
    } catch (error) {
      console.error("Failed to initialize worker", error);
      throw error;
    }
  }

  /**
   * Ensures that the worker is ready before performing any operations.
   * @private
   * @returns {Promise<void>} Resolves when the worker is ready.
   * @throws Will throw an error if the worker is not ready within the timeout period.
   */
  async _ensureReady() {
    if (this.isReady) return Promise.resolve();

    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max

      const checkReady = () => {
        attempts++;
        if (this.isReady) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error("Timeout waiting for worker to be ready"));
        } else {
          setTimeout(checkReady, 1000);
        }
      };
      checkReady();
    });
  }

  /**
   * Sets the solver configuration in the worker.
   * @param {string} solverConfig - The solver configuration to set.
   * @returns {Promise<boolean>} Resolves when the configuration is set.
   */
  async setSolverConfig(solverConfig) {
    await this._ensureReady();
    basicLog(`FEAWorkerScript: Setting solver config to: ${solverConfig}`);
    return this.feaWorker.setSolverConfig(solverConfig);
  }

  /**
   * Sets the mesh configuration in the worker.
   * @param {object} meshConfig - The mesh configuration to set.
   * @returns {Promise<boolean>} Resolves when the configuration is set.
   */
  async setMeshConfig(meshConfig) {
    await this._ensureReady();
    basicLog(`FEAWorkerScript: Setting mesh config`);
    return this.feaWorker.setMeshConfig(meshConfig);
  }

  /**
   * Adds a boundary condition to the worker.
   * @param {string} boundaryKey - The key identifying the boundary.
   * @param {array} condition - The boundary condition to add.
   * @returns {Promise<boolean>} Resolves when the boundary condition is added.
   */
  async addBoundaryCondition(boundaryKey, condition) {
    await this._ensureReady();
    basicLog(
      `FEAWorkerScript: Adding boundary condition for boundary: ${boundaryKey}`
    );
    return this.feaWorker.addBoundaryCondition(boundaryKey, condition);
  }

  /**
   * Sets the solver method in the worker.
   * @param {string} solverMethod - The solver method to set.
   * @returns {Promise<boolean>} Resolves when the solver method is set.
   */
  async setSolverMethod(solverMethod) {
    await this._ensureReady();
    basicLog(`FEAWorkerScript: Setting solver method to: ${solverMethod}`);
    return this.feaWorker.setSolverMethod(solverMethod);
  }

  /**
   * Requests the worker to solve the problem.
   * @returns {Promise<object>} Resolves with the solution result.
   */
  async solve() {
    await this._ensureReady();
    basicLog("FEAWorkerScript: Requesting solution from worker...");

    const startTime = performance.now();
    const result = await this.feaWorker.solve();
    const endTime = performance.now();

    basicLog(
      `FEAWorkerScript: Solution completed in ${(
        (endTime - startTime) /
        1000
      ).toFixed(2)}s`
    );
    return result;
  }

  /**
   * Retrieves model information from the worker.
   * @returns {Promise<object>} Resolves with the model information.
   */
  async getModelInfo() {
    await this._ensureReady();
    return this.feaWorker.getModelInfo();
  }

  /**
   * Sends a ping request to the worker to check its availability.
   * @returns {Promise<boolean>} Resolves if the worker responds.
   */
  async ping() {
    await this._ensureReady();
    return this.feaWorker.ping();
  }

  /**
   * Terminates the worker and cleans up resources.
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
