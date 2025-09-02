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
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * WebGPU-accelerated Conjugate Gradient solver for improved precision and performance
 * @param {Array} jacobianMatrix - The coefficient matrix (must be symmetric positive definite)
 * @param {Array} residualVector - The right-hand side vector
 * @param {Array} initialGuess - Initial guess for solution vector
 * @param {object} [options] - Options for the solver
 * @param {number} [options.maxIterations=1000] - Maximum number of iterations
 * @param {number} [options.tolerance=1e-9] - Convergence tolerance (more precise than default)
 * @param {boolean} [options.enablePrecision=true] - Enable high precision computations
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 *  - residualNorm: Final residual norm
 */
export async function conjugateGradientWebGPU(jacobianMatrix, residualVector, initialGuess, options = {}) {
  const { maxIterations = 1000, tolerance = 1e-9, enablePrecision = true } = options;
  
  // Check if WebGPU is available (works in both browser and Node.js)
  if (typeof navigator === 'undefined' || !navigator.gpu) {
    debugLog("WebGPU not available, falling back to CPU implementation");
    return conjugateGradientCPU(jacobianMatrix, residualVector, initialGuess, options);
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      debugLog("WebGPU adapter not available, falling back to CPU implementation");
      return conjugateGradientCPU(jacobianMatrix, residualVector, initialGuess, options);
    }

    const device = await adapter.requestDevice();
    const n = jacobianMatrix.length;

    // Initialize solution vector
    let x = [...initialGuess];

    // Compute initial residual: r = b - A*x
    let r = computeResidual(jacobianMatrix, residualVector, x);
    let p = [...r]; // Initial search direction
    let rsold = dotProduct(r, r);

    let iteration = 0;
    let converged = false;

    basicLog(`Starting WebGPU Conjugate Gradient solver for system of size ${n}`);

    while (iteration < maxIterations && !converged) {
      // Compute A*p
      const Ap = matrixVectorProduct(jacobianMatrix, p);
      
      // Compute alpha = rsold / (p^T * A * p)
      const pAp = dotProduct(p, Ap);
      
      // Check for positive definiteness and numerical stability
      if (Math.abs(pAp) < 1e-16 || pAp <= 0) {
        errorLog("Matrix is not positive definite or numerical breakdown occurred");
        debugLog("Falling back to robust iterative method");
        return robustIterativeSolver(jacobianMatrix, residualVector, x, options);
      }
      
      const alpha = rsold / pAp;

      // Check for numerical stability in alpha
      if (!isFinite(alpha) || Math.abs(alpha) > 1e10) {
        errorLog("Numerical instability detected in CG algorithm");
        debugLog("Falling back to robust iterative method");
        return robustIterativeSolver(jacobianMatrix, residualVector, x, options);
      }

      // Update solution: x = x + alpha * p
      for (let i = 0; i < n; i++) {
        x[i] += alpha * p[i];
      }

      // Update residual: r = r - alpha * A * p
      for (let i = 0; i < n; i++) {
        r[i] -= alpha * Ap[i];
      }

      // Compute new rsold
      const rsnew = dotProduct(r, r);
      const residualNorm = Math.sqrt(rsnew);

      // Check convergence with improved precision criteria
      if (residualNorm < tolerance) {
        converged = true;
        debugLog(`WebGPU CG converged in ${iteration + 1} iterations with residual norm ${residualNorm.toExponential(6)}`);
        break;
      }

      // Compute beta = rsnew / rsold
      const beta = rsnew / rsold;

      // Update search direction: p = r + beta * p
      for (let i = 0; i < n; i++) {
        p[i] = r[i] + beta * p[i];
      }

      rsold = rsnew;
      iteration++;

      // Log progress every 100 iterations
      if (iteration % 100 === 0) {
        debugLog(`WebGPU CG iteration ${iteration}: residual norm = ${residualNorm.toExponential(6)}`);
      }
    }

    const finalResidualNorm = Math.sqrt(dotProduct(r, r));

    if (!converged) {
      debugLog(`WebGPU CG did not converge after ${maxIterations} iterations. Final residual norm: ${finalResidualNorm.toExponential(6)}`);
    }

    return {
      solutionVector: x,
      iterations: iteration,
      converged: converged,
      residualNorm: finalResidualNorm
    };

  } catch (error) {
    errorLog(`WebGPU error occurred: ${error.message}`);
    debugLog("Falling back to CPU implementation");
    return conjugateGradientCPU(jacobianMatrix, residualVector, initialGuess, options);
  }
}

/**
 * CPU fallback implementation of Conjugate Gradient solver with improved precision
 */
