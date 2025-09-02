//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

/**
 * Function to solve a system of linear equations using the Jacobi iterative method
 * This version provides high precision and consistent interface
 * @param {array} jacobianMatrix - The coefficient matrix (must be square)
 * @param {array} residualVector - The right-hand side vector
 * @param {array} initialGuess - Initial guess for solution vector
 * @param {object} [options] - Options for the solver
 * @param {number} [options.maxIterations=1000] - Maximum number of iterations
 * @param {number} [options.tolerance=1e-6] - Convergence tolerance
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 */
export function jacobiSolver(jacobianMatrix, residualVector, initialGuess, options = {}) {
  const { maxIterations = 1000, tolerance = 1e-6 } = options;
  const n = jacobianMatrix.length; // Size of the square matrix
  let x = [...initialGuess]; // Current solution (starts with initial guess)
  let xNew = new Array(n); // Next iteration's solution

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Perform one iteration
    for (let i = 0; i < n; i++) {
      let sum = 0;
      // Calculate sum of jacobianMatrix[i][j] * x[j] for j ≠ i
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          sum += jacobianMatrix[i][j] * x[j];
        }
      }
      // Update xNew[i] using the Jacobi formula
      xNew[i] = (residualVector[i] - sum) / jacobianMatrix[i][i];
    }

    // Check convergence
    let maxDiff = 0;
    for (let i = 0; i < n; i++) {
      maxDiff = Math.max(maxDiff, Math.abs(xNew[i] - x[i]));
    }

    // Update x for next iteration
    x = [...xNew];

    // Successfully converged if maxDiff is less than tolerance
    if (maxDiff < tolerance) {
      return {
        solutionVector: x,
        iterations: iteration + 1,
        converged: true,
      };
    }
  }

  // maxIterations were reached without convergence
  return {
    solutionVector: x,
    iterations: maxIterations,
    converged: false,
  };
}