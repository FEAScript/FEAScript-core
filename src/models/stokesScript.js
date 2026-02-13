/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { performIsoparametricMapping2D } from "../mesh/meshUtilsScript.js";
import { BasisFunctions } from "../mesh/basisFunctionsScript.js";
import { NumericalIntegration } from "../methods/numericalIntegrationScript.js";
import { FlowBoundaryConditions } from "./flowBoundaryConditions.js";
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Function to assemble the Jacobian matrix and residual vector for the steady Stokes flow model
 * using Taylor-Hood (Q2-Q1) mixed finite elements
 *
 * DOF ordering in the assembled system:
 *   [u_0 … u_{N_2−1}, v_0 … v_{N_2−1}, p_0 … p_{N_1−1}]
 * where N_2 = total velocity nodes (Q2) and N_1 = total pressure nodes (Q1)
 *
 * @param {object} meshData - Object containing prepared mesh data (must use quadratic elements)
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled Jacobian matrix
 *  - residualVector: The assembled residual vector
 *  - totalNodesVelocity: Number of velocity nodes (Q2)
 *  - totalNodesPressure: Number of pressure nodes (Q1)
 *  - pressureNodeIndices: Array mapping pressure DOF index to global Q2 node index
 *
 * For consistency across both linear and nonlinear formulations,
 * this project always refers to the assembled right-hand side vector
 * as `residualVector` and the assembled system matrix as `jacobianMatrix`.
 *
 * In linear problems `jacobianMatrix` is equivalent to the
 * classic stiffness/conductivity matrix and `residualVector`
 * corresponds to the traditional load (RHS) vector.
 */
