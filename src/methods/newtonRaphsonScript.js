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

export function newtonRaphson(computeSystem, context, maxIterations = 100, tolerance = 1e-7) {
  let errorNorm = 0;
  let converged = false;
  let iterations = 0;
  let deltaX = [];
  let solution = [];
  let jacobianMatrix = [];
  let residualVector = [];
  let nodesCoordinates = {};

  while (iterations <= maxIterations && !converged) {
    for (i = 0; i < solution.length; i++) {
      solution[i] = solution[i] + deltaX[i]; // solution[i] or solution[i-1]? - Have to check
    }
    // Compute Residuals and Jacobian. Then solve the linear system
    errorNorm = euclideanNorm(deltaX);
    if (errorNorm <= tolerance) {
      converged = true;
    } else if (errorNorm > 1e5) {
      errorLog(`Solution not converged. Error norm: ${errorNorm}`);
      break;
    }
    iterations++;
  }
}
