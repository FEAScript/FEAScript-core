/**
 * Unit tests for jacobiSolver
 *
 * Covers:
 *  - Success case on a diagonally dominant 2x2 system
 *  - Non-convergence when maxIterations is too small
 *
 * Run: node tests/unit/jacobiMethod.test.js
 */

import { jacobiSolver } from "../../src/methods/jacobiSolver.js";
import { basicLog, errorLog } from "../../src/utilities/logging.js";

basicLog("");
basicLog("================================");
basicLog("Unit tests: jacobiSolver");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    errorLog(`FAIL: ${message}`);
    failed++;
  } else {
    basicLog(`PASS: ${message}`);
    passed++;
  }
}

// ---------------------------------------------------------------------------
// 1. SUCCESS CASE — diagonally dominant 2x2 system
//
//   10x + 2y = 12      exact solution: x = 1, y = 1
//    1x + 5y = 6
// ---------------------------------------------------------------------------
basicLog("");
basicLog("[1] Success case");

const A = [
  [10, 2],
  [1, 5],
];
const b = [12, 6];
const x0 = [0, 0];

const result = jacobiSolver(A, b, x0, {
  maxIterations: 500,
  tolerance: 1e-10,
});

assert(result.converged === true, "Method converges");
assert(result.iterations > 0, "At least one iteration was performed");
assert(result.iterations <= 500, "Converges within configured iteration limit");

const tolerance = 1e-6;
assert(Math.abs(result.solutionVector[0] - 1) < tolerance, `x ~= 1 (got ${result.solutionVector[0]})`);
assert(Math.abs(result.solutionVector[1] - 1) < tolerance, `y ~= 1 (got ${result.solutionVector[1]})`);

// ---------------------------------------------------------------------------
// 2. NON-CONVERGENCE CASE — force early stop
// ---------------------------------------------------------------------------
basicLog("");
basicLog("[2] Non-convergence case");

const hardResult = jacobiSolver(A, b, x0, {
  maxIterations: 1,
  tolerance: 1e-20,
});

assert(hardResult.converged === false, "Method reports non-convergence with too few iterations");
assert(hardResult.iterations === 1, "Method reports the configured iteration cap");
assert(hardResult.solutionVector.length === 2, "Returns a solution vector of expected size");

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
if (failed > 0) {
  errorLog(`${passed + failed} assertions — ${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed + failed} assertions — ${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
