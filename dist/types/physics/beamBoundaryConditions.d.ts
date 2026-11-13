/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Class to handle boundary conditions for the 1D Euler-Bernoulli beam model
 *
 * Unlike the side-based boundary conditions used by the scalar 1D/2D models
 * (which only tag the two ends of a 1D domain as boundary "0" and "1"),
 * beam problems routinely carry essential and natural conditions at interior
 * nodes as well (e.g. an intermediate roller support, or a point load applied
 * partway along the beam). For this reason, `boundaryConditions` here is keyed
 * by the 1-based GLOBAL NODE NUMBER rather than by a domain side, and each key
 * maps to an ARRAY of condition tuples, since a single node routinely carries
 * more than one condition at once (e.g. a spring support plus a point load):
 *
 *   boundaryConditions = {
 *     "1": [["fixed"]],                     // clamped: w = 0, theta = 0
 *     "2": [["pinned"], ["moment", 1250]],   // roller + applied moment
 *     "3": [["spring", 200], ["force", -2500]], // elastic support + applied force
 *   };
 *
 * Supported condition types:
 *  - ["fixed"]                       Essential: w = 0 and theta = 0 (clamped/built-in support)
 *  - ["pinned"] / ["deflection", v]  Essential: w = v (default v = 0; roller/pin support)
 *  - ["rotationFixed"] / ["rotation", v]  Essential: theta = v (default v = 0)
 *  - ["force", v]                    Natural: applies a concentrated transverse force v at the node
 *  - ["moment", v]                   Natural: applies a concentrated moment v at the node
 *  - ["spring", k, uRef]             Mixed/Robin: transverse elastic support of stiffness k about
 *                                     reference deflection uRef (default uRef = 0)
 */
export class BeamBoundaryConditions {
    /**
     * Constructor to initialize the BeamBoundaryConditions class
     * @param {object} boundaryConditions - Object containing boundary conditions, keyed by 1-based node number
     * @param {number} totalNodesX - Total number of nodes along the beam
     * @param {number} dofsPerNode - Number of degrees of freedom per node (2: deflection, rotation)
     */
    constructor(boundaryConditions: object, totalNodesX: number, dofsPerNode: number);
    boundaryConditions: object;
    totalNodesX: number;
    dofsPerNode: number;
    /**
     * Function to impose natural (point force/moment) and spring (Robin-type) boundary conditions
     * This must be called BEFORE imposeEssentialBoundaryConditions(), since essential conditions
     * override (zero out) the equation row at a constrained DOF, which must take precedence over
     * any natural/spring contribution assembled at the same DOF
     * @param {array} residualVector - The residual (load) vector to be modified
     * @param {SparseMatrix} jacobianMatrix - The Jacobian (stiffness) matrix to be modified
     */
    imposeNaturalAndSpringBoundaryConditions(residualVector: array, jacobianMatrix: SparseMatrix): void;
    /**
     * Function to impose essential (deflection/rotation) boundary conditions (Dirichlet-type)
     * This must be called AFTER imposeNaturalAndSpringBoundaryConditions()
     * @param {array} residualVector - The residual vector to be modified
     * @param {SparseMatrix} jacobianMatrix - The Jacobian matrix to be modified
     */
    imposeEssentialBoundaryConditions(residualVector: array, jacobianMatrix: SparseMatrix): void;
}
