/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

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
   */
  constructor(
    boundaryConditions,
    boundaryElements,
    nop,
    meshDimension,
    elementOrder,
    totalNodesVelocity,
    totalNodesPressure,
    q2ToPressureMap
  ) {
    this.boundaryConditions = boundaryConditions;
    this.boundaryElements = boundaryElements;
    this.nop = nop;
    this.meshDimension = meshDimension;
    this.elementOrder = elementOrder;
    this.totalNodesVelocity = totalNodesVelocity;
    this.totalNodesPressure = totalNodesPressure;
    this.q2ToPressureMap = q2ToPressureMap;
  }

  /**
   * Function to impose velocity Dirichlet boundary conditions
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
   *
  * Supported boundary condition types:
  *  - "constantVelocity": Set velocity components at boundary nodes
  *    Format: ["constantVelocity", uValue, vValue]
  *  - "stressFree": Natural boundary condition (zero traction), no assembly needed
  *    Format: ["stressFree"]
   */
  imposeDirichletBoundaryConditions(residualVector, jacobianMatrix) {
    const totalDOFs = residualVector.length;
    let hasStressFree = false;

    if (this.meshDimension === "2D") {
      Object.keys(this.boundaryConditions).forEach((boundaryKey) => {
        const bcType = this.boundaryConditions[boundaryKey][0];

        if (bcType === "stressFree") {
          hasStressFree = true;
          // Natural boundary condition - no explicit assembly needed
          debugLog(`Boundary ${boundaryKey}: Applying stress-free condition (natural BC)`);
        } else if (bcType === "constantVelocity") {
          const uValue = this.boundaryConditions[boundaryKey][1];
          const vValue = this.boundaryConditions[boundaryKey][2];
          debugLog(
            `Boundary ${boundaryKey}: Applying constant velocity condition (u=${uValue}, v=${vValue})`
          );
          this.boundaryElements[boundaryKey].forEach(([elementIndex, side]) => {
            if (this.elementOrder === "quadratic") {
              const boundarySides = {
                0: [0, 3, 6], // Nodes at the bottom side of the reference element
                1: [0, 1, 2], // Nodes at the left side of the reference element
                2: [2, 5, 8], // Nodes at the top side of the reference element
                3: [6, 7, 8], // Nodes at the right side of the reference element
              };
              boundarySides[side].forEach((nodeIndex) => {
                const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
                const uDOF = globalNodeIndex;
                const vDOF = this.totalNodesVelocity + globalNodeIndex;
                debugLog(
                  `  - Applied velocity Dirichlet to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                // Apply u-velocity Dirichlet boundary condition
                residualVector[uDOF] = uValue;
                for (let colIndex = 0; colIndex < totalDOFs; colIndex++) {
                  jacobianMatrix[uDOF][colIndex] = 0;
                }
                jacobianMatrix[uDOF][uDOF] = 1;

                // Apply v-velocity Dirichlet boundary condition
                residualVector[vDOF] = vValue;
                for (let colIndex = 0; colIndex < totalDOFs; colIndex++) {
                  jacobianMatrix[vDOF][colIndex] = 0;
                }
                jacobianMatrix[vDOF][vDOF] = 1;
              });
            } else if (this.elementOrder === "linear") {
              const boundarySides = {
                0: [0, 2], // Nodes at the bottom side of the reference element
                1: [0, 1], // Nodes at the left side of the reference element
                2: [1, 3], // Nodes at the top side of the reference element
                3: [2, 3], // Nodes at the right side of the reference element
              };
              boundarySides[side].forEach((nodeIndex) => {
                const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
                const uDOF = globalNodeIndex;
                const vDOF = this.totalNodesVelocity + globalNodeIndex;
                debugLog(
                  `  - Applied velocity Dirichlet to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                // Apply u-velocity Dirichlet boundary condition
                residualVector[uDOF] = uValue;
                for (let colIndex = 0; colIndex < totalDOFs; colIndex++) {
                  jacobianMatrix[uDOF][colIndex] = 0;
                }
                jacobianMatrix[uDOF][uDOF] = 1;

                // Apply v-velocity Dirichlet boundary condition
                residualVector[vDOF] = vValue;
                for (let colIndex = 0; colIndex < totalDOFs; colIndex++) {
                  jacobianMatrix[vDOF][colIndex] = 0;
                }
                jacobianMatrix[vDOF][vDOF] = 1;
              });
            }
          });
        }
      });

      // If no stress-free boundary exists, pin pressure at one node to remove null space
      // (pressure is determined only up to a constant for all-Dirichlet velocity problems)
      if (!hasStressFree) {
        const pDOF = 2 * this.totalNodesVelocity; // First pressure DOF
        for (let colIndex = 0; colIndex < totalDOFs; colIndex++) {
          jacobianMatrix[pDOF][colIndex] = 0;
        }
        jacobianMatrix[pDOF][pDOF] = 1;
        residualVector[pDOF] = 0;
        debugLog("Pinned pressure at first pressure node (p = 0) to remove null space");
      }
    }
  }
}
