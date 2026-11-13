/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to compute the residual of a solution relative to the right-hand side, ‖R − J u‖₂ / ‖R‖₂, in 64-bit
 * floats. It is the same measure for every solver method, so the run reports of the direct and the iterative
 * solvers can be compared
 * @param {SparseMatrix|array} jacobianMatrix - The coefficient matrix (SparseMatrix or dense array of arrays)
 * @param {array} residualVector - The right-hand side vector
 * @param {array} solutionVector - The solution vector
 * @returns {number} The relative residual (the absolute residual for a zero right-hand side)
 */
export function relativeResidual(jacobianMatrix: SparseMatrix | array, residualVector: array, solutionVector: array): number;
/**
 * Function to solve a system of linear equations using different solver methods
 * @param {string} solverMethod - The solver method to use ("lusolve" or "jacobi")
 * @param {SparseMatrix} jacobianMatrix - The coefficient matrix
 * @param {Array} residualVector - The right-hand side vector
 * @param {object} [options] - Optional parameters for the solver, such as `maxIterations` and `tolerance` (Jacobi),
 *  and `ordering` and `pivotThreshold` (LU decomposition, see mathjsLUSolver)
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector (Float64Array)
 *  - converged: Boolean indicating whether the method converged (always true for direct methods)
 *  - iterations: Number of iterations performed (null for direct methods)
 *  - residual: The residual relative to the right-hand side (see relativeResidual)
 * @throws {FEAScriptError} If the method is unknown, or if it does not converge
 */
export function solveLinearSystem(solverMethod: string, jacobianMatrix: SparseMatrix, residualVector: any[], options?: object): object;
/**
 * Function to solve asynchronously a system of linear equations using different solver methods
 * @param {string} solverMethod - The solver method to use (e.g., "jacobi-gpu")
 * @param {SparseMatrix|array} jacobianMatrix - The coefficient matrix
 * @param {array} residualVector - The right-hand side vector
 * @param {object} [options] - Optional parameters for the solver, such as `maxIterations`, `tolerance` and
 *  `computeEngine` (an initialized WebGPU compute engine to reuse; when omitted, a temporary one is created)
 * @returns {Promise<object>} A promise that resolves to an object containing:
 *  - solutionVector: The solution vector (Float64Array)
 *  - converged: Boolean indicating whether the method converged
 *  - iterations: Number of iterations performed
 *  - residual: The residual relative to the right-hand side, in 64-bit floats (see relativeResidual)
 * @throws {FEAScriptError} If the method is unknown, or if it does not converge
 */
export function solveLinearSystemAsync(solverMethod: string, jacobianMatrix: SparseMatrix | array, residualVector: array, options?: object): Promise<object>;
import { SparseMatrix } from "../linalg/sparseMatrix.js";
