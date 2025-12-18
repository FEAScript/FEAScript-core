/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 (RC) | https://feascript.com
 *  MIT License © 2023–2025 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { BasisFunctions } from "./basisFunctionsScript.js";
import { Mesh1D, Mesh2D } from "./meshGenerationScript.js";
import { NumericalIntegration } from "../methods/numericalIntegrationScript.js";
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Function to prepare the mesh for finite element analysis
 * @param {object} meshConfig - Object containing computational mesh details
 * @returns {object} An object containing all mesh-related data
 */
export function prepareMesh(meshConfig) {
  const { meshDimension, numElementsX, numElementsY, maxX, maxY, elementOrder, parsedMesh } = meshConfig;

  // Create a new instance of the Mesh class
  let mesh;
  if (meshDimension === "1D") {
    mesh = new Mesh1D({ numElementsX, maxX, elementOrder, parsedMesh });
  } else if (meshDimension === "2D") {
    mesh = new Mesh2D({ numElementsX, maxX, numElementsY, maxY, elementOrder, parsedMesh });
  } else {
    errorLog("Mesh dimension must be either '1D' or '2D'.");
  }

  // Use the parsed mesh (e.g., from a Gmsh .msh import) if provided. Otherwise, generate a structured mesh
  const nodesCoordinatesAndNumbering = mesh.boundaryElementsProcessed ? mesh.parsedMesh : mesh.generateMesh();

  // Extract nodes coordinates and nodal numbering (NOP) from the mesh data
  let nodesXCoordinates = nodesCoordinatesAndNumbering.nodesXCoordinates;
  let nodesYCoordinates = nodesCoordinatesAndNumbering.nodesYCoordinates;
  let totalNodesX = nodesCoordinatesAndNumbering.totalNodesX;
  let totalNodesY = nodesCoordinatesAndNumbering.totalNodesY;
  let nop = nodesCoordinatesAndNumbering.nodalNumbering;
  let boundaryElements = nodesCoordinatesAndNumbering.boundaryElements;

  // Check the mesh type
  const isParsedMesh = parsedMesh !== undefined && parsedMesh !== null;

  // Calculate totalElements and totalNodes based on mesh type
  let totalElements, totalNodes;

  if (isParsedMesh) {
    totalElements = nop.length; // Number of elements is the length of the nodal numbering array
    totalNodes = nodesXCoordinates.length; // Number of nodes is the length of the coordinates array
    debugLog(`Using parsed mesh with ${totalElements} elements and ${totalNodes} nodes`);
  } else {
    // For structured mesh, calculate based on dimensions
    totalElements = numElementsX * (meshDimension === "2D" ? numElementsY : 1);
    totalNodes = totalNodesX * (meshDimension === "2D" ? totalNodesY : 1);
    debugLog(`Using mesh generated from geometry with ${totalElements} elements and ${totalNodes} nodes`);
  }

  return {
    nodesXCoordinates,
    nodesYCoordinates,
    totalNodesX,
    totalNodesY,
    nop,
    boundaryElements,
    totalElements,
    totalNodes,
    meshDimension,
    elementOrder,
  };
}

/**
 * Function to initialize the FEA matrices and numerical tools
 * @param {object} meshData - Object containing mesh data from prepareMesh()
 * @returns {object} An object containing initialized matrices and numerical tools
 */
