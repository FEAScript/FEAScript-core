/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.1 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Analytical test for FrontPropagation1DPlanarFront
 *
 * Guards the 1D front propagation (eikonal) assembly for linear and quadratic elements. A front
 * starting at the left boundary has the distance function u = x as exact solution. The viscous term
 * that stabilizes the eikonal equation shifts the solution slightly, so the tolerance is 5e-2.
 *
 * Run: node tests/verification/analytical/frontPropagation1DPlanarFront/analytical.test.js (or npm test)
 */

import { FEAScriptModel } from "../../../../src/FEAScript.js";
import { basicLog, errorLog } from "../../../../src/utilities/logging.js";

const TOLERANCE = 5e-2;
const SOLVER_TOLERANCE = 1e-8;

function runSimulation(elementOrder, solverMethod, frontValue = 0) {
  const model = new FEAScriptModel();

  model.setModelConfig("frontPropagationScript");
  model.setMeshConfig({ meshDimension: "1D", elementOrder, numElementsX: 20, maxX: 2 });

  // Front starts at the left boundary
  model.addBoundaryCondition("0", ["constantValue", frontValue]);
  model.addBoundaryCondition("1", ["zeroGradient"]);
  model.setSolverMethod(solverMethod);

  const { solutionVector, nodesCoordinates } = model.solve();
  return {
    solution: Array.from(solutionVector),
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

basicLog("");
basicLog("================================");
basicLog("Starting analytical test for front propagation in 1D (planar front)...");

for (const elementOrder of ["linear", "quadratic"]) {
  const luResult = runSimulation(elementOrder, "lusolve");
  const maxError = Math.max(
    ...luResult.solution.map((value, nodeIndex) => Math.abs(value - luResult.nodesXCoordinates[nodeIndex])),
  );
  assert(
    maxError < TOLERANCE,
    `${elementOrder} elements: u = x, largest nodal deviation ${maxError.toExponential(
      3,
    )} (tolerance ${TOLERANCE})`,
  );

  const frontalResult = runSimulation(elementOrder, "frontal");
  const solverDifference = Math.max(
    ...luResult.solution.map((value, nodeIndex) => Math.abs(value - frontalResult.solution[nodeIndex])),
  );
  assert(
    solverDifference < SOLVER_TOLERANCE,
    `${elementOrder} elements: frontal solver matches lusolve: largest difference ${solverDifference.toExponential(
      3,
    )} (tolerance ${SOLVER_TOLERANCE})`,
  );

  // A non-zero prescribed value shifts the solution: the front starts at time 1, so u = 1 + x
  for (const solverMethod of ["lusolve", "frontal"]) {
    const shiftedResult = runSimulation(elementOrder, solverMethod, 1);
    const shiftedError = Math.max(
      ...shiftedResult.solution.map((value, nodeIndex) =>
        Math.abs(value - (1 + shiftedResult.nodesXCoordinates[nodeIndex])),
      ),
    );
    assert(
      shiftedError < TOLERANCE,
      `${elementOrder} elements, ${solverMethod}: u(0) = 1 gives u = 1 + x, largest nodal deviation ${shiftedError.toExponential(
        3,
      )} (tolerance ${TOLERANCE})`,
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
