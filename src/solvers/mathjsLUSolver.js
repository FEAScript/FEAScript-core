/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// External imports
import { create, all } from "mathjs";
const math = create(all);

/**
 * Function to solve a system of linear equations using LU decomposition (mathjs)
 * @param {array} systemMatrix - The system matrix
 * @param {array} rightHandSideVector - The right-hand side vector
 * @param {object} [options] - Optional parameters for the solver, such as `matrixType` ("sparse" or "dense")
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 */
export function mathjsLUSolver(systemMatrix, rightHandSideVector, options = {}) {
  // Extract options
  const { matrixType } = options;

  let solutionVector;
  if (matrixType === "sparse") {
    const sparseMatrix = math.sparse(systemMatrix);
    const luFactorization = math.slu(sparseMatrix, 1, 1); // order=1, threshold=1 for pivoting
    const solutionMatrix = math.lusolve(luFactorization, rightHandSideVector);
    solutionVector = math.squeeze(solutionMatrix).valueOf();
  } else {
    // Dense matrix
    const solutionMatrix = math.lusolve(systemMatrix, rightHandSideVector);
    solutionVector = math.squeeze(solutionMatrix).valueOf();
  }

  return { solutionVector };
}
