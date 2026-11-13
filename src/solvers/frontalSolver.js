/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { BasisFunctions } from "../elements/basisFunctions.js";
import { initializeFEA } from "../elements/feaInitialization.js";
import { FEAScriptError } from "../utilities/errors.js";
import { basicLog, debugLog } from "../utilities/logging.js";

// Create object templates
const frontalData = {};
const frontalState = {};
const elementData = { currentElementIndex: 0 };
const frontStorage = {};
let basisFunctions;

/**
 * Function to run the frontal solver and obtain results for plotting
 *
 * The solver is independent of the physical model: the model supplies its element assembler and its
 * boundary conditions handler. Model-specific parameters (e.g. coefficient functions, the current
 * Newton-Raphson iterate) are bound into `assembleFront` by the caller.
 *
 * @param {function} assembleFront - Element assembler of the physical model. It receives
 *  `{ elementIndex, nop, meshData, basisFunctions, FEAData }` and returns
 *  `{ localJacobianMatrix, localResidualVector, ngl }`
 * @param {object} meshData - Object containing mesh data
 * @param {object} boundaryConditionsHandler - Boundary conditions object of the physical model, implementing:
 *  - imposeDirichletBoundaryConditionsFront(nodeConstraintCode, boundaryValues, solutionVector)
 *  - imposeRobinBoundaryConditionsFront(elementIndex, nodesXCoordinates, nodesYCoordinates, gaussPoints,
 *    gaussWeights, basisFunctions) (optional) - returns `{ localJacobianMatrix, localResidualVector }`,
 *    or null when the element is not on a Robin-type boundary
 * @param {array} [solutionVector] - Current Newton-Raphson iterate, passed to the Dirichlet handler so that
 *  prescribed values are imposed as increments (omit for linear problems)
 * @returns {object} An object containing the solution vector (Float64Array) and node coordinates
 */
export function runFrontalSolver(assembleFront, meshData, boundaryConditionsHandler, solutionVector) {
  // Initialize FEA components
  const FEAData = initializeFEA(meshData, { withMatrix: false });
  const totalNodes = meshData.nodesXCoordinates.length;
  const numElements = meshData.totalElements;
  const nodesPerElement = FEAData.nodesPerElement;

  // Order the elements to keep the front narrow, and size the front from its actual maximum width
  const { elementOrder, maxFrontWidth } = computeElementOrder(meshData, numElements, totalNodes);
  initializeFrontalArrays(nodesPerElement, numElements, totalNodes, maxFrontWidth);
  frontalState.elementOrder = elementOrder;
  debugLog(`Frontal solver: maximum front width ${maxFrontWidth} of ${totalNodes} nodes`);

  // Start timing for system solving (frontal algorithm)
  basicLog("Solving system using frontal...");
  console.time("systemSolving");

  // Initialize basis functions
  basisFunctions = new BasisFunctions({
    meshDimension: meshData.meshDimension,
    elementOrder: meshData.elementOrder,
    elementShape: meshData.elementShape,
  });

  // Copy node connectivity array into frontalData storage, in the order the elements enter the front
  for (let position = 0; position < meshData.totalElements; position++) {
    const elementIndex = elementOrder[position];
    for (let nodeIndex = 0; nodeIndex < FEAData.nodesPerElement; nodeIndex++) {
      frontalData.nodalNumbering[position][nodeIndex] = meshData.nop[elementIndex][nodeIndex];
    }
  }

  // Apply Dirichlet-type boundary conditions
  // Initialize all nodes with no boundary condition
  for (let nodeIndex = 0; nodeIndex < meshData.nodesXCoordinates.length; nodeIndex++) {
    frontalData.nodeConstraintCode[nodeIndex] = 0;
    frontalData.boundaryValues[nodeIndex] = 0;
  }

  boundaryConditionsHandler.imposeDirichletBoundaryConditionsFront(
    frontalData.nodeConstraintCode,
    frontalData.boundaryValues,
    solutionVector,
  );

  // Initialize global residual vector
  for (let nodeIndex = 0; nodeIndex < meshData.nodesXCoordinates.length; nodeIndex++) {
    frontalData.globalResidualVector[nodeIndex] = 0;
  }

  frontalState.totalNodes = meshData.nodesXCoordinates.length;
  frontalState.writeFlag = 0;
  frontalState.transformationFlag = 1;

  for (let elementIndex = 0; elementIndex < meshData.totalElements; elementIndex++) {
    frontalState.nodesPerElement[elementIndex] = FEAData.nodesPerElement;
  }

  runFrontalAlgorithm(meshData, FEAData, boundaryConditionsHandler, assembleFront);

  // Copy solution
  for (let nodeIndex = 0; nodeIndex < meshData.nodesXCoordinates.length; nodeIndex++) {
    frontalData.solutionVector[nodeIndex] = frontalState.globalSolutionVector[nodeIndex];
  }

  // Output results to console for debugging
  const { nodesXCoordinates, nodesYCoordinates } = meshData;
  for (let nodeIndex = 0; nodeIndex < meshData.nodesXCoordinates.length; nodeIndex++) {
    if (meshData.meshDimension === "1D") {
      // 1D case - only output X coordinates and temperature
      debugLog(
        `${nodesXCoordinates[nodeIndex].toExponential(5)}  ${frontalData.solutionVector[
          nodeIndex
        ].toExponential(5)}`,
      );
    } else {
      // 2D case - output X, Y coordinates and temperature
      debugLog(
        `${nodesXCoordinates[nodeIndex].toExponential(5)}  ${nodesYCoordinates[nodeIndex].toExponential(
          5,
        )}  ${frontalData.solutionVector[nodeIndex].toExponential(5)}`,
      );
    }
  }

  console.timeEnd("systemSolving");
  basicLog("System solved successfully");

  const { nodesXCoordinates: finalNodesX, nodesYCoordinates: finalNodesY } = meshData;
  return {
    solutionVector: Float64Array.from(frontalData.solutionVector.slice(0, totalNodes)),
    nodesCoordinates: {
      nodesXCoordinates: finalNodesX,
      nodesYCoordinates: finalNodesY,
    },
  };
}

