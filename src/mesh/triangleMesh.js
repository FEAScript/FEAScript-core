/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// External imports
import Constrainautor from "@kninnug/constrainautor";
import Delaunator from "delaunator";
import { incircle, orient2d } from "robust-predicates";

// Internal imports
import { toMeshObject } from "../io/gmshReader.js";
import { insideLoops, readGeometry, shown } from "./geometry.js";
import { FEAScriptError } from "../utilities/errors.js";
import { basicLog, debugLog } from "../utilities/logging.js";

/** @import { Geometry, Mesh } from "../types.js" */

/**
 * Triangle mesh generation of a polygon with holes, by Delaunay refinement
 *
 * The first triangulation is the constrained Delaunay triangulation of the input vertices (Delaunator, with the
 * boundary edges forced by Constrainautor). Ruppert's refinement then inserts vertices until every triangle has
 * angles of at least minAngle and an area of at most maxArea:
 *  - A segment encroached by a vertex (one inside its diametral circle) is split
 *  - A bad triangle gets a vertex at its circumcenter, or at its off-center (Üngör), which lies nearer to the
 *    short edge and gives fewer vertices. A vertex that would encroach a segment, or that lies beyond one, splits
 *    that segment instead, as Triangle does
 *  - At a small angle between two input segments, the segments are split at concentric shells (lengths in powers
 *    of two from the corner), and a skinny triangle whose short edge joins two shell vertices at the same distance
 *    from the corner is kept (Miller, Pav and Walkington), so that the refinement stops
 * The vertices are inserted in passes, each rebuilding the triangulation. In a pass, a bad triangle gets its vertex
 * only if no vertex accepted earlier in the pass lies in its circumcircle, i.e. only if the triangle would still
 * exist after those vertices; the pass is then the same as inserting the vertices one by one in that order
 */

// Kinds of vertices
const CORNER = 0; // A vertex of the input polygons
const SEGMENT = 1; // A vertex inserted on a boundary segment
const FREE = 2; // A vertex inserted inside the domain
const EMBEDDED = 3; // A point of the input that must become a node

const MAX_PASSES = 10000;

/**
 * Function to generate a mesh of triangles in a polygon with holes, in the form that `model.setMesh(mesh)` takes
 * (the same as the meshes of importGmshMesh and generateQuadrilateralMesh)
 * @param {Geometry} geometry - The geometry, as given to setGeometry: `{ rectangle: [width, height] }` or
 *  `{ shape, holes, points }`, where a polygon is a path `{ start, boundaries: [{ name, to }] }`, a polygon
 *  `{ name, points }` with one name, or a plain list of points (see geometry.js). The boundaries with the same
 *  name form one boundary. Points inside the domain, or on its boundary, become nodes
 * @param {object} [options] - The mesh settings
 * @param {number | ((x: number, y: number) => number)} [options.size] - The length of an element side, as a
 *  number or as a function (x, y)
 *  of the element center for a mesh size that varies; the largest element area is that of the equilateral
 *  triangle of this side. Without it, only the angles are refined
 * @param {number} [options.minAngle=20] - The smallest angle of the elements, in degrees. Ruppert's refinement
 *  always stops below 20.7 degrees, and usually up to about 33; above that, it may reach maxNodes
 * @param {"linear" | "quadratic"} [options.elementOrder="linear"] - "linear" (3-node) or "quadratic" (6-node)
 *  triangles
 * @param {number} [options.maxNodes=100000] - The limit on the number of vertices (the corner nodes of the
 *  elements) before the refinement stops with an error
 * @returns {Mesh} The mesh object: the boundaries are keyed by their names
 * @throws {FEAScriptError} "INVALID_INPUT" for a polygon that is not simple, a hole or a point outside the
 *  domain or a setting out of range; "MESH_TOO_FINE" when the refinement passes maxNodes
 */
