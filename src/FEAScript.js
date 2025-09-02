//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

// Internal imports
import { solveLinearSystem } from "./methods/linearSystemSolverScript.js";
import { assembleSolidHeatTransferMat } from "./solvers/solidHeatTransferScript.js";
import { basicLog, debugLog, errorLog } from "./utilities/loggingScript.js";

/**
 * Class to implement finite element analysis in JavaScript
 * @param {string} solverConfig - Parameter specifying the type of solver
 * @param {object} meshConfig - Object containing computational mesh details
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @returns {object} An object containing the solution vector and additional mesh information
 */
export class FEAScriptModel {
  constructor() {
    this.solverConfig = null;
    this.meshConfig = {};
    this.boundaryConditions = {};
    this.solverMethod = "lusolve"; // Default solver method
    basicLog("FEAScriptModel instance created");
  }

  setSolverConfig(solverConfig) {
    this.solverConfig = solverConfig;
    debugLog(`Solver config set to: ${solverConfig}`);
  }

  setMeshConfig(meshConfig) {
    this.meshConfig = meshConfig;
    debugLog(
      `Mesh config set with dimensions: ${meshConfig.meshDimension}`
    );
  }

  addBoundaryCondition(boundaryKey, condition) {
    this.boundaryConditions[boundaryKey] = condition;
    debugLog(`Boundary condition added for boundary: ${boundaryKey}, type: ${condition[0]}`);
  }

  setSolverMethod(solverMethod) {
    this.solverMethod = solverMethod;
    debugLog(`Solver method set to: ${solverMethod}`);
  }

  solve() {
    if (!this.solverConfig || !this.meshConfig || !this.boundaryConditions) {
      const error = "Solver config, mesh config, and boundary conditions must be set before solving.";
      console.error(error);
      throw new Error(error);
    }

    let jacobianMatrix = [];
    let residualVector = [];
    let solutionVector = [];
    let nodesCoordinates = {};

    // Assembly matrices
    basicLog("Beginning matrix assembly...");
    console.time("assemblyMatrices");
    if (this.solverConfig === "solidHeatTransferScript") {
      basicLog(`Using solver: ${this.solverConfig}`);
      ({ jacobianMatrix, residualVector, nodesCoordinates } = assembleSolidHeatTransferMat(
        this.meshConfig,
        this.boundaryConditions
      ));
    }
    console.timeEnd("assemblyMatrices");
    basicLog("Matrix assembly completed");

    // System solving
    basicLog(`Solving system using ${this.solverMethod}...`);
    console.time("systemSolving");
    
    // Use the centralized linear system solver
    const linearSystemResult = solveLinearSystem(this.solverMethod, jacobianMatrix, residualVector);
    solutionVector = linearSystemResult.solutionVector;
    
    // Log convergence information for iterative methods
    if (linearSystemResult.iterations !== undefined) {
      if (linearSystemResult.converged) {
        debugLog(`${this.solverMethod} method converged in ${linearSystemResult.iterations} iterations`);
      } else {
        debugLog(`${this.solverMethod} method did not converge after ${linearSystemResult.iterations} iterations`);
      }
    }
    
    console.timeEnd("systemSolving");
    basicLog("System solved successfully");

    return { solutionVector, nodesCoordinates };
  }
}
