/**
 * Regression test for HeatConduction2DFin
 *
 * Replicates the exact setup from HeatConduction2DFin.html and asserts
 * that the temperature at (x=0, y=2) remains 81.31873.
 *
 * Run: node tests/regression/HeatConduction2DFin/regression.test.js
 */

import * as mathjs from "mathjs";
import { FEAScriptModel } from "../../../src/FEAScript.js";
import { basicLog, errorLog } from "../../../src/utilities/logging.js";

basicLog("");
basicLog("================================");
basicLog("Starting test in solid heat transfer 2D fin...");

// FEAScript.js references `math` as a global (loaded via CDN in browser).
// Set it here before any solve() call.
globalThis.math = mathjs;

const EXPECTED_X = 0;
const EXPECTED_Y = 2;
const EXPECTED_T = 81.31873;
const TOLERANCE = 1e-4;

function runSimulation() {
  const model = new FEAScriptModel();

  model.setModelConfig("heatConductionScript");
  model.setMeshConfig({
    meshDimension: "2D",
    elementOrder: "quadratic",
    numElementsX: 8,
    numElementsY: 4,
    maxX: 4,
    maxY: 2,
  });

  model.addBoundaryCondition("0", ["constantTemp", 200]);
  model.addBoundaryCondition("1", ["symmetry"]);
  model.addBoundaryCondition("2", ["convection", 1, 20]);
  model.addBoundaryCondition("3", ["constantTemp", 200]);
  model.setSolverMethod("lusolve");

  return model.solve();
}

function assert(condition, message) {
  if (!condition) {
    errorLog(`FAIL: ${message}`);
    process.exit(1);
  }
}

const { solutionVector, nodesCoordinates } = runSimulation();
const { nodesXCoordinates, nodesYCoordinates } = nodesCoordinates;

// Locate the node at (x=0, y=2) by searching coordinates.
// This is robust against changes in mesh ordering conventions.
const nodeIndex = nodesXCoordinates.findIndex(
  (x, i) => Math.abs(x - EXPECTED_X) < 1e-10 && Math.abs(nodesYCoordinates[i] - EXPECTED_Y) < 1e-10,
);

assert(nodeIndex !== -1, `No node found at (x=${EXPECTED_X}, y=${EXPECTED_Y})`);

// solutionVector from math.lusolve is a nested array: [[T0], [T1], ...]
const T = Array.isArray(solutionVector[nodeIndex]) ? solutionVector[nodeIndex][0] : solutionVector[nodeIndex];

assert(
  Math.abs(T - EXPECTED_T) < TOLERANCE,
  `Temperature at (x=${EXPECTED_X}, y=${EXPECTED_Y}): expected ${EXPECTED_T}, got ${T} (tolerance ${TOLERANCE})`,
);

basicLog(`PASS: T(x=${EXPECTED_X}, y=${EXPECTED_Y}) = ${T.toFixed(5)} (expected ${EXPECTED_T})`);

basicLog("================================");
