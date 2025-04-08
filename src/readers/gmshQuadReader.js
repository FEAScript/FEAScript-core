const importGmsh = async (file) => {
  let newFin = {
    nodesXCoordinates: [],
    nodesYCoordinates: [],
    nodalNumbering: [],
    boundaryElements: [],
    gmshV: 0,
    ascii: false,
    fltBytes: 8,
    totalNodesX: 0,
    totalNodesY: 0,
    physicalPropMap: [],
  };
  let textre = await file.text();
  textre = textre
    .split("\n")
    .map((eachLine) => eachLine.trim())
    .filter((eachLine) => eachLine != "" && eachLine != " ");

  let inNodesSections = false;

  const totalElements = newFin.nodalNumbering.length;
  const numMaterials = newFin.physicalPropMap.length;
  const baseChunkSize = Math.floor(totalElements / numMaterials);
  const remainder = totalElements % numMaterials;

  let inElementsSecitons = false;

  let inMeshSections = false;

  let inPhysicalNames = false;

  let lineNumber = 0;

  for (let line of textre) {
    if (line == "$MeshFormat") {
      inMeshSections = true;
      continue;
    }
    if (line == "$EndMeshFormat") {
      lineNumber = 0;
      inMeshSections = false;
      continue;
    }
    if (line == "$PhysicalNames") {
      inPhysicalNames = true;
      continue;
    }
    if (line == "$EndPhysicalNames") {
      lineNumber = 0;
      inPhysicalNames = false;

      continue;
    }

    if (line == "$Nodes") {
      inNodesSections = true;
      continue;
    }
    if (line == "$EndNodes") {
      lineNumber = 0;
      inNodesSections = false;

      continue;
    }
    if (line == "$Elements") {
      inElementsSecitons = true;
      continue;
    }
    if (line == "$EndElements") {
      lineNumber = 0;

      inElementsSecitons = false;
      continue;
    }
    let temp = line.split(" ");

    lineNumber = lineNumber + 1;
    if (inMeshSections) {
      let gmshVersion = parseFloat(temp[0]);
      let asciiOr = temp[1] === "0" ? true : false;
      let fltBytesOr = temp[2];

      newFin.gmshV = gmshVersion;
      newFin.ascii = asciiOr;
      newFin.fltBytes = fltBytesOr;
    }

    if (inPhysicalNames) {
      if (lineNumber > 1) {
        let dimension = parseInt(temp[0]);
        let tag = parseInt(temp[1]);
        let name = temp[2].replace(/^"|"$/g, "");

        newFin.physicalPropMap = [
          ...newFin.physicalPropMap,
          {
            tag: tag,
            dimension: dimension,
            name: name,
          },
        ];
      }
    }
    if (inNodesSections) {
      if (temp.length === 3) {
        newFin.totalNodesX += 1;
        newFin.totalNodesY += 1;
        newFin.nodesXCoordinates = [
          ...newFin.nodesXCoordinates,
          parseFloat(temp[0]),
        ];
        newFin.nodesYCoordinates = [
          ...newFin.nodesYCoordinates,
          parseFloat(temp[1]),
        ];
      }
    }

    if (inElementsSecitons) {
      if (temp.length === 5) {
        newFin.nodalNumbering = [
          ...newFin.nodalNumbering,
          temp.slice(1).map((num) => parseInt(num, 10)),
        ];
      }
    }
  }

  // const taichiRunner = new TaichiRunner();
  // await taichiRunner.init();

  // await taichiRunner.addToScope({ newFin, tempBoundary });

  // const useKernel = await taichiRunner.createKernel(() => {
  const edgeCount = {};
  for (let i = 0; i < newFin.nodalNumbering.length; i++) {
    const element = newFin.nodalNumbering[i];
    const edges = [
      [element[0], element[1]],
      [element[1], element[2]],
      [element[2], element[3]],
      [element[3], element[0]],
    ];
    edges.forEach((edge) => {
      const key =
        edge[0] < edge[1] ? `${edge[0]}-${edge[1]}` : `${edge[1]}-${edge[0]}`;
      edgeCount[key] = (edgeCount[key] || 0) + 1;
    });
  }

  newFin.boundaryElements = [];
  for (let i = 0; i < newFin.nodalNumbering.length; i++) {
    const element = newFin.nodalNumbering[i];
    const edges = [
      [element[0], element[1]],
      [element[1], element[2]],
      [element[2], element[3]],
      [element[3], element[0]],
    ];
    for (let j = 0; j < edges.length; j++) {
      const edge = edges[j];
      const key =
        edge[0] < edge[1] ? `${edge[0]}-${edge[1]}` : `${edge[1]}-${edge[0]}`;
      if (edgeCount[key] === 1) {
        if (!newFin.boundaryElements[i]) {
          newFin.boundaryElements[i] = [];
        }
        newFin.boundaryElements[i].push([i, j]);
      }
    }
  }

  newFin.boundaryElements = newFin.boundaryElements.filter((each) => each);

  let tempElementArr = [];
  let startIndex = 0;

  for (let i = 0; i < numMaterials; i++) {
    // Distribute one extra element for the first 'remainder' chunks
    const currentChunkSize = baseChunkSize + (i < remainder ? 1 : 0);
    tempElementArr.push(
      newFin.nodalNumbering.slice(startIndex, startIndex + currentChunkSize)
    );
    startIndex += currentChunkSize;
  }

  newFin.nodalNumbering = tempElementArr;

  // });

  // if (useKernel) {
  //   await taichiRunner.runKernel(useKernel);
  // }
  return newFin;
};

