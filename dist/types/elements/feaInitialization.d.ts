/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to initialize the FEA matrices and numerical tools
 * @param {object} meshData - Object containing mesh data from prepareMesh()
 * @param {object} [options] - Optional parameters:
 *  - withMatrix: Whether to create the global Jacobian matrix (default true). The frontal solver assembles
 *    its own front, so it does not need it
 * @returns {object} An object containing initialized matrices and numerical tools
 */
export function initializeFEA(meshData: object, { withMatrix }?: object): object;
