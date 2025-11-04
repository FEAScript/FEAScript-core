/**
 * ════════════════════════════════════════════════════════════
 *  FEAScript Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.1.4 | https://feascript.com
 * ════════════════════════════════════════════════════════════
 */

// Internal imports
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

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
   */
  constructor(boundaryConditions, boundaryElements, nop, meshDimension, elementOrder) {
    this.boundaryConditions = boundaryConditions;
    this.boundaryElements = boundaryElements;
    this.nop = nop;
    this.meshDimension = meshDimension;
    this.elementOrder = elementOrder;
  }

  /**
   * Function to impose Dirichlet boundary conditions
   * @param {array} residualVector - The residual vector to be modified
   * @param {array} jacobianMatrix - The Jacobian matrix to be modified
   *
   * For consistency across both linear and nonlinear formulations,
   * this project always refers to the assembled right-hand side vector
   * as `residualVector` and the assembled system matrix as `jacobianMatrix`.
   *
   * In linear problems `jacobianMatrix` is equivalent to the
   * classic stiffness/conductivity matrix and `residualVector`
   * corresponds to the traditional load (RHS) vector.
   */
  imposeDirichletBoundaryConditions(residualVector, jacobianMatrix) {
    if (this.meshDimension === "1D") {
      Object.keys(this.boundaryConditions).forEach((boundaryKey) => {
        if (this.boundaryConditions[boundaryKey][0] === "constantValue") {
          const value = this.boundaryConditions[boundaryKey][1];
          debugLog(`Boundary ${boundaryKey}: Applying constant value of ${value} (Dirichlet condition)`);
          this.boundaryElements[boundaryKey].forEach(([elementIndex, side]) => {
            if (this.elementOrder === "linear") {
              const boundarySides = {
                0: [0], // Node at the left side of the reference element
                1: [1], // Node at the right side of the reference element
              };
              boundarySides[side].forEach((nodeIndex) => {
                const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
                debugLog(
                  `  - Applied constant value to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                // Set the residual vector to the value
                residualVector[globalNodeIndex] = value;
                // Set the Jacobian matrix row to zero
                for (let colIndex = 0; colIndex < residualVector.length; colIndex++) {
                  jacobianMatrix[globalNodeIndex][colIndex] = 0;
                }
                // Set the diagonal entry of the Jacobian matrix to one
                jacobianMatrix[globalNodeIndex][globalNodeIndex] = 1;
              });
            } else if (this.elementOrder === "quadratic") {
              const boundarySides = {
                0: [0], // Node at the left side of the reference element
                2: [2], // Node at the right side of the reference element
              };
              boundarySides[side].forEach((nodeIndex) => {
                const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
                debugLog(
                  `  - Applied constant value to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                // Set the residual vector to the value
                residualVector[globalNodeIndex] = value;
                // Set the Jacobian matrix row to zero
                for (let colIndex = 0; colIndex < residualVector.length; colIndex++) {
                  jacobianMatrix[globalNodeIndex][colIndex] = 0;
                }
                // Set the diagonal entry of the Jacobian matrix to one
                jacobianMatrix[globalNodeIndex][globalNodeIndex] = 1;
              });
            }
          });
        }
      });
    } else if (this.meshDimension === "2D") {
      Object.keys(this.boundaryConditions).forEach((boundaryKey) => {
        if (this.boundaryConditions[boundaryKey][0] === "constantValue") {
          const value = this.boundaryConditions[boundaryKey][1];
          debugLog(`Boundary ${boundaryKey}: Applying constant value of ${value} (Dirichlet condition)`);
          this.boundaryElements[boundaryKey].forEach(([elementIndex, side]) => {
            if (this.elementOrder === "linear") {
              const boundarySides = {
                0: [0, 2], // Nodes at the bottom side of the reference element
                1: [0, 1], // Nodes at the left side of the reference element
                2: [1, 3], // Nodes at the top side of the reference element
                3: [2, 3], // Nodes at the right side of the reference element
              };
              boundarySides[side].forEach((nodeIndex) => {
                const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
                debugLog(
                  `  - Applied constant value to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                // Set the residual vector to the value
                residualVector[globalNodeIndex] = value;
                // Set the Jacobian matrix row to zero
                for (let colIndex = 0; colIndex < residualVector.length; colIndex++) {
                  jacobianMatrix[globalNodeIndex][colIndex] = 0;
                }
                // Set the diagonal entry of the Jacobian matrix to one
                jacobianMatrix[globalNodeIndex][globalNodeIndex] = 1;
              });
            } else if (this.elementOrder === "quadratic") {
              const boundarySides = {
                0: [0, 3, 6], // Nodes at the bottom side of the reference element
                1: [0, 1, 2], // Nodes at the left side of the reference element
                2: [2, 5, 8], // Nodes at the top side of the reference element
                3: [6, 7, 8], // Nodes at the right side of the reference element
              };
              boundarySides[side].forEach((nodeIndex) => {
                const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
                debugLog(
                  `  - Applied constant value to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                // Set the residual vector to the value
                residualVector[globalNodeIndex] = value;
                // Set the Jacobian matrix row to zero
                for (let colIndex = 0; colIndex < residualVector.length; colIndex++) {
                  jacobianMatrix[globalNodeIndex][colIndex] = 0;
                }
                // Set the diagonal entry of the Jacobian matrix to one
                jacobianMatrix[globalNodeIndex][globalNodeIndex] = 1;
              });
            }
          });
        }
      });
    }
  }

  /**
   * Function to impose constant value (Dirichlet) boundary conditions for the frontal solver
   * @param {array} nodeConstraintCode - Array indicating boundary condition code for each node
   * @param {array} boundaryValues - Array containing boundary condition values
   */
  imposeConstantValueBoundaryConditionsFront(nodeConstraintCode, boundaryValues) {
    if (this.meshDimension === "1D") {
      Object.keys(this.boundaryConditions).forEach((boundaryKey) => {
        if (this.boundaryConditions[boundaryKey][0] === "constantValue") {
          const value = this.boundaryConditions[boundaryKey][1];
          debugLog(`Boundary ${boundaryKey}: Applying constant value of ${value} (Dirichlet condition)`);
          this.boundaryElements[boundaryKey].forEach(([elementIndex, side]) => {
            if (this.elementOrder === "linear") {
              const boundarySides = {
                0: [0], // Node at the left side of the reference element
                1: [1], // Node at the right side of the reference element
              };
              boundarySides[side].forEach((nodeIndex) => {
                const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
                debugLog(
                  `  - Applied constant value to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                nodeConstraintCode[globalNodeIndex] = 1;
                boundaryValues[globalNodeIndex] = value;
              });
            } else if (this.elementOrder === "quadratic") {
              const boundarySides = {
                0: [0], // Node at the left side of the reference element
                2: [2], // Node at the right side of the reference element
              };
              boundarySides[side].forEach((nodeIndex) => {
                const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
                debugLog(
                  `  - Applied constant value to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                nodeConstraintCode[globalNodeIndex] = 1;
                boundaryValues[globalNodeIndex] = value;
              });
            }
          });
        }
      });
    } else if (this.meshDimension === "2D") {
      Object.keys(this.boundaryConditions).forEach((boundaryKey) => {
        if (this.boundaryConditions[boundaryKey][0] === "constantValue") {
          const value = this.boundaryConditions[boundaryKey][1];
          debugLog(`Boundary ${boundaryKey}: Applying constant value of ${value} (Dirichlet condition)`);
          this.boundaryElements[boundaryKey].forEach(([elementIndex, side]) => {
            if (this.elementOrder === "linear") {
              const boundarySides = {
                0: [0, 2], // Nodes at the bottom side of the reference element
                1: [0, 1], // Nodes at the left side of the reference element
                2: [1, 3], // Nodes at the top side of the reference element
                3: [2, 3], // Nodes at the right side of the reference element
              };
              boundarySides[side].forEach((nodeIndex) => {
                const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
                debugLog(
                  `  - Applied constant value to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                nodeConstraintCode[globalNodeIndex] = 1;
                boundaryValues[globalNodeIndex] = value;
              });
            } else if (this.elementOrder === "quadratic") {
              const boundarySides = {
                0: [0, 3, 6], // Nodes at the bottom side of the reference element
                1: [0, 1, 2], // Nodes at the left side of the reference element
                2: [2, 5, 8], // Nodes at the top side of the reference element
                3: [6, 7, 8], // Nodes at the right side of the reference element
              };
              boundarySides[side].forEach((nodeIndex) => {
                const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
                debugLog(
                  `  - Applied constant value to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                nodeConstraintCode[globalNodeIndex] = 1;
                boundaryValues[globalNodeIndex] = value;
              });
            }
          });
        }
      });
    }
  }
}
