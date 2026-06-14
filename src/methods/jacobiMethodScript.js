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
 * @param {array} A - The coefficient matrix (must be square)
 * @param {array} b - The right-hand side vector
 * @param {array} x0 - Initial guess for solution vector
 * @param {number} [maxIterations=100] - Maximum number of iterations
 * @param {number} [tolerance=1e-7] - Convergence tolerance
 * @returns {object} An object containing:
 *  - solution: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 */
export function jacobiMethod(A, b, x0, maxIterations = 100, tolerance = 1e-7) {
  const n = A.length; // Size of the square matrix

  // Sanity checks for input dimensions
  if (!Array.isArray(A) || n === 0) {
    throw new Error("Matrix A must be a non-empty array");
  }

  // Verify A is square
  for (let i = 0; i < n; i++) {
    if (!Array.isArray(A[i]) || A[i].length !== n) {
      throw new Error(`Matrix A must be square. Row ${i} has length ${A[i].length}, expected ${n}`);
    }
  }

  // Verify b is a vector of correct length
  if (!Array.isArray(b) || b.length !== n) {
    throw new Error(`Vector b must have length ${n}, got ${b.length}`);
  }

  // Verify x0 is a vector of correct length
  if (!Array.isArray(x0) || x0.length !== n) {
    throw new Error(`Initial guess x0 must have length ${n}, got ${x0.length}`);
  }

  // Verify no zero diagonal elements (required for Jacobi method)
  for (let i = 0; i < n; i++) {
    if (A[i][i] === 0) {
      throw new Error(`Diagonal element A[${i}][${i}] is zero; Jacobi method requires non-zero diagonal elements`);
    }
  }

  let x = [...x0]; // Current solution (starts with initial guess)
  let xNew = new Array(n); // Next iteration's solution

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Perform one iteration
    for (let i = 0; i < n; i++) {
      let sum = 0;
      // Calculate sum of A[i][j] * x[j] for j ≠ i
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          sum += A[i][j] * x[j];
        }
      }
      // Update xNew[i] using the Jacobi formula
      xNew[i] = (b[i] - sum) / A[i][i];
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
        solution: x,
        iterations: iteration + 1,
        converged: true,
      };
    }
  }

  // maxIterations were reached without convergence
  return {
    solution: x,
    iterations: maxIterations,
    converged: false,
  };
}
