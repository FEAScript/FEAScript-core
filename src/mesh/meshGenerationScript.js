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
 * Basic structure for the mesh
 */
export class Mesh {
  /**
   * Constructor to initialize the meshGeneration class
   * @param {object} config - Configuration object for the mesh
   * @param {number} [config.numElementsX] - Number of elements along the x-axis (required for geometry-based mesh)
   * @param {number} [config.maxX] - Maximum x-coordinate of the mesh (required for geometry-based mesh)
   * @param {number} [config.numElementsY=1] - Number of elements along the y-axis (for 1D meshes)
   * @param {number} [config.maxY=0] - Maximum y-coordinate of the mesh (for 1D meshes)
   * @param {string} [config.meshDimension='2D'] - The dimension of the mesh, either 1D or 2D
   * @param {string} [config.elementOrder='linear'] - The order of elements, either 'linear' or 'quadratic'
   * @param {object} [config.parsedMesh=null] - Optional pre-parsed mesh data
   */
    constructor({
      numElementsX = null,
      maxX = null,
      numElementsY = null,
      maxY = null,
      meshDimension = null,
      elementOrder = "linear",
      parsedMesh = null,
    }) {
      this.numElementsX = numElementsX;
      this.numElementsY = numElementsY;
      this.maxX = maxX;
      this.maxY = maxY;
      this.meshDimension = meshDimension;
      this.elementOrder = elementOrder;
      this.parsedMesh = parsedMesh;

      this.boundaryElementsProcessed = false

      if (this.parsedMesh) {
        basicLog("Using pre-parsed mesh from gmshReader data for mesh generation.");
        this.parseMeshFromGmsh();
      }
    }

