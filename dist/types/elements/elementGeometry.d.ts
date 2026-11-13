/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */
/**
 * Function to test if a point is inside a triangle using barycentric coordinates,
 * also returning the natural coordinates (ksi, eta)
 * @param {number} x - X-coordinate of the point
 * @param {number} y - Y-coordinate of the point
 * @param {array} vertices - Triangle vertices [[x0,y0],[x1,y1],[x2,y2]]
 * @returns {object} Object containing inside boolean and natural coordinates {inside, ksi, eta}
 */
export function pointInsideTriangle(x: number, y: number, vertices: array): object;
/**
 * Function to test if a point is inside a triangular element, also returning the natural coordinates
 * (ksi, eta) of the FEAScript reference triangle
 * @param {number} x - X-coordinate of the point
 * @param {number} y - Y-coordinate of the point
 * @param {array} vertices - Triangle vertices in FEAScript order [[x0,y0],[x1,y1],[x2,y2]]
 * @returns {object} Object containing inside boolean and natural coordinates {inside, ksi, eta}
 */
export function pointInsideTriangularElement(x: number, y: number, vertices: array): object;
/**
 * Function to test if a point is inside a quadrilateral by spliting it into triangles and using barycentric coordinates
 * @param {number} x - X-coordinate of the point
 * @param {number} y - Y-coordinate of the point
 * @param {array} vertices - Quadrilateral vertices [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]
 * @returns {object} Object containing inside boolean and natural coordinates {inside, ksi, eta}
 */
export function pointInsideQuadrilateral(x: number, y: number, vertices: array): object;
/**
 * Function to locate a point in a 2D element, returning the natural coordinates (ksi, eta) of the point
 *
 * Linear elements have straight edges, so the triangle (barycentric) and quadrilateral (bilinear) tests are
 * enough. Quadratic elements may have curved edges (e.g. along a circular hole of a Gmsh mesh), where the corner
 * nodes do not describe the element: the point is located by inverting the full isoparametric mapping
 * x(ksi, eta) = sum of N_i(ksi, eta) x_i over all element nodes with Newton's method
 * @param {number} x - X-coordinate of the point
 * @param {number} y - Y-coordinate of the point
 * @param {array} elementNodes - Coordinates of all element nodes, in local node order [[x0,y0],[x1,y1],...]
 * @param {string} elementShape - The element shape, either 'quad' or 'triangle'
 * @param {object} basisFunctions - Instance of the BasisFunctions class for the element
 * @returns {object} Object containing inside boolean and natural coordinates {inside, ksi, eta}
 */
export function locatePointInElement(x: number, y: number, elementNodes: array, elementShape: string, basisFunctions: object): object;
/**
 * Function to split the quadrilateral elements into two triangles
 * @param {array} vertices - Quadrilateral vertices [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]
 * @returns {array} Array of triangle vertices: [[v0,v1,v3], [v0,v2,v3]]
 */
export function splitQuadrilateral(vertices: array): array;
