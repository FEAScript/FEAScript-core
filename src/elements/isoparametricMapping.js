/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */
/**
 * Function to build the list of 2D integration points with their combined weights
 * @param {array} gaussPoints - Gauss points from NumericalIntegration
 * @param {array} gaussWeights - Gauss weights from NumericalIntegration
 * @param {string} [elementShape='quad'] - The 2D element shape, either 'quad' or 'triangle'
 * @returns {array} Array of [ksi, eta, weight] entries
 */
export function getIntegrationPoints2D(gaussPoints, gaussWeights, elementShape = "quad") {
  const integrationPoints = [];

  if (elementShape === "triangle") {
    // Triangle rules already provide (ksi, eta) pairs with their weights
    for (let gaussPointIndex = 0; gaussPointIndex < gaussPoints.length; gaussPointIndex++) {
      const [ksi, eta] = gaussPoints[gaussPointIndex];
      integrationPoints.push([ksi, eta, gaussWeights[gaussPointIndex]]);
    }
  } else {
    // Quadrilaterals use the tensor product of the 1D Gauss rule
    for (let gaussPointIndex1 = 0; gaussPointIndex1 < gaussPoints.length; gaussPointIndex1++) {
      for (let gaussPointIndex2 = 0; gaussPointIndex2 < gaussPoints.length; gaussPointIndex2++) {
        integrationPoints.push([
          gaussPoints[gaussPointIndex1],
          gaussPoints[gaussPointIndex2],
          gaussWeights[gaussPointIndex1] * gaussWeights[gaussPointIndex2],
        ]);
      }
    }
  }

  return integrationPoints;
}

/**
 * Function to perform isoparametric mapping for 1D elements
 * @param {object} params - Parameters for the mapping. An optional `basisFunctionDerivX` array can be
 *  passed to be filled in place, to avoid allocating a new array at every integration point
 * @returns {object} An object containing the mapped data
 */
export function performIsoparametricMapping1D(params) {
  const {
    basisFunction,
    basisFunctionDerivKsi,
    nodesXCoordinates,
    localToGlobalMap,
    nodesPerElement,
    basisFunctionDerivX = [],
  } = params;

  let xCoordinates = 0;
  let ksiDerivX = 0;

  // Isoparametric mapping
  for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
    xCoordinates += nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunction[localNodeIndex];
    ksiDerivX += nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivKsi[localNodeIndex];
  }
  let detJacobian = ksiDerivX;

  // Compute x-derivative of basis functions
  for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
    basisFunctionDerivX[localNodeIndex] = basisFunctionDerivKsi[localNodeIndex] / detJacobian;
  }

  return {
    xCoordinates,
    detJacobian,
    basisFunctionDerivX,
  };
}

/**
 * Function to perform isoparametric mapping for 2D elements
 * @param {object} params - Parameters for the mapping. Optional `basisFunctionDerivX` and
 *  `basisFunctionDerivY` arrays can be passed to be filled in place, to avoid allocating new arrays at
 *  every integration point
 * @returns {object} An object containing the mapped data
 */
export function performIsoparametricMapping2D(params) {
  const {
    basisFunction,
    basisFunctionDerivKsi,
    basisFunctionDerivEta,
    nodesXCoordinates,
    nodesYCoordinates,
    localToGlobalMap,
    nodesPerElement,
    basisFunctionDerivX = [],
    basisFunctionDerivY = [],
  } = params;

  let xCoordinates = 0;
  let yCoordinates = 0;
  let ksiDerivX = 0;
  let etaDerivX = 0;
  let ksiDerivY = 0;
  let etaDerivY = 0;

  // Isoparametric mapping
  for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
    xCoordinates += nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunction[localNodeIndex];
    yCoordinates += nodesYCoordinates[localToGlobalMap[localNodeIndex]] * basisFunction[localNodeIndex];
    ksiDerivX += nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivKsi[localNodeIndex];
    etaDerivX += nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivEta[localNodeIndex];
    ksiDerivY += nodesYCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivKsi[localNodeIndex];
    etaDerivY += nodesYCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivEta[localNodeIndex];
  }
  let detJacobian = ksiDerivX * etaDerivY - etaDerivX * ksiDerivY;

  // Compute x-derivative and y-derivative of basis functions
  for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
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
  }

  return {
    xCoordinates,
    yCoordinates,
    detJacobian,
    basisFunctionDerivX,
    basisFunctionDerivY,
  };
}