/**
 * Function to compute the maximum front width, i.e. the largest number of nodes that are active
 * (assembled but not yet eliminated) at the same time, when every node is eliminated right after
 * its last element has been assembled
 * @param {array} nop - Nodal numbering array (1-based node indices)
 * @param {Int32Array} elementOrder - Element indices in the order they are assembled
 * @param {number} totalNodes - Number of nodes in the mesh
 * @returns {number} Maximum front width
 */
function computeMaxFrontWidth(nop, elementOrder, totalNodes) {
  // Position (in elementOrder) of the last element of each node
  const lastAppearance = new Int32Array(totalNodes).fill(-1);
  for (let position = 0; position < elementOrder.length; position++) {
    for (const node of nop[elementOrder[position]]) lastAppearance[node - 1] = position;
  }

  const isActive = new Uint8Array(totalNodes);
  let frontWidth = 0;
  let maxFrontWidth = 0;
  for (let position = 0; position < elementOrder.length; position++) {
    const elementNodes = nop[elementOrder[position]];
    for (const node of elementNodes) {
      if (!isActive[node - 1]) {
        isActive[node - 1] = 1;
        frontWidth++;
      }
    }
    maxFrontWidth = Math.max(maxFrontWidth, frontWidth);
    for (const node of elementNodes) {
      if (lastAppearance[node - 1] === position) frontWidth--;
    }
  }

  return maxFrontWidth;
}

/**
 * Function to choose the order in which the elements enter the front. The front width, and with it the memory and
 * run time of the frontal solver, depends on this order: a front that sweeps across the short side of the domain
 * stays narrow. Four candidates are compared, and the one with the narrowest front is kept:
 *  - the order of the mesh (structured meshes are numbered across one side)
 *  - sweeps along x and along y, by element centroid
 *  - a breadth-first order through elements that share nodes, started from an element at the far end of the mesh
 *    (suits unstructured meshes and non-rectangular domains)
 * @param {object} meshData - Object containing mesh data
 * @param {number} numElements - Number of elements in the mesh
 * @param {number} totalNodes - Number of nodes in the mesh
 * @returns {object} An object containing:
 *  - elementOrder: Element indices in the order they enter the front (Int32Array)
 *  - maxFrontWidth: Maximum front width with this order
 */
