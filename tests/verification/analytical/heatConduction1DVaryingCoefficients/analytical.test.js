/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Regression test for HeatConduction1DVaryingCoefficients
 *
 * Guards the spatially varying `thermalConductivity` and `heatSource` coefficients of
 * heatConductionScript in 1D
 *
 * Unlike the other regression tests the expected values are not stored reference numbers
 * but closed-form solutions of the underlying PDE. Each case is chosen so the finite
 * element solution is exact at the nodes, which allows a tolerance of 1e-10 rather than
 * the 1e-4 used where a stored value is compared.
 *
 * Run: node tests/regression/HeatConduction1DVaryingCoefficients/regression.test.js (or npm test)
 */

import * as mathjs from "mathjs";
import { FEAScriptModel } from "../../../src/FEAScript.js";
import { basicLog, errorLog } from "../../../src/utilities/logging.js";

// FEAScript.js references `math` as a global (loaded via CDN in browser).
// Set it here before any solve() call.
globalThis.math = mathjs;

const TOLERANCE = 1e-10;

function runSimulation(coefficientFunctions, elementOrder, boundaryConditions, solverMethod = "lusolve") {
  const model = new FEAScriptModel();

  model.setModelConfig("heatConductionScript", { coefficientFunctions });
  model.setMeshConfig({
    meshDimension: "1D",
    elementOrder,
    numElementsX: 8,
    maxX: 1,
  });

  Object.entries(boundaryConditions).forEach(([boundaryKey, condition]) => {
    model.addBoundaryCondition(boundaryKey, condition);
  });
  model.setSolverMethod(solverMethod);

  const { solutionVector, nodesCoordinates } = model.solve();

  // solutionVector from math.lusolve is a nested array: [[T0], [T1], ...]
  return {
    temperatures: solutionVector.map((value) => (Array.isArray(value) ? value[0] : value)),
    nodesXCoordinates: nodesCoordinates.nodesXCoordinates,
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
 * @param {function} analyticalSolution - Function returning the exact temperature at a coordinate
 */
function assertMatchesAnalyticalSolution(label, result, analyticalSolution) {
  const { temperatures, nodesXCoordinates } = result;

  let maxError = 0;
  let maxErrorNodeIndex = 0;
  for (let nodeIndex = 0; nodeIndex < temperatures.length; nodeIndex++) {
    const error = Math.abs(temperatures[nodeIndex] - analyticalSolution(nodesXCoordinates[nodeIndex]));
    if (error > maxError) {
      maxError = error;
      maxErrorNodeIndex = nodeIndex;
    }
  }

  assert(
    maxError < TOLERANCE,
    `${label}: largest nodal deviation ${maxError.toExponential(3)} at ` +
      `x = ${nodesXCoordinates[maxErrorNodeIndex]} (tolerance ${TOLERANCE})`,
  );
}

basicLog("");
basicLog("================================");
basicLog("Starting regression test for solid heat transfer in 1D with varying coefficients...");

/**
 * Case 1 - uniform heat source
 *
 * With k = 1 and Q = 1 on [0, 1] and T = 0 at both ends, div(k * grad(T)) + Q = 0 reduces
 * to T'' = -1, so T(x) = x * (1 - x) / 2. The solution is quadratic while the elements are
 * linear, so this is the case that pins the quadrature of the source term.
 */
assertMatchesAnalyticalSolution(
  "Uniform heat source, linear elements",
  runSimulation({ heatSource: 1 }, "linear", { 0: ["constantTemp", 0], 1: ["constantTemp", 0] }),
  (x) => (x * (1 - x)) / 2,
);

/**
 * Case 2 - conductivity and heat source together (method of manufactured solutions)
 *
 * Picking k(x) = 1 + x and Q = -1 makes T(x) = x an exact solution, since
 * div(k * grad(T)) + Q = d(1 + x)/dx - 1 = 0. Imposing T = 0 and T = 1 at the two ends
 * therefore has to reproduce the identity function.
 *
 * This case fails if the conductivity is evaluated anywhere other than the Gauss points,
 * so it pins down the evaluation point as well as the coefficient itself.
 */
for (const elementOrder of ["linear", "quadratic"]) {
  assertMatchesAnalyticalSolution(
    `Manufactured solution T = x, ${elementOrder} elements`,
    runSimulation({ thermalConductivity: (x) => 1 + x, heatSource: -1 }, elementOrder, {
      0: ["constantTemp", 0],
      1: ["constantTemp", 1],
    }),
    (x) => x,
  );
}

/**
 * Case 3 - the frontal assembler must agree with the matrix assembler
 *
 * `assembleHeatConductionFront` carries its own copy of the coefficient handling, so it is
 * compared against `lusolve` on a problem where both coefficients vary.
 */
{
  const coefficientFunctions = { thermalConductivity: (x) => 1 + x, heatSource: (x) => 5 * x };
  const boundaryConditions = { 0: ["constantTemp", 0], 1: ["constantTemp", 1] };

  const luResult = runSimulation(coefficientFunctions, "linear", boundaryConditions);
  const frontalResult = runSimulation(coefficientFunctions, "linear", boundaryConditions, "frontal");

  let maxDifference = 0;
  for (let nodeIndex = 0; nodeIndex < luResult.temperatures.length; nodeIndex++) {
    maxDifference = Math.max(
      maxDifference,
      Math.abs(luResult.temperatures[nodeIndex] - frontalResult.temperatures[nodeIndex]),
    );
  }

  assert(
    maxDifference < TOLERANCE,
    `Frontal assembler matches lusolve: largest difference ${maxDifference.toExponential(3)} ` +
      `(tolerance ${TOLERANCE})`,
  );
}

/**
 * Case 4 - the asynchronous path forwards the coefficients
 *
 * `solveAsync` holds a second call into `assembleHeatConductionMat`, which is easy to miss
 * when the signature changes. It cannot be driven end to end here because `jacobi-gpu`
 * needs a WebGPU compute engine, but assembly happens before the solver method is branched
 * on, so a coefficient that counts its own invocations is enough to prove the coefficients
 * reach the assembler.
 */
{
  let thermalConductivityCalls = 0;
  let heatSourceCalls = 0;

  const model = new FEAScriptModel();
  model.setModelConfig("heatConductionScript", {
    coefficientFunctions: {
      thermalConductivity: () => {
        thermalConductivityCalls++;
        return 1;
      },
      heatSource: () => {
        heatSourceCalls++;
        return 0;
      },
    },
  });
  model.setMeshConfig({ meshDimension: "1D", elementOrder: "linear", numElementsX: 8, maxX: 1 });
  model.addBoundaryCondition("0", ["constantTemp", 0]);
  model.addBoundaryCondition("1", ["constantTemp", 1]);
  model.setSolverMethod("lusolve");

  await model.solveAsync(null);

  assert(
    thermalConductivityCalls > 0 && heatSourceCalls > 0,
    `solveAsync forwards the coefficients to the assembler: thermalConductivity evaluated ` +
      `${thermalConductivityCalls} times, heatSource ${heatSourceCalls} times`,
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
