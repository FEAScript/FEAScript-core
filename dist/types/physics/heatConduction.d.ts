/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to assemble the Jacobian matrix and residuals vector for the solid heat transfer model
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @param {object} coefficientFunctions - Heat transfer coefficient and heat source functions
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled (sparse) Jacobian matrix
 *  - residualVector: The assembled residual vector
 *
 * For consistency across both linear and nonlinear formulations,
 * this project always refers to the assembled right-hand side vector
 * as `residualVector` and the assembled system matrix as `jacobianMatrix`.
 *
 * In linear problems `jacobianMatrix` is equivalent to the
 * classic stiffness/conductivity matrix and `residualVector`
 * corresponds to the traditional load (RHS) vector.
 */
export function assembleHeatConductionMat(meshData: object, boundaryConditions: object, coefficientFunctions: object): object;
/**
 * Function to assemble the local Jacobian matrix and residual vector for the solid heat transfer model when using the frontal system solver
 * @param {number} elementIndex - Index of the element being processed
 * @param {array} nop - Nodal connectivity array (element-to-node mapping)
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} basisFunctions - Object containing basis functions and their derivatives
 * @param {object} FEAData - Object containing FEA-related data
 * @returns {object} An object containing:
 *  - localJacobianMatrix: Local Jacobian matrix
 *  - localResidualVector: Residual vector contributions
 *  - ngl: Array mapping local node indices to global node indices
 */
export function assembleHeatConductionFront({ elementIndex, nop, meshData, basisFunctions, FEAData, coefficientFunctions, }: number): object;
