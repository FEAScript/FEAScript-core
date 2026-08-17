/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { BasisFunctions } from "../mesh/basisFunctions.js";
import { NumericalIntegration } from "../methods/numericalIntegration.js";
import { BeamBoundaryConditions } from "./beamBoundaryConditions.js";
import { basicLog, debugLog, errorLog } from "../utilities/logging.js";

/**
 * Function to assemble the Jacobian matrix and residual vector for the 1D Euler-Bernoulli beam model
 *
 * The beam is governed by the fourth-order equation:
 *   d²/dx²( EI(x) d²w/dx² ) + c0(x) w = q(x)
 * with weak form (element level):
 *   K_ij = ∫ [ EI(x) psi_i'' psi_j'' + c0(x) psi_i psi_j ] dx
 *   F_i  = ∫ q(x) psi_i dx + (point forces/moments/spring contributions from boundary conditions)
 * where psi_i are cubic Hermite shape functions (see basisFunctions.js) and c0 is an optional
 * elastic-foundation modulus.
 *
 * Each mesh node carries 2 degrees of freedom, [w, theta] with theta = dw/dx, ordered
 * consecutively per node: [w_0, theta_0, w_1, theta_1, ...]. The mesh geometry itself only
 * needs the 2 end nodes of each element (i.e. meshConfig.elementOrder must be 'linear'); the
 * richer cubic Hermite interpolation is applied internally to the field, independent of the
 * geometric element order (a "subparametric" formulation, standard for beam elements).
 *
 * @param {object} meshData - Object containing prepared mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions, keyed by 1-based node
 *  number (see beamBoundaryConditions.js for the supported condition types)
 * @param {object} coefficientFunctions - Functions of x for the beam model:
 *  - EI(x): bending stiffness (Young's modulus times second moment of area)
 *  - c0(x): elastic foundation modulus (optional, defaults to 0)
 *  - q(x): distributed transverse load (optional, defaults to 0)
 * @returns {object} An object containing:
 *  - jacobianMatrix: The assembled Jacobian (stiffness) matrix
 *  - residualVector: The assembled residual (load) vector
 *  - dofsPerNode: Number of degrees of freedom per node (2)
 *  - totalDOFs: Total number of degrees of freedom in the assembled system
 *
 * For consistency across both linear and nonlinear formulations,
 * this project always refers to the assembled right-hand side vector
 * as `residualVector` and the assembled system matrix as `jacobianMatrix`.
 *
 * In linear problems `jacobianMatrix` is equivalent to the
 * classic stiffness matrix and `residualVector` corresponds to the traditional load (RHS) vector.
 */
