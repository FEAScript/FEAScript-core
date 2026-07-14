/**
 * Regression test for HeatConduction1DWall
 *
 * Replicates the exact setup from HeatConduction1DWall.html and asserts
 * that the temperature at node 0 (convection boundary) remains 10.29412.
 *
 * Run: node tests/regression/HeatConduction1DWall/regression.test.js
 */

import * as mathjs from "mathjs";
import { FEAScriptModel } from "../../../src/FEAScript.js";
import { basicLog, errorLog } from "../../../src/utilities/logging.js";

// FEAScript.js references `math` as a global (loaded via CDN in browser).
// Set it here before any solve() call.
globalThis.math = mathjs;

const EXPECTED_T0 = 10.29412;
const TOLERANCE = 1e-4;

function runSimulation() {
  const model = new FEAScriptModel();

  model.setModelConfig("heatConductionScript");
  model.setMeshConfig({
    meshDimension: "1D",
    elementOrder: "linear",
    numElementsX: 10,
    maxX: 0.15,
  });

  model.addBoundaryCondition("0", ["convection", 1, 25]);
  model.addBoundaryCondition("1", ["constantTemp", 5]);
  model.setSolverMethod("lusolve");

  return model.solve();
}

function assert(condition, message) {
  if (!condition) {
    errorLog(`FAIL: ${message}`);
    process.exit(1);
  }
}

basicLog("");
basicLog("================================");
basicLog("Starting test in solid heat transfer 1D wall...");
const { solutionVector } = runSimulation();

// solutionVector from math.lusolve is a nested array: [[T0], [T1], ...]
const T0 = Array.isArray(solutionVector[0]) ? solutionVector[0][0] : solutionVector[0];

assert(
  Math.abs(T0 - EXPECTED_T0) < TOLERANCE,
  `Temperature at node 0: expected ${EXPECTED_T0}, got ${T0} (tolerance ${TOLERANCE})`,
);

basicLog(`PASS: T(x=0) = ${T0.toFixed(5)} (expected ${EXPECTED_T0})`);
basicLog("================================");
