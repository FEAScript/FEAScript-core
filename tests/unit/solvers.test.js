/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for the linear solvers and sparse matrices
 *
 * Jacobi solver:
 *  - Success case on a diagonally dominant 2x2 system
 *  - Non-convergence when maxIterations is too small
 *
 * Sparse matrix:
 *  - Accumulation with addValue and addLocalMatrix, overwriting with setValue and row clearing with clearRow
 *  - Conversion to dense, CSR and CSC formats (sorted indices, exact zeros dropped)
 *  - Round trip through fromDense
 *  - Assembly into a pattern from fromElementDofs, with entries outside the pattern
 *  - Sparse and dense input give the same solution in the LU and Jacobi solvers
 *
 * WebGPU availability ("jacobi-gpu"):
 *  - No navigator.gpu, no adapter, and a failing adapter request each throw UNSUPPORTED_SOLVER with the reason
 *  - An available adapter passes the check
 *  - solveLinearSystemAsync with "jacobi-gpu" where WebGPU is missing (Node.js) throws UNSUPPORTED_SOLVER
 *    before starting a worker
 *
 * Run: node tests/unit/solvers.test.js (or npm test)
 */

import { jacobiSolver } from "../../src/solvers/jacobiSolver.js";
import { SparseMatrix } from "../../src/linalg/sparseMatrix.js";
import { solveLinearSystemAsync } from "../../src/solvers/linearSystemSolver.js";
import { mathjsLUSolver } from "../../src/solvers/mathjsLUSolver.js";
import { assertWebGPUAvailable } from "../../src/solvers/webgpuAvailability.js";
import { FEAScriptError } from "../../src/utilities/errors.js";
import { basicLog, errorLog } from "../../src/utilities/logging.js";

basicLog("");
basicLog("================================");
basicLog("Unit tests: the linear solvers and sparse matrices");

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

// Jacobi solver
{
  basicLog("");
  basicLog("[Jacobi solver]");

  // Diagonally dominant system with exact solution x = 1, y = 1
  //   10x + 2y = 12      exact solution: x = 1, y = 1
  //    1x + 5y = 6
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

  basicLog("");
  basicLog("[2] Non-convergence case");

  const hardResult = jacobiSolver(A, b, x0, {
    maxIterations: 1,
    tolerance: 1e-20,
  });

  assert(hardResult.converged === false, "Method reports non-convergence with too few iterations");
  assert(hardResult.iterations === 1, "Method reports the configured iteration cap");
  assert(hardResult.solutionVector.length === 2, "Returns a solution vector of expected size");
}

// Sparse matrix
{
  basicLog("");
  basicLog("[Sparse matrix]");

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
  assert(
    matrix.rowNonZeros(1) === 1 && matrix.getValue(1, 1) === 1,
    "clearRow removes every entry of the row",
  );

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
    zeroBlockMatrix.rowNonZeros(0) === 1 && zeroBlockMatrix.rowNonZeros(1) === 1,
    "addLocalMatrix skips zero entries of the local matrix",
  );

  // The same elements, assembled into the pattern computed from the element connectivity
  const elementNodes = [
    [0, 1],
    [1, 2],
  ];
  const patternMatrix = SparseMatrix.fromElementDofs(3, 2, (elementIndex) => elementNodes[elementIndex]);
  assert(
    sameArray(patternMatrix.rowPointers, [0, 2, 5, 7]) &&
      sameArray(patternMatrix.columnIndices, [0, 1, 0, 1, 2, 1, 2]),
    "fromElementDofs computes the CSR pattern of the element connectivity, with sorted columns",
  );
  patternMatrix.addLocalMatrix([0, 1], elementMatrix);
  patternMatrix.addLocalMatrix([1, 2], elementMatrix);
  assert(
    patternMatrix.toDense().every((row, i) => sameArray(row, expectedAssembled[i])),
    "addLocalMatrix accumulates into the pattern",
  );
  patternMatrix.addValue(0, 2, 5); // Outside the pattern
  patternMatrix.clearRow(1);
  patternMatrix.setValue(1, 1, 1);
  const patternCSR = patternMatrix.toCSR();
  assert(
    patternMatrix.getValue(0, 2) === 5 &&
      sameArray(patternCSR.rowPointers, [0, 3, 4, 6]) &&
      sameArray(patternCSR.columnIndices, [0, 1, 2, 1, 1, 2]) &&
      sameArray(patternCSR.values, [1, -1, 5, 1, -1, 1]),
    "Entries outside the pattern are kept and merged in column order; clearRow empties a pattern row",
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
}

// WebGPU availability
{
  basicLog("");
  basicLog("[WebGPU availability]");

  // Replaces globalThis.navigator for one check (Node.js 21 and later define it, older versions do not)
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const withNavigator = async (navigatorValue, check) => {
    Object.defineProperty(globalThis, "navigator", {
      value: navigatorValue,
      configurable: true,
      writable: true,
    });
    try {
      return await check().then(
        () => null,
        (failure) => failure,
      );
    } finally {
      if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator);
      else delete globalThis.navigator;
    }
  };
  const isUnsupported = (failure, text) =>
    failure instanceof FEAScriptError &&
    failure.code === "UNSUPPORTED_SOLVER" &&
    failure.message.includes(text);

  const noGpu = await withNavigator({}, () => assertWebGPUAvailable());
  assert(isUnsupported(noGpu, "navigator.gpu is undefined"), "No navigator.gpu throws UNSUPPORTED_SOLVER");

  const noAdapter = await withNavigator({ gpu: { requestAdapter: async () => null } }, () =>
    assertWebGPUAvailable(),
  );
  assert(isUnsupported(noAdapter, "no GPU adapter"), "No adapter throws UNSUPPORTED_SOLVER");

  const failedRequest = await withNavigator(
    {
      gpu: {
        requestAdapter: async () => {
          throw new Error("adapter request failed");
        },
      },
    },
    () => assertWebGPUAvailable(),
  );
  assert(
    isUnsupported(failedRequest, "no GPU adapter"),
    "A failing adapter request throws UNSUPPORTED_SOLVER",
  );

  const available = await withNavigator({ gpu: { requestAdapter: async () => ({}) } }, () =>
    assertWebGPUAvailable(),
  );
  assert(available === null, "An available adapter passes the check");

  const inWorker = await withNavigator({}, () => assertWebGPUAvailable("a web worker of this browser"));
  assert(isUnsupported(inWorker, "a web worker of this browser"), "The message says where the check ran");

  // In Node.js there is no WebGPU: the solve must stop with the reason, not fail on new Worker()
  const nodeSolve = await withNavigator({}, () =>
    solveLinearSystemAsync("jacobi-gpu", [[2]], [2], { maxIterations: 10, tolerance: 1e-4 }),
  );
  assert(
    isUnsupported(nodeSolve, "navigator.gpu is undefined"),
    `solveLinearSystemAsync with "jacobi-gpu" and no WebGPU throws UNSUPPORTED_SOLVER (got ${nodeSolve?.message})`,
  );
}

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
