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
 * Function to assemble the solid heat transfer matrix
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled Jacobian matrix
 *  - residualVector: The assembled residual vector
 *  - nodesCoordinates: Object containing x and y coordinates of nodes
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

  // Print all residuals in debug mode
  debugLog("Residuals at each node:");
  for (let i = 0; i < residualVector.length; i++) {
    debugLog(`Node ${i}: ${residualVector[i].toExponential(6)}`);
  }

  basicLog("Solid heat transfer matrix assembly completed");

  return {
    jacobianMatrix,
    residualVector,
    nodesCoordinates: {
      nodesXCoordinates,
      nodesYCoordinates,
    },
  };
}

// Frontal solver element assembly
export function assembleSolidHeatTransferFront({
  elementIndex,
  nop,
  xCoordinates,
  yCoordinates,
  basisFunctions,
  gaussPoints,
  gaussWeights,
  ntopFlag = false,
  nlatFlag = false,
}) {
  const numNodes = 9; // biquadratic 2D
  const estifm = Array(numNodes)
    .fill()
    .map(() => Array(numNodes).fill(0));
  const localLoad = Array(numNodes).fill(0);

  // Global node numbers (1-based in nop)
  const ngl = Array(numNodes);
  for (let i = 0; i < numNodes; i++) ngl[i] = Math.abs(nop[elementIndex][i]);

  // Volume (conductive) contribution
  for (let j = 0; j < gaussPoints.length; j++) {
    for (let k = 0; k < gaussPoints.length; k++) {
      const { basisFunction, basisFunctionDerivKsi, basisFunctionDerivEta } =
        basisFunctions.getBasisFunctions(gaussPoints[j], gaussPoints[k]);

      const localToGlobalMap = ngl.map((g) => g - 1);

      const { detJacobian, basisFunctionDerivX, basisFunctionDerivY } = performIsoparametricMapping2D({
        basisFunction,
        basisFunctionDerivKsi,
        basisFunctionDerivEta,
        nodesXCoordinates: xCoordinates,
        nodesYCoordinates: yCoordinates,
        localToGlobalMap,
        numNodes,
      });

      for (let a = 0; a < numNodes; a++) {
        for (let b = 0; b < numNodes; b++) {
          estifm[a][b] -=
            gaussWeights[j] *
            gaussWeights[k] *
            detJacobian *
            (basisFunctionDerivX[a] * basisFunctionDerivX[b] +
              basisFunctionDerivY[a] * basisFunctionDerivY[b]);
        }
      }
    }
  }

  // Legacy natural boundary terms (top edge eta=1; right edge ksi=1) kept as in original frontal version
  if (ntopFlag) {
    for (let gp = 0; gp < gaussPoints.length; gp++) {
      const { basisFunction, basisFunctionDerivKsi } = basisFunctions.getBasisFunctions(gaussPoints[gp], 1);
      let x = 0,
        dx_dksi = 0;
      for (let n = 0; n < numNodes; n++) {
        const g = ngl[n] - 1;
        x += xCoordinates[g] * basisFunction[n];
        dx_dksi += xCoordinates[g] * basisFunctionDerivKsi[n];
      }
      // Local nodes on top edge: 2,5,8
      for (const idx of [2, 5, 8]) {
        localLoad[idx] -= gaussWeights[gp] * dx_dksi * basisFunction[idx] * x;
      }
    }
  }

  if (nlatFlag) {
    for (let gp = 0; gp < gaussPoints.length; gp++) {
      const { basisFunction, basisFunctionDerivEta } = basisFunctions.getBasisFunctions(1, gaussPoints[gp]);
      let y = 0,
        dy_deta = 0;
      for (let n = 0; n < numNodes; n++) {
        const g = ngl[n] - 1;
        y += yCoordinates[g] * basisFunction[n];
        dy_deta += yCoordinates[g] * basisFunctionDerivEta[n];
      }
      // Local nodes on right edge: 6,7,8
      for (const idx of [6, 7, 8]) {
        localLoad[idx] -= gaussWeights[gp] * dy_deta * basisFunction[idx] * y;
      }
    }
  }

  return { estifm, localLoad, ngl };
}
