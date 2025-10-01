//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

// generalFormPDEScript.js
// Solver for general 1D linear differential equations in weak form
// User provides coefficients A(x), B(x), C(x), D(x) and boundary conditions

/**
 * General 1D PDE Solver (Weak Form)
 * Solves equations of the form:
 * -->  d/dx(A(x) du/dx) + B(x) du/dx + C(x) u = D(x)
 * using the finite element method (FEM) and user-supplied coefficients.
 * @param {Object} options - Solver options
 * @param {function} options.A - Coefficient function A(x) (diffusion)
 * @param {function} options.B - Coefficient function B(x) (advection)
 * @param {function} options.C - Coefficient function C(x) (reaction)
 * @param {function} options.D - Source function D(x)
 * @param {Array<number>} options.mesh - Mesh nodes (1D array)
 * @param {Object} options.boundary - Boundary conditions
 *   { left: {type: 'dirichlet'|'neumann'|'robin', value}, right: {type, value} }
 *     - Dirichlet: value is the prescribed u
 *     - Neumann: value is the prescribed flux (A du/dx)
 *     - Robin: value is { a, b, c } for a*u + b*du/dx = c
 * @returns {Array<number>} Solution vector u at mesh nodes
 */
export function generalFormPDESolver({ A, B, C, D, mesh, boundary }) {
    // Number of nodes and elements
    const nNodes = mesh.length;
    const nElements = nNodes - 1;

    // Initialize global stiffness matrix and load vector
    const K = Array.from({ length: nNodes }, () => Array(nNodes).fill(0));
    const F = Array(nNodes).fill(0);

    // Linear basis functions for 1D elements
    // For each element [x0, x1]
    for (let e = 0; e < nElements; e++) {
        const x0 = mesh[e];
        const x1 = mesh[e + 1];
        const h = x1 - x0;
        // Local stiffness matrix and load vector
        let Ke = [ [0, 0], [0, 0] ];
        let Fe = [0, 0];
        // 2-point Gauss quadrature for integration
        const gaussPoints = [ -1/Math.sqrt(3), 1/Math.sqrt(3) ];
        const gaussWeights = [ 1, 1 ];
        for (let gp = 0; gp < 2; gp++) {
            // Map reference [-1,1] to [x0,x1]
            const xi = gaussPoints[gp];
            const w = gaussWeights[gp];
            const x = ((1 - xi) * x0 + (1 + xi) * x1) / 2;
            const dx_dxi = h / 2;
            // Basis functions and derivatives
            const N = [ (1 - xi) / 2, (1 + xi) / 2 ];
            const dN_dxi = [ -0.5, 0.5 ];
            const dN_dx = dN_dxi.map(d => d / dx_dxi);
            // Coefficients at integration point
            const a = A(x);
            const b = B(x);
            const c = C(x);
            const d = D(x);
            // Element matrix assembly (weak form)
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    Ke[i][j] += (
                        a * dN_dx[i] * dN_dx[j] +
                        b * dN_dx[j] * N[i] -
                        c * N[i] * N[j]
                    ) * w * dx_dxi;
                }
                Fe[i] += d * N[i] * w * dx_dxi;
            }
        }
        // Assemble into global matrix/vector
        K[e][e]     += Ke[0][0];
        K[e][e+1]   += Ke[0][1];
        K[e+1][e]   += Ke[1][0];
        K[e+1][e+1] += Ke[1][1];
        F[e]     += Fe[0];
        F[e+1]   += Fe[1];
    }

    // Apply boundary conditions (Dirichlet, Neumann, Robin)
    // Left boundary
    if (boundary.left) {
        if (boundary.left.type === 'dirichlet') {
            for (let j = 0; j < nNodes; j++) {
                K[0][j] = 0;
            }
            K[0][0] = 1;
            F[0] = boundary.left.value;
        } else if (boundary.left.type === 'neumann') {
            // Add Neumann flux to load vector
            F[0] += boundary.left.value;
        } else if (boundary.left.type === 'robin') {
            // Robin: a*u + b*du/dx = c
            const { a, b, c } = boundary.left.value;
            K[0][0] += a;
            F[0] += c;
            K[0][0] += b;
        }
    }
    // Right boundary
    if (boundary.right) {
        if (boundary.right.type === 'dirichlet') {
            for (let j = 0; j < nNodes; j++) {
                K[nNodes-1][j] = 0;
            }
            K[nNodes-1][nNodes-1] = 1;
            F[nNodes-1] = boundary.right.value;
        } else if (boundary.right.type === 'neumann') {
            // Add Neumann flux to load vector
            F[nNodes-1] += boundary.right.value;
        } else if (boundary.right.type === 'robin') {
            // Robin: a*u + b*du/dx = c
            const { a, b, c } = boundary.right.value;
            K[nNodes-1][nNodes-1] += a;
            F[nNodes-1] += c;
            K[nNodes-1][nNodes-1] += b;
        }
    }

    // Solve linear system Ku = F (simple Gauss elimination for small systems)
    function solveLinearSystem(A, b) {
        // Naive Gauss elimination (for small systems)
        const n = b.length;
        const x = Array(n).fill(0);
        const M = A.map(row => row.slice());
        const f = b.slice();
        // Forward elimination
        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let k = i+1; k < n; k++) {
                if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
            }
            [M[i], M[maxRow]] = [M[maxRow], M[i]];
            [f[i], f[maxRow]] = [f[maxRow], f[i]];
            for (let k = i+1; k < n; k++) {
                const c = M[k][i] / M[i][i];
                for (let j = i; j < n; j++) {
                    M[k][j] -= c * M[i][j];
                }
                f[k] -= c * f[i];
            }
        }
        // Back substitution
        for (let i = n-1; i >= 0; i--) {
            let sum = 0;
            for (let j = i+1; j < n; j++) {
                sum += M[i][j] * x[j];
            }
            x[i] = (f[i] - sum) / M[i][i];
        }
        return x;
    }
    const u = solveLinearSystem(K, F);
    return u;
}