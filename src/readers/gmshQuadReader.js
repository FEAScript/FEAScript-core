const importGmsh = async (file) => {
  let newFin = {
    nodesXCoordinates: [],
    nodesYCoordinates: [],
    nodalNumbering: [],
    boundaryElements: [],
    gmshV: 0,
    ascii: false,
    fltBytes: 8,
    totalNodesX:0,
    totalNodesY:0,
    physicalPropMap:[]
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

    if(inPhysicalNames){
      if(lineNumber>1){
        let dimension = parseInt(temp[0]);
let tag = parseInt(temp[1]);
let name = temp[2].replace(/^"|"$/g, "");

        newFin.physicalPropMap=[...newFin.physicalPropMap,
          {
            tag:tag,
            dimension:dimension,
            name:name
          }
      ]
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
          edge[0] < edge[1]
            ? `${edge[0]}-${edge[1]}`
            : `${edge[1]}-${edge[0]}`;
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
          edge[0] < edge[1]
            ? `${edge[0]}-${edge[1]}`
            : `${edge[1]}-${edge[0]}`;
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
  tempElementArr.push(newFin.nodalNumbering.slice(startIndex, startIndex + currentChunkSize));
  startIndex += currentChunkSize;
}

newFin.nodalNumbering = tempElementArr;
  
  // });

  // if (useKernel) {
  //   await taichiRunner.runKernel(useKernel);
  // }
  return newFin;
};

export { importGmsh };
