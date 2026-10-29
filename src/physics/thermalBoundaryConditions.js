/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { triangleBoundarySides, getBoundarySides } from "../elements/basisFunctions.js";
import { NumericalIntegration } from "../elements/numericalIntegration.js";
import { debugLog } from "../utilities/logging.js";

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
  constructor(boundaryConditions, boundaryElements, nop, meshDimension, elementOrder, elementShape = "quad") {
    this.boundaryConditions = boundaryConditions;
    this.boundaryElements = boundaryElements;
    this.nop = nop;
    this.meshDimension = meshDimension;
    this.elementOrder = elementOrder;
    this.elementShape = elementShape;
  }

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
  computeTriangleConvectionContributions(
    elementIndex,
    side,
    convectionHeatTransferCoefficient,
    externalTemperature,
    nodesXCoordinates,
    nodesYCoordinates,
    basisFunctions,
  ) {
    const nodesPerElement = this.nop[elementIndex].length;
    const sideNodeIndices = triangleBoundarySides[this.elementOrder][side];
    const localJacobianMatrix = Array(nodesPerElement)
      .fill()
      .map(() => Array(nodesPerElement).fill(0));
    const localResidualVector = Array(nodesPerElement).fill(0);

    // Parametrize the side with t in [0, 1]: (ksi, eta) = start + t * direction
    const sideParametrization = {
      0: { start: [0, 0], direction: [1, 0] }, // Bottom side (eta = 0)
      1: { start: [0, 0], direction: [0, 1] }, // Left side (ksi = 0)
      2: { start: [0, 1], direction: [1, -1] }, // Hypotenuse (ksi + eta = 1)
    };
    const { start, direction } = sideParametrization[side];

    // 3-point Gauss rule on [0, 1], exact for the boundary mass terms of both linear and quadratic triangles
    const { gaussPoints, gaussWeights } = new NumericalIntegration({
      meshDimension: "1D",
      elementOrder: "quadratic",
    }).getGaussPointsAndWeights();

    for (let gaussPointIndex = 0; gaussPointIndex < gaussPoints.length; gaussPointIndex++) {
      const t = gaussPoints[gaussPointIndex];
      const { basisFunction, basisFunctionDerivKsi, basisFunctionDerivEta } =
        basisFunctions.getBasisFunctions(start[0] + t * direction[0], start[1] + t * direction[1]);

      // Tangent vector of the side in physical space (chain rule along the side parametrization)
      let tangentX = 0;
      let tangentY = 0;
      for (let nodeIndex = 0; nodeIndex < nodesPerElement; nodeIndex++) {
        const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
        const basisFunctionDerivT =
          basisFunctionDerivKsi[nodeIndex] * direction[0] + basisFunctionDerivEta[nodeIndex] * direction[1];
        tangentX += nodesXCoordinates[globalNodeIndex] * basisFunctionDerivT;
        tangentY += nodesYCoordinates[globalNodeIndex] * basisFunctionDerivT;
      }
      const tangentVectorLength = Math.sqrt(tangentX ** 2 + tangentY ** 2);

      for (const localNodeIndex of sideNodeIndices) {
        localResidualVector[localNodeIndex] +=
          -gaussWeights[gaussPointIndex] *
          tangentVectorLength *
          basisFunction[localNodeIndex] *
          convectionHeatTransferCoefficient *
          externalTemperature;

        for (const localNodeIndex2 of sideNodeIndices) {
          localJacobianMatrix[localNodeIndex][localNodeIndex2] +=
            -gaussWeights[gaussPointIndex] *
            tangentVectorLength *
            basisFunction[localNodeIndex] *
            basisFunction[localNodeIndex2] *
            convectionHeatTransferCoefficient;
        }
      }
    }

    return { sideNodeIndices, localJacobianMatrix, localResidualVector };
  }

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
  computeConvectionContributions(
    elementIndex,
    side,
    convectionHeatTransferCoefficient,
    externalTemperature,
    nodesXCoordinates,
    nodesYCoordinates,
    gaussPoints,
    gaussWeights,
    basisFunctions,
  ) {
    if (this.meshDimension === "2D" && this.elementShape === "triangle") {
      return this.computeTriangleConvectionContributions(
        elementIndex,
        side,
        convectionHeatTransferCoefficient,
        externalTemperature,
        nodesXCoordinates,
        nodesYCoordinates,
        basisFunctions,
      );
    }

    const nodesPerElement = this.nop[elementIndex].length;
    const sideNodeIndices = getBoundarySides(this.meshDimension, this.elementOrder, this.elementShape)[side];
    const localJacobianMatrix = Array(nodesPerElement)
      .fill()
      .map(() => Array(nodesPerElement).fill(0));
    const localResidualVector = Array(nodesPerElement).fill(0);

    if (this.meshDimension === "1D") {
      // The boundary is a single node
      const nodeIndex = sideNodeIndices[0];
      localResidualVector[nodeIndex] += -convectionHeatTransferCoefficient * externalTemperature;
      localJacobianMatrix[nodeIndex][nodeIndex] += convectionHeatTransferCoefficient;
      return { sideNodeIndices, localJacobianMatrix, localResidualVector };
    }

    // Quadrilateral: integrate along the side with the 1D Gauss rule
    for (let gaussPointIndex = 0; gaussPointIndex < gaussPoints.length; gaussPointIndex++) {
      // Reference coordinates of the Gauss point on the side
      const gaussPoint = gaussPoints[gaussPointIndex];
      const sideCoordinates = {
        0: [gaussPoint, 0], // Bottom side (eta = 0)
        1: [0, gaussPoint], // Left side (ksi = 0)
        2: [gaussPoint, 1], // Top side (eta = 1)
        3: [1, gaussPoint], // Right side (ksi = 1)
      };
      const [ksi, eta] = sideCoordinates[side];
      const { basisFunction, basisFunctionDerivKsi, basisFunctionDerivEta } =
        basisFunctions.getBasisFunctions(ksi, eta);

      // Tangent vector of the side: along ksi for the bottom/top sides, along eta for the left/right sides
      const isKsiSide = side === 0 || side === 2;
      let tangentX = 0;
      let tangentY = 0;
      for (let nodeIndex = 0; nodeIndex < nodesPerElement; nodeIndex++) {
        const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
        const basisFunctionDerivT = isKsiSide
          ? basisFunctionDerivKsi[nodeIndex]
          : basisFunctionDerivEta[nodeIndex];
        tangentX += nodesXCoordinates[globalNodeIndex] * basisFunctionDerivT;
        tangentY += nodesYCoordinates[globalNodeIndex] * basisFunctionDerivT;
      }
      const tangentVectorLength = Math.sqrt(tangentX ** 2 + tangentY ** 2);

      for (const localNodeIndex of sideNodeIndices) {
        localResidualVector[localNodeIndex] +=
          -gaussWeights[gaussPointIndex] *
          tangentVectorLength *
          basisFunction[localNodeIndex] *
          convectionHeatTransferCoefficient *
          externalTemperature;

        for (const localNodeIndex2 of sideNodeIndices) {
          localJacobianMatrix[localNodeIndex][localNodeIndex2] +=
            -gaussWeights[gaussPointIndex] *
            tangentVectorLength *
            basisFunction[localNodeIndex] *
            basisFunction[localNodeIndex2] *
            convectionHeatTransferCoefficient;
        }
      }
    }

    return { sideNodeIndices, localJacobianMatrix, localResidualVector };
  }

  /**
   * Function to visit every node on a constant temperature boundary
   * @param {function} callback - Called with (globalNodeIndex, constantTemperatureValue) for each node
   */
  forEachConstantTemperatureNode(callback) {
    const boundarySides = getBoundarySides(this.meshDimension, this.elementOrder, this.elementShape);
    Object.keys(this.boundaryConditions).forEach((boundaryKey) => {
      if (this.boundaryConditions[boundaryKey][0] === "constantTemperature") {
        const constantTemperatureValue = this.boundaryConditions[boundaryKey][1];
        debugLog(
          `Boundary ${boundaryKey}: Applying constant temperature of ${constantTemperatureValue} K (Dirichlet condition)`,
        );

        this.boundaryElements[boundaryKey].forEach(([elementIndex, side]) => {
          boundarySides[side].forEach((nodeIndex) => {
            const globalNodeIndex = this.nop[elementIndex][nodeIndex] - 1;
            debugLog(
              `  - Applied constant temperature to node ${globalNodeIndex + 1} (element ${
                elementIndex + 1
              }, local node ${nodeIndex + 1})`,
            );
            callback(globalNodeIndex, constantTemperatureValue);
          });
        });
      }
    });
  }

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
  imposeConstantTempBoundaryConditions(residualVector, jacobianMatrix) {
    this.forEachConstantTemperatureNode((globalNodeIndex, constantTemperatureValue) => {
      // Set the residual vector to the constant temperature value
      residualVector[globalNodeIndex] = constantTemperatureValue;
      // Set the Jacobian matrix row to zero
      jacobianMatrix.clearRow(globalNodeIndex);
      // Set the diagonal entry of the Jacobian matrix to one
      jacobianMatrix.setValue(globalNodeIndex, globalNodeIndex, 1);
    });
  }

  /**
   * Function to impose constant temperature boundary conditions for the frontal solver
   * @param {array} nodeConstraintCode - Array indicating boundary condition code for each node
   * @param {array} boundaryValues - Array containing boundary condition values
   */
  imposeDirichletBoundaryConditionsFront(nodeConstraintCode, boundaryValues) {
    this.forEachConstantTemperatureNode((globalNodeIndex, constantTemperatureValue) => {
      // Set boundary condition code and value
      nodeConstraintCode[globalNodeIndex] = 1;
      boundaryValues[globalNodeIndex] = constantTemperatureValue;
    });
  }

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
  imposeConvectionBoundaryConditions(
    residualVector,
    jacobianMatrix,
    gaussPoints,
    gaussWeights,
    nodesXCoordinates,
    nodesYCoordinates,
    basisFunctions,
  ) {
    Object.keys(this.boundaryConditions).forEach((boundaryKey) => {
      if (this.boundaryConditions[boundaryKey][0] === "convection") {
        const [, convectionHeatTransferCoefficient, externalTemperature] =
          this.boundaryConditions[boundaryKey];
        debugLog(
          `Boundary ${boundaryKey}: Applying convection with heat transfer coefficient h=${convectionHeatTransferCoefficient} W/(m²·K) and external temperature T∞=${externalTemperature} K`,
        );

        this.boundaryElements[boundaryKey].forEach(([elementIndex, side]) => {
          const { sideNodeIndices, localJacobianMatrix, localResidualVector } =
            this.computeConvectionContributions(
              elementIndex,
              side,
              convectionHeatTransferCoefficient,
              externalTemperature,
              nodesXCoordinates,
              nodesYCoordinates,
              gaussPoints,
              gaussWeights,
              basisFunctions,
            );

          // Add the side contributions to the global system
          for (const localNodeIndex of sideNodeIndices) {
            const globalNodeIndex = this.nop[elementIndex][localNodeIndex] - 1;
            debugLog(
              `  - Applied convection boundary condition to node ${globalNodeIndex + 1} (element ${
                elementIndex + 1
              }, local node ${localNodeIndex + 1})`,
            );
            residualVector[globalNodeIndex] += localResidualVector[localNodeIndex];

            for (const localNodeIndex2 of sideNodeIndices) {
              const globalNodeIndex2 = this.nop[elementIndex][localNodeIndex2] - 1;
              jacobianMatrix.addValue(
                globalNodeIndex,
                globalNodeIndex2,
                localJacobianMatrix[localNodeIndex][localNodeIndex2],
              );
            }
          }
        });
      }
    });
  }

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
  imposeRobinBoundaryConditionsFront(
    elementIndex,
    nodesXCoordinates,
    nodesYCoordinates,
    gaussPoints,
    gaussWeights,
    basisFunctions,
  ) {
    let localJacobianMatrix = null;
    let localResidualVector = null;

    for (const boundaryKey in this.boundaryElements) {
      if (this.boundaryConditions[boundaryKey]?.[0] !== "convection") continue;
      const [, convectionHeatTransferCoefficient, externalTemperature] = this.boundaryConditions[boundaryKey];

      // An element may have more than one side on the same boundary, so all of its sides are processed
      this.boundaryElements[boundaryKey]
        .filter(([boundaryElementIndex]) => boundaryElementIndex === elementIndex)
        .forEach(([, side]) => {
          debugLog(
            `Boundary ${boundaryKey}: Applying convection to element ${
              elementIndex + 1
            }, side ${side} with heat transfer coefficient h=${convectionHeatTransferCoefficient} W/(m²·K) and external temperature T∞=${externalTemperature} K`,
          );

          // Initialize local Jacobian matrix and local residual vector on the first convection side
          if (!localJacobianMatrix) {
            const nodesPerElement = this.nop[elementIndex].length;
            localJacobianMatrix = Array(nodesPerElement)
              .fill()
              .map(() => Array(nodesPerElement).fill(0));
            localResidualVector = Array(nodesPerElement).fill(0);
          }

          const sideContributions = this.computeConvectionContributions(
            elementIndex,
            side,
            convectionHeatTransferCoefficient,
            externalTemperature,
            nodesXCoordinates,
            nodesYCoordinates,
            gaussPoints,
            gaussWeights,
            basisFunctions,
          );
          for (const localNodeIndex of sideContributions.sideNodeIndices) {
            localResidualVector[localNodeIndex] += sideContributions.localResidualVector[localNodeIndex];
            for (const localNodeIndex2 of sideContributions.sideNodeIndices) {
              localJacobianMatrix[localNodeIndex][localNodeIndex2] +=
                sideContributions.localJacobianMatrix[localNodeIndex][localNodeIndex2];
            }
          }
        });
    }

    // Elements that are not on a convection boundary have no Robin-type contributions
    if (!localJacobianMatrix) return null;
    return { localJacobianMatrix, localResidualVector };
  }
}
