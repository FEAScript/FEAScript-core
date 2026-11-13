/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to solve a system of non-linear equations using the Newton-Raphson method
 * @param {function} assembleMat - Matrix assembler based on the physical model
 * @param {object} context - Context object containing simulation data and options. When
 *  `solverMethod` is "frontal", it must also contain `assembleFront` (element assembler, which
 *  receives the current iterate as `solutionVector`) and `boundaryConditionsHandler`
 *  (see runFrontalSolver). An optional `linearSolverOptions` ({ maxIterations, tolerance }) is passed to the
 *  linear solver of each iteration
 * @returns {object} An object containing:
 *  - solutionVector: The solution vector (Float64Array)
 *  - iterations: The number of iterations performed
 *  - converged: Boolean indicating whether the method converged
 *  - increment: The norm of the last increment, ‖Δu‖₂ (the convergence measure)
 *  - linearIterations: The iterations of the linear solver, summed over the Newton-Raphson iterations (null
 *    for direct solvers)
 */
export function newtonRaphson(assembleMat: Function, context?: object): object;
