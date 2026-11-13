/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to assemble the Jacobian matrix and residuals vector for the general form PDE model
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions
 * @param {object} coefficientFunctions - Functions A(x), B(x), C(x), D(x) for the PDE
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled (sparse) Jacobian matrix
 *  - residualVector: The assembled residual vector
 */
export function assembleGeneralFormPDEMat(meshData: object, boundaryConditions: object, coefficientFunctions: object): object;
/**
 * Function to assemble the frontal solver matrix for the general form PDE model
 * @param {object} data - Object containing element data for the frontal solver
 * @returns {object} An object containing local Jacobian matrix and residual vector
 */
export function assembleGeneralFormPDEFront({ elementIndex, nop, meshData, basisFunctions, FEAData, coefficientFunctions, }: object): object;
/**
 * Function to assemble the Jacobian matrix and residual vector for the nonlinear general form PDE model,
 * to be used with the Newton-Raphson solver
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions
 * @param {object} coefficientFunctions - Functions A(x), B(x), C(x) for the linear terms, plus D(x, u) and
 *  dDdu(x, u) for the nonlinear reaction/source term and its derivative with respect to u
 * @param {array} solutionVector - The current solution vector (Newton-Raphson iterate)
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled (sparse) Jacobian matrix (negative of dResidual/du)
 *  - residualVector: The assembled residual vector
 */
export function assembleGeneralFormPDENonlinearMat(meshData: object, boundaryConditions: object, coefficientFunctions: object, solutionVector: array): object;
/**
 * Function to assemble the local Jacobian matrix and residual vector for the nonlinear general form PDE model
 * when using the frontal system solver within the Newton-Raphson method
 * @param {object} data - Object containing element data for the frontal solver
 * @param {array} data.solutionVector - The current solution vector (Newton-Raphson iterate)
 * @param {object} data.coefficientFunctions - Functions A(x), B(x), C(x), D(x, u) and dDdu(x, u)
 * @returns {object} An object containing:
 *  - localJacobianMatrix: Local Jacobian matrix (negative of dResidual/du)
 *  - localResidualVector: Local residual vector
 *  - ngl: Array mapping local node indices to global node indices
 */
export function assembleGeneralFormPDENonlinearFront({ elementIndex, nop, meshData, basisFunctions, FEAData, coefficientFunctions, solutionVector, }: {
    solutionVector: array;
    coefficientFunctions: object;
}): object;
