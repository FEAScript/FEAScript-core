/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Regression test for AdvectionDiffusion1D
 *
 * Replicates the physical setup from advectionDiffusion1D.js for linear and quadratic elements
 * and every applicable solver method (lusolve, jacobi, frontal), and asserts the solution at x=0.5 and x=1
 * against known good values
 *
 * Run: node tests/regression/advectionDiffusion1D/regression.test.js (or npm test)
 */

import { FEAScriptModel } from "../../../src/FEAScript.js";
import { basicLog, errorLog } from "../../../src/utilities/logging.js";

const TOLERANCE = 1e-4;

// The Jacobi method requires diagonally dominant matrices, so it is used with linear elements only
const cases = [
  {
    elementOrder: "linear",
    solverMethods: ["lusolve", "jacobi", "frontal"],
    expected: [
      { x: 0.5, u: 0.89448 },
      { x: 1, u: 0.87556 },
    ],
  },
  {
    elementOrder: "quadratic",
    solverMethods: ["lusolve", "frontal"],
    expected: [
      { x: 0.5, u: 0.89447 },
      { x: 1, u: 0.87563 },
    ],
  },
];

function runSimulation(elementOrder, solverMethod) {
  const model = new FEAScriptModel();

  model.setModelConfig("generalFormPDEScript", {
    coefficientFunctions: {
      A: (x) => 1, // Diffusion coefficient
      B: (x) => -10, // Advection coefficient
      C: (x) => 0, // Reaction coefficient
      D: (x) => 10 * Math.exp(-200 * Math.pow(x - 0.5, 2)), // Source term
    },
  });
  model.setMeshConfig({
    meshDimension: "1D",
    elementOrder,
    numElementsX: 20,
    maxX: 1.0,
  });

  model.addBoundaryCondition("0", ["constantValue", 1]);
  model.addBoundaryCondition("1", ["zeroGradient"]);
  model.setSolverMethod(solverMethod);

  return model.solve({ maxIterations: 200000, tolerance: 1e-8 });
}

function assert(condition, message) {
  if (!condition) {
    errorLog(`FAIL: ${message}`);
    failed++;
  } else {
    basicLog(`PASS: ${message}`);
    passed++;
  }
}

let passed = 0;
let failed = 0;

basicLog("");
basicLog("================================");
basicLog("Starting regression test for 1D advection-diffusion...");

for (const { elementOrder, solverMethods, expected } of cases) {
  for (const solverMethod of solverMethods) {
    const label = `${elementOrder} elements, ${solverMethod}`;
    const { solutionVector, nodesCoordinates } = runSimulation(elementOrder, solverMethod);

    for (const { x, u: expectedU } of expected) {
      const nodeIndex = nodesCoordinates.nodesXCoordinates.findIndex((nodeX) => Math.abs(nodeX - x) < 1e-10);

      const u = solutionVector[nodeIndex];

      assert(
        Math.abs(u - expectedU) < TOLERANCE,
        `${label}: solution at x=${x}: expected ${expectedU}, got ${u} (tolerance ${TOLERANCE})`,
      );
    }
  }
}

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
