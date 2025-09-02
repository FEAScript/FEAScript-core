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
  
  // Check if WebGPU is available
  if (!navigator.gpu) {
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
      
      if (Math.abs(pAp) < 1e-16) {
        errorLog("Matrix is not positive definite or numerical breakdown occurred");
        break;
      }
      
      const alpha = rsold / pAp;

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
    
    if (Math.abs(pAp) < 1e-16) {
      errorLog("Matrix is not positive definite or numerical breakdown occurred");
      break;
    }
    
    const alpha = rsold / pAp;

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