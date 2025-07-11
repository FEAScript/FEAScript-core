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
import { jacobiMethod } from "./methods/jacobiMethodScript.js";
import { newtonRaphson } from "./methods/newtonRaphsonScript.js";
import { solveLinearSystem } from "./methods/linearSystemScript.js";
import { assembleFrontPropagationMat } from "./solvers/frontPropagationScript.js";
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
    debugLog(`Mesh config set with dimensions: ${meshConfig.meshDimension}`);
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

    // Select and execute the appropriate solver based on solverConfig
    basicLog("Beginning solving process...");
    console.time("totalSolvingTime");
    if (this.solverConfig === "solidHeatTransferScript") {
      basicLog(`Using solver: ${this.solverConfig}`);
      ({ jacobianMatrix, residualVector, nodesCoordinates } = assembleSolidHeatTransferMat(
        this.meshConfig,
        this.boundaryConditions
      ));

      // Solve the assembled linear system
      const linearSystemResult = solveLinearSystem(this.solverMethod, jacobianMatrix, residualVector);
      solutionVector = linearSystemResult.solutionVector;
    } else if (this.solverConfig === "frontPropagationScript") {
      basicLog(`Using solver: ${this.solverConfig}`);
      let eikonalActivationFlag = 0; // Parameterization flag (from 0 to 1)
      const initialEikonalViscousTerm = 0.1; // Initial viscous term for the front propagation (eikonal) equation
      let eikonalViscousTerm = 1 - eikonalActivationFlag + initialEikonalViscousTerm; // Viscous term for the front propagation (eikonal) equation

      // Create context object with all necessary properties
      const context = {
        meshConfig: this.meshConfig,
        boundaryConditions: this.boundaryConditions,
        eikonalActivationFlag,
        eikonalViscousTerm,
        solverMethod: this.solverMethod,
      };

      while (eikonalActivationFlag <= 1) {
        // Use Newton-Raphson to iterate
        const newtonRaphsonResult = newtonRaphson(
          assembleFrontPropagationMat, // Pass the function reference
          context,
          100, // maxIterations
          1e-7 // tolerance
        );

        // Extract results
        jacobianMatrix = newtonRaphsonResult.jacobianMatrix;
        residualVector = newtonRaphsonResult.residualVector;
        nodesCoordinates = newtonRaphsonResult.nodesCoordinates;
        solutionVector = newtonRaphsonResult.solution;

        // Increment eikonalActivationFlag for next step
        eikonalActivationFlag += 0.1;
      }
    }
    console.timeEnd("totalSolvingTime");
    basicLog("Solving process completed");

    return { solutionVector, nodesCoordinates };
  }
}
