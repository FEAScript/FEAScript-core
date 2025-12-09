/**
 * ════════════════════════════════════════════════════════════
 *  FEAScript Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.1.4 | https://feascript.com
 * ════════════════════════════════════════════════════════════
 */

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

  // Use the parsed mesh in case it was already passed with Gmsh format
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
  const numNodes = nop[0].length;

  return {
    residualVector,
    jacobianMatrix,
    localToGlobalMap,
    basisFunctions,
    gaussPoints,
    gaussWeights,
    numNodes,
  };
}

/**
 * Function to perform isoparametric mapping for 1D elements
 * @param {object} params - Parameters for the mapping
 * @returns {object} An object containing the mapped data
 */
export function performIsoparametricMapping1D(params) {
  const { basisFunction, basisFunctionDerivKsi, nodesXCoordinates, localToGlobalMap, numNodes } = params;

  let xCoordinates = 0;
  let ksiDerivX = 0;

  // Isoparametric mapping
  for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
    xCoordinates += nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunction[localNodeIndex];
    ksiDerivX += nodesXCoordinates[localToGlobalMap[localNodeIndex]] * basisFunctionDerivKsi[localNodeIndex];
  }
  let detJacobian = ksiDerivX;

  // Compute x-derivative of basis functions
  let basisFunctionDerivX = [];
  for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
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
    numNodes,
  } = params;

  let xCoordinates = 0;
  let yCoordinates = 0;
  let ksiDerivX = 0;
  let etaDerivX = 0;
  let ksiDerivY = 0;
  let etaDerivY = 0;

  // Isoparametric mapping
  for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
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
  for (let localNodeIndex = 0; localNodeIndex < numNodes; localNodeIndex++) {
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
 * Function to split the quadrilateral elements into two triangles
 * @param {object} meshData - Object containing mesh connectivity (nop)
 * @param {number} elementIndex - Index of the element to process
 * @returns {array} Array of element connectivity for the two triangles
 */
export function splitQuadrilateral(meshData) {
  const elementConnectivity = meshData.nop[elementIndex];
  // Check if the element is linear quadrilateral
  if (elementConnectivity.length === 4) {
    const splitElementConnectivity = elementConnectivity;
    return [
      [splitElementConnectivity[0], splitElementConnectivity[1], splitElementConnectivity[3]],
      [splitElementConnectivity[0], splitElementConnectivity[2], splitElementConnectivity[3]],
    ];
    // Check if the element is quadratic quadrilateral
  } else if (elementConnectivity.length === 9) {
    const splitElementConnectivity = elementConnectivity;
    return [
      [splitElementConnectivity[0], splitElementConnectivity[2], splitElementConnectivity[8]],
      [splitElementConnectivity[0], splitElementConnectivity[6], splitElementConnectivity[8]],
    ];
  }
}

/**
 * Function to test if a point is inside a triangle using barycentric coordinates
 * @param {number} x - X-coordinate of the point
 * @param {number} y - Y-coordinate of the point
 * @param {array} vertices - Triangle vertices [[x0,y0],[x1,y1],[x2,y2]]
 * @returns {boolean} True if the point is inside (or on the edge of) the triangle
 */
export function pointInsideTriangle(x, y, vertices) {
  const tolerance = 1e-12;
  const [v0, v1, v2] = vertices;
  const denom = (v1[1] - v2[1]) * (v0[0] - v2[0]) + (v2[0] - v1[0]) * (v0[1] - v2[1]);
  const a = ((v1[1] - v2[1]) * (x - v2[0]) + (v2[0] - v1[0]) * (y - v2[1])) / denom;
  const b = ((v2[1] - v0[1]) * (x - v2[0]) + (v0[0] - v2[0]) * (y - v2[1])) / denom;
  const c = 1 - a - b;
  if (a >= -tolerance && b >= -tolerance && c >= -tolerance) {
    return true;
  }
}

/**
 * Function to assemble the list of elements that touch each global node
 * @param {object} meshData - Object containing mesh connectivity (nop)
 * @returns {object} Indices of neighboring elements per node
 */
export function computeNodeNeighbors(meshData) {
  const { nop, nodesXCoordinates } = meshData;
  const totalNodes = nodesXCoordinates.length;
  const nodesPerElement = nop[0].length;
  const nodeNeighbors = Array.from({ length: totalNodes }, () => []);

  for (let elemIndex = 0; elemIndex < nop.length; elemIndex++) {
    for (let localNodeIndex = 0; localNodeIndex < nodesPerElement; localNodeIndex++) {
      const nodeId = nop[elemIndex][localNodeIndex] - 1;
      nodeNeighbors[nodeId].push(elemIndex);
    }
  }

  return { nodeNeighbors };
}
