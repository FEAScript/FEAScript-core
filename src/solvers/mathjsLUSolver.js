/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// External imports
import { create, all } from "mathjs";
const math = create(all);

// Internal imports
import { SparseMatrix } from "../linalg/sparseMatrix.js";

/**
 * Function to solve a system of linear equations using LU decomposition (mathjs)
 * @param {SparseMatrix|array} systemMatrix - The system matrix (SparseMatrix or dense array of arrays)
 * @param {array} rightHandSideVector - The right-hand side vector
 * @param {object} [options] - Optional parameters for the solver, such as `matrixType` ("sparse" or "dense")
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector (Float64Array)
 */
export function mathjsLUSolver(systemMatrix, rightHandSideVector, options = {}) {
  // Extract options
  const { matrixType } = options;

  let solutionVector;
  if (matrixType === "sparse") {
    // Build the mathjs sparse matrix directly from the compressed columns, without a dense intermediate
    const compressedMatrix =
      systemMatrix instanceof SparseMatrix ? systemMatrix : SparseMatrix.fromDense(systemMatrix);
    const sparseMatrix = new math.SparseMatrix({ ...compressedMatrix.toCSC(), datatype: "number" });
    const luFactorization = math.slu(sparseMatrix, 1, 1); // order=1, threshold=1 for pivoting
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
