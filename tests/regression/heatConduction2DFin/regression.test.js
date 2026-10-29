/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Regression test for HeatConduction2DFin
 *
 * Replicates the physical setup from heatConduction2DFin.js (structured mesh) and
 * heatConduction2DFinGmsh.js (Gmsh meshes) for linear and quadratic quadrilaterals and triangles
 * and every applicable solver method (lusolve, frontal, jacobi)
 *
 * Covers:
 *  - Temperature at (x=0, y=2) and nodal mean temperature against known good values
 *  - Patch test on the Gmsh meshes: 1D conduction with convection, reproduced exactly (T = 200 - 60y)
 *    by the direct solvers
 *
 * Run: node tests/regression/heatConduction2DFin/regression.test.js (or npm test)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FEAScriptModel } from "../../../src/FEAScript.js";
import { importGmshMesh } from "../../../src/io/gmshReader.js";
import { basicLog, errorLog } from "../../../src/utilities/logging.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const meshesDirectory = path.join(__dirname, "../../meshes");

const EXPECTED_X = 0;
const EXPECTED_Y = 2;
const TOLERANCE = 1e-4;
const PATCH_TOLERANCE = 1e-10;

// Structured mesh boundaries: 0 bottom, 1 left, 2 top, 3 right
const structuredBoundaryConditions = {
  0: ["constantTemperature", 200],
  1: ["symmetry"],
  2: ["convection", 1, 20],
  3: ["constantTemperature", 200],
};

// Gmsh physical tags: 1 bottom, 2 right, 3 top, 4 left (stored as boundary keys 0-3)
const gmshBoundaryConditions = {
  0: ["constantTemperature", 200],
  1: ["constantTemperature", 200],
  2: ["convection", 1, 20],
  3: ["symmetry"],
};

// Patch test (Gmsh meshes): insulated sides give 1D conduction with T(0) = 200 and -dT/dy = h (T - T∞)
// at y = 2. The exact solution T = 200 - 60y is linear, so every element type must reproduce it
const patchBoundaryConditions = {
  0: ["constantTemperature", 200],
  1: ["symmetry"],
  2: ["convection", 1, 20],
  3: ["symmetry"],
};

const structuredMesh = (elementOrder) => ({
  meshDimension: "2D",
  elementOrder,
  numElementsX: 8,
  numElementsY: 4,
  maxX: 4,
  maxY: 2,
});

// The Jacobi method requires diagonally dominant matrices, so it is used with linear elements only,
// and not with the distorted elements of the Gmsh linear quadrilateral mesh
const cases = [
  {
    label: "8 × 4 linear quadrilaterals",
    mesh: structuredMesh("linear"),
    solverMethods: ["lusolve", "frontal", "jacobi"],
    expectedT: 82.07057,
    expectedMeanT: 154.20475,
  },
  {
    label: "8 × 4 quadratic quadrilaterals",
    mesh: structuredMesh("quadratic"),
    solverMethods: ["lusolve", "frontal"],
    expectedT: 81.31873,
    expectedMeanT: 153.8364,
  },
  {
    label: "Gmsh linear quadrilaterals (rect_quad_linear.msh)",
    meshFile: "rect_quad_linear.msh",
    elementOrder: "linear",
    solverMethods: ["lusolve", "frontal"],
    expectedT: 83.1378,
    expectedMeanT: 155.41548,
  },
  {
    label: "Gmsh quadratic quadrilaterals (rect_quad_quadratic.msh)",
    meshFile: "rect_quad_quadratic.msh",
    elementOrder: "quadratic",
    solverMethods: ["lusolve", "frontal"],
    expectedT: 81.32071,
    expectedMeanT: 154.97068,
  },
  {
    label: "Gmsh linear triangles (rect_triang_linear.msh)",
    meshFile: "rect_triang_linear.msh",
    elementOrder: "linear",
    solverMethods: ["lusolve", "frontal", "jacobi"],
    expectedT: 81.19625,
    expectedMeanT: 154.83616,
  },
  {
    label: "Gmsh quadratic triangles (rect_triang_quadratic.msh)",
    meshFile: "rect_triang_quadratic.msh",
    elementOrder: "quadratic",
    solverMethods: ["lusolve", "frontal"],
    expectedT: 81.32257,
    expectedMeanT: 154.05011,
  },
];

