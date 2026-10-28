/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { getIntegrationPoints2D, performIsoparametricMapping2D } from "../mesh/meshUtils.js";
import { BasisFunctions } from "../mesh/basisFunctions.js";
import { NumericalIntegration } from "../numerics/numericalIntegration.js";
import { SparseMatrix } from "../numerics/sparseMatrix.js";
import { FlowBoundaryConditions } from "./flowBoundaryConditions.js";
import { basicLog, debugLog, errorLog } from "../utilities/logging.js";

/**
 * Function to assemble the Jacobian matrix and residual vector for the steady creeping flow (Stokes) model
 * using Taylor-Hood mixed finite elements (Q2-Q1 on quadrilaterals, P2-P1 on triangles)
 *
 * DOF ordering in the assembled system:
 *   [u_0 … u_{N_2−1}, v_0 … v_{N_2−1}, p_0 … p_{N_1−1}]
 * where N_2 = total velocity nodes (Q2/P2) and N_1 = total pressure nodes (Q1/P1)
 *
 * @param {object} meshData - Object containing prepared mesh data (must use quadratic elements)
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled (sparse) Jacobian matrix
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
export function assembleCreepingFlowMatrix(meshData, boundaryConditions) {
  basicLog("Starting creeping flow matrix assembly...");

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
    elementShape,
  } = meshData;

  // Validate mesh configuration
  if (meshDimension !== "2D") {
    errorLog("Creeping flow solver requires a 2D mesh");
  }
  if (elementOrder !== "quadratic") {
    errorLog("Creeping flow solver requires quadratic elements for Taylor-Hood (Q2-Q1 or P2-P1) formulation");
  }

  // Number of velocity nodes (Q2/P2) is the total number of nodes in the quadratic mesh
  const totalNodesVelocity = totalNodes;
  const isTriangle = elementShape === "triangle";
  const nodesPerVelocityElement = isTriangle ? 6 : 9; // P2 triangle has 6 nodes, Q2 quadrilateral has 9 nodes
  const nodesPerPressureElement = isTriangle ? 3 : 4; // P1 triangle has 3 nodes, Q1 quadrilateral has 4 nodes

  // Local Q2/P2 indices that correspond to Q1/P1 corner nodes
  // Q2 local numbering:    P2 local numbering:
  //   2 - 5 - 8            2
  //   |       |            | \
  //   1   4   7            1   4
  //   |       |            |     \
  //   0 - 3 - 6            0 - 3 - 5
  // Corner nodes (Q1): 0, 2, 6, 8 - Corner nodes (P1): 0, 2, 5
  const cornerLocalIndices = isTriangle ? [0, 2, 5] : [0, 2, 6, 8];

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
    `Creeping flow DOFs: ${totalNodesVelocity} velocity nodes (Q2), ${totalNodesPressure} pressure nodes (Q1), ${totalDOFs} total DOFs`,
  );

  // Initialize Jacobian matrix and residual vector
  let residualVector = new Array(totalDOFs).fill(0);
  let jacobianMatrix = new SparseMatrix(totalDOFs);

  // Initialize basis functions for velocity (Q2/P2) and pressure (Q1/P1)
  const velocityBasisFunctions = new BasisFunctions({
    meshDimension: "2D",
    elementOrder: "quadratic",
    elementShape,
  });
  const pressureBasisFunctions = new BasisFunctions({
    meshDimension: "2D",
    elementOrder: "linear",
    elementShape,
  });

  // Initialize numerical integration (use quadratic-order Gauss rule)
  const numericalIntegration = new NumericalIntegration({
    meshDimension: "2D",
    elementOrder: "quadratic",
    elementShape,
  });
  let gaussPointsAndWeights = numericalIntegration.getGaussPointsAndWeights();
  let gaussPoints = gaussPointsAndWeights.gaussPoints;
  let gaussWeights = gaussPointsAndWeights.gaussWeights;
  const integrationPoints2D = getIntegrationPoints2D(gaussPoints, gaussWeights, elementShape);

  // Velocity (Q2/P2) and pressure (Q1/P1) basis functions on the reference element at each integration point
  // (the same for every element)
  const velocityReferenceBasisFunctions = integrationPoints2D.map(([ksi, eta]) =>
    velocityBasisFunctions.getBasisFunctions(ksi, eta),
  );
  const pressureReferenceBasisFunctions = integrationPoints2D.map(([ksi, eta]) =>
    pressureBasisFunctions.getBasisFunctions(ksi, eta),
  );

  // Viscosity coefficient
  const mu = 1.0;

  // Local DOF ordering in the element matrix: [u_0 … u_{n_2−1}, v_0 … v_{n_2−1}, p_0 … p_{n_1−1}]
  const localDOFs = 2 * nodesPerVelocityElement + nodesPerPressureElement;
  const localToGlobalDOFMap = new Array(localDOFs);

  // Element matrix and basis function derivatives, reused for every element and integration point
  const localJacobianMatrix = new Float64Array(localDOFs * localDOFs);
  const basisFunctionDerivX = new Float64Array(nodesPerVelocityElement);
  const basisFunctionDerivY = new Float64Array(nodesPerVelocityElement);

  // Matrix assembly
  for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
    // Build local-to-global mapping for velocity nodes (Q2/P2)
    let velLocalToGlobalMap = [];
    for (let localNodeIndex = 0; localNodeIndex < nodesPerVelocityElement; localNodeIndex++) {
      // Subtract 1 from nop in order to start numbering from 0
      velLocalToGlobalMap[localNodeIndex] = nop[elementIndex][localNodeIndex] - 1;
      localToGlobalDOFMap[localNodeIndex] = velLocalToGlobalMap[localNodeIndex]; // u-velocity DOF
      localToGlobalDOFMap[nodesPerVelocityElement + localNodeIndex] =
        totalNodesVelocity + velLocalToGlobalMap[localNodeIndex]; // v-velocity DOF
    }

    // Build local-to-global mapping for pressure nodes (Q1/P1)
    for (let localNodeIndex = 0; localNodeIndex < nodesPerPressureElement; localNodeIndex++) {
      const globalQ2Node = nop[elementIndex][cornerLocalIndices[localNodeIndex]] - 1;
      localToGlobalDOFMap[2 * nodesPerVelocityElement + localNodeIndex] =
        2 * totalNodesVelocity + q2ToPressureMap.get(globalQ2Node); // Pressure DOF
    }
    localJacobianMatrix.fill(0);

    // Loop over integration points
    for (let pointIndex = 0; pointIndex < integrationPoints2D.length; pointIndex++) {
      const integrationWeight = integrationPoints2D[pointIndex][2];

      // Velocity (Q2/P2) basis functions on the reference element at this integration point
      const { basisFunction, basisFunctionDerivKsi, basisFunctionDerivEta } =
        velocityReferenceBasisFunctions[pointIndex];

      // Pressure (Q1/P1) basis functions on the reference element at this integration point
      const pressureBasisFunction = pressureReferenceBasisFunctions[pointIndex].basisFunction;

      // Perform isoparametric mapping using Q2/P2 velocity basis functions
      const { detJacobian } = performIsoparametricMapping2D({
        basisFunction,
        basisFunctionDerivKsi,
        basisFunctionDerivEta,
        nodesXCoordinates,
        nodesYCoordinates,
        localToGlobalMap: velLocalToGlobalMap,
        nodesPerElement: nodesPerVelocityElement,
        basisFunctionDerivX,
        basisFunctionDerivY,
      });

      // Gauss integration weight factors
      const weightFactor = integrationWeight * detJacobian;
      const viscousFactor = -weightFactor * mu;

      // Assemble viscous stiffness terms (K block)
      for (let localNodeIndex1 = 0; localNodeIndex1 < nodesPerVelocityElement; localNodeIndex1++) {
        const xVelocityRowOffset = localNodeIndex1 * localDOFs; // u-velocity row
        const yVelocityRowOffset = (nodesPerVelocityElement + localNodeIndex1) * localDOFs; // v-velocity row

        for (let localNodeIndex2 = 0; localNodeIndex2 < nodesPerVelocityElement; localNodeIndex2++) {
          // Viscous stiffness
          const viscousContribution =
            viscousFactor *
            (basisFunctionDerivX[localNodeIndex1] * basisFunctionDerivX[localNodeIndex2] +
              basisFunctionDerivY[localNodeIndex1] * basisFunctionDerivY[localNodeIndex2]);

          // K appears in both u-u and v-v blocks
          localJacobianMatrix[xVelocityRowOffset + localNodeIndex2] += viscousContribution;
          localJacobianMatrix[yVelocityRowOffset + nodesPerVelocityElement + localNodeIndex2] +=
            viscousContribution;
        }

        // Assemble pressure-velocity coupling terms
        for (let localPresIndex = 0; localPresIndex < nodesPerPressureElement; localPresIndex++) {
          const pressureLocalDOF = 2 * nodesPerVelocityElement + localPresIndex;
          const pressureRowOffset = pressureLocalDOF * localDOFs;

          const bxContribution =
            weightFactor * pressureBasisFunction[localPresIndex] * basisFunctionDerivX[localNodeIndex1];
          const byContribution =
            weightFactor * pressureBasisFunction[localPresIndex] * basisFunctionDerivY[localNodeIndex1];

          // Pressure gradient in x-momentum
          localJacobianMatrix[xVelocityRowOffset + pressureLocalDOF] += bxContribution;

          // Pressure gradient in y-momentum
          localJacobianMatrix[yVelocityRowOffset + pressureLocalDOF] += byContribution;

          // Continuity equation
          localJacobianMatrix[pressureRowOffset + localNodeIndex1] += -bxContribution;
          localJacobianMatrix[pressureRowOffset + nodesPerVelocityElement + localNodeIndex1] +=
            -byContribution;
        }
      }
    }

    // Add the element contribution to the global Jacobian matrix
    jacobianMatrix.addLocalMatrix(localToGlobalDOFMap, localJacobianMatrix);
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
    q2ToPressureMap,
    elementShape,
  );

  flowBoundaryConditions.imposeDirichletBoundaryConditions(residualVector, jacobianMatrix);
  basicLog("Creeping flow matrix assembly completed");

  return {
    jacobianMatrix,
    residualVector,
    totalNodesVelocity,
    totalNodesPressure,
    pressureNodeIndices,
  };
}
