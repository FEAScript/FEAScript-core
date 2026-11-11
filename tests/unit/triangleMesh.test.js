/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for generateTriangleMesh, the Delaunay refinement mesh generator:
 *  - Output: a mesh object (the form of setMesh), with the boundaries keyed by their names
 *  - Quality: every element has angles of at least minAngle and an area of at most that of the equilateral
 *    triangle of side `size` (a number, or a function of position), and the elements cover the domain
 *  - Boundaries: the element sides on each named boundary lie on the input edges of that name and add up to
 *    their length, and the boundary sides are exactly the element sides with one element
 *  - Quadratic elements: the middle nodes are at the middle of the edges and shared between elements
 *  - Holes: no element inside a hole, and the area of the mesh is the polygon area minus the holes
 *  - Points: embedded points become nodes; a point on an edge splits it
 *  - Small input angles: the refinement ends, and away from the corner the angle target holds
 *  - Solve: heat conduction with a linear exact solution is reproduced at every node, on linear and
 *    quadratic elements, with the boundary conditions keyed by name
 *  - Errors: a polygon that is not simple, a hole outside the shape or inside another hole, a point outside
 *    the domain, boundaries that do not chain, a setting out of range (INVALID_INPUT), and the node limit
 *    (MESH_TOO_FINE)
 *
 * Run: node tests/unit/triangleMesh.test.js (or npm test)
 */

import { getBoundarySides } from "../../src/elements/basisFunctions.js";
import { FEAScriptModel } from "../../src/FEAScript.js";
import { generateTriangleMesh } from "../../src/mesh/triangleMesh.js";
import { FEAScriptError } from "../../src/utilities/errors.js";
import { basicLog, errorLog } from "../../src/utilities/logging.js";

basicLog("");
basicLog("================================");
basicLog("Unit tests: triangle mesh generator");

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

// ───────────────────────────── Helpers ─────────────────────────────

const coordinates = (mesh, node) => [mesh.nodesXCoordinates[node - 1], mesh.nodesYCoordinates[node - 1]];
const distance = ([ax, ay], [bx, by]) => Math.hypot(ax - bx, ay - by);
const areaOfSide = (side) => (Math.sqrt(3) / 4) * side * side;
const polygonArea = (points) =>
  Math.abs(
    points.reduce(
      (sum, [x, y], i) =>
        sum + x * points[(i + 1) % points.length][1] - points[(i + 1) % points.length][0] * y,
      0,
    ),
  ) / 2;

// The corner nodes of an element in counter-clockwise order (the FEAScript order is 0, 2, 1 of the Gmsh
// order for linear triangles, and 0, 5, 2 for quadratic ones)
const corners = (element) =>
  element.length === 6 ? [element[0], element[5], element[2]] : [element[0], element[2], element[1]];

// A polygon of chained named boundaries from a list of points and one name per edge
const chained = (points, names) =>
  points.map((point, i) => ({ name: names[i], points: [point, points[(i + 1) % points.length]] }));

/**
 * Function to measure every element: the signed area, the smallest angle and the centroid
 */
