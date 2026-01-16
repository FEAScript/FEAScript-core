/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Function to import mesh data from Gmsh (.msh v4.1) containing quadrilateral and triangular elements
 * @param {File} file
 * @returns {object}
 */
const importGmshQuadTri = async (file) => {
  let result = {
    nodesXCoordinates: [],
    nodesYCoordinates: [],
    nodalNumbering: {
      quadElements: [],
      triangleElements: [],
    },
    boundaryElements: [],
    boundaryConditions: [],
    boundaryNodePairs: {},
    gmshV: 0,
    ascii: false,
    fltBytes: "8",
    totalNodesX: 0,
    totalNodesY: 0,
    physicalPropMap: [],
    elementTypes: {},
  };

  // Entities to physical tags map
  const entityPhysicalMap = { curves: {} };

  let content = await file.text();
  let lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");

  let section = "";
  let lineIndex = 0;

  // Nodes
  let nodeEntityBlocks = 0;
  let totalNodes = 0;
  let nodeBlocksProcessed = 0;
  let currentNodeBlock = { numNodes: 0 };
  let nodeTags = [];
  let nodeTagsCollected = 0;
  let nodeCoordinatesCollected = 0;

  // Elements
  let elementEntityBlocks = 0;
  let totalElements = 0;
  let elementBlocksProcessed = 0;
  let currentElementBlock = { numElements: 0 };
  let elementsProcessedInBlock = 0;

  let boundaryElementsByTag = {};

  // Entities helpers
  let entityCounts = null;
  let entitiesPhase = null;
  let processedPoints = 0;
  let processedCurves = 0;
  let processedSurfaces = 0;
  let processedVolumes = 0;

  while (lineIndex < lines.length) {
    const line = lines[lineIndex];

    // Section switches
    if (line === "$MeshFormat") {
      section = "meshFormat";
      lineIndex++;
      continue;
    }
    if (line === "$EndMeshFormat") {
      section = "";
      lineIndex++;
      continue;
    }
    if (line === "$PhysicalNames") {
      section = "physicalNames";
      lineIndex++;
      continue;
    }
    if (line === "$EndPhysicalNames") {
      section = "";
      lineIndex++;
      continue;
    }
    if (line === "$Entities") {
      section = "entities";
      entitiesPhase = "counts";
      lineIndex++;
      continue;
    }
    if (line === "$EndEntities") {
      section = "";
      entityCounts = null;
      entitiesPhase = null;
      lineIndex++;
      continue;
    }
    if (line === "$Nodes") {
      section = "nodes";
      lineIndex++;
      continue;
    }
    if (line === "$EndNodes") {
      section = "";
      lineIndex++;
      continue;
    }
    if (line === "$Elements") {
      section = "elements";
      lineIndex++;
      continue;
    }
    if (line === "$EndElements") {
      section = "";
      lineIndex++;
      continue;
    }

    const parts = line.split(/\s+/);

    // Mesh format
    if (section === "meshFormat") {
      result.gmshV = parseFloat(parts[0]);
      result.ascii = parts[1] === "0";
      result.fltBytes = parts[2];
    }

    // Physical names
    else if (section === "physicalNames") {
      const dimension = parseInt(parts[0], 10);
      const tag = parseInt(parts[1], 10);
      let name = parts.slice(2).join(" ").replace(/^"|"$/g, "");

      result.physicalPropMap.push({ tag, dimension, name });
    }

    // Entities
    else if (section === "entities") {
      if (entitiesPhase === "counts") {
        entityCounts = {
          points: parseInt(parts[0], 10),
          curves: parseInt(parts[1], 10),
          surfaces: parseInt(parts[2], 10),
          volumes: parseInt(parts[3], 10),
        };
        entitiesPhase = "points";
      } else if (entitiesPhase === "points") {
        processedPoints++;
        if (processedPoints === entityCounts.points) entitiesPhase = "curves";
      } else if (entitiesPhase === "curves") {
        const tag = parseInt(parts[0], 10);
        const numPhysical = parseInt(parts[7], 10);
        const physTags = parts.slice(8, 8 + numPhysical).map((p) => parseInt(p, 10));
        entityPhysicalMap.curves[tag] = physTags;
        processedCurves++;
        if (processedCurves === entityCounts.curves) entitiesPhase = "surfaces";
      } else if (entitiesPhase === "surfaces") {
        processedSurfaces++;
        if (processedSurfaces === entityCounts.surfaces) entitiesPhase = "volumes";
      } else if (entitiesPhase === "volumes") {
        processedVolumes++;
      }
    }

    // Nodes
    else if (section === "nodes") {
      if (nodeEntityBlocks === 0) {
        nodeEntityBlocks = parseInt(parts[0], 10);
        totalNodes = parseInt(parts[1], 10);
        result.nodesXCoordinates = new Array(totalNodes).fill(0);
        result.nodesYCoordinates = new Array(totalNodes).fill(0);
      } else if (nodeBlocksProcessed < nodeEntityBlocks && currentNodeBlock.numNodes === 0) {
        currentNodeBlock = {
          dim: parseInt(parts[0], 10),
          tag: parseInt(parts[1], 10),
          parametric: parseInt(parts[2], 10),
          numNodes: parseInt(parts[3], 10),
        };
        nodeTags = [];
        nodeTagsCollected = 0;
        nodeCoordinatesCollected = 0;
      } else if (nodeTagsCollected < currentNodeBlock.numNodes) {
        for (let p of parts) {
          nodeTags.push(parseInt(p, 10));
          nodeTagsCollected++;
          if (nodeTagsCollected === currentNodeBlock.numNodes) break;
        }
      } else if (nodeCoordinatesCollected < currentNodeBlock.numNodes) {
        const nodeTag = nodeTags[nodeCoordinatesCollected] - 1;
        result.nodesXCoordinates[nodeTag] = parseFloat(parts[0]);
        result.nodesYCoordinates[nodeTag] = parseFloat(parts[1]);
        result.totalNodesX++;
        result.totalNodesY++;
        nodeCoordinatesCollected++;
        if (nodeCoordinatesCollected === currentNodeBlock.numNodes) {
          nodeBlocksProcessed++;
          currentNodeBlock = { numNodes: 0 };
        }
      }
    }

    // Elements
    else if (section === "elements") {
      if (elementEntityBlocks === 0) {
        elementEntityBlocks = parseInt(parts[0], 10);
        totalElements = parseInt(parts[1], 10);
      } else if (elementBlocksProcessed < elementEntityBlocks && currentElementBlock.numElements === 0) {
        currentElementBlock = {
          dim: parseInt(parts[0], 10),
          tag: parseInt(parts[1], 10), // entity tag
          elementType: parseInt(parts[2], 10),
          numElements: parseInt(parts[3], 10),
        };

        result.elementTypes[currentElementBlock.elementType] =
          (result.elementTypes[currentElementBlock.elementType] || 0) + currentElementBlock.numElements;

        elementsProcessedInBlock = 0;
      } else if (elementsProcessedInBlock < currentElementBlock.numElements) {
        const nodeIndices = parts.slice(1).map((n) => parseInt(n, 10));

        // Resolve physical tag via entity → physical map
        let physicalTag = currentElementBlock.tag;
        if (currentElementBlock.dim === 1) {
          const mapped = entityPhysicalMap.curves[currentElementBlock.tag];
          if (mapped && mapped.length > 0) physicalTag = mapped[0];
        }

        if (currentElementBlock.elementType === 1 || currentElementBlock.elementType === 8) {
          // 1: 2-node line.
          // 8: 3-node second order line (2 nodes associated with the vertices and 1 with the edge).
          if (!boundaryElementsByTag[physicalTag]) boundaryElementsByTag[physicalTag] = [];
          boundaryElementsByTag[physicalTag].push(nodeIndices);

          if (!result.boundaryNodePairs[physicalTag]) result.boundaryNodePairs[physicalTag] = [];
          result.boundaryNodePairs[physicalTag].push(nodeIndices);
        } else if (currentElementBlock.elementType === 2 || currentElementBlock.elementType === 9) {
          // 2: 3-node triangle.
          // 9: 6-node second order triangle (3 nodes associated with the vertices and 3 with the edges).
          result.nodalNumbering.triangleElements.push(nodeIndices);
        } else if (currentElementBlock.elementType === 3 || currentElementBlock.elementType === 10) {
          // 3: 4-node quadrangle.
          // 10: 9-node second order quadrangle (4 nodes associated with the vertices, 4 with the edges and 1 with the face).
          result.nodalNumbering.quadElements.push(nodeIndices);
        }

        elementsProcessedInBlock++;
        if (elementsProcessedInBlock === currentElementBlock.numElements) {
          elementBlocksProcessed++;
          currentElementBlock = { numElements: 0 };
        }
      }
    }

    lineIndex++;
  }

  // Boundary conditions
  result.physicalPropMap.forEach((prop) => {
    if (prop.dimension === 1) {
      const nodes = boundaryElementsByTag[prop.tag] || [];
      if (nodes.length > 0) {
        result.boundaryConditions.push({
          name: prop.name,
          tag: prop.tag,
          nodes,
        });
      }
    }
  });

  debugLog(`Parsed boundary node pairs by physical tag: ${JSON.stringify(result.boundaryNodePairs)}`);

  return result;
};

export { importGmshQuadTri };