function computeElementOrder(meshData, numElements, totalNodes) {
  const { nop, nodesXCoordinates, nodesYCoordinates } = meshData;
  const candidates = [Int32Array.from({ length: numElements }, (_, elementIndex) => elementIndex)];

  // Sweeps along x and y, by element centroid (ties broken by the other coordinate)
  const centroidX = new Float64Array(numElements);
  const centroidY = new Float64Array(numElements);
  for (let elementIndex = 0; elementIndex < numElements; elementIndex++) {
    const elementNodes = nop[elementIndex];
    for (const node of elementNodes) {
      centroidX[elementIndex] += nodesXCoordinates[node - 1];
      centroidY[elementIndex] += nodesYCoordinates?.[node - 1] ?? 0;
    }
    centroidX[elementIndex] /= elementNodes.length;
    centroidY[elementIndex] /= elementNodes.length;
  }
  if (meshData.meshDimension === "2D") {
    candidates.push(
      candidates[0].slice().sort((a, b) => centroidX[a] - centroidX[b] || centroidY[a] - centroidY[b]),
      candidates[0].slice().sort((a, b) => centroidY[a] - centroidY[b] || centroidX[a] - centroidX[b]),
    );

    // Breadth-first order through elements that share a node (node-to-element lists in CSR format)
    const nodeElementPointers = new Int32Array(totalNodes + 1);
    for (const elementNodes of nop) for (const node of elementNodes) nodeElementPointers[node]++;
    for (let node = 0; node < totalNodes; node++) nodeElementPointers[node + 1] += nodeElementPointers[node];
    const nodeElements = new Int32Array(nodeElementPointers[totalNodes]);
    const nextNodeElement = nodeElementPointers.slice(0, totalNodes);
    nop.forEach((elementNodes, elementIndex) => {
      for (const node of elementNodes) nodeElements[nextNodeElement[node - 1]++] = elementIndex;
    });
    const breadthFirst = (startElement) => {
      const order = new Int32Array(numElements);
      const visited = new Uint8Array(numElements);
      let count = 0;
      // Restart from the next unvisited element if the mesh has disconnected parts
      for (let seed = startElement, next = 0; count < numElements; seed = next) {
        while (visited[seed]) seed = ++next;
        visited[seed] = 1;
        order[count++] = seed;
        for (let head = count - 1; head < count; head++) {
          for (const node of nop[order[head]]) {
            for (let k = nodeElementPointers[node - 1]; k < nodeElementPointers[node]; k++) {
              const neighbour = nodeElements[k];
              if (!visited[neighbour]) {
                visited[neighbour] = 1;
                order[count++] = neighbour;
              }
            }
          }
        }
      }
      return order;
    };
    // The last element reached is far from the start; starting again from it gives narrower levels
    let startElement = 0;
    for (let pass = 0; pass < 2; pass++) startElement = breadthFirst(startElement)[numElements - 1];
    candidates.push(breadthFirst(startElement));
  }

  let best = null;
  for (const elementOrder of candidates) {
    const maxFrontWidth = computeMaxFrontWidth(nop, elementOrder, totalNodes);
    if (!best || maxFrontWidth < best.maxFrontWidth) best = { elementOrder, maxFrontWidth };
  }
  return best;
}

/**
 * Function to initialize arrays dynamically based on problem size
 * @param {number} nodesPerElement - Number of nodes per element
 * @param {number} numElements - Number of elements in the mesh
 * @param {number} totalNodes - Number of nodes in the mesh
 * @param {number} maxFrontWidth - Maximum front width
 */
