/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// External imports
import { orient2d } from "robust-predicates";

// Internal imports
import { FEAScriptError } from "../utilities/errors.js";

/**
 * The geometry of a model, set with `model.setGeometry(geometry)` and meshed by `setMeshConfig`:
 *  - `{ line: length }`: a 1D domain from x = 0 to x = length, with the boundaries "left" and "right"
 *  - `{ rectangle: [width, height] }`: a 2D rectangle from (0, 0) to (width, height), with the boundaries
 *    "bottom", "right", "top" and "left"
 *  - `{ shape, holes: [polygon, ...], points: [[x, y], ...] }`: a 2D polygon, with or without holes and with
 *    points that must become nodes. A polygon (the shape or a hole) is written in one of three forms:
 *     - a path: `{ start: [x, y], boundaries: [{ name, to }, ...] }`. Each boundary runs from where the previous
 *       one ended (the first from `start`) to `to`, a point or a list of points (a polyline). The last boundary
 *       may leave out `to`: it then closes the polygon back to `start`. Boundaries with the same name form one
 *       boundary of the model. A boundary takes only `name` and `to` in this version; other segment kinds (arcs,
 *       for example) can be added as other keys later
 *     - `{ name, points: [[x, y], ...] }`: a closed polygon whose edges all have one name
 *     - `[[x, y], ...]`: a closed polygon whose edges are in the boundary "boundary" (a shape) or "hole" (a hole)
 *    Several shapes, meeting edge to edge as blocks, are planned for 0.5.0 under a key of their own
 * The boundary conditions are keyed by these names. The line and the rectangle also accept the numeric keys of
 * the structured meshes of FEAScript 0.3 ("0" to "3", in the order bottom, left, top, right) as aliases, with a
 * deprecation warning
 */

export const isPoint = (point) =>
  Array.isArray(point) && point.length === 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]);

/**
 * Function to show a value in a message
 */
