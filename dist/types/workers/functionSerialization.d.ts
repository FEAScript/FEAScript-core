/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to replace the functions of a value (e.g. the model options) with their source code
 * @param {*} value - The value to serialize; plain objects and arrays are serialized recursively
 * @returns {*} A copy of the value that can be sent to a web worker
 * @throws Will throw an error if a function has no source code (native or bound functions)
 */
export function serializeFunctions(value: any): any;
/**
 * Function to rebuild the functions that serializeFunctions replaced with their source code
 * @param {*} value - The serialized value
 * @returns {*} A copy of the value with the functions rebuilt
 */
export function deserializeFunctions(value: any): any;
