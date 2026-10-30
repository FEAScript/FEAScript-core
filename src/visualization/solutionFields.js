/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { errorLog } from "../utilities/logging.js";

// Field plotted when none is requested, for models that return named fields
const defaultFields = {
  creepingFlowScript: "velocityMagnitude",
  eulerBernoulliBeamScript: "w",
};

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
export function selectSolutionField(model, result, field) {
  if (!result.fields) {
    if (field) {
      errorLog(
        `Field "${field}" was requested, but this result has no named fields; the solution vector is plotted.`,
      );
    }
    return { values: result.solutionVector, fieldName: null };
  }

  const defaultField = defaultFields[model.solverConfig] ?? Object.keys(result.fields)[0];
  if (field && !(field in result.fields)) {
    errorLog(
      `Unknown field "${field}"; plotting "${defaultField}" instead. Available fields: ${Object.keys(
        result.fields,
      ).join(", ")}.`,
    );
  }
  const fieldName = field in result.fields ? field : defaultField;
  return { values: result.fields[fieldName], fieldName };
}