function elementStats(mesh) {
  return mesh.nodalNumbering.map((element) => {
    const [a, b, c] = corners(element).map((node) => coordinates(mesh, node));
    const signedArea = ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
    const lengths = [distance(b, c), distance(c, a), distance(a, b)];
    let minAngle = 180;
    for (let k = 0; k < 3; k++) {
      const i = (k + 1) % 3;
      const j = (k + 2) % 3;
      const cosine = (lengths[i] ** 2 + lengths[j] ** 2 - lengths[k] ** 2) / (2 * lengths[i] * lengths[j]);
      minAngle = Math.min(minAngle, (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI);
    }
    return { signedArea, minAngle, centroid: [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3] };
  });
}

/**
 * Function to check the quality of a mesh: counter-clockwise elements, angles, areas and the total area
 */
function checkQuality(label, mesh, { minAngle, size, area }) {
  const stats = elementStats(mesh);
  assert(
    stats.every(({ signedArea }) => signedArea > 0),
    `${label}: every element is counter-clockwise`,
  );
  assert(
    stats.every((element) => element.minAngle >= minAngle - 1e-9),
    `${label}: every element has angles of at least ${minAngle} degrees (smallest ${Math.min(
      ...stats.map((element) => element.minAngle),
    ).toFixed(3)})`,
  );
  const sizeAt = typeof size === "function" ? size : () => size;
  assert(
    stats.every(({ signedArea, centroid }) => signedArea <= areaOfSide(sizeAt(...centroid)) * (1 + 1e-9)),
    `${label}: every element area is at most that of the equilateral triangle of side size`,
  );
  const total = stats.reduce((sum, { signedArea }) => sum + signedArea, 0);
  assert(
    Math.abs(total - area) < 1e-9 * area,
    `${label}: the elements cover the domain (area ${total.toFixed(6)}, expected ${area.toFixed(6)})`,
  );
}

/**
 * Function to get the boundary lines of a mesh by boundary name: the end nodes of each element side
 */
function boundaryLines(mesh) {
  const sides = getBoundarySides("2D", mesh.elementOrder, "triangle");
  const lines = {};
  Object.entries(mesh.boundaryElements).forEach(([name, elementSides]) => {
    lines[name] = elementSides.map(([elementIndex, side]) => {
      const localNodes = sides[side];
      const element = mesh.nodalNumbering[elementIndex];
      return [element[localNodes[0]], element[localNodes[localNodes.length - 1]]];
    });
  });
  return lines;
}

/**
 * Function to check that the boundary sides of each name cover the input edges of that name, and are sides of
 * the elements
 */
function checkBoundaries(label, mesh, points, names) {
  const uniqueNames = [...new Set(names)];
  assert(
    JSON.stringify(Object.keys(mesh.boundaryElements)) === JSON.stringify(uniqueNames),
    `${label}: the boundaries are keyed by name, in the order of the names (${uniqueNames.join(", ")})`,
  );
  const lines = boundaryLines(mesh);
  let onEdges = true;
  let lengthsMatch = true;
  uniqueNames.forEach((name) => {
    const edges = names.flatMap((edgeName, i) =>
      edgeName === name ? [[points[i], points[(i + 1) % points.length]]] : [],
    );
    let lineLength = 0;
    (lines[name] ?? []).forEach(([a, b]) => {
      const pa = coordinates(mesh, a);
      const pb = coordinates(mesh, b);
      lineLength += distance(pa, pb);
      const onOneEdge = edges.some(([p, q]) => {
        const along = (r) => Math.abs(distance(p, r) + distance(r, q) - distance(p, q)) < 1e-9;
        return along(pa) && along(pb);
      });
      if (!onOneEdge) onEdges = false;
    });
    const edgeLength = edges.reduce((sum, [p, q]) => sum + distance(p, q), 0);
    if (Math.abs(lineLength - edgeLength) > 1e-9) lengthsMatch = false;
  });
  assert(onEdges, `${label}: every boundary side lies on an input edge of its name`);
  assert(lengthsMatch, `${label}: the boundary sides of each name add up to the length of its edges`);

  // Every boundary side belongs to exactly one element, and every element side with one element is a boundary side
  const sideCount = new Map();
  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  mesh.nodalNumbering.forEach((element) => {
    const [a, b, c] = corners(element);
    [key(a, b), key(b, c), key(c, a)].forEach((side) => sideCount.set(side, (sideCount.get(side) ?? 0) + 1));
  });
  const boundaryKeys = Object.values(lines)
    .flat()
    .map(([a, b]) => key(a, b));
  const outerSides = [...sideCount.entries()].filter(([, count]) => count === 1).map(([side]) => side);
  assert(
    boundaryKeys.every((side) => sideCount.get(side) === 1) &&
      outerSides.length === boundaryKeys.length &&
      new Set(boundaryKeys).size === boundaryKeys.length,
    `${label}: the boundary sides are exactly the element sides on the boundary (${boundaryKeys.length})`,
  );
}

const expectError = (label, code, run, text) => {
  try {
    run();
    assert(false, `${label}: throws FEAScriptError ${code}`);
  } catch (error) {
    assert(
      error instanceof FEAScriptError && error.code === code && (!text || error.message.includes(text)),
      `${label}: throws FEAScriptError ${code}${text ? ` saying "${text}"` : ""} (got ${error.code ?? ""}: ${
        error.message
      })`,
    );
  }
};

// ───────────────────────────── Square ─────────────────────────────

basicLog("");
basicLog("--- Square with named edges ---");

const square = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];
const squareNames = ["bottom", "right", "top", "left"];
const squareMesh = generateTriangleMesh(
  { shapes: [chained(square, squareNames)] },
  { size: 0.068, minAngle: 25 },
);
checkQuality("square", squareMesh, { minAngle: 25, size: 0.068, area: 1 });
checkBoundaries("square", squareMesh, square, squareNames);
assert(
  squareMesh.elementOrder === "linear" &&
    squareMesh.meshDimension === "2D" &&
    squareMesh.elementShape === "triangle" &&
    squareMesh.nodalNumbering.every((element) => element.length === 3),
  "square: a mesh object of linear triangles, with elementOrder, meshDimension and elementShape set",
);
assert(
  JSON.stringify(squareMesh.aliases) === "{}",
  "square: a shape with named boundaries has no numeric aliases",
);
const rectangleMesh = generateTriangleMesh({ rectangle: [2, 1] }, { size: 0.2 });
assert(
  JSON.stringify(Object.keys(rectangleMesh.boundaryElements)) ===
    JSON.stringify(["bottom", "right", "top", "left"]) &&
    JSON.stringify(rectangleMesh.aliases) ===
      JSON.stringify({ 0: "bottom", 1: "left", 2: "top", 3: "right" }),
  "rectangle: the sides are named bottom, right, top, left, with the keys of the 0.3 structured meshes as aliases",
);

