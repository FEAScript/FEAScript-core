/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to check the mesh configuration of setMeshConfig: the kind of elements, their order, and their
 * size or number
 * @param {object} meshConfig - `{ elements, elementOrder, size, divisions, minAngle, maxNodes }`
 * @returns {object} A copy with the defaults filled in
 * @throws {FEAScriptError} "INVALID_INPUT", listing every problem found
 */
export function readMeshConfig(meshConfig: object): object;
/**
 * Function to generate the mesh of a geometry with a mesh configuration
 * @param {object} geometry - The geometry of setGeometry (raw or normalized)
 * @param {object} meshConfig - The mesh configuration of setMeshConfig
 * @returns {object} The mesh object, as setMesh takes it
 */
export function generateMesh(geometry: object, meshConfig: object): object;
/**
 * Function to check that a value is a mesh object, and to convert a mesh of importGmshMesh to it
 * @param {object} mesh - A mesh object, or the result of importGmshMesh
 * @returns {object} The mesh object
 * @throws {FEAScriptError} "INVALID_INPUT" for anything else
 */
export function readMesh(mesh: object): object;
/**
 * Function to get the mesh object of a model, or of the plain object that FEAScriptWorker.getModelInfo() returns
 * (with `mesh`, or `geometry` and `meshConfig`), so that plots work with both
 * @param {object} model - A FEAScriptModel or the model information of a worker
 * @returns {object} The mesh object
 */
export function getModelMesh(model: object): object;
/**
 * Function to get the dimension of the mesh of a model, or of the model information of a worker
 * @param {object} model - A FEAScriptModel or the model information of a worker
 * @returns {string} "1D" or "2D"
 */
export function getModelMeshDimension(model: object): string;
/**
 * Function to prepare the mesh of a model for the finite element analysis
 * @param {object} model - The FEAScriptModel (its getMesh() gives the mesh object, generating it if needed), or
 *  the model information of a worker
 * @returns {object} An object containing all mesh-related data: the mesh object's fields, plus `nop` (the
 *  nodal numbering), `totalNodes` and `totalElements`
 */
export function prepareMesh(model: object): object;
/**
 * Function that finds the list of adjacent elements for each node in the mesh
 * @param {object} meshData - Object containing nodal numbering (NOP)
 * @returns {object} Object containing:
 *  - nodeNeighbors: Indices of neighboring elements per node
 *  - neighborCount: Total number of neighboring elements per node
 */
export function computeNodeNeighbors(meshData: object): object;
/**
 * Function to extracts boundary line segments for ray casting
 * @param {object} meshData - Object containing mesh data
 * @returns {array} Array of segments
 */
export function getBoundarySegments(meshData: object): array;
