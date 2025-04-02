import * as Comlink from "https://unpkg.com/comlink/dist/esm/comlink.mjs";
import { FEAScriptModel } from "./FEAScript.js";
import { create, all } from "https://cdn.jsdelivr.net/npm/mathjs@latest/+esm";

const math = create(all);

globalThis.math = math;

class FEAWorkerWrapper {
  constructor() {
    try {
      this.model = new FEAScriptModel();
    } catch (error) {
      console.error("FEA Worker: Error initializing FEAScriptModel", error);
      throw error;
    }
  }

  setSolverConfig(solverConfig) {
    try {
      this.model.setSolverConfig(solverConfig);
      return true;
    } catch (error) {
      console.error("FEA Worker: Error in setSolverConfig", error);
      throw error;
    }
  }

  setMeshConfig(meshConfig) {
    try {
      this.model.setMeshConfig(meshConfig);
      return true;
    } catch (error) {
      console.error("FEA Worker: Error in setMeshConfig", error);
      throw error;
    }
  }

  addBoundaryCondition(boundaryKey, condition) {
    try {
      this.model.addBoundaryCondition(boundaryKey, condition);
      return true;
    } catch (error) {
      console.error("FEA Worker: Error in addBoundaryCondition", error);
      throw error;
    }
  }

  setSolverMethod(solverMethod) {
    try {
      this.model.setSolverMethod(solverMethod);
      return true;
    } catch (error) {
      console.error("FEA Worker: Error in setSolverMethod", error);
      throw error;
    }
  }

  solve() {
    try {
      const result = this.model.solve();

      return {
        solutionVector: result.solutionVector,
        nodesCoordinates: result.nodesCoordinates,
        solverConfig: this.model.solverConfig,
        meshDimension: this.model.meshConfig.meshDimension,
      };
    } catch (error) {
      console.error("FEA Worker: Error in solve", error);
      throw error;
    }
  }
  getModelInfo() {
    try {
      return {
        solverConfig: this.model.solverConfig,
        meshConfig: this.model.meshConfig,
        boundaryConditions: this.model.boundaryConditions,
        solverMethod: this.model.solverMethod,
      };
    } catch (error) {
      console.error("FEA Worker: Error in getModelInfo", error);
      throw error;
    }
  }
}

Comlink.expose(FEAWorkerWrapper);
