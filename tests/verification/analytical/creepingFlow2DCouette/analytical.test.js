/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Analytical test for CreepingFlow2DCouette
 *
 * Guards the Taylor-Hood creeping flow assembly on both element shapes: Q2-Q1 quadrilaterals
 * (structured mesh) and P2-P1 triangles (Gmsh mesh). Couette flow has a linear velocity profile
 * and zero pressure, which both element pairs reproduce exactly, so the tolerance can be 1e-10.
 *
 * Run: node tests/verification/analytical/creepingFlow2DCouette/analytical.test.js (or npm test)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FEAScriptModel } from "../../../../src/FEAScript.js";
import { importGmshMesh } from "../../../../src/io/gmshReader.js";
import { basicLog, errorLog } from "../../../../src/utilities/logging.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const meshesDirectory = path.join(__dirname, "../../../meshes");

const TOLERANCE = 1e-10;
const LID_VELOCITY = 1;
const HEIGHT = 2;

// A mesh source is either a geometry with its mesh configuration, or a mesh object (e.g. imported from Gmsh)
function setMeshSource(model, source) {
  if (source.mesh) {
    model.setMesh(source.mesh);
  } else {
    model.setGeometry(source.geometry);
    model.setMeshConfig(source.meshConfig);
  }
}

async function runSimulation(meshSource, boundaryConditions) {
  const model = new FEAScriptModel();

  model.setModelConfig("creepingFlow", { solver: { method: "lusolve" } });
  setMeshSource(model, meshSource);
  Object.entries(boundaryConditions).forEach(([boundaryKey, condition]) => {
    model.addBoundaryCondition(boundaryKey, condition);
  });

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

function checkCouette(label, { solution, nodesYCoordinates }) {
  // DOF ordering: [u_0 … u_{N-1}, v_0 … v_{N-1}, p_0 … p_{M-1}]
  const totalNodesVelocity = nodesYCoordinates.length;
  let maxErrorU = 0;
  let maxErrorV = 0;
  let maxErrorP = 0;
  for (let nodeIndex = 0; nodeIndex < totalNodesVelocity; nodeIndex++) {
    const exactU = (LID_VELOCITY * nodesYCoordinates[nodeIndex]) / HEIGHT;
    maxErrorU = Math.max(maxErrorU, Math.abs(solution[nodeIndex] - exactU));
    maxErrorV = Math.max(maxErrorV, Math.abs(solution[totalNodesVelocity + nodeIndex]));
  }
  for (let dofIndex = 2 * totalNodesVelocity; dofIndex < solution.length; dofIndex++) {
    maxErrorP = Math.max(maxErrorP, Math.abs(solution[dofIndex]));
  }

  assert(
    maxErrorU < TOLERANCE,
    `${label}: u = y / ${HEIGHT}, largest nodal deviation ${maxErrorU.toExponential(
      3,
    )} (tolerance ${TOLERANCE})`,
  );
  assert(
    maxErrorV < TOLERANCE,
    `${label}: v = 0, largest nodal deviation ${maxErrorV.toExponential(3)} (tolerance ${TOLERANCE})`,
  );
  assert(
    maxErrorP < TOLERANCE,
    `${label}: p = 0, largest nodal deviation ${maxErrorP.toExponential(3)} (tolerance ${TOLERANCE})`,
  );
}

basicLog("");
basicLog("================================");
basicLog("Starting analytical test for creeping flow in 2D (Couette flow)...");

const boundaryConditions = {
  bottom: { type: "constantVelocity", u: 0, v: 0 },
  left: { type: "stressFree" },
  top: { type: "constantVelocity", u: LID_VELOCITY, v: 0 },
  right: { type: "stressFree" },
};

// Q2-Q1 quadrilaterals (structured mesh)
checkCouette(
  "Q2-Q1 quadrilaterals",
  await runSimulation(
    {
      geometry: { rectangle: [4, HEIGHT] },
      meshConfig: { elements: "quadrilaterals", elementOrder: "quadratic", divisions: [4, 2] },
    },
    boundaryConditions,
  ),
);

// Gmsh meshes (physical groups bottom, right, top, left)
for (const [label, meshFile] of [
  ["Gmsh Q2-Q1 quadrilaterals", "rect_quad_quadratic.msh"],
  ["Gmsh P2-P1 triangles", "rect_triang_quadratic.msh"],
]) {
  const meshContent = fs.readFileSync(path.join(meshesDirectory, meshFile), "utf8");
  const mesh = await importGmshMesh({ text: async () => meshContent });
  checkCouette(label, await runSimulation({ mesh }, boundaryConditions));
}

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
