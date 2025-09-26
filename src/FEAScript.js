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
import { newtonRaphson } from "./methods/newtonRaphsonScript.js";
import { solveLinearSystem } from "./methods/linearSystemSolverScript.js";
import { prepareMesh } from "./mesh/meshUtilsScript.js";
import { assembleFrontPropagationMat } from "./solvers/frontPropagationScript.js";
import { assembleSolidHeatTransferMat, assembleSolidHeatTransferFront } from "./solvers/solidHeatTransferScript.js";
import { runFrontalSolver } from "./methods/frontalSolverScript.js";
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

    /**
     * For consistency across both linear and nonlinear formulations,
     * this project always refers to the assembled right-hand side vector
     * as `residualVector` and the assembled system matrix as `jacobianMatrix`.
     *
     * In linear problems `jacobianMatrix` is equivalent to the
     * classic stiffness/conductivity matrix and `residualVector`
     * corresponds to the traditional load (RHS) vector.
     */

    let jacobianMatrix = [];
    let residualVector = [];
    let solutionVector = [];
    let initialSolution = [];

    // Prepare the mesh
    basicLog("Preparing mesh...");
    const meshData = prepareMesh(this.meshConfig);
    basicLog("Mesh preparation completed");

    // Extract node coordinates from meshData
    const nodesCoordinates = {
      nodesXCoordinates: meshData.nodesXCoordinates,
      nodesYCoordinates: meshData.nodesYCoordinates,
    };

    // Select and execute the appropriate solver based on solverConfig
    basicLog("Beginning solving process...");
    console.time("totalSolvingTime");
    if (this.solverConfig === "solidHeatTransferScript") {
      basicLog(`Using solver: ${this.solverConfig}`);

      // Check if using frontal solver
      if (this.solverMethod === "frontal") {
        const frontalResult = runFrontalSolver(assembleSolidHeatTransferFront, meshData, this.boundaryConditions);
        solutionVector = frontalResult.solutionVector;
      } else {
        // Use regular linear solver methods
        ({ jacobianMatrix, residualVector } = assembleSolidHeatTransferMat(
          meshData,
          this.boundaryConditions
        ));
        const linearSystemResult = solveLinearSystem(this.solverMethod, jacobianMatrix, residualVector);
        solutionVector = linearSystemResult.solutionVector;
      }
    } else if (this.solverConfig === "frontPropagationScript") {
      basicLog(`Using solver: ${this.solverConfig}`);

      // Initialize eikonalActivationFlag
      let eikonalActivationFlag = 0;
      const eikonalExteralIterations = 5; // Number of incremental steps for the eikonal equation

      // Create context object with all necessary properties
      const context = {
        meshData: meshData,
        boundaryConditions: this.boundaryConditions,
        eikonalActivationFlag: eikonalActivationFlag,
        solverMethod: this.solverMethod,
        initialSolution,
      };

      while (eikonalActivationFlag <= 1) {
        // Update the context object with current eikonalActivationFlag
        context.eikonalActivationFlag = eikonalActivationFlag;

        // Pass the previous solution as initial guess
        if (solutionVector.length > 0) {
          context.initialSolution = [...solutionVector];
        }

        // Solve the assembled non-linear system
        const newtonRaphsonResult = newtonRaphson(assembleFrontPropagationMat, context, 100, 1e-4);

        // Extract results
        jacobianMatrix = newtonRaphsonResult.jacobianMatrix;
        residualVector = newtonRaphsonResult.residualVector;
        solutionVector = newtonRaphsonResult.solutionVector;

        // Increment for next iteration
        eikonalActivationFlag += 1 / eikonalExteralIterations;
      }
    }
    console.timeEnd("totalSolvingTime");
    basicLog("Solving process completed");

    return { solutionVector, nodesCoordinates };
  }
}
