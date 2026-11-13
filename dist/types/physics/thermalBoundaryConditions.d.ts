/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Class to handle thermal boundary conditions application
 */
export class ThermalBoundaryConditions {
    /**
     * Constructor to initialize the ThermalBoundaryConditions class
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
     * Function to compute the convection contributions on one side of a triangular element
     * @param {number} elementIndex - Index of the element
     * @param {number} side - Side of the reference triangle (0: bottom, 1: left, 2: hypotenuse)
     * @param {number} convectionHeatTransferCoefficient - Convection heat transfer coefficient
     * @param {number} externalTemperature - External temperature
     * @param {array} nodesXCoordinates - Array of x-coordinates of nodes
     * @param {array} nodesYCoordinates - Array of y-coordinates of nodes
     * @param {object} basisFunctions - Object containing basis functions and their derivatives
     * @returns {object} An object containing:
     *  - sideNodeIndices: Local node indices on the side
     *  - localJacobianMatrix: Contributions indexed by local node indices
     *  - localResidualVector: Contributions indexed by local node indices
     */
    computeTriangleConvectionContributions(elementIndex: number, side: number, convectionHeatTransferCoefficient: number, externalTemperature: number, nodesXCoordinates: array, nodesYCoordinates: array, basisFunctions: object): object;
    /**
     * Function to compute the convection contributions on one side of an element (1D, quadrilateral or triangle)
     * @param {number} elementIndex - Index of the element
     * @param {number} side - Side of the reference element
     * @param {number} convectionHeatTransferCoefficient - Convection heat transfer coefficient
     * @param {number} externalTemperature - External temperature
     * @param {array} nodesXCoordinates - Array of x-coordinates of nodes
     * @param {array} nodesYCoordinates - Array of y-coordinates of nodes
     * @param {array} gaussPoints - Array of Gauss points for numerical integration
     * @param {array} gaussWeights - Array of Gauss weights for numerical integration
     * @param {object} basisFunctions - Object containing basis functions and their derivatives
     * @returns {object} An object containing:
     *  - sideNodeIndices: Local node indices on the side
     *  - localJacobianMatrix: Contributions indexed by local node indices
     *  - localResidualVector: Contributions indexed by local node indices
     */
    computeConvectionContributions(elementIndex: number, side: number, convectionHeatTransferCoefficient: number, externalTemperature: number, nodesXCoordinates: array, nodesYCoordinates: array, gaussPoints: array, gaussWeights: array, basisFunctions: object): object;
    /**
     * Function to visit every node on a constant temperature boundary
     * @param {function} callback - Called with (globalNodeIndex, constantTemperatureValue) for each node
     */
    forEachConstantTemperatureNode(callback: Function): void;
    /**
     * Function to impose constant temperature boundary conditions (Dirichlet type)
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
     */
    imposeConstantTempBoundaryConditions(residualVector: array, jacobianMatrix: SparseMatrix): void;
    /**
     * Function to impose constant temperature boundary conditions for the frontal solver
     * @param {array} nodeConstraintCode - Array indicating boundary condition code for each node
     * @param {array} boundaryValues - Array containing boundary condition values
     */
    imposeDirichletBoundaryConditionsFront(nodeConstraintCode: array, boundaryValues: array): void;
    /**
     * Function to impose convection boundary conditions (Robin type)
     * @param {array} residualVector - The residual vector to be modified
     * @param {SparseMatrix} jacobianMatrix - The Jacobian matrix to be modified
     * @param {array} gaussPoints - Array of Gauss points for numerical integration
     * @param {array} gaussWeights - Array of Gauss weights for numerical integration
     * @param {array} nodesXCoordinates - Array of x-coordinates of nodes
     * @param {array} nodesYCoordinates - Array of y-coordinates of nodes
     * @param {object} basisFunctions - Object containing basis functions and their derivatives
     */
    imposeConvectionBoundaryConditions(residualVector: array, jacobianMatrix: SparseMatrix, gaussPoints: array, gaussWeights: array, nodesXCoordinates: array, nodesYCoordinates: array, basisFunctions: object): void;
    /**
     * Function to impose convection boundary conditions for the frontal solver
     * @param {number} elementIndex - Index of the element being processed
     * @param {array} nodesXCoordinates - Array of x-coordinates of nodes
     * @param {array} nodesYCoordinates - Array of y-coordinates of nodes
     * @param {array} gaussPoints - Array of Gauss points for numerical integration
     * @param {array} gaussWeights - Array of Gauss weights for numerical integration
     * @param {object} basisFunctions - Object containing basis functions and their derivatives
     * @returns {object|null} An object containing the following, or null when the element is not on a convection boundary:
     *  - localJacobianMatrix: Local Jacobian matrix with convection contributions
     *  - localResidualVector: Residual vector with convection contributions
     */
    imposeRobinBoundaryConditionsFront(elementIndex: number, nodesXCoordinates: array, nodesYCoordinates: array, gaussPoints: array, gaussWeights: array, basisFunctions: object): object | null;
}
