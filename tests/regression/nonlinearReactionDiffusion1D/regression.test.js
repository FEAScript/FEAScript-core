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
 * good values. The same values are asserted with the frontal solver inside Newton-Raphson
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

function runSimulation(elementOrder, solverMethod) {
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
  model.setGeometry({ line: 10.0 });
  model.setMeshConfig({ elementOrder, divisions: 20 });

  model.addBoundaryCondition("left", ["constantValue", 1]);
  model.addBoundaryCondition("right", ["zeroGradient"]);
  model.setSolverMethod(solverMethod);

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

for (const solverMethod of ["lusolve", "frontal"]) {
  for (const { elementOrder, expected } of cases) {
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