export const shown = (value) => {
  if (typeof value === "function") return "a function";
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

/**
 * Function to read one polygon of the input, in one of its three forms (see above), into its points and one
 * boundary name per edge (the edge i goes from point i to point i + 1, and the last edge closes the polygon)
 * @returns {object|null} `{ label, points, names }`, or null (with the problem recorded)
 */
export function readPolygon(value, label, defaultName, problems) {
  const isPointList = (list) => Array.isArray(list) && list.length > 0 && list.every(isPoint);
  const points = [];
  const names = [];

  if (Array.isArray(value)) {
    // A plain list of points
    if (!isPointList(value)) {
      problems.push(`${label} must be a list of [x, y] points of finite numbers; got ${shown(value)}`);
      return null;
    }
    value.forEach((point) => {
      points.push(point);
      names.push(defaultName);
    });
  } else if (value && typeof value === "object" && value.points !== undefined) {
    // { name, points }: one name for every edge
    const unknown = Object.keys(value).filter((key) => key !== "name" && key !== "points");
    unknown.forEach((key) =>
      problems.push(`${label}: unknown setting ${key}; this form takes name and points`),
    );
    const name = value.name ?? defaultName;
    if (typeof name !== "string" || name === "") {
      problems.push(`${label}.name must be a word, the name of the boundary; got ${shown(value.name)}`);
      return null;
    }
    if (!isPointList(value.points)) {
      problems.push(
        `${label}.points must be a list of [x, y] points of finite numbers; got ${shown(value.points)}`,
      );
      return null;
    }
    if (unknown.length > 0) return null;
    value.points.forEach((point) => {
      points.push(point);
      names.push(name);
    });
  } else if (value && typeof value === "object" && value.start !== undefined) {
    // A path: { start, boundaries: [{ name, to }, ...] }
    const unknown = Object.keys(value).filter((key) => key !== "start" && key !== "boundaries");
    unknown.forEach((key) =>
      problems.push(`${label}: unknown setting ${key}; a path takes start and boundaries`),
    );
    if (!isPoint(value.start)) {
      problems.push(`${label}.start must be an [x, y] point of finite numbers; got ${shown(value.start)}`);
      return null;
    }
    const boundaries = value.boundaries;
    if (!Array.isArray(boundaries) || boundaries.length === 0) {
      problems.push(
        `${label}.boundaries must be a list of boundaries { name, to }; got ${shown(boundaries)}`,
      );
      return null;
    }
    let ok = unknown.length === 0;
    points.push(value.start);
    boundaries.forEach((boundary, index) => {
      const where = `${label}.boundaries[${index}]`;
      if (!boundary || typeof boundary !== "object" || Array.isArray(boundary)) {
        problems.push(`${where} must be a boundary { name, to }; got ${shown(boundary)}`);
        ok = false;
        return;
      }
      Object.keys(boundary)
        .filter((key) => key !== "name" && key !== "to")
        .forEach((key) => {
          problems.push(`${where}: unknown setting ${key}; a boundary takes name and to in this version`);
          ok = false;
        });
      const name = boundary.name;
      if (typeof name !== "string" || name === "") {
        problems.push(`${where}.name must be a word, the name of the boundary; got ${shown(name)}`);
        ok = false;
      }
      const last = index === boundaries.length - 1;
      let to = boundary.to;
      if (to === undefined) {
        if (!last) {
          problems.push(
            `${where} ("${name}") has no "to"; only the last boundary may leave it out, to close the shape`,
          );
          ok = false;
          return;
        }
        to = [value.start];
      } else if (isPoint(to)) {
        to = [to];
      } else if (!isPointList(to)) {
        problems.push(`${where}.to must be an [x, y] point or a list of points; got ${shown(boundary.to)}`);
        ok = false;
        return;
      }
      to.forEach((point) => {
        points.push(point);
        names.push(name);
      });
    });
    if (!ok) return null;
    const first = points[0];
    const end = points[points.length - 1];
    if (first[0] !== end[0] || first[1] !== end[1]) {
      problems.push(
        `${label}: the last boundary ends at (${end[0]}, ${end[1]}), not at the start (${first[0]}, ${first[1]}); end it at the start, or leave out its "to" to close the shape`,
      );
      return null;
    }
    points.pop();
  } else {
    problems.push(
      `${label} must be a path { start, boundaries: [{ name, to }] }, a polygon { name, points } or a list of [x, y] points; got ${shown(
        value,
      )}`,
    );
    return null;
  }

  // A plain polygon given closed, with its first point repeated at the end
  if (points.length > 1 && names.length === points.length) {
    const first = points[0];
    const end = points[points.length - 1];
    if (first[0] === end[0] && first[1] === end[1]) {
      points.pop();
      names.pop();
    }
  }
  if (points.length < 3) {
    problems.push(`${label} needs at least 3 points; got ${points.length}`);
    return null;
  }
  return { label, points, names };
}

/**
 * Function to test whether two segments meet, including at a point of one of them
 */
export function segmentsMeet(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = orient2d(cx, cy, dx, dy, ax, ay);
  const d2 = orient2d(cx, cy, dx, dy, bx, by);
  const d3 = orient2d(ax, ay, bx, by, cx, cy);
  const d4 = orient2d(ax, ay, bx, by, dx, dy);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  const between = (px, py, qx, qy, rx, ry) =>
    Math.min(px, qx) <= rx && rx <= Math.max(px, qx) && Math.min(py, qy) <= ry && ry <= Math.max(py, qy);
  if (d1 === 0 && between(cx, cy, dx, dy, ax, ay)) return true;
  if (d2 === 0 && between(cx, cy, dx, dy, bx, by)) return true;
  if (d3 === 0 && between(ax, ay, bx, by, cx, cy)) return true;
  if (d4 === 0 && between(ax, ay, bx, by, dx, dy)) return true;
  return false;
}

/**
 * Function to locate a point against one polygon: 1 inside, 0 on its boundary, -1 outside (even-odd rule)
 */
export function locateInPolygon(points, x, y) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (
      orient2d(xi, yi, xj, yj, x, y) === 0 &&
      Math.min(xi, xj) <= x &&
      x <= Math.max(xi, xj) &&
      Math.min(yi, yj) <= y &&
      y <= Math.max(yi, yj)
    ) {
      return 0;
    }
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside ? 1 : -1;
}

/**
 * Function to test whether a point is inside the domain (even-odd rule over the outer polygon and the holes)
 */
