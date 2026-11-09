/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { jacobiSolver } from "./jacobiSolver.js";
import { mathjsLUSolver } from "./mathjsLUSolver.js";
import { SparseMatrix } from "../linalg/sparseMatrix.js";
import { FEAScriptError } from "../utilities/errors.js";
import { basicLog, debugLog } from "../utilities/logging.js";
import * as Comlink from "../vendor/comlink.mjs";

/**
 * Function to stop a solve whose assembled system contains NaN or infinite values. These must not reach the
 * solvers: the sparse LU solver of math.js takes a NaN on the right-hand side for a zero, and returns a finite but
 * wrong solution
 * @param {SparseMatrix|array} jacobianMatrix - The coefficient matrix (SparseMatrix or dense array of arrays)
 * @param {array} residualVector - The right-hand side vector
 * @throws {FEAScriptError} NON_FINITE_VALUES
 */
function validateLinearSystem(jacobianMatrix, residualVector) {
  const advice =
    "Check that the coefficient functions return finite numbers over the whole domain, and that no mesh element is degenerate (zero area or length).";
  const entryIndex = Array.prototype.findIndex.call(residualVector, (value) => !Number.isFinite(value));
  if (entryIndex !== -1) {
    throw new FEAScriptError(
      "NON_FINITE_VALUES",
      `The assembled right-hand side contains NaN or infinite values (first at entry ${entryIndex} of ${residualVector.length}). ${advice}`,
    );
  }

  let matrixIsFinite;
  if (jacobianMatrix instanceof SparseMatrix) {
    matrixIsFinite =
      jacobianMatrix.values.every(Number.isFinite) &&
      [...jacobianMatrix.overflowRows.values()].every((row) => [...row.values()].every(Number.isFinite));
  } else {
    const rows = jacobianMatrix?.toArray?.() ?? jacobianMatrix;
    matrixIsFinite = rows.every((row) => Array.prototype.every.call(row, Number.isFinite));
  }
  if (!matrixIsFinite) {
    throw new FEAScriptError(
      "NON_FINITE_VALUES",
      `The assembled system matrix contains NaN or infinite values. ${advice}`,
    );
  }
}

/**
 * Function to solve a system of linear equations using different solver methods
 * @param {string} solverMethod - The solver method to use ("lusolve" or "jacobi")
 * @param {SparseMatrix} jacobianMatrix - The coefficient matrix
 * @param {Array} residualVector - The right-hand side vector
 * @param {object} [options] - Optional parameters for the solver, such as `maxIterations` and `tolerance` (Jacobi),
 *  and `ordering` and `pivotThreshold` (LU decomposition, see mathjsLUSolver)
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector (Float64Array)
 *  - converged: Boolean indicating whether the method converged (for iterative methods)
 *  - iterations: Number of iterations performed (for iterative methods)
 * @throws {FEAScriptError} If the method is unknown, or if it does not converge
 */
export function solveLinearSystem(solverMethod, jacobianMatrix, residualVector, options = {}) {
  // Extract options (the Jacobi tolerance applies to the residual relative to the right-hand side)
  const { maxIterations = 10000, tolerance = 1e-8, ordering, pivotThreshold } = options;

  let solutionVector = new Float64Array(0);
  let converged = true;
  let iterations = 0;

  validateLinearSystem(jacobianMatrix, residualVector);

  // Solve the linear system based on the specified solver method
  basicLog(`Solving system using ${solverMethod}...`);
  console.time("systemSolving");

  if (solverMethod === "lusolve") {
    // Use LU decomposition method
    const luSolverResult = mathjsLUSolver(jacobianMatrix, residualVector, {
      matrixType: "sparse",
      ordering,
      pivotThreshold,
    });
    solutionVector = luSolverResult.solutionVector;
  } else if (solverMethod === "jacobi") {
    // Use Jacobi method
    const initialGuess = new Array(residualVector.length).fill(0);
    const jacobiSolverResult = jacobiSolver(jacobianMatrix, residualVector, initialGuess, {
      maxIterations,
      tolerance,
    });

    solutionVector = jacobiSolverResult.solutionVector;
    converged = jacobiSolverResult.converged;
    iterations = jacobiSolverResult.iterations;
    if (converged) debugLog(`Jacobi method converged in ${iterations} iterations`);
  } else {
    console.timeEnd("systemSolving");
    throw new FEAScriptError("UNSUPPORTED_SOLVER", `Unknown solver method: ${solverMethod}`);
  }

  console.timeEnd("systemSolving");
  if (!converged) {
    throw new FEAScriptError(
      "NOT_CONVERGED",
      `Jacobi method did not converge after ${iterations} iterations`,
    );
  }
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
 * @param {SparseMatrix|array} jacobianMatrix - The coefficient matrix
 * @param {array} residualVector - The right-hand side vector
 * @param {object} [options] - Optional parameters for the solver, such as `maxIterations`, `tolerance` and
 *  `computeEngine` (an initialized WebGPU compute engine to reuse; when omitted, a temporary one is created)
 * @returns {Promise<object>} A promise that resolves to an object containing:
 *  - solutionVector: The solution vector (Float64Array)
 *  - converged: Boolean indicating whether the method converged (for iterative methods)
 *  - iterations: Number of iterations performed (for iterative methods)
 * @throws {FEAScriptError} If the method is unknown, or if it does not converge
 */
export async function solveLinearSystemAsync(solverMethod, jacobianMatrix, residualVector, options = {}) {
  // Extract options
  const { maxIterations = 10000, tolerance = 1e-4 } = options;

  basicLog(`Solving system using ${solverMethod}...`);
  console.time("systemSolving");

  // Normalize inputs (the WebGPU Jacobi kernel works on a dense matrix)
  const systemMatrix =
    jacobianMatrix instanceof SparseMatrix
      ? jacobianMatrix.toDense()
      : Array.isArray(jacobianMatrix)
      ? jacobianMatrix
      : jacobianMatrix?.toArray?.() ?? jacobianMatrix;
  const rightHandSideVector = Array.isArray(residualVector)
    ? residualVector
    : residualVector?.toArray?.() ?? residualVector;

  validateLinearSystem(systemMatrix, rightHandSideVector);

  let created = null;
  let computeEngine = null;

  let solutionVector = new Float64Array(0);
  let converged = true;
  let iterations;

  if (solverMethod === "jacobi-gpu") {
    // Reuse the caller's compute engine, or spin up a temporary worker-backed one
    if (options.computeEngine) {
      computeEngine = options.computeEngine;
    } else {
      created = await createDefaultComputeEngine();
      computeEngine = created.computeEngine;
    }

    const initialGuess = new Array(rightHandSideVector.length).fill(0);
    let result;

    result = await computeEngine.webgpuJacobiSolver(systemMatrix, rightHandSideVector, initialGuess, {
      maxIterations,
      tolerance,
    });
    solutionVector = Float64Array.from(result.solutionVector);
    converged = result.converged;
    iterations = result.iterations;
    if (converged) debugLog(`Jacobi method converged in ${iterations} iterations`);
  } else {
    console.timeEnd("systemSolving");
    throw new FEAScriptError("UNSUPPORTED_SOLVER", `Unknown solver method: ${solverMethod}`);
  }

  console.timeEnd("systemSolving");

  if (created) {
    await computeEngine?.destroy?.().catch(() => {});
    created.worker.terminate();
  }

  if (!converged) {
    throw new FEAScriptError(
      "NOT_CONVERGED",
      `Jacobi method did not converge after ${iterations} iterations`,
    );
  }
  basicLog(`System solved successfully (${solverMethod})`);

  return { solutionVector, converged, iterations };
}
