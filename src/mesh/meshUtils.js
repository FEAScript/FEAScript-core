/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { getBoundarySides } from "../elements/basisFunctions.js";
import { toMeshObject } from "../io/gmshReader.js";
import { readGeometry, shown } from "./geometry.js";
import { generateLineMesh, generateQuadrilateralMesh } from "./structuredMesh.js";
import { generateTriangleMesh } from "./triangleMesh.js";
import { FEAScriptError } from "../utilities/errors.js";
import { debugLog } from "../utilities/logging.js";

/**
 * Function to check the mesh configuration of setMeshConfig: the kind of elements, their order, and their
 * size or number
 * @param {object} meshConfig - `{ elements, elementOrder, size, divisions, minAngle, maxNodes }`
 * @returns {object} A copy with the defaults filled in
 * @throws {FEAScriptError} "INVALID_INPUT", listing every problem found
 */
export function readMeshConfig(meshConfig) {
  const problems = [];
  if (!meshConfig || typeof meshConfig !== "object" || Array.isArray(meshConfig)) {
    throw new FEAScriptError(
      "INVALID_INPUT",
      `The mesh configuration must be an object, e.g. { elements: "triangles", elementOrder: "quadratic", size: 0.1 }; got ${shown(
        meshConfig,
      )}.`,
    );
  }
  const known = ["elements", "elementOrder", "size", "divisions", "minAngle", "maxNodes"];
  Object.keys(meshConfig)
    .filter((key) => !known.includes(key))
    .forEach((key) => problems.push(`Unknown mesh setting ${key}. Settings: ${known.join(", ")}.`));
  const { elements, elementOrder = "linear", size, divisions, minAngle, maxNodes } = meshConfig;
  if (elements !== undefined && elements !== "quadrilaterals" && elements !== "triangles") {
    problems.push(`elements must be "quadrilaterals" or "triangles"; got ${shown(elements)}.`);
  }
  if (elementOrder !== "linear" && elementOrder !== "quadratic") {
    problems.push(`elementOrder must be "linear" or "quadratic"; got ${shown(elementOrder)}.`);
  }
  if (size === undefined && divisions === undefined) {
    problems.push(
      "The mesh needs a size (the length of an element side) or divisions (the number of elements).",
    );
  }
  if (size !== undefined && divisions !== undefined) {
    problems.push("Give the mesh a size or divisions, not both.");
  }
  if (size !== undefined && typeof size !== "function" && !(Number.isFinite(size) && size > 0)) {
    problems.push(`size must be a positive number or a function (x, y) => size; got ${shown(size)}.`);
  }
  if (elements === "triangles" && divisions !== undefined) {
    problems.push("divisions is for quadrilateral and 1D elements; give triangles a size.");
  }
  if (minAngle !== undefined && elements !== "triangles") {
    problems.push('minAngle is a setting of elements: "triangles".');
  }
  if (maxNodes !== undefined && elements !== "triangles") {
    problems.push('maxNodes is a setting of elements: "triangles".');
  }
  FEAScriptError.throwIfAny("INVALID_INPUT", problems);
  return { ...meshConfig, elementOrder };
}

/**
 * Function to generate the mesh of a geometry with a mesh configuration
 * @param {object} geometry - The geometry of setGeometry (raw or normalized)
 * @param {object} meshConfig - The mesh configuration of setMeshConfig
 * @returns {object} The mesh object, as setMesh takes it
 */
export function generateMesh(geometry, meshConfig) {
  const normalized = geometry?.kind ? geometry : readGeometry(geometry);
  const config = readMeshConfig(meshConfig);
  const { elements, elementOrder, size, divisions, minAngle, maxNodes } = config;
  if (normalized.meshDimension === "1D") {
    if (elements !== undefined) {
      debugLog(`elements: "${elements}" is ignored for a line, which has 1D elements`);
    }
    if (typeof size === "function") {
      throw new FEAScriptError("INVALID_INPUT", "size must be a number for a line.");
    }
    return generateLineMesh(normalized.length, { elementOrder, size, divisions });
  }
  if ((elements ?? "quadrilaterals") === "quadrilaterals") {
    return generateQuadrilateralMesh(normalized, { elementOrder, size, divisions });
  }
  return generateTriangleMesh(normalized, { elementOrder, size, minAngle, maxNodes });
}

/**
 * Function to check that a value is a mesh object, and to convert a mesh of importGmshMesh to it
 * @param {object} mesh - A mesh object, or the result of importGmshMesh
 * @returns {object} The mesh object
 * @throws {FEAScriptError} "INVALID_INPUT" for anything else
 */