export function initializeFEA(meshData) {
  const { totalNodes, nop, meshDimension, elementOrder } = meshData;

  // Initialize variables for matrix assembly
  let residualVector = [];
  let jacobianMatrix = [];
  let localToGlobalMap = [];

  // Initialize jacobianMatrix and residualVector arrays
  for (let nodeIndex = 0; nodeIndex < totalNodes; nodeIndex++) {
    residualVector[nodeIndex] = 0;
    jacobianMatrix.push([]);
    for (let colIndex = 0; colIndex < totalNodes; colIndex++) {
      jacobianMatrix[nodeIndex][colIndex] = 0;
    }
  }

  // Initialize the BasisFunctions class
  const basisFunctions = new BasisFunctions({
    meshDimension,
    elementOrder,
  });

  // Initialize the NumericalIntegration class
  const numericalIntegration = new NumericalIntegration({
    meshDimension,
    elementOrder,
  });

  // Calculate Gauss points and weights
  let gaussPointsAndWeights = numericalIntegration.getGaussPointsAndWeights();
  let gaussPoints = gaussPointsAndWeights.gaussPoints;
  let gaussWeights = gaussPointsAndWeights.gaussWeights;

  // Determine the number of nodes in the reference element based on the first element in the nop array
  const nodesPerElement = nop[0].length;

  return {
    residualVector,
    jacobianMatrix,
    localToGlobalMap,
    basisFunctions,
    gaussPoints,
    gaussWeights,
    nodesPerElement,
  };
}

/**
 * Function to perform isoparametric mapping for 1D elements
 * @param {object} params - Parameters for the mapping
 * @returns {object} An object containing the mapped data
 */
export function performIsoparametricMapping1D(params) {
  const { basisFunction, basisFunctionDerivKsi, nodesXCoordinates, localToGlobalMap, nodesPerElement } =
    params;

  let xCoordinates = 0;
  let ksiDerivX = 0;

  // Isoparametric mapping
  for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
    xCoordinates += nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunction[localNodeIndex];
    ksiDerivX += nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivKsi[localNodeIndex];
  }
  let detJacobian = ksiDerivX;

  // Compute x-derivative of basis functions
  let basisFunctionDerivX = [];
  for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
    basisFunctionDerivX[localNodeIndex] = basisFunctionDerivKsi[localNodeIndex] / detJacobian;
  }

  return {
    xCoordinates,
    detJacobian,
    basisFunctionDerivX,
  };
}

/**
 * Function to perform isoparametric mapping for 2D elements
 * @param {object} params - Parameters for the mapping
 * @returns {object} An object containing the mapped data
 */
export function performIsoparametricMapping2D(params) {
  const {
    basisFunction,
    basisFunctionDerivKsi,
    basisFunctionDerivEta,
    nodesXCoordinates,
    nodesYCoordinates,
    localToGlobalMap,
    nodesPerElement,
  } = params;

  let xCoordinates = 0;
  let yCoordinates = 0;
  let ksiDerivX = 0;
  let etaDerivX = 0;
  let ksiDerivY = 0;
  let etaDerivY = 0;

  // Isoparametric mapping
  for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
    xCoordinates += nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunction[localNodeIndex];
    yCoordinates += nodesYCoordinates[localToGlobalMap[localNodeIndex]] * basisFunction[localNodeIndex];
    ksiDerivX += nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivKsi[localNodeIndex];
    etaDerivX += nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivEta[localNodeIndex];
    ksiDerivY += nodesYCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivKsi[localNodeIndex];
    etaDerivY += nodesYCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivEta[localNodeIndex];
  }
  let detJacobian = ksiDerivX * etaDerivY - etaDerivX * ksiDerivY;

  // Compute x-derivative and y-derivative of basis functions
  let basisFunctionDerivX = [];
  let basisFunctionDerivY = [];
  for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
    // The x-derivative of the n basis function
    basisFunctionDerivX[localNodeIndex] =
      (etaDerivY * basisFunctionDerivKsi[localNodeIndex] -
        ksiDerivY * basisFunctionDerivEta[localNodeIndex]) /
      detJacobian;
    // The y-derivative of the n basis function
    basisFunctionDerivY[localNodeIndex] =
      (ksiDerivX * basisFunctionDerivEta[localNodeIndex] -
        etaDerivX * basisFunctionDerivKsi[localNodeIndex]) /
      detJacobian;
  }

  return {
    xCoordinates,
    yCoordinates,
    detJacobian,
    basisFunctionDerivX,
    basisFunctionDerivY,
  };
}

