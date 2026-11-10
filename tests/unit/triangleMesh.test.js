/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for the triangle mesh generator (generateTriangleMesh)
 *
 * Covers:
 *  - Quality: every element has angles of at least minAngle and an area of at most maxArea (a number, or a
 *    function of position), is counter-clockwise, and the elements cover the domain
 *  - Boundaries: every input edge is the union of boundary lines of its name, the lines are element sides, and
 *    the boundaries are tagged 1, 2, 3... in the order of their names
 *  - Holes: no element inside a hole, and the area of the mesh is the polygon area minus the holes
 *  - Points: embedded points become nodes, and a point on an edge splits it
 *  - Quadratic elements: the middle nodes are at the middle of their edges, in the Gmsh order, and shared between
 *    the elements on the edge
 *  - Small input angles: a 5 degree wedge is meshed (the refinement stops)
 *  - Solve: heat conduction on a rotated square reproduces a linear temperature field to round-off, with linear
 *    and quadratic elements
 *  - Errors: a polygon that is not simple, a point outside the domain, a setting out of range (INVALID_INPUT), and
 *    a mesh that passes maxNodes (MESH_TOO_FINE)
 *
 * Run: node tests/unit/triangleMesh.test.js (or npm test)
 */

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
const polygonArea = (points) =>
  Math.abs(
    points.reduce(
      (sum, [x, y], i) =>
        sum + x * points[(i + 1) % points.length][1] - points[(i + 1) % points.length][0] * y,
      0,
    ),
  ) / 2;

/**
 * Function to measure every element: the signed area (twice), the smallest angle and the centroid
 */
