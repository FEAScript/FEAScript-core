/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

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
export function generateTriangleMesh(geometry: Geometry, { size, minAngle, elementOrder, maxNodes }?: {
    size?: number | ((x: number, y: number) => number) | undefined;
    minAngle?: number | undefined;
    elementOrder?: "linear" | "quadratic" | undefined;
    maxNodes?: number | undefined;
}): Mesh;
import type { Geometry } from "../types.js";
import type { Mesh } from "../types.js";