function initializeFrontalArrays(nodesPerElement, numElements, totalNodes, maxFrontWidth) {
  // Use the actual number of elements from the mesh
  frontalData.nodalNumbering = Array(numElements)
    .fill()
    .map(() => Array(nodesPerElement).fill(0));
  frontalData.nodeConstraintCode = Array(totalNodes).fill(0);
  frontalData.boundaryValues = Array(totalNodes).fill(0);
  frontalData.globalResidualVector = Array(totalNodes).fill(0);
  frontalData.solutionVector = Array(totalNodes).fill(0);

  // Initialize frontalState arrays
  frontalState.writeFlag = 0;
  frontalState.totalNodes = totalNodes;
  frontalState.transformationFlag = 0;
  frontalState.nodesPerElement = Array(numElements).fill(0);
  frontalState.maxFrontWidth = maxFrontWidth;
  frontalState.globalSolutionVector = new Float64Array(totalNodes);
  frontalState.frontDataIndex = 0;

  // Initialize elementData arrays
  elementData.localJacobianMatrix = Array(nodesPerElement)
    .fill()
    .map(() => Array(nodesPerElement).fill(0));
  elementData.currentElementIndex = 0;

  // Initialize frontStorage arrays
  // Each eliminated node stores its pivot row and column headers (at most maxFrontWidth each) plus 4 values
  frontStorage.frontValues = new Float64Array(totalNodes * (2 * maxFrontWidth + 4) + 4);
  frontStorage.columnHeaders = new Float64Array(maxFrontWidth);
  frontStorage.pivotRow = new Float64Array(maxFrontWidth);
}

/**
 * Function to compute local Jacobian matrix and local residual vector
 * @param {object} meshData - Object containing mesh data
 * @param {object} FEAData - Object containing FEA-related data
 * @param {object} boundaryConditionsHandler - Boundary conditions object of the physical model
 * @param {function} assembleFront - Element assembler of the physical model
 */
function assembleElementContribution(meshData, FEAData, boundaryConditionsHandler, assembleFront) {
  // Position of the element in the assembly order, and its index in the mesh
  const position = elementData.currentElementIndex - 1;
  const elementIndex = frontalState.elementOrder[position];

  // Guard against out-of-range indices
  if (position < 0 || position >= meshData.totalElements) {
    throw new FEAScriptError(
      "INTERNAL_ERROR",
      `Frontal solver: out-of-range element position=${position} (totalElements=${meshData.totalElements})`,
    );
  }

  // Domain terms
  const { localJacobianMatrix, localResidualVector, ngl } = assembleFront({
    elementIndex,
    nop: meshData.nop,
    meshData,
    basisFunctions: basisFunctions,
    FEAData,
  });

  // Robin-type boundary terms (only for models whose handler supports them)
  const robinContribution = boundaryConditionsHandler.imposeRobinBoundaryConditionsFront?.(
    elementIndex,
    meshData.nodesXCoordinates,
    meshData.nodesYCoordinates,
    FEAData.gaussPoints,
    FEAData.gaussWeights,
    basisFunctions,
  );

  // Combine domain and boundary contributions
  for (let localNodeI = 0; localNodeI < FEAData.nodesPerElement; localNodeI++) {
    for (let localNodeJ = 0; localNodeJ < FEAData.nodesPerElement; localNodeJ++) {
      elementData.localJacobianMatrix[localNodeI][localNodeJ] =
        localJacobianMatrix[localNodeI][localNodeJ] +
        (robinContribution ? robinContribution.localJacobianMatrix[localNodeI][localNodeJ] : 0);
    }
  }

  // Assemble local element residual
  for (let localNodeIndex = 0; localNodeIndex < FEAData.nodesPerElement; localNodeIndex++) {
    const globalNodeIndex = ngl[localNodeIndex] - 1;
    frontalData.globalResidualVector[globalNodeIndex] +=
      localResidualVector[localNodeIndex] +
      (robinContribution ? robinContribution.localResidualVector[localNodeIndex] : 0);
  }

  return true;
}

/**
 * Function to implement the frontal solver algorithm
 * @param {object} meshData - Object containing mesh data
 * @param {object} FEAData - Object containing FEA-related data
 * @param {object} boundaryConditionsHandler - Boundary conditions object of the physical model
 * @param {function} assembleFront - Element assembler of the physical model
 */
