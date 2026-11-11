/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for the interpolated contour plot (plotInterpolatedSolution)
 *
 * Covers (linear and quadratic quadrilaterals, structured and Gmsh, and triangles):
 *  - Point location on the visualization grid (adjacency search and natural coordinates)
 *  - Interpolation of the nodal values with the element basis functions
 *
 * Nodal values are set from a field that the element basis functions reproduce exactly
 * (linear field for linear elements, quadratic field for quadratic elements), so every grid
 * point inside the domain must match the field to round-off
 *
 * Run: node tests/unit/plotInterpolation.test.js (or npm test)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prepareMesh } from "../../src/mesh/meshUtils.js";
import { FEAScriptModel } from "../../src/FEAScript.js";
import { importGmshMesh } from "../../src/io/gmshReader.js";
import { plotInterpolatedSolution } from "../../src/visualization/plotlyPlot.js";
import { basicLog, errorLog } from "../../src/utilities/logging.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const meshesDirectory = path.join(__dirname, "../meshes");

const TOLERANCE = 1e-10;

// Minimal browser stubs: capture the trace passed to Plotly instead of rendering it
let plottedTrace = null;
globalThis.window = { innerWidth: 700 };
globalThis.Plotly = {
  newPlot: (plotDivId, data) => {
    plottedTrace = data[0];
  },
};

basicLog("");
basicLog("================================");
basicLog("Unit tests: interpolated contour plot");

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

const fields = {
  linear: (x, y) => 3 * x - 2 * y + 1,
  quadratic: (x, y) => x * x + x * y + y * y - 3 * x + 2 * y,
};

async function loadGmshMesh(fileName) {
  const meshContent = fs.readFileSync(path.join(meshesDirectory, fileName), "utf8");
  return importGmshMesh({ text: async () => meshContent });
}

const structuredMesh = (elementOrder) => ({
  elementOrder,
  geometry: { rectangle: [4, 2] },
  meshConfig: { elements: "quadrilaterals", elementOrder, divisions: [8, 4] },
});

// A mesh source is either a geometry with its mesh configuration, or a mesh object (e.g. imported from Gmsh)
function setMeshSource(model, source) {
  if (source.mesh) {
    model.setMesh(source.mesh);
  } else {
    model.setGeometry(source.geometry);
    model.setMeshConfig(source.meshConfig);
  }
}

const cases = [
  { label: "linear quadrilaterals", meshConfig: structuredMesh("linear") },
  { label: "quadratic quadrilaterals", meshConfig: structuredMesh("quadratic") },
  {
    label: "Gmsh linear quadrilaterals",
    meshConfig: { elementOrder: "linear", mesh: await loadGmshMesh("rect_quad_linear.msh") },
  },
  {
    label: "Gmsh quadratic quadrilaterals",
    meshConfig: { elementOrder: "quadratic", mesh: await loadGmshMesh("rect_quad_quadratic.msh") },
  },
  {
    label: "linear triangles",
    meshConfig: { elementOrder: "linear", mesh: await loadGmshMesh("rect_triang_linear.msh") },
  },
  {
    label: "quadratic triangles",
    meshConfig: { elementOrder: "quadratic", mesh: await loadGmshMesh("rect_triang_quadratic.msh") },
  },
];

for (const { label, meshConfig } of cases) {
  const field = fields[meshConfig.elementOrder];
  const model = new FEAScriptModel();
  model.setModelConfig("heatConductionScript");
  setMeshSource(model, meshConfig);
  const { nodesXCoordinates, nodesYCoordinates } = prepareMesh(model);
  const result = {
    nodesCoordinates: { nodesXCoordinates, nodesYCoordinates },
    solutionVector: nodesXCoordinates.map((x, nodeIndex) => field(x, nodesYCoordinates[nodeIndex])),
  };

  plottedTrace = null;
  plotInterpolatedSolution(model, result, "contour", "plotDiv");
  assert(plottedTrace !== null, `${label}: contour trace passed to Plotly`);

  let insidePoints = 0;
  let maxError = 0;
  plottedTrace.z.forEach((value, visNodeIndex) => {
    if (value === null) return;
    insidePoints++;
    const exact = field(plottedTrace.x[visNodeIndex], plottedTrace.y[visNodeIndex]);
    maxError = Math.max(maxError, Math.abs(value - exact));
  });

  // The domain is a rectangle, so every grid point, including those on its edges, must get a value
  assert(
    insidePoints === plottedTrace.z.length,
    `${label}: ${insidePoints} of ${plottedTrace.z.length} grid points located inside the mesh`,
  );
  assert(
    maxError < TOLERANCE,
    `${label}: interpolated ${meshConfig.elementOrder} field, largest deviation ${maxError.toExponential(
      3,
    )} (tolerance ${TOLERANCE})`,
  );
}

basicLog(`Interpolated contour plot tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
