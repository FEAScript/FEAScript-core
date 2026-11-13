/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to generate a mesh of a line, from x = 0 to x = length, with the boundaries "left" and "right"
 * @param {number} length - The length of the domain
 * @param {object} [options] - The mesh settings
 * @param {"linear" | "quadratic"} [options.elementOrder="linear"] - "linear" (2-node) or "quadratic" (3-node)
 *  elements
 * @param {number} [options.size] - The length of the elements (rounded to a whole number of elements)
 * @param {number} [options.divisions] - The number of elements, instead of `size`
 * @returns {Mesh} The mesh, for `model.setMesh(mesh)`
 * @throws {FEAScriptError} "INVALID_INPUT" for a setting out of range
 */
export function generateLineMesh(length: number, { elementOrder, size, divisions }?: {
    elementOrder?: "linear" | "quadratic" | undefined;
    size?: number | undefined;
    divisions?: number | undefined;
}): Mesh;
/**
 * Function to generate a mesh of quadrilateral elements in a four-sided shape: a grid of nx by ny elements
 * mapped onto the shape by its corners (a bilinear map), so that the rows of nodes run from the bottom side
 * to the top side and the columns from the left side to the right side. The nodes are numbered column by
 * column, along y first
 * @param {Geometry} geometry - The geometry (see geometry.js): a rectangle, or one shape of exactly four points
 *  without holes or points
 * @param {object} [options] - The mesh settings
 * @param {"linear" | "quadratic"} [options.elementOrder="linear"] - "linear" (4-node) or "quadratic" (9-node)
 *  elements
 * @param {number} [options.size] - The length of an element side; each side of the shape is divided into
 *  round(length / size) elements, the longer of two opposite sides deciding
 * @param {[number, number]} [options.divisions] - [nx, ny], the number of elements along the bottom and the left
 *  side, instead of `size`
 * @returns {Mesh} The mesh, for `model.setMesh(mesh)`
 * @throws {FEAScriptError} "INVALID_INPUT" for a shape that is not a quadrilateral or a setting out of range
 */
export function generateQuadrilateralMesh(geometry: Geometry, { elementOrder, size, divisions }?: {
    elementOrder?: "linear" | "quadratic" | undefined;
    size?: number | undefined;
    divisions?: [number, number] | undefined;
}): Mesh;
import type { Mesh } from "../types.js";
import type { Geometry } from "../types.js";
