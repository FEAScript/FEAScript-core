/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { newtonRaphson } from "./methods/newtonRaphsonScript.js";
import { solveLinearSystem } from "./methods/linearSystemSolverScript.js";
import { solveLinearSystemAsync } from "./methods/linearSystemSolverScript.js";
import { prepareMesh } from "./mesh/meshUtilsScript.js";
import { assembleFrontPropagationMat } from "./models/frontPropagationScript.js";
import { assembleGeneralFormPDEMat, assembleGeneralFormPDEFront } from "./models/generalFormPDEScript.js";
import { assembleHeatConductionMat, assembleHeatConductionFront } from "./models/heatConductionScript.js";
import { runFrontalSolver } from "./methods/frontalSolverScript.js";
import { basicLog, debugLog, warnLog, errorLog } from "./utilities/loggingScript.js";

/**
 * Class to implement finite element analysis in JavaScript
 * @param {string} solverConfig - Parameter specifying the type of solver
 * @param {object} meshConfig - Object containing computational mesh details
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @returns {object} An object containifng the solution vector and mesh information
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
    warnLog("setSolverConfig() is deprecated. Use setModelConfig() instead");

    // Store coefficient functions if provided
    if (options?.coefficientFunctions) {
      this.coefficientFunctions = options.coefficientFunctions;
      debugLog("Coefficient functions set");
    }
    // Only update if a value is provided, otherwise keep the default
    if (options?.maxIterations !== undefined) {
      this.maxIterations = options.maxIterations;
    }
    if (options?.tolerance !== undefined) {
      this.tolerance = options.tolerance;
    }

    debugLog(`Solver config set to: ${solverConfig}`);
  }

  // Alias modelConfig to solverConfig (solverConfig is deprecated)
  setModelConfig(modelConfig, options = {}) {
    this.setSolverConfig(modelConfig, options);
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

  /**
   * Function to solve the finite element problem synchronously
   * @param {object} [options] - Additional parameters for the solver, such as `maxIterations` and `tolerance`
   * @returns {object} An object containing the solution vector and mesh information
   */
  solve(options = {}) {
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

    // Extract node coordinates and nodal numbering from meshData
    const nodesCoordinates = {
      nodesXCoordinates: meshData.nodesXCoordinates,
      nodesYCoordinates: meshData.nodesYCoordinates,
    };

    // Select and execute the appropriate solver based on solverConfig
    basicLog("Beginning solving process...");
    console.time("totalSolvingTime");
    basicLog(`Using solver: ${this.solverConfig}`);
    if (this.solverConfig === "heatConductionScript") {
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
        const linearSystemResult = solveLinearSystem(this.solverMethod, jacobianMatrix, residualVector, {
          maxIterations: options.maxIterations ?? this.maxIterations,
          tolerance: options.tolerance ?? this.tolerance,
        });
        solutionVector = linearSystemResult.solutionVector;
      }
    } else if (this.solverConfig === "frontPropagationScript") {
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
        // TODO: Consider using different maxIterations/tolerance for Newton-Raphson and linear solver
        maxIterations: options.maxIterations ?? this.maxIterations,
        tolerance: options.tolerance ?? this.tolerance,
      };

      while (eikonalActivationFlag <= 1) {
        // Update the context object with current eikonalActivationFlag
        context.eikonalActivationFlag = eikonalActivationFlag;

        // Pass the previous solution as initial guess
        if (solutionVector.length > 0) {
          context.initialSolution = [...solutionVector];
        }

        // Solve the assembled non-linear system
        const newtonRaphsonResult = newtonRaphson(assembleFrontPropagationMat, context);

        // Extract results
        jacobianMatrix = newtonRaphsonResult.jacobianMatrix;
        residualVector = newtonRaphsonResult.residualVector;
        solutionVector = newtonRaphsonResult.solutionVector;

        // Increment for next iteration
        eikonalActivationFlag += 1 / eikonalExteralIterations;
      }
    } else if (this.solverConfig === "generalFormPDEScript") {
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

        const linearSystemResult = solveLinearSystem(this.solverMethod, jacobianMatrix, residualVector, {
          maxIterations: options.maxIterations ?? this.maxIterations,
          tolerance: options.tolerance ?? this.tolerance,
        });
        solutionVector = linearSystemResult.solutionVector;
      }
    }
    console.timeEnd("totalSolvingTime");
    basicLog("Solving process completed");

    return { solutionVector, nodesCoordinates };
  }

  /**
   * Function to solve the finite element problem asynchronously
   * @param {object} computeEngine - The compute engine to use for the asynchronous solver (e.g., a worker or a WebGPU context)
   * @param {object} [options] - Additional parameters for the solver, such as `maxIterations` and `tolerance`
   * @returns {Promise<object>} A promise that resolves to an object containing the solution vector and the coordinates of the mesh nodes
   */
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

    basicLog(`Using solver: ${this.solverConfig}`);
    if (this.solverConfig === "heatConductionScript") {
      ({ jacobianMatrix, residualVector } = assembleHeatConductionMat(meshData, this.boundaryConditions));

      if (this.solverMethod === "jacobi-gpu") {
        const { solutionVector: x } = await solveLinearSystemAsync(
          "jacobi-gpu",
          jacobianMatrix,
          residualVector,
          {
            computeEngine,
            maxIterations: options.maxIterations ?? this.maxIterations,
            tolerance: options.tolerance ?? this.tolerance,
          }
        );
        solutionVector = x;
      } else {
        // Other async solver
      }
    }
    console.timeEnd("totalSolvingTime");
    basicLog("Solving process completed");

    return { solutionVector, nodesCoordinates };
  }
}
