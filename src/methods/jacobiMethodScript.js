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
 * Solves a system of linear equations using the Jacobi iterative method
 * @param {Array<Array<number>>} A - The coefficient matrix (must be square)
 * @param {Array<number>} b - The right-hand side vector
 * @param {Array<number>} x0 - Initial guess for solution vector
 * @param {number} [maxIterations=100] - Maximum number of iterations
 * @param {number} [tolerance=1e-7] - Convergence tolerance
 * @returns {object} An object containing:
 *  - solution: The solution vector
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 */
export function jacobiMethod(A, b, x0, maxIterations = 100, tolerance = 1e-7) {
    const n = A.length; // Size of the square matrix
    let x = [...x0];    // Current solution (starts with initial guess)
    let xNew = new Array(n); // Next iteration's solution
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        // Perform one iteration
        for (let i = 0; i < n; i++) {
            let sum = 0;
            // Calculate sum of A[i][j] * x[j] for j ≠ i
            for (let j = 0; j < n; j++) {
                if (j !== i) {
                    sum += A[i][j] * x[j];
                }
            }
            // Update xNew[i] using the Jacobi formula
            xNew[i] = (b[i] - sum) / A[i][i];
        }
        
        // Check convergence
        let maxDiff = 0;
        for (let i = 0; i < n; i++) {
            maxDiff = Math.max(maxDiff, Math.abs(xNew[i] - x[i]));
        }
        
        // Update x for next iteration
        x = [...xNew];
        
        // If difference is small enough, we've converged
        if (maxDiff < tolerance) {
            return {
                solution: x,
                iterations: iteration + 1,
                converged: true
            };
        }
    }
    
    // If we reach here, we didn't converge within maxIterations
    return {
        solution: x,
        iterations: maxIterations,
        converged: false
    };
}