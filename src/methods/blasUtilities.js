/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * BLAS utility functions backed by stdlib-js (https://github.com/stdlib-js/blas)
 */

// External imports
import dnrm2 from "@stdlib/blas-base-dnrm2";
import ddot from "@stdlib/blas-base-ddot";
import dcopy from "@stdlib/blas-base-dcopy";
import daxpy from "@stdlib/blas-base-daxpy";

/**
 * Computes the Euclidean (L2) norm of a vector using BLAS dnrm2
 * @param {Array|Float64Array} vector - The input vector
 * @returns {number} The Euclidean norm
 */
export function euclideanNorm(vector) {
  const v = vector instanceof Float64Array ? vector : new Float64Array(vector);
  return dnrm2(v.length, v, 1);
}

/**
 * Computes the dot product of two vectors using BLAS ddot
 * @param {Array|Float64Array} x - First vector
 * @param {Array|Float64Array} y - Second vector
 * @returns {number} The dot product x · y
 */
export function dotProduct(x, y) {
  const fx = x instanceof Float64Array ? x : new Float64Array(x);
  const fy = y instanceof Float64Array ? y : new Float64Array(y);
  return ddot(fx.length, fx, 1, fy, 1);
}

/**
 * Copies src into dest using BLAS dcopy (in-place, no allocation)
 * @param {Float64Array} src - Source vector
 * @param {Float64Array} dest - Destination vector (modified in place)
 */
export function copyVector(src, dest) {
  dcopy(src.length, src, 1, dest, 1);
}

/**
 * Computes y = alpha * x + y using BLAS daxpy (in-place on y)
 * @param {number} alpha - Scalar multiplier for x
 * @param {Array|Float64Array} x - Input vector
 * @param {Float64Array} y - Accumulation vector (modified in place)
 */
export function axpy(alpha, x, y) {
  const fx = x instanceof Float64Array ? x : new Float64Array(x);
  daxpy(fx.length, alpha, fx, 1, y, 1);
}
