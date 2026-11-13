/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to set the logging system level
 * @param {"none" | "basic" | "debug"} level - Logging level (none, basic, debug)
 */
export function logSystem(level: "none" | "basic" | "debug"): void;
/**
 * Function to log debug messages - only logs if level is 'debug'
 * @param {string} message - Message to log
 */
export function debugLog(message: string): void;
/**
 * Function to log basic information - always logs
 * @param {string} message - Message to log
 */
export function basicLog(message: string): void;
/**
 * Function to log error messages
 * @param {string} message - Message to log
 */
export function errorLog(message: string): void;
/**
 * Function to log warning messages
 * @param {string} message - Message to log
 */
export function warnLog(message: string): void;
