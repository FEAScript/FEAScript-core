//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

import { basisFunctions } from "../mesh/basisFunctionsScript.js";
import { numericalIntegration } from "../methods/numericalIntegrationScript.js";
import { meshGeneration } from "../mesh/meshGenerationScript.js";
import { ThermalBoundaryConditions } from "./thermalBoundaryConditionsScript.js";
import { basicLog, debugLog } from "../utilities/loggingScript.js";

/**
 * Assemble the solid heat transfer matrix
 * @param {object} meshConfig - Object containing computational mesh details
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled Jacobian matrix
 *  - residualVector: The assembled residual vector
 *  - nodesCoordinates: Object containing x and y coordinates of nodes
 */
export function assembleSolidHeatTransferMat(meshConfig, boundaryConditions) {
  basicLog("Starting solid heat transfer matrix assembly");

  // Extract mesh details from the configuration object
  const {
    meshDimension, // The dimension of the mesh
    numElementsX, // Number of elements in x-direction
    numElementsY, // Number of elements in y-direction (only for 2D)
    maxX, // Max x-coordinate (m) of the domain
    maxY, // Max y-coordinate (m) of the domain (only for 2D)
    elementOrder, // The order of elements
  } = meshConfig;

  debugLog(
    `Mesh configuration: ${meshDimension}, Elements: ${numElementsX}x${numElementsY || 1}, Size: ${maxX}x${
      maxY || 0
    }, Order: ${elementOrder}`
  );

  // Create a new instance of the meshGeneration class
  debugLog("Generating mesh...");
  const meshGenerationData = new meshGeneration({
    numElementsX,
    numElementsY,
    maxX,
    maxY,
    meshDimension,
    elementOrder,
  });

  // Generate the mesh
  const nodesCoordinatesAndNumbering = meshGenerationData.generateMesh();

  // Extract nodes coordinates and nodal numbering (NOP) from the mesh data
  let nodesXCoordinates = nodesCoordinatesAndNumbering.nodesXCoordinates;
  let nodesYCoordinates = nodesCoordinatesAndNumbering.nodesYCoordinates;
  let totalNodesX = nodesCoordinatesAndNumbering.totalNodesX;
  let totalNodesY = nodesCoordinatesAndNumbering.totalNodesY;
  let nop = nodesCoordinatesAndNumbering.nodalNumbering;
  let boundaryElements = nodesCoordinatesAndNumbering.boundaryElements;

  // Initialize variables for matrix assembly
  const totalElements = numElementsX * (meshDimension === "2D" ? numElementsY : 1); // Total number of elements
  const totalNodes = totalNodesX * (meshDimension === "2D" ? totalNodesY : 1); // Total number of nodes
  let localNodalNumbers = []; // Local nodal numbering
  let gaussPoints = []; // Gauss points
  let gaussWeights = []; // Gauss weights
  let basisFunction = []; // Basis functions
  let basisFunctionDerivKsi = []; // Derivatives of basis functions with respect to ksi
  let basisFunctionDerivEta = []; // Derivatives of basis functions with respect to eta (only for 2D)
  let basisFunctionDerivX = []; // The x-derivative of the basis function
  let basisFunctionDerivY = []; // The y-derivative of the basis function (only for 2D)
  let residualVector = []; // Galerkin residuals
  let jacobianMatrix = []; // Jacobian matrix
  let xCoordinates; // x-coordinate (physical coordinates)
  let yCoordinates; // y-coordinate (physical coordinates) (only for 2D)
  let ksiDerivX; // ksi-derivative of xCoordinates
  let etaDerivX; // eta-derivative of xCoordinates (ksi and eta are natural coordinates that vary within a reference element) (only for 2D)
  let ksiDerivY; // ksi-derivative of yCoordinates (only for 2D)
  let etaDerivY; // eta-derivative of yCoordinates (only for 2D)
  let detJacobian; // The jacobian of the isoparametric mapping

  // Initialize jacobianMatrix and residualVector arrays
  for (let nodeIndex = 0; nodeIndex < totalNodes; nodeIndex++) {
    residualVector[nodeIndex] = 0;
    jacobianMatrix.push([]);
    for (let colIndex = 0; colIndex < totalNodes; colIndex++) {
      jacobianMatrix[nodeIndex][colIndex] = 0;
    }
  }

  // Initialize the basisFunctions class
  const basisFunctionsData = new basisFunctions({
    meshDimension,
    elementOrder,
  });

  // Initialize the numericalIntegration class
  const numIntegrationData = new numericalIntegration({
    meshDimension,
    elementOrder,
  });

  // Calculate Gauss points and weights
  let gaussPointsAndWeights = numIntegrationData.getGaussPointsAndWeights();
  gaussPoints = gaussPointsAndWeights.gaussPoints;
  gaussWeights = gaussPointsAndWeights.gaussWeights;

  // Determine the number of nodes in the reference element based on the first element in the nop array
  const numNodes = nop[0].length;

  // Matrix assembly
  for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
    for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
      // Subtract 1 from nop in order to start numbering from 0
      localNodalNumbers[localNodeIndex] = nop[elementIndex][localNodeIndex] - 1;
    }

    // Loop over Gauss points
    for (let gaussPointIndex1 = 0; gaussPointIndex1 < gaussPoints.length; gaussPointIndex1++) {
      // 1D solid heat transfer
      if (meshDimension === "1D") {
        let basisFunctionsAndDerivatives = basisFunctionsData.getBasisFunctions(
          gaussPoints[gaussPointIndex1]
        );
        basisFunction = basisFunctionsAndDerivatives.basisFunction;
        basisFunctionDerivKsi = basisFunctionsAndDerivatives.basisFunctionDerivKsi;
        xCoordinates = 0;
        ksiDerivX = 0;
        detJacobian = 0;

        // Isoparametric mapping
        for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
          xCoordinates +=
            nodesXCoordinates[localNodalNumbers[localNodeIndex]] * basisFunction[localNodeIndex];
          ksiDerivX +=
            nodesXCoordinates[localNodalNumbers[localNodeIndex]] * basisFunctionDerivKsi[localNodeIndex];
          detJacobian = ksiDerivX;
        }

        // Compute x-derivative of basis functions
        for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
          basisFunctionDerivX[localNodeIndex] = basisFunctionDerivKsi[localNodeIndex] / detJacobian; // The x-derivative of the n basis function
        }

        // Computation of Galerkin's residuals and Jacobian matrix
        for (let localNodeIndex1 = 0; localNodeIndex1 < numNodes; localNodeIndex1++) {
          let globalNodeIndex1 = localNodalNumbers[localNodeIndex1];
          residualVector[globalNodeIndex1] +=
            gaussWeights[gaussPointIndex1] * detJacobian * basisFunction[localNodeIndex1];

          for (let localNodeIndex2 = 0; localNodeIndex2 < numNodes; localNodeIndex2++) {
            let globalNodeIndex2 = localNodalNumbers[localNodeIndex2];
            jacobianMatrix[globalNodeIndex1][globalNodeIndex2] +=
              -gaussWeights[gaussPointIndex1] *
              detJacobian *
              (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2]);
          }
        }
        // 2D solid heat transfer
      } else if (meshDimension === "2D") {
        for (let gaussPointIndex2 = 0; gaussPointIndex2 < gaussPoints.length; gaussPointIndex2++) {
          // Initialise variables for isoparametric mapping
          let basisFunctionsAndDerivatives = basisFunctionsData.getBasisFunctions(
            gaussPoints[gaussPointIndex1],
            gaussPoints[gaussPointIndex2]
          );
          basisFunction = basisFunctionsAndDerivatives.basisFunction;
          basisFunctionDerivKsi = basisFunctionsAndDerivatives.basisFunctionDerivKsi;
          basisFunctionDerivEta = basisFunctionsAndDerivatives.basisFunctionDerivEta;
          xCoordinates = 0;
          yCoordinates = 0;
          ksiDerivX = 0;
          etaDerivX = 0;
          ksiDerivY = 0;
          etaDerivY = 0;
          detJacobian = 0;

          // Isoparametric mapping
          for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
            xCoordinates +=
              nodesXCoordinates[localNodalNumbers[localNodeIndex]] * basisFunction[localNodeIndex];
            yCoordinates +=
              nodesYCoordinates[localNodalNumbers[localNodeIndex]] * basisFunction[localNodeIndex];
            ksiDerivX +=
              nodesXCoordinates[localNodalNumbers[localNodeIndex]] * basisFunctionDerivKsi[localNodeIndex];
            etaDerivX +=
              nodesXCoordinates[localNodalNumbers[localNodeIndex]] * basisFunctionDerivEta[localNodeIndex];
            ksiDerivY +=
              nodesYCoordinates[localNodalNumbers[localNodeIndex]] * basisFunctionDerivKsi[localNodeIndex];
            etaDerivY +=
              nodesYCoordinates[localNodalNumbers[localNodeIndex]] * basisFunctionDerivEta[localNodeIndex];
            detJacobian = meshDimension === "2D" ? ksiDerivX * etaDerivY - etaDerivX * ksiDerivY : ksiDerivX;
          }

          // Compute x-derivative and y-derivative of basis functions
          for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
            basisFunctionDerivX[localNodeIndex] =
              (etaDerivY * basisFunctionDerivKsi[localNodeIndex] -
                ksiDerivY * basisFunctionDerivEta[localNodeIndex]) /
              detJacobian; // The x-derivative of the n basis function
            basisFunctionDerivY[localNodeIndex] =
              (ksiDerivX * basisFunctionDerivEta[localNodeIndex] -
                etaDerivX * basisFunctionDerivKsi[localNodeIndex]) /
              detJacobian; // The y-derivative of the n basis function
          }

          // Computation of Galerkin's residuals and Jacobian matrix
          for (let localNodeIndex1 = 0; localNodeIndex1 < numNodes; localNodeIndex1++) {
            let globalNodeIndex1 = localNodalNumbers[localNodeIndex1];
            residualVector[globalNodeIndex1] +=
              gaussWeights[gaussPointIndex1] *
              gaussWeights[gaussPointIndex2] *
              detJacobian *
              basisFunction[localNodeIndex1];

            for (let localNodeIndex2 = 0; localNodeIndex2 < numNodes; localNodeIndex2++) {
              let globalNodeIndex2 = localNodalNumbers[localNodeIndex2];
              jacobianMatrix[globalNodeIndex1][globalNodeIndex2] +=
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

  // Create an instance of ThermalBoundaryConditions
  debugLog("Applying thermal boundary conditions...");
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
    basisFunctionsData
  );
  debugLog("Convection boundary conditions applied");

  // Impose ConstantTemp boundary conditions
  thermalBoundaryConditions.imposeConstantTempBoundaryConditions(residualVector, jacobianMatrix);
  debugLog("Constant temperature boundary conditions applied");

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
