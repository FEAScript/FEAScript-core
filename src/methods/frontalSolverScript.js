//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

// Create object templates without preallocated arrays - must be defined before use
const frontalData = {};
const frontalState = {};
const elementData = { currentElementIndex: 0 };
const frontStorage = {};
let basisFunctionsLib; // Basis functions used by assembleElementContribution

// Internal imports
import { BasisFunctions } from "../mesh/basisFunctionsScript.js";
import { initializeFEA } from "../mesh/meshUtilsScript.js";
import { assembleSolidHeatTransferFront } from "../solvers/solidHeatTransferScript.js";
import { ThermalBoundaryConditions } from "../solvers/thermalBoundaryConditionsScript.js";
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Function to run the frontal solver and obtain results for plotting
 * @param {object} meshConfig - Configuration object for the mesh
 * @param {object} meshData - Object containing mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions
 * @returns {object} An object containing the solution vector and node coordinates
 */
export function runFrontalSolver(meshConfig, meshData, boundaryConditions) {
  // Initialize arrays dynamically based on actual problem size
  const numNodes = meshData.nodesXCoordinates.length;
  const numElements = meshData.totalElements;
  const maxNodesPerElement = getMaxNodesPerElement(meshConfig);

  // Calculate required array sizes
  initializeFrontalArrays(numNodes, numElements, maxNodesPerElement);

  // Start timing for system solving (frontal algorithm)
  basicLog("Solving system using frontal...");
  console.time("systemSolving");

  // Run the solver
  runFrontalSolverMain(meshConfig, meshData, boundaryConditions);

  console.timeEnd("systemSolving");
  basicLog("System solved successfully");

  const { nodesXCoordinates, nodesYCoordinates } = meshData;
  return {
    solutionVector: frontalData.solutionVector.slice(0, numNodes),
    nodesCoordinates: {
      nodesXCoordinates,
      nodesYCoordinates,
    },
  };
}

/**
 * Function to determine the maximum number of nodes per element based on mesh configuration
 * @param {object} meshConfig - Configuration object for the mesh
 * @returns {number} The maximum number of nodes per element
 */
function getMaxNodesPerElement(meshConfig) {
  if (meshConfig.meshDimension === "1D") {
    return meshConfig.elementOrder === "linear" ? 2 : 3;
  } else if (meshConfig.meshDimension === "2D") {
    return meshConfig.elementOrder === "linear" ? 4 : 9;
  }
}

/**
 * Function to initialize arrays dynamically based on problem size
 * @param {number} numNodes - Number of nodes in the mesh
 * @param {number} numElements - Number of elements in the mesh
 * @param {number} maxNodesPerElement - Maximum number of nodes per element
 */
function initializeFrontalArrays(numNodes, numElements, maxNodesPerElement) {
  // Use the actual number of elements from the mesh
  frontalData.nodalNumbering = Array(numElements)
    .fill()
    .map(() => Array(maxNodesPerElement).fill(0));
  frontalData.nodeConstraintCode = Array(numNodes).fill(0);
  frontalData.boundaryValues = Array(numNodes).fill(0);
  frontalData.globalResidualVector = Array(numNodes).fill(0);
  frontalData.solutionVector = Array(numNodes).fill(0);
  frontalData.topologyData = Array(numElements).fill(0);
  frontalData.lateralData = Array(numElements).fill(0);

  // Initialize frontalState arrays
  frontalState.writeFlag = 0;
  frontalState.totalNodes = numNodes;
  frontalState.transformationFlag = 0;
  frontalState.nodesPerElement = Array(numElements).fill(0);
  frontalState.determinant = 1;

  // For matrix operations, estimate required size based on problem complexity
  const systemSize = Math.max(numNodes, 2000);
  frontalState.globalSolutionVector = Array(systemSize).fill(0);
  frontalState.frontDataIndex = 0;

  // Initialize elementData arrays
  elementData.localJacobianMatrix = Array(maxNodesPerElement)
    .fill()
    .map(() => Array(maxNodesPerElement).fill(0));
  elementData.currentElementIndex = 0;

  // Initialize frontStorage arrays (front storage)
  const frontSize = estimateFrontSize(numNodes, numElements, maxNodesPerElement);
  frontStorage.frontValues = Array(frontSize).fill(0);
  frontStorage.columnHeaders = Array(systemSize).fill(0);
  frontStorage.pivotRow = Array(systemSize).fill(0);
  frontStorage.pivotData = Array(frontSize).fill(0);
}

