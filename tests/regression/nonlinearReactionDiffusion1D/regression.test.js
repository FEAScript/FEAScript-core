/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Regression test for NonlinearReactionDiffusion1D
 *
 * Replicates the physical setup from nonlinearReactionDiffusion1D.js (Newton-Raphson with lusolve)
 * for linear and quadratic elements, and asserts the solution at x=1, x=5 and x=10 against known
 * good values
 *
 * Run: node tests/regression/nonlinearReactionDiffusion1D/regression.test.js (or npm test)
 */

import { FEAScriptModel } from "../../../src/FEAScript.js";
import { basicLog, errorLog } from "../../../src/utilities/logging.js";

const TOLERANCE = 1e-4;
const Da = 1;

const cases = [
  {
    elementOrder: "linear",
    expected: [
      { x: 1, u: 0.50093 },
      { x: 5, u: 0.10962 },
      { x: 10, u: 0.05678 },
    ],
  },
  {
    elementOrder: "quadratic",
    expected: [
      { x: 1, u: 0.50436 },
      { x: 5, u: 0.1104 },
      { x: 10, u: 0.05709 },
    ],
  },
];

function runSimulation(elementOrder) {
  const model = new FEAScriptModel();

  model.setModelConfig("generalFormPDEScript", {
    nonlinear: true, // Solve with the Newton-Raphson method
    coefficientFunctions: {
      A: (x) => 1, // Diffusion coefficient
      B: (x) => 0, // Advection coefficient
      C: (x) => 0, // Linear reaction coefficient
      D: (x, u) => Da * u ** 2, // Nonlinear reaction/source term
      dDdu: (x, u) => 2 * Da * u, // Derivative of D with respect to u, required for the Jacobian
    },
  });
  model.setMeshConfig({
    meshDimension: "1D",
    elementOrder,
    numElementsX: 20,
    maxX: 10.0,
  });

  model.addBoundaryCondition("0", ["constantValue", 1]);
  model.addBoundaryCondition("1", ["zeroGradient"]);
  model.setSolverMethod("lusolve");

  return model.solve();
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
basicLog("Starting regression test for 1D nonlinear reaction-diffusion...");

for (const { elementOrder, expected } of cases) {
  const label = `${elementOrder} elements, lusolve`;
  const { solutionVector, nodesCoordinates } = runSimulation(elementOrder);

  for (const { x, u: expectedU } of expected) {
    const nodeIndex = nodesCoordinates.nodesXCoordinates.findIndex((nodeX) => Math.abs(nodeX - x) < 1e-10);

    const u = solutionVector[nodeIndex];

    assert(
      Math.abs(u - expectedU) < TOLERANCE,
      `${label}: solution at x=${x}: expected ${expectedU}, got ${u} (tolerance ${TOLERANCE})`,
    );
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