function elementStats(mesh) {
  return mesh.nodalNumbering.triangleElements.map((element) => {
    const [a, b, c] = element.slice(0, 3).map((node) => coordinates(mesh, node));
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
function checkQuality(label, mesh, { minAngle, maxArea, area }) {
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
  const areaLimit = typeof maxArea === "function" ? maxArea : () => maxArea;
  assert(
    stats.every(({ signedArea, centroid }) => signedArea <= areaLimit(...centroid) * (1 + 1e-9)),
    `${label}: every element area is at most maxArea`,
  );
  const total = stats.reduce((sum, { signedArea }) => sum + signedArea, 0);
  assert(
    Math.abs(total - area) < 1e-9 * area,
    `${label}: the elements cover the domain (area ${total.toFixed(6)}, expected ${area.toFixed(6)})`,
  );
}

/**
 * Function to check that the boundary lines of each input edge cover it, and are sides of the elements
 */
function checkBoundaries(label, mesh, polygon, names) {
  const points = polygon.map(([x, y]) => [x, y]);
  // The boundary lines of each name must be on the edges of that name, and add up to their length
  const tagOfName = Object.fromEntries(
    mesh.physicalPropMap.filter(({ dimension }) => dimension === 1).map(({ name, tag }) => [name, tag]),
  );
  const uniqueNames = [...new Set(names)];
  assert(
    uniqueNames.every((name, index) => tagOfName[name] === index + 1),
    `${label}: the boundaries are tagged 1, 2, 3... in the order of their names (${uniqueNames.join(", ")})`,
  );
  let onEdges = true;
  let lengthsMatch = true;
  uniqueNames.forEach((name) => {
    const edges = names.flatMap((edgeName, i) =>
      edgeName === name ? [[points[i], points[(i + 1) % points.length]]] : [],
    );
    const lines = mesh.boundaryNodePairs[tagOfName[name]] ?? [];
    let lineLength = 0;
    lines.forEach(([a, b]) => {
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
  assert(onEdges, `${label}: every boundary line lies on an input edge of its name`);
  assert(lengthsMatch, `${label}: the boundary lines of each name add up to the length of its edges`);

  // Every boundary line is a side of exactly one element, and every element side with one element is a boundary line
  const sideCount = new Map();
  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  mesh.nodalNumbering.triangleElements.forEach(([a, b, c]) => {
    [key(a, b), key(b, c), key(c, a)].forEach((side) => sideCount.set(side, (sideCount.get(side) ?? 0) + 1));
  });
  const boundaryKeys = Object.values(mesh.boundaryNodePairs).flatMap((lines) =>
    lines.map(([a, b]) => key(a, b)),
  );
  const outerSides = [...sideCount.entries()].filter(([, count]) => count === 1).map(([side]) => side);
  assert(
    boundaryKeys.every((side) => sideCount.get(side) === 1) &&
      outerSides.length === boundaryKeys.length &&
      new Set(boundaryKeys).size === boundaryKeys.length,
    `${label}: the boundary lines are exactly the element sides on the boundary (${boundaryKeys.length})`,
  );
  assert(
    mesh.boundaryConditions.every(({ tag, nodes }) => nodes === mesh.boundaryNodePairs[tag]) &&
      mesh.boundaryConditions.length === uniqueNames.length,
    `${label}: boundaryConditions lists every boundary with its lines`,
  );
}

const expectError = (label, code, run) => {
  try {
    run();
    assert(false, `${label}: throws FEAScriptError ${code}`);
  } catch (error) {
    assert(
      error instanceof FEAScriptError && error.code === code,
      `${label}: throws FEAScriptError ${code} (got ${error.code ?? error.message})`,
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
const squareMesh = generateTriangleMesh({
  polygon: { points: square, boundaries: squareNames },
  maxArea: 0.002,
  minAngle: 25,
});
checkQuality("square", squareMesh, { minAngle: 25, maxArea: 0.002, area: 1 });
checkBoundaries("square", squareMesh, square, squareNames);
assert(
  squareMesh.elementOrder === "linear" && squareMesh.meshDimension === "2D",
  "square: elementOrder and meshDimension are set",
);
assert(
  squareMesh.elementTypes[2] === squareMesh.nodalNumbering.triangleElements.length &&
    squareMesh.elementTypes[1] === Object.values(squareMesh.boundaryNodePairs).flat().length &&
    squareMesh.nodalNumbering.quadElements.length === 0,
  "square: elementTypes counts the linear triangles (2) and lines (1)",
);
assert(
  squareMesh.physicalPropMap.at(-1).dimension === 2 && squareMesh.physicalPropMap.at(-1).tag === 5,
  "square: the domain is the physical surface after the 4 boundaries",
);

// ─────────────────── Rotated square, quadratic, graded ───────────────────

basicLog("");
basicLog("--- Rotated square, quadratic elements, graded size ---");

const rotate = ([x, y]) => [Math.cos(0.4) * x - Math.sin(0.4) * y, Math.sin(0.4) * x + Math.cos(0.4) * y];
const rotated = square.map(rotate);
const graded = (x, y) => 0.0005 + 0.005 * distance([x, y], rotated[2]);
const rotatedMesh = generateTriangleMesh({
  polygon: { points: rotated, boundaries: squareNames },
  maxArea: graded,
  minAngle: 30,
  elementOrder: "quadratic",
});
checkQuality("rotated square", rotatedMesh, { minAngle: 30, maxArea: graded, area: 1 });
checkBoundaries("rotated square", rotatedMesh, rotated, squareNames);

const elements = rotatedMesh.nodalNumbering.triangleElements;
assert(
  elements.every((element) => element.length === 6),
  "quadratic: every element has 6 nodes",
);
const middles = new Map();
let middlesAtMiddle = true;
let middlesShared = true;
elements.forEach((element) => {
  [
    [0, 1, 3],
    [1, 2, 4],
    [2, 0, 5],
  ].forEach(([i, j, m]) => {
    const [a, b, middle] = [element[i], element[j], element[m]].map((node) => coordinates(rotatedMesh, node));
    if (distance(middle, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]) > 1e-12) middlesAtMiddle = false;
    const key = element[i] < element[j] ? `${element[i]}-${element[j]}` : `${element[j]}-${element[i]}`;
    if (middles.has(key) && middles.get(key) !== element[m]) middlesShared = false;
    middles.set(key, element[m]);
  });
});
assert(
  middlesAtMiddle,
  "quadratic: nodes 3, 4 and 5 are at the middle of the edges 0-1, 1-2 and 2-0 (Gmsh order)",
);
assert(middlesShared, "quadratic: the elements on an edge share its middle node");
const cornerNodes = new Set(elements.flatMap((element) => element.slice(0, 3))).size;
assert(
  rotatedMesh.nodesXCoordinates.length === cornerNodes + middles.size,
  `quadratic: the nodes are the ${cornerNodes} corners plus one node per edge (${middles.size})`,
);
assert(
  Object.values(rotatedMesh.boundaryNodePairs)
    .flat()
    .every(([a, b, m]) => m === middles.get(a < b ? `${a}-${b}` : `${b}-${a}`)),
  "quadratic: every boundary line has the middle node of its side as third node",
);
assert(
  rotatedMesh.elementTypes[9] === elements.length &&
    rotatedMesh.elementTypes[8] > 0 &&
    rotatedMesh.elementTypes[2] === undefined,
  "quadratic: elementTypes counts the quadratic triangles (9) and lines (8)",
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
const plateMesh = generateTriangleMesh({
  polygon: { points: plate, boundaries: "outer" },
  holes: [{ points: hole, boundaries: "pin" }],
  points: embedded,
  maxArea: 0.01,
});
checkQuality("plate", plateMesh, { minAngle: 20, maxArea: 0.01, area: 2 - polygonArea(hole) });
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
const pinLines = plateMesh.boundaryNodePairs[2];
const pinLength = pinLines.reduce(
  (sum, [a, b]) => sum + distance(coordinates(plateMesh, a), coordinates(plateMesh, b)),
  0,
);
const holeLength = hole.reduce((sum, p, i) => sum + distance(p, hole[(i + 1) % hole.length]), 0);
assert(
  Math.abs(pinLength - holeLength) < 1e-9,
  "plate: the hole boundary 'pin' (tag 2) is covered by its lines",
);
assert(
  embedded.every(([x, y]) =>
    plateMesh.nodesXCoordinates.some((nx, i) => nx === x && plateMesh.nodesYCoordinates[i] === y),
  ),
  "plate: every embedded point is a node, with its exact coordinates",
);
const rightNode =
  plateMesh.nodesXCoordinates.findIndex((nx, i) => nx === 2 && plateMesh.nodesYCoordinates[i] === 0.5) + 1;
assert(
  plateMesh.boundaryNodePairs[1].filter((line) => line.includes(rightNode)).length === 2,
  "plate: a point on an edge splits it, and is the end of two boundary lines",
);

// ─────────────────────── Small input angle ───────────────────────

basicLog("");
basicLog("--- Wedge with a 5 degree angle ---");

const wedge = [
  [0, 0],
  [1, 0],
  [1, Math.tan((5 * Math.PI) / 180)],
];
const wedgeMesh = generateTriangleMesh({ polygon: wedge, maxArea: 0.001 });
const wedgeStats = elementStats(wedgeMesh);
assert(
  wedgeStats.every(({ signedArea }) => signedArea > 0),
  "wedge: the refinement stops, with counter-clockwise elements",
);
const wedgeArea = wedgeStats.reduce((sum, { signedArea }) => sum + signedArea, 0);
assert(Math.abs(wedgeArea - polygonArea(wedge)) < 1e-12, "wedge: the elements cover the wedge");
assert(
  wedgeStats.every(({ signedArea, centroid }) => signedArea <= 0.001 * (1 + 1e-9) || centroid[0] < 0.01),
  "wedge: every element area is at most maxArea",
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
  const mesh = generateTriangleMesh({
    polygon: { points: rotated, boundaries: ["wall", "hot", "wall", "cold"] },
    maxArea: 0.02,
    elementOrder,
  });
  const model = new FEAScriptModel();
  model.setModelConfig("heatConductionScript", { coefficientFunctions: { thermalConductivity: 1 } });
  model.setMeshConfig({ parsedMesh: mesh });
  model.addBoundaryCondition("0", ["symmetry"]); // wall
  model.addBoundaryCondition("1", ["constantTemperature", 1]); // hot, the edge at x' = 1
  model.addBoundaryCondition("2", ["constantTemperature", 0]); // cold, the edge at x' = 0
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

expectError("crossing edges", "INVALID_INPUT", () =>
  generateTriangleMesh({
    polygon: [
      [0, 0],
      [1, 1],
      [1, 0],
      [0, 1],
    ],
  }),
);
expectError("hole outside the polygon", "INVALID_INPUT", () =>
  generateTriangleMesh({
    polygon: square,
    holes: [
      [
        [0.5, 0.5],
        [1.5, 0.5],
        [1.5, 1.5],
      ],
    ],
  }),
);
expectError("point outside the domain", "INVALID_INPUT", () =>
  generateTriangleMesh({ polygon: square, points: [[2, 2]] }),
);
expectError("one name for each edge", "INVALID_INPUT", () =>
  generateTriangleMesh({ polygon: { points: square, boundaries: ["a", "b"] } }),
);
expectError("minAngle out of range", "INVALID_INPUT", () =>
  generateTriangleMesh({ polygon: square, minAngle: 60 }),
);
expectError("maxArea not positive", "INVALID_INPUT", () =>
  generateTriangleMesh({ polygon: square, maxArea: 0 }),
);
expectError("unknown element order", "INVALID_INPUT", () =>
  generateTriangleMesh({ polygon: square, elementOrder: "cubic" }),
);
expectError("too few points", "INVALID_INPUT", () =>
  generateTriangleMesh({
    polygon: [
      [0, 0],
      [1, 0],
    ],
  }),
);
expectError("maxNodes reached", "MESH_TOO_FINE", () =>
  generateTriangleMesh({ polygon: square, maxArea: 1e-4, maxNodes: 50 }),
);

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
