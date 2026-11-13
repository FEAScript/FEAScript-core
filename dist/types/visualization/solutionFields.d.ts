/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to select the nodal values to plot from a solve result
 * @param {object} model - Object containing model properties
 * @param {object} result - Object containing the solution vector, mesh information and, for models with more than
 *  one unknown per node, the named `fields`
 * @param {string} [field] - The name of the field to plot (e.g. "u", "v", "p", "velocityMagnitude", "w", "theta");
 *  when omitted, the default field of the model is used
 * @returns {object} An object containing:
 *  - values: The nodal values to plot (one value per mesh node)
 *  - fieldName: The name of the plotted field, or null when the solution vector itself is plotted
 */
export function selectSolutionField(model: object, result: object, field?: string): object;
