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
 */
export function assembleSolidHeatTransferMat(meshData, boundaryConditions) {
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
    numNodes,
  } = FEAData;

  // Matrix assembly
  for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
    // Map local element nodes to global mesh nodes
    for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
      // Subtract 1 from nop in order to start numbering from 0
      localToGlobalMap[localNodeIndex] = nop[elementIndex][localNodeIndex] - 1;
    }

    // Loop over Gauss points
    for (let gaussPointIndex1 = 0; gaussPointIndex1 < gaussPoints.length; gaussPointIndex1++) {
      // 1D solid heat transfer
      if (meshDimension === "1D") {
        // Get basis functions for the current Gauss point
        let basisFunctionsAndDerivatives = basisFunctions.getBasisFunctions(gaussPoints[gaussPointIndex1]);

        // Perform isoparametric mapping
        const mappingResult = performIsoparametricMapping1D({
          basisFunction: basisFunctionsAndDerivatives.basisFunction,
          basisFunctionDerivKsi: basisFunctionsAndDerivatives.basisFunctionDerivKsi,
          nodesXCoordinates,
          localToGlobalMap,
          numNodes,
        });

        // Extract mapping results
        const { detJacobian, basisFunctionDerivX } = mappingResult;

        // Computation of Galerkin's residuals and Jacobian matrix
        for (let localNodeIndex1 = 0; localNodeIndex1 < numNodes; localNodeIndex1++) {
          let localToGlobalMap1 = localToGlobalMap[localNodeIndex1];
          // residualVector is zero for this case

          for (let localNodeIndex2 = 0; localNodeIndex2 < numNodes; localNodeIndex2++) {
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
          let basisFunctionsAndDerivatives = basisFunctions.getBasisFunctions(
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
            numNodes,
          });

          // Extract mapping results
          const { detJacobian, basisFunctionDerivX, basisFunctionDerivY } = mappingResult;

          // Computation of Galerkin's residuals and Jacobian matrix
          for (let localNodeIndex1 = 0; localNodeIndex1 < numNodes; localNodeIndex1++) {
            let localToGlobalMap1 = localToGlobalMap[localNodeIndex1];
            // residualVector is zero for this case

            for (let localNodeIndex2 = 0; localNodeIndex2 < numNodes; localNodeIndex2++) {
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
    const estifm = Array(numNodes)
      .fill()
      .map(() => Array(numNodes).fill(0));
    const localLoad = Array(numNodes).fill(0);

    const ngl = Array(numNodes);
    for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++)
      ngl[localNodeIndex] = Math.abs(nop[elementIndex][localNodeIndex]);

    // Loop over Gauss points
    for (let gaussPointIndex1 = 0; gaussPointIndex1 < gaussPoints.length; gaussPointIndex1++) {
      for (let gaussPointIndex2 = 0; gaussPointIndex2 < gaussPoints.length; gaussPointIndex2++) {
        const { basisFunction, basisFunctionDerivKsi, basisFunctionDerivEta } =
          basisFunctions.getBasisFunctions(gaussPoints[gaussPointIndex1], gaussPoints[gaussPointIndex2]);

        const localToGlobalMap = ngl.map((globalIndex) => globalIndex - 1);

        const { detJacobian, basisFunctionDerivX, basisFunctionDerivY } = performIsoparametricMapping2D({
          basisFunction,
          basisFunctionDerivKsi,
          basisFunctionDerivEta,
          nodesXCoordinates,
          nodesYCoordinates,
          localToGlobalMap,
          numNodes,
        });

        for (let localNodeIndex1 = 0; localNodeIndex1 < numNodes; localNodeIndex1++) {
          for (let localNodeIndex2 = 0; localNodeIndex2 < numNodes; localNodeIndex2++) {
            estifm[localNodeIndex1][localNodeIndex2] -=
              gaussWeights[gaussPointIndex1] *
              gaussWeights[gaussPointIndex2] *
              detJacobian *
              (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] +
                basisFunctionDerivY[localNodeIndex1] * basisFunctionDerivY[localNodeIndex2]);
          }
        }
      }
    }

    return { estifm, localLoad, ngl };
  }

  // Apply boundary conditions
  basicLog("Applying thermal boundary conditions...");
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
  basicLog("Convection boundary conditions applied");

  // Impose ConstantTemp boundary conditions
  thermalBoundaryConditions.imposeConstantTempBoundaryConditions(residualVector, jacobianMatrix);
  basicLog("Constant temperature boundary conditions applied");
  basicLog("Solid heat transfer matrix assembly completed");

  return {
    jacobianMatrix,
    residualVector,
  };
}

/**
 * Function to assemble the local Jacobian matrix and residual vector for the solid heat transfer model when using the frontal system solver
 */
export function assembleSolidHeatTransferFront({ elementIndex, nop, meshData, basisFunctions, FEAData }) {
  const { gaussPoints, gaussWeights, numNodes } = FEAData;
  const { nodesXCoordinates, nodesYCoordinates } = meshData;

  //
  const estifm = Array(numNodes)
    .fill()
    .map(() => Array(numNodes).fill(0));
  const localLoad = Array(numNodes).fill(0);

  const ngl = Array(numNodes);
  for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++)
    ngl[localNodeIndex] = Math.abs(nop[elementIndex][localNodeIndex]);

  // Loop over Gauss points
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
        numNodes,
      });

      // Computation of Galerkin's residuals and local Jacobian matrix
      for (let localNodeIndex1 = 0; localNodeIndex1 < numNodes; localNodeIndex1++) {
        for (let localNodeIndex2 = 0; localNodeIndex2 < numNodes; localNodeIndex2++) {
          estifm[localNodeIndex1][localNodeIndex2] -=
            gaussWeights[gaussPointIndex1] *
            gaussWeights[gaussPointIndex2] *
            detJacobian *
            (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] +
              basisFunctionDerivY[localNodeIndex1] * basisFunctionDerivY[localNodeIndex2]);
        }
      }
    }
  }

  return { estifm, localLoad, ngl };
}