function runFrontalAlgorithm(meshData, FEAData, boundaryConditionsHandler, assembleFront) {
  // Allocate local arrays dynamically
  const totalElements = meshData.totalElements;
  const totalNodes = meshData.nodesXCoordinates.length;
  const frontWidth = frontalState.maxFrontWidth;
  let localDestination = Array(FEAData.nodesPerElement).fill(0);
  let rowDestination = Array(FEAData.nodesPerElement).fill(0);
  let rowHeaders = new Float64Array(frontWidth);
  let pivotRowIndices = new Int32Array(frontWidth);
  let pivotColumnIndices = new Int32Array(frontWidth);
  let modifiedRows = new Int32Array(frontWidth);
  let frontMatrix = Array.from({ length: frontWidth }, () => new Float64Array(frontWidth));
  let lastAppearanceCheck = new Uint8Array(totalNodes);
  let pivotColumnGlobalIndex; // Pivot column global index

  let frontDataCounter = 1;
  frontalState.writeFlag++;
  let summedRows = 1;
  elementData.currentElementIndex = 0;

  if (frontalState.transformationFlag !== 0) {
    // Prefront: find last appearance of each node
    for (let elementIndex = 0; elementIndex < totalElements; elementIndex++) {
      let reverseElementIndex = totalElements - elementIndex - 1;
      for (
        let localNodeIndex = 0;
        localNodeIndex < frontalState.nodesPerElement[reverseElementIndex];
        localNodeIndex++
      ) {
        let globalNodeIndex = frontalData.nodalNumbering[reverseElementIndex][localNodeIndex];
        if (lastAppearanceCheck[globalNodeIndex - 1] === 0) {
          lastAppearanceCheck[globalNodeIndex - 1] = 1;
          frontalData.nodalNumbering[reverseElementIndex][localNodeIndex] =
            -frontalData.nodalNumbering[reverseElementIndex][localNodeIndex];
        }
      }
    }
  }

  frontalState.transformationFlag = 0;
  let columnCount = 0;
  let rowCount = 0;

  while (true) {
    // Eliminate every fully summed node before assembling the next element, which keeps the front narrow
    let hasFullySummedColumn = false;
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
      if (frontStorage.columnHeaders[columnIndex] < 0) {
        hasFullySummedColumn = true;
        break;
      }
    }

    // Assemble a new element only while we still have elements
    let assembled = false;
    let numElementNodes = 0;
    let numElementColumns = 0;

    if (!hasFullySummedColumn && elementData.currentElementIndex < totalElements) {
      elementData.currentElementIndex++;
      assembled = assembleElementContribution(meshData, FEAData, boundaryConditionsHandler, assembleFront);
    }

    if (assembled) {
      const currentElement = elementData.currentElementIndex;
      numElementNodes = frontalState.nodesPerElement[currentElement - 1];
      numElementColumns = frontalState.nodesPerElement[currentElement - 1];

      for (let localNodeIndex = 0; localNodeIndex < numElementColumns; localNodeIndex++) {
        let globalNodeIndex = frontalData.nodalNumbering[currentElement - 1][localNodeIndex];
        let columnIndex;

        if (columnCount === 0) {
          columnCount++;
          localDestination[localNodeIndex] = columnCount;
          frontStorage.columnHeaders[columnCount - 1] = globalNodeIndex;
        } else {
          for (columnIndex = 0; columnIndex < columnCount; columnIndex++) {
            if (Math.abs(globalNodeIndex) === Math.abs(frontStorage.columnHeaders[columnIndex])) break;
          }

          if (columnIndex === columnCount) {
            columnCount++;
            localDestination[localNodeIndex] = columnCount;
            frontStorage.columnHeaders[columnCount - 1] = globalNodeIndex;
          } else {
            localDestination[localNodeIndex] = columnIndex + 1;
            frontStorage.columnHeaders[columnIndex] = globalNodeIndex;
          }
        }

        let rowIndex;
        if (rowCount === 0) {
          rowCount++;
          rowDestination[localNodeIndex] = rowCount;
          rowHeaders[rowCount - 1] = globalNodeIndex;
        } else {
          for (rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            if (Math.abs(globalNodeIndex) === Math.abs(rowHeaders[rowIndex])) break;
          }

          if (rowIndex === rowCount) {
            rowCount++;
            rowDestination[localNodeIndex] = rowCount;
            rowHeaders[rowCount - 1] = globalNodeIndex;
          } else {
            rowDestination[localNodeIndex] = rowIndex + 1;
            rowHeaders[rowIndex] = globalNodeIndex;
          }
        }
      }

      if (rowCount > frontWidth || columnCount > frontWidth) {
        throw new FEAScriptError(
          "INTERNAL_ERROR",
          `Frontal solver: front width ${frontWidth} is not large enough (needs ${Math.max(
            rowCount,
            columnCount,
          )})`,
        );
      }

      for (let localColumnIndex = 0; localColumnIndex < numElementColumns; localColumnIndex++) {
        let frontColumnIndex = localDestination[localColumnIndex];
        for (let localRowIndex = 0; localRowIndex < numElementNodes; localRowIndex++) {
          let frontRowIndex = rowDestination[localRowIndex];
          frontMatrix[frontRowIndex - 1][frontColumnIndex - 1] +=
            elementData.localJacobianMatrix[localRowIndex][localColumnIndex];
        }
      }
    }

    // Pivoting/elimination continues whether or not a new element was assembled
    let availableColumnCount = 0;
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
      if (frontStorage.columnHeaders[columnIndex] < 0) {
        pivotColumnIndices[availableColumnCount] = columnIndex + 1;
        availableColumnCount++;
      }
    }

    let constrainedRowCount = 0;
    let availableRowCount = 0;
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      let globalNodeIndex = rowHeaders[rowIndex];
      if (globalNodeIndex < 0) {
        pivotRowIndices[availableRowCount] = rowIndex + 1;
        availableRowCount++;
        let absoluteNodeIndex = Math.abs(globalNodeIndex);
        if (frontalData.nodeConstraintCode[absoluteNodeIndex - 1] === 1) {
          modifiedRows[constrainedRowCount] = rowIndex + 1;
          constrainedRowCount++;
          frontalData.nodeConstraintCode[absoluteNodeIndex - 1] = 2;
          frontalData.globalResidualVector[absoluteNodeIndex - 1] =
            frontalData.boundaryValues[absoluteNodeIndex - 1];
        }
      }
    }

    if (constrainedRowCount > 0) {
      for (let constrainedIndex = 0; constrainedIndex < constrainedRowCount; constrainedIndex++) {
        let rowIndex = modifiedRows[constrainedIndex] - 1;
        let globalNodeIndex = Math.abs(rowHeaders[rowIndex]);
        for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
          frontMatrix[rowIndex][columnIndex] = 0;
          let columnGlobalIndex = Math.abs(frontStorage.columnHeaders[columnIndex]);
          if (columnGlobalIndex === globalNodeIndex) frontMatrix[rowIndex][columnIndex] = 1;
        }
      }
    }

    if (availableColumnCount > summedRows || elementData.currentElementIndex < totalElements) {
      if (availableColumnCount === 0) {
        // No node is fully summed yet (e.g. unstructured meshes); assemble the next element before eliminating
        if (elementData.currentElementIndex < totalElements) continue;

        throw new FEAScriptError("INTERNAL_ERROR", "Frontal solver: no more rows fully summed");
      }

      let pivotRowIndex = pivotRowIndices[0];
      let pivotColumnIndex = pivotColumnIndices[0];
      let pivotValue = frontMatrix[pivotRowIndex - 1][pivotColumnIndex - 1];

      if (Math.abs(pivotValue) < 1e-4) {
        pivotValue = 0;
        for (let columnIndex = 0; columnIndex < availableColumnCount; columnIndex++) {
          let testColumnIndex = pivotColumnIndices[columnIndex];
          for (let rowIndex = 0; rowIndex < availableRowCount; rowIndex++) {
            let testRowIndex = pivotRowIndices[rowIndex];
            let testValue = frontMatrix[testRowIndex - 1][testColumnIndex - 1];
            if (Math.abs(testValue) > Math.abs(pivotValue)) {
              pivotValue = testValue;
              pivotColumnIndex = testColumnIndex;
              pivotRowIndex = testRowIndex;
            }
          }
        }
      }

      let pivotGlobalRowIndex = Math.abs(rowHeaders[pivotRowIndex - 1]);
      pivotColumnGlobalIndex = Math.abs(frontStorage.columnHeaders[pivotColumnIndex - 1]); // Assign, don't declare

      if (Math.abs(pivotValue) < 1e-10) {
        throw new FEAScriptError(
          "SINGULAR_MATRIX",
          `Matrix singular or ill-conditioned, currentElementIndex=${elementData.currentElementIndex}, pivotGlobalRowIndex=${pivotGlobalRowIndex}, pivotColumnGlobalIndex=${pivotColumnGlobalIndex}, pivotValue=${pivotValue}`,
        );
      }

      for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        frontStorage.pivotRow[columnIndex] = frontMatrix[pivotRowIndex - 1][columnIndex] / pivotValue;
      }

      let rightHandSide = frontalData.globalResidualVector[pivotGlobalRowIndex - 1] / pivotValue;
      frontalData.globalResidualVector[pivotGlobalRowIndex - 1] = rightHandSide;

      if (pivotRowIndex > 1) {
        for (let rowIndex = 0; rowIndex < pivotRowIndex - 1; rowIndex++) {
          let globalRowIndex = Math.abs(rowHeaders[rowIndex]);
          let eliminationFactor = frontMatrix[rowIndex][pivotColumnIndex - 1];
          if (pivotColumnIndex > 1 && eliminationFactor !== 0) {
            for (let columnIndex = 0; columnIndex < pivotColumnIndex - 1; columnIndex++) {
              frontMatrix[rowIndex][columnIndex] -= eliminationFactor * frontStorage.pivotRow[columnIndex];
            }
          }
          if (pivotColumnIndex < columnCount) {
            for (let columnIndex = pivotColumnIndex; columnIndex < columnCount; columnIndex++) {
              frontMatrix[rowIndex][columnIndex - 1] =
                frontMatrix[rowIndex][columnIndex] - eliminationFactor * frontStorage.pivotRow[columnIndex];
            }
          }
          frontalData.globalResidualVector[globalRowIndex - 1] -= eliminationFactor * rightHandSide;
        }
      }

      if (pivotRowIndex < rowCount) {
        for (let rowIndex = pivotRowIndex; rowIndex < rowCount; rowIndex++) {
          let globalRowIndex = Math.abs(rowHeaders[rowIndex]);
          let eliminationFactor = frontMatrix[rowIndex][pivotColumnIndex - 1];
          if (pivotColumnIndex > 1) {
            for (let columnIndex = 0; columnIndex < pivotColumnIndex - 1; columnIndex++) {
              frontMatrix[rowIndex - 1][columnIndex] =
                frontMatrix[rowIndex][columnIndex] - eliminationFactor * frontStorage.pivotRow[columnIndex];
            }
          }
          if (pivotColumnIndex < columnCount) {
            for (let columnIndex = pivotColumnIndex; columnIndex < columnCount; columnIndex++) {
              frontMatrix[rowIndex - 1][columnIndex - 1] =
                frontMatrix[rowIndex][columnIndex] - eliminationFactor * frontStorage.pivotRow[columnIndex];
            }
          }
          frontalData.globalResidualVector[globalRowIndex - 1] -= eliminationFactor * rightHandSide;
        }
      }

      for (let i = 0; i < columnCount; i++) {
        frontStorage.frontValues[frontDataCounter - 1 + i] = frontStorage.pivotRow[i];
      }
      frontDataCounter += columnCount;

      for (let i = 0; i < columnCount; i++) {
        frontStorage.frontValues[frontDataCounter - 1 + i] = frontStorage.columnHeaders[i];
      }
      frontDataCounter += columnCount;

      frontStorage.frontValues[frontDataCounter - 1] = pivotGlobalRowIndex;
      frontStorage.frontValues[frontDataCounter] = columnCount;
      frontStorage.frontValues[frontDataCounter + 1] = pivotColumnIndex;
      frontStorage.frontValues[frontDataCounter + 2] = pivotValue;
      frontDataCounter += 4;

      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        frontMatrix[rowIndex][columnCount - 1] = 0;
      }

      for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        frontMatrix[rowCount - 1][columnIndex] = 0;
      }

      columnCount--;
      if (pivotColumnIndex < columnCount + 1) {
        for (let columnIndex = pivotColumnIndex - 1; columnIndex < columnCount; columnIndex++) {
          frontStorage.columnHeaders[columnIndex] = frontStorage.columnHeaders[columnIndex + 1];
        }
      }

      rowCount--;
      if (pivotRowIndex < rowCount + 1) {
        for (let rowIndex = pivotRowIndex - 1; rowIndex < rowCount; rowIndex++) {
          rowHeaders[rowIndex] = rowHeaders[rowIndex + 1];
        }
      }

      if (rowCount > 1 || elementData.currentElementIndex < totalElements) continue;

      pivotColumnGlobalIndex = Math.abs(frontStorage.columnHeaders[0]); // Assign, don't declare
      pivotRowIndex = 1;
      pivotValue = frontMatrix[0][0];
      pivotGlobalRowIndex = Math.abs(rowHeaders[0]);
      pivotColumnIndex = 1;

      frontStorage.pivotRow[0] = 1;
      if (Math.abs(pivotValue) < 1e-10) {
        throw new FEAScriptError(
          "SINGULAR_MATRIX",
          `Matrix singular or ill-conditioned, currentElementIndex=${elementData.currentElementIndex}, pivotGlobalRowIndex=${pivotGlobalRowIndex}, pivotColumnGlobalIndex=${pivotColumnGlobalIndex}, pivotValue=${pivotValue}`,
        );
      }

      frontalData.globalResidualVector[pivotGlobalRowIndex - 1] =
        frontalData.globalResidualVector[pivotGlobalRowIndex - 1] / pivotValue;
      frontStorage.frontValues[frontDataCounter - 1] = frontStorage.pivotRow[0];
      frontDataCounter++;
      frontStorage.frontValues[frontDataCounter - 1] = frontStorage.columnHeaders[0];
      frontDataCounter++;
      frontStorage.frontValues[frontDataCounter - 1] = pivotGlobalRowIndex;
      frontStorage.frontValues[frontDataCounter] = columnCount;
      frontStorage.frontValues[frontDataCounter + 1] = pivotColumnIndex;
      frontStorage.frontValues[frontDataCounter + 2] = pivotValue;
      frontDataCounter += 4;

      frontalState.frontDataIndex = frontDataCounter;
      if (frontalState.writeFlag === 1)
        debugLog(`total ecs transfer in matrix reduction=${frontDataCounter}`);

      // Back substitution
      performBackSubstitution(frontDataCounter);
      break;
    }
  }
}

