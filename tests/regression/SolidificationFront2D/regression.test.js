/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Regression test for SolidificationFront2D
 *
 * Replicates the physical setup from solidificationFront2D.js for linear and quadratic
 * quadrilaterals (structured and Gmsh meshes) and triangles (Gmsh meshes) and every applicable
 * solver method (lusolve, frontal), and asserts the value at (x=2, y=2) and the nodal mean value
 * against known good values
 *
 * Run: node tests/regression/SolidificationFront2D/regression.test.js (or npm test)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FEAScriptModel } from "../../../src/FEAScript.js";
import { importGmshMesh } from "../../../src/io/gmshReader.js";
import { basicLog, errorLog } from "../../../src/utilities/logging.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const meshesDirectory = path.join(__dirname, "../../meshes");

const EXPECTED_X = 2;
const EXPECTED_Y = 2;
const TOLERANCE = 1e-4;
const solverMethods = ["lusolve", "frontal"];

const structuredMesh = (elementOrder) => ({
  meshDimension: "2D",
  elementOrder,
  numElementsX: 12,
  numElementsY: 8,
  maxX: 4,
  maxY: 2,
});

const cases = [
  {
    label: "12 × 8 linear quadrilaterals",
    mesh: structuredMesh("linear"),
    expectedU: 1.99824,
    expectedMeanU: 0.59715,
  },
  {
    label: "12 × 8 quadratic quadrilaterals",
    mesh: structuredMesh("quadratic"),
    expectedU: 1.98119,
    expectedMeanU: 0.6286,
  },
  {
    label: "Gmsh linear quadrilaterals (rect_quad_linear.msh)",
    meshFile: "rect_quad_linear.msh",
    elementOrder: "linear",
    expectedU: 1.77785,
    expectedMeanU: 0.5303,
  },
  {
    label: "Gmsh quadratic quadrilaterals (rect_quad_quadratic.msh)",
    meshFile: "rect_quad_quadratic.msh",
    elementOrder: "quadratic",
    expectedU: 1.95905,
    expectedMeanU: 0.59014,
  },
  {
    label: "Gmsh linear triangles (rect_triang_linear.msh)",
    meshFile: "rect_triang_linear.msh",
    elementOrder: "linear",
    expectedU: 1.8921,
    expectedMeanU: 0.54573,
  },
  {
    label: "Gmsh quadratic triangles (rect_triang_quadratic.msh)",
    meshFile: "rect_triang_quadratic.msh",
    elementOrder: "quadratic",
    expectedU: 1.96578,
    expectedMeanU: 0.59833,
  },
];

async function getMeshConfig({ mesh, meshFile, elementOrder }) {
  if (mesh) return mesh;
  const meshContent = fs.readFileSync(path.join(meshesDirectory, meshFile), "utf8");
  const parsedMesh = await importGmshMesh({ text: async () => meshContent });
  return { parsedMesh, meshDimension: "2D", elementOrder };
}

function runSimulation(meshConfig, solverMethod) {
  const model = new FEAScriptModel();

  model.setModelConfig("frontPropagationScript");
  model.setMeshConfig(meshConfig);

  // Fixed bottom, left and right sides, free top side. The keys are the same for both mesh kinds:
  // structured mesh 0 bottom, 1 left, 2 top, 3 right; Gmsh meshes 0 bottom, 1 right, 2 top, 3 left
  model.addBoundaryCondition("0", ["constantValue", 0]);
  model.addBoundaryCondition("1", ["constantValue", 0]);
  model.addBoundaryCondition("2", ["zeroGradient"]);
  model.addBoundaryCondition("3", ["constantValue", 0]);
  model.setSolverMethod(solverMethod);

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

let passed = 0;
let failed = 0;

basicLog("");
basicLog("================================");
basicLog("Starting regression test for the solidification front in 2D...");

for (const testCase of cases) {
  const meshConfig = await getMeshConfig(testCase);

  for (const solverMethod of solverMethods) {
    const label = `${testCase.label}, ${solverMethod}`;
    const { solutionVector, nodesCoordinates } = runSimulation(meshConfig, solverMethod);
    const { nodesXCoordinates, nodesYCoordinates } = nodesCoordinates;
    const values = Array.from(solutionVector);

    const nodeIndex = nodesXCoordinates.findIndex(
      (x, i) => Math.abs(x - EXPECTED_X) < 1e-10 && Math.abs(nodesYCoordinates[i] - EXPECTED_Y) < 1e-10,
    );
    assert(nodeIndex !== -1, `${label}: found node at (x=${EXPECTED_X}, y=${EXPECTED_Y})`);

    const u = values[nodeIndex];
    assert(
      Math.abs(u - testCase.expectedU) < TOLERANCE,
      `${label}: value at (x=${EXPECTED_X}, y=${EXPECTED_Y}): expected ${testCase.expectedU}, got ${u} (tolerance ${TOLERANCE})`,
    );

    const meanU = values.reduce((sum, value) => sum + value, 0) / values.length;
    assert(
      Math.abs(meanU - testCase.expectedMeanU) < TOLERANCE,
      `${label}: nodal mean value: expected ${testCase.expectedMeanU}, got ${meanU} (tolerance ${TOLERANCE})`,
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
