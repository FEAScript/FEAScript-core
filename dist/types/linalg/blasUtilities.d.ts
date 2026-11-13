/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Computes the Euclidean (L2) norm of a vector using BLAS dnrm2
 * @param {Array|Float64Array} vector - The input vector
 * @returns {number} The Euclidean norm
 */
export function euclideanNorm(vector: any[] | Float64Array): number;
/**
 * Computes the dot product of two vectors using BLAS ddot
 * @param {Array|Float64Array} x - First vector
 * @param {Array|Float64Array} y - Second vector
 * @returns {number} The dot product x · y
 */
export function dotProduct(x: any[] | Float64Array, y: any[] | Float64Array): number;
/**
 * Copies src into dest using BLAS dcopy (in-place, no allocation)
 * @param {Float64Array} src - Source vector
 * @param {Float64Array} dest - Destination vector (modified in place)
 */
export function copyVector(src: Float64Array, dest: Float64Array): void;
/**
 * Computes y = alpha * x + y using BLAS daxpy (in-place on y)
 * @param {number} alpha - Scalar multiplier for x
 * @param {Array|Float64Array} x - Input vector
 * @param {Float64Array} y - Accumulation vector (modified in place)
 */
export function axpy(alpha: number, x: any[] | Float64Array, y: Float64Array): void;
