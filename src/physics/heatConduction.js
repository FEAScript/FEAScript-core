/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { initializeFEA } from "../elements/feaInitialization.js";
import { performIsoparametricMapping1D, performIsoparametricMapping2D } from "../elements/isoparametricMapping.js";
import { ThermalBoundaryConditions } from "./thermalBoundaryConditions.js";
import { basicLog } from "../utilities/logging.js";

/**
 * Function to assemble the Jacobian matrix and residuals vector for the solid heat transfer model
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @param {object} coefficientFunctions - Heat transfer coefficient and heat source functions
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled (sparse) Jacobian matrix
 *  - residualVector: The assembled residual vector
 *
 * For consistency across both linear and nonlinear formulations,
 * this project always refers to the assembled right-hand side vector
 * as `residualVector` and the assembled system matrix as `jacobianMatrix`.
 *
 * In linear problems `jacobianMatrix` is equivalent to the
 * classic stiffness/conductivity matrix and `residualVector`
 * corresponds to the traditional load (RHS) vector.
 */
export function assembleHeatConductionMat(meshData, boundaryConditions, coefficientFunctions) {
  basicLog("Starting solid heat transfer matrix assembly...");

  // Extract mesh data
  const {
    nodesXCoordinates,
    nodesYCoordinates,
    nop,
    boundaryElements,
    totalElements,
    meshDimension,
    elementOrder,
    elementShape,
  } = meshData;

  // Extract coefficient functions, resolving constant values to functions once
  const thermalConductivity = coefficientFunctions?.thermalConductivity ?? 1;
  const heatSource = coefficientFunctions?.heatSource ?? 0;
  const thermalConductivityAt =
    typeof thermalConductivity === "function" ? thermalConductivity : () => thermalConductivity;
  const heatSourceAt = typeof heatSource === "function" ? heatSource : () => heatSource;

  // Initialize FEA components
  const FEAData = initializeFEA(meshData);
  const {
    residualVector,
    jacobianMatrix,
    localToGlobalMap,
    basisFunctions,
    gaussPoints,
    gaussWeights,
    integrationPoints2D,
    referenceBasisFunctions,
    nodesPerElement,
  } = FEAData;

  // Element matrix and basis function derivatives, reused for every element and integration point
  const localJacobianMatrix = new Float64Array(nodesPerElement * nodesPerElement);
  const basisFunctionDerivX = new Float64Array(nodesPerElement);
  const basisFunctionDerivY = new Float64Array(nodesPerElement);

  // 1D solid heat transfer
  if (meshDimension === "1D") {
    // Matrix assembly
    for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
      // Map local element nodes to global mesh nodes
      for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
        // Subtract 1 from nop in order to start numbering from 0
        localToGlobalMap[localNodeIndex] = nop[elementIndex][localNodeIndex] - 1;
      }
      localJacobianMatrix.fill(0);

      // Loop over Gauss points
      for (let gaussPointIndex = 0; gaussPointIndex < gaussPoints.length; gaussPointIndex++) {
        // Basis functions on the reference element at this Gauss point
        const { basisFunction, basisFunctionDerivKsi } = referenceBasisFunctions[gaussPointIndex];

        // Perform isoparametric mapping
        const { xCoordinates, detJacobian } = performIsoparametricMapping1D({
          basisFunction,
          basisFunctionDerivKsi,
          nodesXCoordinates,
          localToGlobalMap,
          nodesPerElement,
          basisFunctionDerivX,
        });

        // Evaluate thermal conductivity and heat source at this Gauss point
        const k = thermalConductivityAt(xCoordinates);
        const Q = heatSourceAt(xCoordinates);

        // Integration factors, common to every pair of local nodes
        const weightFactor = gaussWeights[gaussPointIndex] * detJacobian;
        const diffusionFactor = -weightFactor * k;

        // Computation of Galerkin's residuals and local Jacobian matrix
        for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
          // Heat source contribution to residual vector
          residualVector[localToGlobalMap[localNodeIndex1]] -=
            weightFactor * Q * basisFunction[localNodeIndex1];

          const rowOffset = localNodeIndex1 * nodesPerElement;
          for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
            localJacobianMatrix[rowOffset + localNodeIndex2] +=
              diffusionFactor * (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2]);
          }
        }
      }

      // Add the element contribution to the global Jacobian matrix
      jacobianMatrix.addLocalMatrix(localToGlobalMap, localJacobianMatrix);
    }
  }
  // 2D solid heat transfer
  else if (meshDimension === "2D") {
    // Matrix assembly
    for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
      // Map local element nodes to global mesh nodes
      for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
        // Subtract 1 from nop in order to start numbering from 0
        localToGlobalMap[localNodeIndex] = nop[elementIndex][localNodeIndex] - 1;
      }
      localJacobianMatrix.fill(0);

      // Loop over integration points
      for (let pointIndex = 0; pointIndex < integrationPoints2D.length; pointIndex++) {
        const integrationWeight = integrationPoints2D[pointIndex][2];

        // Basis functions on the reference element at this integration point
        const { basisFunction, basisFunctionDerivKsi, basisFunctionDerivEta } =
          referenceBasisFunctions[pointIndex];

        // Perform isoparametric mapping
        const { xCoordinates, yCoordinates, detJacobian } = performIsoparametricMapping2D({
          basisFunction,
          basisFunctionDerivKsi,
          basisFunctionDerivEta,
          nodesXCoordinates,
          nodesYCoordinates,
          localToGlobalMap,
          nodesPerElement,
          basisFunctionDerivX,
          basisFunctionDerivY,
        });

        // Evaluate thermal conductivity and heat source at this integration point
        const k = thermalConductivityAt(xCoordinates, yCoordinates);
        const Q = heatSourceAt(xCoordinates, yCoordinates);

        // Integration factors, common to every pair of local nodes
        const weightFactor = integrationWeight * detJacobian;
        const diffusionFactor = -weightFactor * k;

        // Computation of Galerkin's residuals and local Jacobian matrix
        for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
          // Heat source contribution to residual vector
          residualVector[localToGlobalMap[localNodeIndex1]] -=
            weightFactor * Q * basisFunction[localNodeIndex1];

          const rowOffset = localNodeIndex1 * nodesPerElement;
          for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
            localJacobianMatrix[rowOffset + localNodeIndex2] +=
              diffusionFactor *
              (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] +
                basisFunctionDerivY[localNodeIndex1] * basisFunctionDerivY[localNodeIndex2]);
          }
        }
      }

      // Add the element contribution to the global Jacobian matrix
      jacobianMatrix.addLocalMatrix(localToGlobalMap, localJacobianMatrix);
    }
  }

  // Apply boundary conditions
  const thermalBoundaryConditions = new ThermalBoundaryConditions(
    boundaryConditions,
    boundaryElements,
    nop,
    meshDimension,
    elementOrder,
    elementShape,
  );

  // Impose Convection boundary conditions
  thermalBoundaryConditions.imposeConvectionBoundaryConditions(
    residualVector,
    jacobianMatrix,
    gaussPoints,
    gaussWeights,
    nodesXCoordinates,
    nodesYCoordinates,
    basisFunctions,
  );

  // Impose ConstantTemp boundary conditions
  thermalBoundaryConditions.imposeConstantTempBoundaryConditions(residualVector, jacobianMatrix);
  basicLog("Solid heat transfer matrix assembly completed");

  return {
    jacobianMatrix,
    residualVector,
  };
}

