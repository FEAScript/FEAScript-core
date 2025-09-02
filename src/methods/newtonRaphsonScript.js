//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

import { solveLinearSystem } from "./linearSystemSolverScript.js";
import { euclideanNorm } from "../utilities/helperFunctionsScript.js";
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";
import { calculateSystemSize } from "../utilities/helperFunctionsScript.js";

/**
 * Function to solve a system of nonlinear equations using the Newton-Raphson method
 * @param {function} assembleMat - Function to assemble the Jacobian matrix and residual vector
 * @param {object} context - Context object containing mesh config, boundary conditions, etc.
 * @param {number} [maxIterations=100] - Maximum number of iterations
 * @param {number} [tolerance=1e-4] - Convergence tolerance
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 *  - jacobianMatrix: Final Jacobian matrix
 *  - residualVector: Final residual vector
 *  - nodesCoordinates: Node coordinates from the final assembly
 */
export function newtonRaphson(assembleMat, context, maxIterations = 100, tolerance = 1e-4) {
  let errorNorm = 0;
  let converged = false;
  let iterations = 0;
  let deltaX = [];
  let solutionVector = [];
  let jacobianMatrix = [];
  let residualVector = [];
  let nodesCoordinates = {};

  // Calculate system size directly from meshConfig
  let totalNodes = calculateSystemSize(context.meshConfig);

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
    ({ jacobianMatrix, residualVector, nodesCoordinates } = assembleMat(
      context.meshConfig,
      context.boundaryConditions,
      solutionVector, // The solution vector is required in the case of a non-linear equation
      context.eikonalActivationFlag
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
      basicLog(`Newton-Raphson converged in ${iterations + 1} iterations`);
      break;
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
    nodesCoordinates,
  };
}