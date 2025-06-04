//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

// Internal imports
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

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
   */
  constructor(boundaryConditions, boundaryElements, nop, meshDimension, elementOrder) {
    this.boundaryConditions = boundaryConditions;
    this.boundaryElements = boundaryElements;
    this.nop = nop;
    this.meshDimension = meshDimension;
    this.elementOrder = elementOrder;
  }

  /**
   * Function to impose constant temperature boundary conditions (Dirichlet type)
   * @param {array} residualVector - The residual vector to be modified
   * @param {array} jacobianMatrix - The Jacobian matrix to be modified
   */
  imposeConstantTempBoundaryConditions(residualVector, jacobianMatrix) {
    basicLog("Applying constant temperature boundary conditions (Dirichlet type)");
    if (this.meshDimension === "1D") {
      Object.keys(this.boundaryConditions).forEach((boundaryKey) => {
        if (this.boundaryConditions[boundaryKey][0] === "constantTemp") {
          const tempValue = this.boundaryConditions[boundaryKey][1];
          debugLog(
            `Boundary ${boundaryKey}: Applying constant temperature of ${tempValue} K (Dirichlet condition)`
          );
          this.boundaryElements[boundaryKey].forEach(([elementIndex, side]) => {
            if (this.elementOrder === "linear") {
              const boundarySides = {
                0: [0], // Node at the left side of the reference element
                1: [1], // Node at the right side of the reference element
              };
              boundarySides[side].forEach((nodeIndex) => {
                const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
                debugLog(
                  `  - Applied fixed temperature to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                // Set the residual vector to the ConstantTemp value
                residualVector[globalNodeIndex] = tempValue;
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
                  `  - Applied fixed temperature to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                // Set the residual vector to the ConstantTemp value
                residualVector[globalNodeIndex] = tempValue;
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
        if (this.boundaryConditions[boundaryKey][0] === "constantTemp") {
          const tempValue = this.boundaryConditions[boundaryKey][1];
          debugLog(
            `Boundary ${boundaryKey}: Applying constant temperature of ${tempValue} K (Dirichlet condition)`
          );
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
                  `  - Applied fixed temperature to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                // Set the residual vector to the ConstantTemp value
                residualVector[globalNodeIndex] = tempValue;
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
                  `  - Applied fixed temperature to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${nodeIndex + 1})`
                );
                // Set the residual vector to the ConstantTemp value
                residualVector[globalNodeIndex] = tempValue;
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
   * Function to impose convection boundary conditions (Robin type)
   * @param {array} residualVector - The residual vector to be modified
   * @param {array} jacobianMatrix - The Jacobian matrix to be modified
   * @param {array} gaussPoints - Array of Gauss points for numerical integration
   * @param {array} gaussWeights - Array of Gauss weights for numerical integration
   * @param {array} nodesXCoordinates - Array of x-coordinates of nodes
   * @param {array} nodesYCoordinates - Array of y-coordinates of nodes
   * @param {object} basisFunctionsData - Object containing basis functions and their derivatives
   */
  imposeConvectionBoundaryConditions(
    residualVector,
    jacobianMatrix,
    gaussPoints,
    gaussWeights,
    nodesXCoordinates,
    nodesYCoordinates,
    basisFunctionsData
  ) {
    basicLog("Applying convection boundary conditions (Robin type)");
    // Extract convection parameters from boundary conditions
    let convectionHeatTranfCoeff = [];
    let convectionExtTemp = [];
    Object.keys(this.boundaryConditions).forEach((key) => {
      const boundaryCondition = this.boundaryConditions[key];
      if (boundaryCondition[0] === "convection") {
        convectionHeatTranfCoeff[key] = boundaryCondition[1];
        convectionExtTemp[key] = boundaryCondition[2];
      }
    });

    if (this.meshDimension === "1D") {
      Object.keys(this.boundaryConditions).forEach((boundaryKey) => {
        if (this.boundaryConditions[boundaryKey][0] === "convection") {
          const convectionCoeff = convectionHeatTranfCoeff[boundaryKey];
          const extTemp = convectionExtTemp[boundaryKey];
          debugLog(
            `Boundary ${boundaryKey}: Applying convection with heat transfer coefficient h=${convectionCoeff} W/(m²·K) and external temperature T∞=${extTemp} K`
          );
          this.boundaryElements[boundaryKey].forEach(([elementIndex, side]) => {
            let nodeIndex;
            if (this.elementOrder === "linear") {
              if (side === 0) {
                // Node at the left side of the reference element
                nodeIndex = 0;
              } else {
                // Node at the right side of the reference element
                nodeIndex = 1;
              }
            } else if (this.elementOrder === "quadratic") {
              if (side === 0) {
                // Node at the left side of the reference element
                nodeIndex = 0;
              } else {
                // Node at the right side of the reference element
                nodeIndex = 2;
              }
            }

            const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
            debugLog(
              `  - Applied convection boundary condition to node ${globalNodeIndex + 1} (element ${
                elementIndex + 1
              }, local node ${nodeIndex + 1})`
            );
            residualVector[globalNodeIndex] += -convectionCoeff * extTemp;
            jacobianMatrix[globalNodeIndex][globalNodeIndex] += convectionCoeff;
          });
        }
      });
    } else if (this.meshDimension === "2D") {
      Object.keys(this.boundaryConditions).forEach((boundaryKey) => {
        if (this.boundaryConditions[boundaryKey][0] === "convection") {
          const convectionCoeff = convectionHeatTranfCoeff[boundaryKey];
          const extTemp = convectionExtTemp[boundaryKey];
          debugLog(
            `Boundary ${boundaryKey}: Applying convection with heat transfer coefficient h=${convectionCoeff} W/(m²·K) and external temperature T∞=${extTemp} K`
          );
          this.boundaryElements[boundaryKey].forEach(([elementIndex, side]) => {
            if (this.elementOrder === "linear") {
              let gaussPoint1, gaussPoint2, firstNodeIndex, lastNodeIndex, nodeIncrement;
              if (side === 0) {
                // Nodes at the bottom side of the reference element
                gaussPoint1 = gaussPoints[0];
                gaussPoint2 = 0;
                firstNodeIndex = 0;
                lastNodeIndex = 3;
                nodeIncrement = 2;
              } else if (side === 1) {
                // Nodes at the left side of the reference element
                gaussPoint1 = 0;
                gaussPoint2 = gaussPoints[0];
                firstNodeIndex = 0;
                lastNodeIndex = 2;
                nodeIncrement = 1;
              } else if (side === 2) {
                // Nodes at the top side of the reference element
                gaussPoint1 = gaussPoints[0];
                gaussPoint2 = 1;
                firstNodeIndex = 1;
                lastNodeIndex = 4;
                nodeIncrement = 2;
              } else if (side === 3) {
                // Nodes at the right side of the reference element
                gaussPoint1 = 1;
                gaussPoint2 = gaussPoints[0];
                firstNodeIndex = 2;
                lastNodeIndex = 4;
                nodeIncrement = 1;
              }

              let basisFunctionsAndDerivatives = basisFunctionsData.getBasisFunctions(
                gaussPoint1,
                gaussPoint2
              );
              let basisFunction = basisFunctionsAndDerivatives.basisFunction;
              let basisFunctionDerivKsi = basisFunctionsAndDerivatives.basisFunctionDerivKsi;
              let basisFunctionDerivEta = basisFunctionsAndDerivatives.basisFunctionDerivEta;

              let ksiDerivX = 0;
              let ksiDerivY = 0;
              let etaDerivX = 0;
              let etaDerivY = 0;
              const numNodes = this.nop[elementIndex].length;
              for (let nodeIndex = 0; nodeIndex < numNodes; nodeIndex++) {
                const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;

                // For boundaries along Ksi (horizontal), use Ksi derivatives
                if (side === 0 || side === 2) {
                  ksiDerivX += nodesXCoordinates[globalNodeIndex] * basisFunctionDerivKsi[nodeIndex];
                  ksiDerivY += nodesYCoordinates[globalNodeIndex] * basisFunctionDerivKsi[nodeIndex];
                }
                // For boundaries along Eta (vertical), use Eta derivatives
                else if (side === 1 || side === 3) {
                  etaDerivX += nodesXCoordinates[globalNodeIndex] * basisFunctionDerivEta[nodeIndex];
                  etaDerivY += nodesYCoordinates[globalNodeIndex] * basisFunctionDerivEta[nodeIndex];
                }
              }

              // Compute the length of tangent vector
              let tangentVectorLength;
              if (side === 0 || side === 2) {
                tangentVectorLength = Math.sqrt(ksiDerivX ** 2 + ksiDerivY ** 2);
              } else {
                tangentVectorLength = Math.sqrt(etaDerivX ** 2 + etaDerivY ** 2);
              }

              for (
                let localNodeIndex = firstNodeIndex;
                localNodeIndex < lastNodeIndex;
                localNodeIndex += nodeIncrement
              ) {
                let globalNodeIndex = this.nop[elementIndex][localNodeIndex] - 1;
                debugLog(
                  `  - Applied convection boundary condition to node ${globalNodeIndex + 1} (element ${
                    elementIndex + 1
                  }, local node ${localNodeIndex + 1})`
                );

                // Apply boundary condition with proper Jacobian for all sides
                residualVector[globalNodeIndex] +=
                  -gaussWeights[0] *
                  tangentVectorLength *
                  basisFunction[localNodeIndex] *
                  convectionCoeff *
                  extTemp;

                for (
                  let localNodeIndex2 = firstNodeIndex;
                  localNodeIndex2 < lastNodeIndex;
                  localNodeIndex2 += nodeIncrement
                ) {
                  let globalNodeIndex2 = this.nop[elementIndex][localNodeIndex2] - 1;
                  jacobianMatrix[globalNodeIndex][globalNodeIndex2] +=
                    -gaussWeights[0] *
                    tangentVectorLength *
                    basisFunction[localNodeIndex] *
                    basisFunction[localNodeIndex2] *
                    convectionCoeff;
                }
              }
            } else if (this.elementOrder === "quadratic") {
              for (let gaussPointIndex = 0; gaussPointIndex < 3; gaussPointIndex++) {
                let gaussPoint1, gaussPoint2, firstNodeIndex, lastNodeIndex, nodeIncrement;
                if (side === 0) {
                  // Nodes at the bottom side of the reference element
                  gaussPoint1 = gaussPoints[gaussPointIndex];
                  gaussPoint2 = 0;
                  firstNodeIndex = 0;
                  lastNodeIndex = 7;
                  nodeIncrement = 3;
                } else if (side === 1) {
                  // Nodes at the left side of the reference element
                  gaussPoint1 = 0;
                  gaussPoint2 = gaussPoints[gaussPointIndex];
                  firstNodeIndex = 0;
                  lastNodeIndex = 3;
                  nodeIncrement = 1;
                } else if (side === 2) {
                  // Nodes at the top side of the reference element
                  gaussPoint1 = gaussPoints[gaussPointIndex];
                  gaussPoint2 = 1;
                  firstNodeIndex = 2;
                  lastNodeIndex = 9;
                  nodeIncrement = 3;
                } else if (side === 3) {
                  // Nodes at the right side of the reference element
                  gaussPoint1 = 1;
                  gaussPoint2 = gaussPoints[gaussPointIndex];
                  firstNodeIndex = 6;
                  lastNodeIndex = 9;
                  nodeIncrement = 1;
                }
                let basisFunctionsAndDerivatives = basisFunctionsData.getBasisFunctions(
                  gaussPoint1,
                  gaussPoint2
                );
                let basisFunction = basisFunctionsAndDerivatives.basisFunction;
                let basisFunctionDerivKsi = basisFunctionsAndDerivatives.basisFunctionDerivKsi;
                let basisFunctionDerivEta = basisFunctionsAndDerivatives.basisFunctionDerivEta;

                let ksiDerivX = 0;
                let ksiDerivY = 0;
                let etaDerivX = 0;
                let etaDerivY = 0;
                const numNodes = this.nop[elementIndex].length;
                for (let nodeIndex = 0; nodeIndex < numNodes; nodeIndex++) {
                  const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;

                  // For boundaries along Ksi (horizontal), use Ksi derivatives
                  if (side === 0 || side === 2) {
                    ksiDerivX += nodesXCoordinates[globalNodeIndex] * basisFunctionDerivKsi[nodeIndex];
                    ksiDerivY += nodesYCoordinates[globalNodeIndex] * basisFunctionDerivKsi[nodeIndex];
                  }
                  // For boundaries along Eta (vertical), use Eta derivatives
                  else if (side === 1 || side === 3) {
                    etaDerivX += nodesXCoordinates[globalNodeIndex] * basisFunctionDerivEta[nodeIndex];
                    etaDerivY += nodesYCoordinates[globalNodeIndex] * basisFunctionDerivEta[nodeIndex];
                  }
                }

                // Compute the length of tangent vector
                let tangentVectorLength;
                if (side === 0 || side === 2) {
                  tangentVectorLength = Math.sqrt(ksiDerivX ** 2 + ksiDerivY ** 2);
                } else {
                  tangentVectorLength = Math.sqrt(etaDerivX ** 2 + etaDerivY ** 2);
                }

                for (
                  let localNodeIndex = firstNodeIndex;
                  localNodeIndex < lastNodeIndex;
                  localNodeIndex += nodeIncrement
                ) {
                  let globalNodeIndex = this.nop[elementIndex][localNodeIndex] - 1;
                  debugLog(
                    `  - Applied convection boundary condition to node ${globalNodeIndex + 1} (element ${
                      elementIndex + 1
                    }, local node ${localNodeIndex + 1})`
                  );

                  // Apply boundary condition with proper Jacobian for all sides
                  residualVector[globalNodeIndex] +=
                    -gaussWeights[gaussPointIndex] *
                    tangentVectorLength *
                    basisFunction[localNodeIndex] *
                    convectionCoeff *
                    extTemp;

                  for (
                    let localNodeIndex2 = firstNodeIndex;
                    localNodeIndex2 < lastNodeIndex;
                    localNodeIndex2 += nodeIncrement
                  ) {
                    let globalNodeIndex2 = this.nop[elementIndex][localNodeIndex2] - 1;
                    jacobianMatrix[globalNodeIndex][globalNodeIndex2] +=
                      -gaussWeights[gaussPointIndex] *
                      tangentVectorLength *
                      basisFunction[localNodeIndex] *
                      basisFunction[localNodeIndex2] *
                      convectionCoeff;
                  }
                }
              }
            }
          });
        }
      });
    }
  }
}
