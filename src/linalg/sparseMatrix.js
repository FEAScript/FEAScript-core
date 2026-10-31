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
 * Each row is a Map from column index to value, so the random `+=` access pattern of element
 * assembly and the row clearing of Dirichlet boundary conditions are cheap. Once assembled, the
 * matrix is converted to a compressed format (CSR or CSC) for the solvers
 */
export class SparseMatrix {
  /**
   * Constructor to initialize an empty (all zeros) square sparse matrix
   * @param {number} size - Number of rows and columns
   */
  constructor(size) {
    this.size = size;
    this.rows = Array.from({ length: size }, () => new Map());
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
        if (value !== 0) sparseMatrix.rows[rowIndex].set(colIndex, value);
      });
    });
    return sparseMatrix;
  }

  /**
   * Function to add a value to an entry
   * @param {number} rowIndex - Row index
   * @param {number} colIndex - Column index
   * @param {number} value - Value to add
   */
  addValue(rowIndex, colIndex, value) {
    const row = this.rows[rowIndex];
    row.set(colIndex, (row.get(colIndex) ?? 0) + value);
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
      const row = this.rows[globalIndices[localRowIndex]];
      const offset = localRowIndex * localSize;
      for (let localColIndex = 0; localColIndex < localSize; localColIndex++) {
        const value = localMatrix[offset + localColIndex];
        if (value !== 0) {
          const colIndex = globalIndices[localColIndex];
          row.set(colIndex, (row.get(colIndex) ?? 0) + value);
        }
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
    this.rows[rowIndex].set(colIndex, value);
  }

  /**
   * Function to get the value of an entry
   * @param {number} rowIndex - Row index
   * @param {number} colIndex - Column index
   * @returns {number} The value of the entry (0 if not stored)
   */
  getValue(rowIndex, colIndex) {
    return this.rows[rowIndex].get(colIndex) ?? 0;
  }

  /**
   * Function to set every entry of a row to zero (used for Dirichlet boundary conditions)
   * @param {number} rowIndex - Row index
   */
  clearRow(rowIndex) {
    this.rows[rowIndex].clear();
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
    const sortedRows = this.rows.map((row) =>
      [...row].filter(([, value]) => value !== 0).sort(([colA], [colB]) => colA - colB),
    );
    const nonZeros = sortedRows.reduce((sum, row) => sum + row.length, 0);

    const rowPointers = new Int32Array(this.size + 1);
    const columnIndices = new Int32Array(nonZeros);
    const values = new Float64Array(nonZeros);

    let entryIndex = 0;
    sortedRows.forEach((row, rowIndex) => {
      for (const [colIndex, value] of row) {
        columnIndices[entryIndex] = colIndex;
        values[entryIndex] = value;
        entryIndex++;
      }
      rowPointers[rowIndex + 1] = entryIndex;
    });

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
    this.rows.forEach((row) => {
      for (const [colIndex, value] of row) {
        if (value !== 0) ptr[colIndex + 1]++;
      }
    });
    for (let colIndex = 0; colIndex < this.size; colIndex++) {
      ptr[colIndex + 1] += ptr[colIndex];
    }

    // Fill the columns, visiting rows in order so that row indices are sorted within each column
    const nonZeros = ptr[this.size];
    const values = new Array(nonZeros);
    const index = new Array(nonZeros);
    const nextEntry = ptr.slice(0, this.size);
    this.rows.forEach((row, rowIndex) => {
      for (const [colIndex, value] of row) {
        if (value !== 0) {
          const entryIndex = nextEntry[colIndex]++;
          values[entryIndex] = value;
          index[entryIndex] = rowIndex;
        }
      }
    });

    return { values, index, ptr, size: [this.size, this.size] };
  }

  /**
   * Function to convert the matrix to a dense array of arrays
   * @returns {array} The dense matrix
   */
  toDense() {
    return this.rows.map((row) => {
      const denseRow = new Array(this.size).fill(0);
      for (const [colIndex, value] of row) denseRow[colIndex] = value;
      return denseRow;
    });
  }
}
