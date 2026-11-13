/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
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
     * Function to create a sparse matrix whose pattern holds every entry that element assembly can touch: the
     * entries (i, j) for every pair of degrees of freedom i, j of the same element
     * @param {number} size - Number of rows and columns
     * @param {number} elementCount - Number of elements
     * @param {function} getElementDofs - Function that returns the global (0-based) degree of freedom indices of
     *  an element, given its index
     * @returns {SparseMatrix} The (all zeros) sparse matrix
     */
    static fromElementDofs(size: number, elementCount: number, getElementDofs: Function): SparseMatrix;
    /**
     * Function to create a sparse matrix from a dense array of arrays
     * @param {array} denseMatrix - The dense matrix
     * @returns {SparseMatrix} The sparse matrix
     */
    static fromDense(denseMatrix: array): SparseMatrix;
    /**
     * Constructor to initialize an empty (all zeros) square sparse matrix
     * @param {number} size - Number of rows and columns
     * @param {object} [pattern] - Sparsity pattern in CSR format, with the column indices of each row sorted:
     *  - rowPointers: Start of each row in columnIndices (Int32Array, length size + 1)
     *  - columnIndices: Column index of each entry of the pattern (Int32Array)
     */
    constructor(size: number, pattern?: object);
    size: number;
    rowPointers: any;
    columnIndices: any;
    values: Float64Array<any>;
    overflowRows: Map<any, any>;
    /**
     * Function to find the position of an entry in the pattern
     * @param {number} rowIndex - Row index
     * @param {number} colIndex - Column index
     * @returns {number} The position in columnIndices and values, or -1 if the entry is not in the pattern
     */
    findEntry(rowIndex: number, colIndex: number): number;
    /**
     * Function to get the overflow Map of a row, creating it if needed
     * @param {number} rowIndex - Row index
     * @returns {Map} Map from column index to value
     */
    overflowRow(rowIndex: number): Map<any, any>;
    /**
     * Function to add a value to an entry
     * @param {number} rowIndex - Row index
     * @param {number} colIndex - Column index
     * @param {number} value - Value to add
     */
    addValue(rowIndex: number, colIndex: number, value: number): void;
    /**
     * Function to add a local (element) matrix to the global matrix
     * Zero entries of the local matrix are skipped, so they do not create stored entries
     * @param {array} globalIndices - Global row/column index of each local index
     * @param {Float64Array} localMatrix - Local matrix stored row by row (length globalIndices.length²)
     */
    addLocalMatrix(globalIndices: array, localMatrix: Float64Array): void;
    /**
     * Function to set the value of an entry
     * @param {number} rowIndex - Row index
     * @param {number} colIndex - Column index
     * @param {number} value - New value
     */
    setValue(rowIndex: number, colIndex: number, value: number): void;
    /**
     * Function to get the value of an entry
     * @param {number} rowIndex - Row index
     * @param {number} colIndex - Column index
     * @returns {number} The value of the entry (0 if not stored)
     */
    getValue(rowIndex: number, colIndex: number): number;
    /**
     * Function to set every entry of a row to zero
     * @param {number} rowIndex - Row index
     */
    clearRow(rowIndex: number): void;
    /**
     * Function to impose Dirichlet conditions on the system, keeping a symmetric matrix symmetric: the known value
     * of each degree of freedom moves to the right-hand side, and its row and column become those of the identity
     *
     * All the values are given at once, since eliminating a column uses the final value of that degree of freedom
     * @param {Map} prescribedValues - Map from degree of freedom index to its value
     * @param {array} rightHandSideVector - The right-hand side vector, updated in place
     */
    imposeDirichletValues(prescribedValues: Map<any, any>, rightHandSideVector: array): void;
    /**
     * Function to visit the nonzero entries of a row in order of increasing column index
     * @param {number} rowIndex - Row index
     * @param {function} visit - Function called with (column index, value) for each nonzero entry
     */
    forEachInRow(rowIndex: number, visit: Function): void;
    /**
     * Function to count the nonzero entries of a row
     * @param {number} rowIndex - Row index
     * @returns {number} The number of nonzero entries
     */
    rowNonZeros(rowIndex: number): number;
    /**
     * Function to convert the matrix to compressed sparse row (CSR) format
     * Exact zeros are dropped and the column indices of each row are sorted
     * @returns {object} An object containing:
     *  - rowPointers: Start of each row in columnIndices and values (Int32Array, length size + 1)
     *  - columnIndices: Column index of each stored entry (Int32Array)
     *  - values: Value of each stored entry (Float64Array)
     */
    toCSR(): object;
    /**
     * Function to convert the matrix to compressed sparse column (CSC) format, as used by mathjs
     * Exact zeros are dropped and the row indices of each column are sorted
     * @returns {object} An object containing:
     *  - values: Value of each stored entry (array)
     *  - index: Row index of each stored entry (array)
     *  - ptr: Start of each column in index and values (array, length size + 1)
     *  - size: Matrix dimensions [size, size]
     */
    toCSC(): object;
    /**
     * Function to convert the matrix to a dense array of arrays
     * @returns {array} The dense matrix
     */
    toDense(): array;
}
