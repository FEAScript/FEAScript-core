/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { getBoundarySides } from "../elements/basisFunctions.js";
import { FEAScriptError } from "../utilities/errors.js";
import { debugLog, warnLog } from "../utilities/logging.js";

/** @import { Mesh } from "../types.js" */

/**
 * Function to import mesh data from Gmsh (.msh v4.1) containing quadrilateral and triangular elements
 * @param {Blob | { text(): Promise<string> }} file - The .msh file: a File or Blob, or any object with a text()
 *  method that resolves to the file contents
 * @returns {Promise<Mesh>} The mesh, for `model.setMesh(mesh)`
 */
const importGmshMesh = async (file) => {
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

  // Node tags with gaps are mapped to compact 1-based indices (null when tags are contiguous)
  let nodeTagToIndex = null;

  // Elements
  let elementEntityBlocks = 0;
  let elementBlocksProcessed = 0;
  let currentElementBlock = { numElements: 0 };
  let elementsProcessedInBlock = 0;
  let maxElementDimension = 0;

  let boundaryElementsByTag = {};

  // Entities helpers
  let entityCounts = null;
  let entitiesPhase = null;
  let processedPoints = 0;
  let processedCurves = 0;
  let processedSurfaces = 0;

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
      }
    }

    // Nodes
    else if (section === "nodes") {
      if (nodeEntityBlocks === 0) {
        nodeEntityBlocks = parseInt(parts[0], 10);
        totalNodes = parseInt(parts[1], 10);
        const maxNodeTag = parseInt(parts[3], 10);
        if (maxNodeTag !== totalNodes) {
          nodeTagToIndex = new Map();
          debugLog(
            `Gmsh node tags are not contiguous (max tag ${maxNodeTag}, ${totalNodes} nodes); renumbering`,
          );
        }
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
        let nodeIndex = nodeTags[nodeCoordinatesCollected] - 1;
        if (nodeTagToIndex) {
          nodeIndex = nodeTagToIndex.size;
          nodeTagToIndex.set(nodeTags[nodeCoordinatesCollected], nodeIndex + 1);
        }
        result.nodesXCoordinates[nodeIndex] = parseFloat(parts[0]);
        result.nodesYCoordinates[nodeIndex] = parseFloat(parts[1]);
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
      } else if (elementBlocksProcessed < elementEntityBlocks && currentElementBlock.numElements === 0) {
        currentElementBlock = {
          dim: parseInt(parts[0], 10),
          tag: parseInt(parts[1], 10), // entity tag
          elementType: parseInt(parts[2], 10),
          numElements: parseInt(parts[3], 10),
        };

        result.elementTypes[currentElementBlock.elementType] =
          (result.elementTypes[currentElementBlock.elementType] || 0) + currentElementBlock.numElements;
        maxElementDimension = Math.max(maxElementDimension, currentElementBlock.dim);

        elementsProcessedInBlock = 0;
      } else if (elementsProcessedInBlock < currentElementBlock.numElements) {
        let nodeIndices = parts.slice(1).map((n) => parseInt(n, 10));
        if (nodeTagToIndex) nodeIndices = nodeIndices.map((tag) => nodeTagToIndex.get(tag));

        // Resolve physical tag via entity → physical map
        let physicalTag = currentElementBlock.tag;
        if (currentElementBlock.dim === 1) {
          const mapped = entityPhysicalMap.curves[currentElementBlock.tag];
          if (mapped && mapped.length > 0) physicalTag = mapped[0];
        }

        if (currentElementBlock.elementType === 1 || currentElementBlock.elementType === 8) {
          if (!boundaryElementsByTag[physicalTag]) boundaryElementsByTag[physicalTag] = [];
          boundaryElementsByTag[physicalTag].push(nodeIndices);

          if (!result.boundaryNodePairs[physicalTag]) result.boundaryNodePairs[physicalTag] = [];
          result.boundaryNodePairs[physicalTag].push(nodeIndices);
        } else if (currentElementBlock.elementType === 2 || currentElementBlock.elementType === 9) {
          result.nodalNumbering.triangleElements.push(nodeIndices);
        } else if (currentElementBlock.elementType === 3 || currentElementBlock.elementType === 10) {
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

  // Detect the mesh dimension from the highest-dimensional elements (lower-dimensional ones are boundaries)
  result.meshDimension = `${maxElementDimension}D`;
  if (result.meshDimension !== "2D") {
    throw new FEAScriptError(
      "UNSUPPORTED_MESH",
      `The Gmsh mesh is ${result.meshDimension}; only 2D meshes (triangles and quadrilaterals) are supported yet.`,
    );
  }
  debugLog(`Detected mesh dimension from Gmsh mesh: ${result.meshDimension}`);

  // Detect the element order from the Gmsh element types (2/3: linear, 9/10: quadratic triangles/quads)
  const hasLinearElements = Boolean(result.elementTypes[2] || result.elementTypes[3]);
  const hasQuadraticElements = Boolean(result.elementTypes[9] || result.elementTypes[10]);
  if (hasLinearElements && hasQuadraticElements) {
    throw new FEAScriptError(
      "UNSUPPORTED_MESH",
      "Mixed linear and quadratic elements in the same Gmsh mesh are not supported.",
    );
  }
  result.elementOrder = hasQuadraticElements ? "quadratic" : "linear";
  debugLog(`Detected element order from Gmsh mesh: ${result.elementOrder}`);

  return result;
};

export { importGmshMesh };

/**
 * Function to convert a mesh imported with importGmshMesh to the FEAScript mesh object, the form that
 * `model.setMesh(mesh)` takes: the nodal numbering in the FEAScript node order, and the boundary lines turned
 * into element sides, keyed by the name of their physical group (and, as aliases, by their tag minus one, the
 * keys of FEAScript 0.3)
 * @param {object} parsedMesh - Mesh data returned by importGmshMesh (or by a mesh generator in that form)
 * @returns {object} The mesh object
 */
export function toMeshObject(parsedMesh) {
  if (!parsedMesh.nodalNumbering) {
    throw new FEAScriptError("INVALID_INPUT", "No valid nodal numbering found in the parsed mesh.");
  }
  // A mesh converted before. The import itself is left unchanged, so that it can be drawn or used again
  if (parsedMesh.meshObject) return parsedMesh.meshObject;

  const quadElements = parsedMesh.nodalNumbering.quadElements || [];
  const triangleElements = parsedMesh.nodalNumbering.triangleElements || [];
  debugLog(
    "Initial parsed mesh nodal numbering from Gmsh format: " + JSON.stringify(parsedMesh.nodalNumbering),
  );
  const hasQuadElements = quadElements.length > 0;
  const hasTriangleElements = triangleElements.length > 0;
  if (hasQuadElements && hasTriangleElements) {
    throw new FEAScriptError(
      "UNSUPPORTED_MESH",
      "Mixed quadrilateral and triangular meshes are not supported yet.",
    );
  }
  if (!hasQuadElements && !hasTriangleElements) {
    throw new FEAScriptError(
      "UNSUPPORTED_MESH",
      "The mesh has no 2D elements. In Gmsh, keep a Physical Surface for the domain, or set Mesh.SaveAll = 1.",
    );
  }

  let elementShape;
  const nodalNumbering = [];
  if (hasQuadElements) {
    elementShape = "quad";
    quadElements.forEach((gmshNodes) => {
      if (gmshNodes.length === 4) {
        // Linear quad elements (4 nodes)
        // Gmsh:         FEAScript:
        // 3 --- 2       1 --- 3
        // |     |  -->  |     |
        // 0 --- 1       0 --- 2
        nodalNumbering.push([gmshNodes[0], gmshNodes[3], gmshNodes[1], gmshNodes[2]]);
      } else if (gmshNodes.length === 9) {
        // Quadratic quad elements (9 nodes)
        // Gmsh:         FEAScript:
        // 3--6--2       2--5--8
        // |     |       |     |
        // 7  8  5  -->  1  4  7
        // |     |       |     |
        // 0--4--1       0--3--6
        nodalNumbering.push([
          gmshNodes[0],
          gmshNodes[7],
          gmshNodes[3],
          gmshNodes[4],
          gmshNodes[8],
          gmshNodes[6],
          gmshNodes[1],
          gmshNodes[5],
          gmshNodes[2],
        ]);
      } else {
        throw new FEAScriptError(
          "UNSUPPORTED_MESH",
          `Quadrilateral elements with ${gmshNodes.length} nodes are not supported; use 4-node or 9-node ones.`,
        );
      }
    });
  } else {
    elementShape = "triangle";
    triangleElements.forEach((gmshNodes) => {
      if (gmshNodes.length === 3) {
        // Linear triangular elements (3 nodes)
        // Gmsh:         FEAScript:
        // 2             1
        // | \           | \
        // |   \    -->  |   \
        // 0 --- 1       0 --- 2
        nodalNumbering.push([gmshNodes[0], gmshNodes[2], gmshNodes[1]]);
      } else if (gmshNodes.length === 6) {
        // Quadratic triangular elements (6 nodes)
        // Gmsh:         FEAScript:
        // 2             2
        // | \           | \
        // 5   4    -->  1   4
        // |     \       |     \
        // 0--3--1       0--3--5
        nodalNumbering.push([
          gmshNodes[0],
          gmshNodes[5],
          gmshNodes[2],
          gmshNodes[3],
          gmshNodes[4],
          gmshNodes[1],
        ]);
      } else {
        throw new FEAScriptError(
          "UNSUPPORTED_MESH",
          `Triangular elements with ${gmshNodes.length} nodes are not supported; use 3-node or 6-node ones.`,
        );
      }
    });
  }
  debugLog("Nodal numbering after mapping from Gmsh to FEAScript format: " + JSON.stringify(nodalNumbering));

  const elementOrder = parsedMesh.elementOrder ?? (nodalNumbering[0].length > 4 ? "quadratic" : "linear");

  // Every side of every element, keyed by its two end nodes, to find the element side of a boundary line
  const sides = getBoundarySides("2D", elementOrder, elementShape);
  const sideOf = new Map();
  const sideKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  nodalNumbering.forEach((element, elementIndex) => {
    Object.entries(sides).forEach(([side, localNodes]) => {
      sideOf.set(sideKey(element[localNodes[0]], element[localNodes[localNodes.length - 1]]), [
        elementIndex,
        Number(side),
      ]);
    });
  });

  // The boundaries: the 1D physical groups, keyed by name. A group without a name is keyed by its tag minus
  // one, the key of FEAScript 0.3, which every group also gets as an alias
  const boundaryElements = {};
  const aliases = {};
  const incompleteBoundaries = {};
  (parsedMesh.physicalPropMap ?? [])
    .filter((prop) => prop.dimension === 1)
    .forEach((prop) => {
      const alias = String(prop.tag - 1);
      let name = prop.name || alias;
      if (boundaryElements[name] !== undefined) name = `${name} (${prop.tag})`;
      boundaryElements[name] = [];
      if (alias !== name) aliases[alias] = name;
      const nodePairs = parsedMesh.boundaryNodePairs?.[prop.tag] ?? [];
      nodePairs.forEach(([node1, node2]) => {
        const found = sideOf.get(sideKey(node1, node2));
        if (found) {
          boundaryElements[name].push(found);
        } else {
          incompleteBoundaries[name] ??= { name: prop.name, tag: prop.tag, missingPairs: 0 };
          incompleteBoundaries[name].missingPairs++;
          warnLog(
            `Could not find element containing boundary nodes ${node1} and ${node2} of boundary "${name}". Boundary may be incomplete.`,
          );
        }
      });
    });
  debugLog(`Boundary elements by name: ${JSON.stringify(boundaryElements)}`);

  const mesh = {
    meshDimension: "2D",
    elementOrder,
    elementShape,
    nodesXCoordinates: parsedMesh.nodesXCoordinates,
    nodesYCoordinates: parsedMesh.nodesYCoordinates,
    nodalNumbering,
    boundaryElements,
    aliases,
    incompleteBoundaries,
    totalNodesX: parsedMesh.nodesXCoordinates.length,
    totalNodesY: 1,
  };
  // Keep the result on the parsed mesh (not enumerable, so not copied or sent with it), so that a second setMesh
  // of the same import is free
  Object.defineProperty(parsedMesh, "meshObject", { value: mesh, enumerable: false, writable: true });
  return mesh;
}
