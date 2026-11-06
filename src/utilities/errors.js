/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Class of the errors that stop a solve, because it would otherwise return an empty or a wrong result
 */
export class FEAScriptError extends Error {
  /**
   * Constructor to initialize the FEAScriptError class
   * @param {string} code - The error code, which programs can check: "UNSUPPORTED_SOLVER", "NOT_CONVERGED" or
   *  "SINGULAR_MATRIX"
   * @param {string} message - The message for the user
   */
  constructor(code, message) {
    super(message);
    this.name = "FEAScriptError";
    this.code = code;
  }
}