const importGmshQuadTri = async (file) => {
  let newFin = {
    nodesXCoordinates: [],
    nodesYCoordinates: [],
    nodalNumbering: {
      quadElements: [],
      triangleElements: [],
    },
    boundaryElements: [],
    gmshV: 0,
    ascii: false,
    fltBytes: 8,
    totalNodesX: 0,
    totalNodesY: 0,
    physicalPropMap: [],
    elementTypes: {},
  };

  let textre = await file.text();
  textre = textre
    .split("\n")
    .map((eachLine) => eachLine.trim())
    .filter((eachLine) => eachLine != "" && eachLine != " ");

  let inNodesSections = false;
  let inElementsSecitons = false;
  let inMeshSections = false;
  let inPhysicalNames = false;
  let inEntities = false;

  let lineNumber = 0;
  let entityBlocks = 0;
  let totalNodes = 0;
  let nodeBlocksProcessed = 0;
  let currentNodeBlock = { dim: 0, tag: 0, parametric: 0, numNodes: 0 };
  let nodeBlockDataStartLine = 0;
  let collectingNodeTags = false;
  let collectingNodeCoords = false;
  let nodeTagsToProcess = [];

  let entityBlocksElements = 0;
  let totalElements = 0;
  let elementBlocksProcessed = 0;
  let currentElementBlock = { dim: 0, tag: 0, elementType: 0, numElements: 0 };
  let elementBlockStartLine = 0;

  for (let line of textre) {
    if (line == "$MeshFormat") {
      inMeshSections = true;
      continue;
    }
    if (line == "$EndMeshFormat") {
      lineNumber = 0;
      inMeshSections = false;
      continue;
    }
    if (line == "$PhysicalNames") {
      inPhysicalNames = true;
      continue;
    }
    if (line == "$EndPhysicalNames") {
      lineNumber = 0;
      inPhysicalNames = false;
      continue;
    }
    if (line == "$Entities") {
      inEntities = true;
      continue;
    }
    if (line == "$EndEntities") {
      lineNumber = 0;
      inEntities = false;
      continue;
    }
    if (line == "$Nodes") {
      inNodesSections = true;
      continue;
    }
    if (line == "$EndNodes") {
      lineNumber = 0;
      inNodesSections = false;
      continue;
    }
    if (line == "$Elements") {
      inElementsSecitons = true;
      continue;
    }
    if (line == "$EndElements") {
      lineNumber = 0;
      inElementsSecitons = false;
      continue;
    }

    let temp = line.split(" ").filter((item) => item !== "");

    lineNumber = lineNumber + 1;

    if (inMeshSections) {
      if (lineNumber === 1) {
        let gmshVersion = parseFloat(temp[0]);
        let asciiOr = temp[1] === "0" ? true : false;
        let fltBytesOr = temp[2];

        newFin.gmshV = gmshVersion;
        newFin.ascii = asciiOr;
        newFin.fltBytes = fltBytesOr;
      }
    }

    if (inPhysicalNames) {
      if (lineNumber === 1) {
        continue;
      }

      if (temp.length >= 3) {
        let dimension = parseInt(temp[0]);
        let tag = parseInt(temp[1]);

        let name = temp.slice(2).join(" ");
        name = name.replace(/^"|"$/g, "");

        newFin.physicalPropMap.push({
          tag: tag,
          dimension: dimension,
          name: name,
        });
      }
    }

    if (inNodesSections) {
      if (lineNumber === 1) {
        entityBlocks = parseInt(temp[0]);
        totalNodes = parseInt(temp[1]);
        newFin.nodesXCoordinates = new Array(totalNodes);
        newFin.nodesYCoordinates = new Array(totalNodes);
        continue;
      }

      if (nodeBlocksProcessed < entityBlocks) {
        if (!collectingNodeTags && !collectingNodeCoords) {
          currentNodeBlock.dim = parseInt(temp[0]);
          currentNodeBlock.tag = parseInt(temp[1]);
          currentNodeBlock.parametric = parseInt(temp[2]);
          currentNodeBlock.numNodes = parseInt(temp[3]);

          nodeTagsToProcess = [];
          collectingNodeTags = true;
          nodeBlockDataStartLine = lineNumber;
          continue;
        }

        if (collectingNodeTags) {
          for (let tag of temp) {
            nodeTagsToProcess.push(parseInt(tag));
          }

          if (
            lineNumber - nodeBlockDataStartLine >=
            currentNodeBlock.numNodes
          ) {
            collectingNodeTags = false;
            collectingNodeCoords = true;
            continue;
          }
        }

        if (collectingNodeCoords) {
          const nodeIndex = nodeTagsToProcess.shift() - 1;

          if (temp.length >= 2) {
            newFin.nodesXCoordinates[nodeIndex] = parseFloat(temp[0]);
            newFin.nodesYCoordinates[nodeIndex] = parseFloat(temp[1]);
            newFin.totalNodesX++;
            newFin.totalNodesY++;
          }

          if (nodeTagsToProcess.length === 0) {
            collectingNodeCoords = false;
            nodeBlocksProcessed++;
          }
        }
      }
    }

    if (inElementsSecitons) {
      if (lineNumber === 1) {
        entityBlocksElements = parseInt(temp[0]);
        totalElements = parseInt(temp[1]);
        continue;
      }

      if (elementBlocksProcessed < entityBlocksElements) {
        if (temp.length === 4) {
          currentElementBlock.dim = parseInt(temp[0]);
          currentElementBlock.tag = parseInt(temp[1]);
          currentElementBlock.elementType = parseInt(temp[2]);
          currentElementBlock.numElements = parseInt(temp[3]);

          newFin.elementTypes[currentElementBlock.elementType] =
            (newFin.elementTypes[currentElementBlock.elementType] || 0) +
            currentElementBlock.numElements;

          elementBlockStartLine = lineNumber;
          continue;
        }

        if (
          lineNumber > elementBlockStartLine &&
          lineNumber <= elementBlockStartLine + currentElementBlock.numElements
        ) {
          const elementTag = parseInt(temp[0]);
          const nodeIndices = temp.slice(1).map((idx) => parseInt(idx));

          if (currentElementBlock.elementType === 3) {
            newFin.nodalNumbering.quadElements.push(nodeIndices);
          } else if (currentElementBlock.elementType === 2) {
            newFin.nodalNumbering.triangleElements.push(nodeIndices);
          }

          if (
            lineNumber ===
            elementBlockStartLine + currentElementBlock.numElements
          ) {
            elementBlocksProcessed++;
          }
        }
      }
    }
  }

  processBoundaryElements(
    newFin.nodalNumbering.triangleElements,
    newFin.boundaryElements,
    3
  );
  processBoundaryElements(
    newFin.nodalNumbering.quadElements,
    newFin.boundaryElements,
    4
  );

  return newFin;
};

function processBoundaryElements(elements, boundaryElements, numNodes) {
  const edgeCount = {};

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    const edges = [];
    for (let j = 0; j < numNodes; j++) {
      edges.push([element[j], element[(j + 1) % numNodes]]);
    }

    edges.forEach((edge) => {
      const key =
        edge[0] < edge[1] ? `${edge[0]}-${edge[1]}` : `${edge[1]}-${edge[0]}`;
      edgeCount[key] = (edgeCount[key] || 0) + 1;
    });
  }
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const edges = [];

    for (let j = 0; j < numNodes; j++) {
      edges.push([element[j], element[(j + 1) % numNodes]]);
    }

    for (let j = 0; j < edges.length; j++) {
      const edge = edges[j];
      const key =
        edge[0] < edge[1] ? `${edge[0]}-${edge[1]}` : `${edge[1]}-${edge[0]}`;

      if (edgeCount[key] === 1) {
        boundaryElements.push({
          elementIndex: i,
          localEdgeIndex: j,
          elementType: numNodes === 3 ? "triangle" : "quad",
        });
      }
    }
  }
}

export { importGmsh, importGmshQuadTri };
