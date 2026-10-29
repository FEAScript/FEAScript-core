/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { getBoundarySides } from "../elements/basisFunctions.js";
import { Mesh1D, Mesh2D } from "./meshGeneration.js";
import { debugLog, errorLog } from "../utilities/logging.js";
/**
 * Function to prepare the mesh for finite element analysis
 * @param {object} meshConfig - Object containing computational mesh details
 * @returns {object} An object containing all mesh-related data
 */
export function prepareMesh(meshConfig) {
  const {
    meshDimension,
    numElementsX,
    numElementsY,
    maxX,
    maxY,
    elementOrder: configElementOrder,
    parsedMesh,
    angleLeft,
    angleRight,
  } = meshConfig;

  // For a parsed mesh (e.g., from a Gmsh .msh import) the element order is taken from the mesh itself
  const parsedElementOrder = parsedMesh?.elementOrder;
  if (parsedElementOrder && configElementOrder && configElementOrder !== parsedElementOrder) {
    errorLog(
      `elementOrder is '${configElementOrder}' but the imported mesh contains ${parsedElementOrder} elements. Remove elementOrder from the mesh configuration; it is detected from the mesh.`,
    );
  }
  const elementOrder = parsedElementOrder ?? configElementOrder ?? "linear";

  // Create a new instance of the Mesh class
  let mesh;
  if (meshDimension === "1D") {
    mesh = new Mesh1D({ numElementsX, maxX, elementOrder, parsedMesh });
  } else if (meshDimension === "2D") {
    mesh = new Mesh2D({
      numElementsX,
      maxX,
      numElementsY,
      maxY,
      elementOrder,
      parsedMesh,
      angleLeft,
      angleRight,
    });
  } else {
    errorLog("Mesh dimension must be either '1D' or '2D'");
  }

  // Use the parsed mesh (e.g., from a Gmsh .msh import) if provided. Otherwise, generate a structured mesh
  const nodesCoordinatesAndNumbering = mesh.boundaryElementsProcessed ? mesh.parsedMesh : mesh.generateMesh();

  // Extract nodes coordinates and nodal numbering (NOP) from the mesh data
  let nodesXCoordinates = nodesCoordinatesAndNumbering.nodesXCoordinates;
  let nodesYCoordinates = nodesCoordinatesAndNumbering.nodesYCoordinates;
  let totalNodesX = nodesCoordinatesAndNumbering.totalNodesX;
  let totalNodesY = nodesCoordinatesAndNumbering.totalNodesY;
  let nop = nodesCoordinatesAndNumbering.nodalNumbering;
  let boundaryElements = nodesCoordinatesAndNumbering.boundaryElements;
  // Element shape for 2D meshes ('quad' or 'triangle'); meshes generated from geometry are always quads
  const elementShape = nodesCoordinatesAndNumbering.elementShape ?? "quad";

  // Check the mesh type
  const isParsedMesh = parsedMesh !== undefined && parsedMesh !== null;

  // Calculate totalElements and totalNodes based on mesh type
  let totalElements, totalNodes;

  if (isParsedMesh) {
    totalElements = nop.length; // Number of elements is the length of the nodal numbering array
    totalNodes = nodesXCoordinates.length; // Number of nodes is the length of the coordinates array
    debugLog(`Using parsed mesh with ${totalElements} elements and ${totalNodes} nodes`);
  } else {
    // For structured mesh, calculate based on dimensions
    totalElements = numElementsX * (meshDimension === "2D" ? numElementsY : 1);
    totalNodes = totalNodesX * (meshDimension === "2D" ? totalNodesY : 1);
    debugLog(`Using mesh generated from geometry with ${totalElements} elements and ${totalNodes} nodes`);
  }

  return {
    nodesXCoordinates,
    nodesYCoordinates,
    totalNodesX,
    totalNodesY,
    nop,
    boundaryElements,
    totalElements,
    totalNodes,
    meshDimension,
    elementOrder,
    elementShape,
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
  let boundaryLineElements = [];
  let boundaryNodesSegments = [];
  let boundaryGlobalElementIndex = 0;
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

  // Iterate over all boundaries
  for (let boundaryIndex = 0; boundaryIndex < boundaryElements.length; boundaryIndex++) {
    // Iterate over all elements in the current boundary
    for (
      let boundaryLocalElementIndex = 0;
      boundaryLocalElementIndex < boundaryElements[boundaryIndex].length;
      boundaryLocalElementIndex++
    ) {
      boundaryLineElements[boundaryGlobalElementIndex] =
        boundaryElements[boundaryIndex][boundaryLocalElementIndex];
      boundaryGlobalElementIndex++;
      // Retrieve the element index and the side
      const [elementIndex, side] = boundaryElements[boundaryIndex][boundaryLocalElementIndex];
      let boundaryLocalNodeIndices = boundarySides[side];
      let currentElementNodesX = [];
      let currentElementNodesY = [];

      for (
        let boundaryLocalNodeIndex = 0;
        boundaryLocalNodeIndex < boundaryLocalNodeIndices.length;
        boundaryLocalNodeIndex++
      ) {
        const globalNodeIndex = nop[elementIndex][boundaryLocalNodeIndices[boundaryLocalNodeIndex]] - 1;

        currentElementNodesX.push(nodesXCoordinates[globalNodeIndex]);
        currentElementNodesY.push(nodesYCoordinates[globalNodeIndex]);
      }

      // Create segments for this element
      for (let k = 0; k < currentElementNodesX.length - 1; k++) {
        boundaryNodesSegments.push([
          [currentElementNodesX[k], currentElementNodesY[k]],
          [currentElementNodesX[k + 1], currentElementNodesY[k + 1]],
        ]);
      }
    }
  }
  return boundaryNodesSegments;
}
