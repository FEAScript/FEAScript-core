/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { mapGmshMeshToFEAScript } from "../io/gmshReader.js";
import { basicLog, debugLog, errorLog } from "../utilities/logging.js";

/**
 * Basic structure for the mesh
 */
export class Mesh {
  /**
   * Constructor to initialize the Mesh class
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

    this.boundaryElementsProcessed = false;

    if (this.parsedMesh) {
      basicLog("Using pre-parsed mesh from gmshReader data for mesh generation.");
      this.parseMeshFromGmsh();
    }
  }

  /**
   * Method to parse the mesh from the Gmsh format to the FEAScript format
   */
  parseMeshFromGmsh() {
    this.boundaryElementsProcessed = mapGmshMeshToFEAScript(this.parsedMesh);
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
  constructor({ numElementsX = null, maxX = null, elementOrder = "linear", parsedMesh = null }) {
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
    const nodalNumbering = this.generateNodalNumbering1D(this.numElementsX, totalNodesX, this.elementOrder);
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
  generateNodalNumbering1D(numElementsX, totalNodesX, elementOrder) {
    // TODO: The totalNodesX is not used in the original function. Verify if
    // there is a multiple calculation on the totalNodes.

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
   * Function to find the elements that belong to each boundary of an 1D domain
   * @returns {array} An array containing arrays of elements and their adjacent boundary side for each boundary
   * Each element in the array is of the form [elementIndex, side], where 'side' indicates which side
   * of the reference element is in contact with the physical boundary:
   * 0 - Left node of reference element (maps to physical left endpoint)
   * 1 - Right node of reference element (maps to physical right endpoint)
   */
  findBoundaryElements() {
    const boundaryElements = [];
    const maxSides = 2; // Two sides for 1D case (left and right)
    for (let sideIndex = 0; sideIndex < maxSides; sideIndex++) {
      boundaryElements.push([]);
    }

    // Left boundary (element 0, side 0)
    boundaryElements[0].push([0, 0]);

    // Right boundary (last element, side 1)
    boundaryElements[1].push([this.numElementsX - 1, 1]);

    debugLog("Identified boundary elements by side: " + JSON.stringify(boundaryElements));
    this.boundaryElementsProcessed = true;
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
   * @param {number} [config.angleLeft=90] - Left side skew angle in degrees (90 = vertical)
   * @param {number} [config.angleRight=90] - Right side skew angle in degrees (90 = vertical)
   */
  constructor({
    numElementsX = null,
    maxX = null,
    numElementsY = null,
    maxY = null,
    elementOrder = "linear",
    parsedMesh = null,
    angleLeft = 90,
    angleRight = 90,
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

    this.angleLeft = angleLeft;
    this.angleRight = angleRight;

    // Validate geometry parameters (when not using a parsed mesh)
    if (
      !parsedMesh &&
      (this.numElementsX === null || this.maxX === null || this.numElementsY === null || this.maxY === null)
    ) {
      errorLog(
        "numElementsX, maxX, numElementsY, and maxY are required parameters when generating a 2D mesh from geometry",
      );
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
    }

    // Angles are measured from the positive X-axis:
    // 90° = vertical sides (rectangle)
    // angleLeft < 90°  => left side leans right as y increases
    // angleLeft > 90°  => left side leans left
    // angleRight < 90° => right side leans left
    // angleRight > 90° => right side leans right
    if (this.angleLeft !== 90 || this.angleRight !== 90) {
      const degToRad = Math.PI / 180;
      const tanLeft = Math.tan(this.angleLeft * degToRad);
      const tanRight = Math.tan(this.angleRight * degToRad);
      const epsilon = 1e-12;

      for (let nodeIndexY = 0; nodeIndexY < totalNodesY; nodeIndexY++) {
        const rowBaseIndex = nodeIndexY;
        const y = nodesYCoordinates[rowBaseIndex];
        const xLeft = Math.abs(tanLeft) < epsilon ? 0 : y / tanLeft;
        const xRight = Math.abs(tanRight) < epsilon ? this.maxX : this.maxX - y / tanRight;

        for (let nodeIndexX = 0; nodeIndexX < totalNodesX; nodeIndexX++) {
          const nnode = nodeIndexX * totalNodesY + nodeIndexY;
          const t = totalNodesX === 1 ? 0 : nodeIndexX / (totalNodesX - 1);
          nodesXCoordinates[nnode] = xLeft + (xRight - xLeft) * t;
        }
      }
    }

    // Generate nodal numbering (NOP) array
    const nodalNumbering = this.generateNodalNumbering2D(
      this.numElementsX,
      this.numElementsY,
      totalNodesY,
      this.elementOrder,
    );

    // Find boundary elements
    const boundaryElements = this.findBoundaryElements();

    debugLog("Generated node X coordinates: " + JSON.stringify(nodesXCoordinates));
    debugLog("Generated node Y coordinates: " + JSON.stringify(nodesYCoordinates));

    // Return statement
    return {
      nodesXCoordinates,
      nodesYCoordinates,
      totalNodesX,
      totalNodesY,
      nodalNumbering,
      boundaryElements,
    };
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
  generateNodalNumbering2D(numElementsX, numElementsY, totalNodesY, elementOrder) {
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
   * Function to find the elements that belong to each boundary of a 2D domain
   * @returns {array} An array containing arrays of elements and their adjacent boundary side for each boundary
   * Each element in the array is of the form [elementIndex, side], where 'side' indicates which side
   * of the reference element is in contact with the physical boundary:
   * 0 - Bottom side of reference element (maps to physical bottom boundary in the case of a rectangular domain)
   * 1 - Left side of reference element (maps to physical left boundary in the case of a rectangular domain)
   * 2 - Top side of reference element (maps to physical top boundary in the case of a rectangular domain)
   * 3 - Right side of reference element (maps to physical right boundary in the case of a rectangular domain)
   */
  findBoundaryElements() {
    const boundaryElements = [];
    const maxSides = 4; // Four sides for a rectangle 2D case (left, right, bottom, top)

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
    this.boundaryElementsProcessed = true;
    return boundaryElements;
  }
}
