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
import { euclideanNorm } from "../methods/euclideanNormScript.js";
import { solveLinearSystem } from "./linearSystemSolverScript.js";
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Function to solve a system of non-linear equations using the Newton-Raphson method
 * @param {number} [maxIterations=100] - Maximum number of iterations
 * @param {number} [tolerance=1e-4] - Convergence tolerance
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 */

export function newtonRaphson(assembleMat, context, maxIterations = 100, tolerance = 1e-4) {
  let errorNorm = 0;
  let converged = false;
  let iterations = 0;
  let deltaX = [];
  let solutionVector = [];
  let jacobianMatrix = [];
  let residualVector = [];

  // Calculate system size from meshData instead of meshConfig
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
