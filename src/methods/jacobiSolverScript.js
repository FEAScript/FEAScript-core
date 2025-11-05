/**
 * ════════════════════════════════════════════════════════════
 *  FEAScript Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.1.4 | https://feascript.com
 * ════════════════════════════════════════════════════════════
 */

/**
 * Function to solve a system of linear equations using the Jacobi iterative method (CPU synchronous version)
 * @param {array} A - The system matrix
 * @param {array} b - The right-hand side vector
 * @param {array} x0 - Initial guess for solution vector
 * @param {object} [options] - Optional parameters for the solver, such as `maxIterations` and `tolerance`
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 */
export function jacobiSolver(A, b, x0, options = {}) {
  // Extract options
  const { maxIterations, tolerance } = options;

  const n = A.length;
  let x = [...x0];
  let xNew = new Array(n);

  // Jacobi update: xNew[i] = (b[i] - sum(A[i][j] * x[j] for j != i)) / A[i][i]
  for (let iter = 0; iter < maxIterations; iter++) {
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          sum += A[i][j] * x[j];
        }
      }
      xNew[i] = (b[i] - sum) / A[i][i];
    }

    // Check convergence based on maximum difference in solution vector
    let maxDiff = 0;
    for (let i = 0; i < n; i++) {
      maxDiff = Math.max(maxDiff, Math.abs(xNew[i] - x[i]));
    }

    // Copy new solution for the next iteration
    x = [...xNew];

    if (maxDiff < tolerance) {
      return { solutionVector: x, iterations: iter + 1, converged: true };
    }
  }

  return { solutionVector: x, iterations: maxIterations, converged: false };
}
