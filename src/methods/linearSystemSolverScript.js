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
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";
import * as Comlink from "../vendor/comlink.mjs";

/**
 * Function to solve a system of linear equations using different solver methods
 * @param {string} solverMethod - The solver method to use ("lusolve" or "jacobi")
 * @param {Array} jacobianMatrix - The coefficient matrix
 * @param {Array} residualVector - The right-hand side vector
 * @param {object} [options] - Additional options for the solver
 * @param {number} [options.maxIterations=10000] - Maximum iterations for iterative methods
 * @param {number} [options.tolerance=1e-3] - Convergence tolerance for iterative methods
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 *  - converged: Boolean indicating whether the method converged (for iterative methods)
 *  - iterations: Number of iterations performed (for iterative methods)
 */
export function solveLinearSystem(solverMethod, jacobianMatrix, residualVector, options = {}) {
  const { maxIterations = 10000, tolerance = 1e-3 } = options;

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

// Async variant of solveLinearSystem
export async function solveLinearSystemAsync(solverMethod, jacobianMatrix, residualVector, options = {}) {
  const { maxIterations = 10000, tolerance = 1e-3 } = options;

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

    if (computeEngine && typeof computeEngine.webgpuJacobiSolver === "function") {
      result = await computeEngine.webgpuJacobiSolver(A, b, x0, maxIterations, tolerance);
    } else {
      // Fallback to CPU Jacobi
      warnLog("Falling back to CPU Jacobi: computeEngine.webgpuJacobiSolver not available");
      const cpu = jacobiSolver(A, b, x0, { maxIterations, tolerance });
      result = { x: cpu.solutionVector, converged: cpu.converged, iterations: cpu.iterations };
    }

    if (Array.isArray(result)) {
      solutionVector = result;
    } else {
      solutionVector = result?.x ?? result?.solutionVector ?? [];
      converged = result?.converged ?? true;
      iterations = result?.iterations;
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
