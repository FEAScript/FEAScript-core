//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

import { jacobiMethod } from "./jacobiMethodScript.js";

/**
 * Function to solve a system of linear equations using the Jacobi iterative method
 * This is a wrapper around the Taichi.js-based jacobiMethod for interface consistency
 * @param {array} jacobianMatrix - The coefficient matrix (must be square)
 * @param {array} residualVector - The right-hand side vector
 * @param {array} initialGuess - Initial guess for solution vector
 * @param {object} [options] - Options for the solver
 * @param {number} [options.maxIterations=1000] - Maximum number of iterations
 * @param {number} [options.tolerance=1e-6] - Convergence tolerance
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 */
export function jacobiSolver(jacobianMatrix, residualVector, initialGuess, options = {}) {
  const { maxIterations = 1000, tolerance = 1e-6 } = options;
  
  try {
    // Call the Taichi.js-based Jacobi method with high precision
    // Note: We need to handle the async nature properly
    const result = jacobiMethod(
      jacobianMatrix, 
      residualVector, 
      initialGuess, 
      maxIterations, 
      tolerance,
      true // Use Float64 for better precision
    );
    
    // If result is a Promise, we need to handle it differently
    if (result instanceof Promise) {
      throw new Error("Jacobi solver cannot handle async operations in this context. Use jacobiMethod directly for async operations.");
    }
    
    return {
      solutionVector: result.solution,
      iterations: result.iterations,
      converged: result.converged,
    };
  } catch (error) {
    console.error("Error in Jacobi solver:", error);
    throw error;
  }
}