/**
 * Function to perform back substitution for the frontal solver
 * @param {number} frontDataCounter - Index counter for the element contributions
 */
function performBackSubstitution(frontDataCounter) {
  for (let nodeIndex = 0; nodeIndex < frontalState.totalNodes; nodeIndex++) {
    frontalState.globalSolutionVector[nodeIndex] = frontalData.boundaryValues[nodeIndex];
  }

  for (let iterationIndex = 1; iterationIndex <= frontalState.totalNodes; iterationIndex++) {
    frontDataCounter -= 4;
    let pivotGlobalRowIndex = frontStorage.frontValues[frontDataCounter - 1];
    let columnCount = frontStorage.frontValues[frontDataCounter];
    let pivotColumnIndex = frontStorage.frontValues[frontDataCounter + 1];

    if (iterationIndex === 1) {
      frontDataCounter--;
      frontStorage.columnHeaders[0] = frontStorage.frontValues[frontDataCounter - 1];
      frontDataCounter--;
      frontStorage.pivotRow[0] = frontStorage.frontValues[frontDataCounter - 1];
    } else {
      frontDataCounter -= columnCount;
      for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        frontStorage.columnHeaders[columnIndex] =
          frontStorage.frontValues[frontDataCounter - 1 + columnIndex];
      }
      frontDataCounter -= columnCount;
      for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        frontStorage.pivotRow[columnIndex] = frontStorage.frontValues[frontDataCounter - 1 + columnIndex];
      }
    }

    let pivotColumnGlobalIndex = Math.abs(frontStorage.columnHeaders[pivotColumnIndex - 1]);
    if (frontalData.nodeConstraintCode[pivotColumnGlobalIndex - 1] > 0) continue;

    let accumulatedValue = 0;
    frontStorage.pivotRow[pivotColumnIndex - 1] = 0;
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
      accumulatedValue -=
        frontStorage.pivotRow[columnIndex] *
        frontalState.globalSolutionVector[Math.abs(frontStorage.columnHeaders[columnIndex]) - 1];
    }

    frontalState.globalSolutionVector[pivotColumnGlobalIndex - 1] =
      accumulatedValue + frontalData.globalResidualVector[pivotGlobalRowIndex - 1];

    frontalData.nodeConstraintCode[pivotColumnGlobalIndex - 1] = 1;
  }

  if (frontalState.writeFlag === 1)
    debugLog(`value of frontDataCounter after backsubstitution=${frontDataCounter}`);
}