// ─────────────────── Rotated square, quadratic, graded ───────────────────

basicLog("");
basicLog("--- Rotated square, quadratic elements, graded size ---");

const rotate = ([x, y]) => [Math.cos(0.4) * x - Math.sin(0.4) * y, Math.sin(0.4) * x + Math.cos(0.4) * y];
const rotated = square.map(rotate);
const graded = (x, y) => 0.03 + 0.1 * distance([x, y], rotated[2]);
const rotatedMesh = generateTriangleMesh(
  { shapes: [chained(rotated, squareNames)] },
  { size: graded, minAngle: 30, elementOrder: "quadratic" },
);
checkQuality("rotated square", rotatedMesh, { minAngle: 30, size: graded, area: 1 });
checkBoundaries("rotated square", rotatedMesh, rotated, squareNames);

const elements = rotatedMesh.nodalNumbering;
assert(
  elements.every((element) => element.length === 6),
  "quadratic: every element has 6 nodes",
);
const middles = new Map();
let middlesAtMiddle = true;
let middlesShared = true;
elements.forEach((element) => {
  // FEAScript order: corners 0, 2, 5; middle nodes 1 (between 0 and 2), 3 (0 and 5), 4 (2 and 5)
  [
    [0, 2, 1],
    [0, 5, 3],
    [2, 5, 4],
  ].forEach(([i, j, m]) => {
    const [a, b, middle] = [element[i], element[j], element[m]].map((node) => coordinates(rotatedMesh, node));
    if (distance(middle, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]) > 1e-12) middlesAtMiddle = false;
    const key = element[i] < element[j] ? `${element[i]}-${element[j]}` : `${element[j]}-${element[i]}`;
    if (middles.has(key) && middles.get(key) !== element[m]) middlesShared = false;
    middles.set(key, element[m]);
  });
});
assert(middlesAtMiddle, "quadratic: the middle nodes are at the middle of the edges (FEAScript order)");
assert(middlesShared, "quadratic: the elements on an edge share its middle node");
const cornerNodes = new Set(elements.flatMap(corners)).size;
assert(
  rotatedMesh.nodesXCoordinates.length === cornerNodes + middles.size,
  `quadratic: the nodes are the ${cornerNodes} corners plus one node per edge (${middles.size})`,
);
const quadraticSides = getBoundarySides("2D", "quadratic", "triangle");
assert(
  Object.values(rotatedMesh.boundaryElements)
    .flat()
    .every(([elementIndex, side]) => {
      const [a, m, b] = quadraticSides[side].map((local) => elements[elementIndex][local]);
      return m === middles.get(a < b ? `${a}-${b}` : `${b}-${a}`);
    }),
  "quadratic: every boundary side has the middle node of its edge as middle node",
);

// ───────────────────────── Holes and points ─────────────────────────

basicLog("");
basicLog("--- Plate with a hole, embedded points ---");

