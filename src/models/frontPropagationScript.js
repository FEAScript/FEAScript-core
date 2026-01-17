/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { GenericBoundaryConditions } from "./genericBoundaryConditionsScript.js";
import {
  initializeFEA,
  performIsoparametricMapping1D,
  performIsoparametricMapping2D,
} from "../mesh/meshUtilsScript.js";
import { basicLog, debugLog } from "../utilities/loggingScript.js";

// Base viscous term that remains when eikonal equation is fully activated
const baseEikonalViscousTerm = 1e-2;

/**
 * Function to assemble the Jacobian matrix and residuals vector for the front propagation model
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @param {array} solutionVector - The solution vector for non-linear equations
 * @param {number} eikonalActivationFlag - Activation parameter for the eikonal equation
 * @returns {object}  An object containing:
 *  - jacobianMatrix: The assembled Jacobian matrix
 *  - residualVector: The assembled residual vector
 */
export function assembleFrontPropagationMat(
  meshData,
  boundaryConditions,
  solutionVector,
  eikonalActivationFlag,
) {
  basicLog("Starting front propagation matrix assembly...");

  // Calculate eikonal viscous term
  let eikonalViscousTerm = 1 - eikonalActivationFlag + baseEikonalViscousTerm; // Viscous term for the front propagation (eikonal) equation
  debugLog(`eikonalViscousTerm: ${eikonalViscousTerm}`);
  debugLog(`eikonalActivationFlag: ${eikonalActivationFlag}`);

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
      // 1D front propagation (eikonal) equation
      if (meshDimension === "1D") {
        // Unsupported 1D front propagation
        errorLog("1D front propagation is not yet supported");

        // Get basis functions for the current Gauss point
        let basisFunctionsAndDerivatives = basisFunctions.getBasisFunctions(gaussPoints[gaussPointIndex1]);

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
        const basisFunction = basisFunctionsAndDerivatives.basisFunction;

        // Calculate solution derivative
        let solutionDerivX = 0;
        for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
          solutionDerivX +=
            solutionVector[localToGlobalMap[localNodeIndex]] * basisFunctionDerivX[localNodeIndex];
        }

        // Computation of Galerkin's residuals and Jacobian matrix
        for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
          let localToGlobalMap1 = localToGlobalMap[localNodeIndex1];
          // residualVector
          // TODO residualVector calculation here

          for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
            let localToGlobalMap2 = localToGlobalMap[localNodeIndex2];
            // jacobianMatrix
            // TODO jacobianMatrix calculation here
          }
        }
      }
      // 2D front propagation (eikonal) equation
      else if (meshDimension === "2D") {
        for (let gaussPointIndex2 = 0; gaussPointIndex2 < gaussPoints.length; gaussPointIndex2++) {
          // Get basis functions for the current Gauss point
          let basisFunctionsAndDerivatives = basisFunctions.getBasisFunctions(
            gaussPoints[gaussPointIndex1],
            gaussPoints[gaussPointIndex2],
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
          const basisFunction = basisFunctionsAndDerivatives.basisFunction;

          // Calculate solution derivatives
          let solutionDerivX = 0;
          let solutionDerivY = 0;
          for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
            solutionDerivX +=
              solutionVector[localToGlobalMap[localNodeIndex]] * basisFunctionDerivX[localNodeIndex];
            solutionDerivY +=
              solutionVector[localToGlobalMap[localNodeIndex]] * basisFunctionDerivY[localNodeIndex];
          }

          // Computation of Galerkin's residuals and Jacobian matrix
          for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
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

            for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
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
                  eikonalActivationFlag *
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
  const genericBoundaryConditions = new GenericBoundaryConditions(
    boundaryConditions,
    boundaryElements,
    nop,
    meshDimension,
    elementOrder,
  );

  // Impose Dirichlet boundary conditions
  genericBoundaryConditions.imposeDirichletBoundaryConditions(residualVector, jacobianMatrix);
  basicLog("Front propagation matrix assembly completed");

  return {
    jacobianMatrix,
    residualVector,
  };
}

/**
 * Function to assemble the local Jacobian matrix and residual vector for the front propagation model when using the frontal system solver
 * @param {number} elementIndex - Index of the element being processed
 * @param {array} nop - Nodal connectivity array (element-to-node mapping)
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} FEAData - Object containing FEA-related data
 * @param {array} solutionVector - The solution vector for non-linear equations
 * @param {number} eikonalActivationFlag - Activation parameter for the eikonal equation
 * @returns {object} An object containing:
 *  - localJacobianMatrix: Local Jacobian matrix
 *  - residualVector: Residual vector contributions
 *  - ngl: Array mapping local node indices to global node indices
 */
export function assembleFrontPropagationFront({
  elementIndex,
  nop,
  meshData,
  FEAData,
  solutionVector,
  eikonalActivationFlag,
}) {
  // nop is passed explicitly because the frontal solver tags last appearances with sign flips
  // Extract numerical integration parameters and mesh coordinates
  const { gaussPoints, gaussWeights, nodesPerElement, basisFunctions } = FEAData;
  const { nodesXCoordinates, nodesYCoordinates, meshDimension } = meshData;

  // Calculate eikonal viscous term
  let eikonalViscousTerm = 1 - eikonalActivationFlag + baseEikonalViscousTerm; // Viscous term for the front propagation (eikonal) equation

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
  for (let gaussPointIndex1 = 0; gaussPointIndex1 < gaussPoints.length; gaussPointIndex1++) {
    // 1D front propagation (eikonal) equation
    if (meshDimension === "1D") {
      // Unsupported 1D front propagation
      errorLog("1D front propagation is not yet supported");

      // Get basis functions for the current Gauss point
      let basisFunctionsAndDerivatives = basisFunctions.getBasisFunctions(gaussPoints[gaussPointIndex1]);

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
      const basisFunction = basisFunctionsAndDerivatives.basisFunction;

      // Calculate solution derivative
      let solutionDerivX = 0;
      for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
        solutionDerivX +=
          solutionVector[localToGlobalMap[localNodeIndex]] * basisFunctionDerivX[localNodeIndex];
      }

      // Computation of Galerkin's residuals and Jacobian matrix
      for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
        let localToGlobalMap1 = localToGlobalMap[localNodeIndex1];
        // residualVector
        // TODO residualVector calculation here

        for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
          let localToGlobalMap2 = localToGlobalMap[localNodeIndex2];
          // localJacobianMatrix
          // TODO localJacobianMatrix calculation here
        }
      }
      // 2D front propagation (eikonal) equation
    } else if (meshDimension === "2D") {
      for (let gaussPointIndex2 = 0; gaussPointIndex2 < gaussPoints.length; gaussPointIndex2++) {
        // Get basis functions for the current Gauss point
        const { basisFunction, basisFunctionDerivKsi, basisFunctionDerivEta } =
          basisFunctions.getBasisFunctions(gaussPoints[gaussPointIndex1], gaussPoints[gaussPointIndex2]);

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

        // Calculate solution derivatives
        let solutionDerivX = 0;
        let solutionDerivY = 0;
        for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
          solutionDerivX +=
            solutionVector[localToGlobalMap[localNodeIndex]] * basisFunctionDerivX[localNodeIndex];
          solutionDerivY +=
            solutionVector[localToGlobalMap[localNodeIndex]] * basisFunctionDerivY[localNodeIndex];
        }

        // Computation of Galerkin's residuals and Jacobian matrix
        for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
          let localToGlobalMap1 = localToGlobalMap[localNodeIndex1];
          // Viscous term contribution
          localResidualVector[localNodeIndex1] +=
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

          // Eikonal equation contribution
          if (eikonalActivationFlag !== 0) {
            localResidualVector[localNodeIndex1] +=
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

          for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
            // Viscous term contribution
            localJacobianMatrix[localNodeIndex1][localNodeIndex2] -=
              eikonalViscousTerm *
              gaussWeights[gaussPointIndex1] *
              gaussWeights[gaussPointIndex2] *
              detJacobian *
              (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] +
                basisFunctionDerivY[localNodeIndex1] * basisFunctionDerivY[localNodeIndex2]);

            // Eikonal equation contribution
            if (eikonalActivationFlag !== 0) {
              localJacobianMatrix[localNodeIndex1][localNodeIndex2] +=
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
                eikonalActivationFlag *
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

  return { localJacobianMatrix, localResidualVector, ngl };
}
