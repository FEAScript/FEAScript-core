/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for the Dirichlet conditions of SparseMatrix (imposeDirichletValues):
 *  - A symmetric matrix stays symmetric, with identity rows and columns at the prescribed degrees of freedom
 *  - The known values move to the right-hand side
 *  - The solution is the one of clearing the rows only
 *  - Entries outside the sparsity pattern are eliminated like the others
 */

import assert from "node:assert/strict";
import test from "node:test";

import { SparseMatrix } from "../../src/linalg/sparseMatrix.js";
import { solveLinearSystem } from "../../src/solvers/linearSystemSolver.js";

// The 1D Laplacian with 5 unknowns, a symmetric matrix with a known solution
const dense = [
  [2, -1, 0, 0, 0],
  [-1, 2, -1, 0, 0],
  [0, -1, 2, -1, 0],
  [0, 0, -1, 2, -1],
  [0, 0, 0, -1, 2],
];
const pattern = () => {
  const matrix = SparseMatrix.fromElementDofs(5, 4, (element) => [element, element + 1]);
  dense.forEach((row, i) => row.forEach((value, j) => value !== 0 && matrix.setValue(i, j, value)));
  return matrix;
};

test("A symmetric matrix stays symmetric, with identity rows and columns at the prescribed values", () => {
  const matrix = pattern();
  const rightHandSide = new Array(5).fill(0);
  matrix.imposeDirichletValues(new Map([[0, 3], [4, 7]]), rightHandSide); // prettier-ignore

  assert.deepEqual(matrix.toDense(), [
    [1, 0, 0, 0, 0],
    [0, 2, -1, 0, 0],
    [0, -1, 2, -1, 0],
    [0, 0, -1, 2, 0],
    [0, 0, 0, 0, 1],
  ]);
  assert.deepEqual([...rightHandSide], [3, 3, 0, 7, 7]);
});

test("The solution is the one of clearing the rows only", () => {
  const matrix = pattern();
  const rightHandSide = [1, 2, 3, 4, 5];
  matrix.imposeDirichletValues(new Map([[0, 3], [2, -1]]), rightHandSide); // prettier-ignore

  const rowsCleared = pattern();
  const rowsClearedRightHandSide = [3, 2, -1, 4, 5];
  for (const dof of [0, 2]) {
    rowsCleared.clearRow(dof);
    rowsCleared.setValue(dof, dof, 1);
  }

  const solution = solveLinearSystem("lusolve", matrix, rightHandSide).solutionVector;
  const expected = solveLinearSystem("lusolve", rowsCleared, rowsClearedRightHandSide).solutionVector;
  solution.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 1e-12));
});

test("Entries outside the sparsity pattern are eliminated like the others", () => {
  const matrix = SparseMatrix.fromDense(dense); // No pattern: every entry is in the overflow Maps
  const rightHandSide = new Array(5).fill(0);
  matrix.imposeDirichletValues(new Map([[1, 2]]), rightHandSide);

  assert.equal(matrix.getValue(0, 1), 0);
  assert.equal(matrix.getValue(2, 1), 0);
  assert.equal(matrix.getValue(1, 1), 1);
  assert.deepEqual([...rightHandSide], [2, 2, 2, 0, 0]);
});