    /**
     * Method to parse the mesh from the GMSH format to the FEAScript format
     */
    parseMeshFromGmsh() {

      if (!this.parsedMesh.nodalNumbering) {
        errorLog("No valid nodal numbering found in the parsed mesh.");
        throw new Error("No valid nodal numbering found in the parsed mesh.");
      }
      
      if (
          typeof this.parsedMesh.nodalNumbering === "object" &&
          !Array.isArray(this.parsedMesh.nodalNumbering)
      ) {
        // Store the nodal numbering structure before converting
        const quadElements = this.parsedMesh.nodalNumbering.quadElements || [];
        const triangleElements = this.parsedMesh.nodalNumbering.triangleElements || [];

        debugLog(
          "Initial parsed mesh nodal numbering from GMSH format: " +
            JSON.stringify(this.parsedMesh.nodalNumbering)
        );

        // Check if it has quadElements or triangleElements structure from gmshReader
          if (this.parsedMesh.elementTypes[3] || this.parsedMesh.elementTypes[10]) {
            // Map nodal numbering from GMSH format to FEAScript format for quad elements
            const mappedNodalNumbering = [];

            for (let elemIdx = 0; elemIdx < quadElements.length; elemIdx++) {
              const gmshNodes = quadElements[elemIdx];
              const feaScriptNodes = new Array(gmshNodes.length);

              // Check for element type based on number of nodes
              if (gmshNodes.length === 4) {
                // Simple mapping for linear quad elements (4 nodes)
                // GMSH:         FEAScript:
                // 3 --- 2       1 --- 3
                // |     |  -->  |     |
                // 0 --- 1       0 --- 2

                feaScriptNodes[0] = gmshNodes[0]; // 0 -> 0
                feaScriptNodes[1] = gmshNodes[3]; // 3 -> 1
                feaScriptNodes[2] = gmshNodes[1]; // 1 -> 2
                feaScriptNodes[3] = gmshNodes[2]; // 2 -> 3
              } else if (gmshNodes.length === 9) {
                // Mapping for quadratic quad elements (9 nodes)
                // GMSH:         FEAScript:
                // 3--6--2       2--5--8
                // |     |       |     |
                // 7  8  5  -->  1  4  7
                // |     |       |     |
                // 0--4--1       0--3--6

                feaScriptNodes[0] = gmshNodes[0]; // 0 -> 0
                feaScriptNodes[1] = gmshNodes[7]; // 7 -> 1
                feaScriptNodes[2] = gmshNodes[3]; // 3 -> 2
                feaScriptNodes[3] = gmshNodes[4]; // 4 -> 3
                feaScriptNodes[4] = gmshNodes[8]; // 8 -> 4
                feaScriptNodes[5] = gmshNodes[6]; // 6 -> 5
                feaScriptNodes[6] = gmshNodes[1]; // 1 -> 6
                feaScriptNodes[7] = gmshNodes[5]; // 5 -> 7
                feaScriptNodes[8] = gmshNodes[2]; // 2 -> 8
              }

              mappedNodalNumbering.push(feaScriptNodes);
            }

            this.parsedMesh.nodalNumbering = mappedNodalNumbering;
          } else if (this.parsedMesh.elementTypes[2]) {
            debugLog("Element type is neither triangle nor quad; mapping for this type is not implemented yet.");
          }

          debugLog(
            "Nodal numbering after mapping from GMSH to FEAScript format: " +
              JSON.stringify(this.parsedMesh.nodalNumbering)
          );

          // Process boundary elements if they exist and if physical property mapping exists
          if (this.parsedMesh.physicalPropMap && this.parsedMesh.boundaryElements) {
            // Check if boundary elements need to be processed
            if (
              Array.isArray(this.parsedMesh.boundaryElements) &&
              this.parsedMesh.boundaryElements.length > 0 &&
              this.parsedMesh.boundaryElements[0] === undefined
            ) {
              // Create a new array without the empty first element
              const fixedBoundaryElements = [];
              for (let i = 1; i < this.parsedMesh.boundaryElements.length; i++) {
                if (this.parsedMesh.boundaryElements[i]) {
                  fixedBoundaryElements.push(this.parsedMesh.boundaryElements[i]);
                }
              }
              this.parsedMesh.boundaryElements = fixedBoundaryElements;
            }

            // If boundary node pairs exist but boundary elements haven't been processed
            if (this.parsedMesh.boundaryNodePairs && !this.parsedMesh.boundaryElementsProcessed) {
              // Reset boundary elements array
              this.parsedMesh.boundaryElements = [];

              // Process each physical property from the Gmsh file
              this.parsedMesh.physicalPropMap.forEach((prop) => {
                // Only process 1D physical entities (boundary lines)
                if (prop.dimension === 1) {
                  // Get all node pairs for this boundary
                  const boundaryNodePairs = this.parsedMesh.boundaryNodePairs[prop.tag] || [];

                  if (boundaryNodePairs.length > 0) {
                    // Initialize array for this boundary tag
                    if (!this.parsedMesh.boundaryElements[prop.tag]) {
                      this.parsedMesh.boundaryElements[prop.tag] = [];
                    }

                    // For each boundary line segment (defined by a pair of nodes)
                    boundaryNodePairs.forEach((nodesPair) => {
                      const node1 = nodesPair[0]; // First node in the pair
                      const node2 = nodesPair[1]; // Second node in the pair

                      debugLog(
                        `Processing boundary node pair: [${node1}, ${node2}] for boundary ${prop.tag} (${
                          prop.name || "unnamed"
                        })`
                      );

                      // Search through all elements to find which one contains both nodes
                      let foundElement = false;

                      // Loop through all elements in the mesh
                      for (let elemIdx = 0; elemIdx < this.parsedMesh.nodalNumbering.length; elemIdx++) {
                        const elemNodes = this.parsedMesh.nodalNumbering[elemIdx];

                        // For linear quadrilateral linear elements (4 nodes)
                        if (elemNodes.length === 4) {
                          // Check if both boundary nodes are in this element
                          if (elemNodes.includes(node1) && elemNodes.includes(node2)) {
                            // Find which side of the element these nodes form
                            let side;

                            const node1Index = elemNodes.indexOf(node1);
                            const node2Index = elemNodes.indexOf(node2);

                            debugLog(
                              `  Found element ${elemIdx} containing boundary nodes. Element nodes: [${elemNodes.join(
                                ", "
                              )}]`
                            );
                            debugLog(
                              `  Node ${node1} is at index ${node1Index}, Node ${node2} is at index ${node2Index} in the element`
                            );

                            // Based on FEAScript linear quadrilateral numbering:
                            // 1 --- 3
                            // |     |
                            // 0 --- 2

                            if (
                              (node1Index === 0 && node2Index === 2) ||
                              (node1Index === 2 && node2Index === 0)
                            ) {
                              side = 0; // Bottom side
                              debugLog(`  These nodes form the BOTTOM side (${side}) of element ${elemIdx}`);
                            } else if (
                              (node1Index === 0 && node2Index === 1) ||
                              (node1Index === 1 && node2Index === 0)
                            ) {
                              side = 1; // Left side
                              debugLog(`  These nodes form the LEFT side (${side}) of element ${elemIdx}`);
                            } else if (
                              (node1Index === 1 && node2Index === 3) ||
                              (node1Index === 3 && node2Index === 1)
                            ) {
                              side = 2; // Top side
                              debugLog(`  These nodes form the TOP side (${side}) of element ${elemIdx}`);
                            } else if (
                              (node1Index === 2 && node2Index === 3) ||
                              (node1Index === 3 && node2Index === 2)
                            ) {
                              side = 3; // Right side
                              debugLog(`  These nodes form the RIGHT side (${side}) of element ${elemIdx}`);
                            }

                            // Add the element and side to the boundary elements array
                            this.parsedMesh.boundaryElements[prop.tag].push([elemIdx, side]);
                            debugLog(
                              `  Added element-side pair [${elemIdx}, ${side}] to boundary tag ${prop.tag}`
                            );
                            foundElement = true;
                            break;
                          }
                        } else if (elemNodes.length === 9) {
                          // For quadratic quadrilateral elements (9 nodes)
                          // Check if both boundary nodes are in this element
                          if (elemNodes.includes(node1) && elemNodes.includes(node2)) {
                            // Find which side of the element these nodes form
                            let side;

                            const node1Index = elemNodes.indexOf(node1);
                            const node2Index = elemNodes.indexOf(node2);

                            debugLog(
                              `  Found element ${elemIdx} containing boundary nodes. Element nodes: [${elemNodes.join(
                                ", "
                              )}]`
                            );
                            debugLog(
                              `  Node ${node1} is at index ${node1Index}, Node ${node2} is at index ${node2Index} in the element`
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
                              debugLog(`  These nodes form the BOTTOM side (${side}) of element ${elemIdx}`);
                            } else if (
                              (node1Index === 0 && node2Index === 2) ||
                              (node1Index === 2 && node2Index === 0) ||
                              (node1Index === 0 && node2Index === 1) ||
                              (node1Index === 1 && node2Index === 0) ||
                              (node1Index === 1 && node2Index === 2) ||
                              (node1Index === 2 && node2Index === 1)
                            ) {
                              side = 1; // Left side (nodes 0, 1, 2)
                              debugLog(`  These nodes form the LEFT side (${side}) of element ${elemIdx}`);
                            } else if (
                              (node1Index === 2 && node2Index === 8) ||
                              (node1Index === 8 && node2Index === 2) ||
                              (node1Index === 2 && node2Index === 5) ||
                              (node1Index === 5 && node2Index === 2) ||
                              (node1Index === 5 && node2Index === 8) ||
                              (node1Index === 8 && node2Index === 5)
                            ) {
                              side = 2; // Top side (nodes 2, 5, 8)
                              debugLog(`  These nodes form the TOP side (${side}) of element ${elemIdx}`);
                            } else if (
                              (node1Index === 6 && node2Index === 8) ||
                              (node1Index === 8 && node2Index === 6) ||
                              (node1Index === 6 && node2Index === 7) ||
                              (node1Index === 7 && node2Index === 6) ||
                              (node1Index === 7 && node2Index === 8) ||
                              (node1Index === 8 && node2Index === 7)
                            ) {
                              side = 3; // Right side (nodes 6, 7, 8)
                              debugLog(`  These nodes form the RIGHT side (${side}) of element ${elemIdx}`);
                            }

                            // Add the element and side to the boundary elements array
                            this.parsedMesh.boundaryElements[prop.tag].push([elemIdx, side]);
                            debugLog(
                              `  Added element-side pair [${elemIdx}, ${side}] to boundary tag ${prop.tag}`
                            );
                            foundElement = true;
                            break;
                          }
                        }
                      }

                      if (!foundElement) {
                        errorLog(
                          `Could not find element containing boundary nodes ${node1} and ${node2}. Boundary may be incomplete.`
                        );
                      }
                    });
                  }
                }
              });

              // Mark as processed
              this.boundaryElementsProcessed = true;

              // Fix boundary elements array - remove undefined entries
              if (
                this.parsedMesh.boundaryElements.length > 0 &&
                this.parsedMesh.boundaryElements[0] === undefined
              ) {
                const fixedBoundaryElements = [];
                for (let i = 1; i < this.parsedMesh.boundaryElements.length; i++) {
                  if (this.parsedMesh.boundaryElements[i]) {
                    fixedBoundaryElements.push(this.parsedMesh.boundaryElements[i]);
                  }
                }
                this.parsedMesh.boundaryElements = fixedBoundaryElements;
              }
            }
          }
      }

      return this.parsedMesh;
    }


}