/**
 * Function to assemble the local Jacobian matrix and residual vector for the solid heat transfer model when using the frontal system solver
 * @param {number} elementIndex - Index of the element being processed
 * @param {array} nop - Nodal connectivity array (element-to-node mapping)
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} basisFunctions - Object containing basis functions and their derivatives
 * @param {object} FEAData - Object containing FEA-related data
 * @returns {object} An object containing:
 *  - localJacobianMatrix: Local Jacobian matrix
 *  - localResidualVector: Residual vector contributions
 *  - ngl: Array mapping local node indices to global node indices
 */
export function assembleHeatConductionFront({
  elementIndex,
  nop,
  meshData,
  basisFunctions,
  FEAData,
  coefficientFunctions,
}) {
  // Extract numerical integration parameters and mesh coordinates
  const { gaussPoints, gaussWeights, integrationPoints2D, referenceBasisFunctions, nodesPerElement } =
    FEAData;
  const { nodesXCoordinates, nodesYCoordinates, meshDimension } = meshData;

  // Extract coefficient functions (with safe defaults), resolving constant values to functions once
  const thermalConductivity = coefficientFunctions?.thermalConductivity ?? 1;
  const heatSource = coefficientFunctions?.heatSource ?? 0;
  const thermalConductivityAt =
    typeof thermalConductivity === "function" ? thermalConductivity : () => thermalConductivity;
  const heatSourceAt = typeof heatSource === "function" ? heatSource : () => heatSource;

  // Initialize local Jacobian matrix and local residual vector
  const localJacobianMatrix = Array(nodesPerElement)
    .fill()
    .map(() => Array(nodesPerElement).fill(0));
  const localResidualVector = Array(nodesPerElement).fill(0);

  // Build the mapping from local node indices to global node indices
  const ngl = Array(nodesPerElement);
  const localToGlobalMap = Array(nodesPerElement);
  for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
    ngl[localNodeIndex] = Math.abs(nop[elementIndex][localNodeIndex]);
    localToGlobalMap[localNodeIndex] = Math.abs(nop[elementIndex][localNodeIndex]) - 1;
  }

  // Loop over Gauss points
  if (meshDimension === "1D") {
    // 1D solid heat transfer
    for (let gaussPointIndex1 = 0; gaussPointIndex1 < gaussPoints.length; gaussPointIndex1++) {
      // Basis functions on the reference element at this Gauss point
      const { basisFunction, basisFunctionDerivKsi } = referenceBasisFunctions[gaussPointIndex1];

      // Perform isoparametric mapping
      const { xCoordinates, detJacobian, basisFunctionDerivX } = performIsoparametricMapping1D({
        basisFunction,
        basisFunctionDerivKsi,
        nodesXCoordinates,
        localToGlobalMap,
        nodesPerElement,
      });

      // Evaluate thermal conductivity and heat source at this Gauss point
      const k = thermalConductivityAt(xCoordinates);
      const Q = heatSourceAt(xCoordinates);

      // Integration factors, common to every pair of local nodes
      const weightFactor = gaussWeights[gaussPointIndex1] * detJacobian;
      const diffusionFactor = weightFactor * k;

      // Computation of Galerkin's residuals and local Jacobian matrix
      for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
        // Heat source contribution to local residual vector
        localResidualVector[localNodeIndex1] -= weightFactor * Q * basisFunction[localNodeIndex1];

        for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
          localJacobianMatrix[localNodeIndex1][localNodeIndex2] -=
            diffusionFactor * (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2]);
        }
      }
    }
  } else if (meshDimension === "2D") {
    // 2D solid heat transfer
    // Loop over integration points
    for (let pointIndex = 0; pointIndex < integrationPoints2D.length; pointIndex++) {
      const integrationWeight = integrationPoints2D[pointIndex][2];

      // Basis functions on the reference element at this integration point
      const { basisFunction, basisFunctionDerivKsi, basisFunctionDerivEta } =
        referenceBasisFunctions[pointIndex];

      // Perform isoparametric mapping
      const { xCoordinates, yCoordinates, detJacobian, basisFunctionDerivX, basisFunctionDerivY } =
        performIsoparametricMapping2D({
          basisFunction,
          basisFunctionDerivKsi,
          basisFunctionDerivEta,
          nodesXCoordinates,
          nodesYCoordinates,
          localToGlobalMap,
          nodesPerElement,
        });

      // Evaluate thermal conductivity and heat source at this integration point
      const k = thermalConductivityAt(xCoordinates, yCoordinates);
      const Q = heatSourceAt(xCoordinates, yCoordinates);

      // Integration factors, common to every pair of local nodes
      const weightFactor = integrationWeight * detJacobian;
      const diffusionFactor = weightFactor * k;

      // Computation of Galerkin's residuals and local Jacobian matrix
      for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
        // Heat source contribution to local residual vector
        localResidualVector[localNodeIndex1] -= weightFactor * Q * basisFunction[localNodeIndex1];

        for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
          localJacobianMatrix[localNodeIndex1][localNodeIndex2] -=
            diffusionFactor *
            (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] +
              basisFunctionDerivY[localNodeIndex1] * basisFunctionDerivY[localNodeIndex2]);
        }
      }
    }
  }

  return { localJacobianMatrix, localResidualVector, ngl };
}
