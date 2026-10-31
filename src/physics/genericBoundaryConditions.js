/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { getBoundarySides } from "../elements/basisFunctions.js";
import { debugLog } from "../utilities/logging.js";

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
  constructor(boundaryConditions, boundaryElements, nop, meshDimension, elementOrder, elementShape = "quad") {
    this.boundaryConditions = boundaryConditions;
    this.boundaryElements = boundaryElements;
    this.nop = nop;
    this.meshDimension = meshDimension;
    this.elementOrder = elementOrder;
    this.elementShape = elementShape;
  }

  /**
   * Function to visit every node on a constant value boundary
   * @param {function} callback - Called with (globalNodeIndex, value) for each node
   */
  forEachConstantValueNode(callback) {
    const boundarySides = getBoundarySides(this.meshDimension, this.elementOrder, this.elementShape);
    Object.keys(this.boundaryConditions).forEach((boundaryKey) => {
      if (this.boundaryConditions[boundaryKey][0] === "constantValue") {
        const value = this.boundaryConditions[boundaryKey][1];
        debugLog(`Boundary ${boundaryKey}: Applying constant value of ${value} (Dirichlet condition)`);

        this.boundaryElements[boundaryKey].forEach(([elementIndex, side]) => {
          boundarySides[side].forEach((nodeIndex) => {
            const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
            debugLog(
              `  - Applied constant value to node ${globalNodeIndex + 1} (element ${
                elementIndex + 1
              }, local node ${nodeIndex + 1})`,
            );
            callback(globalNodeIndex, value);
          });
        });
      }
    });
  }

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
  imposeDirichletBoundaryConditions(residualVector, jacobianMatrix, solutionVector) {
    this.forEachConstantValueNode((globalNodeIndex, value) => {
      // Set the residual vector to the value, or the increment needed to reach it for Newton-Raphson
      residualVector[globalNodeIndex] = solutionVector ? value - solutionVector[globalNodeIndex] : value;
      // Set the Jacobian matrix row to zero
      jacobianMatrix.clearRow(globalNodeIndex);
      // Set the diagonal entry of the Jacobian matrix to one
      jacobianMatrix.setValue(globalNodeIndex, globalNodeIndex, 1);
    });
  }

  /**
   * Function to impose constant value (Dirichlet) boundary conditions for the frontal solver
   * @param {array} nodeConstraintCode - Array indicating boundary condition code for each node
   * @param {array} boundaryValues - Array containing boundary condition values
   * @param {array} [solutionVector] - Current solution (Newton-Raphson iterate); when provided, the
   *  boundary value is the increment needed to reach the prescribed value instead of the value itself
   */
  imposeDirichletBoundaryConditionsFront(nodeConstraintCode, boundaryValues, solutionVector) {
    this.forEachConstantValueNode((globalNodeIndex, value) => {
      nodeConstraintCode[globalNodeIndex] = 1;
      boundaryValues[globalNodeIndex] = solutionVector ? value - solutionVector[globalNodeIndex] : value;
    });
  }
}