export class Mesh1D extends Mesh {
  /**
   * Constructor to initialize the 1D mesh
   * @param {object} config - Configuration object for the 1D mesh
   * @param {number} [config.numElementsX] - Number of elements along the x-axis (required for geometry-based mesh)
   * @param {number} [config.maxX] - Maximum x-coordinate of the mesh (required for geometry-based mesh)
   * @param {string} [config.elementOrder='linear'] - The order of elements, either 'linear' or 'quadratic'
   * @param {object} [config.parsedMesh=null] - Optional pre-parsed mesh data
   */
  constructor({
    numElementsX = null,
    maxX = null,
    elementOrder = "linear",
    parsedMesh = null,
  }) {
    super({
      numElementsX,
      maxX,
      numElementsY: 1,
      maxY: 0,
      meshDimension: "1D",
      elementOrder,
      parsedMesh,
    });

    if (this.numElementsX === null || this.maxX === null) {
      errorLog("numElementsX and maxX are required parameters when generating a 1D mesh from geometry");
    }
  }

  generateMesh() {
    let nodesXCoordinates = [];
    let nodesYCoordinates = [];
    const xStart = 0;
    let totalNodesX, deltaX;

    if (this.elementOrder === "linear") {
      totalNodesX = this.numElementsX + 1;
      deltaX = (this.maxX - xStart) / this.numElementsX;

      nodesXCoordinates[0] = xStart;
      for (let nodeIndex = 1; nodeIndex < totalNodesX; nodeIndex++) {
        nodesXCoordinates[nodeIndex] = nodesXCoordinates[nodeIndex - 1] + deltaX;
      }
    } else if (this.elementOrder === "quadratic") {
      totalNodesX = 2 * this.numElementsX + 1;
      deltaX = (this.maxX - xStart) / this.numElementsX;

      nodesXCoordinates[0] = xStart;
      for (let nodeIndex = 1; nodeIndex < totalNodesX; nodeIndex++) {
        nodesXCoordinates[nodeIndex] = nodesXCoordinates[nodeIndex - 1] + deltaX / 2;
      }
    }
    // Generate nodal numbering (NOP) array
    const nodalNumbering = this.generate1DNodalNumbering(
      this.numElementsX,
      totalNodesX,
      this.elementOrder
    );
    // Find boundary elements
    const boundaryElements = this.findBoundaryElements();

    debugLog("Generated node X coordinates: " + JSON.stringify(nodesXCoordinates));

    // Return x coordinates of nodes, total nodes, NOP array, and boundary elements
    return {
      nodesXCoordinates,
      totalNodesX,
      nodalNumbering,
      boundaryElements,
    };

    
  }

  /**
   * Function to generate the nodal numbering (NOP) array for a structured mesh
   * This array represents the connectivity between elements and their corresponding nodes
   * @param {number} numElementsX - Number of elements along the x-axis
   * @param {number} totalNodesX - Total number of nodes along the x-axis
   * @param {string} elementOrder - The order of elements, either 'linear' or 'quadratic'
   * @returns {array} NOP - A two-dimensional array which represents the element-to-node connectivity for the entire mesh
   */
  generate1DNodalNumbering(numElementsX, totalNodesX, elementOrder) {

    // TODO: The totalNodesX is not used in the original function. Verify if
    // there is a multiple calculation on the totalNodes. 

    let elementIndex = 0;
    let nop = [];

    if (elementOrder === "linear") {
      /**
       * Linear 1D elements with the following nodes representation:
       *
       *   1 --- 2
       *
       */
      for (let elementIndex = 0; elementIndex < numElementsX; elementIndex++) {
        nop[elementIndex] = [];
        for (let nodeIndex = 1; nodeIndex <= 2; nodeIndex++) {
          nop[elementIndex][nodeIndex - 1] = elementIndex + nodeIndex;
        }
      }
    } else if (elementOrder === "quadratic") {
      /**
       * Quadratic 1D elements with the following nodes representation:
       *
       *   1--2--3
       *
       */
      let columnCounter = 0;
      for (let elementIndex = 0; elementIndex < numElementsX; elementIndex++) {
        nop[elementIndex] = [];
        for (let nodeIndex = 1; nodeIndex <= 3; nodeIndex++) {
          nop[elementIndex][nodeIndex - 1] = elementIndex + nodeIndex + columnCounter;
        }
        columnCounter += 1;
      }
    }

    return nop;
  }

  /**
   * Function to find the elements that belong to each boundary of a domain
   * @returns {array} An array containing arrays of elements and their adjacent boundary side for each boundary
   * Each element in the array is of the form [elementIndex, side], where 'side' indicates which side
   * of the reference element is in contact with the physical boundary:
   *
   * For 1D domains (line segments):
   * 0 - Left node of reference element (maps to physical left endpoint)
   * 1 - Right node of reference element (maps to physical right endpoint)
   */
  findBoundaryElements() {
    const boundaryElements = [];
    const maxSides = 2 // For 1D, we only have two sides (left and right)
    for (let sideIndex = 0; sideIndex < maxSides; sideIndex++) {
      boundaryElements.push([]);
    }

    // Left boundary (element 0, side 0)
    boundaryElements[0].push([0, 0]);

    // Right boundary (last element, side 1)
    boundaryElements[1].push([this.numElementsX - 1, 1]);

    debugLog("Identified boundary elements by side: " + JSON.stringify(boundaryElements));
    this.boundaryElementsProcessed = true
    return boundaryElements;
  }
}

export class Mesh2D extends Mesh {
  /**
   * Constructor to initialize the 2D mesh
   * @param {object} config - Configuration object for the 2D mesh
   * @param {number} [config.numElementsX] - Number of elements along the x-axis (required for geometry-based mesh)
   * @param {number} [config.maxX] - Maximum x-coordinate of the mesh (required for geometry-based mesh)
   * @param {number} [config.numElementsY] - Number of elements along the y-axis (required for geometry-based mesh)
   * @param {number} [config.maxY] - Maximum y-coordinate of the mesh (required for geometry-based mesh)
   * @param {string} [config.elementOrder='linear'] - The order of elements, either 'linear' or 'quadratic'
   * @param {object} [config.parsedMesh=null] - Optional pre-parsed mesh data
   */
  constructor({
    numElementsX = null,
    maxX = null,
    numElementsY = null,
    maxY = null,
    elementOrder = "linear",
    parsedMesh = null,
  }) {
    super({
      numElementsX,
      maxX,
      numElementsY,
      maxY,
      meshDimension: "2D",
      elementOrder,
      parsedMesh,
    });

      if (this.numElementsX === null || this.maxX === null || this.numElementsY === null || this.maxY === null) {
        errorLog("numElementsX, maxX, numElementsY, and maxY are required parameters when generating a 2D mesh from geometry");
      }

    }