export function generateTriangleMesh(
  geometry,
  { size, minAngle = 20, elementOrder = "linear", maxNodes = 100000 } = {},
) {
  const normalized = geometry?.kind ? geometry : readGeometry(geometry);
  if (normalized.meshDimension !== "2D") {
    throw new FEAScriptError(
      "INVALID_INPUT",
      "Triangle elements need a 2D geometry: a rectangle or a shape.",
    );
  }
  // The largest element area from the element side: the area of the equilateral triangle of that side
  const areaOf = (side) => (Math.sqrt(3) / 4) * side * side;
  let maxArea;
  if (typeof size === "function") {
    maxArea = (x, y) => areaOf(size(x, y));
  } else if (size !== undefined) {
    if (!(typeof size === "number" && size > 0)) {
      throw new FEAScriptError(
        "INVALID_INPUT",
        `size must be a positive number or a function (x, y) => size; got ${shown(size)}`,
      );
    }
    maxArea = areaOf(size);
  }
  const input = readInput(normalized, { maxArea, minAngle, elementOrder, maxNodes });
  const triangulation = refine(input);
  const parsedMesh = toParsedMesh(input, triangulation);
  const mesh = toMeshObject(parsedMesh);
  mesh.aliases = { ...normalized.aliases };
  basicLog(
    `Generated a triangle mesh of ${mesh.nodesXCoordinates.length} nodes and ` +
      `${mesh.nodalNumbering.length} ${elementOrder} elements`,
  );
  return mesh;
}

// ───────────────────────────────── Input ─────────────────────────────────

/**
 * Function to check the input and turn it into vertices, boundary segments and boundary tags
 * @returns {object} The vertices (coordinates, kind and parent input segment), the segments (which are split
 *  during refinement), the input segments (with their tags), the loops (vertex ids, for the inside test), the
 *  physical groups, the size of the domain and the options
 */
function readInput(geometry, options) {
  const { maxArea, minAngle, elementOrder, maxNodes } = options;
  const { points } = geometry;
  const problems = [];

  if (!(typeof minAngle === "number" && minAngle >= 0 && minAngle < 60)) {
    problems.push(`minAngle must be a number of degrees from 0 to below 60; got ${shown(minAngle)}`);
  }
  if (
    maxArea !== undefined &&
    typeof maxArea !== "function" &&
    !(typeof maxArea === "number" && maxArea > 0)
  ) {
    problems.push(`maxArea must be a positive number or a function (x, y) => area; got ${shown(maxArea)}`);
  }
  if (elementOrder !== "linear" && elementOrder !== "quadratic") {
    problems.push(`elementOrder must be "linear" or "quadratic"; got ${shown(elementOrder)}`);
  }
  if (!(Number.isInteger(maxNodes) && maxNodes > 0)) {
    problems.push(`maxNodes must be a positive integer; got ${shown(maxNodes)}`);
  }

  const polygons = [...geometry.shapes, ...geometry.holes];
  FEAScriptError.throwIfAny("INVALID_INPUT", problems);

  // Vertices: the polygon points, merged when two coincide (e.g. a hole touching the outer polygon at a point)
  const vertices = { x: [], y: [], kind: [], parent: [] };
  const vertexAt = new Map();
  const addVertex = (x, y, kind, parent = -1) => {
    vertices.x.push(x);
    vertices.y.push(y);
    vertices.kind.push(kind);
    vertices.parent.push(parent);
    return vertices.x.length - 1;
  };
  const cornerAt = (x, y) => {
    const key = `${x},${y}`;
    let id = vertexAt.get(key);
    if (id === undefined) {
      id = addVertex(x, y, CORNER);
      vertexAt.set(key, id);
    }
    return id;
  };

  // Boundary tags, in the order the names first appear
  const tags = new Map();
  const physicalPropMap = [];
  const tagOf = (name) => {
    if (!tags.has(name)) {
      tags.set(name, tags.size + 1);
      physicalPropMap.push({ tag: tags.size, dimension: 1, name });
    }
    return tags.get(name);
  };

  // Input segments: the polygon edges
  const inputSegments = [];
  const loops = polygons.map(({ label, points: pts, names }) => {
    const ids = pts.map(([x, y]) => cornerAt(x, y));
    ids.forEach((a, i) => {
      const j = (i + 1) % ids.length;
      const b = ids[j];
      if (a === b) problems.push(`${label}: points ${i} and ${j} coincide`);
      else inputSegments.push({ a, b, tag: tagOf(names[i]) });
    });
    return ids;
  });
  FEAScriptError.throwIfAny("INVALID_INPUT", problems);

  const X = vertices.x;
  const Y = vertices.y;
  const edgeText = ({ a, b }) => `from (${X[a]}, ${Y[a]}) to (${X[b]}, ${Y[b]})`;

  const box = { minX: Math.min(...X), maxX: Math.max(...X), minY: Math.min(...Y), maxY: Math.max(...Y) };
  const scale = Math.hypot(box.maxX - box.minX, box.maxY - box.minY);
  const segments = inputSegments.map(({ a, b }, parent) => ({ a, b, parent }));

  // Embedded points: on a segment, they split it; otherwise they must be inside the domain
  const snapTolerance = 1e-12 * scale;
  points.forEach(([x, y], index) => {
    const key = `${x},${y}`;
    if (vertexAt.has(key)) {
      debugLog(`points[${index}] = [${x}, ${y}] is already a vertex of the mesh`);
      return;
    }
    for (let s = 0; s < segments.length; s++) {
      const { a, b, parent } = segments[s];
      const ex = X[b] - X[a];
      const ey = Y[b] - Y[a];
      const length2 = ex * ex + ey * ey;
      const along = ((x - X[a]) * ex + (y - Y[a]) * ey) / length2;
      if (along <= 0 || along >= 1) continue;
      const distance = Math.abs((x - X[a]) * ey - (y - Y[a]) * ex) / Math.sqrt(length2);
      if (distance > snapTolerance) continue;
      const exact = orient2d(X[a], Y[a], X[b], Y[b], x, y) === 0;
      const id = addVertex(exact ? x : X[a] + along * ex, exact ? y : Y[a] + along * ey, SEGMENT, parent);
      vertexAt.set(key, id);
      segments[s] = { a, b: id, parent };
      segments.push({ a: id, b, parent });
      return;
    }
    if (!insideLoops(loops, X, Y, x, y)) {
      problems.push(`points[${index}] = [${x}, ${y}] is outside the domain`);
      return;
    }
    vertexAt.set(key, addVertex(x, y, EMBEDDED));
  });
  FEAScriptError.throwIfAny("INVALID_INPUT", problems);

  return { vertices, segments, inputSegments, loops, physicalPropMap, box, scale, options };
}

