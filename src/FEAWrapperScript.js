//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

// import * as Comlink from "https://unpkg.com/comlink/dist/esm/comlink.mjs";
// The Web Worker functionality now uses the local Comlink library to avoid CORS issues
import * as Comlink from "./vendor/comlink.mjs";
import { FEAScriptModel } from "./FEAScript.js";
import { create, all } from "https://cdn.jsdelivr.net/npm/mathjs@latest/+esm";

const math = create(all);

globalThis.math = math;

class FEAWorkerWrapper {
  /**
   * Constructor to initialize the FEAWorkerWrapper class.
   * Creates an instance of the FEAScriptModel.
   * @throws Will throw an error if the FEAScriptModel fails to initialize.
   */
  constructor() {
    try {
      this.model = new FEAScriptModel();
    } catch (error) {
      console.error("FEA Worker: Error initializing FEAScriptModel", error);
      throw error;
    }
  }

  /**
   * Sets the solver configuration in the FEAScriptModel.
   * @param {string} solverConfig - The solver configuration to set.
   * @returns {boolean} Returns true if the configuration is set successfully.
   * @throws Will throw an error if the configuration fails to set.
   */
  setSolverConfig(solverConfig) {
    try {
      this.model.setSolverConfig(solverConfig);
      return true;
    } catch (error) {
      console.error("FEA Worker: Error in setSolverConfig", error);
      throw error;
    }
  }

  /**
   * Sets the mesh configuration in the FEAScriptModel.
   * @param {object} meshConfig - The mesh configuration to set.
   * @returns {boolean} Returns true if the configuration is set successfully.
   * @throws Will throw an error if the configuration fails to set.
   */
  setMeshConfig(meshConfig) {
    try {
      this.model.setMeshConfig(meshConfig);
      return true;
    } catch (error) {
      console.error("FEA Worker: Error in setMeshConfig", error);
      throw error;
    }
  }

  /**
   * Adds a boundary condition to the FEAScriptModel.
   * @param {string} boundaryKey - The key identifying the boundary.
   * @param {array} condition - The boundary condition to add.
   * @returns {boolean} Returns true if the boundary condition is added successfully.
   * @throws Will throw an error if the boundary condition fails to add.
   */
  addBoundaryCondition(boundaryKey, condition) {
    try {
      this.model.addBoundaryCondition(boundaryKey, condition);
      return true;
    } catch (error) {
      console.error("FEA Worker: Error in addBoundaryCondition", error);
      throw error;
    }
  }

  /**
   * Sets the solver method in the FEAScriptModel.
   * @param {string} solverMethod - The solver method to set.
   * @returns {boolean} Returns true if the solver method is set successfully.
   * @throws Will throw an error if the solver method fails to set.
   */
  setSolverMethod(solverMethod) {
    try {
      this.model.setSolverMethod(solverMethod);
      return true;
    } catch (error) {
      console.error("FEA Worker: Error in setSolverMethod", error);
      throw error;
    }
  }

  /**
   * Solves the problem using the FEAScriptModel.
   * @returns {object} Returns the solution result, including the solution vector, node coordinates, solver configuration, and mesh dimension.
   * @throws Will throw an error if the solve operation fails.
   */
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

  /**
   * Retrieves model information from the FEAScriptModel.
   * @returns {object} Returns the model information, including solver configuration, mesh configuration, boundary conditions, and solver method.
   * @throws Will throw an error if the model information fails to retrieve.
   */
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

  /**
   * Simple ping method to check if the worker is responsive.
   * @returns {boolean} Returns true to indicate the worker is available.
   */
  ping() {
    try {
      return true;
    } catch (error) {
      console.error("FEA Worker: Error in ping", error);
      throw error;
    }
  }
}

Comlink.expose(FEAWorkerWrapper);
