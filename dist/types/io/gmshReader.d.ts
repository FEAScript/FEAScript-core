/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to convert a mesh imported with importGmshMesh to the FEAScript mesh object, the form that
 * `model.setMesh(mesh)` takes: the nodal numbering in the FEAScript node order, and the boundary lines turned
 * into element sides, keyed by the name of their physical group (and, as aliases, by their tag minus one, the
 * keys of FEAScript 0.3)
 * @param {object} parsedMesh - Mesh data returned by importGmshMesh (or by a mesh generator in that form)
 * @returns {object} The mesh object
 */
export function toMeshObject(parsedMesh: object): object;
/** @import { Mesh } from "../types.js" */
/**
 * Function to import mesh data from Gmsh (.msh v4.1) containing quadrilateral and triangular elements
 * @param {Blob | { text(): Promise<string> }} file - The .msh file: a File or Blob, or any object with a text()
 *  method that resolves to the file contents
 * @returns {Promise<Mesh>} The mesh, for `model.setMesh(mesh)`
 */
export function importGmshMesh(file: Blob | {
    text(): Promise<string>;
}): Promise<Mesh>;
import type { Mesh } from "../types.js";
