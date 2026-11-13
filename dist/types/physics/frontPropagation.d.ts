/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to assemble the Jacobian matrix and residuals vector for the front propagation model
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @param {array} solutionVector - The solution vector for non-linear equations
 * @param {number} eikonalActivationFlag - Activation parameter for the eikonal equation
 * @returns {object}  An object containing:
 *  - jacobianMatrix: The assembled (sparse) Jacobian matrix
 *  - residualVector: The assembled residual vector
 */
export function assembleFrontPropagationMat(meshData: object, boundaryConditions: object, solutionVector: array, eikonalActivationFlag: number): object;
/**
 * Function to assemble the local Jacobian matrix and residual vector for the front propagation model when using the frontal system solver
 * @param {number} elementIndex - Index of the element being processed
 * @param {array} nop - Nodal connectivity array (element-to-node mapping)
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} basisFunctions - Object containing basis functions and their derivatives
 * @param {object} FEAData - Object containing FEA-related data
 * @param {array} solutionVector - The solution vector for non-linear equations
 * @param {number} eikonalActivationFlag - Activation parameter for the eikonal equation
 * @returns {object} An object containing:
 *  - localJacobianMatrix: Local Jacobian matrix
 *  - residualVector: Residual vector contributions
 *  - ngl: Array mapping local node indices to global node indices
 */
export function assembleFrontPropagationFront({ elementIndex, nop, meshData, basisFunctions, FEAData, solutionVector, eikonalActivationFlag, }: number): object;
