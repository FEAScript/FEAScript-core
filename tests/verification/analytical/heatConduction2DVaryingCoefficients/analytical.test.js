/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Analytical test for HeatConduction2DVaryingCoefficients
 *
 * Guards the spatially varying `thermalConductivity` and `heatSource` coefficients of
 * heatConductionScript in 2D, where the coefficients are evaluated at the physical
 * coordinates produced by the 2D isoparametric mapping
 *
 * As in the 1D counterpart the expected values are closed-form solutions rather than stored
 * reference numbers, with the cases chosen so the finite element solution is exact at the
 * nodes and the tolerance can be 1e-10.
 *
 * Run: node tests/verification/analytical/heatConduction2DVaryingCoefficients/analytical.test.js (or npm test)
 */

import * as mathjs from "mathjs";
import { FEAScriptModel } from "../../../../src/FEAScript.js";
import { basicLog, errorLog } from "../../../../src/utilities/logging.js";

// FEAScript.js references `math` as a global (loaded via CDN in browser).
// Set it here before any solve() call.
globalThis.math = mathjs;

const TOLERANCE = 1e-10;

function runSimulation(coefficientFunctions, boundaryConditions) {
  const model = new FEAScriptModel();

  model.setModelConfig("heatConductionScript", { coefficientFunctions });
  model.setMeshConfig({
    meshDimension: "2D",
    elementOrder: "quadratic",
    numElementsX: 4,
    numElementsY: 3,
    maxX: 1,
    maxY: 1,
  });

  Object.entries(boundaryConditions).forEach(([boundaryKey, condition]) => {
    model.addBoundaryCondition(boundaryKey, condition);
  });
  model.setSolverMethod("lusolve");

  const { solutionVector, nodesCoordinates } = model.solve();

  // solutionVector from math.lusolve is a nested array: [[T0], [T1], ...]
  return {
    temperatures: solutionVector.map((value) => (Array.isArray(value) ? value[0] : value)),
    nodesXCoordinates: nodesCoordinates.nodesXCoordinates,
    nodesYCoordinates: nodesCoordinates.nodesYCoordinates,
  };
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

/**
 * Function to assert that every nodal temperature matches an analytical solution
 * @param {string} label - Description of the case under test
 * @param {object} result - Object containing the computed temperatures and node coordinates
 * @param {function} analyticalSolution - Function returning the exact temperature at (x, y)
 */
function assertMatchesAnalyticalSolution(label, result, analyticalSolution) {
  const { temperatures, nodesXCoordinates, nodesYCoordinates } = result;

  let maxError = 0;
  let maxErrorNodeIndex = 0;
  for (let nodeIndex = 0; nodeIndex < temperatures.length; nodeIndex++) {
    const error = Math.abs(
      temperatures[nodeIndex] -
        analyticalSolution(nodesXCoordinates[nodeIndex], nodesYCoordinates[nodeIndex]),
    );
    if (error > maxError) {
      maxError = error;
      maxErrorNodeIndex = nodeIndex;
    }
  }

  assert(
    maxError < TOLERANCE,
    `${label}: largest nodal deviation ${maxError.toExponential(3)} at ` +
      `(x = ${nodesXCoordinates[maxErrorNodeIndex]}, y = ${nodesYCoordinates[maxErrorNodeIndex]}) ` +
      `(tolerance ${TOLERANCE})`,
  );
}

basicLog("");
basicLog("================================");
basicLog("Starting analytical test for solid heat transfer in 2D with varying coefficients...");

/**
 * Case 1 - conductivity varying along x, with a matching heat source
 *
 * With k(x, y) = 1 + x and Q = -1 the field T = x satisfies div(k * grad(T)) + Q = 0. The
 * left and right boundaries are held at 0 and 1, while the bottom and top are left
 * unspecified and so are natural (zero flux), which T = x also satisfies as it has no
 * y-dependence.
 */
assertMatchesAnalyticalSolution(
  "Manufactured solution T = x",
  runSimulation(
    { thermalConductivity: (x, y) => 1 + x, heatSource: -1 },
    {
      1: ["constantTemp", 0], // Left boundary (x = 0)
      3: ["constantTemp", 1], // Right boundary (x = 1)
    },
  ),
  (x, y) => x,
);

/**
 * Case 2 - the same problem rotated onto the y-axis
 *
 * With k(x, y) = 1 + y and Q = -1 the exact solution is T = y, held by the bottom and top
 * boundaries while the sides stay natural. Rotating the previous case confirms that the
 * y-coordinate reaches the coefficients rather than being dropped or swapped with x.
 */
assertMatchesAnalyticalSolution(
  "Manufactured solution T = y",
  runSimulation(
    { thermalConductivity: (x, y) => 1 + y, heatSource: -1 },
    {
      0: ["constantTemp", 0], // Bottom boundary (y = 0)
      2: ["constantTemp", 1], // Top boundary (y = 1)
    },
  ),
  (x, y) => y,
);

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