    generateMesh() {
      let nodesXCoordinates = [];
      let nodesYCoordinates = [];
      const xStart = 0;
      const yStart = 0;
      let totalNodesX, totalNodesY, deltaX, deltaY;

      if (this.elementOrder === "linear") {
        totalNodesX = this.numElementsX + 1;
        totalNodesY = this.numElementsY + 1;
        deltaX = (this.maxX - xStart) / this.numElementsX;
        deltaY = (this.maxY - yStart) / this.numElementsY;

        nodesXCoordinates[0] = xStart;
        nodesYCoordinates[0] = yStart;
        for (let nodeIndexY = 1; nodeIndexY < totalNodesY; nodeIndexY++) {
          nodesXCoordinates[nodeIndexY] = nodesXCoordinates[0];
          nodesYCoordinates[nodeIndexY] = nodesYCoordinates[0] + nodeIndexY * deltaY;
        }
        for (let nodeIndexX = 1; nodeIndexX < totalNodesX; nodeIndexX++) {
          const nnode = nodeIndexX * totalNodesY;
          nodesXCoordinates[nnode] = nodesXCoordinates[0] + nodeIndexX * deltaX;
          nodesYCoordinates[nnode] = nodesYCoordinates[0];
          for (let nodeIndexY = 1; nodeIndexY < totalNodesY; nodeIndexY++) {
            nodesXCoordinates[nnode + nodeIndexY] = nodesXCoordinates[nnode];
            nodesYCoordinates[nnode + nodeIndexY] = nodesYCoordinates[nnode] + nodeIndexY * deltaY;
          }
        }
      } else if (this.elementOrder === "quadratic") {
        totalNodesX = 2 * this.numElementsX + 1;
        totalNodesY = 2 * this.numElementsY + 1;
        deltaX = (this.maxX - xStart) / this.numElementsX;
        deltaY = (this.maxY - yStart) / this.numElementsY;

        nodesXCoordinates[0] = xStart;
        nodesYCoordinates[0] = yStart;
        for (let nodeIndexY = 1; nodeIndexY < totalNodesY; nodeIndexY++) {
          nodesXCoordinates[nodeIndexY] = nodesXCoordinates[0];
          nodesYCoordinates[nodeIndexY] = nodesYCoordinates[0] + (nodeIndexY * deltaY) / 2;
        }
        for (let nodeIndexX = 1; nodeIndexX < totalNodesX; nodeIndexX++) {
          const nnode = nodeIndexX * totalNodesY;
          nodesXCoordinates[nnode] = nodesXCoordinates[0] + (nodeIndexX * deltaX) / 2;
          nodesYCoordinates[nnode] = nodesYCoordinates[0];
          for (let nodeIndexY = 1; nodeIndexY < totalNodesY; nodeIndexY++) {
            nodesXCoordinates[nnode + nodeIndexY] = nodesXCoordinates[nnode];
            nodesYCoordinates[nnode + nodeIndexY] = nodesYCoordinates[nnode] + (nodeIndexY * deltaY) / 2;
          }
        }

        // Generate nodal numbering (NOP) array
        const nodalNumbering = this.generate2DNodalNumbering(
          this.numElementsX,
          this.numElementsY,
          totalNodesY,
          this.elementOrder
        );
        // Find boundary elements
        const boundaryElements = this.findBoundaryElements();

        debugLog("Generated node X coordinates: " + JSON.stringify(nodesXCoordinates));
        debugLog("Generated node Y coordinates: " + JSON.stringify(nodesYCoordinates));

        // Return x and y coordinates of nodes, total nodes, NOP array, and boundary elements
        return {
          nodesXCoordinates,
          nodesYCoordinates,
          totalNodesX,
          totalNodesY,
          nodalNumbering,
          boundaryElements,
        };
      }
  }

  /**
   * Function to generate the nodal numbering (NOP) array for a structured mesh
   * This array represents the connectivity between elements and their corresponding nodes
   * @param {number} numElementsX - Number of elements along the x-axis
   * @param {number} [numElementsY] - Number of elements along the y-axis (optional for 1D)
   * @param {number} totalNodesX - Total number of nodes along the x-axis
   * @param {number} [totalNodesY] - Total number of nodes along the y-axis (optional for 1D)
   * @param {string} elementOrder - The order of elements, either 'linear' or 'quadratic'
   * @returns {array} NOP - A two-dimensional array which represents the element-to-node connectivity for the entire mesh
   */
  generate2DNodalNumbering(numElementsX, numElementsY, totalNodesY, elementOrder) {
    let elementIndex = 0;
    let nop = [];

    if (elementOrder === "linear") {
      /**
       * Linear rectangular elements with the following nodes representation:
       *
       *   1 --- 3
       *   |     |
       *   0 --- 2
       *
       */
      let rowCounter = 0;
      let columnCounter = 2;
      for (let elementIndex = 0; elementIndex < numElementsX * numElementsY; elementIndex++) {
        rowCounter += 1;
        nop[elementIndex] = [];
        nop[elementIndex][0] = elementIndex + columnCounter - 1;
        nop[elementIndex][1] = elementIndex + columnCounter;
        nop[elementIndex][2] = elementIndex + columnCounter + numElementsY;
        nop[elementIndex][3] = elementIndex + columnCounter + numElementsY + 1;
        if (rowCounter === numElementsY) {
          columnCounter += 1;
          rowCounter = 0;
        }
      }
    } else if (elementOrder === "quadratic") {
      /**
       * Quadratic rectangular elements with the following nodes representation:
       *
       *   2--5--8
       *   |     |
       *   1  4  7
       *   |     |
       *   0--3--6
       *
       */
      for (let elementIndexX = 1; elementIndexX <= numElementsX; elementIndexX++) {
        for (let elementIndexY = 1; elementIndexY <= numElementsY; elementIndexY++) {
          nop[elementIndex] = [];
          for (let nodeIndex1 = 1; nodeIndex1 <= 3; nodeIndex1++) {
            let nodeIndex2 = 3 * nodeIndex1 - 2;
            nop[elementIndex][nodeIndex2 - 1] =
              totalNodesY * (2 * elementIndexX + nodeIndex1 - 3) + 2 * elementIndexY - 1;
            nop[elementIndex][nodeIndex2] = nop[elementIndex][nodeIndex2 - 1] + 1;
            nop[elementIndex][nodeIndex2 + 1] = nop[elementIndex][nodeIndex2 - 1] + 2;
          }
          elementIndex = elementIndex + 1;
        }
      }
    }

    return nop;

  }

