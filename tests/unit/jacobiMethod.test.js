/**
 * Unit tests for jacobiMethod
 *
 * Covers:
 *  - No data          : called with no arguments
 *  - Missing data     : required arguments omitted (b, x0)
 *  - Invalid data     : wrong types / non-square matrix / empty matrix
 *  - Out of boundaries: zero diagonal element, mismatched vector lengths
 *  - Success case     : diagonally dominant 2×2 system with known solution
 *
 * Run: node tests/unit/jacobiMethod.test.js
 */

import { jacobiMethod } from "../../src/methods/jacobiSolver.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    failed++;
  } else {
    console.log(`  PASS: ${message}`);
    passed++;
  }
}

function assertThrows(fn, expectedFragment, label) {
  try {
    fn();
    console.error(`  FAIL: ${label} — expected an error but none was thrown`);
    failed++;
  } catch (err) {
    if (err.message.includes(expectedFragment)) {
      console.log(`  PASS: ${label}`);
      passed++;
    } else {
      console.error(`  FAIL: ${label} — wrong error message.\n    Expected fragment: "${expectedFragment}"\n    Got: "${err.message}"`);
      failed++;
    }
  }
}

// ---------------------------------------------------------------------------
// 1. NO DATA — called with no arguments at all
// ---------------------------------------------------------------------------
console.log("\n[1] No data");

assertThrows(
  () => jacobiMethod(),
  "Matrix A must be a non-empty array",
  "jacobiMethod() with no arguments throws on missing A"
);

// ---------------------------------------------------------------------------
// 2. MISSING DATA — required arguments omitted
// ---------------------------------------------------------------------------
console.log("\n[2] Missing data");

assertThrows(
  () => jacobiMethod([[4, 1], [2, 3]]),
  "Vector b must have length",
  "Missing b argument throws dimension error"
);

assertThrows(
  () => jacobiMethod([[4, 1], [2, 3]], [9, 8]),
  "Initial guess x0 must have length",
  "Missing x0 argument throws dimension error"
);

// ---------------------------------------------------------------------------
// 3. INVALID DATA — wrong types or non-square matrix
// ---------------------------------------------------------------------------
console.log("\n[3] Invalid data");

assertThrows(
  () => jacobiMethod("not-an-array", [1, 2], [0, 0]),
  "Matrix A must be a non-empty array",
  "String passed as A throws type error"
);

assertThrows(
  () => jacobiMethod([], [], []),
  "Matrix A must be a non-empty array",
  "Empty matrix A throws non-empty error"
);

assertThrows(
  () => jacobiMethod([[1, 2, 3], [4, 5, 6]], [1, 2], [0, 0]),
  "Matrix A must be square",
  "Non-square matrix (2x3) throws square error"
);

// ---------------------------------------------------------------------------
// 4. DATA OUT OF BOUNDARIES — mathematical constraints violated
// ---------------------------------------------------------------------------
console.log("\n[4] Data out of boundaries");

assertThrows(
  () => jacobiMethod([[0, 1], [1, 3]], [1, 2], [0, 0]),
  "Diagonal element A[0][0] is zero",
  "Zero diagonal element throws divide-by-zero guard"
);

assertThrows(
  () => jacobiMethod([[4, 1], [2, 3]], [9, 8, 7], [0, 0]),
  "Vector b must have length 2",
  "b longer than n throws dimension mismatch"
);

assertThrows(
  () => jacobiMethod([[4, 1], [2, 3]], [9, 8], [0, 0, 0]),
  "Initial guess x0 must have length 2",
  "x0 longer than n throws dimension mismatch"
);

// ---------------------------------------------------------------------------
// 5. SUCCESS CASE — diagonally dominant 2×2 system
//
//   10x + 2y = 12      exact solution: x = 1, y = 1
//    1x + 5y = 6
//
//   Diagonal dominance: |10| > |2| and |5| > |1| — guaranteed convergence.
// ---------------------------------------------------------------------------
console.log("\n[5] Success case");

const A  = [[10, 2], [1, 5]];
const b  = [12, 6];
const x0 = [0, 0];

const result = jacobiMethod(A, b, x0);

assert(result.converged === true, "Method converges");
assert(result.iterations > 0, "At least one iteration was performed");
assert(result.iterations <= 100, "Converges within the default 100-iteration limit");

const tolerance = 1e-6;
assert(Math.abs(result.solution[0] - 1) < tolerance, `x ≈ 1 (got ${result.solution[0]})`);
assert(Math.abs(result.solution[1] - 1) < tolerance, `y ≈ 1 (got ${result.solution[1]})`);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
