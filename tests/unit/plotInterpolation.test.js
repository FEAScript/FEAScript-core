/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for the interpolated contour plot (plotInterpolatedSolution)
 *
 * Covers (linear and quadratic quadrilaterals, structured and Gmsh, and triangles):
 *  - Point location on the visualization grid (adjacency search and natural coordinates)
 *  - Interpolation of the nodal values with the element basis functions
 *  - Quadratic elements with curved edges (Gmsh meshes of a rectangle with a circular hole), where the
 *    natural coordinates come from the full quadratic mapping of the element, not from its corner nodes
 *
 * Nodal values are set from a field that the element basis functions reproduce exactly
 * (linear field for linear elements, quadratic field for straight-sided quadratic elements), so every grid
 * point inside the domain must match the field to round-off. An element with curved edges maps its reference
 * element with quadratic functions, so it reproduces linear fields exactly but not quadratic ones: the curved
 * meshes are checked with the linear field
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

// Rectangle 4 x 2 with a hole of radius 0.5 at (2, 1). The quadratic element edges only approximate the arc, so
// grid points within a small band around it may fall outside the mesh; every point beyond that band must be located
const holeCentre = [2, 1];
const holeRadius = 0.5;
const outsideHoleBand = (x, y) => Math.hypot(x - holeCentre[0], y - holeCentre[1]) > holeRadius + 0.01;

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
  {
    label: "Gmsh quadratic quadrilaterals with curved edges (rectangle with a hole)",
    meshConfig: { elementOrder: "quadratic", mesh: await loadGmshMesh("rect_with_hole_quad_quadratic.msh") },
    fieldName: "linear",
    mustBeLocated: outsideHoleBand,
  },
  {
    label: "quadratic triangles with curved edges (rectangle with a hole)",
    meshConfig: {
      elementOrder: "quadratic",
      mesh: await loadGmshMesh("rect_with_hole_triang_quadratic.msh"),
    },
    fieldName: "linear",
    mustBeLocated: outsideHoleBand,
  },
];

for (const { label, meshConfig, fieldName = meshConfig.elementOrder, mustBeLocated } of cases) {
  const field = fields[fieldName];
  const model = new FEAScriptModel();
  model.setModelConfig("heatConduction");
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
  let requiredPoints = 0;
  let missedPoints = 0;
  let maxError = 0;
  plottedTrace.z.forEach((value, visNodeIndex) => {
    const x = plottedTrace.x[visNodeIndex];
    const y = plottedTrace.y[visNodeIndex];
    // Without a predicate the domain is a rectangle, so every grid point, including those on its edges, must get a value
    const required = mustBeLocated ? mustBeLocated(x, y) : true;
    if (required) requiredPoints++;
    if (value === null) {
      if (required) missedPoints++;
      return;
    }
    insidePoints++;
    maxError = Math.max(maxError, Math.abs(value - field(x, y)));
  });

  assert(
    missedPoints === 0,
    `${label}: ${
      requiredPoints - missedPoints
    } of ${requiredPoints} grid points inside the domain located (${insidePoints} in all)`,
  );
  assert(
    maxError < TOLERANCE,
    `${label}: interpolated ${fieldName} field, largest deviation ${maxError.toExponential(
      3,
    )} (tolerance ${TOLERANCE})`,
  );
}

// Model information in the form of FEAScript 0.3, as built by hand for the plots (FEAScript Studio did this),
// still plots the same values, with a deprecation warning
{
  const field = fields.quadratic;
  const model = new FEAScriptModel();
  model.setModelConfig("heatConduction");
  setMeshSource(model, structuredMesh("quadratic"));
  const { nodesXCoordinates, nodesYCoordinates } = prepareMesh(model);
  const result = {
    nodesCoordinates: { nodesXCoordinates, nodesYCoordinates },
    solutionVector: nodesXCoordinates.map((x, nodeIndex) => field(x, nodesYCoordinates[nodeIndex])),
  };
  plotInterpolatedSolution(model, result, "contour", "plotDiv");
  const reference = plottedTrace.z;

  const gmshMesh = await loadGmshMesh("rect_quad_quadratic.msh");
  const gmshModel = new FEAScriptModel();
  gmshModel.setModelConfig("heatConduction");
  gmshModel.setMesh(gmshMesh);
  const gmshData = prepareMesh(gmshModel);
  const gmshResult = {
    nodesCoordinates: {
      nodesXCoordinates: gmshData.nodesXCoordinates,
      nodesYCoordinates: gmshData.nodesYCoordinates,
    },
    solutionVector: gmshData.nodesXCoordinates.map((x, i) => field(x, gmshData.nodesYCoordinates[i])),
  };
  plotInterpolatedSolution(gmshModel, gmshResult, "contour", "plotDiv");
  const gmshReference = plottedTrace.z;

  const warnings = [];
  const { log } = console;
  console.log = (message, ...rest) => {
    if (typeof message === "string" && message.includes("deprecated")) warnings.push(message);
    else log(message, ...rest);
  };
  try {
    const oldStructured = {
      solverConfig: "heatConductionScript",
      meshConfig: {
        meshDimension: "2D",
        elementOrder: "quadratic",
        numElementsX: 8,
        numElementsY: 4,
        maxX: 4,
        maxY: 2,
      },
    };
    plotInterpolatedSolution(oldStructured, result, "contour", "plotDiv");
    const structuredSame = plottedTrace.z.every((value, i) => value === reference[i]);
    const oldImported = {
      solverConfig: "heatConductionScript",
      meshConfig: { parsedMesh: gmshMesh, meshDimension: "2D", elementOrder: "quadratic" },
    };
    plotInterpolatedSolution(oldImported, gmshResult, "contour", "plotDiv");
    const importedSame = plottedTrace.z.every((value, i) => value === gmshReference[i]);
    assert(structuredSame, "model information with the 0.3 mesh settings plots the same values");
    assert(importedSame, "model information with meshConfig.parsedMesh plots the same values");
    assert(
      warnings.some((m) => m.includes("Model information with the mesh settings of FEAScript 0.3")),
      "model information in the 0.3 form gives a deprecation warning",
    );
  } finally {
    console.log = log;
  }
}

basicLog(`Interpolated contour plot tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