export function readMesh(mesh) {
  if (!mesh || typeof mesh !== "object") {
    throw new FEAScriptError(
      "INVALID_INPUT",
      `setMesh takes the mesh of importGmshMesh, generateTriangleMesh or generateQuadrilateralMesh; got ${shown(
        mesh,
      )}.`,
    );
  }
  if (mesh.gmshV !== undefined || mesh.boundaryNodePairs !== undefined) return toMeshObject(mesh);
  const problems = [];
  if (!Array.isArray(mesh.nodesXCoordinates)) problems.push("nodesXCoordinates is missing.");
  if (!Array.isArray(mesh.nodalNumbering)) problems.push("nodalNumbering is missing.");
  if (!mesh.boundaryElements || typeof mesh.boundaryElements !== "object") {
    problems.push("boundaryElements is missing.");
  }
  if (mesh.meshDimension !== "1D" && mesh.meshDimension !== "2D") {
    problems.push(`meshDimension must be "1D" or "2D"; got ${shown(mesh.meshDimension)}.`);
  }
  if (problems.length > 0) {
    throw new FEAScriptError(
      "INVALID_INPUT",
      `The mesh is not a FEAScript mesh object: ${problems.join(
        " ",
      )} Use importGmshMesh, generateTriangleMesh or generateQuadrilateralMesh.`,
      problems,
    );
  }
  return mesh;
}

/**
 * Function to prepare the mesh of a model for the finite element analysis
 * @param {object} model - The FEAScriptModel (its getMesh() gives the mesh object, generating it if needed)
 * @returns {object} An object containing all mesh-related data: the mesh object's fields, plus `nop` (the
 *  nodal numbering), `totalNodes` and `totalElements`
 */
export function prepareMesh(model) {
  const mesh = model.getMesh();
  const nop = mesh.nodalNumbering;
  const totalNodes = mesh.nodesXCoordinates.length;
  return {
    ...mesh,
    nodesYCoordinates: mesh.nodesYCoordinates ?? [],
    elementShape: mesh.elementShape ?? (mesh.meshDimension === "1D" ? "line" : "quad"),
    nop,
    totalElements: nop.length,
    totalNodes,
    totalNodesX: mesh.totalNodesX ?? totalNodes,
    totalNodesY: mesh.totalNodesY ?? 1,
    aliases: mesh.aliases ?? {},
    // Imported boundaries with node pairs that are not on an element side, keyed by boundary name
    incompleteBoundaries: mesh.incompleteBoundaries ?? {},
  };
}

/**
 * Function that finds the list of adjacent elements for each node in the mesh
 * @param {object} meshData - Object containing nodal numbering (NOP)
 * @returns {object} Object containing:
 *  - nodeNeighbors: Indices of neighboring elements per node
 *  - neighborCount: Total number of neighboring elements per node
 */
export function computeNodeNeighbors(meshData) {
  const { nop, nodesXCoordinates } = meshData;
  const totalNodes = nodesXCoordinates.length;
  const nodesPerElement = nop[0].length;

  // Initialize arrays
  const nodeNeighbors = Array.from({ length: totalNodes }, () => []);
  const neighborCount = Array(totalNodes).fill(0);

  // Loop through all elements
  for (let elemIndex = 0; elemIndex < nop.length; elemIndex++) {
    for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
      const nodeIndex = nop[elemIndex][localNodeIndex] - 1;

      // Increment the total number of neighboring elements for this node
      neighborCount[nodeIndex] = neighborCount[nodeIndex] + 1;

      // Store the element index as a neighbor of this node
      nodeNeighbors[nodeIndex].push(elemIndex);
    }
  }

  return { nodeNeighbors, neighborCount };
}

/**
 * Function to extracts boundary line segments for ray casting
 * @param {object} meshData - Object containing mesh data
 * @returns {array} Array of segments
 */
export function getBoundarySegments(meshData) {
  let boundaryNodesSegments = [];
  const {
    nodesXCoordinates,
    nodesYCoordinates,
    nop,
    boundaryElements,
    meshDimension,
    elementOrder,
    elementShape,
  } = meshData;
  const boundarySides = getBoundarySides(meshDimension, elementOrder, elementShape);

  // Iterate over all boundaries, and over all elements in each boundary
  Object.values(boundaryElements).forEach((elementsOnBoundary) => {
    elementsOnBoundary.forEach(([elementIndex, side]) => {
      const boundaryLocalNodeIndices = boundarySides[side];
      const currentElementNodesX = [];
      const currentElementNodesY = [];
      boundaryLocalNodeIndices.forEach((localNodeIndex) => {
        const globalNodeIndex = nop[elementIndex][localNodeIndex] - 1;
        currentElementNodesX.push(nodesXCoordinates[globalNodeIndex]);
        currentElementNodesY.push(nodesYCoordinates[globalNodeIndex]);
      });
      // Create segments for this element
      for (let k = 0; k < currentElementNodesX.length - 1; k++) {
        boundaryNodesSegments.push([
          [currentElementNodesX[k], currentElementNodesY[k]],
          [currentElementNodesX[k + 1], currentElementNodesY[k + 1]],
        ]);
      }
    });
  });
  return boundaryNodesSegments;
}
