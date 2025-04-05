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
    totalNodesY:0
  };
  let textre = await file.text();
  textre = textre
    .split("\n")
    .map((eachLine) => eachLine.trim())
    .filter((eachLine) => eachLine != "" && eachLine != " ");

  let inNodesSections = false;

  let inElementsSecitons = false;

  let inMeshSections = false;

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
    lineNumber = lineNumber + 1;
    if (inMeshSections) {
      let temp = line.split(" ");
      let gmshVersion = parseFloat(temp[0]);
      let asciiOr = temp[1] === "0" ? true : false;
      let fltBytesOr = temp[2];

      newFin.gmshV = gmshVersion;
      newFin.ascii = asciiOr;
      newFin.fltBytes = fltBytesOr;
    }
    let temp = line.split(" ");
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
  
  // });

  // if (useKernel) {
  //   await taichiRunner.runKernel(useKernel);
  // }

  return newFin;
};

export { importGmsh };