const plate = [
  [0, 0],
  [2, 0],
  [2, 1],
  [0, 1],
];
const hole = [
  [0.9, 0.4],
  [1.2, 0.45],
  [1.1, 0.7],
];
const embedded = [
  [0.5, 0.5],
  [1.6, 0.3],
  [2, 0.5], // On the right edge
];
const plateMesh = generateTriangleMesh(
  {
    shapes: [[{ name: "outer", points: [...plate, plate[0]] }]],
    holes: [[{ name: "pin", points: [...hole, hole[0]] }]],
    points: embedded,
  },
  { size: 0.152 },
);
checkQuality("plate", plateMesh, { minAngle: 20, size: 0.152, area: 2 - polygonArea(hole) });
const insideHole = ([x, y]) => {
  let inside = false;
  for (let i = 0, j = hole.length - 1; i < hole.length; j = i++) {
    const [xi, yi] = hole[i];
    const [xj, yj] = hole[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
assert(
  elementStats(plateMesh).every(({ centroid }) => !insideHole(centroid)),
  "plate: no element inside the hole",
);
const plateLines = boundaryLines(plateMesh);
const pinLength = plateLines.pin.reduce(
  (sum, [a, b]) => sum + distance(coordinates(plateMesh, a), coordinates(plateMesh, b)),
  0,
);
const holeLength = hole.reduce((sum, p, i) => sum + distance(p, hole[(i + 1) % hole.length]), 0);
assert(Math.abs(pinLength - holeLength) < 1e-9, 'plate: the hole boundary "pin" is covered by its sides');
assert(
  embedded.every(([x, y]) =>
    plateMesh.nodesXCoordinates.some((nx, i) => nx === x && plateMesh.nodesYCoordinates[i] === y),
  ),
  "plate: every embedded point is a node, with its exact coordinates",
);
const rightNode =
  plateMesh.nodesXCoordinates.findIndex((nx, i) => nx === 2 && plateMesh.nodesYCoordinates[i] === 0.5) + 1;
assert(
  plateLines.outer.filter((line) => line.includes(rightNode)).length === 2,
  "plate: a point on an edge splits it, and is the end of two boundary sides",
);
const unnamedMesh = generateTriangleMesh({ shapes: [plate], holes: [hole] }, { size: 0.2 });
assert(
  JSON.stringify(Object.keys(unnamedMesh.boundaryElements)) === JSON.stringify(["boundary", "hole"]),
  'plate: a plain list of points is one boundary named "boundary" for a shape and "hole" for a hole',
);

// ─────────────────────── Small input angle ───────────────────────

basicLog("");
basicLog("--- Wedge with a 5 degree angle ---");

const wedge = [
  [0, 0],
  [1, 0],
  [1, Math.tan((5 * Math.PI) / 180)],
];
const wedgeMesh = generateTriangleMesh({ shapes: [wedge] }, { size: 0.048 });
const wedgeStats = elementStats(wedgeMesh);
assert(
  wedgeStats.every(({ signedArea }) => signedArea > 0),
  "wedge: the refinement stops, with counter-clockwise elements",
);
const wedgeArea = wedgeStats.reduce((sum, { signedArea }) => sum + signedArea, 0);
assert(Math.abs(wedgeArea - polygonArea(wedge)) < 1e-12, "wedge: the elements cover the wedge");
assert(
  wedgeStats.every(
    ({ signedArea, centroid }) => signedArea <= areaOfSide(0.048) * (1 + 1e-9) || centroid[0] < 0.01,
  ),
  "wedge: every element area is at most that of the size",
);
const fineAngles = wedgeStats.filter(({ centroid }) => centroid[0] > 0.3).map(({ minAngle }) => minAngle);
assert(
  Math.min(...fineAngles) >= 20 - 1e-9,
  "wedge: away from the tip, every element has angles of at least 20 degrees",
);

// ─────────────────────────── Solve ───────────────────────────

basicLog("");
basicLog("--- Heat conduction on a rotated square ---");

for (const elementOrder of ["linear", "quadratic"]) {
  const model = new FEAScriptModel();
  model.setModelConfig("heatConductionScript", { coefficientFunctions: { thermalConductivity: 1 } });
  model.setGeometry({ shapes: [chained(rotated, ["wall", "hot", "wall", "cold"])] });
  model.setMeshConfig({ elements: "triangles", size: 0.2, elementOrder });
  model.addBoundaryCondition("wall", ["symmetry"]);
  model.addBoundaryCondition("hot", ["constantTemperature", 1]); // The edge at x' = 1
  model.addBoundaryCondition("cold", ["constantTemperature", 0]); // The edge at x' = 0
  model.setSolverMethod("lusolve");
  const { solutionVector, nodesCoordinates } = model.solve();
  const largestError = Math.max(
    ...solutionVector.map((temperature, i) => {
      const x = nodesCoordinates.nodesXCoordinates[i];
      const y = nodesCoordinates.nodesYCoordinates[i];
      return Math.abs(temperature - (Math.cos(0.4) * x + Math.sin(0.4) * y));
    }),
  );
  assert(
    largestError < 1e-10,
    `${elementOrder}: the temperature is the linear field T = x' at every node (largest error ${largestError.toExponential(
      2,
    )})`,
  );
}

// ─────────────────────────── Errors ───────────────────────────

basicLog("");
basicLog("--- Invalid input ---");

expectError(
  "crossing edges",
  "INVALID_INPUT",
  () =>
    generateTriangleMesh({
      shapes: [
        [
          [0, 0],
          [1, 1],
          [1, 0],
          [0, 1],
        ],
      ],
    }),
  "crosses",
);
expectError(
  "hole outside the shape",
  "INVALID_INPUT",
  () =>
    generateTriangleMesh({
      shapes: [square],
      holes: [
        [
          [1.2, 0.5],
          [1.5, 0.5],
          [1.5, 0.8],
        ],
      ],
    }),
  "not inside the shape",
);
expectError("hole crossing the shape", "INVALID_INPUT", () =>
  generateTriangleMesh({
    shapes: [square],
    holes: [
      [
        [0.5, 0.5],
        [1.5, 0.5],
        [1.5, 1.5],
      ],
    ],
  }),
);
expectError(
  "hole inside another hole",
  "INVALID_INPUT",
  () =>
    generateTriangleMesh({
      shapes: [square],
      holes: [
        [
          [0.2, 0.2],
          [0.8, 0.2],
          [0.8, 0.8],
          [0.2, 0.8],
        ],
        [
          [0.4, 0.4],
          [0.6, 0.4],
          [0.5, 0.6],
        ],
      ],
    }),
  "is inside",
);
expectError(
  "point outside the domain",
  "INVALID_INPUT",
  () => generateTriangleMesh({ shapes: [square], points: [[2, 2]] }),
  "outside the domain",
);
expectError(
  "boundaries that do not chain",
  "INVALID_INPUT",
  () =>
    generateTriangleMesh({
      shapes: [
        [
          {
            name: "a",
            points: [
              [0, 0],
              [1, 0],
            ],
          },
          {
            name: "b",
            points: [
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          },
        ],
      ],
    }),
  "chained in order",
);
expectError(
  "a shape that is not closed",
  "INVALID_INPUT",
  () =>
    generateTriangleMesh({
      shapes: [
        [
          {
            name: "a",
            points: [
              [0, 0],
              [1, 0],
            ],
          },
          {
            name: "b",
            points: [
              [1, 0],
              [1, 1],
              [0, 1],
            ],
          },
        ],
      ],
    }),
  "must close the shape",
);
expectError("two shapes", "INVALID_INPUT", () => generateTriangleMesh({ shapes: [square, plate] }), "0.5.0");
expectError("minAngle out of range", "INVALID_INPUT", () =>
  generateTriangleMesh({ shapes: [square] }, { minAngle: 60 }),
);
expectError("size not positive", "INVALID_INPUT", () =>
  generateTriangleMesh({ shapes: [square] }, { size: 0 }),
);
expectError("unknown element order", "INVALID_INPUT", () =>
  generateTriangleMesh({ shapes: [square] }, { elementOrder: "cubic" }),
);
expectError("too few points", "INVALID_INPUT", () =>
  generateTriangleMesh({
    shapes: [
      [
        [0, 0],
        [1, 0],
      ],
    ],
  }),
);
expectError("a line for triangles", "INVALID_INPUT", () => generateTriangleMesh({ line: 1 }));
expectError("maxNodes reached", "MESH_TOO_FINE", () =>
  generateTriangleMesh({ shapes: [square] }, { size: 0.015, maxNodes: 50 }),
);

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
