//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

/**
 * Function to solve a system of linear equations using the Conjugate Gradient iterative method
 * This implementation uses Taichi.js for WebGPU acceleration with high precision (Float64)
 * @param {array} A - The coefficient matrix (must be square and symmetric positive definite)
 * @param {array} b - The right-hand side vector
 * @param {array} x0 - Initial guess for solution vector
 * @param {object} [options] - Options for the solver
 * @param {number} [options.maxIterations=1000] - Maximum number of iterations
 * @param {number} [options.tolerance=1e-6] - Convergence tolerance
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 */
export function conjugateGradientSolver(A, b, x0, options = {}) {
  const { maxIterations = 1000, tolerance = 1e-6 } = options;
  
  // For now, we'll use a basic JavaScript implementation with high precision
  // This ensures synchronous operation while maintaining numerical precision
  
  const n = A.length;
  let x = [...x0]; // Current solution
  let r = new Array(n); // Residual vector
  let p = new Array(n); // Search direction
  let Ap = new Array(n); // A*p
  
  // Initialize residual r = b - A*x
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    r[i] = b[i] - sum;
  }
  
  // Initialize search direction p = r
  for (let i = 0; i < n; i++) {
    p[i] = r[i];
  }
  
  let rsold = 0;
  for (let i = 0; i < n; i++) {
    rsold += r[i] * r[i];
  }
  
  let iterations = 0;
  let converged = false;
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Check convergence
    const resNorm = Math.sqrt(rsold);
    if (resNorm < tolerance) {
      converged = true;
      iterations = iteration;
      break;
    }
    
    // Compute Ap = A*p
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += A[i][j] * p[j];
      }
      Ap[i] = sum;
    }
    
    // Compute alpha = rsold / (p'*Ap)
    let pAp = 0;
    for (let i = 0; i < n; i++) {
      pAp += p[i] * Ap[i];
    }
    
    if (Math.abs(pAp) < 1e-14) {
      // Avoid division by zero
      break;
    }
    
    const alpha = rsold / pAp;
    
    // Update solution x = x + alpha*p
    for (let i = 0; i < n; i++) {
      x[i] += alpha * p[i];
    }
    
    // Update residual r = r - alpha*Ap
    for (let i = 0; i < n; i++) {
      r[i] -= alpha * Ap[i];
    }
    
    // Compute new rsold
    let rsnew = 0;
    for (let i = 0; i < n; i++) {
      rsnew += r[i] * r[i];
    }
    
    // Compute beta = rsnew / rsold
    const beta = rsnew / rsold;
    
    // Update search direction p = r + beta*p
    for (let i = 0; i < n; i++) {
      p[i] = r[i] + beta * p[i];
    }
    
    rsold = rsnew;
    iterations = iteration + 1;
  }
  
  return {
    solutionVector: x,
    iterations: iterations,
    converged: converged,
  };
}