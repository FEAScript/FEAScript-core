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
import { GenericBoundaryConditions } from "./genericBoundaryConditionsScript.js";
import {
  initializeFEA,
  performIsoparametricMapping1D,
  performIsoparametricMapping2D,
} from "../mesh/meshUtilsScript.js";
import { basicLog, debugLog } from "../utilities/loggingScript.js";

/**
 * Function to assemble the front propagation matrix
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @param {array} solutionVector - The solution vector for non-linear equations
 * @param {number} eikonalActivationFlag - Activation parameter for the eikonal equation
 * @returns {object}  An object containing:
 *  - jacobianMatrix: The assembled Jacobian matrix
 *  - residualVector: The assembled residual vector
 *  - nodesCoordinates: Object containing x and y coordinates of nodes
 */
export function assembleFrontPropagationMat(
  meshData,
  boundaryConditions,
  solutionVector,
  eikonalActivationFlag
) {
  basicLog("Starting front propagation matrix assembly...");

  // Calculate eikonal viscous term
  const baseEikonalViscousTerm = 1e-2; // Base viscous term that remains when eikonal equation is fully activated
  let eikonalViscousTerm = 1 - eikonalActivationFlag + baseEikonalViscousTerm; // Viscous term for the front propagation (eikonal) equation
  basicLog(`eikonalViscousTerm: ${eikonalViscousTerm}`);
  basicLog(`eikonalActivationFlag: ${eikonalActivationFlag}`);

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
      // 1D front propagation (eikonal) equation
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
        const basisFunction = basisFunctionsAndDerivatives.basisFunction;

        // Calculate solution derivative
        let solutionDerivX = 0;
        for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
          solutionDerivX +=
            solutionVector[localToGlobalMap[localNodeIndex]] * basisFunctionDerivX[localNodeIndex];
        }

        // Computation of Galerkin's residuals and Jacobian matrix
        for (let localNodeIndex1 = 0; localNodeIndex1 < numNodes; localNodeIndex1++) {
          let localToGlobalMap1 = localToGlobalMap[localNodeIndex1];
          // residualVector
          // To perform residualVector calculation here

          for (let localNodeIndex2 = 0; localNodeIndex2 < numNodes; localNodeIndex2++) {
            let localToGlobalMap2 = localToGlobalMap[localNodeIndex2];
            // jacobianMatrix
            // To perform jacobianMatrix calculation here
          }
        }
      }
      // 2D front propagation (eikonal) equation
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
          const basisFunction = basisFunctionsAndDerivatives.basisFunction;

          // Calculate solution derivatives
          let solutionDerivX = 0;
          let solutionDerivY = 0;
          for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
            solutionDerivX +=
              solutionVector[localToGlobalMap[localNodeIndex]] * basisFunctionDerivX[localNodeIndex];
            solutionDerivY +=
              solutionVector[localToGlobalMap[localNodeIndex]] * basisFunctionDerivY[localNodeIndex];
          }

          // Computation of Galerkin's residuals and Jacobian matrix
          for (let localNodeIndex1 = 0; localNodeIndex1 < numNodes; localNodeIndex1++) {
            let localToGlobalMap1 = localToGlobalMap[localNodeIndex1];

            // residualVector: Viscous term contribution (to stabilize the solution)
            residualVector[localToGlobalMap1] +=
              eikonalViscousTerm *
                gaussWeights[gaussPointIndex1] *
                gaussWeights[gaussPointIndex2] *
                detJacobian *
                basisFunctionDerivX[localNodeIndex1] *
                solutionDerivX +
              eikonalViscousTerm *
                gaussWeights[gaussPointIndex1] *
                gaussWeights[gaussPointIndex2] *
                detJacobian *
                basisFunctionDerivY[localNodeIndex1] *
                solutionDerivY;

            // residualVector: Eikonal equation contribution
            if (eikonalActivationFlag !== 0) {
              residualVector[localToGlobalMap1] +=
                eikonalActivationFlag *
                (gaussWeights[gaussPointIndex1] *
                  gaussWeights[gaussPointIndex2] *
                  detJacobian *
                  basisFunction[localNodeIndex1] *
                  Math.sqrt(solutionDerivX ** 2 + solutionDerivY ** 2) -
                  gaussWeights[gaussPointIndex1] *
                    gaussWeights[gaussPointIndex2] *
                    detJacobian *
                    basisFunction[localNodeIndex1]);
            }

            for (let localNodeIndex2 = 0; localNodeIndex2 < numNodes; localNodeIndex2++) {
              let localToGlobalMap2 = localToGlobalMap[localNodeIndex2];

              // jacobianMatrix: Viscous term contribution
              jacobianMatrix[localToGlobalMap1][localToGlobalMap2] +=
                -eikonalViscousTerm *
                gaussWeights[gaussPointIndex1] *
                gaussWeights[gaussPointIndex2] *
                detJacobian *
                (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] +
                  basisFunctionDerivY[localNodeIndex1] * basisFunctionDerivY[localNodeIndex2]);

              // jacobianMatrix: Eikonal equation contribution
              if (eikonalActivationFlag !== 0) {
                jacobianMatrix[localToGlobalMap1][localToGlobalMap2] +=
                  eikonalActivationFlag *
                    (-(
                      detJacobian *
                      solutionDerivX *
                      basisFunction[localNodeIndex1] *
                      gaussWeights[gaussPointIndex1] *
                      gaussWeights[gaussPointIndex2]
                    ) /
                      Math.sqrt(solutionDerivX ** 2 + solutionDerivY ** 2 + 1e-8)) *
                    basisFunctionDerivX[localNodeIndex2] -
                  ((detJacobian *
                    solutionDerivY *
                    basisFunction[localNodeIndex1] *
                    gaussWeights[gaussPointIndex1] *
                    gaussWeights[gaussPointIndex2]) /
                    Math.sqrt(solutionDerivX ** 2 + solutionDerivY ** 2 + 1e-8)) *
                    basisFunctionDerivY[localNodeIndex2];
              }
            }
          }
        }
      }
    }
  }

  // Apply boundary conditions
  basicLog("Applying generic boundary conditions...");
  const genericBoundaryConditions = new GenericBoundaryConditions(
    boundaryConditions,
    boundaryElements,
    nop,
    meshDimension,
    elementOrder
  );

  // Impose ConstantValue boundary conditions
  genericBoundaryConditions.imposeConstantValueBoundaryConditions(residualVector, jacobianMatrix);
  basicLog("Constant value boundary conditions applied");

  // Print all residuals in debug mode
  debugLog("Residuals at each node:");
  for (let i = 0; i < residualVector.length; i++) {
    debugLog(`Node ${i}: ${residualVector[i].toExponential(6)}`);
  }

  basicLog("Front propagation matrix assembly completed");

  return {
    jacobianMatrix,
    residualVector,
    nodesCoordinates: {
      nodesXCoordinates,
      nodesYCoordinates,
    },
  };
}
