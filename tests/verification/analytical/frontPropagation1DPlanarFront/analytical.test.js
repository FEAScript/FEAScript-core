/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Analytical test for FrontPropagation1DPlanarFront
 *
 * Guards the 1D front propagation (eikonal) assembly for linear and quadratic elements. A front
 * starting at the left boundary has the distance function u = x as exact solution. The viscous term
 * that stabilizes the eikonal equation conflicts with the zero-gradient condition at the right
 * boundary, where it bends the solution in a boundary layer whose largest deviation equals the
 * viscous coefficient (1e-2), so the nodal check uses a tolerance of 5e-2. Away from that boundary
 * the layer has decayed, so the interior is checked separately with a tight tolerance on meshes that
 * resolve it.
 *
 * Run: node tests/verification/analytical/frontPropagation1DPlanarFront/analytical.test.js (or npm test)
 */

import { FEAScriptModel } from "../../../../src/FEAScript.js";
import { basicLog, errorLog } from "../../../../src/utilities/logging.js";

const TOLERANCE = 5e-2;
const SOLVER_TOLERANCE = 1e-8;
const INTERIOR_TOLERANCE = 1e-8;
const INTERIOR_LIMIT = 1.5; // x <= 1.5 is 50 boundary layer widths away from the right boundary

function runSimulation(elementOrder, solverMethod, frontValue = 0, numElementsX = 20) {
  const model = new FEAScriptModel();

  model.setModelConfig("frontPropagationScript");
  model.setMeshConfig({ meshDimension: "1D", elementOrder, numElementsX, maxX: 2 });

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

// Interior, away from the boundary layer at the right boundary, on meshes that resolve the layer
for (const [elementOrder, numElementsX] of [
  ["linear", 80],
  ["quadratic", 40],
]) {
  const { solution, nodesXCoordinates } = runSimulation(elementOrder, "lusolve", 0, numElementsX);
  const interiorError = Math.max(
    ...solution
      .map((value, nodeIndex) => [value, nodesXCoordinates[nodeIndex]])
      .filter(([, x]) => x <= INTERIOR_LIMIT)
      .map(([value, x]) => Math.abs(value - x)),
  );
  assert(
    interiorError < INTERIOR_TOLERANCE,
    `${numElementsX} ${elementOrder} elements: u = x for x <= ${INTERIOR_LIMIT}, largest nodal deviation ${interiorError.toExponential(
      3,
    )} (tolerance ${INTERIOR_TOLERANCE})`,
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