export function assembleEulerBernoulliBeamMat(meshData, boundaryConditions, coefficientFunctions) {
  basicLog("Starting Euler-Bernoulli beam matrix assembly...");

  // Extract mesh data
  const { nodesXCoordinates, nop, totalElements, totalNodesX, meshDimension, elementOrder } = meshData;

  if (meshDimension !== "1D") {
    errorLog("Euler-Bernoulli beam solver requires a 1D mesh");
  }
  if (elementOrder !== "linear") {
    errorLog(
      "Euler-Bernoulli beam solver requires 'linear' (2-node) elements for the beam geometry; " +
        "the cubic Hermite field interpolation for w(x) is applied internally regardless of this setting",
    );
  }

  // Extract coefficient functions, with sensible defaults for the optional ones
  const { EI, c0 = () => 0, q = () => 0 } = coefficientFunctions;

  const dofsPerNode = 2; // [deflection w, rotation theta = dw/dx] at each node
  const totalDOFs = dofsPerNode * totalNodesX;

  // Initialize global Jacobian matrix and residual vector
  let residualVector = new Array(totalDOFs).fill(0);
  let jacobianMatrix = [];
  for (let dofIndex = 0; dofIndex < totalDOFs; dofIndex++) {
    jacobianMatrix.push(new Array(totalDOFs).fill(0));
  }

  // Cubic Hermite basis functions for the field, with a 4-point Gauss quadrature rule
  const basisFunctions = new BasisFunctions({ meshDimension: "1D", elementOrder: "hermiteCubic" });
  const numericalIntegration = new NumericalIntegration({ meshDimension: "1D", elementOrder: "hermiteCubic" });
  const { gaussPoints, gaussWeights } = numericalIntegration.getGaussPointsAndWeights();

  // Matrix assembly
  for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
    // Beam elements only use their 2 end (geometric) nodes
    const globalNode1 = nop[elementIndex][0] - 1; // Convert to 0-based indexing
    const globalNode2 = nop[elementIndex][1] - 1;
    const x1 = nodesXCoordinates[globalNode1];
    const x2 = nodesXCoordinates[globalNode2];
    const elementLength = x2 - x1;

    // Map local DOFs [w1, theta1, w2, theta2] to global DOF indices
    const dofMap = [
      dofsPerNode * globalNode1,
      dofsPerNode * globalNode1 + 1,
      dofsPerNode * globalNode2,
      dofsPerNode * globalNode2 + 1,
    ];

    // Loop over Gauss points
    for (let gaussPointIndex = 0; gaussPointIndex < gaussPoints.length; gaussPointIndex++) {
      const ksi = gaussPoints[gaussPointIndex];

      // Get Hermite cubic basis functions and their ksi-derivatives at this Gauss point
      const { basisFunction, basisFunctionDerivKsi2 } = basisFunctions.getBasisFunctions(
        ksi,
        null,
        elementLength,
      );

      // Straight 2-node element: the Jacobian dx/dksi is the constant element length
      const detJacobian = elementLength;

      // Second derivative with respect to x: d2N/dx2 = (1/J^2) d2N/dksi2 (valid since J is
      // constant along a straight element)
      const basisFunctionDerivXX = basisFunctionDerivKsi2.map(
        (secondDerivKsi) => secondDerivKsi / detJacobian ** 2,
      );

      // Physical coordinate of this Gauss point (linear mapping between the 2 end nodes)
      const xCoord = x1 + elementLength * ksi;

      // Evaluate coefficient functions at this physical coordinate
      const EIVal = EI(xCoord);
      const c0Val = c0(xCoord);
      const qVal = q(xCoord);

      const weightFactor = gaussWeights[gaussPointIndex] * detJacobian;

      // Computation of the element contributions to the residual vector and Jacobian matrix
      for (let localIndex1 = 0; localIndex1 < 4; localIndex1++) {
        const globalDOF1 = dofMap[localIndex1];

        // Distributed load contribution to the residual (load) vector
        residualVector[globalDOF1] += weightFactor * qVal * basisFunction[localIndex1];

        for (let localIndex2 = 0; localIndex2 < 4; localIndex2++) {
          const globalDOF2 = dofMap[localIndex2];

          // Bending stiffness (curvature-curvature) and elastic-foundation terms
          jacobianMatrix[globalDOF1][globalDOF2] +=
            weightFactor *
            (EIVal * basisFunctionDerivXX[localIndex1] * basisFunctionDerivXX[localIndex2] +
              c0Val * basisFunction[localIndex1] * basisFunction[localIndex2]);
        }
      }
    }
  }

  // Apply boundary conditions: natural/spring contributions first, essential conditions last
  // (essential conditions override the equation row, taking precedence over any natural/spring
  // contribution assembled at the same DOF)
  const beamBoundaryConditions = new BeamBoundaryConditions(boundaryConditions, totalNodesX, dofsPerNode);
  beamBoundaryConditions.imposeNaturalAndSpringBoundaryConditions(residualVector, jacobianMatrix);
  beamBoundaryConditions.imposeEssentialBoundaryConditions(residualVector, jacobianMatrix);

  basicLog("Euler-Bernoulli beam matrix assembly completed");

  return {
    jacobianMatrix,
    residualVector,
    dofsPerNode,
    totalDOFs,
  };
}