  /**
   * Function to find the elements that belong to each boundary of a domain
   * @returns {array} An array containing arrays of elements and their adjacent boundary side for each boundary
   * Each element in the array is of the form [elementIndex, side], where 'side' indicates which side
   * of the reference element is in contact with the physical boundary:
   * 
   * For 2D domains (rectangular):
   * 0 - Bottom side of reference element (maps to physical bottom boundary)
   * 1 - Left side of reference element (maps to physical left boundary)
   * 2 - Top side of reference element (maps to physical top boundary)
   * 3 - Right side of reference element (maps to physical right boundary)
   */
  findBoundaryElements() {
    const boundaryElements = [];
    const maxSides = 4; // For 2D, we have four sides (left, right, bottom, top)

    for (let sideIndex = 0; sideIndex < maxSides; sideIndex++) {
      boundaryElements.push([]);
    }

    // TODO: Why to loop through all elements? Is it not better to loop over only the
    // elements that are on the boundary? eg: [0, this.numElementsX - 1] on x and
    // [0, this.numElementsY - 1] on y
    for (let elementIndexX = 0; elementIndexX < this.numElementsX; elementIndexX++) {
      for (let elementIndexY = 0; elementIndexY < this.numElementsY; elementIndexY++) {

        const elementIndex = elementIndexX * this.numElementsY + elementIndexY;

        // Bottom boundary
        if (elementIndexY === 0) {
          boundaryElements[0].push([elementIndex, 0]);
        }

        // Left boundary
        if (elementIndexX === 0) {
          boundaryElements[1].push([elementIndex, 1]);
        }

        // Top boundary
        if (elementIndexY === this.numElementsY - 1) {
          boundaryElements[2].push([elementIndex, 2]);
        }

        // Right boundary
        if (elementIndexX === this.numElementsX - 1) {
          boundaryElements[3].push([elementIndex, 3]);
        }
      }
    }

    debugLog("Identified boundary elements by side: " + JSON.stringify(boundaryElements));
    this.boundaryElementsProcessed = true
    return boundaryElements;

  }
}

/**
 * Class to handle the generation of structured finite element meshes
 */
export class meshGeneration {
  /**
   * Constructor to initialize the meshGeneration class
   * @param {object} config - Configuration object for the mesh
   * @param {number} [config.numElementsX] - Number of elements along the x-axis (required for geometry-based mesh)
   * @param {number} [config.maxX] - Maximum x-coordinate of the mesh (required for geometry-based mesh)
   * @param {number} [config.numElementsY=1] - Number of elements along the y-axis (for 1D meshes)
   * @param {number} [config.maxY=0] - Maximum y-coordinate of the mesh (for 1D meshes)
   * @param {string} [config.meshDimension='2D'] - The dimension of the mesh, either 1D or 2D
   * @param {string} [config.elementOrder='linear'] - The order of elements, either 'linear' or 'quadratic'
   * @param {object} [config.parsedMesh=null] - Optional pre-parsed mesh data
   */
  constructor({
    numElementsX = null,
    maxX = null,
    numElementsY = null,
    maxY = null,
    meshDimension = null,
    elementOrder = "linear",
    parsedMesh = null,
  }) {
    this.numElementsX = numElementsX;
    this.numElementsY = numElementsY;
    this.maxX = maxX;
    this.maxY = maxY;
    this.meshDimension = meshDimension;
    this.elementOrder = elementOrder;
    this.parsedMesh = parsedMesh;
  }

