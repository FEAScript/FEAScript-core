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
import { BasisFunctions } from "../mesh/basisFunctionsScript.js";
import { Mesh1D, Mesh2D } from "../mesh/meshGenerationScript.js";
import { NumericalIntegration } from "../methods/numericalIntegrationScript.js";
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Function to assemble the front propagation matrix
 * @param {object} meshConfig - Object containing computational mesh details
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @param {array} solutionVector - The solution vector for non-linear equations
 * @param {number} eikonalActivationFlag - Activation parameter for the eikonal equation (ranges from 0 to 1)
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled Jacobian matrix
 *  - residualVector: The assembled residual vector
 *  - nodesCoordinates: Object containing x and y coordinates of nodes
 */
export function assembleFrontPropagationMat(
  meshConfig,
  boundaryConditions,
  solutionVector,
  eikonalActivationFlag
) {
  basicLog("Starting front propagation matrix assembly...");

  const baseEikonalViscousTerm = 1e-2; // Base viscous term that remains when eikonal equation is fully activated
  let eikonalViscousTerm = 1 - eikonalActivationFlag + baseEikonalViscousTerm; // Viscous term for the front propagation (eikonal) equation
  basicLog(`eikonalViscousTerm: ${eikonalViscousTerm}`);
  basicLog(`eikonalActivationFlag: ${eikonalActivationFlag}`);

  // Extract mesh details from the configuration object
  const {
    meshDimension, // The dimension of the mesh
    numElementsX, // Number of elements in x-direction
    numElementsY, // Number of elements in y-direction (only for 2D)
    maxX, // Max x-coordinate (m) of the domain
    maxY, // Max y-coordinate (m) of the domain (only for 2D)
    elementOrder, // The order of elements
    parsedMesh, // The pre-parsed mesh data (if available)
  } = meshConfig;

  // Create a new instance of the Mesh class
  // TODO: The mesh generation step should be moved outside of the assembleFrontPropagationMat function so that not performed in every Newton-Raphson iteration
  debugLog("Generating mesh...");
  let mesh;
  if (meshDimension === "1D") {
    mesh = new Mesh1D({ numElementsX, maxX, elementOrder, parsedMesh });
  } else if (meshDimension === "2D") {
    mesh = new Mesh2D({ numElementsX, maxX, numElementsY, maxY, elementOrder, parsedMesh });
  } else {
    errorLog("Mesh dimension must be either '1D' or '2D'.");
  }

  // Use the parsed mesh in case it was already passed with Gmsh format
  const nodesCoordinatesAndNumbering = mesh.boundaryElementsProcessed ? mesh.parsedMesh : mesh.generateMesh();

  // Extract nodes coordinates and nodal numbering (NOP) from the mesh data
  let nodesXCoordinates = nodesCoordinatesAndNumbering.nodesXCoordinates;
  let nodesYCoordinates = nodesCoordinatesAndNumbering.nodesYCoordinates;
  let totalNodesX = nodesCoordinatesAndNumbering.totalNodesX;
  let totalNodesY = nodesCoordinatesAndNumbering.totalNodesY;
  let nop = nodesCoordinatesAndNumbering.nodalNumbering;
  let boundaryElements = nodesCoordinatesAndNumbering.boundaryElements;

  // Check the mesh type
  const isParsedMesh = parsedMesh !== undefined && parsedMesh !== null;

  // Calculate totalElements and totalNodes based on mesh type
  let totalElements, totalNodes;

  if (isParsedMesh) {
    totalElements = nop.length; // Number of elements is the length of the nodal numbering array
    totalNodes = nodesXCoordinates.length; // Number of nodes is the length of the coordinates array

    // Debug log for mesh size
    debugLog(`Using parsed mesh with ${totalElements} elements and ${totalNodes} nodes`);
  } else {
    // For structured mesh, calculate based on dimensions
    totalElements = numElementsX * (meshDimension === "2D" ? numElementsY : 1);
    totalNodes = totalNodesX * (meshDimension === "2D" ? totalNodesY : 1);
    // Debug log for mesh size
    debugLog(`Using mesh generated from geometry with ${totalElements} elements and ${totalNodes} nodes`);
  }

  // Initialize variables for matrix assembly
  let localToGlobalMap = []; // Maps local element node indices to global mesh node indices
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
  let detJacobian; // The Jacobian of the isoparametric mapping
  let solutionDerivX; // The x-derivative of the solution
  let solutionDerivY; // The y-derivative of the solution

  // Initialize jacobianMatrix and residualVector arrays
  for (let nodeIndex = 0; nodeIndex < totalNodes; nodeIndex++) {
    residualVector[nodeIndex] = 0;
    jacobianMatrix.push([]);
    for (let colIndex = 0; colIndex < totalNodes; colIndex++) {
      jacobianMatrix[nodeIndex][colIndex] = 0;
    }
  }

  // Initialize the BasisFunctions class
  const basisFunctions = new BasisFunctions({
    meshDimension,
    elementOrder,
  });

  // Initialize the NumericalIntegration class
  const numericalIntegration = new NumericalIntegration({
    meshDimension,
    elementOrder,
  });

  // Calculate Gauss points and weights
  let gaussPointsAndWeights = numericalIntegration.getGaussPointsAndWeights();
  gaussPoints = gaussPointsAndWeights.gaussPoints;
  gaussWeights = gaussPointsAndWeights.gaussWeights;

  // Determine the number of nodes in the reference element based on the first element in the nop array
  const numNodes = nop[0].length;

  // Matrix assembly
  for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
    for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
      // Subtract 1 from nop in order to start numbering from 0
      localToGlobalMap[localNodeIndex] = nop[elementIndex][localNodeIndex] - 1;
    }

    // Loop over Gauss points
    for (let gaussPointIndex1 = 0; gaussPointIndex1 < gaussPoints.length; gaussPointIndex1++) {
      // 1D front propagation (eikonal) equation
      if (meshDimension === "1D") {
        let basisFunctionsAndDerivatives = basisFunctions.getBasisFunctions(gaussPoints[gaussPointIndex1]);
        basisFunction = basisFunctionsAndDerivatives.basisFunction;
        basisFunctionDerivKsi = basisFunctionsAndDerivatives.basisFunctionDerivKsi;
        xCoordinates = 0;
        ksiDerivX = 0;
        detJacobian = 0;

        // Isoparametric mapping
        for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
          xCoordinates += nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunction[localNodeIndex];
          ksiDerivX +=
            nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivKsi[localNodeIndex];
          detJacobian = ksiDerivX;
        }

        // Compute x-derivative of basis functions
        for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
          basisFunctionDerivX[localNodeIndex] = basisFunctionDerivKsi[localNodeIndex] / detJacobian; // The x-derivative of the n basis function
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
        // 2D front propagation (eikonal) equation
      } else if (meshDimension === "2D") {
        for (let gaussPointIndex2 = 0; gaussPointIndex2 < gaussPoints.length; gaussPointIndex2++) {
          // Initialise variables for isoparametric mapping
          let basisFunctionsAndDerivatives = basisFunctions.getBasisFunctions(
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
          solutionDerivX = 0;
          solutionDerivY = 0;

          // Isoparametric mapping
          for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
            xCoordinates +=
              nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunction[localNodeIndex];
            yCoordinates +=
              nodesYCoordinates[localToGlobalMap[localNodeIndex]] * basisFunction[localNodeIndex];
            ksiDerivX +=
              nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivKsi[localNodeIndex];
            etaDerivX +=
              nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivEta[localNodeIndex];
            ksiDerivY +=
              nodesYCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivKsi[localNodeIndex];
            etaDerivY +=
              nodesYCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivEta[localNodeIndex];
          }
          detJacobian = ksiDerivX * etaDerivY - etaDerivX * ksiDerivY;

          // Compute x & y-derivatives of basis functions and x & y-derivatives of the solution
          for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
            // The x-derivative of the n basis function
            basisFunctionDerivX[localNodeIndex] =
              (etaDerivY * basisFunctionDerivKsi[localNodeIndex] -
                ksiDerivY * basisFunctionDerivEta[localNodeIndex]) /
              detJacobian;
            // The y-derivative of the n basis function
            basisFunctionDerivY[localNodeIndex] =
              (ksiDerivX * basisFunctionDerivEta[localNodeIndex] -
                etaDerivX * basisFunctionDerivKsi[localNodeIndex]) /
              detJacobian;
            // The x-derivative of the solution
            solutionDerivX +=
              solutionVector[localToGlobalMap[localNodeIndex]] * basisFunctionDerivX[localNodeIndex];
            // The y-derivative of the solution
            solutionDerivY +=
              solutionVector[localToGlobalMap[localNodeIndex]] * basisFunctionDerivY[localNodeIndex];
          }

          // Computation of Galerkin's residuals and Jacobian matrix
          for (let localNodeIndex1 = 0; localNodeIndex1 < numNodes; localNodeIndex1++) {
            let localToGlobalMap1 = localToGlobalMap[localNodeIndex1];
            // residualVector - Viscous term: Add diffusion contribution to stabilize the solution
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
            // residualVector - Eikonal term: Add the eikonal equation contribution
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
              // jacobianMatrix - Viscous term: Add the Jacobian contribution from the diffusion term
              jacobianMatrix[localToGlobalMap1][localToGlobalMap2] +=
                -eikonalViscousTerm *
                gaussWeights[gaussPointIndex1] *
                gaussWeights[gaussPointIndex2] *
                detJacobian *
                (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] +
                  basisFunctionDerivY[localNodeIndex1] * basisFunctionDerivY[localNodeIndex2]);
              // jacobianMatrix - Eikonal term: Add the Jacobian contribution from the eikonal equation
              if (eikonalActivationFlag !== 0) {
                jacobianMatrix[localToGlobalMap1][localToGlobalMap2] +=
                  eikonalActivationFlag *
                  (-(
                    (detJacobian *
                      solutionDerivX *
                      basisFunction[localNodeIndex1] *
                      gaussWeights[gaussPointIndex1] *
                      gaussWeights[gaussPointIndex2]) /
                    Math.sqrt(solutionDerivX ** 2 + solutionDerivY ** 2 + 1e-8)
                  ) *
                    basisFunctionDerivX[localNodeIndex2] -
                    ((detJacobian *
                      solutionDerivY *
                      basisFunction[localNodeIndex1] *
                      gaussWeights[gaussPointIndex1] *
                      gaussWeights[gaussPointIndex2]) /
                      Math.sqrt(solutionDerivX ** 2 + solutionDerivY ** 2 + 1e-8)) *
                      basisFunctionDerivY[localNodeIndex2]);
              }
            }
          }
        }
      }
    }
  }

  // Create an instance of GenericBoundaryConditions
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

  // Print all residuals
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
