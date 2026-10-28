/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Analytical test for EulerBernoulliBeam1DCantilever
 *
 * Guards the 1D Euler-Bernoulli beam model (assembleEulerBernoulliBeamMat) against closed-form
 * results. Unlike the tests under tests/regression the expected values are not stored reference
 * numbers, so a tight tolerance is used.
 *
 * Covers:
 *  - Single-element bending stiffness matrix vs. the closed-form textbook
 *    Hermite beam element stiffness matrix (2 independent EI/L combinations)
 *  - Cantilever beam under a tip point load vs. the classical closed-form
 *    solution (w_tip = P*L^3/(3EI), theta_tip = P*L^2/(2EI))
 *
 * Run: node tests/verification/analytical/eulerBernoulliBeam1DCantilever/analytical.test.js (or npm test)
 */

import { assembleEulerBernoulliBeamMat } from "../../../../src/models/eulerBernoulliBeam.js";
import { prepareMesh } from "../../../../src/mesh/meshUtils.js";
import { solveLinearSystem } from "../../../../src/solvers/linearSystemSolver.js";
import { basicLog, errorLog } from "../../../../src/utilities/logging.js";

basicLog("");
basicLog("================================");
basicLog("Starting analytical test for the Euler-Bernoulli beam in 1D (cantilever)...");

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

/**
 * Closed-form Euler-Bernoulli beam element stiffness matrix for constant EI,
 * DOF order [w1, theta1, w2, theta2] (see e.g. any FEM textbook)
 */
function closedFormBeamStiffness(EI, L) {
  const c = EI / L ** 3;
  return [
    [12 * c, 6 * L * c, -12 * c, 6 * L * c],
    [6 * L * c, 4 * L ** 2 * c, -6 * L * c, 2 * L ** 2 * c],
    [-12 * c, -6 * L * c, 12 * c, -6 * L * c],
    [6 * L * c, 2 * L ** 2 * c, -6 * L * c, 4 * L ** 2 * c],
  ];
}

function maxAbsDiff(A, B) {
  let diff = 0;
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < A[i].length; j++) {
      diff = Math.max(diff, Math.abs(A[i][j] - B[i][j]));
    }
  }
  return diff;
}

basicLog("");
basicLog("[1] Single-element stiffness matrix vs. closed-form Hermite beam matrix");

for (const [EI, L] of [
  [2.0e6, 5],
  [7.5e4, 2.5],
]) {
  const meshData = prepareMesh({
    meshDimension: "1D",
    elementOrder: "linear",
    numElementsX: 1,
    maxX: L,
  });
  const { jacobianMatrix } = assembleEulerBernoulliBeamMat(meshData, {}, { EI: () => EI });
  const diff = maxAbsDiff(jacobianMatrix.toDense(), closedFormBeamStiffness(EI, L));
  assert(diff < 1e-6, `Element stiffness matches closed-form matrix for EI=${EI}, L=${L} (diff=${diff})`);
}

basicLog("");
basicLog("[2] Cantilever beam under a tip point load");

const L = 4;
const EI = 1.0e5;
const P = -1000; // Downward tip load

const meshData = prepareMesh({
  meshDimension: "1D",
  elementOrder: "linear",
  numElementsX: 1,
  maxX: L,
});
const { jacobianMatrix, residualVector } = assembleEulerBernoulliBeamMat(
  meshData,
  { 1: [["fixed"]], 2: [["force", P]] },
  { EI: () => EI },
);
const { solutionVector } = solveLinearSystem("lusolve", jacobianMatrix, residualVector);
const flatSolution = Array.from(solutionVector);

const wExact = (P * L ** 3) / (3 * EI);
const thetaExact = (P * L ** 2) / (2 * EI);
const tolerance = 1e-9;

assert(
  Math.abs(flatSolution[0]) < tolerance && Math.abs(flatSolution[1]) < tolerance,
  "Clamped end has zero deflection and rotation",
);
assert(
  Math.abs(flatSolution[2] - wExact) < tolerance,
  `Tip deflection matches closed form (got ${flatSolution[2]}, expected ${wExact})`,
);
assert(
  Math.abs(flatSolution[3] - thetaExact) < tolerance,
  `Tip rotation matches closed form (got ${flatSolution[3]}, expected ${thetaExact})`,
);

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