  /**
   * Function to generate the mesh based on the dimension or use a pre-parsed mesh
   * @returns {object} The generated mesh containing node coordinates and total nodes
   */
  generateMesh() {
    // If pre-parsed mesh data is provided, use it directly
    if (this.parsedMesh) {
      // Process the nodalNumbering from gmshReader format to the format expected by the solver
      if (this.parsedMesh.nodalNumbering) {
        if (
          typeof this.parsedMesh.nodalNumbering === "object" &&
          !Array.isArray(this.parsedMesh.nodalNumbering)
        ) {
          // Store the nodal numbering structure before converting
          const quadElements = this.parsedMesh.nodalNumbering.quadElements || [];
          const triangleElements = this.parsedMesh.nodalNumbering.triangleElements || [];

          debugLog(
            "Initial parsed mesh nodal numbering from GMSH format: " +
              JSON.stringify(this.parsedMesh.nodalNumbering)
          );

          // Check if it has quadElements or triangleElements structure from gmshReader
          if (this.parsedMesh.elementTypes[3] || this.parsedMesh.elementTypes[10]) {
            // Map nodal numbering from GMSH format to FEAScript format for quad elements
            const mappedNodalNumbering = [];

            for (let elemIdx = 0; elemIdx < quadElements.length; elemIdx++) {
              const gmshNodes = quadElements[elemIdx];
              const feaScriptNodes = new Array(gmshNodes.length);

              // Check for element type based on number of nodes
              if (gmshNodes.length === 4) {
                // Simple mapping for linear quad elements (4 nodes)
                // GMSH:         FEAScript:
                // 3 --- 2       1 --- 3
                // |     |  -->  |     |
                // 0 --- 1       0 --- 2

                feaScriptNodes[0] = gmshNodes[0]; // 0 -> 0
                feaScriptNodes[1] = gmshNodes[3]; // 3 -> 1
                feaScriptNodes[2] = gmshNodes[1]; // 1 -> 2
                feaScriptNodes[3] = gmshNodes[2]; // 2 -> 3
              } else if (gmshNodes.length === 9) {
                // Mapping for quadratic quad elements (9 nodes)
                // GMSH:         FEAScript:
                // 3--6--2       2--5--8
                // |     |       |     |
                // 7  8  5  -->  1  4  7
                // |     |       |     |
                // 0--4--1       0--3--6

                feaScriptNodes[0] = gmshNodes[0]; // 0 -> 0
                feaScriptNodes[1] = gmshNodes[7]; // 7 -> 1
                feaScriptNodes[2] = gmshNodes[3]; // 3 -> 2
                feaScriptNodes[3] = gmshNodes[4]; // 4 -> 3
                feaScriptNodes[4] = gmshNodes[8]; // 8 -> 4
                feaScriptNodes[5] = gmshNodes[6]; // 6 -> 5
                feaScriptNodes[6] = gmshNodes[1]; // 1 -> 6
                feaScriptNodes[7] = gmshNodes[5]; // 5 -> 7
                feaScriptNodes[8] = gmshNodes[2]; // 2 -> 8
              }

              mappedNodalNumbering.push(feaScriptNodes);
            }

            this.parsedMesh.nodalNumbering = mappedNodalNumbering;
          } else if (this.parsedMesh.elementTypes[2]) {
          }

          debugLog(
            "Nodal numbering after mapping from GMSH to FEAScript format: " +
              JSON.stringify(this.parsedMesh.nodalNumbering)
          );

          // Process boundary elements if they exist and if physical property mapping exists
          if (this.parsedMesh.physicalPropMap && this.parsedMesh.boundaryElements) {
            // Check if boundary elements need to be processed
            if (
              Array.isArray(this.parsedMesh.boundaryElements) &&
              this.parsedMesh.boundaryElements.length > 0 &&
              this.parsedMesh.boundaryElements[0] === undefined
            ) {
              // Create a new array without the empty first element
              const fixedBoundaryElements = [];
              for (let i = 1; i < this.parsedMesh.boundaryElements.length; i++) {
                if (this.parsedMesh.boundaryElements[i]) {
                  fixedBoundaryElements.push(this.parsedMesh.boundaryElements[i]);
                }
              }
              this.parsedMesh.boundaryElements = fixedBoundaryElements;
            }

            // If boundary node pairs exist but boundary elements haven't been processed
            if (this.parsedMesh.boundaryNodePairs && !this.parsedMesh.boundaryElementsProcessed) {
              // Reset boundary elements array
              this.parsedMesh.boundaryElements = [];

              // Process each physical property from the Gmsh file
              this.parsedMesh.physicalPropMap.forEach((prop) => {
                // Only process 1D physical entities (boundary lines)
                if (prop.dimension === 1) {
                  // Get all node pairs for this boundary
                  const boundaryNodePairs = this.parsedMesh.boundaryNodePairs[prop.tag] || [];

                  if (boundaryNodePairs.length > 0) {
                    // Initialize array for this boundary tag
                    if (!this.parsedMesh.boundaryElements[prop.tag]) {
                      this.parsedMesh.boundaryElements[prop.tag] = [];
                    }

                    // For each boundary line segment (defined by a pair of nodes)
                    boundaryNodePairs.forEach((nodesPair) => {
                      const node1 = nodesPair[0]; // First node in the pair
                      const node2 = nodesPair[1]; // Second node in the pair

                      debugLog(
                        `Processing boundary node pair: [${node1}, ${node2}] for boundary ${prop.tag} (${
                          prop.name || "unnamed"
                        })`
                      );

                      // Search through all elements to find which one contains both nodes
                      let foundElement = false;

                      // Loop through all elements in the mesh
                      for (let elemIdx = 0; elemIdx < this.parsedMesh.nodalNumbering.length; elemIdx++) {
                        const elemNodes = this.parsedMesh.nodalNumbering[elemIdx];

                        // For linear quadrilateral linear elements (4 nodes)
                        if (elemNodes.length === 4) {
                          // Check if both boundary nodes are in this element
                          if (elemNodes.includes(node1) && elemNodes.includes(node2)) {
                            // Find which side of the element these nodes form
                            let side;

                            const node1Index = elemNodes.indexOf(node1);
                            const node2Index = elemNodes.indexOf(node2);

                            debugLog(
                              `  Found element ${elemIdx} containing boundary nodes. Element nodes: [${elemNodes.join(
                                ", "
                              )}]`
                            );
                            debugLog(
                              `  Node ${node1} is at index ${node1Index}, Node ${node2} is at index ${node2Index} in the element`
                            );

                            // Based on FEAScript linear quadrilateral numbering:
                            // 1 --- 3
                            // |     |
                            // 0 --- 2

                            if (
                              (node1Index === 0 && node2Index === 2) ||
                              (node1Index === 2 && node2Index === 0)
                            ) {
                              side = 0; // Bottom side
                              debugLog(`  These nodes form the BOTTOM side (${side}) of element ${elemIdx}`);
                            } else if (
                              (node1Index === 0 && node2Index === 1) ||
                              (node1Index === 1 && node2Index === 0)
                            ) {
                              side = 1; // Left side
                              debugLog(`  These nodes form the LEFT side (${side}) of element ${elemIdx}`);
                            } else if (
                              (node1Index === 1 && node2Index === 3) ||
                              (node1Index === 3 && node2Index === 1)
                            ) {
                              side = 2; // Top side
                              debugLog(`  These nodes form the TOP side (${side}) of element ${elemIdx}`);
                            } else if (
                              (node1Index === 2 && node2Index === 3) ||
                              (node1Index === 3 && node2Index === 2)
                            ) {
                              side = 3; // Right side
                              debugLog(`  These nodes form the RIGHT side (${side}) of element ${elemIdx}`);
                            }

                            // Add the element and side to the boundary elements array
                            this.parsedMesh.boundaryElements[prop.tag].push([elemIdx, side]);
                            debugLog(
                              `  Added element-side pair [${elemIdx}, ${side}] to boundary tag ${prop.tag}`
                            );
                            foundElement = true;
                            break;
                          }
                        } else if (elemNodes.length === 9) {
                          // For quadratic quadrilateral elements (9 nodes)
                          // Check if both boundary nodes are in this element
                          if (elemNodes.includes(node1) && elemNodes.includes(node2)) {
                            // Find which side of the element these nodes form
                            let side;

                            const node1Index = elemNodes.indexOf(node1);
                            const node2Index = elemNodes.indexOf(node2);

                            debugLog(
                              `  Found element ${elemIdx} containing boundary nodes. Element nodes: [${elemNodes.join(
                                ", "
                              )}]`
                            );
                            debugLog(
                              `  Node ${node1} is at index ${node1Index}, Node ${node2} is at index ${node2Index} in the element`
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
                              debugLog(`  These nodes form the BOTTOM side (${side}) of element ${elemIdx}`);
                            } else if (
                              (node1Index === 0 && node2Index === 2) ||
                              (node1Index === 2 && node2Index === 0) ||
                              (node1Index === 0 && node2Index === 1) ||
                              (node1Index === 1 && node2Index === 0) ||
                              (node1Index === 1 && node2Index === 2) ||
                              (node1Index === 2 && node2Index === 1)
                            ) {
                              side = 1; // Left side (nodes 0, 1, 2)
                              debugLog(`  These nodes form the LEFT side (${side}) of element ${elemIdx}`);
                            } else if (
                              (node1Index === 2 && node2Index === 8) ||
                              (node1Index === 8 && node2Index === 2) ||
                              (node1Index === 2 && node2Index === 5) ||
                              (node1Index === 5 && node2Index === 2) ||
                              (node1Index === 5 && node2Index === 8) ||
                              (node1Index === 8 && node2Index === 5)
                            ) {
                              side = 2; // Top side (nodes 2, 5, 8)
                              debugLog(`  These nodes form the TOP side (${side}) of element ${elemIdx}`);
                            } else if (
                              (node1Index === 6 && node2Index === 8) ||
                              (node1Index === 8 && node2Index === 6) ||
                              (node1Index === 6 && node2Index === 7) ||
                              (node1Index === 7 && node2Index === 6) ||
                              (node1Index === 7 && node2Index === 8) ||
                              (node1Index === 8 && node2Index === 7)
                            ) {
                              side = 3; // Right side (nodes 6, 7, 8)
                              debugLog(`  These nodes form the RIGHT side (${side}) of element ${elemIdx}`);
                            }

                            // Add the element and side to the boundary elements array
                            this.parsedMesh.boundaryElements[prop.tag].push([elemIdx, side]);
                            debugLog(
                              `  Added element-side pair [${elemIdx}, ${side}] to boundary tag ${prop.tag}`
                            );
                            foundElement = true;
                            break;
                          }
                        }
                      }

                      if (!foundElement) {
                        errorLog(
                          `Could not find element containing boundary nodes ${node1} and ${node2}. Boundary may be incomplete.`
                        );
                      }
                    });
                  }
                }
              });

              // Mark as processed
              this.parsedMesh.boundaryElementsProcessed = true;

              // Fix boundary elements array - remove undefined entries
              if (
                this.parsedMesh.boundaryElements.length > 0 &&
                this.parsedMesh.boundaryElements[0] === undefined
              ) {
                const fixedBoundaryElements = [];
                for (let i = 1; i < this.parsedMesh.boundaryElements.length; i++) {
                  if (this.parsedMesh.boundaryElements[i]) {
                    fixedBoundaryElements.push(this.parsedMesh.boundaryElements[i]);
                  }
                }
                this.parsedMesh.boundaryElements = fixedBoundaryElements;
              }
            }
          }
        }
      }

      debugLog("Processed boundary elements by tag: " + JSON.stringify(this.parsedMesh.boundaryElements));

      return this.parsedMesh;
    } else {
      // Validate required geometry parameters based on mesh dimension
      if (this.meshDimension === "1D") {
        if (this.numElementsX === null || this.maxX === null) {
          errorLog("numElementsX and maxX are required parameters when generating a 1D mesh from geometry");
        }
      } else if (this.meshDimension === "2D") {
        if (
          this.numElementsX === null ||
          this.maxX === null ||
          this.numElementsY === null ||
          this.maxY === null
        ) {
          errorLog(
            "numElementsX, maxX, numElementsY, and maxY are required parameters when generating a 2D mesh from geometry"
          );
        }
      }

      // Generate mesh based on dimension
      return this.generateMeshFromGeometry();
    }
  }