// ─────────────────────────────── Refinement ───────────────────────────────

const edgeKey = (a, b, n) => (a < b ? a * n + b : b * n + a);
const nextHalfedge = (e) => (e % 3 === 2 ? e - 2 : e + 1);
const prevHalfedge = (e) => (e % 3 === 0 ? e + 2 : e - 1);

/**
 * Function to build the constrained Delaunay triangulation of the current vertices and segments
 * @returns {object} The Delaunator arrays (`coords`, `triangles`, `halfedges`), the sign of orient2d for the
 *  triangles and of incircle for a point inside a circumcircle, the segment of each halfedge (-1 for none), one
 *  halfedge of each segment, and whether each triangle is inside the domain
 */
function triangulate({ vertices, segments, loops, box, scale }) {
  // The vertices, and the corners of a box around the domain. With the box, no boundary segment is on the convex
  // hull, so every segment has a triangle on each side: the split points of a slanted segment are not exactly on
  // its line, and on the hull they would be joined to the hull edge by triangles of (almost) zero area. The
  // triangles outside the domain are dropped from the mesh
  const n = vertices.x.length + 4;
  const coords = new Float64Array(2 * n);
  for (let i = 0; i < n - 4; i++) {
    coords[2 * i] = vertices.x[i];
    coords[2 * i + 1] = vertices.y[i];
  }
  const boxCorners = [
    [box.minX - scale, box.minY - scale],
    [box.maxX + scale, box.minY - scale],
    [box.maxX + scale, box.maxY + scale],
    [box.minX - scale, box.maxY + scale],
  ];
  boxCorners.forEach(([bx, by], i) => {
    coords[2 * (n - 4 + i)] = bx;
    coords[2 * (n - 4 + i) + 1] = by;
  });
  let del;
  try {
    del = new Delaunator(coords);
    new Constrainautor(del).constrainAll(segments.map(({ a, b }) => [a, b]));
  } catch (error) {
    throw new FEAScriptError(
      "INTERNAL_ERROR",
      `The constrained Delaunay triangulation of the mesh failed: ${error.message}`,
    );
  }
  const { triangles, halfedges } = del;
  const triangleCount = triangles.length / 3;

  // All the triangles have the same orientation; the signs of the predicates follow from the first one
  const [a, b, c] = [triangles[0], triangles[1], triangles[2]];
  const orientSign = Math.sign(
    orient2d(
      coords[2 * a],
      coords[2 * a + 1],
      coords[2 * b],
      coords[2 * b + 1],
      coords[2 * c],
      coords[2 * c + 1],
    ),
  );
  const incircleSign = Math.sign(
    incircle(
      coords[2 * a],
      coords[2 * a + 1],
      coords[2 * b],
      coords[2 * b + 1],
      coords[2 * c],
      coords[2 * c + 1],
      (coords[2 * a] + coords[2 * b] + coords[2 * c]) / 3,
      (coords[2 * a + 1] + coords[2 * b + 1] + coords[2 * c + 1]) / 3,
    ),
  );

  // The segments as halfedges
  const segmentAt = new Map();
  segments.forEach(({ a, b }, s) => segmentAt.set(edgeKey(a, b, n), s));
  const segmentOfHalfedge = new Int32Array(halfedges.length).fill(-1);
  const halfedgeOfSegment = new Int32Array(segments.length).fill(-1);
  for (let e = 0; e < halfedges.length; e++) {
    const s = segmentAt.get(edgeKey(triangles[e], triangles[nextHalfedge(e)], n));
    if (s !== undefined) {
      segmentOfHalfedge[e] = s;
      halfedgeOfSegment[s] = e;
    }
  }
  if (halfedgeOfSegment.includes(-1)) {
    throw new FEAScriptError("INTERNAL_ERROR", "A boundary segment is missing from the triangulation");
  }

  // The regions: the triangles connected without crossing a segment are all inside or all outside the domain
  const inside = new Uint8Array(triangleCount);
  const labelled = new Uint8Array(triangleCount);
  const stack = [];
  for (let t = 0; t < triangleCount; t++) {
    if (labelled[t]) continue;
    const region = [t];
    labelled[t] = 1;
    stack.push(t);
    while (stack.length) {
      const u = stack.pop();
      for (let k = 0; k < 3; k++) {
        const e = 3 * u + k;
        if (segmentOfHalfedge[e] !== -1 || halfedges[e] === -1) continue;
        const v = (halfedges[e] / 3) | 0;
        if (!labelled[v]) {
          labelled[v] = 1;
          region.push(v);
          stack.push(v);
        }
      }
    }
    const [i, j, k] = [triangles[3 * t], triangles[3 * t + 1], triangles[3 * t + 2]];
    const cx = (coords[2 * i] + coords[2 * j] + coords[2 * k]) / 3;
    const cy = (coords[2 * i + 1] + coords[2 * j + 1] + coords[2 * k + 1]) / 3;
    const isInside = insideLoops(loops, vertices.x, vertices.y, cx, cy) ? 1 : 0;
    region.forEach((u) => (inside[u] = isInside));
  }

  return {
    coords,
    triangles,
    halfedges,
    triangleCount,
    orientSign,
    incircleSign,
    segmentOfHalfedge,
    halfedgeOfSegment,
    inside,
  };
}

