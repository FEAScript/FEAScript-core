/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { jacobiSolver } from "./jacobiSolver.js";
import { mathjsLUSolver } from "./mathjsLUSolver.js";
import { assertWebGPUAvailable } from "./webgpuAvailability.js";
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
 * Function to compute the residual of a solution relative to the right-hand side, ‖R − J u‖₂ / ‖R‖₂, in 64-bit
 * floats. It is the same measure for every solver method, so the run reports of the direct and the iterative
 * solvers can be compared
 * @param {SparseMatrix|array} jacobianMatrix - The coefficient matrix (SparseMatrix or dense array of arrays)
 * @param {array} residualVector - The right-hand side vector
 * @param {array} solutionVector - The solution vector
 * @returns {number} The relative residual (the absolute residual for a zero right-hand side)
 */
export function relativeResidual(jacobianMatrix, residualVector, solutionVector) {
  const n = residualVector.length;
  let residualSquared = 0;
  let rightHandSideSquared = 0;
  for (let i = 0; i < n; i++) {
    let product = 0;
    if (jacobianMatrix instanceof SparseMatrix) {
      jacobianMatrix.forEachInRow(i, (j, value) => {
        product += value * solutionVector[j];
      });
    } else {
      const row = jacobianMatrix[i];
      for (let j = 0; j < n; j++) product += row[j] * solutionVector[j];
    }
    residualSquared += (residualVector[i] - product) ** 2;
    rightHandSideSquared += residualVector[i] ** 2;
  }
  return Math.sqrt(residualSquared) / (Math.sqrt(rightHandSideSquared) || 1);
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
 *  - converged: Boolean indicating whether the method converged (always true for direct methods)
 *  - iterations: Number of iterations performed (null for direct methods)
 *  - residual: The residual relative to the right-hand side (see relativeResidual)
 * @throws {FEAScriptError} If the method is unknown, or if it does not converge
 */
export function solveLinearSystem(solverMethod, jacobianMatrix, residualVector, options = {}) {
  // Extract options (the Jacobi tolerance applies to the residual relative to the right-hand side)
  const { maxIterations = 10000, tolerance = 1e-8, ordering, pivotThreshold } = options;

  let solutionVector = new Float64Array(0);
  let converged = true;
  let iterations = null;

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

  const residual = relativeResidual(jacobianMatrix, residualVector, solutionVector);
  return { solutionVector, converged, iterations, residual };
}

// Helper to lazily create a default WebGPU compute engine (Comlink + worker)
async function createDefaultComputeEngine() {
  await assertWebGPUAvailable();
  // The WebGPU worker always runs from source, never bundled: Taichi.js compiles kernels from their source
  // text, and bundling renames the fields and ti.* calls in it. Source mode (loaded from src/solvers/) finds
  // it in src/workers/; bundle mode (dist/) reaches the src/ folder that the package ships beside dist/.
  // Its imports are all relative, so it needs no import map
  const base = import.meta.url;
  const workerFile = base.includes("/src/solvers/")
    ? "../workers/webgpuWorker.js"
    : "../src/workers/webgpuWorker.js";
  const wrapperUrl = new URL(workerFile, base).href;
  const workerCode = `import "${wrapperUrl}";`;
  const blob = new Blob([workerCode], { type: "application/javascript" });
  const worker = new Worker(URL.createObjectURL(blob), {
    type: "module",
  });
  const computeEngine = Comlink.wrap(worker);
  try {
    await computeEngine.initialize();
  } catch (error) {
    worker.terminate(); // The caller never receives this worker, so it could not terminate it
    throw error;
  }
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
 *  - converged: Boolean indicating whether the method converged
 *  - iterations: Number of iterations performed
 *  - residual: The residual relative to the right-hand side, in 64-bit floats (see relativeResidual)
 * @throws {FEAScriptError} If the method is unknown, or if it does not converge
 */
export async function solveLinearSystemAsync(solverMethod, jacobianMatrix, residualVector, options = {}) {
  // Extract options. The tolerance applies to the residual relative to the right-hand side, as for "jacobi", but
  // the GPU works in 32-bit floats: the relative residual stops falling at about 1e-7 to 1e-5, depending on the
  // size of the system, hence a looser default than the 1e-8 of "jacobi"
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

  const residual = relativeResidual(systemMatrix, rightHandSideVector, solutionVector);
  return { solutionVector, converged, iterations, residual };
}
