/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for the evaluation of a solution at given points (evaluateSolution)
 *
 * Covers:
 *  - Exact values for fields the elements reproduce (linear triangles, quadratic triangles and quadrilaterals)
 *  - NaN for points outside the domain and inside a hole; points on the outer boundary and on a hole edge located
 *  - A solved heat conduction problem with a linear exact solution, on a triangle mesh of a plate with a hole
 *  - The field option for results with named fields
 *  - The same values as the interpolated contour plot at its grid points
 *  - Input errors: a 1D model, points that are not an array, a point that is not a pair of finite numbers
 *
 * Run: node tests/unit/solutionEvaluation.test.js (or npm test)
 */

import { FEAScriptModel } from "../../src/FEAScript.js";
import { prepareMesh } from "../../src/mesh/meshUtils.js";
import { evaluateSolution } from "../../src/visualization/solutionEvaluation.js";
import { plotInterpolatedSolution } from "../../src/visualization/plotlyPlot.js";
import { FEAScriptError } from "../../src/utilities/errors.js";
import { basicLog, errorLog } from "../../src/utilities/logging.js";

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
basicLog("Unit tests: evaluation of a solution at points");

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

function throwsInvalidInput(callback) {
  try {
    callback();
  } catch (error) {
    return error instanceof FEAScriptError && error.code === "INVALID_INPUT";
  }
  return false;
}

const fields = {
  linear: (x, y) => 3 * x - 2 * y + 1,
  quadratic: (x, y) => x * x + x * y + y * y - 3 * x + 2 * y,
};

// Rectangle 4 x 2 with a square hole [1.5, 2.5] x [0.5, 1.5]
const plateWithHole = {
  rectangle: [4, 2],
  holes: [
    {
      name: "hole",
      points: [
        [1.5, 0.5],
        [2.5, 0.5],
        [2.5, 1.5],
        [1.5, 1.5],
      ],
    },
  ],
};

// A grid of points over [-0.5, 4.5] x [-0.5, 2.5], so that some fall outside the domain and some in the hole
const gridPoints = [];
for (let i = 0; i <= 50; i++) {
  for (let j = 0; j <= 30; j++) gridPoints.push([-0.5 + i * 0.1, -0.5 + j * 0.1]);
}
const inDomain = ([x, y]) =>
  x >= 0 && x <= 4 && y >= 0 && y <= 2 && !(x > 1.5 && x < 2.5 && y > 0.5 && y < 1.5);
// Points closer than this to the boundary are left out of the inside/outside checks (round-off of the grid)
const nearBoundary = ([x, y]) =>
  [x, x - 4, x - 1.5, x - 2.5].some((d) => Math.abs(d) < 1e-6) ||
  [y, y - 2, y - 0.5, y - 1.5].some((d) => Math.abs(d) < 1e-6);

function nodalResult(model, field) {
  const { nodesXCoordinates, nodesYCoordinates } = prepareMesh(model);
  return {
    nodesCoordinates: { nodesXCoordinates, nodesYCoordinates },
    solutionVector: Float64Array.from(nodesXCoordinates, (x, i) => field(x, nodesYCoordinates?.[i] ?? 0)),
  };
}

const cases = [
  {
    label: "linear triangles, plate with a hole",
    geometry: plateWithHole,
    meshConfig: { elements: "triangles", elementOrder: "linear", size: 0.25 },
    fieldName: "linear",
  },
  {
    label: "quadratic triangles, plate with a hole",
    geometry: plateWithHole,
    meshConfig: { elements: "triangles", elementOrder: "quadratic", size: 0.3 },
    fieldName: "quadratic",
  },
  {
    label: "quadratic quadrilaterals, rectangle",
    geometry: { rectangle: [4, 2] },
    meshConfig: { elements: "quadrilaterals", elementOrder: "quadratic", divisions: [8, 4] },
    fieldName: "quadratic",
  },
];

for (const { label, geometry, meshConfig, fieldName } of cases) {
  const field = fields[fieldName];
  const model = new FEAScriptModel();
  model.setModelConfig("heatConduction");
  model.setGeometry(geometry);
  model.setMeshConfig(meshConfig);
  const result = nodalResult(model, field);
  const hasHole = Boolean(geometry.holes);
  const isInside = hasHole ? inDomain : ([x, y]) => x >= 0 && x <= 4 && y >= 0 && y <= 2;

  const values = evaluateSolution(model, result, gridPoints);
  assert(
    values instanceof Float64Array && values.length === gridPoints.length,
    `${label}: one value per point, as a Float64Array`,
  );

  let maxError = 0;
  let wrongInside = 0;
  let wrongOutside = 0;
  gridPoints.forEach((point, pointIndex) => {
    const value = values[pointIndex];
    if (Number.isNaN(value)) {
      if (isInside(point) && !nearBoundary(point)) wrongInside++;
      return;
    }
    if (!isInside(point) && !nearBoundary(point)) wrongOutside++;
    maxError = Math.max(maxError, Math.abs(value - field(point[0], point[1])));
  });
  assert(wrongInside === 0, `${label}: every point inside the domain located (${wrongInside} missed)`);
  assert(
    wrongOutside === 0,
    `${label}: NaN for points outside the domain or in the hole (${wrongOutside} not)`,
  );
  assert(
    maxError < TOLERANCE,
    `${label}: ${fieldName} field reproduced, largest deviation ${maxError.toExponential(3)}`,
  );

  // Points on the outer boundary, its corners, and on the hole edge are inside
  const boundaryPoints = [
    [0, 0],
    [4, 2],
    [4, 1],
    [2, 0],
    ...(hasHole
      ? [
          [1.5, 1],
          [2, 1.5],
        ]
      : []),
  ];
  const boundaryValues = evaluateSolution(model, result, boundaryPoints);
  const boundaryError = Math.max(
    ...boundaryPoints.map(([x, y], i) => Math.abs(boundaryValues[i] - field(x, y))),
  );
  assert(boundaryError < TOLERANCE, `${label}: points on the boundary located and exact`);

  // The interpolated contour plot uses the same location, so it gives the same values at its grid points
  plottedTrace = null;
  plotInterpolatedSolution(model, result, "contour", "plotDiv");
  const plotPoints = plottedTrace.x.map((x, i) => [x, plottedTrace.y[i]]);
  const atPlotPoints = evaluateSolution(model, result, plotPoints);
  const samePlot = plottedTrace.z.every((plotValue, i) =>
    plotValue === null ? Number.isNaN(atPlotPoints[i]) : plotValue === atPlotPoints[i],
  );
  assert(samePlot, `${label}: same values as the interpolated contour plot`);
}

