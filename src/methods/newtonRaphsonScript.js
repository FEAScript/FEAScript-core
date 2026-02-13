/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { euclideanNorm } from "../methods/euclideanNormScript.js";
import { solveLinearSystem } from "./linearSystemSolverScript.js";
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";
import { runFrontalSolver } from "./frontalSolverScript.js";
import { assembleFrontPropagationFront } from "../models/frontPropagationScript.js";

/**
 * Function to solve a system of non-linear equations using the Newton-Raphson method
 * @param {function} assembleMat - Matrix assembler based on the physical model
 * @param {object} context - Context object containing simulation data and options
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 */

export function newtonRaphson(assembleMat, context = {}) {
  let errorNorm = 0;
  let converged = false;
  let iterations = 0;
  let deltaX = [];
  let solutionVector = [];
  let jacobianMatrix = [];
  let residualVector = [];

  // Extract context
  const { maxIterations = 100, tolerance = 1e-4 } = context;

  // Calculate system size
  let totalNodes = context.meshData.nodesXCoordinates.length;

  // Initialize arrays with proper size
  for (let i = 0; i < totalNodes; i++) {
    deltaX[i] = 0;
    solutionVector[i] = 0;
  }

  // Initialize solution from context if available
  if (context.initialSolution && context.initialSolution.length === totalNodes) {
    solutionVector = [...context.initialSolution];
  }

  while (iterations < maxIterations && !converged) {
    // Update solution
    for (let i = 0; i < solutionVector.length; i++) {
      solutionVector[i] = Number(solutionVector[i]) + Number(deltaX[i]);
    }

    // Check if using frontal solver
    if (context.solverMethod === "frontal") {
      const frontalResult = runFrontalSolver(
        assembleFrontPropagationFront,
        context.meshData,
        context.boundaryConditions,
        { solutionVector, eikonalActivationFlag: context.eikonalActivationFlag }
      );
      deltaX = frontalResult.solutionVector;
    } else {
      // Compute Jacobian and residual matrices
      ({ jacobianMatrix, residualVector } = assembleMat(
        context.meshData,
        context.boundaryConditions,
        solutionVector, // The solution vector is required in the case of a non-linear equation
        context.eikonalActivationFlag // Currently used only in the front propagation solver (TODO refactor in case of a solver not needing it)
      ));

      // Solve the linear system based on the specified solver method
      const linearSystemResult = solveLinearSystem(context.solverMethod, jacobianMatrix, residualVector);
      deltaX = linearSystemResult.solutionVector;
    }

    // Check convergence
    errorNorm = euclideanNorm(deltaX);

    // Norm for each iteration
    basicLog(`Newton-Raphson iteration ${iterations + 1}: Error norm = ${errorNorm.toExponential(4)}`);

    if (errorNorm <= tolerance) {
      converged = true;
    } else if (errorNorm > 1e2) {
      errorLog(`Solution not converged. Error norm: ${errorNorm}`);
      break;
    }

    iterations++;
  }

  return {
    solutionVector,
    converged,
    iterations,
    jacobianMatrix,
    residualVector,
  };
}
