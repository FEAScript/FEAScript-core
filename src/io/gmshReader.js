/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { triangleBoundarySides } from "../elements/basisFunctions.js";
import { debugLog, errorLog } from "../utilities/logging.js";

/**
 * Function to import mesh data from Gmsh (.msh v4.1) containing quadrilateral and triangular elements
 * @param {File} file
 * @returns {object}
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
    errorLog(
      `The Gmsh mesh is ${result.meshDimension}; only 2D meshes (triangles and quadrilaterals) are supported yet.`,
    );
  }
  debugLog(`Detected mesh dimension from Gmsh mesh: ${result.meshDimension}`);

  // Detect the element order from the Gmsh element types (2/3: linear, 9/10: quadratic triangles/quads)
  const hasLinearElements = Boolean(result.elementTypes[2] || result.elementTypes[3]);
  const hasQuadraticElements = Boolean(result.elementTypes[9] || result.elementTypes[10]);
  if (hasLinearElements && hasQuadraticElements) {
    errorLog("Mixed linear and quadratic elements in the same Gmsh mesh are not supported.");
  }
  result.elementOrder = hasQuadraticElements ? "quadratic" : "linear";
  debugLog(`Detected element order from Gmsh mesh: ${result.elementOrder}`);

  return result;
};

export { importGmshMesh };

/**
 * Function to convert a mesh imported with importGmshMesh to the FEAScript format. The nodal numbering is
 * mapped in place to the FEAScript node ordering, and boundary node pairs are converted to element sides
 * @param {object} parsedMesh - Mesh data returned by importGmshMesh (modified in place)
 * @returns {boolean} True when the boundary elements have been processed
 */
