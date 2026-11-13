/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Class to handle flow boundary conditions application for Stokes and Navier-Stokes models
 */
export class FlowBoundaryConditions {
    /**
     * Constructor to initialize the FlowBoundaryConditions class
     * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
     * @param {array} boundaryElements - Array containing elements that belong to each boundary
     * @param {array} nop - Nodal numbering (NOP) array representing the connectivity between elements and nodes
     * @param {string} meshDimension - The dimension of the mesh (e.g., "2D")
     * @param {string} elementOrder - The order of elements (e.g., "linear", "quadratic")
     * @param {number} totalNodesVelocity - Total number of velocity nodes (Q2)
     * @param {number} totalNodesPressure - Total number of pressure nodes (Q1)
     * @param {Map} q2ToPressureMap - Map from global Q2 node index to pressure DOF index
     * @param {string} [elementShape='quad'] - The 2D element shape, either 'quad' or 'triangle'
     */
    constructor(boundaryConditions: object, boundaryElements: array, nop: array, meshDimension: string, elementOrder: string, totalNodesVelocity: number, totalNodesPressure: number, q2ToPressureMap: Map<any, any>, elementShape?: string);
    boundaryConditions: object;
    boundaryElements: array;
    nop: array;
    meshDimension: string;
    elementOrder: string;
    totalNodesVelocity: number;
    totalNodesPressure: number;
    q2ToPressureMap: Map<any, any>;
    elementShape: string;
    /**
     * Function to impose velocity Dirichlet boundary conditions
     * @param {array} residualVector - The residual vector to be modified
     * @param {SparseMatrix} jacobianMatrix - The Jacobian matrix to be modified
     *
     * For consistency across both linear and nonlinear formulations,
     * this project always refers to the assembled right-hand side vector
     * as `residualVector` and the assembled system matrix as `jacobianMatrix`.
     *
     * In linear problems `jacobianMatrix` is equivalent to the
     * classic stiffness/conductivity matrix and `residualVector`
     * corresponds to the traditional load (RHS) vector.
     *
     * Supported boundary condition types:
     *  - "constantVelocity": Set velocity components at boundary nodes
     *    Format: ["constantVelocity", xVelocityValue, yVelocityValue]
     *  - "stressFree": Natural boundary condition (zero traction), no assembly needed
     *    Format: ["stressFree"]
     */
    imposeDirichletBoundaryConditions(residualVector: array, jacobianMatrix: SparseMatrix): void;
}
