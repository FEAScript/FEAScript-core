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
  };
}

/**
 * Function to assemble the local Jacobian matrix and residuals vector for the solid heat transfer model when using the frontal system solver
 */
export function assembleSolidHeatTransferFront({
  elementIndex,
  nop,
  meshData,
  basisFunctions,
  ntopFlag = false,
  nlatFlag = false,
  convectionTop = { active: false, coeff: 0, extTemp: 0 },
  FEAData,
}) {
  const { gaussPoints, gaussWeights, numNodes } = FEAData;
  const { nodesXCoordinates, nodesYCoordinates } = meshData;

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
        nodesXCoordinates,
        nodesYCoordinates,
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
  // Replace previous generic top-edge load term with explicit Robin (convection) if requested
  if (ntopFlag && convectionTop.active) {
    const h = convectionTop.coeff;
    const Text = convectionTop.extTemp;
    // Integrate along top edge (eta = 1); local top edge nodes: 2,5,8
    for (let gp = 0; gp < gaussPoints.length; gp++) {
      const ksi = gaussPoints[gp];
      const { basisFunction, basisFunctionDerivKsi } = basisFunctions.getBasisFunctions(ksi, 1);

      // Compute metric (edge length differential) |dx/dksi|
      let dx_dksi = 0,
        dy_dksi = 0;
      const topEdgeLocalNodes = [2, 5, 8];
      for (let n = 0; n < 9; n++) {
        const g = nop[elementIndex][n] - 1;
        dx_dksi += nodesXCoordinates[g] * basisFunctionDerivKsi[n];
        dy_dksi += nodesYCoordinates[g] * basisFunctionDerivKsi[n];
      }
      const ds_dksi = Math.sqrt(dx_dksi * dx_dksi + dy_dksi * dy_dksi);

      // Assemble Robin contributions
      for (const a of topEdgeLocalNodes) {
        for (const b of topEdgeLocalNodes) {
          estifm[a][b] -= gaussWeights[gp] * ds_dksi * h * basisFunction[a] * basisFunction[b];
        }
        localLoad[a] -= gaussWeights[gp] * ds_dksi * h * Text * basisFunction[a];
      }
    }
  } else if (ntopFlag && !convectionTop.active) {
    // If a zero-flux (symmetry) condition were applied on top, do nothing (natural BC)
    // (Previous placeholder load term removed to avoid unintended flux)
  }

  // If needed, similar patterned handling could be added for right edge (nlatFlag) later.

  return { estifm, localLoad, ngl };
}