async function getMeshConfig({ mesh, meshFile, elementOrder }) {
  if (mesh) return mesh;
  const meshContent = fs.readFileSync(path.join(meshesDirectory, meshFile), "utf8");
  const parsedMesh = await importGmshMesh({ text: async () => meshContent });
  return { parsedMesh, meshDimension: "2D", elementOrder };
}

function runSimulation(meshConfig, boundaryConditions, solverMethod) {
  const model = new FEAScriptModel();

  model.setModelConfig("heatConductionScript");
  model.setMeshConfig(meshConfig);
  Object.entries(boundaryConditions).forEach(([boundaryKey, condition]) => {
    model.addBoundaryCondition(boundaryKey, condition);
  });
  model.setSolverMethod(solverMethod);

  const { solutionVector, nodesCoordinates } = model.solve({ maxIterations: 200000, tolerance: 1e-8 });

  return {
    temperatures: Array.from(solutionVector),
    nodesXCoordinates: nodesCoordinates.nodesXCoordinates,
    nodesYCoordinates: nodesCoordinates.nodesYCoordinates,
  };
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
basicLog("Starting regression test for solid heat transfer in a 2D fin...");

for (const testCase of cases) {
  const meshConfig = await getMeshConfig(testCase);
  const boundaryConditions = testCase.mesh ? structuredBoundaryConditions : gmshBoundaryConditions;

  for (const solverMethod of testCase.solverMethods) {
    const label = `${testCase.label}, ${solverMethod}`;
    const { temperatures, nodesXCoordinates, nodesYCoordinates } = runSimulation(
      meshConfig,
      boundaryConditions,
      solverMethod,
    );

    // Locate the node at (x=0, y=2) by searching coordinates.
    // This is robust against changes in mesh ordering conventions.
    const nodeIndex = nodesXCoordinates.findIndex(
      (x, i) => Math.abs(x - EXPECTED_X) < 1e-10 && Math.abs(nodesYCoordinates[i] - EXPECTED_Y) < 1e-10,
    );
    assert(nodeIndex !== -1, `${label}: found node at (x=${EXPECTED_X}, y=${EXPECTED_Y})`);

    const T = temperatures[nodeIndex];
    assert(
      Math.abs(T - testCase.expectedT) < TOLERANCE,
      `${label}: temperature at (x=${EXPECTED_X}, y=${EXPECTED_Y}): expected ${testCase.expectedT}, got ${T} (tolerance ${TOLERANCE})`,
    );

    const meanT = temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length;
    assert(
      Math.abs(meanT - testCase.expectedMeanT) < TOLERANCE,
      `${label}: nodal mean temperature: expected ${testCase.expectedMeanT}, got ${meanT} (tolerance ${TOLERANCE})`,
    );
  }

  // Patch test with the direct solvers on the Gmsh meshes
  if (testCase.meshFile) {
    for (const solverMethod of ["lusolve", "frontal"]) {
      const { temperatures, nodesYCoordinates } = runSimulation(
        meshConfig,
        patchBoundaryConditions,
        solverMethod,
      );
      const patchError = Math.max(
        ...temperatures.map((value, i) => Math.abs(value - (200 - 60 * nodesYCoordinates[i]))),
      );
      assert(
        patchError < PATCH_TOLERANCE,
        `${testCase.label}, ${solverMethod}: patch test, largest nodal deviation ${patchError.toExponential(
          3,
        )} (tolerance ${PATCH_TOLERANCE})`,
      );
    }
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
