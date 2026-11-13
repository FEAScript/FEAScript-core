/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

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
export function jacobiSolver(systemMatrix: SparseMatrix | array, rightHandSideVector: array, initialGuess: array, options?: object): object;
import { SparseMatrix } from "../linalg/sparseMatrix.js";