/**
 * Function to estimate the required front size
 * @param {number} numNodes - Number of nodes in the mesh
 * @param {number} numElements - Number of elements in the mesh
 * @param {number} maxNodesPerElement - Maximum number of nodes per element
 * @returns {number} Estimated front size
 */
function estimateFrontSize(numNodes, numElements, maxNodesPerElement) {
  // Heuristic estimate for front storage
  const frontWidthEstimate = Math.ceil(Math.sqrt(numElements) * maxNodesPerElement * 2);
  const frontSize = frontWidthEstimate * numNodes * 4;
  return Math.max(frontSize, 10000);
}

/**
 * Function to initialize and execute the frontal solver process
 * @param {object} meshConfig - Configuration object for the mesh
 * @param {object} meshData - Object containing mesh data
 * @param {object} boundaryConditions - Object containing boundary conditions
 */
function runFrontalSolverMain(meshConfig, meshData, boundaryConditions) {
  // Initialize FEA components
  const FEAData = initializeFEA(meshData);

  // Initialize basis functions with meshConfig values
  basisFunctionsLib = new BasisFunctions({
    meshDimension: meshConfig.meshDimension,
    elementOrder: meshConfig.elementOrder,
  });

  // Copy node connectivity array into frontalData storage
  for (let elementIndex = 0; elementIndex < meshData.totalElements; elementIndex++) {
    for (let nodeIndex = 0; nodeIndex < FEAData.numNodes; nodeIndex++) {
      frontalData.nodalNumbering[elementIndex][nodeIndex] = meshData.nop[elementIndex][nodeIndex];
    }
  }

  // Apply boundary conditions
  basicLog("Applying thermal boundary conditions...");
  const thermalBoundaryConditions = new ThermalBoundaryConditions(
    boundaryConditions,
    meshData.boundaryElements,
    meshData.nop,
    meshConfig.meshDimension,
    meshConfig.elementOrder
  );

  // Initialize all nodes with no boundary condition
  for (let nodeIndex = 0; nodeIndex < meshData.nodesXCoordinates.length; nodeIndex++) {
    frontalData.nodeConstraintCode[nodeIndex] = 0;
    frontalData.boundaryValues[nodeIndex] = 0;
  }

  // Apply constant temperature boundary conditions
  thermalBoundaryConditions.imposeConstantTempBoundaryConditionsFront(
    frontalData.nodeConstraintCode,
    frontalData.boundaryValues
  );

  // Initialize global residual vector
  for (let nodeIndex = 0; nodeIndex < meshData.nodesXCoordinates.length; nodeIndex++) {
    frontalData.globalResidualVector[nodeIndex] = 0;
  }

  frontalState.totalNodes = meshData.nodesXCoordinates.length;
  frontalState.writeFlag = 0;
  frontalState.transformationFlag = 1;
  frontalState.determinant = 1;

  for (let elementIndex = 0; elementIndex < meshData.totalElements; elementIndex++) {
    frontalState.nodesPerElement[elementIndex] = FEAData.numNodes;
  }

  executeFrontalAlgorithm(meshData, FEAData, thermalBoundaryConditions);

  // Copy solution
  for (let nodeIndex = 0; nodeIndex < meshData.nodesXCoordinates.length; nodeIndex++) {
    frontalData.solutionVector[nodeIndex] = frontalState.globalSolutionVector[nodeIndex];
  }

  // Output results to console for debugging
  const { nodesXCoordinates, nodesYCoordinates } = meshData;
  for (let nodeIndex = 0; nodeIndex < meshData.nodesXCoordinates.length; nodeIndex++) {
    debugLog(
      `${nodesXCoordinates[nodeIndex].toExponential(5)}  ${nodesYCoordinates[nodeIndex].toExponential(
        5
      )}  ${frontalData.solutionVector[nodeIndex].toExponential(5)}`
    );
  }
}

/**
 * Function to compute element stiffness matrix and residuals
 * @param {object} meshData - Object containing mesh data
 * @param {object} FEAData - Object containing FEA-related data
 * @param {object} thermalBoundaryConditions - Object containing thermal boundary conditions
 */
