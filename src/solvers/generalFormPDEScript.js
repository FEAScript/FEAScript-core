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
import { initializeFEA, performIsoparametricMapping1D } from "../mesh/meshUtilsScript.js";
import { GenericBoundaryConditions } from "./genericBoundaryConditionsScript.js";
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Function to assemble the Jacobian matrix and residuals vector for the general form PDE model
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions
 * @param {object} coefficientFunctions - Functions A(x), B(x), C(x), D(x) for the PDE
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled Jacobian matrix
 *  - residualVector: The assembled residual vector
 */
export function assembleGeneralFormPDEMat(meshData, boundaryConditions, coefficientFunctions) {
  basicLog("Starting general form PDE matrix assembly...");

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

  // Extract coefficient functions
  const { A, B, C, D } = coefficientFunctions;

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

  if (meshDimension === "1D") {
    // 1D general form PDE

    // Matrix assembly
    for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
      // Map local element nodes to global mesh nodes
      for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
        // Convert to 0-based indexing
        localToGlobalMap[localNodeIndex] = Math.abs(nop[elementIndex][localNodeIndex]) - 1;
      }

      // Loop over Gauss points
      for (let gaussPointIndex = 0; gaussPointIndex < gaussPoints.length; gaussPointIndex++) {
        // Get basis functions for the current Gauss point
        const { basisFunction, basisFunctionDerivKsi } = basisFunctions.getBasisFunctions(
          gaussPoints[gaussPointIndex]
        );

        // Perform isoparametric mapping
        const { detJacobian, basisFunctionDerivX } = performIsoparametricMapping1D({
          basisFunction,
          basisFunctionDerivKsi,
          nodesXCoordinates,
          localToGlobalMap,
          numNodes,
        });

        // Calculate the physical coordinate for this Gauss point
        let xCoord = 0;
        for (let i = 0; i < numNodes; i++) {
          xCoord += nodesXCoordinates[localToGlobalMap[i]] * basisFunction[i];
        }

        // Evaluate coefficient functions at this physical coordinate
        const a = A(xCoord);
        const b = B(xCoord);
        const c = C(xCoord);
        const d = D(xCoord);

        // Computation of Galerkin's residuals and local Jacobian matrix
        for (let localNodeIndex1 = 0; localNodeIndex1 < numNodes; localNodeIndex1++) {
          const globalNodeIndex1 = localToGlobalMap[localNodeIndex1];

          // Source term contribution to residual vector
          residualVector[globalNodeIndex1] -=
            gaussWeights[gaussPointIndex] * detJacobian * d * basisFunction[localNodeIndex1];

          for (let localNodeIndex2 = 0; localNodeIndex2 < numNodes; localNodeIndex2++) {
            const globalNodeIndex2 = localToGlobalMap[localNodeIndex2];

            // Diffusion term
            jacobianMatrix[globalNodeIndex1][globalNodeIndex2] +=
              gaussWeights[gaussPointIndex] *
              detJacobian *
              a *
              basisFunctionDerivX[localNodeIndex1] *
              basisFunctionDerivX[localNodeIndex2];

            // Advection term
            jacobianMatrix[globalNodeIndex1][globalNodeIndex2] -=
              gaussWeights[gaussPointIndex] *
              detJacobian *
              b *
              basisFunctionDerivX[localNodeIndex2] *
              basisFunction[localNodeIndex1];

            // Reaction term
            jacobianMatrix[globalNodeIndex1][globalNodeIndex2] +=
              gaussWeights[gaussPointIndex] *
              detJacobian *
              c *
              basisFunction[localNodeIndex1] *
              basisFunction[localNodeIndex2];
          }
        }
      }
    }
  } else if (meshDimension === "2D") {
    errorLog("2D general form PDE is not yet supported in assembleGeneralFormPDEMat.");
    // 2D general form PDE - empty for now
  }

  // Apply boundary conditions
  const genericBoundaryConditions = new GenericBoundaryConditions(
    boundaryConditions,
    boundaryElements,
    nop,
    meshDimension,
    elementOrder
  );

  // Apply Dirichlet boundary conditions only
  genericBoundaryConditions.imposeDirichletBoundaryConditions(residualVector, jacobianMatrix);

  basicLog("General form PDE matrix assembly completed");

  return {
    jacobianMatrix,
    residualVector,
  };
}

