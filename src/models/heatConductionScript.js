/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import {
  initializeFEA,
  performIsoparametricMapping1D,
  performIsoparametricMapping2D,
} from "../mesh/meshUtilsScript.js";
import { ThermalBoundaryConditions } from "./thermalBoundaryConditionsScript.js";
import { basicLog, debugLog } from "../utilities/loggingScript.js";

/**
 * Function to assemble the Jacobian matrix and residuals vector for the solid heat transfer model
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled Jacobian matrix
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
export function assembleHeatConductionMat(meshData, boundaryConditions) {
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
  } = meshData;

  // Initialize FEA components
  const FEAData = initializeFEA(meshData);
  const {
    residualVector,
    jacobianMatrix,
    localToGlobalMap,
    basisFunctions,
    gaussPoints,
    gaussWeights,
    nodesPerElement,
  } = FEAData;

  // Matrix assembly
  for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
    // Map local element nodes to global mesh nodes
    for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
      // Subtract 1 from nop in order to start numbering from 0
      localToGlobalMap[localNodeIndex] = nop[elementIndex][localNodeIndex] - 1;
    }

    // Loop over Gauss points
    for (let gaussPointIndex1 = 0; gaussPointIndex1 < gaussPoints.length; gaussPointIndex1++) {
      // 1D solid heat transfer
      if (meshDimension === "1D") {
        // Get basis functions for the current Gauss point
        const basisFunctionsAndDerivatives = basisFunctions.getBasisFunctions(gaussPoints[gaussPointIndex1]);

        // Perform isoparametric mapping
        const mappingResult = performIsoparametricMapping1D({
          basisFunction: basisFunctionsAndDerivatives.basisFunction,
          basisFunctionDerivKsi: basisFunctionsAndDerivatives.basisFunctionDerivKsi,
          nodesXCoordinates,
          localToGlobalMap,
          nodesPerElement,
        });

        // Extract mapping results
        const { detJacobian, basisFunctionDerivX } = mappingResult;

        // Computation of Galerkin's residuals and Jacobian matrix
        for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
          let localToGlobalMap1 = localToGlobalMap[localNodeIndex1];
          // residualVector is zero for this case

          for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
            let localToGlobalMap2 = localToGlobalMap[localNodeIndex2];
            jacobianMatrix[localToGlobalMap1][localToGlobalMap2] +=
              -gaussWeights[gaussPointIndex1] *
              detJacobian *
              (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2]);
          }
        }
      }
      // 2D solid heat transfer
      else if (meshDimension === "2D") {
        for (let gaussPointIndex2 = 0; gaussPointIndex2 < gaussPoints.length; gaussPointIndex2++) {
          // Get basis functions for the current Gauss point
          const basisFunctionsAndDerivatives = basisFunctions.getBasisFunctions(
            gaussPoints[gaussPointIndex1],
            gaussPoints[gaussPointIndex2]
          );

          // Perform isoparametric mapping
          const mappingResult = performIsoparametricMapping2D({
            basisFunction: basisFunctionsAndDerivatives.basisFunction,
            basisFunctionDerivKsi: basisFunctionsAndDerivatives.basisFunctionDerivKsi,
            basisFunctionDerivEta: basisFunctionsAndDerivatives.basisFunctionDerivEta,
            nodesXCoordinates,
            nodesYCoordinates,
            localToGlobalMap,
            nodesPerElement,
          });

          // Extract mapping results
          const { detJacobian, basisFunctionDerivX, basisFunctionDerivY } = mappingResult;

          // Computation of Galerkin's residuals and Jacobian matrix
          for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
            let localToGlobalMap1 = localToGlobalMap[localNodeIndex1];
            // residualVector is zero for this case

            for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
              let localToGlobalMap2 = localToGlobalMap[localNodeIndex2];
              jacobianMatrix[localToGlobalMap1][localToGlobalMap2] +=
                -gaussWeights[gaussPointIndex1] *
                gaussWeights[gaussPointIndex2] *
                detJacobian *
                (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] +
                  basisFunctionDerivY[localNodeIndex1] * basisFunctionDerivY[localNodeIndex2]);
            }
          }
        }
      }
    }
  }

  // Apply boundary conditions
  const thermalBoundaryConditions = new ThermalBoundaryConditions(
    boundaryConditions,
    boundaryElements,
    nop,
    meshDimension,
    elementOrder
  );

  // Impose Convection boundary conditions
  thermalBoundaryConditions.imposeConvectionBoundaryConditions(
    residualVector,
    jacobianMatrix,
    gaussPoints,
    gaussWeights,
    nodesXCoordinates,
    nodesYCoordinates,
    basisFunctions
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
export function assembleHeatConductionFront({ elementIndex, nop, meshData, basisFunctions, FEAData }) {
  // Extract numerical integration parameters and mesh coordinates
  const { gaussPoints, gaussWeights, nodesPerElement } = FEAData;
  const { nodesXCoordinates, nodesYCoordinates, meshDimension } = meshData;

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
      // Get basis functions for the current Gauss point
      const { basisFunction, basisFunctionDerivKsi } = basisFunctions.getBasisFunctions(
        gaussPoints[gaussPointIndex1]
      );

      // Perform isoparametric mapping
      const { detJacobian, basisFunctionDerivX } = performIsoparametricMapping1D({
        basisFunction,
        basisFunctionDerivKsi,
        nodesXCoordinates,
        localToGlobalMap,
        nodesPerElement,
      });

      // Computation of Galerkin's residuals and local Jacobian matrix
      for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
        for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
          localJacobianMatrix[localNodeIndex1][localNodeIndex2] -=
            gaussWeights[gaussPointIndex1] *
            detJacobian *
            (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2]);
        }
      }
    }
  } else if (meshDimension === "2D") {
    // 2D solid heat transfer
    for (let gaussPointIndex1 = 0; gaussPointIndex1 < gaussPoints.length; gaussPointIndex1++) {
      for (let gaussPointIndex2 = 0; gaussPointIndex2 < gaussPoints.length; gaussPointIndex2++) {
        // Get basis functions for the current Gauss point
        const { basisFunction, basisFunctionDerivKsi, basisFunctionDerivEta } =
          basisFunctions.getBasisFunctions(gaussPoints[gaussPointIndex1], gaussPoints[gaussPointIndex2]);

        // Create mapping from local element space to global mesh (convert to 0-based indexing)
        const localToGlobalMap = ngl.map((globalIndex) => globalIndex - 1);

        // Perform isoparametric mapping
        const { detJacobian, basisFunctionDerivX, basisFunctionDerivY } = performIsoparametricMapping2D({
          basisFunction,
          basisFunctionDerivKsi,
          basisFunctionDerivEta,
          nodesXCoordinates,
          nodesYCoordinates,
          localToGlobalMap,
          nodesPerElement,
        });

        // Computation of Galerkin's residuals and local Jacobian matrix
        for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
          for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
            localJacobianMatrix[localNodeIndex1][localNodeIndex2] -=
              gaussWeights[gaussPointIndex1] *
              gaussWeights[gaussPointIndex2] *
              detJacobian *
              (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] +
                basisFunctionDerivY[localNodeIndex1] * basisFunctionDerivY[localNodeIndex2]);
          }
        }
      }
    }
  }

  return { localJacobianMatrix, localResidualVector, ngl };
}
