/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
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
export function getIntegrationPoints2D(gaussPoints: array, gaussWeights: array, elementShape?: string): array;
/**
 * Function to perform isoparametric mapping for 1D elements
 * @param {object} params - Parameters for the mapping. An optional `basisFunctionDerivX` array can be
 *  passed to be filled in place, to avoid allocating a new array at every integration point
 * @returns {object} An object containing the mapped data
 */
export function performIsoparametricMapping1D(params: object): object;
/**
 * Function to perform isoparametric mapping for 2D elements
 * @param {object} params - Parameters for the mapping. Optional `basisFunctionDerivX` and
 *  `basisFunctionDerivY` arrays can be passed to be filled in place, to avoid allocating new arrays at
 *  every integration point
 * @returns {object} An object containing the mapped data
 */
export function performIsoparametricMapping2D(params: object): object;
