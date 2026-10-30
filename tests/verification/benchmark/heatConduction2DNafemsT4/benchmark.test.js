/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.1 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Benchmark test for 2D steady-state heat conduction with convection (NAFEMS T4)
 *
 * Replicates the NAFEMS T4 benchmark, also documented as a DIANA FEA tutorial
 * (https://tutorials.dianafea.com/2DHeatTransferConvection.pdf) and by Altair
 * (https://help.altair.com/hwsolvers/os/topics/solvers/os/nafems_test_problem_t4_r.htm):
 * a 0.6 m x 1.0 m rectangular plate ABCD with a fixed 100 degC temperature on the bottom edge
 * AB, an insulated left edge AD, and convection (h = 750 W/(m2.K), ambient = 0 degC) on the top
 * edge CD and right edge BC. The published target temperature at point E (x = 0.6 m, y = 0.2 m,
 * on the convective right edge) is 18.3 degC.
 *
 * This test is an independent reproduction of the NAFEMS T4 problem and is not sponsored,
 * endorsed, or affiliated with NAFEMS.
 *
 * Run: node tests/verification/benchmark/heatConduction2DNafemsT4/benchmark.test.js (or npm test)
 */

import { FEAScriptModel } from "../../../../src/FEAScript.js";
import { basicLog, errorLog } from "../../../../src/utilities/logging.js";

const POINT_E = { x: 0.6, y: 0.2 };
const NAFEMS_TARGET_T = 18.3;

function runSimulation(numElementsX, numElementsY) {
  const model = new FEAScriptModel();

  model.setModelConfig("heatConductionScript", { coefficientFunctions: { thermalConductivity: 52 } });
  model.setMeshConfig({
    meshDimension: "2D",
    elementOrder: "quadratic",
    numElementsX,
    numElementsY,
    maxX: 0.6,
    maxY: 1.0,
  });

  model.addBoundaryCondition("0", ["constantTemperature", 100]); // Bottom edge (AB), fixed 100 degC
  // Left edge (AD) is insulated and left unspecified (natural, zero-flux boundary)
  model.addBoundaryCondition("2", ["convection", 750, 0]); // Top edge (CD), convection to 0 degC
  model.addBoundaryCondition("3", ["convection", 750, 0]); // Right edge (BC), convection to 0 degC
  model.setSolverMethod("lusolve");

  const { solutionVector, nodesCoordinates } = model.solve();
  const { nodesXCoordinates, nodesYCoordinates } = nodesCoordinates;

  const nodeIndex = nodesXCoordinates.findIndex(
    (x, i) => Math.abs(x - POINT_E.x) < 1e-10 && Math.abs(nodesYCoordinates[i] - POINT_E.y) < 1e-10,
  );

  const temperatureAtE = solutionVector[nodeIndex];

  return { nodeIndex, temperatureAtE };
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
basicLog("Starting benchmark test for NAFEMS T4 (2D heat conduction with convection)...");

const CONVERGENCE_TOLERANCE = 0.1; // degC
const { nodeIndex, temperatureAtE } = runSimulation(12, 20);

assert(nodeIndex !== -1, `Found node E at (x=${POINT_E.x}, y=${POINT_E.y})`);
assert(
  Math.abs(temperatureAtE - NAFEMS_TARGET_T) < CONVERGENCE_TOLERANCE,
  `Mesh (12x20): temperature at E expected close to NAFEMS target ${NAFEMS_TARGET_T}, got ${temperatureAtE} (tolerance ${CONVERGENCE_TOLERANCE})`,
);

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