/**
 * Function to run the refinement passes until no triangle is bad and no segment is encroached
 * @returns {object} The final triangulation, from triangulate
 */
function refine(input) {
  const { vertices, options } = input;
  const { minAngle, maxArea, maxNodes } = options;
  const cosMinAngle = Math.cos((minAngle * Math.PI) / 180);
  // Triangle's off-center distance, as a multiple of the short edge; zero means circumcenters only
  const goodAngle = cosMinAngle * cosMinAngle;
  const offConstant = minAngle > 0 ? 0.475 * Math.sqrt((1 + goodAngle) / (1 - goodAngle)) : 0;
  const areaLimit = typeof maxArea === "function" ? maxArea : maxArea === undefined ? null : () => maxArea;

  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    const triangulation = triangulate(input);
    const inserted = refinePass(input, triangulation, { cosMinAngle, offConstant, areaLimit });
    debugLog(`Mesh refinement pass ${pass}: ${vertices.x.length} vertices, ${inserted} inserted`);
    if (inserted === 0) return triangulation;
    if (vertices.x.length > maxNodes) {
      throw new FEAScriptError(
        "MESH_TOO_FINE",
        `The mesh refinement passed ${maxNodes} nodes (maxNodes) before meeting maxArea and minAngle. ` +
          "Increase maxArea, lower minAngle, or raise maxNodes.",
      );
    }
  }
  throw new FEAScriptError("INTERNAL_ERROR", `The mesh refinement did not finish in ${MAX_PASSES} passes`);
}

