/**
 * ════════════════════════════════════════════════════════════
 *  FEAScript Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.1.4 | https://feascript.com
 * ════════════════════════════════════════════════════════════
 */

// Internal imports
import { jacobiSolver } from "./jacobiSolverScript.js";
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";
import * as Comlink from "../vendor/comlink.mjs";

/**
 * Function to solve a system of linear equations using different solver methods
 * @param {string} solverMethod - The solver method to use ("lusolve" or "jacobi")
 * @param {Array} jacobianMatrix - The coefficient matrix
 * @param {Array} residualVector - The right-hand side vector
 * @param {object} [options] - Optional parameters for the solver, such as `maxIterations` and `tolerance`
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 *  - converged: Boolean indicating whether the method converged (for iterative methods)
 *  - iterations: Number of iterations performed (for iterative methods)
 */
export function solveLinearSystem(solverMethod, jacobianMatrix, residualVector, options = {}) {

  // Extract options
  const { maxIterations = 10000, tolerance = 1e-4 } = options;

  let solutionVector = [];
  let converged = true;
  let iterations = 0;

  // Solve the linear system based on the specified solver method
  basicLog(`Solving system using ${solverMethod}...`);
  console.time("systemSolving");

  if (solverMethod === "lusolve") {
    // Use LU decomposition method
    const jacobianMatrixSparse = math.sparse(jacobianMatrix);
    const luFactorization = math.slu(jacobianMatrixSparse, 1, 1); // order=1, threshold=1 for pivoting
    let solutionMatrix = math.lusolve(luFactorization, residualVector);
    solutionVector = math.squeeze(solutionMatrix).valueOf();
    //solutionVector = math.lusolve(jacobianMatrix, residualVector); // In the case of a dense matrix
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
      errorLog(`Jacobi method did not converge after ${jacobiSolverResult.iterations} iterations`);
    }

    solutionVector = jacobiSolverResult.solutionVector;
    converged = jacobiSolverResult.converged;
    iterations = jacobiSolverResult.iterations;
  } else {
    errorLog(`Unknown solver method: ${solverMethod}`);
  }

  console.timeEnd("systemSolving");
  basicLog("System solved successfully");

  return { solutionVector, converged, iterations };
}

// Helper to lazily create a default WebGPU compute engine (Comlink + worker)
async function createDefaultComputeEngine() {
  const worker = new Worker(new URL("../workers/webgpuWorkerScript.js", import.meta.url), {
    type: "module",
  });
  const computeEngine = Comlink.wrap(worker);
  await computeEngine.initialize();
  return { computeEngine, worker };
}

/**
 * Function to solve asynchronously a system of linear equations using different solver methods
 * @param {string} solverMethod - The solver method to use (e.g., "jacobi-gpu")
 * @param {array} jacobianMatrix - The coefficient matrix
 * @param {array} residualVector - The right-hand side vector
 * @param {object} [options] - Optional parameters for the solver, such as `maxIterations` and `tolerance`
 * @returns {Promise<object>} A promise that resolves to an object containing:
 *  - solutionVector: The solution vector
 *  - converged: Boolean indicating whether the method converged (for iterative methods)
 *  - iterations: Number of iterations performed (for iterative methods)
 */
export async function solveLinearSystemAsync(solverMethod, jacobianMatrix, residualVector, options = {}) {
  
  // Extract options
  const { maxIterations = 10000, tolerance = 1e-4 } = options;

  basicLog(`Solving system using ${solverMethod}...`);
  console.time("systemSolving");

  // Normalize inputs
  const A = Array.isArray(jacobianMatrix) ? jacobianMatrix : jacobianMatrix?.toArray?.() ?? jacobianMatrix;
  const b = Array.isArray(residualVector) ? residualVector : residualVector?.toArray?.() ?? residualVector;

  let created = null;
  let computeEngine = null;

  let solutionVector = [];
  let converged = true;
  let iterations;

  if (solverMethod === "jacobi-gpu") {
    // Spin up a worker-backed compute engine
    created = await createDefaultComputeEngine();
    computeEngine = created.computeEngine;

    const x0 = new Array(b.length).fill(0);
    let result;

    result = await computeEngine.webgpuJacobiSolver(A, b, x0, { maxIterations, tolerance });
    solutionVector = result.solutionVector;
    converged = result.converged;
    iterations = result.iterations;

    // Log convergence information
    if (converged) {
      debugLog(`Jacobi method converged in ${iterations} iterations`);
    } else {
      errorLog(`Jacobi method did not converge after ${iterations} iterations`);
    }
  } else {
    errorLog(`Unknown solver method: ${solverMethod}`);
  }

  console.timeEnd("systemSolving");
  basicLog(`System solved successfully (${solverMethod})`);

  if (created) {
    await computeEngine?.destroy?.().catch(() => { });
    created.worker.terminate();
  }

  return { solutionVector, converged, iterations };
}
