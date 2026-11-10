/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Class of the errors that stop a solve, because it would otherwise return an empty or a wrong result.
 * The error codes, which programs can check:
 *  - "INVALID_INPUT": the model input is missing, misspelled or out of range (model, mesh settings, boundary
 *    conditions, coefficient functions)
 *  - "UNSUPPORTED_MESH": the mesh is valid, but the model or the Gmsh reader cannot use it yet
 *  - "MESH_TOO_FINE": the mesh generator passed its limit on the number of nodes (maxNodes) before meeting the
 *    element size and angle targets
 *  - "UNSUPPORTED_SOLVER": the solver method is unknown, or the model cannot use it, or (for "jacobi-gpu") WebGPU
 *    or a GPU adapter is not available
 *  - "NOT_CONVERGED": an iterative method did not converge
 *  - "SINGULAR_MATRIX": the system matrix is singular
 *  - "NON_FINITE_VALUES": the assembled system or the solution contains NaN or infinite values, e.g. from a
 *    coefficient function that returns NaN somewhere in the domain
 *  - "INTERNAL_ERROR": a step of FEAScript itself failed; please report it
 */
export class FEAScriptError extends Error {
  /**
   * Constructor to initialize the FEAScriptError class
   * @param {string} code - The error code, see the list above
   * @param {string} message - The message for the user
   * @param {string[]} [details] - Each problem found, when one check finds more than one (the message then lists
   *  them all)
   */
  constructor(code, message, details = [message]) {
    super(message);
    this.name = "FEAScriptError";
    this.code = code;
    this.details = details;
  }

  /**
   * Function to throw one error that lists every problem found by a check, like a compiler that reports all the
   * errors of a file at once. Does nothing when no problem was found
   * @param {string} code - The error code
   * @param {string[]} problems - The problems found
   * @throws {FEAScriptError} If there is at least one problem
   */
  static throwIfAny(code, problems) {
    if (problems.length === 0) return;
    const message =
      problems.length === 1
        ? problems[0]
        : `${problems.length} problems found:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`;
    throw new FEAScriptError(code, message, problems);
  }
}
