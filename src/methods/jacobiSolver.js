/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { dotProduct, copyVector, euclideanNorm } from "./blasUtilities.js";

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

  // Convert inputs to Float64Arrays for BLAS operations
  const Arows = A.map((row) => new Float64Array(row));
  const bVec = new Float64Array(b);
  let x = new Float64Array(x0);
  let xNew = new Float64Array(n);
  const diff = new Float64Array(n);

  // Jacobi update: xNew[i] = (b[i] - (A[i] · x) + A[i][i] * x[i]) / A[i][i]
  for (let iter = 0; iter < maxIterations; iter++) {
    for (let i = 0; i < n; i++) {
      const rowDot = dotProduct(Arows[i], x);
      xNew[i] = (bVec[i] - rowDot + Arows[i][i] * x[i]) / Arows[i][i];
    }

    // Compute diff and copy xNew into x
    for (let i = 0; i < n; i++) diff[i] = xNew[i] - x[i];
    const residual = euclideanNorm(diff);
    copyVector(xNew, x);

    if (residual < tolerance) {
      return { solutionVector: x, iterations: iter + 1, converged: true };
    }
  }

  return { solutionVector: x, iterations: maxIterations, converged: false };
}
