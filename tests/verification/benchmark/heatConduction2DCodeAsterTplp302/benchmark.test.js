/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Benchmark test for 2D steady-state heat conduction in a long strip (Code_Aster TPLP302)
 *
 * Replicates the Code_Aster validation test TPLP302 (V4.05.302,
 * https://ericca.uqtr.ca/fr12.4/man_v/v4/v4.05.302.pdf): a 0.2 m x 2 m strip ABCD with k = 1, a
 * fixed 100 degC temperature on the bottom edge AB, 0 degC on the side edges BC and AD, and an
 * insulated top edge CD. The strip is ten widths long, so the solution is that of a semi-infinite
 * strip (Welty, Wicks and Wilson), given by a Fourier series:
 *
 *   T(x, y) = (4 Tp / pi) * sum_{n >= 0} exp(-(2n+1) pi y / l) / (2n+1) * sin((2n+1) pi x / l)
 *
 * The test compares the nodal temperatures at seven points against the values published in
 * TPLP302, and against the series itself on a finer mesh.
 *
 * Run: node tests/verification/benchmark/heatConduction2DCodeAsterTplp302/benchmark.test.js (or npm test)
 */

import { FEAScriptModel } from "../../../../src/FEAScript.js";
import { basicLog, errorLog } from "../../../../src/utilities/logging.js";

const WIDTH = 0.2; // l
const LENGTH = 2;
const BOTTOM_TEMPERATURE = 100; // Tp

// Points and published reference temperatures (degC) of TPLP302
const referencePoints = [
  { name: "E", x: 0.05, y: 0.05, temperature: 43.496 },
  { name: "F", x: 0.05, y: 0.1, temperature: 18.978 },
  { name: "G", x: 0.05, y: 0.15, temperature: 8.559 },
  { name: "H", x: 0.1, y: 0.05, temperature: 54.467 },
  { name: "I", x: 0.1, y: 0.1, temperature: 26.096 },
  { name: "J", x: 0.1, y: 0.15, temperature: 12.032 },
  { name: "K", x: 0.1, y: 0.2, temperature: 5.499 },
];

// Fourier series solution of the semi-infinite strip, truncated at n = 1000 as in TPLP302
function seriesTemperature(x, y) {
  let sum = 0;
  for (let n = 0; n <= 1000; n++) {
    const m = 2 * n + 1;
    sum += (Math.exp((-m * Math.PI * y) / WIDTH) / m) * Math.sin((m * Math.PI * x) / WIDTH);
  }
  return ((4 * BOTTOM_TEMPERATURE) / Math.PI) * sum;
}

function runSimulation(numElementsX, numElementsY) {
  const model = new FEAScriptModel();

  model.setModelConfig("heatConductionScript", { coefficientFunctions: { thermalConductivity: 1 } });
  model.setMeshConfig({
    meshDimension: "2D",
    elementOrder: "quadratic",
    numElementsX,
    numElementsY,
    maxX: WIDTH,
    maxY: LENGTH,
  });

  model.addBoundaryCondition("0", ["constantTemperature", BOTTOM_TEMPERATURE]); // Bottom edge (AB)
  model.addBoundaryCondition("1", ["constantTemperature", 0]); // Left edge (AD)
  // Top edge (CD) is insulated and left unspecified (natural, zero-flux boundary)
  model.addBoundaryCondition("3", ["constantTemperature", 0]); // Right edge (BC)
  model.setSolverMethod("lusolve");

  const { solutionVector, nodesCoordinates } = model.solve();
  const { nodesXCoordinates, nodesYCoordinates } = nodesCoordinates;

  return referencePoints.map((point) => {
    const nodeIndex = nodesXCoordinates.findIndex(
      (x, i) => Math.abs(x - point.x) < 1e-10 && Math.abs(nodesYCoordinates[i] - point.y) < 1e-10,
    );
    return { ...point, nodeIndex, computed: solutionVector[nodeIndex] };
  });
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
basicLog("Starting benchmark test for Code_Aster TPLP302 (2D heat conduction in a strip)...");

// Published values, 8 x 80 quadratic mesh
const RELATIVE_TOLERANCE = 1e-3;
for (const { name, x, y, temperature, nodeIndex, computed } of runSimulation(8, 80)) {
  const relativeError = Math.abs(computed - temperature) / temperature;
  assert(
    nodeIndex !== -1 && relativeError < RELATIVE_TOLERANCE,
    `Mesh (8x80): temperature at ${name} (x=${x}, y=${y}) expected ${temperature}, got ${computed?.toFixed(
      4,
    )} (relative tolerance ${RELATIVE_TOLERANCE})`,
  );
}

// Fourier series, 16 x 160 quadratic mesh
const ABSOLUTE_TOLERANCE = 2e-3; // degC
for (const { name, x, y, nodeIndex, computed } of runSimulation(16, 160)) {
  const exact = seriesTemperature(x, y);
  assert(
    nodeIndex !== -1 && Math.abs(computed - exact) < ABSOLUTE_TOLERANCE,
    `Mesh (16x160): temperature at ${name} (x=${x}, y=${y}) expected ${exact.toFixed(
      4,
    )} from the series, got ${computed?.toFixed(4)} (tolerance ${ABSOLUTE_TOLERANCE})`,
  );
}

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
