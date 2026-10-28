/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { GenericBoundaryConditions } from "./genericBoundaryConditions.js";
import { getIntegrationPoints2D, initializeFEA, performIsoparametricMapping2D } from "../mesh/meshUtils.js";
import { basicLog, debugLog, errorLog } from "../utilities/logging.js";

// Base viscous term that remains when eikonal equation is fully activated
const baseEikonalViscousTerm = 1e-2;

// Minimum viscous term per unit element size, which keeps the eikonal equation stable on coarse meshes
const eikonalViscousTermPerElementSize = 1e-1;

/**
 * Function to calculate the viscous term of the front propagation (eikonal) equation for an element.
 * The remaining viscous term, when the eikonal equation is fully activated, is at least proportional
 * to the element size, so that it vanishes under mesh refinement but stabilizes coarse meshes
 * @param {number} eikonalActivationFlag - Activation parameter for the eikonal equation
 * @param {array} integrationPoints2D - Array of [ksi, eta, weight] integration points
 * @param {object} basisFunctions - Object containing basis functions and their derivatives
 * @param {object} meshData - Object containing prepared mesh data
 * @param {array} localToGlobalMap - Array mapping local node indices to global node indices (0-based)
 * @param {number} nodesPerElement - Number of nodes per element
 * @returns {number} The viscous term for the element
 */
