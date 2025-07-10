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
      // Pass an additional artificial visous parameter for front propagation
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
    basicLog(`Solving system using ${context.solverMethod}...`);
    if (context.solverMethod === "jacobi") {
      // Use Jacobi method
      const initialGuess = new Array(residualVector.length).fill(0);
      const jacobiResult = jacobiMethod(jacobianMatrix, residualVector, initialGuess, 1000, 1e-6);
      debugLog(
        `Used Jacobi solver in Newton-Raphson iteration ${iterations + 1}, converged: ${
          jacobiResult.converged
        }`
      );
    } else if (context.solverMethod === "lusolve") {
      // Use LU decomposition method
      deltaX = math.lusolve(jacobianMatrix, residualVector);
      debugLog(`Used LU decomposition solver in Newton-Raphson iteration ${iterations + 1}`);
    }

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
