/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Class to handle generic boundary conditions application
 */
export class GenericBoundaryConditions {
    /**
     * Constructor to initialize the GenericBoundaryConditions class
     * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
     * @param {array} boundaryElements - Array containing elements that belong to each boundary
     * @param {array} nop - Nodal numbering (NOP) array representing the connectivity between elements and nodes
     * @param {string} meshDimension - The dimension of the mesh (e.g., "2D")
     * @param {string} elementOrder - The order of elements (e.g., "linear", "quadratic")
     * @param {string} [elementShape='quad'] - The 2D element shape, either 'quad' or 'triangle'
     */
    constructor(boundaryConditions: object, boundaryElements: array, nop: array, meshDimension: string, elementOrder: string, elementShape?: string);
    boundaryConditions: object;
    boundaryElements: array;
    nop: array;
    meshDimension: string;
    elementOrder: string;
    elementShape: string;
    /**
     * Function to visit every node on a constant value boundary
     * @param {function} callback - Called with (globalNodeIndex, value) for each node
     */
    forEachConstantValueNode(callback: Function): void;
    /**
     * Function to impose Dirichlet boundary conditions
     * @param {array} residualVector - The residual vector to be modified
     * @param {SparseMatrix} jacobianMatrix - The Jacobian matrix to be modified
     * @param {array} [solutionVector] - Current solution (Newton-Raphson iterate); when provided, the
     *  residual is set to the increment needed to reach the prescribed value instead of the value itself
     *
     * For consistency across both linear and nonlinear formulations,
     * this project always refers to the assembled right-hand side vector
     * as `residualVector` and the assembled system matrix as `jacobianMatrix`.
     *
     * In linear problems `jacobianMatrix` is equivalent to the
     * classic stiffness/conductivity matrix and `residualVector`
     * corresponds to the traditional load (RHS) vector.
     */
    imposeDirichletBoundaryConditions(residualVector: array, jacobianMatrix: SparseMatrix, solutionVector?: array): void;
    /**
     * Function to impose constant value (Dirichlet) boundary conditions for the frontal solver
     * @param {array} nodeConstraintCode - Array indicating boundary condition code for each node
     * @param {array} boundaryValues - Array containing boundary condition values
     * @param {array} [solutionVector] - Current solution (Newton-Raphson iterate); when provided, the
     *  boundary value is the increment needed to reach the prescribed value instead of the value itself
     */
    imposeDirichletBoundaryConditionsFront(nodeConstraintCode: array, boundaryValues: array, solutionVector?: array): void;
}
