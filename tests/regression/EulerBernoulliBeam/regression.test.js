/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Regression test for the 1D Euler-Bernoulli beam model (EulerBernoulliBeam)
 *
 * Replicates the exact setup from
 * examples/eulerBernoulliBeamScript/clampedSpringSupportedBeam1D/
 * clampedSpringSupportedBeam1D.js — the "Bending of a Beam" example from J.N.
 * Reddy, "An Introduction to the Finite Element Method", 3rd ed., McGraw-Hill,
 * 2006 (FEM1D example problems, Chapter 7) — and asserts:
 *   1) the deflection/rotation solution vector against known-good baseline values
 *   2) global force and moment equilibrium of the resulting FE solution, which
 *      holds regardless of the specific numeric baseline and independently
 *      confirms the assembled system is physically consistent
 *
 * Run: node tests/regression/EulerBernoulliBeam/regression.test.js (or npm test)
 */

import * as mathjs from "mathjs";
import { FEAScriptModel } from "../../../src/FEAScript.js";
import { assembleEulerBernoulliBeamMat } from "../../../src/models/eulerBernoulliBeam.js";
import { basicLog, errorLog } from "../../../src/utilities/logging.js";

// FEAScript.js references `math` as a global (loaded via CDN in browser).
// Set it here before any solve() call.
globalThis.math = mathjs;

// Baseline values (see REGRESSION.md for derivation and verification)
const EXPECTED = {
  w1: 0,
  theta1: 0,
  w2: 0,
  theta2: -0.0056790761806273645,
  w3: -0.08014477766287427,
  theta3: -0.02120389520854876,
};
const TOLERANCE = 1e-8;

const EI = 2.0e6;
const springConstant = 200;
const distributedLoad = -1000;
const distributedLoadSpan = [0, 5];
const appliedMoment = 1250;
const appliedForce = -2500;

function runSimulation() {
  const model = new FEAScriptModel();

  model.setModelConfig("eulerBernoulliBeamScript", {
    coefficientFunctions: {
      EI: (x) => EI,
      q: (x) => (x <= distributedLoadSpan[1] ? distributedLoad : 0),
    },
  });
  model.setMeshConfig({
    meshDimension: "1D",
    elementOrder: "linear",
    numElementsX: 2,
    maxX: 10,
  });

  model.addBoundaryCondition("1", [["fixed"]]);
  model.addBoundaryCondition("2", [["pinned"], ["moment", appliedMoment]]);
  model.addBoundaryCondition("3", [
    ["spring", springConstant],
    ["force", appliedForce],
  ]);
  model.setSolverMethod("lusolve");

  return model.solve();
}

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

basicLog("");
basicLog("================================");
basicLog("Starting regression test for the 1D Euler-Bernoulli beam model...");

const { solutionVector } = runSimulation();
// mathjs' lusolve returns a nested array: [[v0], [v1], ...]
const flatSolution = solutionVector.map((entry) => (Array.isArray(entry) ? entry[0] : entry));
const [w1, theta1, w2, theta2, w3, theta3] = flatSolution;

basicLog("");
basicLog("[1] Baseline deflection/rotation values");

assert(Math.abs(w1 - EXPECTED.w1) < TOLERANCE, `w1: expected ~${EXPECTED.w1}, got ${w1}`);
assert(Math.abs(theta1 - EXPECTED.theta1) < TOLERANCE, `theta1: expected ~${EXPECTED.theta1}, got ${theta1}`);
assert(Math.abs(w2 - EXPECTED.w2) < TOLERANCE, `w2: expected ~${EXPECTED.w2}, got ${w2}`);
assert(Math.abs(theta2 - EXPECTED.theta2) < TOLERANCE, `theta2: expected ${EXPECTED.theta2}, got ${theta2}`);
assert(Math.abs(w3 - EXPECTED.w3) < TOLERANCE, `w3: expected ${EXPECTED.w3}, got ${w3}`);
assert(Math.abs(theta3 - EXPECTED.theta3) < TOLERANCE, `theta3: expected ${EXPECTED.theta3}, got ${theta3}`);

// Reassemble without boundary conditions to recover reactions for the equilibrium checks
basicLog("");
basicLog("[2] Global force and moment equilibrium");

const meshDataForCheck = {
  nodesXCoordinates: [0, 5, 10],
  nop: [
    [1, 2],
    [2, 3],
  ],
  totalElements: 2,
  totalNodesX: 3,
  meshDimension: "1D",
  elementOrder: "linear",
};
const { jacobianMatrix: Kraw, residualVector: Fraw } = assembleEulerBernoulliBeamMat(
  meshDataForCheck,
  {},
  {
    EI: (x) => EI,
    q: (x) => (x <= distributedLoadSpan[1] ? distributedLoad : 0),
  },
);

function matVec(matrix, vector) {
  return matrix.map((row) => row.reduce((sum, value, colIndex) => sum + value * vector[colIndex], 0));
}
const residualAtEachDOF = matVec(Kraw, flatSolution).map((value, i) => value - Fraw[i]);

const reactionForceNode1 = residualAtEachDOF[0];
const reactionMomentNode1 = residualAtEachDOF[1];
const reactionForceNode2 = residualAtEachDOF[2];
const springForceOnBeam = -springConstant * w3;

const totalDistributedLoad = distributedLoad * (distributedLoadSpan[1] - distributedLoadSpan[0]);
const distributedLoadCentroidX = (distributedLoadSpan[0] + distributedLoadSpan[1]) / 2;

const sumVerticalForces =
  reactionForceNode1 + reactionForceNode2 + springForceOnBeam + totalDistributedLoad + appliedForce;
const sumMomentsAboutOrigin =
  reactionMomentNode1 +
  reactionForceNode2 * 5 +
  springForceOnBeam * 10 +
  totalDistributedLoad * distributedLoadCentroidX +
  appliedForce * 10 +
  appliedMoment;

const equilibriumTolerance = 1e-6;
assert(
  Math.abs(sumVerticalForces) < equilibriumTolerance,
  `Global force equilibrium holds (sum=${sumVerticalForces})`,
);
assert(
  Math.abs(sumMomentsAboutOrigin) < equilibriumTolerance,
  `Global moment equilibrium about x=0 holds (sum=${sumMomentsAboutOrigin})`,
);

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