export function assembleStokesMatrix(meshData, boundaryConditions) {
  basicLog("Starting Stokes flow matrix assembly...");

  // Extract mesh data
  const {
    nodesXCoordinates,
    nodesYCoordinates,
    nop,
    boundaryElements,
    totalElements,
    totalNodes,
    meshDimension,
    elementOrder,
  } = meshData;

  // Validate mesh configuration
  if (meshDimension !== "2D") {
    errorLog("Stokes solver requires a 2D mesh");
  }
  if (elementOrder !== "quadratic") {
    errorLog("Stokes solver requires quadratic elements for Taylor-Hood (Q2-Q1) formulation");
  }

  // Number of velocity nodes (Q2) is the total number of nodes in the quadratic mesh
  const totalNodesVelocity = totalNodes;
  const nodesPerVelocityElement = 9; // Q2 element has 9 nodes
  const nodesPerPressureElement = 4; // Q1 element has 4 nodes

  // Local Q2 indices that correspond to Q1 corner nodes
  // Q2 local numbering:
  //   2 - 5 - 8
  //   |       |
  //   1   4   7
  //   |       |
  //   0 - 3 - 6
  // Corner nodes (Q1): 0, 2, 6, 8
  const cornerLocalIndices = [0, 2, 6, 8];

  // Build pressure node mapping from Q2 corner nodes
  const q2ToPressureMap = new Map();
  const pressureNodeIndices = []; // Maps pressure DOF index to global Q2 node index
  let pressureNodeCount = 0;

  for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
    for (let cornerIndex = 0; cornerIndex < cornerLocalIndices.length; cornerIndex++) {
      const globalQ2Node = nop[elementIndex][cornerLocalIndices[cornerIndex]] - 1; // Convert to 0-based
      if (!q2ToPressureMap.has(globalQ2Node)) {
        q2ToPressureMap.set(globalQ2Node, pressureNodeCount);
        pressureNodeIndices.push(globalQ2Node);
        pressureNodeCount++;
      }
    }
  }
  const totalNodesPressure = pressureNodeCount;
  const totalDOFs = 2 * totalNodesVelocity + totalNodesPressure;

  debugLog(
    `Stokes DOFs: ${totalNodesVelocity} velocity nodes (Q2), ${totalNodesPressure} pressure nodes (Q1), ${totalDOFs} total DOFs`
  );

  // Initialize Jacobian matrix and residual vector
  let residualVector = [];
  let jacobianMatrix = [];
  for (let nodeIndex = 0; nodeIndex < totalDOFs; nodeIndex++) {
    residualVector[nodeIndex] = 0;
    jacobianMatrix.push([]);
    for (let colIndex = 0; colIndex < totalDOFs; colIndex++) {
      jacobianMatrix[nodeIndex][colIndex] = 0;
    }
  }

  // Initialize basis functions for velocity (Q2) and pressure (Q1)
  const velocityBasisFunctions = new BasisFunctions({
    meshDimension: "2D",
    elementOrder: "quadratic",
  });
  const pressureBasisFunctions = new BasisFunctions({
    meshDimension: "2D",
    elementOrder: "linear",
  });

  // Initialize numerical integration (use quadratic-order Gauss rule)
  const numericalIntegration = new NumericalIntegration({
    meshDimension: "2D",
    elementOrder: "quadratic",
  });
  let gaussPointsAndWeights = numericalIntegration.getGaussPointsAndWeights();
  let gaussPoints = gaussPointsAndWeights.gaussPoints;
  let gaussWeights = gaussPointsAndWeights.gaussWeights;

  // Viscosity coefficient
  const mu = 1.0;

  // Matrix assembly
  for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
    // Build local-to-global mapping for velocity nodes (Q2)
    let velLocalToGlobalMap = [];
    for (let localNodeIndex = 0; localNodeIndex < nodesPerVelocityElement; localNodeIndex++) {
      // Subtract 1 from nop in order to start numbering from 0
      velLocalToGlobalMap[localNodeIndex] = nop[elementIndex][localNodeIndex] - 1;
    }

    // Build local-to-global mapping for pressure nodes (Q1)
    let presLocalToGlobalMap = [];
    for (let localNodeIndex = 0; localNodeIndex < nodesPerPressureElement; localNodeIndex++) {
      const globalQ2Node = nop[elementIndex][cornerLocalIndices[localNodeIndex]] - 1;
      presLocalToGlobalMap[localNodeIndex] = q2ToPressureMap.get(globalQ2Node);
    }

    // Loop over Gauss points
    for (let gaussPointIndex1 = 0; gaussPointIndex1 < gaussPoints.length; gaussPointIndex1++) {
      for (let gaussPointIndex2 = 0; gaussPointIndex2 < gaussPoints.length; gaussPointIndex2++) {
        // Get velocity (Q2) basis functions for the current Gauss point
        const velocityBasisFunctionsAndDerivatives = velocityBasisFunctions.getBasisFunctions(
          gaussPoints[gaussPointIndex1],
          gaussPoints[gaussPointIndex2]
        );

        // Get pressure (Q1) basis functions for the current Gauss point
        const pressureBasisFunctionsAndDerivatives = pressureBasisFunctions.getBasisFunctions(
          gaussPoints[gaussPointIndex1],
          gaussPoints[gaussPointIndex2]
        );

        // Perform isoparametric mapping using Q2 velocity basis functions
        const mappingResult = performIsoparametricMapping2D({
          basisFunction: velocityBasisFunctionsAndDerivatives.basisFunction,
          basisFunctionDerivKsi: velocityBasisFunctionsAndDerivatives.basisFunctionDerivKsi,
          basisFunctionDerivEta: velocityBasisFunctionsAndDerivatives.basisFunctionDerivEta,
          nodesXCoordinates,
          nodesYCoordinates,
          localToGlobalMap: velLocalToGlobalMap,
          nodesPerElement: nodesPerVelocityElement,
        });

        // Extract mapping results
        const { detJacobian, basisFunctionDerivX, basisFunctionDerivY } = mappingResult;

        // Gauss integration weight factor
        const weightFactor = gaussWeights[gaussPointIndex1] * gaussWeights[gaussPointIndex2] * detJacobian;

        // Assemble viscous stiffness terms (K block)
        for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerVelocityElement; localNodeIndex1++) {
          let globalNode1 = velLocalToGlobalMap[localNodeIndex1];
          let uDOF1 = globalNode1; // u-velocity DOF
          let vDOF1 = totalNodesVelocity + globalNode1; // v-velocity DOF

          for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerVelocityElement; localNodeIndex2++) {
            let globalNode2 = velLocalToGlobalMap[localNodeIndex2];
            let uDOF2 = globalNode2; // u-velocity DOF
            let vDOF2 = totalNodesVelocity + globalNode2; // v-velocity DOF

            // Viscous stiffness
            let viscousContribution =
              -weightFactor *
              mu *
              (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] +
                basisFunctionDerivY[localNodeIndex1] * basisFunctionDerivY[localNodeIndex2]);

            // K appears in both u-u and v-v blocks
            jacobianMatrix[uDOF1][uDOF2] += viscousContribution;
            jacobianMatrix[vDOF1][vDOF2] += viscousContribution;
          }

          // Assemble pressure-velocity coupling terms
          for (let localPresIndex = 0; localPresIndex < nodesPerPressureElement; localPresIndex++) {
            let pDOF = 2 * totalNodesVelocity + presLocalToGlobalMap[localPresIndex];

            let bxContribution =
              weightFactor *
              pressureBasisFunctionsAndDerivatives.basisFunction[localPresIndex] *
              basisFunctionDerivX[localNodeIndex1];

            let byContribution =
              weightFactor *
              pressureBasisFunctionsAndDerivatives.basisFunction[localPresIndex] *
              basisFunctionDerivY[localNodeIndex1];

            // Pressure gradient in x-momentum
            jacobianMatrix[uDOF1][pDOF] += bxContribution;

            // Pressure gradient in y-momentum
            jacobianMatrix[vDOF1][pDOF] += byContribution;

            // Continuity equation
            jacobianMatrix[pDOF][uDOF1] += -bxContribution;
            jacobianMatrix[pDOF][vDOF1] += -byContribution;
          }
        }
      }
    }
  }

  // Apply boundary conditions
  const flowBoundaryConditions = new FlowBoundaryConditions(
    boundaryConditions,
    boundaryElements,
    nop,
    meshDimension,
    elementOrder,
    totalNodesVelocity,
    totalNodesPressure,
    q2ToPressureMap
  );

  flowBoundaryConditions.imposeDirichletBoundaryConditions(residualVector, jacobianMatrix);
  basicLog("Stokes flow matrix assembly completed");

  return {
    jacobianMatrix,
    residualVector,
    totalNodesVelocity,
    totalNodesPressure,
    pressureNodeIndices,
  };
}
