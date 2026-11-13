/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to assemble the Jacobian matrix and residual vector for the steady creeping flow (Stokes) model
 * using Taylor-Hood mixed finite elements (Q2-Q1 on quadrilaterals, P2-P1 on triangles)
 *
 * DOF ordering in the assembled system:
 *   [u_0 … u_{N_2−1}, v_0 … v_{N_2−1}, p_0 … p_{N_1−1}]
 * where N_2 = total velocity nodes (Q2/P2) and N_1 = total pressure nodes (Q1/P1)
 *
 * @param {object} meshData - Object containing prepared mesh data (must use quadratic elements)
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @param {object} [coefficientFunctions] - Coefficients of the creeping flow model:
 *  - viscosity: Dynamic viscosity μ, a number or a function of (x, y) (optional, defaults to 1)
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled (sparse) Jacobian matrix
 *  - residualVector: The assembled residual vector
 *  - totalNodesVelocity: Number of velocity nodes (Q2)
 *  - totalNodesPressure: Number of pressure nodes (Q1)
 *  - pressureNodeIndices: Array mapping pressure DOF index to global Q2 node index
 *
 * For consistency across both linear and nonlinear formulations,
 * this project always refers to the assembled right-hand side vector
 * as `residualVector` and the assembled system matrix as `jacobianMatrix`.
 *
 * In linear problems `jacobianMatrix` is equivalent to the
 * classic stiffness/conductivity matrix and `residualVector`
 * corresponds to the traditional load (RHS) vector.
 */
export function assembleCreepingFlowMatrix(meshData: object, boundaryConditions: object, coefficientFunctions?: object): object;
/**
 * Function to split the creeping flow solution vector into named nodal fields
 *
 * The pressure is solved only at the corner nodes (Q1/P1). It is interpolated linearly to the
 * mid-side (and, for quadrilaterals, centre) nodes, so that every field has one value per mesh node
 *
 * @param {Float64Array} solutionVector - The solution vector [u_0 … u_{N_2−1}, v_0 … v_{N_2−1}, p_0 … p_{N_1−1}]
 * @param {object} meshData - Object containing prepared mesh data
 * @param {number[]} pressureNodeIndices - Array mapping pressure DOF index to global Q2 node index
 * @returns {object} An object containing one Float64Array per field, each with one value per mesh node:
 *  - velocityMagnitude: The velocity magnitude sqrt(u² + v²)
 *  - u: The x-velocity
 *  - v: The y-velocity
 *  - p: The pressure
 */
export function extractCreepingFlowFields(solutionVector: Float64Array, meshData: object, pressureNodeIndices: number[]): object;