function computeEikonalViscousTerm(
  eikonalActivationFlag,
  integrationPoints2D,
  basisFunctions,
  meshData,
  localToGlobalMap,
  nodesPerElement,
) {
  const { nodesXCoordinates, nodesYCoordinates, elementOrder } = meshData;

  // Element area from the same integration points used in the assembly
  let elementArea = 0;
  for (const [ksi, eta, integrationWeight] of integrationPoints2D) {
    const { basisFunction, basisFunctionDerivKsi, basisFunctionDerivEta } = basisFunctions.getBasisFunctions(
      ksi,
      eta,
    );
    const { detJacobian } = performIsoparametricMapping2D({
      basisFunction,
      basisFunctionDerivKsi,
      basisFunctionDerivEta,
      nodesXCoordinates,
      nodesYCoordinates,
      localToGlobalMap,
      nodesPerElement,
    });
    elementArea += integrationWeight * Math.abs(detJacobian);
  }

  // Element size per node spacing (quadratic elements have half the node spacing of linear ones)
  const elementSize = Math.sqrt(elementArea) / (elementOrder === "quadratic" ? 2 : 1);

  return (
    1 -
    eikonalActivationFlag +
    Math.max(baseEikonalViscousTerm, eikonalViscousTermPerElementSize * elementSize)
  );
}

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
    elementShape,
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

  // Unsupported 1D front propagation
  if (meshDimension === "1D") {
    errorLog("1D front propagation is not yet supported");
  }

  // Integration points for 2D elements (tensor product for quads, collapsed rule for triangles)
  const integrationPoints2D =
    meshDimension === "2D" ? getIntegrationPoints2D(gaussPoints, gaussWeights, elementShape) : [];

  // Matrix assembly
  for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
    // Map local element nodes to global mesh nodes
    for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
      // Subtract 1 from nop in order to start numbering from 0
      localToGlobalMap[localNodeIndex] = nop[elementIndex][localNodeIndex] - 1;
    }

    // 2D front propagation (eikonal) equation
    if (meshDimension === "2D") {
      // Viscous term for the front propagation (eikonal) equation
      const eikonalViscousTerm = computeEikonalViscousTerm(
        eikonalActivationFlag,
        integrationPoints2D,
        basisFunctions,
        meshData,
        localToGlobalMap,
        nodesPerElement,
      );

      // Loop over integration points
      for (const [ksi, eta, integrationWeight] of integrationPoints2D) {
        // Get basis functions for the current Gauss point
        let basisFunctionsAndDerivatives = basisFunctions.getBasisFunctions(ksi, eta);

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
              integrationWeight *
              detJacobian *
              basisFunctionDerivX[localNodeIndex1] *
              solutionDerivX +
            eikonalViscousTerm *
              integrationWeight *
              detJacobian *
              basisFunctionDerivY[localNodeIndex1] *
              solutionDerivY;

          // residualVector: Eikonal equation contribution
          if (eikonalActivationFlag !== 0) {
            residualVector[localToGlobalMap1] +=
              eikonalActivationFlag *
              (integrationWeight *
                detJacobian *
                basisFunction[localNodeIndex1] *
                Math.sqrt(solutionDerivX ** 2 + solutionDerivY ** 2) -
                integrationWeight * detJacobian * basisFunction[localNodeIndex1]);
          }

          for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
            let localToGlobalMap2 = localToGlobalMap[localNodeIndex2];

            // jacobianMatrix: Viscous term contribution
            jacobianMatrix[localToGlobalMap1][localToGlobalMap2] +=
              -eikonalViscousTerm *
              integrationWeight *
              detJacobian *
              (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] +
                basisFunctionDerivY[localNodeIndex1] * basisFunctionDerivY[localNodeIndex2]);

            // jacobianMatrix: Eikonal equation contribution
            if (eikonalActivationFlag !== 0) {
              jacobianMatrix[localToGlobalMap1][localToGlobalMap2] +=
                eikonalActivationFlag *
                  (-(detJacobian * solutionDerivX * basisFunction[localNodeIndex1] * integrationWeight) /
                    Math.sqrt(solutionDerivX ** 2 + solutionDerivY ** 2 + 1e-8)) *
                  basisFunctionDerivX[localNodeIndex2] -
                eikonalActivationFlag *
                  ((detJacobian * solutionDerivY * basisFunction[localNodeIndex1] * integrationWeight) /
                    Math.sqrt(solutionDerivX ** 2 + solutionDerivY ** 2 + 1e-8)) *
                  basisFunctionDerivY[localNodeIndex2];
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
    elementShape,
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
 * @param {object} basisFunctions - Object containing basis functions and their derivatives
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
  basisFunctions,
  FEAData,
  solutionVector,
  eikonalActivationFlag,
}) {
  // Extract numerical integration parameters and mesh coordinates
  const { gaussPoints, gaussWeights, nodesPerElement } = FEAData;
  const { nodesXCoordinates, nodesYCoordinates, meshDimension, elementShape } = meshData;

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

  // 1D front propagation (eikonal) equation
  if (meshDimension === "1D") {
    errorLog("1D front propagation is not yet supported");
    // 2D front propagation (eikonal) equation
  } else if (meshDimension === "2D") {
    const integrationPoints2D = getIntegrationPoints2D(gaussPoints, gaussWeights, elementShape);

    // Viscous term for the front propagation (eikonal) equation
    const eikonalViscousTerm = computeEikonalViscousTerm(
      eikonalActivationFlag,
      integrationPoints2D,
      basisFunctions,
      meshData,
      localToGlobalMap,
      nodesPerElement,
    );

    // Loop over integration points
    for (const [ksi, eta, integrationWeight] of integrationPoints2D) {
      // Get basis functions for the current Gauss point
      const { basisFunction, basisFunctionDerivKsi, basisFunctionDerivEta } =
        basisFunctions.getBasisFunctions(ksi, eta);

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
        // Viscous term contribution
        localResidualVector[localNodeIndex1] +=
          eikonalViscousTerm *
            integrationWeight *
            detJacobian *
            basisFunctionDerivX[localNodeIndex1] *
            solutionDerivX +
          eikonalViscousTerm *
            integrationWeight *
            detJacobian *
            basisFunctionDerivY[localNodeIndex1] *
            solutionDerivY;

        // Eikonal equation contribution
        if (eikonalActivationFlag !== 0) {
          localResidualVector[localNodeIndex1] +=
            eikonalActivationFlag *
            (integrationWeight *
              detJacobian *
              basisFunction[localNodeIndex1] *
              Math.sqrt(solutionDerivX ** 2 + solutionDerivY ** 2) -
              integrationWeight * detJacobian * basisFunction[localNodeIndex1]);
        }

        for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
          // Viscous term contribution
          localJacobianMatrix[localNodeIndex1][localNodeIndex2] -=
            eikonalViscousTerm *
            integrationWeight *
            detJacobian *
            (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] +
              basisFunctionDerivY[localNodeIndex1] * basisFunctionDerivY[localNodeIndex2]);

          // Eikonal equation contribution
          if (eikonalActivationFlag !== 0) {
            localJacobianMatrix[localNodeIndex1][localNodeIndex2] +=
              eikonalActivationFlag *
                (-(detJacobian * solutionDerivX * basisFunction[localNodeIndex1] * integrationWeight) /
                  Math.sqrt(solutionDerivX ** 2 + solutionDerivY ** 2 + 1e-8)) *
                basisFunctionDerivX[localNodeIndex2] -
              eikonalActivationFlag *
                ((detJacobian * solutionDerivY * basisFunction[localNodeIndex1] * integrationWeight) /
                  Math.sqrt(solutionDerivX ** 2 + solutionDerivY ** 2 + 1e-8)) *
                basisFunctionDerivY[localNodeIndex2];
          }
        }
      }
    }
  }

  return { localJacobianMatrix, localResidualVector, ngl };
}
