/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Class to store a square sparse matrix during finite element assembly
 *
 * The matrix is stored in compressed sparse row (CSR) format with typed arrays. Its sparsity pattern is
 * computed once from the element connectivity (`fromElementDofs`), so element assembly adds into fixed
 * positions instead of growing a data structure. An entry outside the pattern, or every entry of a matrix
 * created without one (`new SparseMatrix(size)`), is kept in a per-row overflow Map; the compressed
 * formats merge both, so the result does not depend on how an entry was stored
 */
export class SparseMatrix {
  /**
   * Constructor to initialize an empty (all zeros) square sparse matrix
   * @param {number} size - Number of rows and columns
   * @param {object} [pattern] - Sparsity pattern in CSR format, with the column indices of each row sorted:
   *  - rowPointers: Start of each row in columnIndices (Int32Array, length size + 1)
   *  - columnIndices: Column index of each entry of the pattern (Int32Array)
   */
  constructor(size, pattern = null) {
    this.size = size;
    this.rowPointers = pattern ? pattern.rowPointers : new Int32Array(size + 1);
    this.columnIndices = pattern ? pattern.columnIndices : new Int32Array(0);
    this.values = new Float64Array(this.columnIndices.length);
    this.overflowRows = new Map(); // Row index -> Map(column index -> value), for entries outside the pattern
  }

  /**
   * Function to create a sparse matrix whose pattern holds every entry that element assembly can touch: the
   * entries (i, j) for every pair of degrees of freedom i, j of the same element
   * @param {number} size - Number of rows and columns
   * @param {number} elementCount - Number of elements
   * @param {function} getElementDofs - Function that returns the global (0-based) degree of freedom indices of
   *  an element, given its index
   * @returns {SparseMatrix} The (all zeros) sparse matrix
   */
  static fromElementDofs(size, elementCount, getElementDofs) {
    // Element lists of the degrees of freedom, and the elements that contain each degree of freedom (CSR)
    const elementPointers = new Int32Array(elementCount + 1);
    const elementDofsList = new Array(elementCount);
    for (let elementIndex = 0; elementIndex < elementCount; elementIndex++) {
      elementDofsList[elementIndex] = Int32Array.from(getElementDofs(elementIndex));
      elementPointers[elementIndex + 1] = elementPointers[elementIndex] + elementDofsList[elementIndex].length;
    }
    const dofElementPointers = new Int32Array(size + 1);
    for (const elementDofs of elementDofsList) {
      for (const dof of elementDofs) dofElementPointers[dof + 1]++;
    }
    for (let dof = 0; dof < size; dof++) dofElementPointers[dof + 1] += dofElementPointers[dof];
    const dofElements = new Int32Array(dofElementPointers[size]);
    const nextDofElement = dofElementPointers.slice(0, size);
    elementDofsList.forEach((elementDofs, elementIndex) => {
      for (const dof of elementDofs) dofElements[nextDofElement[dof]++] = elementIndex;
    });

    // Columns of each row: the degrees of freedom of every element that contains the row. A marker array
    // (the last row that visited each column) skips the duplicates, in two passes: count, then fill
    const lastVisit = new Int32Array(size).fill(-1);
    const rowPointers = new Int32Array(size + 1);
    const visitRow = (row, visit) => {
      for (let k = dofElementPointers[row]; k < dofElementPointers[row + 1]; k++) {
        for (const column of elementDofsList[dofElements[k]]) {
          if (lastVisit[column] !== row) {
            lastVisit[column] = row;
            visit(column);
          }
        }
      }
    };
    for (let row = 0; row < size; row++) {
      let count = 0;
      visitRow(row, () => count++);
      rowPointers[row + 1] = rowPointers[row] + count;
    }
    lastVisit.fill(-1);
    const columnIndices = new Int32Array(rowPointers[size]);
    for (let row = 0; row < size; row++) {
      let position = rowPointers[row];
      visitRow(row, (column) => (columnIndices[position++] = column));
      columnIndices.subarray(rowPointers[row], rowPointers[row + 1]).sort();
    }

    return new SparseMatrix(size, { rowPointers, columnIndices });
  }