// Solved problems with 100 on the left and 0 on the right, the other sides insulated. Without the hole the exact
// temperature is 100 (1 - x / 4), which linear triangles reproduce. With the hole (insulated) there is no simple
// exact solution, but the values at the mesh nodes must be the nodal temperatures
for (const geometry of [{ rectangle: [4, 2] }, plateWithHole]) {
  const model = new FEAScriptModel();
  model.setModelConfig("heatConduction");
  model.setGeometry(geometry);
  model.setMeshConfig({ elements: "triangles", elementOrder: "linear", size: 0.25 });
  model.addBoundaryCondition("left", { type: "constantTemperature", temperature: 100 });
  model.addBoundaryCondition("right", { type: "constantTemperature", temperature: 0 });
  const result = model.solve();
  if (!geometry.holes) {
    const values = evaluateSolution(model, result, gridPoints);
    let maxError = 0;
    gridPoints.forEach(([x], i) => {
      if (!Number.isNaN(values[i])) maxError = Math.max(maxError, Math.abs(values[i] - 100 * (1 - x / 4)));
    });
    assert(
      maxError < 1e-8,
      `solved plate: exact temperature at the points, largest deviation ${maxError.toExponential(3)}`,
    );
  } else {
    const { nodesXCoordinates: xs, nodesYCoordinates: ys } = result.nodesCoordinates;
    const nodePoints = Array.from(xs, (x, i) => [x, ys[i]]);
    const values = evaluateSolution(model, result, nodePoints);
    const maxError = Math.max(
      ...Array.from(values, (value, i) => Math.abs(value - result.solutionVector[i])),
    );
    assert(
      maxError < 1e-8,
      `solved plate with a hole: nodal temperatures at the nodes, largest deviation ${maxError.toExponential(
        3,
      )}`,
    );
  }
}

// The field option picks a named field; without it the first field is used
{
  const model = new FEAScriptModel();
  model.setModelConfig("heatConduction");
  model.setGeometry({ rectangle: [4, 2] });
  model.setMeshConfig({ elements: "quadrilaterals", elementOrder: "linear", divisions: [4, 2] });
  const { nodesCoordinates } = nodalResult(model, fields.linear);
  const { nodesXCoordinates: xs, nodesYCoordinates: ys } = nodesCoordinates;
  const result = {
    nodesCoordinates,
    solutionVector: new Float64Array(xs.length),
    fields: {
      a: Float64Array.from(xs, (x, i) => x + ys[i]),
      b: Float64Array.from(xs, (x, i) => x - ys[i]),
    },
  };
  const point = [[1.3, 0.7]];
  assert(
    Math.abs(evaluateSolution(model, result, point)[0] - 2) < TOLERANCE,
    "named fields: the first field by default",
  );
  assert(
    Math.abs(evaluateSolution(model, result, point, { field: "b" })[0] - 0.6) < TOLERANCE,
    'named fields: field "b" with the field option',
  );
  assert(
    throwsInvalidInput(() => evaluateSolution(model, result, point, { field: "c" })),
    "named fields: an unknown field throws INVALID_INPUT",
  );
}

// Input errors
{
  const model = new FEAScriptModel();
  model.setModelConfig("heatConduction");
  model.setGeometry({ rectangle: [4, 2] });
  model.setMeshConfig({ elements: "quadrilaterals", divisions: [4, 2] });
  const result = nodalResult(model, fields.linear);
  assert(
    throwsInvalidInput(() => evaluateSolution(model, result, { x: [1], y: [1] })),
    "points that are not an array throw INVALID_INPUT",
  );
  assert(
    throwsInvalidInput(() => evaluateSolution(model, result, [[1, 1], [2]])),
    "a point without a y-coordinate throws INVALID_INPUT",
  );
  assert(
    throwsInvalidInput(() => evaluateSolution(model, result, [[1, NaN]])),
    "a point with a NaN coordinate throws INVALID_INPUT",
  );
  assert(evaluateSolution(model, result, []).length === 0, "no points give an empty array");

  const lineModel = new FEAScriptModel();
  lineModel.setModelConfig("heatConduction");
  lineModel.setGeometry({ line: 1 });
  lineModel.setMeshConfig({ divisions: 4 });
  const lineResult = nodalResult(lineModel, (x) => x);
  assert(
    throwsInvalidInput(() => evaluateSolution(lineModel, lineResult, [[0.5, 0]])),
    "a 1D model throws INVALID_INPUT",
  );
}

basicLog(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
