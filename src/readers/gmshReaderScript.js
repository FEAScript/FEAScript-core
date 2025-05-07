//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

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
    boundaryElements: [], // Will be initialized as array of arrays below
    boundaryConditions: [],
    gmshV: 0,
    ascii: false,
    fltBytes: "8",
    totalNodesX: 0,
    totalNodesY: 0,
    physicalPropMap: [],
    elementTypes: {},
  };

  // Initialize boundaryElements as an array of 4 empty arrays (one for each side)
  for (let i = 0; i < 4; i++) {
    result.boundaryElements[i] = [];
  }

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
      }
    }
  });

  processBoundaryElements(result.nodalNumbering.triangleElements, result.boundaryElements, 3, "triangle");
  processBoundaryElements(result.nodalNumbering.quadElements, result.boundaryElements, 4, "quad");

  return result;
};

/**
 * Function to process boundary elements from a mesh
 * @param {array} elements - Array of elements to process
 * @param {array} boundaryElements - Array to store the boundary elements
 * @param {number} numNodes - Number of nodes per element
 * @param {string} elementType - Type of element (triangle, quad)
 */
function processBoundaryElements(elements, boundaryElements, numNodes, elementType) {
  const edgeCount = {};

  // Count occurrences of each edge
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    for (let j = 0; j < numNodes; j++) {
      const node1 = element[j];
      const node2 = element[(j + 1) % numNodes];

      const edgeKey = node1 < node2 ? `${node1}-${node2}` : `${node2}-${node1}`;

      edgeCount[edgeKey] = (edgeCount[edgeKey] || 0) + 1;
    }
  }

  // Process boundary edges
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    for (let j = 0; j < numNodes; j++) {
      const node1 = element[j];
      const node2 = element[(j + 1) % numNodes];

      const edgeKey = node1 < node2 ? `${node1}-${node2}` : `${node2}-${node1}`;

      if (edgeCount[edgeKey] === 1) { // Boundary edge
        // Map local edge index to side index (0: bottom, 1: left, 2: top, 3: right)
        let sideIndex;
        
        if (elementType === "quad") {
          // For quadrilateral elements
          // Gmsh format: 0 → bottom, 1 → right, 2 → top, 3 → left
          // Adjusted to match the FEAScript format: 0 → bottom, 1 → left, 2 → top, 3 → right
          const sideMap = [0, 3, 2, 1];
          sideIndex = sideMap[j];
        } else if (elementType === "triangle") {
          // For triangular elements
        }

        boundaryElements[sideIndex].push([i, j]);
      }
    }
  }
}

export { importGmshQuadTri };
