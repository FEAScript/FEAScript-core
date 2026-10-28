/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for SparseMatrix
 *
 * Covers:
 *  - Accumulation with addValue and addLocalMatrix, overwriting with setValue and row clearing with clearRow
 *  - Conversion to dense, CSR and CSC formats (sorted indices, exact zeros dropped)
 *  - Round trip through fromDense
 *  - Sparse and dense input give the same solution in the LU and Jacobi solvers
 *
 * Run: node tests/unit/sparseMatrix.test.js (or npm test)
 */

import { SparseMatrix } from "../../src/numerics/sparseMatrix.js";
import { jacobiSolver, mathjsLUSolver } from "../../src/solvers/index.js";
import { basicLog, errorLog } from "../../src/utilities/logging.js";

basicLog("");
basicLog("================================");
basicLog("Unit tests: SparseMatrix");

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

const sameArray = (a, b) => a.length === b.length && Array.from(a).every((value, i) => value === b[i]);

basicLog("");
basicLog("[1] Entry access");

const matrix = new SparseMatrix(3);
matrix.addValue(0, 0, 4);
matrix.addValue(0, 0, 6);
matrix.addValue(0, 2, 1);
matrix.addValue(1, 1, 5);
matrix.addValue(2, 1, 2);
matrix.setValue(2, 2, 8);

assert(matrix.getValue(0, 0) === 10, "addValue accumulates into the same entry");
assert(matrix.getValue(1, 0) === 0, "Entries that are not stored read as zero");
assert(matrix.getValue(2, 2) === 8, "setValue stores the value");

matrix.addValue(1, 2, 3);
matrix.addValue(1, 2, -3); // Stored, but exactly zero
matrix.clearRow(1);
matrix.setValue(1, 1, 1);
assert(matrix.rows[1].size === 1 && matrix.getValue(1, 1) === 1, "clearRow removes every entry of the row");

basicLog("");
basicLog("[2] Local (element) matrix assembly");

// Two 2-node elements sharing global node 1: [0, 1] and [1, 2]
const assembledMatrix = new SparseMatrix(3);
const elementMatrix = Float64Array.from([1, -1, -1, 1]);
assembledMatrix.addLocalMatrix([0, 1], elementMatrix);
assembledMatrix.addLocalMatrix([1, 2], elementMatrix);
const expectedAssembled = [
  [1, -1, 0],
  [-1, 2, -1],
  [0, -1, 1],
];
assert(
  assembledMatrix.toDense().every((row, i) => sameArray(row, expectedAssembled[i])),
  "addLocalMatrix accumulates element contributions at shared nodes",
);

const zeroBlockMatrix = new SparseMatrix(2);
zeroBlockMatrix.addLocalMatrix([0, 1], Float64Array.from([5, 0, 0, 7]));
assert(
  zeroBlockMatrix.rows[0].size === 1 && zeroBlockMatrix.rows[1].size === 1,
  "addLocalMatrix skips zero entries of the local matrix",
);

basicLog("");
basicLog("[3] Format conversion");

const dense = [
  [10, 0, 1],
  [0, 1, 0],
  [0, 2, 8],
];
assert(
  matrix.toDense().every((row, i) => sameArray(row, dense[i])),
  "toDense returns the expected dense matrix",
);

matrix.addValue(0, 1, 0); // Explicit zero, must not appear in the compressed formats
const csr = matrix.toCSR();
assert(sameArray(csr.rowPointers, [0, 2, 3, 5]), "CSR row pointers");
assert(sameArray(csr.columnIndices, [0, 2, 1, 1, 2]), "CSR column indices are sorted, zeros dropped");
assert(sameArray(csr.values, [10, 1, 1, 2, 8]), "CSR values");

const csc = matrix.toCSC();
assert(sameArray(csc.ptr, [0, 1, 3, 5]), "CSC column pointers");
assert(sameArray(csc.index, [0, 1, 2, 0, 2]), "CSC row indices are sorted, zeros dropped");
assert(sameArray(csc.values, [10, 1, 2, 1, 8]), "CSC values");
assert(sameArray(csc.size, [3, 3]), "CSC size");

const roundTrip = SparseMatrix.fromDense(dense);
assert(
  roundTrip.toDense().every((row, i) => sameArray(row, dense[i])),
  "fromDense followed by toDense returns the original matrix",
);

basicLog("");
basicLog("[4] Solvers accept sparse and dense input");

// Diagonally dominant system with exact solution x = [1, 2, 3]
const systemDense = [
  [10, -1, 2],
  [-1, 11, -1],
  [2, -1, 10],
];
const rightHandSide = [14, 18, 30];
const systemSparse = SparseMatrix.fromDense(systemDense);

const luSparse = mathjsLUSolver(systemSparse, rightHandSide, { matrixType: "sparse" }).solutionVector;
const luDense = mathjsLUSolver(systemDense, rightHandSide, { matrixType: "sparse" }).solutionVector;
assert(
  luSparse.every((value, i) => Math.abs(value - (i + 1)) < 1e-12),
  `LU solver with sparse input (got ${luSparse})`,
);
assert(sameArray(luSparse, luDense), "LU solver gives identical results for sparse and dense input");

const jacobiOptions = { maxIterations: 500, tolerance: 1e-12 };
const jacobiSparse = jacobiSolver(systemSparse, rightHandSide, [0, 0, 0], jacobiOptions);
const jacobiDense = jacobiSolver(systemDense, rightHandSide, [0, 0, 0], jacobiOptions);
assert(
  jacobiSparse.converged &&
    jacobiSparse.solutionVector.every((value, i) => Math.abs(value - (i + 1)) < 1e-10),
  `Jacobi solver with sparse input (got ${jacobiSparse.solutionVector})`,
);
assert(
  sameArray(jacobiSparse.solutionVector, jacobiDense.solutionVector),
  "Jacobi solver gives identical results for sparse and dense input",
);

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
