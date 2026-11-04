/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// External imports
// Only the functions used here, so bundlers can leave the rest of mathjs out
import {
  create,
  SparseMatrixDependencies,
  sluDependencies,
  lusolveDependencies,
  flattenDependencies,
} from "mathjs";
const math = create({ SparseMatrixDependencies, sluDependencies, lusolveDependencies, flattenDependencies });

// Internal imports
import { SparseMatrix } from "../linalg/sparseMatrix.js";

/**
 * Function to solve a system of linear equations using LU decomposition (mathjs)
 * @param {SparseMatrix|array} systemMatrix - The system matrix (SparseMatrix or dense array of arrays)
 * @param {array} rightHandSideVector - The right-hand side vector
 * @param {object} [options] - Optional parameters for the solver:
 *  - matrixType: "sparse" or "dense"
 *  - ordering: Fill-reducing column ordering of the sparse LU decomposition (mathjs `slu`): 0 (natural order),
 *    1 (AMD of A + Aᵀ, the default, best for symmetric matrices), 2 or 3 (AMD of AᵀA, without or with the dense
 *    rows; better for matrices with zeros on the diagonal, such as the saddle-point matrix of creeping flow)
 *  - pivotThreshold: Partial pivoting threshold of the sparse LU decomposition, between 0 and 1 (default 1, full
 *    partial pivoting). A smaller value keeps the diagonal pivot more often, which preserves the ordering
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector (Float64Array)
 */
export function mathjsLUSolver(systemMatrix, rightHandSideVector, options = {}) {
  // Extract options
  const { matrixType, ordering = 1, pivotThreshold = 1 } = options;

  let solutionVector;
  if (matrixType === "sparse") {
    // Build the mathjs sparse matrix directly from the compressed columns, without a dense intermediate
    const compressedMatrix =
      systemMatrix instanceof SparseMatrix ? systemMatrix : SparseMatrix.fromDense(systemMatrix);
    const sparseMatrix = new math.SparseMatrix({ ...compressedMatrix.toCSC(), datatype: "number" });
    const luFactorization = math.slu(sparseMatrix, ordering, pivotThreshold);
    const solutionMatrix = math.lusolve(luFactorization, rightHandSideVector);
    solutionVector = Float64Array.from(math.flatten(solutionMatrix).valueOf());
  } else {
    // Dense matrix
    const denseMatrix = systemMatrix instanceof SparseMatrix ? systemMatrix.toDense() : systemMatrix;
    const solutionMatrix = math.lusolve(denseMatrix, rightHandSideVector);
    solutionVector = Float64Array.from(math.flatten(solutionMatrix).valueOf());
  }

  return { solutionVector };
}
