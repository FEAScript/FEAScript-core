/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Global logging level
let currentLogLevel = "basic";

/**
 * Function to set the logging system level
 * @param {string} level - Logging level (none, basic, debug)
 */
export function logSystem(level) {
  if (level !== "none" && level !== "basic" && level !== "debug") {
    console.log(
      "%c[WARN] Invalid log level: " + level + ". Using basic instead. Allowed levels: none, basic, debug.",
      "color: #FFC107; font-weight: bold;",
    ); // Yellow for warnings
    currentLogLevel = "basic";
  } else {
    currentLogLevel = level;
    basicLog(`Log level set to: ${level}`);
  }
}

/**
 * Function to log debug messages - only logs if level is 'debug'
 * @param {string} message - Message to log
 */
export function debugLog(message) {
  if (currentLogLevel === "debug") {
    console.log("%c[DEBUG] " + message, "color: #2196F3; font-weight: bold;");
  }
}

/**
 * Function to log basic information - always logs
 * @param {string} message - Message to log
 */
export function basicLog(message) {
  if (currentLogLevel === "basic" || currentLogLevel === "debug") {
    console.log("%c[INFO] " + message, "color: #4CAF50; font-weight: bold;");
  }
}

/**
 * Function to log error messages
 * @param {string} message - Message to log
 */
export function errorLog(message) {
  console.log("%c[ERROR] " + message, "color: #F44336; font-weight: bold;");
}

/**
 * Function to log warning messages
 * @param {string} message - Message to log
 */
export function warnLog(message) {
  console.log("%c[WARN] " + message, "color: #FF9800; font-weight: bold;");
}
