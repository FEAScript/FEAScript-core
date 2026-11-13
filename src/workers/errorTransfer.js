/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// External imports
import * as Comlink from "../vendor/comlink.mjs";

// Internal imports
import { FEAScriptError } from "../utilities/errors.js";

/**
 * Comlink sends only the message, name and stack of an error thrown in a worker, so a FEAScriptError would arrive
 * as a plain Error without its code. This replaces the Comlink handler of thrown values, on both sides of the
 * worker, with one that also sends the code and the details, and rebuilds the FEAScriptError. Any other thrown
 * value is handled as before
 */
const defaultThrowHandler = Comlink.transferHandlers.get("throw");

Comlink.transferHandlers.set("throw", {
  canHandle: defaultThrowHandler.canHandle,
  serialize(thrown) {
    const { value } = thrown;
    if (!(value instanceof FEAScriptError)) return defaultThrowHandler.serialize(thrown);
    const { code, message, details, stack } = value;
    return [{ isFEAScriptError: true, value: { code, message, details, stack } }, []];
  },
  deserialize(serialized) {
    if (!serialized.isFEAScriptError) return defaultThrowHandler.deserialize(serialized);
    const { code, message, details, stack } = serialized.value;
    throw Object.assign(new FEAScriptError(code, message, details), { stack });
  },
});