  /**
   * Function to generate a structured mesh based on the geometry configuration
   * @returns {object} An object containing the coordinates of nodes,
   * total number of nodes, nodal numbering (NOP) array, and boundary elements
   */
  generateMeshFromGeometry() {
    let nodesXCoordinates = [];
    let nodesYCoordinates = [];
    const xStart = 0;
    const yStart = 0;
    let totalNodesX, totalNodesY, deltaX, deltaY;

    if (this.meshDimension === "1D") {
      if (this.elementOrder === "linear") {
        totalNodesX = this.numElementsX + 1;
        deltaX = (this.maxX - xStart) / this.numElementsX;

        nodesXCoordinates[0] = xStart;
        for (let nodeIndex = 1; nodeIndex < totalNodesX; nodeIndex++) {
          nodesXCoordinates[nodeIndex] = nodesXCoordinates[nodeIndex - 1] + deltaX;
        }
      } else if (this.elementOrder === "quadratic") {
        totalNodesX = 2 * this.numElementsX + 1;
        deltaX = (this.maxX - xStart) / this.numElementsX;

        nodesXCoordinates[0] = xStart;
        for (let nodeIndex = 1; nodeIndex < totalNodesX; nodeIndex++) {
          nodesXCoordinates[nodeIndex] = nodesXCoordinates[nodeIndex - 1] + deltaX / 2;
        }
      }
      // Generate nodal numbering (NOP) array
      const nodalNumbering = this.generateNodalNumbering(
        this.numElementsX,
        null, // numElementsY (not used in 1D)
        totalNodesX,
        null, // totalNodesY (not used in 1D)
        this.elementOrder
      );
      // Find boundary elements
      const boundaryElements = this.findBoundaryElements();

      debugLog("Generated node X coordinates: " + JSON.stringify(nodesXCoordinates));

      // Return x coordinates of nodes, total nodes, NOP array, and boundary elements
      return {
        nodesXCoordinates,
        totalNodesX,
        nodalNumbering,
        boundaryElements,
      };
    } else if (this.meshDimension === "2D") {
      if (this.elementOrder === "linear") {
        totalNodesX = this.numElementsX + 1;
        totalNodesY = this.numElementsY + 1;
        deltaX = (this.maxX - xStart) / this.numElementsX;
        deltaY = (this.maxY - yStart) / this.numElementsY;

        nodesXCoordinates[0] = xStart;
        nodesYCoordinates[0] = yStart;
        for (let nodeIndexY = 1; nodeIndexY < totalNodesY; nodeIndexY++) {
          nodesXCoordinates[nodeIndexY] = nodesXCoordinates[0];
          nodesYCoordinates[nodeIndexY] = nodesYCoordinates[0] + nodeIndexY * deltaY;
        }
        for (let nodeIndexX = 1; nodeIndexX < totalNodesX; nodeIndexX++) {
          const nnode = nodeIndexX * totalNodesY;
          nodesXCoordinates[nnode] = nodesXCoordinates[0] + nodeIndexX * deltaX;
          nodesYCoordinates[nnode] = nodesYCoordinates[0];
          for (let nodeIndexY = 1; nodeIndexY < totalNodesY; nodeIndexY++) {
            nodesXCoordinates[nnode + nodeIndexY] = nodesXCoordinates[nnode];
            nodesYCoordinates[nnode + nodeIndexY] = nodesYCoordinates[nnode] + nodeIndexY * deltaY;
          }
        }
      } else if (this.elementOrder === "quadratic") {
        totalNodesX = 2 * this.numElementsX + 1;
        totalNodesY = 2 * this.numElementsY + 1;
        deltaX = (this.maxX - xStart) / this.numElementsX;
        deltaY = (this.maxY - yStart) / this.numElementsY;

        nodesXCoordinates[0] = xStart;
        nodesYCoordinates[0] = yStart;
        for (let nodeIndexY = 1; nodeIndexY < totalNodesY; nodeIndexY++) {
          nodesXCoordinates[nodeIndexY] = nodesXCoordinates[0];
          nodesYCoordinates[nodeIndexY] = nodesYCoordinates[0] + (nodeIndexY * deltaY) / 2;
        }
        for (let nodeIndexX = 1; nodeIndexX < totalNodesX; nodeIndexX++) {
          const nnode = nodeIndexX * totalNodesY;
          nodesXCoordinates[nnode] = nodesXCoordinates[0] + (nodeIndexX * deltaX) / 2;
          nodesYCoordinates[nnode] = nodesYCoordinates[0];
          for (let nodeIndexY = 1; nodeIndexY < totalNodesY; nodeIndexY++) {
            nodesXCoordinates[nnode + nodeIndexY] = nodesXCoordinates[nnode];
            nodesYCoordinates[nnode + nodeIndexY] = nodesYCoordinates[nnode] + (nodeIndexY * deltaY) / 2;
          }
        }
      }
      // Generate nodal numbering (NOP) array
      const nodalNumbering = this.generateNodalNumbering(
        this.numElementsX,
        this.numElementsY,
        totalNodesX,
        totalNodesY,
        this.elementOrder
      );
      // Find boundary elements
      const boundaryElements = this.findBoundaryElements();

      debugLog("Generated node X coordinates: " + JSON.stringify(nodesXCoordinates));
      debugLog("Generated node Y coordinates: " + JSON.stringify(nodesYCoordinates));

      // Return x and y coordinates of nodes, total nodes, NOP array, and boundary elements
      return {
        nodesXCoordinates,
        nodesYCoordinates,
        totalNodesX,
        totalNodesY,
        nodalNumbering,
        boundaryElements,
      };
    }
  }

