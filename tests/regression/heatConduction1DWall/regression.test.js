/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Regression test for HeatConduction1DWall
 *
 * Replicates the physical setup from heatConduction1DWall.js for linear and quadratic elements
 * and every applicable solver method (lusolve, frontal, jacobi), and asserts that the temperature
 * at x=0 remains 7.60870 and at x=0.075 remains 6.30435
 *
 * Run: node tests/regression/heatConduction1DWall/regression.test.js (or npm test)
 */

import { FEAScriptModel } from "../../../src/FEAScript.js";
import { basicLog, errorLog } from "../../../src/utilities/logging.js";

const TOLERANCE = 1e-4;

// The exact solution is linear, so both element orders give the same nodal values
const EXPECTED = [
  { x: 0, T: 7.6087 },
  { x: 0.075, T: 6.30435 },
];

// The Jacobi method requires diagonally dominant matrices, so it is used with linear elements only
const cases = [
  { elementOrder: "linear", solverMethod: "lusolve" },
  { elementOrder: "linear", solverMethod: "frontal" },
  { elementOrder: "linear", solverMethod: "jacobi" },
  { elementOrder: "quadratic", solverMethod: "lusolve" },
  { elementOrder: "quadratic", solverMethod: "frontal" },
];

function runSimulation({ elementOrder, solverMethod }) {
  const model = new FEAScriptModel();

  model.setModelConfig("heatConductionScript");
  model.setMeshConfig({
    meshDimension: "1D",
    elementOrder,
    numElementsX: 10,
    maxX: 0.15,
  });

  model.addBoundaryCondition("0", ["convection", 1, 25]);
  model.addBoundaryCondition("1", ["constantTemperature", 5]);
  model.setSolverMethod(solverMethod);

  return model.solve({ maxIterations: 200000, tolerance: 1e-8 });
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
basicLog("Starting regression test for solid heat transfer in a 1D wall...");

for (const testCase of cases) {
  const label = `${testCase.elementOrder} elements, ${testCase.solverMethod}`;
  const { solutionVector, nodesCoordinates } = runSimulation(testCase);

  for (const { x, T: expectedT } of EXPECTED) {
    const nodeIndex = nodesCoordinates.nodesXCoordinates.findIndex((nodeX) => Math.abs(nodeX - x) < 1e-10);

    const T = solutionVector[nodeIndex];

    assert(
      Math.abs(T - expectedT) < TOLERANCE,
      `${label}: temperature at x=${x}: expected ${expectedT}, got ${T} (tolerance ${TOLERANCE})`,
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
