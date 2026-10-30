/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { copyVector, euclideanNorm } from "../linalg/blasUtilities.js";
import { SparseMatrix } from "../linalg/sparseMatrix.js";

/**
 * Function to solve a system of linear equations using the Jacobi iterative method (CPU synchronous version)
 * @param {SparseMatrix|array} systemMatrix - The system matrix (SparseMatrix or dense array of arrays)
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

  // Convert the system matrix to compressed sparse row (CSR) format
  const sparseMatrix =
    systemMatrix instanceof SparseMatrix ? systemMatrix : SparseMatrix.fromDense(systemMatrix);
  const { rowPointers, columnIndices, values } = sparseMatrix.toCSR();
  const n = sparseMatrix.size;

  // Extract the diagonal entries
  const diagonal = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    for (let k = rowPointers[i]; k < rowPointers[i + 1]; k++) {
      if (columnIndices[k] === i) diagonal[i] = values[k];
    }
  }

  // Convert inputs to Float64Arrays for BLAS operations
  const rhs = new Float64Array(rightHandSideVector);
  let solutionVector = new Float64Array(initialGuess);
  let updatedSolutionVector = new Float64Array(n);
  const diff = new Float64Array(n);

  // Jacobi update: xNew[i] = (b[i] - sum over j != i of A[i][j] * x[j]) / A[i][i]
  for (let iter = 0; iter < maxIterations; iter++) {
    for (let i = 0; i < n; i++) {
      let offDiagonalSum = 0;
      for (let k = rowPointers[i]; k < rowPointers[i + 1]; k++) {
        const j = columnIndices[k];
        if (j !== i) offDiagonalSum += values[k] * solutionVector[j];
      }
      updatedSolutionVector[i] = (rhs[i] - offDiagonalSum) / diagonal[i];
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
