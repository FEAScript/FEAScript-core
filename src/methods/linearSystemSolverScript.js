//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

// Internal imports
import { jacobiSolver } from "./jacobiSolverScript.js";
import { conjugateGradientWebGPU } from "./conjugateGradientWebGPUScript.js";
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Function to solve a system of linear equations using different solver methods
 * @param {string} solverMethod - The solver method to use ("lusolve", "jacobi", or "conjugate-gradient-webgpu")
 * @param {Array} jacobianMatrix - The coefficient matrix
 * @param {Array} residualVector - The right-hand side vector
 * @param {object} [options] - Additional options for the solver
 * @param {number} [options.maxIterations=1000] - Maximum iterations for iterative methods
 * @param {number} [options.tolerance=1e-6] - Convergence tolerance for iterative methods
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 *  - converged: Boolean indicating whether the method converged (for iterative methods)
 *  - iterations: Number of iterations performed (for iterative methods)
 */
export async function solveLinearSystem(solverMethod, jacobianMatrix, residualVector, options = {}) {
  const { maxIterations = 1000, tolerance = 1e-6 } = options;

  let solutionVector = [];
  let converged = true;
  let iterations = 0;

  // Solve the linear system based on the specified solver method
  basicLog(`Solving system using ${solverMethod}...`);
  console.time("systemSolving");

  if (solverMethod === "lusolve") {
    // Use LU decomposition method
    solutionVector = math.lusolve(jacobianMatrix, residualVector);
  } else if (solverMethod === "jacobi") {
    // Use Jacobi method
    const initialGuess = new Array(residualVector.length).fill(0);
    const jacobiSolverResult = jacobiSolver(jacobianMatrix, residualVector, initialGuess, {
      maxIterations,
      tolerance,
    });

    // Log convergence information
    if (jacobiSolverResult.converged) {
      debugLog(`Jacobi method converged in ${jacobiSolverResult.iterations} iterations`);
    } else {
      debugLog(`Jacobi method did not converge after ${jacobiSolverResult.iterations} iterations`);
    }

    solutionVector = jacobiSolverResult.solutionVector;
    converged = jacobiSolverResult.converged;
    iterations = jacobiSolverResult.iterations;
  } else if (solverMethod === "conjugate-gradient-webgpu") {
    // Use WebGPU-accelerated Conjugate Gradient method
    const initialGuess = new Array(residualVector.length).fill(0);
    
    // Use higher precision tolerance for conjugate gradient
    const cgTolerance = Math.min(tolerance, 1e-9);
    
    const cgResult = await conjugateGradientWebGPU(jacobianMatrix, residualVector, initialGuess, {
      maxIterations,
      tolerance: cgTolerance,
      enablePrecision: true,
    });

    // Log convergence information
    if (cgResult.converged) {
      debugLog(`WebGPU Conjugate Gradient method converged in ${cgResult.iterations} iterations with residual norm ${cgResult.residualNorm.toExponential(6)}`);
    } else {
      debugLog(`WebGPU Conjugate Gradient method did not converge after ${cgResult.iterations} iterations. Final residual norm: ${cgResult.residualNorm.toExponential(6)}`);
    }

    solutionVector = cgResult.solutionVector;
    converged = cgResult.converged;
    iterations = cgResult.iterations;
  } else {
    errorLog(`Unknown solver method: ${solverMethod}`);
  }

  console.timeEnd("systemSolving");
  basicLog("System solved successfully");

  return { solutionVector, converged, iterations };
}