export function mapGmshMeshToFEAScript(parsedMesh) {
  let boundaryElementsProcessed = false;

  if (!parsedMesh.nodalNumbering) {
    errorLog("No valid nodal numbering found in the parsed mesh.");
  }

  // If this parsed mesh was already converted in a previous run, don't re-process it.
  // Just mark this Mesh instance as ready so prepareMesh() doesn't fall back to generateMesh().
  if (Array.isArray(parsedMesh.nodalNumbering)) {
    parsedMesh.boundaryElementsProcessed = true;
    return true;
  }

  if (typeof parsedMesh.nodalNumbering === "object" && !Array.isArray(parsedMesh.nodalNumbering)) {
    // Store the nodal numbering structure before converting
    const quadElements = parsedMesh.nodalNumbering.quadElements || [];
    const triangleElements = parsedMesh.nodalNumbering.triangleElements || [];

    debugLog(
      "Initial parsed mesh nodal numbering from Gmsh format: " + JSON.stringify(parsedMesh.nodalNumbering),
    );

    const hasQuadElements = quadElements.length > 0;
    const hasTriangleElements = triangleElements.length > 0;

    if (hasQuadElements && hasTriangleElements) {
      errorLog("Mixed quadrilateral and triangular meshes are not supported yet.");
    }

    // Check if it has quadElements or triangleElements structure from gmshReader
    if (hasQuadElements) {
      parsedMesh.elementShape = "quad";
      // Map nodal numbering from Gmsh format to FEAScript format for quad elements
      const mappedNodalNumbering = [];

      for (let elementIndex = 0; elementIndex < quadElements.length; elementIndex++) {
        const gmshNodes = quadElements[elementIndex];
        const FEAScriptNodes = new Array(gmshNodes.length);

        // Check for element type based on number of nodes
        if (gmshNodes.length === 4) {
          // Simple mapping for linear quad elements (4 nodes)
          // Gmsh:         FEAScript:
          // 3 --- 2       1 --- 3
          // |     |  -->  |     |
          // 0 --- 1       0 --- 2

          FEAScriptNodes[0] = gmshNodes[0]; // 0 -> 0
          FEAScriptNodes[1] = gmshNodes[3]; // 3 -> 1
          FEAScriptNodes[2] = gmshNodes[1]; // 1 -> 2
          FEAScriptNodes[3] = gmshNodes[2]; // 2 -> 3
        } else if (gmshNodes.length === 9) {
          // Mapping for quadratic quad elements (9 nodes)
          // Gmsh:         FEAScript:
          // 3--6--2       2--5--8
          // |     |       |     |
          // 7  8  5  -->  1  4  7
          // |     |       |     |
          // 0--4--1       0--3--6

          FEAScriptNodes[0] = gmshNodes[0]; // 0 -> 0
          FEAScriptNodes[1] = gmshNodes[7]; // 7 -> 1
          FEAScriptNodes[2] = gmshNodes[3]; // 3 -> 2
          FEAScriptNodes[3] = gmshNodes[4]; // 4 -> 3
          FEAScriptNodes[4] = gmshNodes[8]; // 8 -> 4
          FEAScriptNodes[5] = gmshNodes[6]; // 6 -> 5
          FEAScriptNodes[6] = gmshNodes[1]; // 1 -> 6
          FEAScriptNodes[7] = gmshNodes[5]; // 5 -> 7
          FEAScriptNodes[8] = gmshNodes[2]; // 2 -> 8
        }

        mappedNodalNumbering.push(FEAScriptNodes);
      }

      parsedMesh.nodalNumbering = mappedNodalNumbering;
    } else if (hasTriangleElements) {
      parsedMesh.elementShape = "triangle";

      // Map nodal numbering from Gmsh format to FEAScript format for triangular elements
      const mappedNodalNumbering = [];

      for (let elementIndex = 0; elementIndex < triangleElements.length; elementIndex++) {
        const gmshNodes = triangleElements[elementIndex];
        const FEAScriptNodes = new Array(gmshNodes.length);

        // Check for element type based on number of nodes
        if (gmshNodes.length === 3) {
          // Mapping for linear triangular elements (3 nodes)
          // Gmsh:         FEAScript:
          // 2             1
          // | \           | \
          // |   \    -->  |   \
          // 0 --- 1       0 --- 2

          FEAScriptNodes[0] = gmshNodes[0]; // 0 -> 0
          FEAScriptNodes[1] = gmshNodes[2]; // 2 -> 1
          FEAScriptNodes[2] = gmshNodes[1]; // 1 -> 2
        } else if (gmshNodes.length === 6) {
          // Mapping for quadratic triangular elements (6 nodes)
          // Gmsh:         FEAScript:
          // 2             2
          // | \           | \
          // 5   4    -->  1   4
          // |     \       |     \
          // 0--3--1       0--3--5

          FEAScriptNodes[0] = gmshNodes[0]; // 0 -> 0
          FEAScriptNodes[1] = gmshNodes[5]; // 5 -> 1
          FEAScriptNodes[2] = gmshNodes[2]; // 2 -> 2
          FEAScriptNodes[3] = gmshNodes[3]; // 3 -> 3
          FEAScriptNodes[4] = gmshNodes[4]; // 4 -> 4
          FEAScriptNodes[5] = gmshNodes[1]; // 1 -> 5
        }

        mappedNodalNumbering.push(FEAScriptNodes);
      }

      parsedMesh.nodalNumbering = mappedNodalNumbering;
    } else {
      errorLog("Element type is neither triangle nor quad; mapping for this type is not implemented yet.");
    }

    debugLog(
      "Nodal numbering after mapping from Gmsh to FEAScript format: " +
        JSON.stringify(parsedMesh.nodalNumbering),
    );

    // Process boundary elements if they exist and if physical property mapping exists
    if (parsedMesh.physicalPropMap && parsedMesh.boundaryElements) {
      // Check if boundary elements need to be processed
      if (
        Array.isArray(parsedMesh.boundaryElements) &&
        parsedMesh.boundaryElements.length > 0 &&
        parsedMesh.boundaryElements[0] === undefined
      ) {
        // Create a new array without the empty first element
        const fixedBoundaryElements = [];
        for (let i = 1; i < parsedMesh.boundaryElements.length; i++) {
          if (parsedMesh.boundaryElements[i]) {
            fixedBoundaryElements.push(parsedMesh.boundaryElements[i]);
          }
        }
        parsedMesh.boundaryElements = fixedBoundaryElements;
      }

      // If boundary node pairs exist but boundary elements haven't been processed
      if (parsedMesh.boundaryNodePairs && !parsedMesh.boundaryElementsProcessed) {
        // Reset boundary elements array
        parsedMesh.boundaryElements = [];

        // Process each physical property from the Gmsh file
        parsedMesh.physicalPropMap.forEach((prop) => {
          // Only process 1D physical entities (boundary lines)
          if (prop.dimension === 1) {
            // Get all node pairs for this boundary
            const boundaryNodePairs = parsedMesh.boundaryNodePairs[prop.tag] || [];

            if (boundaryNodePairs.length > 0) {
              // Initialize array for this boundary tag
              if (!parsedMesh.boundaryElements[prop.tag]) {
                parsedMesh.boundaryElements[prop.tag] = [];
              }

              // For each boundary line segment (defined by a pair of nodes)
              boundaryNodePairs.forEach((nodesPair) => {
                const node1 = nodesPair[0]; // First node in the pair
                const node2 = nodesPair[1]; // Second node in the pair

                debugLog(
                  `Processing boundary node pair: [${node1}, ${node2}] for boundary ${prop.tag} (${
                    prop.name || "unnamed"
                  })`,
                );

                // Search through all elements to find which one contains both nodes
                let foundElement = false;

                // Loop through all elements in the mesh
                for (let elementIndex = 0; elementIndex < parsedMesh.nodalNumbering.length; elementIndex++) {
                  const elementConnectivity = parsedMesh.nodalNumbering[elementIndex];

                  // For linear (3 nodes) and quadratic (6 nodes) triangular elements
                  if (parsedMesh.elementShape === "triangle") {
                    // Based on FEAScript triangle numbering:
                    // Linear:       Quadratic:
                    // 1             2
                    // | \           | \
                    // |   \         1   4
                    // |     \       |     \
                    // 0 --- 2       0--3--5
                    // Side 0: bottom, side 1: left, side 2: hypotenuse
                    const sides =
                      triangleBoundarySides[elementConnectivity.length === 6 ? "quadratic" : "linear"];

                    // Boundary node pairs are the end vertices of the boundary line, so they are
                    // compared against the first and last node of each side
                    const side = Object.keys(sides).find((sideKey) => {
                      const sideNodes = sides[sideKey];
                      const firstNode = elementConnectivity[sideNodes[0]];
                      const lastNode = elementConnectivity[sideNodes[sideNodes.length - 1]];
                      return (
                        (firstNode === node1 && lastNode === node2) ||
                        (firstNode === node2 && lastNode === node1)
                      );
                    });

                    if (side !== undefined) {
                      debugLog(
                        `  Found triangle ${elementIndex} containing boundary nodes on side ${side}. Element nodes: [${elementConnectivity.join(
                          ", ",
                        )}]`,
                      );

                      parsedMesh.boundaryElements[prop.tag].push([elementIndex, Number(side)]);
                      foundElement = true;
                      break;
                    }
                  }
                  // For linear quadrilateral linear elements (4 nodes)
                  else if (elementConnectivity.length === 4) {
                    // Check if both boundary nodes are in this element
                    if (elementConnectivity.includes(node1) && elementConnectivity.includes(node2)) {
                      // Find which side of the element these nodes form
                      let side;

                      const node1Index = elementConnectivity.indexOf(node1);
                      const node2Index = elementConnectivity.indexOf(node2);

                      debugLog(
                        `  Found element ${elementIndex} containing boundary nodes. Element nodes: [${elementConnectivity.join(
                          ", ",
                        )}]`,
                      );
                      debugLog(
                        `  Node ${node1} is at index ${node1Index}, Node ${node2} is at index ${node2Index} in the element`,
                      );

                      // Based on FEAScript linear quadrilateral numbering:
                      // 1 --- 3
                      // |     |
                      // 0 --- 2

                      if ((node1Index === 0 && node2Index === 2) || (node1Index === 2 && node2Index === 0)) {
                        side = 0; // Bottom side
                        debugLog(`  These nodes form the BOTTOM side (${side}) of element ${elementIndex}`);
                      } else if (
                        (node1Index === 0 && node2Index === 1) ||
                        (node1Index === 1 && node2Index === 0)
                      ) {
                        side = 1; // Left side
                        debugLog(`  These nodes form the LEFT side (${side}) of element ${elementIndex}`);
                      } else if (
                        (node1Index === 1 && node2Index === 3) ||
                        (node1Index === 3 && node2Index === 1)
                      ) {
                        side = 2; // Top side
                        debugLog(`  These nodes form the TOP side (${side}) of element ${elementIndex}`);
                      } else if (
                        (node1Index === 2 && node2Index === 3) ||
                        (node1Index === 3 && node2Index === 2)
                      ) {
                        side = 3; // Right side
                        debugLog(`  These nodes form the RIGHT side (${side}) of element ${elementIndex}`);
                      }

                      // Add the element and side to the boundary elements array
                      parsedMesh.boundaryElements[prop.tag].push([elementIndex, side]);
                      debugLog(
                        `  Added element-side pair [${elementIndex}, ${side}] to boundary tag ${prop.tag}`,
                      );
                      foundElement = true;
                      break;
                    }
                  } else if (elementConnectivity.length === 9) {
                    // For quadratic quadrilateral elements (9 nodes)
                    // Check if both boundary nodes are in this element
                    if (elementConnectivity.includes(node1) && elementConnectivity.includes(node2)) {
                      // Find which side of the element these nodes form
                      let side;

                      const node1Index = elementConnectivity.indexOf(node1);
                      const node2Index = elementConnectivity.indexOf(node2);

                      debugLog(
                        `  Found element ${elementIndex} containing boundary nodes. Element nodes: [${elementConnectivity.join(
                          ", ",
                        )}]`,
                      );
                      debugLog(
                        `  Node ${node1} is at index ${node1Index}, Node ${node2} is at index ${node2Index} in the element`,
                      );

                      // Based on FEAScript quadratic quadrilateral numbering:
                      // 2--5--8
                      // |     |
                      // 1  4  7
                      // |     |
                      // 0--3--6

                      // TODO: Transform into dictionaries for better readability
                      if (
                        (node1Index === 0 && node2Index === 6) ||
                        (node1Index === 6 && node2Index === 0) ||
                        (node1Index === 0 && node2Index === 3) ||
                        (node1Index === 3 && node2Index === 0) ||
                        (node1Index === 3 && node2Index === 6) ||
                        (node1Index === 6 && node2Index === 3)
                      ) {
                        side = 0; // Bottom side (nodes 0, 3, 6)
                        debugLog(`  These nodes form the BOTTOM side (${side}) of element ${elementIndex}`);
                      } else if (
                        (node1Index === 0 && node2Index === 2) ||
                        (node1Index === 2 && node2Index === 0) ||
                        (node1Index === 0 && node2Index === 1) ||
                        (node1Index === 1 && node2Index === 0) ||
                        (node1Index === 1 && node2Index === 2) ||
                        (node1Index === 2 && node2Index === 1)
                      ) {
                        side = 1; // Left side (nodes 0, 1, 2)
                        debugLog(`  These nodes form the LEFT side (${side}) of element ${elementIndex}`);
                      } else if (
                        (node1Index === 2 && node2Index === 8) ||
                        (node1Index === 8 && node2Index === 2) ||
                        (node1Index === 2 && node2Index === 5) ||
                        (node1Index === 5 && node2Index === 2) ||
                        (node1Index === 5 && node2Index === 8) ||
                        (node1Index === 8 && node2Index === 5)
                      ) {
                        side = 2; // Top side (nodes 2, 5, 8)
                        debugLog(`  These nodes form the TOP side (${side}) of element ${elementIndex}`);
                      } else if (
                        (node1Index === 6 && node2Index === 8) ||
                        (node1Index === 8 && node2Index === 6) ||
                        (node1Index === 6 && node2Index === 7) ||
                        (node1Index === 7 && node2Index === 6) ||
                        (node1Index === 7 && node2Index === 8) ||
                        (node1Index === 8 && node2Index === 7)
                      ) {
                        side = 3; // Right side (nodes 6, 7, 8)
                        debugLog(`  These nodes form the RIGHT side (${side}) of element ${elementIndex}`);
                      }

                      // Add the element and side to the boundary elements array
                      parsedMesh.boundaryElements[prop.tag].push([elementIndex, side]);
                      debugLog(
                        `  Added element-side pair [${elementIndex}, ${side}] to boundary tag ${prop.tag}`,
                      );
                      foundElement = true;
                      break;
                    }
                  }
                }

                if (!foundElement) {
                  errorLog(
                    `Could not find element containing boundary nodes ${node1} and ${node2}. Boundary may be incomplete.`,
                  );
                }
              });
            }
          }
        });

        // Mark as processed
        boundaryElementsProcessed = true;

        // Fix boundary elements array - remove undefined entries
        if (parsedMesh.boundaryElements.length > 0 && parsedMesh.boundaryElements[0] === undefined) {
          const fixedBoundaryElements = [];
          for (let i = 1; i < parsedMesh.boundaryElements.length; i++) {
            if (parsedMesh.boundaryElements[i]) {
              fixedBoundaryElements.push(parsedMesh.boundaryElements[i]);
            }
          }
          parsedMesh.boundaryElements = fixedBoundaryElements;
        }
      }
    }
  }

  return boundaryElementsProcessed;
}
