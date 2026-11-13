/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to run the frontal solver and obtain results for plotting
 *
 * The solver is independent of the physical model: the model supplies its element assembler and its
 * boundary conditions handler. Model-specific parameters (e.g. coefficient functions, the current
 * Newton-Raphson iterate) are bound into `assembleFront` by the caller.
 *
 * @param {function} assembleFront - Element assembler of the physical model. It receives
 *  `{ elementIndex, nop, meshData, basisFunctions, FEAData }` and returns
 *  `{ localJacobianMatrix, localResidualVector, ngl }`
 * @param {object} meshData - Object containing mesh data
 * @param {object} boundaryConditionsHandler - Boundary conditions object of the physical model, implementing:
 *  - imposeDirichletBoundaryConditionsFront(nodeConstraintCode, boundaryValues, solutionVector)
 *  - imposeRobinBoundaryConditionsFront(elementIndex, nodesXCoordinates, nodesYCoordinates, gaussPoints,
 *    gaussWeights, basisFunctions) (optional) - returns `{ localJacobianMatrix, localResidualVector }`,
 *    or null when the element is not on a Robin-type boundary
 * @param {array} [solutionVector] - Current Newton-Raphson iterate, passed to the Dirichlet handler so that
 *  prescribed values are imposed as increments (omit for linear problems)
 * @returns {object} An object containing the solution vector (Float64Array) and node coordinates
 */
export function runFrontalSolver(assembleFront: Function, meshData: object, boundaryConditionsHandler: object, solutionVector?: array): object;
