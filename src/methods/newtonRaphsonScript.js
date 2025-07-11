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
import { solveLinearSystem } from "../methods/linearSystemScript.js";
import { basicLog, debugLog, errorLog } from "./utilities/loggingScript.js";

/**
 * Function to solve a system of nonlinear equations using the Newton-Raphson method
 * @param {number} [maxIterations=100] - Maximum number of iterations
 * @param {number} [tolerance=1e-7] - Convergence tolerance
 * @returns {object} An object containing:
 *  - solution: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 */

export function newtonRaphson(assembleMat, context, maxIterations = 100, tolerance = 1e-7) {
  let errorNorm = 0;
  let converged = false;
  let iterations = 0;
  let deltaX = [];
  let solution = [];
  let jacobianMatrix = [];
  let residualVector = [];
  let nodesCoordinates = {};

  // Initialize solution and deltaX
  for (let i = 0; i < residualVector.length; i++) {
    solution[i] = 0;
    deltaX[i] = 0;
  }

  while (iterations <= maxIterations && !converged) {
    // Update solution
    for (let i = 0; i < solution.length; i++) {
      solution[i] = solution[i] + deltaX[i];
    }

    // Compute Jacobian and Residual matrices
    if (assembleMat === "assembleFrontPropagationMat") {
      // Pass an additional viscous parameter for front propagation
      ({ jacobianMatrix, residualVector, nodesCoordinates } = assembleMat(
        context.meshConfig,
        context.boundaryConditions,
        context.eikonalViscousTerm
      ));
    } else {
      // Standard call for other assembly functions
      ({ jacobianMatrix, residualVector, nodesCoordinates } = assembleMat(
        context.meshConfig,
        context.boundaryConditions
      ));
    }

    // Solve the linear system based on the specified solver method
    const linearSystemResult = solveLinearSystem(context.solverMethod, jacobianMatrix, residualVector);
    deltaX = linearSystemResult.solutionVector;

    // Check convergence
    errorNorm = euclideanNorm(deltaX);
    if (errorNorm <= tolerance) {
      converged = true;
    } else if (errorNorm > 1e5) {
      errorLog(`Solution not converged. Error norm: ${errorNorm}`);
      break;
    }

    iterations++;
  }

  debugLog(`Newton-Raphson ${converged ? "converged" : "did not converge"} in ${iterations} iterations`);

  return {
    solution,
    converged,
    iterations,
    jacobianMatrix,
    residualVector,
    nodesCoordinates,
  };
}
