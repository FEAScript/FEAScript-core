/**
 * ════════════════════════════════════════════════════════════
 *  FEAScript Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.1.4 | https://feascript.com
 * ════════════════════════════════════════════════════════════
 */

/**
 * Function to calculate the Euclidean norm of a vector
 * @param {array} vector - The input vector
 * @returns {number} The Euclidean norm of the vector
 */
export function euclideanNorm(vector) {
  let norm = 0;
  for (let i = 0; i < vector.length; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  return norm;
}