/**
 * Function to run one refinement pass: split the encroached segments and insert a vertex in the bad triangles
 * @returns {number} The number of vertices inserted
 */
function refinePass(input, triangulation, { cosMinAngle, offConstant, areaLimit }) {
  const { vertices, segments, inputSegments, scale } = input;
  const {
    coords,
    triangles,
    halfedges,
    triangleCount,
    orientSign,
    incircleSign,
    segmentOfHalfedge,
    halfedgeOfSegment,
    inside,
  } = triangulation;
  const { kind, parent } = vertices;
  const x = (v) => coords[2 * v];
  const y = (v) => coords[2 * v + 1];

  // The triangles that a vertex accepted in this pass, or a segment split, will destroy
  const dead = new Uint8Array(triangleCount);
  const toSplit = new Set();
  const splitSegment = (s) => {
    if (toSplit.has(s)) return;
    toSplit.add(s);
    const e = halfedgeOfSegment[s];
    dead[(e / 3) | 0] = 1;
    if (halfedges[e] !== -1) dead[(halfedges[e] / 3) | 0] = 1;
  };

  // Segments encroached by a vertex: in a Delaunay triangulation, a vertex lies in the diametral circle of a
  // segment only if the apex of a triangle on the segment does, i.e. sees the segment at more than 90 degrees
  const apexSeesObtuse = (e) => {
    const a = triangles[e];
    const b = triangles[nextHalfedge(e)];
    const d = triangles[prevHalfedge(e)];
    return (x(a) - x(d)) * (x(b) - x(d)) + (y(a) - y(d)) * (y(b) - y(d)) < 0;
  };
  for (let s = 0; s < segments.length; s++) {
    const e = halfedgeOfSegment[s];
    for (const h of [e, halfedges[e]]) {
      if (h !== -1 && inside[(h / 3) | 0] && apexSeesObtuse(h)) {
        splitSegment(s);
        break;
      }
    }
  }

  // The skip rule for small input angles: the short edge joins two vertices on segments that meet at a corner,
  // both at the same distance from it (on the same concentric shell)
  const onSameShell = (u, v) => {
    if (kind[u] !== SEGMENT || kind[v] !== SEGMENT || parent[u] === parent[v]) return false;
    const su = inputSegments[parent[u]];
    const sv = inputSegments[parent[v]];
    const apex = [su.a, su.b].find((id) => id === sv.a || id === sv.b);
    if (apex === undefined) return false;
    const du = (x(u) - x(apex)) ** 2 + (y(u) - y(apex)) ** 2;
    const dv = (x(v) - x(apex)) ** 2 + (y(v) - y(apex)) ** 2;
    return du < 1.001 * dv && du > 0.999 * dv;
  };

  // The bad triangles, each with the vertex that would fix it
  const candidates = [];
  for (let t = 0; t < triangleCount; t++) {
    if (!inside[t] || dead[t]) continue;
    const ids = [triangles[3 * t], triangles[3 * t + 1], triangles[3 * t + 2]];
    const [x0, y0, x1, y1, x2, y2] = [x(ids[0]), y(ids[0]), x(ids[1]), y(ids[1]), x(ids[2]), y(ids[2])];
    // Squared edge lengths, each opposite a vertex, and the shortest edge
    const l = [
      (x2 - x1) ** 2 + (y2 - y1) ** 2,
      (x0 - x2) ** 2 + (y0 - y2) ** 2,
      (x1 - x0) ** 2 + (y1 - y0) ** 2,
    ];
    let k = 0;
    if (l[1] < l[k]) k = 1;
    if (l[2] < l[k]) k = 2;
    const i = (k + 1) % 3;
    const j = (k + 2) % 3;
    const area = Math.abs((x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)) / 2;
    let bad = areaLimit !== null && area > areaLimit((x0 + x1 + x2) / 3, (y0 + y1 + y2) / 3);
    if (!bad && cosMinAngle < 1) {
      // The smallest angle is opposite the shortest edge
      const cosAngle = (l[i] + l[j] - l[k]) / (2 * Math.sqrt(l[i] * l[j]));
      bad = cosAngle > cosMinAngle && !onSameShell(ids[i], ids[j]);
    }
    if (!bad) continue;

    // Circumcenter
    const ex = x1 - x0;
    const ey = y1 - y0;
    const fx = x2 - x0;
    const fy = y2 - y0;
    const d = 2 * (ex * fy - ey * fx);
    if (d === 0) continue;
    const bl = ex * ex + ey * ey;
    const cl = fx * fx + fy * fy;
    const ccx = x0 + (fy * bl - ey * cl) / d;
    const ccy = y0 + (ex * cl - fx * bl) / d;
    const radius = Math.hypot(ccx - x0, ccy - y0);
    if (!Number.isFinite(radius)) continue;
    // Off-center: on the bisector of the shortest edge, nearer to it than the circumcenter when that is far
    let tx = ccx;
    let ty = ccy;
    if (offConstant > 0) {
      const mx = (x(ids[i]) + x(ids[j])) / 2;
      const my = (y(ids[i]) + y(ids[j])) / 2;
      const distance = Math.hypot(ccx - mx, ccy - my);
      const off = offConstant * Math.sqrt(l[k]);
      if (off < distance) {
        tx = mx + ((ccx - mx) / distance) * off;
        ty = my + ((ccy - my) / distance) * off;
      }
    }
    candidates.push({ t, radius, x: tx, y: ty });
  }
  // Largest triangles first, which grades the mesh from coarse to fine
  candidates.sort((p, q) => q.radius - p.radius);

  // Straight walk from the center of a triangle to a point, stopping at a segment
  const side = (a, b, px, py) => orient2d(x(a), y(a), x(b), y(b), px, py) * orientSign;
  const walk = (start, px, py) => {
    const ids = [triangles[3 * start], triangles[3 * start + 1], triangles[3 * start + 2]];
    const sx = (x(ids[0]) + x(ids[1]) + x(ids[2])) / 3;
    const sy = (y(ids[0]) + y(ids[1]) + y(ids[2])) / 3;
    let t = start;
    for (let step = 0; step < 3 * triangleCount; step++) {
      let exit = -1;
      for (let k = 0; k < 3; k++) {
        const e = 3 * t + k;
        const u = triangles[e];
        const v = triangles[nextHalfedge(e)];
        if (side(u, v, px, py) >= 0) continue; // The point is not beyond this edge
        const ou = orient2d(sx, sy, px, py, x(u), y(u));
        const ov = orient2d(sx, sy, px, py, x(v), y(v));
        if (ou * ov <= 0) {
          exit = e;
          break;
        }
      }
      if (exit === -1) return { triangle: t };
      if (segmentOfHalfedge[exit] !== -1) return { segment: segmentOfHalfedge[exit] };
      if (halfedges[exit] === -1) return {};
      t = (halfedges[exit] / 3) | 0;
    }
    return {};
  };

  // The cavity of a point: the triangles whose circumcircle holds it, reached without crossing a segment, with
  // the segments on its border. A point at an existing vertex is reported
  const closeTolerance2 = (1e-10 * scale) ** 2;
  const inCircumcircle = (t, px, py) => {
    const [a, b, c] = [triangles[3 * t], triangles[3 * t + 1], triangles[3 * t + 2]];
    return incircle(x(a), y(a), x(b), y(b), x(c), y(c), px, py) * incircleSign >= 0;
  };
  const cavityOf = (start, px, py) => {
    const found = [start];
    const seen = new Set(found);
    const borderSegments = new Set();
    const stack = [start];
    let atVertex = false;
    while (stack.length) {
      const t = stack.pop();
      for (let k = 0; k < 3; k++) {
        const e = 3 * t + k;
        const u = triangles[e];
        if ((x(u) - px) ** 2 + (y(u) - py) ** 2 < closeTolerance2) atVertex = true;
        if (segmentOfHalfedge[e] !== -1) {
          borderSegments.add(segmentOfHalfedge[e]);
          continue;
        }
        if (halfedges[e] === -1) continue;
        const v = (halfedges[e] / 3) | 0;
        if (!seen.has(v) && inCircumcircle(v, px, py)) {
          seen.add(v);
          found.push(v);
          stack.push(v);
        }
      }
    }
    return { triangles: found, borderSegments, atVertex };
  };
  const encroaches = (s, px, py) => {
    const { a, b } = segments[s];
    return (x(a) - px) * (x(b) - px) + (y(a) - py) * (y(b) - py) < 0;
  };

  // Vertices accepted in this pass, on a grid to refuse one at the position of another
  const cell = 1e-9 * scale;
  const accepted = [];
  const acceptedAt = new Map();
  const nearAccepted = (px, py) => {
    const cx = Math.floor(px / cell);
    const cy = Math.floor(py / cell);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        for (const [qx, qy] of acceptedAt.get(`${cx + i},${cy + j}`) ?? []) {
          if ((qx - px) ** 2 + (qy - py) ** 2 < cell * cell) return true;
        }
      }
    }
    return false;
  };

  for (const candidate of candidates) {
    if (dead[candidate.t]) continue;
    const { x: px, y: py } = candidate;
    const location = walk(candidate.t, px, py);
    if (location.segment !== undefined) {
      // Beyond a segment (outside the domain or across it): split the segment instead
      splitSegment(location.segment);
      continue;
    }
    if (location.triangle === undefined) continue; // The walk failed; the triangle is seen again next pass
    const cavity = cavityOf(location.triangle, px, py);
    if (cavity.atVertex) continue;
    const encroached = [...cavity.borderSegments].filter((s) => encroaches(s, px, py));
    if (encroached.length > 0) {
      encroached.forEach(splitSegment);
      continue;
    }
    if (nearAccepted(px, py)) continue;
    cavity.triangles.forEach((t) => (dead[t] = 1));
    accepted.push([px, py]);
    const key = `${Math.floor(px / cell)},${Math.floor(py / cell)}`;
    if (!acceptedAt.has(key)) acceptedAt.set(key, []);
    acceptedAt.get(key).push([px, py]);
  }

  // Insert the accepted vertices
  for (const [px, py] of accepted) {
    vertices.x.push(px);
    vertices.y.push(py);
    vertices.kind.push(FREE);
    vertices.parent.push(-1);
  }

  // Split the segments: at the midpoint, or, from a corner of the input, at a concentric shell (a power of two
  // that splits the segment most evenly), so that the segments meeting at the corner get vertices at the same
  // distances from it
  for (const s of toSplit) {
    const { a, b, parent: parentSegment } = segments[s];
    const cornerA = kind[a] === CORNER;
    const cornerB = kind[b] === CORNER;
    let fraction = 0.5;
    if (cornerA || cornerB) {
      const length = Math.hypot(x(b) - x(a), y(b) - y(a));
      let shell = 1;
      while (length > 3 * shell) shell *= 2;
      while (length < 1.5 * shell) shell /= 2;
      fraction = shell / length;
      if (cornerB && !cornerA) fraction = 1 - fraction;
    }
    vertices.x.push(x(a) + fraction * (x(b) - x(a)));
    vertices.y.push(y(a) + fraction * (y(b) - y(a)));
    vertices.kind.push(SEGMENT);
    vertices.parent.push(parentSegment);
    const m = vertices.x.length - 1;
    segments[s] = { a, b: m, parent: parentSegment };
    segments.push({ a: m, b, parent: parentSegment });
  }

  return accepted.length + toSplit.size;
}

