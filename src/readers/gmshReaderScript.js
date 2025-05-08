//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

// Internal imports
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Function to import mesh data from Gmsh format containing quadrilateral and triangular elements
 * @param {File} file - The Gmsh file to be parsed (.msh version 4.1)
 * @returns {object} The parsed mesh data including node coordinates, element connectivity, and boundary conditions
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
    gmshV: 0,
    ascii: false,
    fltBytes: "8",
    totalNodesX: 0,
    totalNodesY: 0,
    physicalPropMap: [],
    elementTypes: {},
  };

  let content = await file.text();
  let lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && line !== " ");

  let section = "";
  let lineIndex = 0;

  let nodeEntityBlocks = 0;
  let totalNodes = 0;
  let nodeBlocksProcessed = 0;
  let currentNodeBlock = { numNodes: 0 };
  let nodeTagsCollected = 0;
  let nodeTags = [];
  let nodeCoordinatesCollected = 0;

  let elementEntityBlocks = 0;
  let totalElements = 0;
  let elementBlocksProcessed = 0;
  let currentElementBlock = {
    dim: 0,
    tag: 0,
    elementType: 0,
    numElements: 0,
  };
  let elementsProcessedInBlock = 0;

  let boundaryElementsByTag = {};

  while (lineIndex < lines.length) {
    const line = lines[lineIndex];

    if (line === "$MeshFormat") {
      section = "meshFormat";
      lineIndex++;
      continue;
    } else if (line === "$EndMeshFormat") {
      section = "";
      lineIndex++;
      continue;
    } else if (line === "$PhysicalNames") {
      section = "physicalNames";
      lineIndex++;
      continue;
    } else if (line === "$EndPhysicalNames") {
      section = "";
      lineIndex++;
      continue;
    } else if (line === "$Entities") {
      section = "entities";
      lineIndex++;
      continue;
    } else if (line === "$EndEntities") {
      section = "";
      lineIndex++;
      continue;
    } else if (line === "$Nodes") {
      section = "nodes";
      lineIndex++;
      continue;
    } else if (line === "$EndNodes") {
      section = "";
      lineIndex++;
      continue;
    } else if (line === "$Elements") {
      section = "elements";
      lineIndex++;
      continue;
    } else if (line === "$EndElements") {
      section = "";
      lineIndex++;
      continue;
    }

    const parts = line.split(/\s+/).filter((part) => part !== "");

    if (section === "meshFormat") {
      result.gmshV = parseFloat(parts[0]);
      result.ascii = parts[1] === "0";
      result.fltBytes = parts[2];
    } else if (section === "physicalNames") {
      if (parts.length >= 3) {
        if (!/^\d+$/.test(parts[0])) {
          lineIndex++;
          continue;
        }

        const dimension = parseInt(parts[0], 10);
        const tag = parseInt(parts[1], 10);
        let name = parts.slice(2).join(" ");
        name = name.replace(/^"|"$/g, "");

        result.physicalPropMap.push({
          tag,
          dimension,
          name,
        });
      }
    } else if (section === "nodes") {
      if (nodeEntityBlocks === 0) {
        nodeEntityBlocks = parseInt(parts[0], 10);
        totalNodes = parseInt(parts[1], 10);
        result.nodesXCoordinates = new Array(totalNodes).fill(0);
        result.nodesYCoordinates = new Array(totalNodes).fill(0);
        lineIndex++;
        continue;
      }

      if (nodeBlocksProcessed < nodeEntityBlocks && currentNodeBlock.numNodes === 0) {
        currentNodeBlock = {
          dim: parseInt(parts[0], 10),
          tag: parseInt(parts[1], 10),
          parametric: parseInt(parts[2], 10),
          numNodes: parseInt(parts[3], 10),
        };

        nodeTags = [];
        nodeTagsCollected = 0;
        nodeCoordinatesCollected = 0;

        lineIndex++;
        continue;
      }

      if (nodeTagsCollected < currentNodeBlock.numNodes) {
        for (let i = 0; i < parts.length && nodeTagsCollected < currentNodeBlock.numNodes; i++) {
          nodeTags.push(parseInt(parts[i], 10));
          nodeTagsCollected++;
        }

        if (nodeTagsCollected < currentNodeBlock.numNodes) {
          lineIndex++;
          continue;
        }

        lineIndex++;
        continue;
      }

      if (nodeCoordinatesCollected < currentNodeBlock.numNodes) {
        const nodeTag = nodeTags[nodeCoordinatesCollected] - 1;
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);

        result.nodesXCoordinates[nodeTag] = x;
        result.nodesYCoordinates[nodeTag] = y;
        result.totalNodesX++;
        result.totalNodesY++;

        nodeCoordinatesCollected++;

        if (nodeCoordinatesCollected === currentNodeBlock.numNodes) {
          nodeBlocksProcessed++;
          currentNodeBlock = { numNodes: 0 };
        }
      }
    } else if (section === "elements") {
      if (elementEntityBlocks === 0) {
        elementEntityBlocks = parseInt(parts[0], 10);
        totalElements = parseInt(parts[1], 10);
        lineIndex++;
        continue;
      }

      if (elementBlocksProcessed < elementEntityBlocks && currentElementBlock.numElements === 0) {
        currentElementBlock = {
          dim: parseInt(parts[0], 10),
          tag: parseInt(parts[1], 10),
          elementType: parseInt(parts[2], 10),
          numElements: parseInt(parts[3], 10),
        };

        result.elementTypes[currentElementBlock.elementType] =
          (result.elementTypes[currentElementBlock.elementType] || 0) + currentElementBlock.numElements;

        elementsProcessedInBlock = 0;
        lineIndex++;
        continue;
      }

      if (elementsProcessedInBlock < currentElementBlock.numElements) {
        const elementTag = parseInt(parts[0], 10);
        const nodeIndices = parts.slice(1).map((idx) => parseInt(idx, 10));

        if (currentElementBlock.elementType === 1) {
          const physicalTag = currentElementBlock.tag;

          if (!boundaryElementsByTag[physicalTag]) {
            boundaryElementsByTag[physicalTag] = [];
          }

          boundaryElementsByTag[physicalTag].push(nodeIndices);
        } else if (currentElementBlock.elementType === 2) {
          result.nodalNumbering.triangleElements.push(nodeIndices);
        } else if (currentElementBlock.elementType === 3) {
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

  result.physicalPropMap.forEach((prop) => {
    if (prop.dimension === 1) {
      const boundaryNodes = boundaryElementsByTag[prop.tag] || [];

      if (boundaryNodes.length > 0) {
        result.boundaryConditions.push({
          name: prop.name,
          tag: prop.tag,
          nodes: boundaryNodes,
        });

        // Initialize boundary element array based on the number of PhysicalNames
        if (!result.boundaryElements[prop.tag]) {
          result.boundaryElements[prop.tag] = [];
        }

        // For each boundary line segment (2 nodes)
        boundaryNodes.forEach((nodesPair) => {
          // Find which quad element contains both nodes of this boundary
          let foundElement = false;
          for (let elemIdx = 0; elemIdx < result.nodalNumbering.quadElements.length; elemIdx++) {
            const elemNodes = result.nodalNumbering.quadElements[elemIdx];

            // Check if both boundary nodes are in this element
            if (elemNodes.includes(nodesPair[0]) && elemNodes.includes(nodesPair[1])) {
              // Find which side of the element these nodes form
              let side;

              // For linear quadrilateral elements, the Gmsh local numbering is:
              // 3 --- 2
              // |     |
              // 0 --- 1

              // Check which side these nodes belong to
              if (
                (elemNodes.indexOf(nodesPair[0]) === 0 && elemNodes.indexOf(nodesPair[1]) === 1) ||
                (elemNodes.indexOf(nodesPair[1]) === 0 && elemNodes.indexOf(nodesPair[0]) === 1)
              ) {
                side = 0; // Bottom side
              } else if (
                (elemNodes.indexOf(nodesPair[0]) === 1 && elemNodes.indexOf(nodesPair[1]) === 2) ||
                (elemNodes.indexOf(nodesPair[1]) === 1 && elemNodes.indexOf(nodesPair[0]) === 2)
              ) {
                side = 1; // Right side
              } else if (
                (elemNodes.indexOf(nodesPair[0]) === 2 && elemNodes.indexOf(nodesPair[1]) === 3) ||
                (elemNodes.indexOf(nodesPair[1]) === 2 && elemNodes.indexOf(nodesPair[0]) === 3)
              ) {
                side = 2; // Top side
              } else if (
                (elemNodes.indexOf(nodesPair[0]) === 3 && elemNodes.indexOf(nodesPair[1]) === 0) ||
                (elemNodes.indexOf(nodesPair[1]) === 3 && elemNodes.indexOf(nodesPair[0]) === 0)
              ) {
                side = 3; // Left side
              }

              // Add to boundary elements
              result.boundaryElements[prop.tag].push([elemIdx, side]);
              foundElement = true;
              break;
            }
          }
        });
      }
    }
  });

  // Remap nodal numbering from Gmsh format to FEAScript format for quadrilateral elements
  if (result.nodalNumbering.quadElements.length > 0) {
    /*
     * Gmsh quadrilateral node numbering (linear elements):
     *
     *   3__ __2
     *   |     |
     *   |__ __|
     *   0     1
     *
     * FEAScript quadrilateral node numbering (linear elements):
     *
     *   1__ __3
     *   |     |
     *   |__ __|
     *   0     2
     *
     */
    // Mapping: Gmsh → FEAScript
    // 0 → 0 (bottom left)
    // 1 → 2 (bottom right)
    // 2 → 3 (top right)
    // 3 → 1 (top left)
    const gmshToFEAMap = [0, 2, 3, 1];

    for (let i = 0; i < result.nodalNumbering.quadElements.length; i++) {
      const originalNodes = [...result.nodalNumbering.quadElements[i]];
      for (let j = 0; j < 4; j++) {
        result.nodalNumbering.quadElements[i][gmshToFEAMap[j]] = originalNodes[j];
      }
    }
  }

  // Fix boundary elements array - remove the empty first element
  if (result.boundaryElements.length > 0 && result.boundaryElements[0] === undefined) {
    // Create a new array without the empty first element
    const fixedBoundaryElements = [];
    for (let i = 1; i < result.boundaryElements.length; i++) {
      if (result.boundaryElements[i]) {
        fixedBoundaryElements.push(result.boundaryElements[i]);
      }
    }
    result.boundaryElements = fixedBoundaryElements;
  }

  return result;
};

export { importGmshQuadTri };
