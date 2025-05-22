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
 * Function to solve a system of linear equations using the Jacobi iterative method
 * This version uses Taichi.js to accelerate the core computation
 * @param {array} A - The coefficient matrix (must be square)
 * @param {array} b - The right-hand side vector
 * @param {array} x0 - Initial guess for solution vector
 * @param {number} [maxIterations=100] - Maximum number of iterations
 * @param {number} [tolerance=1e-7] - Convergence tolerance
 * @returns {object} An object containing:
 *  - solution: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 */
export async function jacobiMethod(A, b, x0, maxIterations = 100, tolerance = 1e-7, useFloat64 = true) {
  // Initialize Taichi for each call to ensure clean state
  const taichi = await import('taichi.js');
  await taichi.init();
  
  const n = A.length;
  
  // Choose appropriate float type based on precision parameter
  const FloatArray = useFloat64 ? Float64Array : Float32Array;
  
  // Declare fields outside try block so they can be referenced in finally
  let fieldA, fieldB, fieldCurrent, fieldNext, fieldMaxDiff;
  
  try {
    // Create fields with appropriate precision
    fieldA = taichi.field(FloatArray, [n, n]);
    fieldB = taichi.field(FloatArray, [n]);
    fieldCurrent = taichi.field(FloatArray, [n]);    
    fieldNext = taichi.field(FloatArray, [n]);
    fieldMaxDiff = taichi.field(FloatArray, [1]);
    
    // Set initial values
    fieldA.set(A.flat());
    fieldB.set(b);
    fieldCurrent.set(x0);
    
    // Create kernels inline (no caching to prevent memory issues)
    const updateKernel = taichi.kernel(function(A, b, current, next, n) {
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
          if (j !== i) {
            sum += A[i][j] * current[j];
          }
        }
        next[i] = (b[i] - sum) / A[i][i];
      }
    });
    
    const diffKernel = taichi.kernel(function(current, next, maxDiff, n) {
      maxDiff[0] = 0;
      for (let i = 0; i < n; i++) {
        const diff = Math.abs(next[i] - current[i]);
        if (diff > maxDiff[0]) {
          maxDiff[0] = diff;
        }
      }
    });
    
    const copyKernel = taichi.kernel(function(src, dst, n) {
      for (let i = 0; i < n; i++) {
        dst[i] = src[i];
      }
    });
    
    // Store solution here so we can return it after cleanup
    let solution;
    let iterationsCompleted;
    let hasConverged = false;
    
    // Main iteration loop
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Compute next iteration values
      updateKernel(fieldA, fieldB, fieldCurrent, fieldNext, n);
      
      // Compute max difference directly in Taichi
      diffKernel(fieldCurrent, fieldNext, fieldMaxDiff, n);
      const maxDiff = fieldMaxDiff.get()[0];
      
      // Copy next values to current using Taichi
      copyKernel(fieldNext, fieldCurrent, n);
      
      // Check for convergence
      if (maxDiff < tolerance) {
        solution = Array.from(fieldCurrent.get());
        iterationsCompleted = iteration + 1;
        hasConverged = true;
        break;
      }
      
      // If we're approaching maximum iterations, get the current solution
      if (iteration === maxIterations - 1) {
        solution = Array.from(fieldCurrent.get());
        iterationsCompleted = maxIterations;
      }
    }
    
    return {
      solution: solution,
      iterations: iterationsCompleted,
      converged: hasConverged,
    };
  } catch (error) {
    console.error("Error in Jacobi method:", error);
    throw error;
  } finally {
    // Aggressive cleanup - destroy all fields and reset Taichi completely
    try {
      if (fieldA) fieldA.destroy();
      if (fieldB) fieldB.destroy();
      if (fieldCurrent) fieldCurrent.destroy();
      if (fieldNext) fieldNext.destroy();
      if (fieldMaxDiff) fieldMaxDiff.destroy();
      
      // Reset Taichi completely
      taichi.reset();
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }
  }
}