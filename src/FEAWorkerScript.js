import * as Comlink from "https://unpkg.com/comlink/dist/esm/comlink.mjs";
import { basicLog } from "./utilities/utilitiesScript.js";

export class FEAWorkerScript {
  constructor() {
    this.worker = null;
    this.feaWorker = null;
    this.isReady = false;

    this._initWorker();
  }

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

  async setSolverConfig(solverConfig) {
    await this._ensureReady();
    basicLog(`FEAWorkerScript: Setting solver config to: ${solverConfig}`);
    return this.feaWorker.setSolverConfig(solverConfig);
  }

  async setMeshConfig(meshConfig) {
    await this._ensureReady();
    basicLog(`FEAWorkerScript: Setting mesh config`);
    return this.feaWorker.setMeshConfig(meshConfig);
  }

  async addBoundaryCondition(boundaryKey, condition) {
    await this._ensureReady();
    basicLog(
      `FEAWorkerScript: Adding boundary condition for boundary: ${boundaryKey}`
    );
    return this.feaWorker.addBoundaryCondition(boundaryKey, condition);
  }

  async setSolverMethod(solverMethod) {
    await this._ensureReady();
    basicLog(`FEAWorkerScript: Setting solver method to: ${solverMethod}`);
    return this.feaWorker.setSolverMethod(solverMethod);
  }

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

  async getModelInfo() {
    await this._ensureReady();
    return this.feaWorker.getModelInfo();
  }

  async ping() {
    await this._ensureReady();
    return this.feaWorker.ping();
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.feaWorker = null;
      this.isReady = false;
    }
  }
}