// ───────────────────────────────── Output ─────────────────────────────────

/**
 * Function to write the final triangulation in the format of importGmshMesh: counter-clockwise triangles in the
 * Gmsh node order, with the boundary lines by physical tag
 */
function toParsedMesh({ vertices, segments, inputSegments, physicalPropMap, options }, triangulation) {
  const { triangles, triangleCount, inside } = triangulation;
  const quadratic = options.elementOrder === "quadratic";

  // Nodes, numbered from 1 in the order they are met
  const nodeOf = new Int32Array(vertices.x.length);
  const nodesXCoordinates = [];
  const nodesYCoordinates = [];
  const nodeNumber = (v) => {
    if (nodeOf[v] === 0) {
      nodesXCoordinates.push(vertices.x[v]);
      nodesYCoordinates.push(vertices.y[v]);
      nodeOf[v] = nodesXCoordinates.length;
    }
    return nodeOf[v];
  };

  const triangleElements = [];
  for (let t = 0; t < triangleCount; t++) {
    if (!inside[t]) continue;
    let [a, b, c] = [triangles[3 * t], triangles[3 * t + 1], triangles[3 * t + 2]];
    const signedArea =
      (vertices.x[b] - vertices.x[a]) * (vertices.y[c] - vertices.y[a]) -
      (vertices.x[c] - vertices.x[a]) * (vertices.y[b] - vertices.y[a]);
    if (signedArea < 0) [b, c] = [c, b];
    triangleElements.push([nodeNumber(a), nodeNumber(b), nodeNumber(c)]);
  }

  const boundaryNodePairs = {};
  segments.forEach(({ a, b, parent }) => {
    const { tag } = inputSegments[parent];
    if (!boundaryNodePairs[tag]) boundaryNodePairs[tag] = [];
    boundaryNodePairs[tag].push([nodeNumber(a), nodeNumber(b)]);
  });

  // Quadratic elements: a node at the middle of each edge, shared by the elements on it; Gmsh order (corners,
  // then the middles of the edges 0-1, 1-2 and 2-0), and the middle node third in a boundary line
  if (quadratic) {
    const cornerNodes = nodesXCoordinates.length;
    const middles = new Map();
    const middleNode = (p, q) => {
      const key = p < q ? p * cornerNodes + q : q * cornerNodes + p;
      if (!middles.has(key)) {
        nodesXCoordinates.push((nodesXCoordinates[p - 1] + nodesXCoordinates[q - 1]) / 2);
        nodesYCoordinates.push((nodesYCoordinates[p - 1] + nodesYCoordinates[q - 1]) / 2);
        middles.set(key, nodesXCoordinates.length);
      }
      return middles.get(key);
    };
    triangleElements.forEach((element) => {
      element.push(
        middleNode(element[0], element[1]),
        middleNode(element[1], element[2]),
        middleNode(element[2], element[0]),
      );
    });
    Object.values(boundaryNodePairs).forEach((pairs) => {
      pairs.forEach((pair) => pair.push(middleNode(pair[0], pair[1])));
    });
  }

  const boundaryConditions = physicalPropMap
    .filter(({ tag }) => boundaryNodePairs[tag]?.length > 0)
    .map(({ name, tag }) => ({ name, tag, nodes: boundaryNodePairs[tag] }));

  return {
    nodesXCoordinates,
    nodesYCoordinates,
    nodalNumbering: { quadElements: [], triangleElements },
    boundaryElements: [],
    boundaryConditions,
    boundaryNodePairs,
    gmshV: 0,
    ascii: true,
    fltBytes: "8",
    totalNodesX: nodesXCoordinates.length,
    totalNodesY: nodesXCoordinates.length,
    physicalPropMap: [...physicalPropMap, { tag: physicalPropMap.length + 1, dimension: 2, name: "domain" }],
    elementTypes: { [quadratic ? 8 : 1]: segments.length, [quadratic ? 9 : 2]: triangleElements.length },
    meshDimension: "2D",
    elementOrder: options.elementOrder,
  };
}