/**
 * Function to test if a point is inside a triangle using barycentric coordinates,
 * also returning the natural coordinates (ksi, eta).
 * @param {number} x - X-coordinate of the point
 * @param {number} y - Y-coordinate of the point
 * @param {array} vertices - Triangle vertices [[x0,y0],[x1,y1],[x2,y2]]
 * @returns {object} Object containing inside boolean and natural coordinates {inside, ksi, eta}
 */
export function pointInsideTriangle(x, y, vertices) {
  const tolerance = 1e-12;
  const [v0, v1, v2] = vertices;

  const denom = (v1[1] - v2[1]) * (v0[0] - v2[0]) + (v2[0] - v1[0]) * (v0[1] - v2[1]);

  const ksi = ((v1[1] - v2[1]) * (x - v2[0]) + (v2[0] - v1[0]) * (y - v2[1])) / denom;
  const eta = ((v2[1] - v0[1]) * (x - v2[0]) + (v0[0] - v2[0]) * (y - v2[1])) / denom;
  const gamma = 1 - ksi - eta;

  const inside = ksi >= -tolerance && eta >= -tolerance && gamma >= -tolerance;
  return { inside, ksi, eta };
}

/**
 * Function to test if a point is inside a quadrilateral by spliting it into triangles and using barycentric coordinates
 * @param {number} x - X-coordinate of the point
 * @param {number} y - Y-coordinate of the point
 * @param {array} vertices - Quadrilateral vertices [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]
 * @returns {object} Object containing inside boolean and natural coordinates {inside, ksi, eta}
 */
export function pointInsideQuadrilateral(x, y, vertices) {
  const [firstTriangleVertices, secondTriangleVertices] = splitQuadrilateral(vertices);
  const pointInsideFirstTriangle = pointInsideTriangle(x, y, firstTriangleVertices);
  const pointInsideSecondTriangle = pointInsideTriangle(x, y, secondTriangleVertices);

  const inside = pointInsideFirstTriangle.inside || pointInsideSecondTriangle.inside;
  let ksi = 0;
  let eta = 0;

  if (inside) {
    const [v0, v1, v2, v3] = vertices;

    // Function to calculate distance from point to line segment
    const getDistanceFromLine = (p1, p2) => {
      const num = Math.abs((p2[0] - p1[0]) * (p1[1] - y) - (p1[0] - x) * (p2[1] - p1[1]));
      const den = Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
      return num / den;
    };

    // Calculate distances to edges based on vertex order:
    //   1 (v1) --- 3 (v3)
    //   |          |
    //   0 (v0) --- 2 (v2)

    const distLeft = getDistanceFromLine(v0, v1);
    const distRight = getDistanceFromLine(v2, v3);
    const distBottom = getDistanceFromLine(v0, v2);
    const distTop = getDistanceFromLine(v1, v3);

    ksi = distLeft / (distLeft + distRight);
    eta = distBottom / (distBottom + distTop);
  }

  return { inside, ksi, eta };
}

/**
 * Function to split the quadrilateral elements into two triangles
 * @param {array} vertices - Quadrilateral vertices [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]
 * @returns {array} Array of triangle vertices: [[v0,v1,v3], [v0,v2,v3]]
 */
export function splitQuadrilateral(vertices) {
  const [v0, v1, v2, v3] = vertices;
  // Vertices order:
  //   1 --- 3
  //   |     |
  //   0 --- 2
  return [
    [v0, v1, v3],
    [v0, v2, v3],
  ];
}

/**
 * Function that finds the list of adjacent elements for each node in the mesh
 * @param {object} meshData - Object containing nodal numbering (NOP)
 * @returns {object} Object containing:
 *  - nodeNeighbors: Indices of neighboring elements per node
 *  - neighborCount: Total number of neighboring elements per node
 */
