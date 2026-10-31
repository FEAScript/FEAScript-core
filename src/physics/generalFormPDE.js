/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { initializeFEA } from "../elements/feaInitialization.js";
import { performIsoparametricMapping1D } from "../elements/isoparametricMapping.js";
import { GenericBoundaryConditions } from "./genericBoundaryConditions.js";
import { basicLog, errorLog } from "../utilities/logging.js";

/**
 * Function to assemble the Jacobian matrix and residuals vector for the general form PDE model
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions
 * @param {object} coefficientFunctions - Functions A(x), B(x), C(x), D(x) for the PDE
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled (sparse) Jacobian matrix
 *  - residualVector: The assembled residual vector
 */
export function assembleGeneralFormPDEMat(meshData, boundaryConditions, coefficientFunctions) {
  basicLog("Starting general form PDE matrix assembly...");

  // Extract mesh data
  const {
    nodesXCoordinates,
    nop,
    boundaryElements,
    totalElements,
    meshDimension,
    elementOrder,
    elementShape,
  } = meshData;

  // Extract coefficient functions
  const { A, B, C, D } = coefficientFunctions;

  // Initialize FEA components
  const FEAData = initializeFEA(meshData);
  const {
    residualVector,
    jacobianMatrix,
    localToGlobalMap,
    gaussPoints,
    gaussWeights,
    referenceBasisFunctions,
    nodesPerElement,
  } = FEAData;

  // Element matrix and basis function derivatives, reused for every element and Gauss point
  const localJacobianMatrix = new Float64Array(nodesPerElement * nodesPerElement);
  const basisFunctionDerivX = new Float64Array(nodesPerElement);

  if (meshDimension === "1D") {
    // 1D general form PDE

    // Matrix assembly
    for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
      // Map local element nodes to global mesh nodes
      for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
        // Convert to 0-based indexing
        localToGlobalMap[localNodeIndex] = Math.abs(nop[elementIndex][localNodeIndex]) - 1;
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

        // Evaluate coefficient functions at this physical coordinate
        const a = A(xCoordinates);
        const b = B(xCoordinates);
        const c = C(xCoordinates);
        const d = D(xCoordinates);

        // Integration factors, common to every pair of local nodes
        const weightFactor = gaussWeights[gaussPointIndex] * detJacobian;
        const diffusionFactor = weightFactor * a;
        const advectionFactor = -weightFactor * b;
        const reactionFactor = -weightFactor * c;

        // Computation of Galerkin's residuals and local Jacobian matrix
        for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
          // Source term contribution to residual vector
          residualVector[localToGlobalMap[localNodeIndex1]] -=
            weightFactor * d * basisFunction[localNodeIndex1];

          const rowOffset = localNodeIndex1 * nodesPerElement;
          for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
            // Diffusion term
            localJacobianMatrix[rowOffset + localNodeIndex2] +=
              diffusionFactor * basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2];

            // Advection term
            localJacobianMatrix[rowOffset + localNodeIndex2] +=
              advectionFactor * basisFunctionDerivX[localNodeIndex2] * basisFunction[localNodeIndex1];

            // Reaction term
            localJacobianMatrix[rowOffset + localNodeIndex2] +=
              reactionFactor * basisFunction[localNodeIndex1] * basisFunction[localNodeIndex2];
          }
        }
      }

      // Add the element contribution to the global Jacobian matrix
      jacobianMatrix.addLocalMatrix(localToGlobalMap, localJacobianMatrix);
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
    elementOrder,
    elementShape,
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
  const { gaussPoints, gaussWeights, referenceBasisFunctions, nodesPerElement } = FEAData;
  const { nodesXCoordinates, meshDimension } = meshData;
  const { A, B, C, D } = coefficientFunctions;

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

  if (meshDimension === "1D") {
    // 1D general form PDE

    // Loop over Gauss points
    for (let gaussPointIndex = 0; gaussPointIndex < gaussPoints.length; gaussPointIndex++) {
      // Basis functions on the reference element at this Gauss point
      const { basisFunction, basisFunctionDerivKsi } = referenceBasisFunctions[gaussPointIndex];

      // Perform isoparametric mapping
      const { xCoordinates, detJacobian, basisFunctionDerivX } = performIsoparametricMapping1D({
        basisFunction,
        basisFunctionDerivKsi,
        nodesXCoordinates,
        localToGlobalMap,
        nodesPerElement,
      });

      // Evaluate coefficient functions at this physical coordinate
      const a = A(xCoordinates);
      const b = B(xCoordinates);
      const c = C(xCoordinates);
      const d = D(xCoordinates);

      // Integration factors, common to every pair of local nodes
      const weightFactor = gaussWeights[gaussPointIndex] * detJacobian;
      const diffusionFactor = weightFactor * a;
      const advectionFactor = weightFactor * b;
      const reactionFactor = weightFactor * c;

      // Computation of local Jacobian matrix and residual vector
      for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
        // Source term contribution to local residual vector
        localResidualVector[localNodeIndex1] -= weightFactor * d * basisFunction[localNodeIndex1];

        for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
          // Diffusion term
          localJacobianMatrix[localNodeIndex1][localNodeIndex2] +=
            diffusionFactor * basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2];

          // Advection term
          localJacobianMatrix[localNodeIndex1][localNodeIndex2] -=
            advectionFactor * basisFunctionDerivX[localNodeIndex2] * basisFunction[localNodeIndex1];

          // Reaction term
          localJacobianMatrix[localNodeIndex1][localNodeIndex2] -=
            reactionFactor * basisFunction[localNodeIndex1] * basisFunction[localNodeIndex2];
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

/**
 * Function to assemble the Jacobian matrix and residual vector for the nonlinear general form PDE model,
 * to be used with the Newton-Raphson solver
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions
 * @param {object} coefficientFunctions - Functions A(x), B(x), C(x) for the linear terms, plus D(x, u) and
 *  dDdu(x, u) for the nonlinear reaction/source term and its derivative with respect to u
 * @param {array} solutionVector - The current solution vector (Newton-Raphson iterate)
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled (sparse) Jacobian matrix (negative of dResidual/du)
 *  - residualVector: The assembled residual vector
 */
export function assembleGeneralFormPDENonlinearMat(
  meshData,
  boundaryConditions,
  coefficientFunctions,
  solutionVector,
) {
  basicLog("Starting nonlinear general form PDE matrix assembly...");

  // Extract mesh data
  const {
    nodesXCoordinates,
    nop,
    boundaryElements,
    totalElements,
    meshDimension,
    elementOrder,
    elementShape,
  } = meshData;

  // Extract coefficient functions
  const { A, B, C, D, dDdu } = coefficientFunctions;

  // Initialize FEA components
  const FEAData = initializeFEA(meshData);
  const {
    residualVector,
    jacobianMatrix,
    localToGlobalMap,
    gaussPoints,
    gaussWeights,
    referenceBasisFunctions,
    nodesPerElement,
  } = FEAData;

  // Element matrix and basis function derivatives, reused for every element and Gauss point
  const localJacobianMatrix = new Float64Array(nodesPerElement * nodesPerElement);
  const basisFunctionDerivX = new Float64Array(nodesPerElement);

  if (meshDimension === "1D") {
    // 1D nonlinear general form PDE

    // Matrix assembly
    for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
      // Map local element nodes to global mesh nodes
      for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
        // Convert to 0-based indexing
        localToGlobalMap[localNodeIndex] = Math.abs(nop[elementIndex][localNodeIndex]) - 1;
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

        // Calculate the solution value and solution derivative at this Gauss point
        let uValue = 0;
        let uDerivX = 0;
        for (let i = 0; i < nodesPerElement; i++) {
          uValue += solutionVector[localToGlobalMap[i]] * basisFunction[i];
          uDerivX += solutionVector[localToGlobalMap[i]] * basisFunctionDerivX[i];
        }

        // Evaluate coefficient functions at this physical coordinate and solution state
        const a = A(xCoordinates);
        const b = B(xCoordinates);
        const c = C(xCoordinates);
        const d = D(xCoordinates, uValue);
        const dDduVal = dDdu(xCoordinates, uValue);

        // Integration factors, common to every pair of local nodes
        const weightFactor = gaussWeights[gaussPointIndex] * detJacobian;

        // Computation of the residual vector and the Newton-Raphson Jacobian matrix
        for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerElement; localNodeIndex1++) {
          // Residual contribution (diffusion, advection, reaction and nonlinear source terms)
          residualVector[localToGlobalMap[localNodeIndex1]] +=
            weightFactor *
            (a * uDerivX * basisFunctionDerivX[localNodeIndex1] -
              b * uDerivX * basisFunction[localNodeIndex1] -
              c * uValue * basisFunction[localNodeIndex1] +
              d * basisFunction[localNodeIndex1]);

          const rowOffset = localNodeIndex1 * nodesPerElement;
          for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerElement; localNodeIndex2++) {
            // Jacobian is the negative of the residual derivative, matching the Newton-Raphson solver convention
            localJacobianMatrix[rowOffset + localNodeIndex2] +=
              -weightFactor *
              (a * basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] -
                b * basisFunctionDerivX[localNodeIndex2] * basisFunction[localNodeIndex1] -
                c * basisFunction[localNodeIndex1] * basisFunction[localNodeIndex2] +
                dDduVal * basisFunction[localNodeIndex1] * basisFunction[localNodeIndex2]);
          }
        }
      }

      // Add the element contribution to the global Jacobian matrix
      jacobianMatrix.addLocalMatrix(localToGlobalMap, localJacobianMatrix);
    }
  } else if (meshDimension === "2D") {
    errorLog("2D nonlinear general form PDE is not yet supported in assembleGeneralFormPDENonlinearMat.");
    // 2D nonlinear general form PDE - empty for now
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

  // Apply Dirichlet boundary conditions only (as a Newton-Raphson increment, since solutionVector is passed)
  genericBoundaryConditions.imposeDirichletBoundaryConditions(residualVector, jacobianMatrix, solutionVector);

  basicLog("Nonlinear general form PDE matrix assembly completed");

  return {
    jacobianMatrix,
    residualVector,
  };
}