export function insideLoops(loops, X, Y, x, y) {
  let inside = false;
  for (const ids of loops) {
    for (let i = 0, j = ids.length - 1; i < ids.length; j = i++) {
      const xi = X[ids[i]];
      const yi = Y[ids[i]];
      const xj = X[ids[j]];
      const yj = Y[ids[j]];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

const pointText = ([x, y]) => `(${x}, ${y})`;

/**
 * Function to check that the polygons of a 2D geometry are simple, that the holes lie inside the shape and not
 * inside each other, and that the points lie inside the domain
 * @param {object} geometry - A normalized geometry (see readGeometry)
 * @returns {string[]} The problems found
 */
function findShapeProblems(geometry) {
  const problems = [];
  const polygons = [...geometry.shapes, ...geometry.holes];

  // Every edge of every polygon
  const edges = [];
  polygons.forEach(({ label, points }) => {
    points.forEach((a, i) => {
      const b = points[(i + 1) % points.length];
      if (a[0] === b[0] && a[1] === b[1]) {
        problems.push(`${label}: points ${i} and ${(i + 1) % points.length} coincide`);
      } else {
        edges.push({ a, b, label });
      }
    });
  });
  if (problems.length > 0) return problems;

  // The polygons must be simple: no two edges cross, touch or overlap, apart from meeting at a shared point
  const edgeText = ({ a, b }) => `from ${pointText(a)} to ${pointText(b)}`;
  const samePoint = (p, q) => p[0] === q[0] && p[1] === q[1];
  for (let i = 0; i < edges.length; i++) {
    const s = edges[i];
    for (let j = i + 1; j < edges.length; j++) {
      const t = edges[j];
      if ((samePoint(s.a, t.a) && samePoint(s.b, t.b)) || (samePoint(s.a, t.b) && samePoint(s.b, t.a))) {
        problems.push(`the boundary edge ${edgeText(s)} is given twice`);
        continue;
      }
      const shared = [s.a, s.b].find((p) => samePoint(p, t.a) || samePoint(p, t.b));
      if (shared === undefined) {
        if (segmentsMeet(s.a[0], s.a[1], s.b[0], s.b[1], t.a[0], t.a[1], t.b[0], t.b[1])) {
          problems.push(`the boundary edge ${edgeText(s)} crosses or touches the edge ${edgeText(t)}`);
        }
      } else {
        const p = samePoint(s.a, shared) ? s.b : s.a;
        const q = samePoint(t.a, shared) ? t.b : t.a;
        const collinear = orient2d(shared[0], shared[1], p[0], p[1], q[0], q[1]) === 0;
        const sameWay = (p[0] - shared[0]) * (q[0] - shared[0]) + (p[1] - shared[1]) * (q[1] - shared[1]) > 0;
        if (collinear && sameWay) {
          problems.push(`the boundary edges ${edgeText(s)} and ${edgeText(t)} overlap`);
        }
      }
    }
  }
  if (problems.length > 0) return problems;

  // Every hole lies inside the shape (its points inside or on the shape, with no edge crossing, checked
  // above) and not inside another hole
  const shape = geometry.shapes[0];
  geometry.holes.forEach((hole) => {
    const outsidePoint = hole.points.find((point) => locateInPolygon(shape.points, point[0], point[1]) < 0);
    if (outsidePoint) {
      problems.push(`${hole.label} is not inside the shape: its point ${pointText(outsidePoint)} is outside`);
      return;
    }
    geometry.holes.forEach((other) => {
      if (other === hole) return;
      if (hole.points.every((point) => locateInPolygon(other.points, point[0], point[1]) >= 0)) {
        problems.push(`${hole.label} is inside ${other.label}`);
      }
    });
  });
  if (problems.length > 0) return problems;

  // Every point lies inside the domain, or on its boundary
  geometry.points.forEach((point, index) => {
    const inShape = locateInPolygon(shape.points, point[0], point[1]);
    const inHole = geometry.holes.some((hole) => locateInPolygon(hole.points, point[0], point[1]) > 0);
    if (inShape < 0 || inHole) {
      problems.push(`points[${index}] = ${pointText(point)} is outside the domain`);
    }
  });
  return problems;
}

/**
 * Function to read and check the geometry given to setGeometry, and to turn it into one form: the dimension,
 * the length of a line, or the shape (one polygon, with its edge names), the holes and the points of a 2D
 * domain, with the aliases of the boundary names
 * @param {object} geometry - `{ line }`, `{ rectangle }` or `{ shape, holes, points }` (see above)
 * @returns {object} `{ meshDimension, length, shapes, holes, points, aliases, kind }`, with `kind` one of
 *  "line", "rectangle" and "polygon"
 * @throws {FEAScriptError} "INVALID_INPUT", listing every problem found
 */
export function readGeometry(geometry) {
  const problems = [];
  if (!geometry || typeof geometry !== "object" || Array.isArray(geometry)) {
    throw new FEAScriptError(
      "INVALID_INPUT",
      `The geometry must be an object: { line: length }, { rectangle: [width, height] } or { shape, holes, points }; got ${shown(
        geometry,
      )}.`,
    );
  }
  const { line, rectangle, shape, holes = [], points = [] } = geometry;
  const forms = [line !== undefined, rectangle !== undefined, shape !== undefined].filter(Boolean).length;
  if (geometry.shapes !== undefined || geometry.blocks !== undefined) {
    throw new FEAScriptError(
      "INVALID_INPUT",
      "The domain is one shape in this version: { shape, holes, points }. Several shapes, meeting edge to edge as blocks, come in 0.5.0.",
    );
  }
  if (forms !== 1) {
    throw new FEAScriptError(
      "INVALID_INPUT",
      `The geometry must be one of { line: length }, { rectangle: [width, height] } and { shape, holes, points }; got ${shown(
        geometry,
      )}.`,
    );
  }
  const unknown = Object.keys(geometry).filter(
    (key) => !["line", "rectangle", "shape", "holes", "points"].includes(key),
  );
  unknown.forEach((key) =>
    problems.push(
      key === "shapes" || key === "blocks"
        ? `${key} is not supported in this version: the domain is one shape, with holes in "holes" (several blocks come in 0.5.0).`
        : `Unknown geometry setting ${key}. Settings: line, rectangle, shape, holes, points.`,
    ),
  );

  if (line !== undefined) {
    if (!(Number.isFinite(line) && line > 0)) {
      problems.push(`line must be a positive number, the length of the domain; got ${shown(line)}.`);
    }
    if (holes.length > 0 || points.length > 0) problems.push("A line has no holes or points.");
    FEAScriptError.throwIfAny("INVALID_INPUT", problems);
    return {
      kind: "line",
      meshDimension: "1D",
      length: line,
      shapes: [],
      holes: [],
      points: [],
      boundaryNames: ["left", "right"],
      aliases: { 0: "left", 1: "right" },
    };
  }

  let shapeValue;
  let aliases = {};
  let kind = "polygon";
  if (rectangle !== undefined) {
    const valid =
      Array.isArray(rectangle) &&
      rectangle.length === 2 &&
      rectangle.every((side) => Number.isFinite(side) && side > 0);
    if (!valid) {
      problems.push(`rectangle must be [width, height], two positive numbers; got ${shown(rectangle)}.`);
    }
    FEAScriptError.throwIfAny("INVALID_INPUT", problems);
    const [width, height] = rectangle;
    shapeValue = {
      start: [0, 0],
      boundaries: [
        { name: "bottom", to: [width, 0] },
        { name: "right", to: [width, height] },
        { name: "top", to: [0, height] },
        { name: "left" },
      ],
    };
    // The keys of the structured meshes of FEAScript 0.3, in their order: bottom, left, top, right
    aliases = { 0: "bottom", 1: "left", 2: "top", 3: "right" };
    kind = "rectangle";
  } else {
    shapeValue = shape;
  }
  FEAScriptError.throwIfAny("INVALID_INPUT", problems);

  const normalized = { kind, meshDimension: "2D", shapes: [], holes: [], points: [], aliases };
  const outline = readPolygon(shapeValue, "shape", "boundary", problems);
  if (outline) normalized.shapes.push(outline);
  if (!Array.isArray(holes)) {
    problems.push(`holes must be an array of polygons; got ${shown(holes)}`);
  } else {
    holes.forEach((hole, index) => {
      const loop = readPolygon(hole, `holes[${index}]`, "hole", problems);
      if (loop) normalized.holes.push(loop);
    });
  }
  if (!Array.isArray(points)) {
    problems.push(`points must be an array of [x, y] pairs; got ${shown(points)}`);
  } else {
    points.forEach((point, index) => {
      if (!isPoint(point)) {
        problems.push(`points[${index}] must be an [x, y] pair of finite numbers; got ${shown(point)}`);
      } else {
        normalized.points.push(point);
      }
    });
  }
  FEAScriptError.throwIfAny("INVALID_INPUT", problems);
  FEAScriptError.throwIfAny("INVALID_INPUT", findShapeProblems(normalized));

  // The boundary names, in the order they first appear: the shape first, then the holes
  const boundaryNames = [];
  [...normalized.shapes, ...normalized.holes].forEach(({ names }) => {
    names.forEach((name) => {
      if (!boundaryNames.includes(name)) boundaryNames.push(name);
    });
  });
  normalized.boundaryNames = boundaryNames;
  const nameAliases = Object.values(aliases);
  const clash = boundaryNames.find((name) => aliases[name] !== undefined && !nameAliases.includes(name));
  if (clash) {
    throw new FEAScriptError(
      "INVALID_INPUT",
      `The boundary name "${clash}" is a numeric key kept for the meshes of FEAScript 0.3; use a word as the name.`,
    );
  }
  return normalized;
}

/**
 * Function to turn the mesh settings of FEAScript 0.3 (meshDimension, numElementsX, maxX, numElementsY, maxY,
 * angleLeft, angleRight) into a geometry and a mesh configuration of this version
 * @param {object} meshConfig - The old mesh configuration
 * @returns {object} `{ geometry, meshConfig }` in the new form
 */
export function translateOldMeshConfig(meshConfig) {
  const {
    meshDimension,
    numElementsX,
    numElementsY,
    maxX,
    maxY,
    angleLeft = 90,
    angleRight = 90,
  } = meshConfig;
  const elementOrder = meshConfig.elementOrder ?? "linear";
  const problems = [];
  const checkCount = (name, value) => {
    if (!(Number.isInteger(value) && value > 0)) {
      problems.push(`${name} must be a positive integer; got ${shown(value)}.`);
    }
  };
  const checkLength = (name, value) => {
    if (!(Number.isFinite(value) && value > 0)) {
      problems.push(`${name} must be a positive number; got ${shown(value)}.`);
    }
  };
  if (meshDimension === "1D") {
    checkCount("numElementsX", numElementsX);
    checkLength("maxX", maxX);
    FEAScriptError.throwIfAny("INVALID_INPUT", problems);
    return { geometry: { line: maxX }, meshConfig: { elementOrder, divisions: numElementsX } };
  }
  if (meshDimension === "2D") {
    checkCount("numElementsX", numElementsX);
    checkCount("numElementsY", numElementsY);
    checkLength("maxX", maxX);
    checkLength("maxY", maxY);
    FEAScriptError.throwIfAny("INVALID_INPUT", problems);
    const newMeshConfig = {
      elements: "quadrilaterals",
      elementOrder,
      divisions: [numElementsX, numElementsY],
    };
    if (angleLeft === 90 && angleRight === 90) {
      return { geometry: { rectangle: [maxX, maxY] }, meshConfig: newMeshConfig };
    }
    // The trapezoid of the skewed structured mesh: angles measured inside the domain from the bottom side
    const degToRad = Math.PI / 180;
    const sideX = (angle, start, direction) => {
      const tangent = Math.tan(angle * degToRad);
      return Math.abs(tangent) < 1e-12 ? start : start + (direction * maxY) / tangent;
    };
    const P2 = [sideX(angleRight, maxX, -1), maxY];
    const P3 = [sideX(angleLeft, 0, 1), maxY];
    const geometry = {
      shape: {
        start: [0, 0],
        boundaries: [
          { name: "bottom", to: [maxX, 0] },
          { name: "right", to: P2 },
          { name: "top", to: P3 },
          { name: "left" },
        ],
      },
    };
    return { geometry, meshConfig: newMeshConfig, aliases: { 0: "bottom", 1: "left", 2: "top", 3: "right" } };
  }
  throw new FEAScriptError(
    "INVALID_INPUT",
    `Mesh dimension must be either "1D" or "2D"; got ${shown(meshDimension)}.`,
  );
}