export function computeNodeNeighbors(meshData) {
  const { nop, nodesXCoordinates } = meshData;
  const totalNodes = nodesXCoordinates.length;
  const nodesPerElement = nop[0].length;

  // Initialize arrays
  const nodeNeighbors = Array.from({ length: totalNodes }, () => []);
  const neighborCount = Array(totalNodes).fill(0);

  // Loop through all elements
  for (let elemIndex = 0; elemIndex < nop.length; elemIndex++) {
    for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
      const nodeIndex = nop[elemIndex][localNodeIndex] - 1;

      // Increment the total number of neighboring elements for this node
      neighborCount[nodeIndex] = neighborCount[nodeIndex] + 1;

      // Store the element index as a neighbor of this node
      nodeNeighbors[nodeIndex].push(elemIndex);
    }
  }

  return { nodeNeighbors, neighborCount };
}

/**
 * Function to extracts boundary line segments for ray casting
 * @param {object} meshData - Object containing mesh data
 * @returns {array} Array of segments
 */
export function getBoundarySegments(meshData) {
  let boundaryLineElements = [];
  let boundaryNodesSegments = [];
  let boundaryGlobalElementIndex = 0;
  let boundarySides;
  const { nodesXCoordinates, nodesYCoordinates, nop, boundaryElements, meshDimension, elementOrder } =
    meshData;

  if (meshDimension === "1D") {
    if (elementOrder === "linear") {
      boundarySides = {
        0: [0], // Node at the left side of the reference element
        1: [1], // Node at the right side of the reference element
      };
    } else if (elementOrder === "quadratic") {
      boundarySides = {
        0: [0], // Node at the left side of the reference element
        1: [1], // Node at the right side of the reference element
      };
    }
  } else if (meshDimension === "2D") {
    if (elementOrder === "linear") {
      boundarySides = {
        0: [0, 2], // Nodes at the bottom side of the reference element
        1: [0, 1], // Nodes at the left side of the reference element
        2: [1, 3], // Nodes at the top side of the reference element
        3: [2, 3], // Nodes at the right side of the reference element
      };
    } else if (elementOrder === "quadratic") {
      boundarySides = {
        0: [0, 3, 6], // Nodes at the bottom side of the reference element
        1: [0, 1, 2], // Nodes at the left side of the reference element
        2: [2, 5, 8], // Nodes at the top side of the reference element
        3: [6, 7, 8], // Nodes at the right side of the reference element
      };
    }
  }

  // Iterate over all boundaries
  for (let boundaryIndex = 0; boundaryIndex < boundaryElements.length; boundaryIndex++) {
    // Iterate over all elements in the current boundary
    for (
      let boundaryLocalElementIndex = 0;
      boundaryLocalElementIndex < boundaryElements[boundaryIndex].length;
      boundaryLocalElementIndex++
    ) {
      boundaryLineElements[boundaryGlobalElementIndex] =
        boundaryElements[boundaryIndex][boundaryLocalElementIndex];
      boundaryGlobalElementIndex++;
      // Retrieve the element index and the side
      const [elementIndex, side] = boundaryElements[boundaryIndex][boundaryLocalElementIndex];
      let boundaryLocalNodeIndices = boundarySides[side];
      let currentElementNodesX = [];
      let currentElementNodesY = [];

      for (
        let boundaryLocalNodeIndex = 0;
        boundaryLocalNodeIndex < boundaryLocalNodeIndices.length;
        boundaryLocalNodeIndex++
      ) {
        const globalNodeIndex = nop[elementIndex][boundaryLocalNodeIndices[boundaryLocalNodeIndex]] - 1;

        currentElementNodesX.push(nodesXCoordinates[globalNodeIndex]);
        currentElementNodesY.push(nodesYCoordinates[globalNodeIndex]);
      }

      // Create segments for this element
      for (let k = 0; k < currentElementNodesX.length - 1; k++) {
        boundaryNodesSegments.push([
          [currentElementNodesX[k], currentElementNodesY[k]],
          [currentElementNodesX[k + 1], currentElementNodesY[k + 1]],
        ]);
      }
    }
  }
  return boundaryNodesSegments;
}
