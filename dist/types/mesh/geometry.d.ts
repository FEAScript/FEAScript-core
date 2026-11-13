/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to read one polygon of the input, in one of its three forms (see above), into its points and one
 * boundary name per edge (the edge i goes from point i to point i + 1, and the last edge closes the polygon)
 * @returns {object|null} `{ label, points, names }`, or null (with the problem recorded)
 */
export function readPolygon(value: any, label: any, defaultName: any, problems: any): object | null;
/**
 * Function to test whether two segments meet, including at a point of one of them
 */
export function segmentsMeet(ax: any, ay: any, bx: any, by: any, cx: any, cy: any, dx: any, dy: any): boolean;
/**
 * Function to locate a point against one polygon: 1 inside, 0 on its boundary, -1 outside (even-odd rule)
 */
export function locateInPolygon(points: any, x: any, y: any): 1 | 0 | -1;
/**
 * Function to test whether a point is inside the domain (even-odd rule over the outer polygon and the holes)
 */
export function insideLoops(loops: any, X: any, Y: any, x: any, y: any): boolean;
/**
 * Function to read and check the geometry given to setGeometry, and to turn it into one form: the dimension,
 * the length of a line, or the shape (one polygon, with its edge names), the holes and the points of a 2D
 * domain, with the aliases of the boundary names
 * @param {object} geometry - `{ line }`, `{ rectangle }` or `{ shape, holes, points }` (see above)
 * @returns {object} `{ meshDimension, length, shapes, holes, points, aliases, kind }`, with `kind` one of
 *  "line", "rectangle" and "polygon"
 * @throws {FEAScriptError} "INVALID_INPUT", listing every problem found
 */
export function readGeometry(geometry: object): object;
/**
 * Function to turn the mesh settings of FEAScript 0.3 (meshDimension, numElementsX, maxX, numElementsY, maxY,
 * angleLeft, angleRight) into a geometry and a mesh configuration of this version
 * @param {object} meshConfig - The old mesh configuration
 * @returns {object} `{ geometry, meshConfig }` in the new form
 */
export function translateOldMeshConfig(meshConfig: object): object;
export function isPoint(point: any): boolean;
export function shown(value: any): string;