function assembleElementContribution(meshData, FEAData, thermalBoundaryConditions) {
  const elementIndex = elementData.currentElementIndex - 1;

  // Guard against out-of-range indices
  if (elementIndex < 0 || elementIndex >= meshData.totalElements) {
    errorLog(`Skipping out-of-range elementIndex=${elementIndex} (totalElements=${meshData.totalElements})`);
    return false;
  }

  // Adopt naming convention: localJacobianMatrix, residualVector
  const { localJacobianMatrix, residualVector, ngl } = assembleSolidHeatTransferFront({
    elementIndex,
    nop: frontalData.nodalNumbering,
    meshData,
    basisFunctions: basisFunctionsLib,
    FEAData,
  });

  // Copy element matrix
  for (let localNodeI = 0; localNodeI < FEAData.numNodes; localNodeI++) {
    for (let localNodeJ = 0; localNodeJ < FEAData.numNodes; localNodeJ++) {
      elementData.localJacobianMatrix[localNodeI][localNodeJ] = localJacobianMatrix[localNodeI][localNodeJ];
    }
  }

  // Accumulate local residual into global RHS
  for (let localNodeIndex = 0; localNodeIndex < FEAData.numNodes; localNodeIndex++) {
    const globalNodeIndex = ngl[localNodeIndex] - 1;
    frontalData.globalResidualVector[globalNodeIndex] += residualVector[localNodeIndex];
  }

  return true;
}

/**
 * Function to implement the frontal solver algorithm
 * @param {object} meshData - Object containing mesh data
 * @param {object} FEAData - Object containing FEA-related data
 * @param {object} thermalBoundaryConditions - Object containing thermal boundary conditions
 */
