/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to assemble the Jacobian matrix and residual vector for the 1D Euler-Bernoulli beam model
 *
 * The beam is governed by the fourth-order equation:
 *   d²/dx²( EI(x) d²w/dx² ) + c0(x) w = q(x)
 * with weak form (element level):
 *   K_ij = ∫ [ EI(x) psi_i'' psi_j'' + c0(x) psi_i psi_j ] dx
 *   F_i  = ∫ q(x) psi_i dx + (point forces/moments/spring contributions from boundary conditions)
 * where psi_i are cubic Hermite shape functions (see basisFunctions.js) and c0 is an optional
 * elastic-foundation modulus.
 *
 * Each mesh node carries 2 degrees of freedom, [w, theta] with theta = dw/dx, ordered
 * consecutively per node: [w_0, theta_0, w_1, theta_1, ...]. The mesh geometry itself only
 * needs the 2 end nodes of each element (i.e. meshConfig.elementOrder must be 'linear'); the
 * richer cubic Hermite interpolation is applied internally to the field, independent of the
 * geometric element order (a "subparametric" formulation, standard for beam elements).
 *
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions, keyed by 1-based node
 *  number (see beamBoundaryConditions.js for the supported condition types)
 * @param {object} coefficientFunctions - Functions of x for the beam model:
 *  - EI(x): bending stiffness (Young's modulus times second moment of area)
 *  - c0(x): elastic foundation modulus (optional, defaults to 0)
 *  - q(x): distributed transverse load (optional, defaults to 0)
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled (sparse) Jacobian (stiffness) matrix
 *  - residualVector: The assembled residual (load) vector
 *  - dofsPerNode: Number of degrees of freedom per node (2)
 *  - totalDOFs: Total number of degrees of freedom in the assembled system
 *
 * For consistency across both linear and nonlinear formulations,
 * this project always refers to the assembled right-hand side vector
 * as `residualVector` and the assembled system matrix as `jacobianMatrix`.
 *
 * In linear problems `jacobianMatrix` is equivalent to the
 * classic stiffness matrix and `residualVector` corresponds to the traditional load (RHS) vector.
 */
export function assembleEulerBernoulliBeamMat(meshData: object, boundaryConditions: object, coefficientFunctions: object): object;
/**
 * Function to split the Euler-Bernoulli beam solution vector into named nodal fields
 * @param {Float64Array} solutionVector - The solution vector [w_0, theta_0, w_1, theta_1, …]
 * @param {number} dofsPerNode - Number of degrees of freedom per node (2)
 * @returns {object} An object containing one Float64Array per field, each with one value per mesh node:
 *  - w: The deflection
 *  - theta: The rotation (dw/dx)
 */
export function extractEulerBernoulliBeamFields(solutionVector: Float64Array, dofsPerNode: number): object;
