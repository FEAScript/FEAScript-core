/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Regression test for LidDrivenCavity2DCreepingFlow
 *
 * Replicates the physical setup from lidDrivenCavity2DCreepingFlow.js with Q2-Q1 quadrilaterals
 * (structured and Gmsh meshes) and P2-P1 triangles (Gmsh mesh), and asserts the strongest return
 * flow (minimum x-velocity), the nodal mean x-velocity and y-velocity and the number of pressure
 * nodes against known good values
 *
 * Run: node tests/regression/lidDrivenCavity2DCreepingFlow/regression.test.js (or npm test)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FEAScriptModel } from "../../../src/FEAScript.js";
import { importGmshMesh } from "../../../src/io/gmshReader.js";
import { basicLog, errorLog } from "../../../src/utilities/logging.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const meshesDirectory = path.join(__dirname, "../../meshes");

const TOLERANCE = 1e-4;

// The lid is the top boundary, key 2 for both the structured and the Gmsh meshes
const LID_BOUNDARY_KEY = "2";

const cases = [
  {
    label: "12 × 6 Q2-Q1 quadrilaterals",
    mesh: {
      meshDimension: "2D",
      elementOrder: "quadratic",
      numElementsX: 12,
      numElementsY: 6,
      maxX: 4,
      maxY: 2,
    },
    expectedMinU: -0.32956,
    expectedMeanU: 0.04266,
    expectedMeanV: -0.01122,
    expectedPressureNodes: 91,
  },
  {
    label: "Gmsh Q2-Q1 quadrilaterals (rect_quad_quadratic.msh)",
    meshFile: "rect_quad_quadratic.msh",
    expectedMinU: -0.26737,
    expectedMeanU: 0.0561,
    expectedMeanV: 0.00276,
    expectedPressureNodes: 41,
  },
  {
    label: "Gmsh P2-P1 triangles (rect_triang_quadratic.msh)",
    meshFile: "rect_triang_quadratic.msh",
    expectedMinU: -0.31934,
    expectedMeanU: 0.05782,
    expectedMeanV: 0.0115,
    expectedPressureNodes: 35,
  },
];

async function getMeshConfig({ mesh, meshFile }) {
  if (mesh) return mesh;
  const meshContent = fs.readFileSync(path.join(meshesDirectory, meshFile), "utf8");
  const parsedMesh = await importGmshMesh({ text: async () => meshContent });
  return { parsedMesh, meshDimension: "2D", elementOrder: "quadratic" };
}

function runSimulation(meshConfig) {
  const model = new FEAScriptModel();

  model.setModelConfig("creepingFlowScript");
  model.setMeshConfig(meshConfig);
  ["0", "1", "2", "3"].forEach((boundaryKey) => {
    model.addBoundaryCondition(
      boundaryKey,
      boundaryKey === LID_BOUNDARY_KEY ? ["constantVelocity", 1, 0] : ["constantVelocity", 0, 0],
    );
  });
  model.setSolverMethod("lusolve");

  return model.solve();
}

function assert(condition, message) {
  if (!condition) {
    errorLog(`FAIL: ${message}`);
    failed++;
  } else {
    basicLog(`PASS: ${message}`);
    passed++;
  }
}

function checkValue(label, name, actual, expected) {
  assert(
    Math.abs(actual - expected) < TOLERANCE,
    `${label}: ${name}: expected ${expected}, got ${actual} (tolerance ${TOLERANCE})`,
  );
}

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

let passed = 0;
let failed = 0;

basicLog("");
basicLog("================================");
basicLog("Starting regression test for the lid-driven cavity creeping flow in 2D...");

for (const testCase of cases) {
  const { label } = testCase;
  const { solutionVector, nodesCoordinates, fields } = runSimulation(await getMeshConfig(testCase));

  // DOF ordering: [u_0 … u_{N-1}, v_0 … v_{N-1}, p_0 … p_{M-1}]
  const solution = Array.from(solutionVector);
  const totalNodesVelocity = nodesCoordinates.nodesXCoordinates.length;
  const xVelocities = solution.slice(0, totalNodesVelocity);
  const yVelocities = solution.slice(totalNodesVelocity, 2 * totalNodesVelocity);

  checkValue(label, "minimum u (return flow)", Math.min(...xVelocities), testCase.expectedMinU);
  checkValue(label, "nodal mean u", mean(xVelocities), testCase.expectedMeanU);
  checkValue(label, "nodal mean v", mean(yVelocities), testCase.expectedMeanV);

  const pressureNodes = solution.length - 2 * totalNodesVelocity;
  assert(
    pressureNodes === testCase.expectedPressureNodes,
    `${label}: number of pressure nodes: expected ${testCase.expectedPressureNodes}, got ${pressureNodes}`,
  );

  // Named fields (one value per mesh node) match the solution vector
  const fieldsMatch =
    fields.u.every((u, i) => u === xVelocities[i]) &&
    fields.v.every((v, i) => v === yVelocities[i]) &&
    fields.velocityMagnitude.every(
      (magnitude, i) => magnitude === Math.hypot(xVelocities[i], yVelocities[i]),
    );
  assert(fieldsMatch, `${label}: fields u, v and velocityMagnitude match the solution vector`);
  const solvedPressures = new Set(solution.slice(2 * totalNodesVelocity));
  const pressureNodesInField = Array.from(fields.p).filter((p) => solvedPressures.has(p)).length;
  assert(
    fields.p.length === totalNodesVelocity &&
      fields.p.every(Number.isFinite) &&
      pressureNodesInField >= testCase.expectedPressureNodes,
    `${label}: field p has a finite value at every node and holds the solved corner pressures`,
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