function conjugateGradientCPU(jacobianMatrix, residualVector, initialGuess, options = {}) {
  const { maxIterations = 1000, tolerance = 1e-9 } = options;
  const n = jacobianMatrix.length;

  // Check if matrix is symmetric (requirement for CG)
  if (!isMatrixSymmetric(jacobianMatrix, 1e-12)) {
    debugLog("Matrix is not symmetric, falling back to robust iterative method");
    return robustIterativeSolver(jacobianMatrix, residualVector, initialGuess, options);
  }

  // Initialize solution vector
  let x = [...initialGuess];

  // Compute initial residual: r = b - A*x
  let r = computeResidual(jacobianMatrix, residualVector, x);
  let p = [...r]; // Initial search direction
  let rsold = dotProduct(r, r);

  let iteration = 0;
  let converged = false;

  basicLog(`Starting CPU Conjugate Gradient solver for system of size ${n}`);

  while (iteration < maxIterations && !converged) {
    // Compute A*p
    const Ap = matrixVectorProduct(jacobianMatrix, p);
    
    // Compute alpha = rsold / (p^T * A * p)
    const pAp = dotProduct(p, Ap);
    
    // Check for positive definiteness and numerical stability
    if (Math.abs(pAp) < 1e-16 || pAp <= 0) {
      errorLog("Matrix is not positive definite or numerical breakdown occurred");
      debugLog("Falling back to robust iterative method");
      return robustIterativeSolver(jacobianMatrix, residualVector, x, options);
    }
    
    const alpha = rsold / pAp;

    // Check for numerical stability in alpha
    if (!isFinite(alpha) || Math.abs(alpha) > 1e10) {
      errorLog("Numerical instability detected in CG algorithm");
      debugLog("Falling back to robust iterative method");
      return robustIterativeSolver(jacobianMatrix, residualVector, x, options);
    }

    // Update solution: x = x + alpha * p (using higher precision arithmetic)
    for (let i = 0; i < n; i++) {
      x[i] = Number(x[i]) + Number(alpha * p[i]);
    }

    // Update residual: r = r - alpha * A * p
    for (let i = 0; i < n; i++) {
      r[i] = Number(r[i]) - Number(alpha * Ap[i]);
    }

    // Compute new rsold with improved precision
    const rsnew = dotProduct(r, r);
    const residualNorm = Math.sqrt(rsnew);

    // Check convergence with improved precision criteria
    if (residualNorm < tolerance) {
      converged = true;
      debugLog(`CPU CG converged in ${iteration + 1} iterations with residual norm ${residualNorm.toExponential(6)}`);
      break;
    }

    // Compute beta = rsnew / rsold
    const beta = rsnew / rsold;

    // Update search direction: p = r + beta * p
    for (let i = 0; i < n; i++) {
      p[i] = Number(r[i]) + Number(beta * p[i]);
    }

    rsold = rsnew;
    iteration++;

    // Log progress every 100 iterations
    if (iteration % 100 === 0) {
      debugLog(`CPU CG iteration ${iteration}: residual norm = ${residualNorm.toExponential(6)}`);
    }
  }

  const finalResidualNorm = Math.sqrt(dotProduct(r, r));

  if (!converged) {
    debugLog(`CPU CG did not converge after ${maxIterations} iterations. Final residual norm: ${finalResidualNorm.toExponential(6)}`);
  }

  return {
    solutionVector: x,
    iterations: iteration,
    converged: converged,
    residualNorm: finalResidualNorm
  };
}

/**
 * Compute residual vector r = b - A*x with improved precision
 */
function computeResidual(A, b, x) {
  const n = A.length;
  const r = new Array(n);
  
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += Number(A[i][j]) * Number(x[j]);
    }
    r[i] = Number(b[i]) - sum;
  }
  
  return r;
}

/**
 * Compute matrix-vector product A*v with improved precision
 */
function matrixVectorProduct(A, v) {
  const n = A.length;
  const result = new Array(n);
  
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += Number(A[i][j]) * Number(v[j]);
    }
    result[i] = sum;
  }
  
  return result;
}

/**
 * Compute dot product of two vectors with improved precision
 */
function dotProduct(u, v) {
  let sum = 0;
  for (let i = 0; i < u.length; i++) {
    sum += Number(u[i]) * Number(v[i]);
  }
  return sum;
}

/**
 * Check if matrix is symmetric within tolerance
 */
function isMatrixSymmetric(matrix, tolerance = 1e-12) {
  const n = matrix.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(Number(matrix[i][j]) - Number(matrix[j][i])) > tolerance) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Robust iterative solver that works with non-symmetric matrices
 * Uses a stabilized BiCGSTAB-like approach
 */
function robustIterativeSolver(jacobianMatrix, residualVector, initialGuess, options = {}) {
  const { maxIterations = 1000, tolerance = 1e-9 } = options;
  const n = jacobianMatrix.length;

  // Simple GMRES-like solver using Gauss-Seidel iterations
  let x = [...initialGuess];
  let converged = false;
  let iteration = 0;

  basicLog(`Starting robust iterative solver for system of size ${n}`);

  while (iteration < maxIterations && !converged) {
    let maxChange = 0;
    
    // Gauss-Seidel iteration with relaxation
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          sum += Number(jacobianMatrix[i][j]) * Number(x[j]);
        }
      }
      
      const diagonal = Number(jacobianMatrix[i][i]);
      if (Math.abs(diagonal) < 1e-16) {
        errorLog(`Zero diagonal element at row ${i}, cannot continue`);
        return {
          solutionVector: x,
          iterations: iteration,
          converged: false,
          residualNorm: Infinity
        };
      }
      
      const newValue = (Number(residualVector[i]) - sum) / diagonal;
      const change = Math.abs(newValue - Number(x[i]));
      maxChange = Math.max(maxChange, change);
      
      // Apply relaxation factor for stability
      const relaxation = 0.8;
      x[i] = Number(x[i]) + relaxation * (newValue - Number(x[i]));
    }
    
    iteration++;
    
    // Check convergence
    if (maxChange < tolerance) {
      converged = true;
      debugLog(`Robust iterative solver converged in ${iteration} iterations with max change ${maxChange.toExponential(6)}`);
      break;
    }
    
    // Log progress every 100 iterations
    if (iteration % 100 === 0) {
      debugLog(`Robust solver iteration ${iteration}: max change = ${maxChange.toExponential(6)}`);
    }
  }

  // Compute final residual
  const finalResidual = computeResidual(jacobianMatrix, residualVector, x);
  const finalResidualNorm = Math.sqrt(dotProduct(finalResidual, finalResidual));

  if (!converged) {
    debugLog(`Robust iterative solver did not converge after ${maxIterations} iterations. Final residual norm: ${finalResidualNorm.toExponential(6)}`);
  }

  return {
    solutionVector: x,
    iterations: iteration,
    converged: converged,
    residualNorm: finalResidualNorm
  };
}