function executeFrontalAlgorithm(meshData, FEAData, thermalBoundaryConditions) {
  // Get actual number of elements
  const totalElements = meshData.totalElements;

  const numNodes = meshData.nodesXCoordinates.length;
  const systemSize = Math.max(numNodes, frontalState.globalSolutionVector.length);

  // Allocate local arrays dynamically
  let localDestination = Array(FEAData.numNodes).fill(0);
  let rowDestination = Array(FEAData.numNodes).fill(0);
  let rowHeaders = Array(systemSize).fill(0);
  let pivotRowIndices = Array(systemSize).fill(0);
  let pivotColumnIndices = Array(systemSize).fill(0);
  let modifiedRows = Array(systemSize).fill(0);
  let pivotColumn = Array(systemSize).fill(0);
  let frontMatrix = Array(systemSize)
    .fill()
    .map(() => Array(systemSize).fill(0));
  let rowSwapCount = Array(numNodes).fill(0);
  let columnSwapCount = Array(numNodes).fill(0);
  let lastAppearanceCheck = Array(numNodes).fill(0);
  let pivotColumnGlobalIndex; // Pivot column global index

  let frontDataCounter = 1;
  frontalState.writeFlag++;
  let pivotDataIndex = 1;
  let summedRows = 1;
  elementData.currentElementIndex = 0;

  for (let nodeIndex = 0; nodeIndex < frontalState.totalNodes; nodeIndex++) {
    rowSwapCount[nodeIndex] = 0;
    columnSwapCount[nodeIndex] = 0;
  }

  if (frontalState.transformationFlag !== 0) {
    // Prefront: find last appearance of each node
    for (let nodeIndex = 0; nodeIndex < frontalState.totalNodes; nodeIndex++) {
      lastAppearanceCheck[nodeIndex] = 0;
    }

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

  for (let i = 0; i < systemSize; i++) {
    for (let j = 0; j < systemSize; j++) {
      frontMatrix[j][i] = 0;
    }
  }

  while (true) {
    // Assemble a new element only while we still have elements
    let assembled = false;
    let numElementNodes = 0;
    let numElementColumns = 0;

    if (elementData.currentElementIndex < totalElements) {
      elementData.currentElementIndex++;
      assembled = assembleElementContribution(meshData, FEAData, thermalBoundaryConditions);
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

      if (rowCount > systemSize || columnCount > systemSize) {
        errorLog("Error: systemSize not large enough");
        return;
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
        errorLog("Error: no more rows fully summed");
        return;
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
      let permutationHelper =
        pivotGlobalRowIndex +
        pivotColumnGlobalIndex +
        rowSwapCount[pivotGlobalRowIndex - 1] +
        columnSwapCount[pivotColumnGlobalIndex - 1];
      frontalState.determinant =
        (frontalState.determinant * pivotValue * (-1) ** permutationHelper) / Math.abs(pivotValue);

      for (let nodeIndex = 0; nodeIndex < frontalState.totalNodes; nodeIndex++) {
        if (nodeIndex >= pivotGlobalRowIndex) rowSwapCount[nodeIndex]--;
        if (nodeIndex >= pivotColumnGlobalIndex) columnSwapCount[nodeIndex]--;
      }

      if (Math.abs(pivotValue) < 1e-10) {
        errorLog(
          `Matrix singular or ill-conditioned, currentElementIndex=${elementData.currentElementIndex}, pivotGlobalRowIndex=${pivotGlobalRowIndex}, pivotColumnGlobalIndex=${pivotColumnGlobalIndex}, pivotValue=${pivotValue}`
        );
      }

      if (pivotValue === 0) return;

      for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
        frontStorage.pivotRow[columnIndex] = frontMatrix[pivotRowIndex - 1][columnIndex] / pivotValue;
      }

      let rightHandSide = frontalData.globalResidualVector[pivotGlobalRowIndex - 1] / pivotValue;
      frontalData.globalResidualVector[pivotGlobalRowIndex - 1] = rightHandSide;
      pivotColumn[pivotRowIndex - 1] = pivotValue;

      if (pivotRowIndex > 1) {
        for (let rowIndex = 0; rowIndex < pivotRowIndex - 1; rowIndex++) {
          let globalRowIndex = Math.abs(rowHeaders[rowIndex]);
          let eliminationFactor = frontMatrix[rowIndex][pivotColumnIndex - 1];
          pivotColumn[rowIndex] = eliminationFactor;
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
          pivotColumn[rowIndex] = eliminationFactor;
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

      for (let i = 0; i < rowCount; i++) {
        frontStorage.pivotData[pivotDataIndex + i - 1] = pivotColumn[i];
      }
      pivotDataIndex += rowCount;

      for (let i = 0; i < rowCount; i++) {
        frontStorage.pivotData[pivotDataIndex + i - 1] = rowHeaders[i];
      }
      pivotDataIndex += rowCount;

      frontStorage.pivotData[pivotDataIndex - 1] = pivotRowIndex;
      pivotDataIndex++;

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

      if (rowCount > 1 || elementData.currentElementIndex < meshData.totalElements) continue;

      pivotColumnGlobalIndex = Math.abs(frontStorage.columnHeaders[0]); // Assign, don't declare
      pivotRowIndex = 1;
      pivotValue = frontMatrix[0][0];
      pivotGlobalRowIndex = Math.abs(rowHeaders[0]);
      pivotColumnIndex = 1;
      permutationHelper =
        pivotGlobalRowIndex +
        pivotColumnGlobalIndex +
        rowSwapCount[pivotGlobalRowIndex - 1] +
        columnSwapCount[pivotColumnGlobalIndex - 1];
      frontalState.determinant =
        (frontalState.determinant * pivotValue * (-1) ** permutationHelper) / Math.abs(pivotValue);

      frontStorage.pivotRow[0] = 1;
      if (Math.abs(pivotValue) < 1e-10) {
        errorLog(
          `Matrix singular or ill-conditioned, currentElementIndex=${elementData.currentElementIndex}, pivotGlobalRowIndex=${pivotGlobalRowIndex}, pivotColumnGlobalIndex=${pivotColumnGlobalIndex}, pivotValue=${pivotValue}`
        );
      }

      if (pivotValue === 0) return;

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

      frontStorage.pivotData[pivotDataIndex - 1] = pivotColumn[0];
      pivotDataIndex++;
      frontStorage.pivotData[pivotDataIndex - 1] = rowHeaders[0];
      pivotDataIndex++;
      frontStorage.pivotData[pivotDataIndex - 1] = pivotRowIndex;
      pivotDataIndex++;

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
    let pivotValue = frontStorage.frontValues[frontDataCounter + 2];

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
