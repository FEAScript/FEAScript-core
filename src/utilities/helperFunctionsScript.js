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
 * Function to calculate the Euclidean norm of a vector
 * @param {array} vector - The input vector
 * @returns {number} The Euclidean norm of the vector
 */
export function euclideanNorm(vector) {
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    sum += vector[i] * vector[i];
  }
  return Math.sqrt(sum);
}

/**
 * Function to calculate the system size from mesh configuration
 * @param {object} meshConfig - The mesh configuration object
 * @returns {number} The total number of nodes in the system
 */
export function calculateSystemSize(meshConfig) {
  // If meshConfig has explicit node count, use it
  if (meshConfig.totalNodes) {
    return meshConfig.totalNodes;
  }
  
  // For structured mesh configurations
  if (meshConfig.meshDimension === "1D") {
    return meshConfig.numElements + 1;
  } else if (meshConfig.meshDimension === "2D") {
    // For 2D, estimate based on mesh type and elements
    if (meshConfig.numElements) {
      // Simple estimation - actual calculation would depend on mesh structure
      return Math.ceil(Math.sqrt(meshConfig.numElements)) + 1;
    }
  }
  
  // Fallback: try to get from node coordinates if available
  if (meshConfig.nodesCoordinates && typeof meshConfig.nodesCoordinates === 'object') {
    return Object.keys(meshConfig.nodesCoordinates).length;
  }
  
  // Default fallback
  return 100;
}