  /**
   * Function to find the elements that belong to each boundary of a domain
   * @returns {array} An array containing arrays of elements and their adjacent boundary side for each boundary
   * Each element in the array is of the form [elementIndex, side], where 'side' indicates which side
   * of the reference element is in contact with the physical boundary:
   *
   * For 1D domains (line segments):
   * 0 - Left node of reference element (maps to physical left endpoint)
   * 1 - Right node of reference element (maps to physical right endpoint)
   *
   * For 2D domains (rectangular):
   * 0 - Bottom side of reference element (maps to physical bottom boundary)
   * 1 - Left side of reference element (maps to physical left boundary)
   * 2 - Top side of reference element (maps to physical top boundary)
   * 3 - Right side of reference element (maps to physical right boundary)
   */
  findBoundaryElements() {
    const boundaryElements = [];
    const maxSides = this.meshDimension === "1D" ? 2 : 4; // Number of element sides based on mesh dimension
    for (let sideIndex = 0; sideIndex < maxSides; sideIndex++) {
      boundaryElements.push([]);
    }

    if (this.meshDimension === "1D") {
      // Left boundary (element 0, side 0)
      boundaryElements[0].push([0, 0]);

      // Right boundary (last element, side 1)
      boundaryElements[1].push([this.numElementsX - 1, 1]);
    } else if (this.meshDimension === "2D") {
      for (let elementIndexX = 0; elementIndexX < this.numElementsX; elementIndexX++) {
        for (let elementIndexY = 0; elementIndexY < this.numElementsY; elementIndexY++) {
          const elementIndex = elementIndexX * this.numElementsY + elementIndexY;

          // Bottom boundary
          if (elementIndexY === 0) {
            boundaryElements[0].push([elementIndex, 0]);
          }

          // Left boundary
          if (elementIndexX === 0) {
            boundaryElements[1].push([elementIndex, 1]);
          }

          // Top boundary
          if (elementIndexY === this.numElementsY - 1) {
            boundaryElements[2].push([elementIndex, 2]);
          }

          // Right boundary
          if (elementIndexX === this.numElementsX - 1) {
            boundaryElements[3].push([elementIndex, 3]);
          }
        }
      }
    }

    debugLog("Identified boundary elements by side: " + JSON.stringify(boundaryElements));
    return boundaryElements;
  }

  /**
   * Function to generate the nodal numbering (NOP) array for a structured mesh
   * This array represents the connectivity between elements and their corresponding nodes
   * @param {number} numElementsX - Number of elements along the x-axis
   * @param {number} [numElementsY] - Number of elements along the y-axis (optional for 1D)
   * @param {number} totalNodesX - Total number of nodes along the x-axis
   * @param {number} [totalNodesY] - Total number of nodes along the y-axis (optional for 1D)
   * @param {string} elementOrder - The order of elements, either 'linear' or 'quadratic'
   * @returns {array} NOP - A two-dimensional array which represents the element-to-node connectivity for the entire mesh
   */
  generateNodalNumbering(numElementsX, numElementsY, totalNodesX, totalNodesY, elementOrder) {
    let elementIndex = 0;
    let nop = [];

    if (this.meshDimension === "1D") {
      if (elementOrder === "linear") {
        /**
         * Linear 1D elements with the following nodes representation:
         *
         *   1 --- 2
         *
         */
        for (let elementIndex = 0; elementIndex < numElementsX; elementIndex++) {
          nop[elementIndex] = [];
          for (let nodeIndex = 1; nodeIndex <= 2; nodeIndex++) {
            nop[elementIndex][nodeIndex - 1] = elementIndex + nodeIndex;
          }
        }
      } else if (elementOrder === "quadratic") {
        /**
         * Quadratic 1D elements with the following nodes representation:
         *
         *   1--2--3
         *
         */
        let columnCounter = 0;
        for (let elementIndex = 0; elementIndex < numElementsX; elementIndex++) {
          nop[elementIndex] = [];
          for (let nodeIndex = 1; nodeIndex <= 3; nodeIndex++) {
            nop[elementIndex][nodeIndex - 1] = elementIndex + nodeIndex + columnCounter;
          }
          columnCounter += 1;
        }
      }
    } else if (this.meshDimension === "2D") {
      if (elementOrder === "linear") {
        /**
         * Linear rectangular elements with the following nodes representation:
         *
         *   1 --- 3
         *   |     |
         *   0 --- 2
         *
         */
        let rowCounter = 0;
        let columnCounter = 2;
        for (let elementIndex = 0; elementIndex < numElementsX * numElementsY; elementIndex++) {
          rowCounter += 1;
          nop[elementIndex] = [];
          nop[elementIndex][0] = elementIndex + columnCounter - 1;
          nop[elementIndex][1] = elementIndex + columnCounter;
          nop[elementIndex][2] = elementIndex + columnCounter + numElementsY;
          nop[elementIndex][3] = elementIndex + columnCounter + numElementsY + 1;
          if (rowCounter === numElementsY) {
            columnCounter += 1;
            rowCounter = 0;
          }
        }
      } else if (elementOrder === "quadratic") {
        /**
         * Quadratic rectangular elements with the following nodes representation:
         *
         *   2--5--8
         *   |     |
         *   1  4  7
         *   |     |
         *   0--3--6
         *
         */
        for (let elementIndexX = 1; elementIndexX <= numElementsX; elementIndexX++) {
          for (let elementIndexY = 1; elementIndexY <= numElementsY; elementIndexY++) {
            nop[elementIndex] = [];
            for (let nodeIndex1 = 1; nodeIndex1 <= 3; nodeIndex1++) {
              let nodeIndex2 = 3 * nodeIndex1 - 2;
              nop[elementIndex][nodeIndex2 - 1] =
                totalNodesY * (2 * elementIndexX + nodeIndex1 - 3) + 2 * elementIndexY - 1;
              nop[elementIndex][nodeIndex2] = nop[elementIndex][nodeIndex2 - 1] + 1;
              nop[elementIndex][nodeIndex2 + 1] = nop[elementIndex][nodeIndex2 - 1] + 2;
            }
            elementIndex = elementIndex + 1;
          }
        }
      }
    }

    return nop;
  }
}
