/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { jacobiSolver, mathjsLUSolver } from "../base/solvers/index.js";
import { basicLog, debugLog, errorLog } from "../utilities/logging.js";
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
    const luSolverResult = mathjsLUSolver(jacobianMatrix, residualVector, { matrixType: "sparse" });
    solutionVector = luSolverResult.solutionVector;
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
  const wrapperUrl = new URL("../workers/webgpuWorker.js", import.meta.url).href;
  const workerCode = `import "${wrapperUrl}";`;
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(blob), {
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
  const systemMatrix = Array.isArray(jacobianMatrix)
    ? jacobianMatrix
    : jacobianMatrix?.toArray?.() ?? jacobianMatrix;
  const rightHandSideVector = Array.isArray(residualVector)
    ? residualVector
    : residualVector?.toArray?.() ?? residualVector;

  let created = null;
  let computeEngine = null;

  let solutionVector = [];
  let converged = true;
  let iterations;

  if (solverMethod === "jacobi-gpu") {
    // Spin up a worker-backed compute engine
    created = await createDefaultComputeEngine();
    computeEngine = created.computeEngine;

    const initialGuess = new Array(rightHandSideVector.length).fill(0);
    let result;

    result = await computeEngine.webgpuJacobiSolver(systemMatrix, rightHandSideVector, initialGuess, {
      maxIterations,
      tolerance,
    });
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
    await computeEngine?.destroy?.().catch(() => {});
    created.worker.terminate();
  }

  return { solutionVector, converged, iterations };
}
