/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Analytical test for FrontPropagation2DPlanarFront
 *
 * Guards the front propagation (eikonal) assembly on quadrilaterals (structured and Gmsh meshes)
 * and on triangles (Gmsh meshes), for linear and quadratic elements. A planar front starting at the bottom boundary
 * has the distance function u = y as exact solution. The viscous term that stabilizes the
 * eikonal equation conflicts with the zero-gradient condition at the top boundary, where it bends the
 * solution in a boundary layer whose largest deviation is close to the viscous coefficient, so the nodal
 * check uses a tolerance of 5e-2 (1.5e-1 for the coarse Gmsh linear quadrilaterals, where the
 * element-size-scaled viscous term is largest). Away from the top boundary the layer has decayed, so
 * the interior is checked separately with a tight tolerance on a mesh that resolves it.
 *
 * Run: node tests/verification/analytical/frontPropagation2DPlanarFront/analytical.test.js (or npm test)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FEAScriptModel } from "../../../../src/FEAScript.js";
import { importGmshMesh } from "../../../../src/io/gmshReader.js";
import { basicLog, errorLog } from "../../../../src/utilities/logging.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const meshesDirectory = path.join(__dirname, "../../../meshes");

// The coarse Gmsh linear quadrilaterals have the largest viscous term (it scales with the element size)
const TOLERANCE = 5e-2;
const COARSE_MESH_TOLERANCE = 1.5e-1;
const SOLVER_TOLERANCE = 1e-8;
const INTERIOR_TOLERANCE = 1e-5;
const INTERIOR_LIMIT = 1.5; // y <= 1.5 is 50 boundary layer widths away from the top boundary

// A mesh source is either a geometry with its mesh configuration, or a mesh object (e.g. imported from Gmsh)
function setMeshSource(model, source) {
  if (source.mesh) {
    model.setMesh(source.mesh);
  } else {
    model.setGeometry(source.geometry);
    model.setMeshConfig(source.meshConfig);
  }
}

function runSimulation(meshSource, solverMethod) {
  const model = new FEAScriptModel();

  model.setModelConfig("frontPropagation", { solver: { method: solverMethod } });
  setMeshSource(model, meshSource);

  // Front starts at the bottom boundary
  model.addBoundaryCondition("bottom", { type: "constantValue", value: 0 });
  model.addBoundaryCondition("left", { type: "zeroGradient" });
  model.addBoundaryCondition("top", { type: "zeroGradient" });
  model.addBoundaryCondition("right", { type: "zeroGradient" });

  const { solutionVector, nodesCoordinates } = model.solve();
  return {
    solution: Array.from(solutionVector),
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

async function loadGmshMesh(fileName) {
  const meshContent = fs.readFileSync(path.join(meshesDirectory, fileName), "utf8");
  return importGmshMesh({ text: async () => meshContent });
}

basicLog("");
basicLog("================================");
basicLog("Starting analytical test for front propagation in 2D (planar front)...");

const cases = [
  {
    label: "Quadrilaterals, linear",
    meshConfig: {
      geometry: { rectangle: [4, 2] },
      meshConfig: { elements: "quadrilaterals", elementOrder: "linear", divisions: [12, 8] },
    },
  },
  {
    label: "Gmsh quadrilaterals, linear",
    tolerance: COARSE_MESH_TOLERANCE,
    meshConfig: { mesh: await loadGmshMesh("rect_quad_linear.msh") },
  },
  {
    label: "Gmsh quadrilaterals, quadratic",
    meshConfig: { mesh: await loadGmshMesh("rect_quad_quadratic.msh") },
  },
  {
    label: "Triangles, linear",
    meshConfig: { mesh: await loadGmshMesh("rect_triang_linear.msh") },
  },
  {
    label: "Triangles, quadratic",
    meshConfig: { mesh: await loadGmshMesh("rect_triang_quadratic.msh") },
  },
];

for (const { label, meshConfig, tolerance = TOLERANCE } of cases) {
  const luResult = runSimulation(meshConfig, "lusolve");
  const maxError = Math.max(
    ...luResult.solution.map((value, nodeIndex) => Math.abs(value - luResult.nodesYCoordinates[nodeIndex])),
  );
  assert(
    maxError < tolerance,
    `${label}: u = y, largest nodal deviation ${maxError.toExponential(3)} (tolerance ${tolerance})`,
  );

  const frontalResult = runSimulation(meshConfig, "frontal");
  const solverDifference = Math.max(
    ...luResult.solution.map((value, nodeIndex) => Math.abs(value - frontalResult.solution[nodeIndex])),
  );
  assert(
    solverDifference < SOLVER_TOLERANCE,
    `${label}: frontal solver matches lusolve: largest difference ${solverDifference.toExponential(
      3,
    )} (tolerance ${SOLVER_TOLERANCE})`,
  );
}

// Interior, away from the boundary layer at the top boundary, on a mesh that resolves the layer
const { solution, nodesYCoordinates } = runSimulation(
  {
    geometry: { rectangle: [4, 2] },
    meshConfig: { elements: "quadrilaterals", elementOrder: "linear", divisions: [80, 40] },
  },
  "lusolve",
);
const interiorError = Math.max(
  ...solution
    .map((value, nodeIndex) => [value, nodesYCoordinates[nodeIndex]])
    .filter(([, y]) => y <= INTERIOR_LIMIT)
    .map(([value, y]) => Math.abs(value - y)),
);
assert(
  interiorError < INTERIOR_TOLERANCE,
  `Quadrilaterals, linear, 80 x 40: u = y for y <= ${INTERIOR_LIMIT}, largest nodal deviation ${interiorError.toExponential(
    3,
  )} (tolerance ${INTERIOR_TOLERANCE.toExponential(0)})`,
);

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
