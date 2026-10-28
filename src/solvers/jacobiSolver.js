/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { dotProduct, copyVector, euclideanNorm } from "../numerics/blasUtilities.js";

/**
 * Function to solve a system of linear equations using the Jacobi iterative method (CPU synchronous version)
 * @param {array} systemMatrix - The system matrix
 * @param {array} rightHandSideVector - The right-hand side vector
 * @param {array} initialGuess - Initial guess for solution vector
 * @param {object} [options] - Optional parameters for the solver, such as `maxIterations` and `tolerance`
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector (Float64Array)
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 */
export function jacobiSolver(systemMatrix, rightHandSideVector, initialGuess, options = {}) {
  // Extract options
  const { maxIterations, tolerance } = options;

  const n = systemMatrix.length;

  // Convert inputs to Float64Arrays for BLAS operations
  const rows = systemMatrix.map((row) => new Float64Array(row));
  const rhs = new Float64Array(rightHandSideVector);
  let solutionVector = new Float64Array(initialGuess);
  let updatedSolutionVector = new Float64Array(n);
  const diff = new Float64Array(n);

  // Jacobi update: xNew[i] = (b[i] - (A[i] · x) + A[i][i] * x[i]) / A[i][i]
  for (let iter = 0; iter < maxIterations; iter++) {
    for (let i = 0; i < n; i++) {
      const rowDot = dotProduct(rows[i], solutionVector);
      updatedSolutionVector[i] = (rhs[i] - rowDot + rows[i][i] * solutionVector[i]) / rows[i][i];
    }

    // Compute diff and copy updatedSolutionVector into solutionVector
    for (let i = 0; i < n; i++) diff[i] = updatedSolutionVector[i] - solutionVector[i];
    const residual = euclideanNorm(diff);
    copyVector(updatedSolutionVector, solutionVector);

    if (residual < tolerance) {
      return { solutionVector, iterations: iter + 1, converged: true };
    }
  }

  return { solutionVector, iterations: maxIterations, converged: false };
}
