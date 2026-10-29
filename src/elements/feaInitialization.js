/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { BasisFunctions } from "./basisFunctions.js";
import { NumericalIntegration } from "./numericalIntegration.js";
import { getIntegrationPoints2D } from "./isoparametricMapping.js";
import { SparseMatrix } from "../linalg/sparseMatrix.js";
/**
 * Function to initialize the FEA matrices and numerical tools
 * @param {object} meshData - Object containing mesh data from prepareMesh()
 * @returns {object} An object containing initialized matrices and numerical tools
 */
export function initializeFEA(meshData) {
  const { totalNodes, nop, meshDimension, elementOrder, elementShape } = meshData;

  // Initialize variables for matrix assembly
  let residualVector = new Array(totalNodes).fill(0);
  let jacobianMatrix = new SparseMatrix(totalNodes);
  let localToGlobalMap = [];

  // Initialize the BasisFunctions class
  const basisFunctions = new BasisFunctions({
    meshDimension,
    elementOrder,
    elementShape,
  });

  // Initialize the NumericalIntegration class
  const numericalIntegration = new NumericalIntegration({
    meshDimension,
    elementOrder,
    elementShape,
  });

  // Calculate Gauss points and weights
  let gaussPointsAndWeights = numericalIntegration.getGaussPointsAndWeights();
  let gaussPoints = gaussPointsAndWeights.gaussPoints;
  let gaussWeights = gaussPointsAndWeights.gaussWeights;

  // Integration points for 2D elements (tensor product for quads, collapsed rule for triangles)
  const integrationPoints2D =
    meshDimension === "2D" ? getIntegrationPoints2D(gaussPoints, gaussWeights, elementShape) : [];

  // Basis functions on the reference element at each integration point (the same for every element)
  const referenceBasisFunctions =
    meshDimension === "1D"
      ? gaussPoints.map((gaussPoint) => basisFunctions.getBasisFunctions(gaussPoint))
      : integrationPoints2D.map(([ksi, eta]) => basisFunctions.getBasisFunctions(ksi, eta));

  // Determine the number of nodes in the reference element based on the first element in the nop array
  const nodesPerElement = nop[0].length;

  return {
    residualVector,
    jacobianMatrix,
    localToGlobalMap,
    basisFunctions,
    gaussPoints,
    gaussWeights,
    integrationPoints2D,
    referenceBasisFunctions,
    nodesPerElement,
  };
}
