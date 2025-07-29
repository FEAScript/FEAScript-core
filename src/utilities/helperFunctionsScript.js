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
 * Helper function to calculate system size from mesh configuration
 * @param {object} meshConfig - Mesh configuration object
 * @returns {number} Total number of nodes in the system
 */
export function calculateSystemSize(meshConfig) {
  const { meshDimension, numElementsX, numElementsY, elementOrder, parsedMesh } = meshConfig;

  if (parsedMesh && parsedMesh.nodesXCoordinates) {
    // For parsed meshes (like from GMSH)
    return parsedMesh.nodesXCoordinates.length;
  } else {
    // For geometry-based meshes
    let nodesX,
      nodesY = 1;

    if (elementOrder === "linear") {
      nodesX = numElementsX + 1;
      if (meshDimension === "2D") nodesY = numElementsY + 1;
    } else if (elementOrder === "quadratic") {
      nodesX = 2 * numElementsX + 1;
      if (meshDimension === "2D") nodesY = 2 * numElementsY + 1;
    }

    return nodesX * nodesY;
  }
}
