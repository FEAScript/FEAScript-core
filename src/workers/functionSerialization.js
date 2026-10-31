/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Functions cannot be sent to a web worker (structured clone), so they are sent as their source code and
// rebuilt in the worker. A rebuilt function has no access to the variables around its definition, so it
// must be self-contained (e.g. `(x, u) => 0.5 * u ** 2` instead of `(x, u) => Da * u ** 2`)
const functionSourceKey = "__feascriptFunctionSource";

/**
 * Function to replace the functions of a value (e.g. the model options) with their source code
 * @param {*} value - The value to serialize; plain objects and arrays are serialized recursively
 * @returns {*} A copy of the value that can be sent to a web worker
 * @throws Will throw an error if a function has no source code (native or bound functions)
 */
export function serializeFunctions(value) {
  if (typeof value === "function") {
    const source = value.toString();
    if (source.includes("[native code]")) {
      throw new Error(
        `FEAScriptWorker: function "${value.name}" cannot be sent to the worker; use a function defined in your own code, e.g. (x) => Math.sin(x) instead of Math.sin.`,
      );
    }
    return { [functionSourceKey]: source };
  }
  if (Array.isArray(value)) {
    return value.map(serializeFunctions);
  }
  if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, serializeFunctions(entry)]));
  }
  return value;
}

/**
 * Function to rebuild the functions that serializeFunctions replaced with their source code
 * @param {*} value - The serialized value
 * @returns {*} A copy of the value with the functions rebuilt
 */
export function deserializeFunctions(value) {
  if (Array.isArray(value)) {
    return value.map(deserializeFunctions);
  }
  if (value !== null && typeof value === "object") {
    if (typeof value[functionSourceKey] === "string") {
      return rebuildFunction(value[functionSourceKey]);
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, deserializeFunctions(entry)]),
    );
  }
  return value;
}

/**
 * Function to rebuild a function from its source code
 * @param {string} source - The source code of an arrow function, function expression or method
 * @returns {function} The rebuilt function
 */
function rebuildFunction(source) {
  try {
    // Arrow functions and function expressions, e.g. "(x) => 1" or "function (x) { return 1; }"
    return new Function(`"use strict"; return (${source});`)();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    // Methods are given without the function keyword, e.g. "A(x) { return 1; }"
    return new Function(`"use strict"; return Object.values({ ${source} })[0];`)();
  }
}
