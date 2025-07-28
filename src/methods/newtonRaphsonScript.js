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
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Function to solve a system of nonlinear equations using the Newton-Raphson method
 * @param {number} [maxIterations=100] - Maximum number of iterations
 * @param {number} [tolerance=1e-7] - Convergence tolerance
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 */

export function newtonRaphson(assembleMat, context, maxIterations = 100, tolerance = 1e-7) {
  let errorNorm = 0;
  let converged = false;
  let iterations = 0;
  let deltaX = [];
  let solutionVector = [];
  let jacobianMatrix = [];
  let residualVector = [];
  let nodesCoordinates = {};

  // Make a preliminary call to get the system size
  ({ jacobianMatrix, residualVector, nodesCoordinates } = assembleMat(
    context.meshConfig,
    context.boundaryConditions,
    [], // Empty array for first call
    context.eikonalActivationFlag
  ));

  // Initialize deltaX
  for (let i = 0; i < residualVector.length; i++) {
    deltaX[i] = 0;
  }

  // Initialize solution
  if (context.initialSolution && context.initialSolution.length > 0) {
    // Check if initialSolution has the correct length
    if (context.initialSolution.length === residualVector.length) {
      // Check for NaN values in the initial solution
      const hasNaN = context.initialSolution.some(value => isNaN(value));
      
      if (!hasNaN) {
        debugLog(`Using provided initial solution for Newton-Raphson solver`);
        for (let i = 0; i < residualVector.length; i++) {
          solutionVector[i] = context.initialSolution[i];
        }
      } else {
        errorLog("Initial solution contains NaN values! Using zeros instead.");
        for (let i = 0; i < residualVector.length; i++) {
          solutionVector[i] = 0;
        }
      }
    } else {
      errorLog(`Initial solution length (${context.initialSolution.length}) doesn't match residual vector length (${residualVector.length}). Using zeros.`);
      for (let i = 0; i < residualVector.length; i++) {
        solutionVector[i] = 0;
      }
    }
  } else {
    debugLog("No initial solution provided. Starting with zeros.");
    for (let i = 0; i < residualVector.length; i++) {
      solutionVector[i] = 0;
    }
  }

  while (iterations < maxIterations && !converged) {
    // Update solution
    for (let i = 0; i < solutionVector.length; i++) {
      solutionVector[i] = solutionVector[i] + deltaX[i];
    }

    // Compute Jacobian and Residual matrices
    if (assembleMat.name === "assembleFrontPropagationMat") {
      // Pass an additional viscous parameter for front propagation
      ({ jacobianMatrix, residualVector, nodesCoordinates } = assembleMat(
        context.meshConfig,
        context.boundaryConditions,
        solutionVector, // The solution vector is required in the case of a non-linear equation
        context.eikonalActivationFlag
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

    // Norm for each iteration
    basicLog(`Newton-Raphson Iteration ${iterations + 1}: Error norm = ${errorNorm.toExponential(4)}`);

    if (errorNorm <= tolerance) {
      converged = true;
    } else if (errorNorm > 1e2) {
      errorLog(`Solution not converged. Error norm: ${errorNorm}`);
      break;
    }

    iterations++;
  }

  debugLog(
    `Newton-Raphson ${
      converged ? "converged" : "did not converge"
    } in ${iterations} iterations with error norm ${errorNorm.toExponential(4)}`
  );

  return {
    solutionVector,
    converged,
    iterations,
    jacobianMatrix,
    residualVector,
    nodesCoordinates,
  };
}
