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
import { solveLinearSystemAsync } from "./methods/linearSystemSolverScript.js";
import { prepareMesh } from "./mesh/meshUtilsScript.js";
import { assembleFrontPropagationMat } from "./solvers/frontPropagationScript.js";
import { assembleGeneralFormPDEMat, assembleGeneralFormPDEFront } from "./solvers/generalFormPDEScript.js";
import { assembleHeatConductionMat, assembleHeatConductionFront } from "./solvers/heatConductionScript.js";
import { runFrontalSolver } from "./methods/frontalSolverScript.js";
import { basicLog, debugLog, warnLog, errorLog } from "./utilities/loggingScript.js";

/**
 * Class to implement finite element analysis in JavaScript
 * @param {string} solverConfig - Parameter specifying the type of solver
 * @param {object} meshConfig - Object containing computational mesh details
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @returns {object} An object containifng the solution vector and additional mesh information
 */
export class FEAScriptModel {
  constructor() {
    this.solverConfig = null;
    this.meshConfig = {};
    this.boundaryConditions = {};
    this.solverMethod = "lusolve"; // Default solver method
    this.coefficientFunctions = null; // Add storage for coefficient functions
    warnLog(
      "FEAScript is provided “as is” without any warranty. The authors are not responsible for any damages or losses that may result from using the software. See the license for more details: https://github.com/FEAScript/FEAScript-core/blob/main/LICENSE"
    );
    basicLog("FEAScriptModel instance created");
  }

  /**
   * Sets the solver configuration
   * @param {string} solverConfig - Parameter specifying the type of solver
   * @param {object} [options] - Optional additional configuration
   */
  setSolverConfig(solverConfig, options = {}) {
    this.solverConfig = solverConfig;

    // Store coefficient functions if provided
    if (options && options.coefficientFunctions) {
      this.coefficientFunctions = options.coefficientFunctions;
      debugLog("Coefficient functions set");
    }

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

  async solveWithWebgpu(computeEngine) {
    if (!this.solverConfig || !this.meshConfig || !this.boundaryConditions) {
      errorLog("Solver config, mesh config, and boundary conditions must be set before solving.");
    }

    let jacobianMatrix = [];
    let residualVector = [];
    let solutionVector = [];
    let nodesCoordinates = {};

    // Prepare the mesh
    basicLog("Preparing mesh...");
    const meshData = prepareMesh(this.meshConfig);
    basicLog("Mesh preparation completed");

    // Extract node coordinates from meshData
    nodesCoordinates = {
      nodesXCoordinates: meshData.nodesXCoordinates,
      nodesYCoordinates: meshData.nodesYCoordinates,
    };

    // Assembly matrices
    basicLog("Beginning matrix assembly...");
    console.time("assemblyMatrices");
    if (this.solverConfig === "solidHeatTransferScript") {
      basicLog(`Using solver: ${this.solverConfig}`);
      ({ jacobianMatrix, residualVector } = assembleHeatConductionMat(
        meshData,
        this.boundaryConditions
      ));
    }
    console.timeEnd("assemblyMatrices");
    basicLog("Matrix assembly completed");

    // System solving with WebGPU Jacobi
    basicLog("Solving system using WebGPU Jacobi...");
    console.time("systemSolving");

    // Convert matrices to arrays for WebGPU
    const A = Array.isArray(jacobianMatrix) ? jacobianMatrix : jacobianMatrix.toArray();
    const b = Array.isArray(residualVector) ? residualVector : residualVector.toArray();

    // For heat conduction FEM, the matrix might be negative definite
    console.log("Matrix diagonal sample:", A.slice(0, 5).map((row, i) => row[i]));
    console.log("RHS sample:", b.slice(0, 5));

    // Use WebGPU Jacobi method
    const initialGuess = new Array(b.length).fill(0);
    solutionVector = await computeEngine.jacobiSolve(A, b, initialGuess, 10000, 1e-3);

    console.timeEnd("systemSolving");
    basicLog("System solved successfully with WebGPU Jacobi");

    return { solutionVector, nodesCoordinates };
  }

  solve() {
    if (!this.solverConfig || !this.meshConfig || !this.boundaryConditions) {
      errorLog("Solver config, mesh config, and boundary conditions must be set before solving.");
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
    if (this.solverConfig === "heatConductionScript") {
      basicLog(`Using solver: ${this.solverConfig}`);

      // Check if using frontal solver
      if (this.solverMethod === "frontal") {
        const frontalResult = runFrontalSolver(
          assembleHeatConductionFront,
          meshData,
          this.boundaryConditions
        );
        solutionVector = frontalResult.solutionVector;
      } else {
        // Use regular linear solver methods
        ({ jacobianMatrix, residualVector } = assembleHeatConductionMat(meshData, this.boundaryConditions));
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
    } else if (this.solverConfig === "generalFormPDEScript") {
      basicLog(`Using solver: ${this.solverConfig}`);
      // Check if using frontal solver
      if (this.solverMethod === "frontal") {
        errorLog(
          "Frontal solver is not yet supported for generalFormPDEScript. Please use 'lusolve' or 'jacobi'."
        );
      } else {
        // Use regular linear solver methods
        ({ jacobianMatrix, residualVector } = assembleGeneralFormPDEMat(
          meshData,
          this.boundaryConditions,
          this.coefficientFunctions
        ));

        const linearSystemResult = solveLinearSystem(this.solverMethod, jacobianMatrix, residualVector);
        solutionVector = linearSystemResult.solutionVector;
      }
    }
    console.timeEnd("totalSolvingTime");
    basicLog("Solving process completed");

    return { solutionVector, nodesCoordinates };
  }

  async solveAsync(computeEngine, options = {}) {
    if (!this.solverConfig || !this.meshConfig || !this.boundaryConditions) {
      errorLog("Solver config, mesh config, and boundary conditions must be set before solving.");
    }

    let jacobianMatrix = [];
    let residualVector = [];
    let solutionVector = [];

    basicLog("Preparing mesh...");
    const meshData = prepareMesh(this.meshConfig);
    basicLog("Mesh preparation completed");
    const nodesCoordinates = {
      nodesXCoordinates: meshData.nodesXCoordinates,
      nodesYCoordinates: meshData.nodesYCoordinates,
    };

    basicLog("Beginning solving process...");
    console.time("totalSolvingTime");

    if (this.solverConfig === "heatConductionScript") {

      ({ jacobianMatrix, residualVector } = assembleHeatConductionMat(meshData, this.boundaryConditions));

      if (this.solverMethod === "jacobi-gpu") {
        const { solutionVector: x } = await solveLinearSystemAsync("jacobi-gpu", jacobianMatrix, residualVector, {
          computeEngine,
          maxIterations: options.maxIterations,
          tolerance: options.tolerance,
        });
        solutionVector = x;
      } else {
        const { solutionVector: x } = solveLinearSystem(this.solverMethod, jacobianMatrix, residualVector);
        solutionVector = x;
      }
    }
    console.timeEnd("totalSolvingTime");
    basicLog("Solving process completed");

    return { solutionVector, nodesCoordinates };
  }
}
