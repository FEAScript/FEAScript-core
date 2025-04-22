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
 * Class to handle the generation of structured finite element meshes
 */

import { importGmshQuadTri } from '../readers/gmshQuadReader.js';

export class meshGeneration {
  /**
   * Constructor to initialize the meshGeneration class
   * @param {object} config - Configuration object for the mesh
   * @param {number} config.numElementsX - Number of elements along the x-axis
   * @param {number} config.maxX - Maximum x-coordinate of the mesh
   * @param {number} [config.numElementsY=1] - Number of elements along the y-axis (default is 1 for 1D meshes)
   * @param {number} [config.maxY=0] - Maximum y-coordinate of the mesh (default is 0 for 1D meshes)
   * @param {string} [config.meshDimension='2D'] - The dimension of the mesh, either 1D or 2D (default is 2D)
   * @param {string} [config.meshFile=null] - Optional mesh file (JSON) for predefined meshes
   * @param {string} [config.elementOrder='linear'] - The order of elements, either 'linear' or 'quadratic' (default is 'linear')
   */
  constructor({
    numElementsX,
    maxX,
    numElementsY = 1,
    maxY = 0,
    meshDimension = "2D",
    meshFile = null,
    elementOrder = "linear",
  }) {
    this.numElementsX = numElementsX;
    this.numElementsY = numElementsY;
    this.maxX = maxX;
    this.maxY = maxY;
    this.meshDimension = meshDimension;
    this.meshFile = meshFile;
    this.elementOrder = elementOrder;
  }

  /**
   * Generate the mesh based on the dimension or custom mesh file
   * @returns {object} The generated mesh containing node coordinates and total nodes
   */
  generateMesh() {
    if (this.meshFile) {
      // If a custom mesh file is provided, read and parse it
      const meshData = this.generateMeshFromCustomFile(this.meshFile);
      return meshData;
    } else {
      // Generate mesh based on dimension
      return this.generateMeshFromGeometry();
    }
  }

  /**
   * Parse a custom mesh JSON file and generate the mesh
   * @param {string} meshFilePath - Path to the custom mesh file (JSON format)
   * @returns {object} Mesh data containing coordinates and connectivity
   */
  generateMeshFromCustomFile(meshFilePath) {
    const response = fetch(meshFilePath);
    const meshData = response.json();

    const nodesXCoordinates = [];
    const nodesYCoordinates = [];
    const { nodes, elements } = meshData;

    // Parse the node coordinates
    nodes.forEach((node) => {
      nodesXCoordinates.push(node.x);
      nodesYCoordinates.push(node.y);
    });

    return {
      nodesXCoordinates,
      nodesYCoordinates,
      totalNodesX: nodesXCoordinates.length,
      totalNodesY: nodesYCoordinates.length,
      elements,
    };
  }

 /**
   * Generate a structured mesh based on the msh file
   * @returns {object} An object containing the coordinates of nodes,
   * total number of nodes, nodal numbering (NOP) array, and boundary elements
   */
  async generateMeshFromMshFile(file){

    //for now i have made a parsing of simple quadrilateral .msh file of version 4.1
    const outputMesh = await importGmshQuadTri(file);

    return outputMesh
  }

  /**
   * Generate a structured mesh based on the geometry configuration
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
      const nodalNumbering = this.generateNodalNumbering(this.numElementsX, totalNodesX, this.elementOrder);
      // Find boundary elements
      const boundaryElements = this.findBoundaryElements();

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
          nodesYCoordinates[nodeIndexY] = nodesYCoordinates[0] + (nodeIndexY * deltaY);
        }
        for (let nodeIndexX = 1; nodeIndexX < totalNodesX; nodeIndexX++) {
          const nnode = nodeIndexX * totalNodesY;
          nodesXCoordinates[nnode] = nodesXCoordinates[0] + (nodeIndexX * deltaX);
          nodesYCoordinates[nnode] = nodesYCoordinates[0];
          for (let nodeIndexY = 1; nodeIndexY < totalNodesY; nodeIndexY++) {
            nodesXCoordinates[nnode + nodeIndexY] = nodesXCoordinates[nnode];
            nodesYCoordinates[nnode + nodeIndexY] = nodesYCoordinates[nnode] + (nodeIndexY * deltaY);
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
   * Find the elements that belong to each boundary for a simple rectangular domain
   * @returns {array} An array containing arrays of elements and their adjacent boundary side for each boundary
   * Each element in the array is of the form [elementIndex, side], where side for a rectangular element is:
   * 0 - Bottom side
   * 1 - Left side
   * 2 - Top side
   * 3 - Right side
   *
   * Example representation of boundaryElements array in case of a rectangular element:
   * boundaryElements = [
   *   [[element1, 0], [element2, 0], [element3, 0], ...], // Bottom boundary
   *   [[element*, 1], [element*, 1], [element*, 1], ...], // Left boundary
   *   [[element*, 2], [element*, 2], [element*, 2], ...], // Top boundary
   *   [[element*, 3], [element*, 3], [element*, 3], ...]  // Right boundary
   * ];
   */
  findBoundaryElements() {
    const boundaryElements = [];
    const maxSides = 4; // Number of sides of the reference element
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

    return boundaryElements;
  }

  /**
   * Generate the nodal numbering (NOP) array for a structured mesh
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
         *   1__ __2
         *
         */
        for (let elementIndex = 0; elementIndex < numElementsX; elementIndex++) {
          nop[elementIndex] = [];
          for (let nodeIndex = 1; nodeIndex <= 2; nodeIndex++) {
            nop[elementIndex][nodeIndex - 1] = i + (nodeIndex - 1);
          }
        }
      } else if (elementOrder === "quadratic") {
        /**
         * Quadratic 1D elements with the following nodes representation:
         *
         *   1__2__3
         *
         */
        let columnCounter = 2;
        for (let elementIndex = 0; elementIndex < numElementsX; elementIndex++) {
          nop[elementIndex] = [];
          for (let nodeIndex = 1; nodeIndex <= 3; nodeIndex++) {
            nop[elementIndex][nodeIndex - 1] = elementIndex + (nodeIndex - 1) + columnCounter;
          }
          columnCounter += 1;
        }
      }
    } else if (this.meshDimension === "2D") {
      if (elementOrder === "linear") {
        /**
         * Linear rectangular elements with the following nodes representation:
         *
         *   1__ __3
         *   |     |
         *   |__ __|
         *   0     2
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
         *   2__5__8
         *   |     |
         *   1  4  7
         *   |__ __|
         *   0  3  6
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
