const importGmshQuadTri = async (file) => {
  let result = {
    nodesXCoordinates: [],
    nodesYCoordinates: [],
    nodalNumbering: {
      quadElements: [],
      triangleElements: [],
    },
    boundaryElements: [],
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

      if (
        nodeBlocksProcessed < nodeEntityBlocks &&
        currentNodeBlock.numNodes === 0
      ) {
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
        for (
          let i = 0;
          i < parts.length && nodeTagsCollected < currentNodeBlock.numNodes;
          i++
        ) {
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

      if (
        elementBlocksProcessed < elementEntityBlocks &&
        currentElementBlock.numElements === 0
      ) {
        currentElementBlock = {
          dim: parseInt(parts[0], 10),
          tag: parseInt(parts[1], 10),
          elementType: parseInt(parts[2], 10),
          numElements: parseInt(parts[3], 10),
        };

        result.elementTypes[currentElementBlock.elementType] =
          (result.elementTypes[currentElementBlock.elementType] || 0) +
          currentElementBlock.numElements;

        elementsProcessedInBlock = 0;
        lineIndex++;
        continue;
      }

      if (elementsProcessedInBlock < currentElementBlock.numElements) {
        const nodeIndices = parts.slice(1).map((idx) => parseInt(idx, 10));

        if (currentElementBlock.elementType === 3) {
          result.nodalNumbering.quadElements.push(nodeIndices);
        } else if (currentElementBlock.elementType === 2) {
          result.nodalNumbering.triangleElements.push(nodeIndices);
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

  processBoundaryElements(
    result.nodalNumbering.triangleElements,
    result.boundaryElements,
    3,
    "triangle"
  );
  processBoundaryElements(
    result.nodalNumbering.quadElements,
    result.boundaryElements,
    4,
    "quad"
  );

  return result;
};

function processBoundaryElements(
  elements,
  boundaryElements,
  numNodes,
  elementType
) {
  const edgeCount = {};

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    for (let j = 0; j < numNodes; j++) {
      const node1 = element[j];
      const node2 = element[(j + 1) % numNodes];

      const edgeKey = node1 < node2 ? `${node1}-${node2}` : `${node2}-${node1}`;

      edgeCount[edgeKey] = (edgeCount[edgeKey] || 0) + 1;
    }
  }

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    for (let j = 0; j < numNodes; j++) {
      const node1 = element[j];
      const node2 = element[(j + 1) % numNodes];

      const edgeKey = node1 < node2 ? `${node1}-${node2}` : `${node2}-${node1}`;

      if (edgeCount[edgeKey] === 1) {
        boundaryElements.push({
          elementIndex: i,
          localEdgeIndex: j,
          elementType: elementType,
        });
      }
    }
  }
}

export { importGmshQuadTri };