  /**
   * Function to create a sparse matrix from a dense array of arrays
   * @param {array} denseMatrix - The dense matrix
   * @returns {SparseMatrix} The sparse matrix
   */
  static fromDense(denseMatrix) {
    const sparseMatrix = new SparseMatrix(denseMatrix.length);
    denseMatrix.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        if (value !== 0) sparseMatrix.setValue(rowIndex, colIndex, value);
      });
    });
    return sparseMatrix;
  }

  /**
   * Function to find the position of an entry in the pattern
   * @param {number} rowIndex - Row index
   * @param {number} colIndex - Column index
   * @returns {number} The position in columnIndices and values, or -1 if the entry is not in the pattern
   */
  findEntry(rowIndex, colIndex) {
    let low = this.rowPointers[rowIndex];
    let high = this.rowPointers[rowIndex + 1] - 1;
    while (low <= high) {
      const middle = (low + high) >> 1;
      const column = this.columnIndices[middle];
      if (column === colIndex) return middle;
      if (column < colIndex) low = middle + 1;
      else high = middle - 1;
    }
    return -1;
  }

  /**
   * Function to get the overflow Map of a row, creating it if needed
   * @param {number} rowIndex - Row index
   * @returns {Map} Map from column index to value
   */
  overflowRow(rowIndex) {
    let row = this.overflowRows.get(rowIndex);
    if (!row) {
      row = new Map();
      this.overflowRows.set(rowIndex, row);
    }
    return row;
  }

  /**
   * Function to add a value to an entry
   * @param {number} rowIndex - Row index
   * @param {number} colIndex - Column index
   * @param {number} value - Value to add
   */
  addValue(rowIndex, colIndex, value) {
    const position = this.findEntry(rowIndex, colIndex);
    if (position >= 0) {
      this.values[position] += value;
    } else {
      const row = this.overflowRow(rowIndex);
      row.set(colIndex, (row.get(colIndex) ?? 0) + value);
    }
  }

  /**
   * Function to add a local (element) matrix to the global matrix
   * Zero entries of the local matrix are skipped, so they do not create stored entries
   * @param {array} globalIndices - Global row/column index of each local index
   * @param {Float64Array} localMatrix - Local matrix stored row by row (length globalIndices.length²)
   */
  addLocalMatrix(globalIndices, localMatrix) {
    const localSize = globalIndices.length;
    for (let localRowIndex = 0; localRowIndex < localSize; localRowIndex++) {
      const rowIndex = globalIndices[localRowIndex];
      const offset = localRowIndex * localSize;
      for (let localColIndex = 0; localColIndex < localSize; localColIndex++) {
        const value = localMatrix[offset + localColIndex];
        if (value !== 0) this.addValue(rowIndex, globalIndices[localColIndex], value);
      }
    }
  }

  /**
   * Function to set the value of an entry
   * @param {number} rowIndex - Row index
   * @param {number} colIndex - Column index
   * @param {number} value - New value
   */
  setValue(rowIndex, colIndex, value) {
    const position = this.findEntry(rowIndex, colIndex);
    if (position >= 0) this.values[position] = value;
    else this.overflowRow(rowIndex).set(colIndex, value);
  }

  /**
   * Function to get the value of an entry
   * @param {number} rowIndex - Row index
   * @param {number} colIndex - Column index
   * @returns {number} The value of the entry (0 if not stored)
   */
  getValue(rowIndex, colIndex) {
    const position = this.findEntry(rowIndex, colIndex);
    if (position >= 0) return this.values[position];
    return this.overflowRows.get(rowIndex)?.get(colIndex) ?? 0;
  }

  /**
   * Function to set every entry of a row to zero
   * @param {number} rowIndex - Row index
   */
  clearRow(rowIndex) {
    this.values.fill(0, this.rowPointers[rowIndex], this.rowPointers[rowIndex + 1]);
    this.overflowRows.delete(rowIndex);
  }

  /**
   * Function to impose Dirichlet conditions on the system, keeping a symmetric matrix symmetric: the known value
   * of each degree of freedom moves to the right-hand side, and its row and column become those of the identity
   *
   * All the values are given at once, since eliminating a column uses the final value of that degree of freedom
   * @param {Map} prescribedValues - Map from degree of freedom index to its value
   * @param {array} rightHandSideVector - The right-hand side vector, updated in place
   */
  imposeDirichletValues(prescribedValues, rightHandSideVector) {
    const isPrescribed = new Uint8Array(this.size);
    const values = new Float64Array(this.size);
    prescribedValues.forEach((value, dof) => {
      isPrescribed[dof] = 1;
      values[dof] = value;
    });

    // Move the prescribed columns of the other rows to the right-hand side (R -= value × column)
    for (let rowIndex = 0; rowIndex < this.size; rowIndex++) {
      if (isPrescribed[rowIndex]) continue;
      for (let k = this.rowPointers[rowIndex]; k < this.rowPointers[rowIndex + 1]; k++) {
        const colIndex = this.columnIndices[k];
        if (isPrescribed[colIndex]) {
          rightHandSideVector[rowIndex] -= this.values[k] * values[colIndex];
          this.values[k] = 0;
        }
      }
      const overflow = this.overflowRows.get(rowIndex);
      overflow?.forEach((value, colIndex) => {
        if (isPrescribed[colIndex]) {
          rightHandSideVector[rowIndex] -= value * values[colIndex];
          overflow.delete(colIndex);
        }
      });
    }

    prescribedValues.forEach((value, dof) => {
      rightHandSideVector[dof] = value;
      this.clearRow(dof);
      this.setValue(dof, dof, 1);
    });
  }

  /**
   * Function to visit the nonzero entries of a row in order of increasing column index
   * @param {number} rowIndex - Row index
   * @param {function} visit - Function called with (column index, value) for each nonzero entry
   */
  forEachInRow(rowIndex, visit) {
    const start = this.rowPointers[rowIndex];
    const end = this.rowPointers[rowIndex + 1];
    const overflow = this.overflowRows.get(rowIndex);
    if (!overflow) {
      for (let k = start; k < end; k++) if (this.values[k] !== 0) visit(this.columnIndices[k], this.values[k]);
      return;
    }
    // Merge the pattern entries with the (sorted) overflow entries
    const extra = [...overflow].sort(([colA], [colB]) => colA - colB);
    let k = start;
    for (const [colIndex, value] of extra) {
      for (; k < end && this.columnIndices[k] < colIndex; k++) {
        if (this.values[k] !== 0) visit(this.columnIndices[k], this.values[k]);
      }
      if (value !== 0) visit(colIndex, value);
    }
    for (; k < end; k++) if (this.values[k] !== 0) visit(this.columnIndices[k], this.values[k]);
  }

  /**
   * Function to count the nonzero entries of a row
   * @param {number} rowIndex - Row index
   * @returns {number} The number of nonzero entries
   */
  rowNonZeros(rowIndex) {
    let count = 0;
    this.forEachInRow(rowIndex, () => count++);
    return count;
  }

  /**
   * Function to convert the matrix to compressed sparse row (CSR) format
   * Exact zeros are dropped and the column indices of each row are sorted
   * @returns {object} An object containing:
   *  - rowPointers: Start of each row in columnIndices and values (Int32Array, length size + 1)
   *  - columnIndices: Column index of each stored entry (Int32Array)
   *  - values: Value of each stored entry (Float64Array)
   */
  toCSR() {
    const rowPointers = new Int32Array(this.size + 1);
    for (let rowIndex = 0; rowIndex < this.size; rowIndex++) {
      rowPointers[rowIndex + 1] = rowPointers[rowIndex] + this.rowNonZeros(rowIndex);
    }
    const columnIndices = new Int32Array(rowPointers[this.size]);
    const values = new Float64Array(rowPointers[this.size]);
    let entryIndex = 0;
    for (let rowIndex = 0; rowIndex < this.size; rowIndex++) {
      this.forEachInRow(rowIndex, (colIndex, value) => {
        columnIndices[entryIndex] = colIndex;
        values[entryIndex] = value;
        entryIndex++;
      });
    }
    return { rowPointers, columnIndices, values };
  }

  /**
   * Function to convert the matrix to compressed sparse column (CSC) format, as used by mathjs
   * Exact zeros are dropped and the row indices of each column are sorted
   * @returns {object} An object containing:
   *  - values: Value of each stored entry (array)
   *  - index: Row index of each stored entry (array)
   *  - ptr: Start of each column in index and values (array, length size + 1)
   *  - size: Matrix dimensions [size, size]
   */
  toCSC() {
    // Count the entries of each column
    const ptr = new Array(this.size + 1).fill(0);
    for (let rowIndex = 0; rowIndex < this.size; rowIndex++) {
      this.forEachInRow(rowIndex, (colIndex) => ptr[colIndex + 1]++);
    }
    for (let colIndex = 0; colIndex < this.size; colIndex++) {
      ptr[colIndex + 1] += ptr[colIndex];
    }

    // Fill the columns, visiting rows in order so that row indices are sorted within each column
    const nonZeros = ptr[this.size];
    const values = new Array(nonZeros);
    const index = new Array(nonZeros);
    const nextEntry = ptr.slice(0, this.size);
    for (let rowIndex = 0; rowIndex < this.size; rowIndex++) {
      this.forEachInRow(rowIndex, (colIndex, value) => {
        const entryIndex = nextEntry[colIndex]++;
        values[entryIndex] = value;
        index[entryIndex] = rowIndex;
      });
    }

    return { values, index, ptr, size: [this.size, this.size] };
  }

  /**
   * Function to convert the matrix to a dense array of arrays
   * @returns {array} The dense matrix
   */
  toDense() {
    const dense = Array.from({ length: this.size }, () => new Array(this.size).fill(0));
    for (let rowIndex = 0; rowIndex < this.size; rowIndex++) {
      this.forEachInRow(rowIndex, (colIndex, value) => (dense[rowIndex][colIndex] = value));
    }
    return dense;
  }
}