/**
 * Function to assemble the frontal solver matrix for the general form PDE model
 * @param {object} data - Object containing element data for the frontal solver
 * @returns {object} An object containing local Jacobian matrix and residual vector
 */
export function assembleGeneralFormPDEFront({
  elementIndex,
  nop,
  meshData,
  basisFunctions,
  FEAData,
  coefficientFunctions,
}) {
  // Extract numerical integration parameters and mesh coordinates
  const { gaussPoints, gaussWeights, numNodes } = FEAData;
  const { nodesXCoordinates, nodesYCoordinates, meshDimension } = meshData;
  const { A, B, C, D } = coefficientFunctions;

  // Initialize local Jacobian matrix and local residual vector
  const localJacobianMatrix = Array(numNodes)
    .fill()
    .map(() => Array(numNodes).fill(0));
  const localResidualVector = Array(numNodes).fill(0);

  // Build the mapping from local node indices to global node indices
  const ngl = Array(numNodes);
  const localToGlobalMap = Array(numNodes);
  for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
    ngl[localNodeIndex] = Math.abs(nop[elementIndex][localNodeIndex]);
    localToGlobalMap[localNodeIndex] = Math.abs(nop[elementIndex][localNodeIndex]) - 1;
  }

  if (meshDimension === "1D") {
    // 1D general form PDE

    // Loop over Gauss points
    for (let gaussPointIndex = 0; gaussPointIndex < gaussPoints.length; gaussPointIndex++) {
      // Get basis functions for the current Gauss point
      const { basisFunction, basisFunctionDerivKsi } = basisFunctions.getBasisFunctions(
        gaussPoints[gaussPointIndex]
      );

      // Perform isoparametric mapping
      const { detJacobian, basisFunctionDerivX } = performIsoparametricMapping1D({
        basisFunction,
        basisFunctionDerivKsi,
        nodesXCoordinates,
        localToGlobalMap,
        numNodes,
      });

      // Calculate the physical coordinate for this Gauss point
      let xCoord = 0;
      for (let i = 0; i < numNodes; i++) {
        xCoord += nodesXCoordinates[localToGlobalMap[i]] * basisFunction[i];
      }

      // Evaluate coefficient functions at this physical coordinate
      const a = A(xCoord);
      const b = B(xCoord);
      const c = C(xCoord);
      const d = D(xCoord);

      // Computation of local Jacobian matrix and residual vector
      for (let localNodeIndex1 = 0; localNodeIndex1 < numNodes; localNodeIndex1++) {
        // Source term contribution to local residual vector
        localResidualVector[localNodeIndex1] -=
          gaussWeights[gaussPointIndex] * detJacobian * d * basisFunction[localNodeIndex1];

        for (let localNodeIndex2 = 0; localNodeIndex2 < numNodes; localNodeIndex2++) {
          // Diffusion term
          localJacobianMatrix[localNodeIndex1][localNodeIndex2] +=
            gaussWeights[gaussPointIndex] *
            detJacobian *
            a *
            basisFunctionDerivX[localNodeIndex1] *
            basisFunctionDerivX[localNodeIndex2];

          // Advection term
          localJacobianMatrix[localNodeIndex1][localNodeIndex2] -=
            gaussWeights[gaussPointIndex] *
            detJacobian *
            b *
            basisFunctionDerivX[localNodeIndex2] *
            basisFunction[localNodeIndex1];

          // Reaction term
          localJacobianMatrix[localNodeIndex1][localNodeIndex2] +=
            gaussWeights[gaussPointIndex] *
            detJacobian *
            c *
            basisFunction[localNodeIndex1] *
            basisFunction[localNodeIndex2];
        }
      }
    }
  } else if (meshDimension === "2D") {
    errorLog("2D general form PDE is not yet supported in assembleGeneralFormPDEFront.");
    // 2D general form PDE - empty for now
  }

  return {
    localJacobianMatrix,
    localResidualVector,
    ngl,
  };
}
