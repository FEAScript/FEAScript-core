/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Class to implement finite element analysis in JavaScript
 * @param {string} solverConfig - Parameter specifying the type of solver
 * @param {object} meshConfig - Object containing computational mesh details
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @returns {object} An object containifng the solution vector and mesh information
 */
export class FEAScriptModel {
    solverConfig: ModelName | null;
    geometry: object | null;
    meshConfig: object | null;
    mesh: object | null;
    boundaryConditions: {};
    solverMethod: string;
    solverOptions: {
        /**
         * - The linear solver method (default "lusolve")
         */
        method?: SolverMethod | undefined;
        /**
         * - Iteration limit of the iterative linear solvers
         */
        maxIterations?: number | undefined;
        /**
         * - Tolerance of the iterative linear solvers, on the residual relative to the
         * right-hand side
         */
        tolerance?: number | undefined;
    } | null;
    coefficientFunctions: import("./types.js").CoefficientFunctions | null;
    /**
     * Method to set the model configuration
     * @param {ModelName} modelConfig - The model: "heatConduction", "generalFormPDE", "frontPropagation",
     *  "creepingFlow" or "eulerBernoulliBeam" (the names of FEAScript 0.3, with the "Script" suffix, are deprecated)
     * @param {ModelOptions} [options] - Optional additional configuration: the coefficients of the model
     *  (coefficientFunctions), nonlinear (the general form PDE with the Newton-Raphson method), the linear solver
     *  (solver, see setSolverOptions), and maxIterations and tolerance of the Newton-Raphson method (and of the
     *  iterative linear solvers, unless options.solver gives them)
     */
    setModelConfig(modelConfig: ModelName, options?: ModelOptions): void;
    nonlinear: boolean | undefined;
    maxIterations: number | undefined;
    tolerance: number | undefined;
    /**
     * Method to set the geometry of the domain, which setMeshConfig then meshes
     * @param {Geometry} geometry - `{ line: length }` (1D, boundaries "left" and "right"), `{ rectangle: [width,
     *  height] }` (boundaries "bottom", "right", "top", "left") or `{ shape, holes, points }`, a
     *  polygon with holes whose boundaries are named, written as a path `{ start, boundaries: [{ name, to }] }`
     *  (see geometry.js). The boundary conditions are keyed by the boundary names
     */
    setGeometry(geometry: Geometry): void;
    /**
     * Method to set how the geometry is meshed
     * @param {MeshConfig} meshConfig - The mesh settings: elements, "quadrilaterals" (default; a rectangle or a
     *  convex four-sided shape, mapped from a grid) or "triangles" (any shape with holes, by Delaunay refinement);
     *  elementOrder, "linear" (default) or "quadratic"; size, the length of an element side (for triangles also a
     *  function (x, y) of position, for a mesh size that varies); divisions, instead of size, the number of
     *  elements of a line or [nx, ny] along the bottom and the left side of a quadrilateral; minAngle (default 20)
     *  and maxNodes (default 100000) for triangles
     */
    setMeshConfig(meshConfig: MeshConfig): void;
    /**
     * Method to set the mesh directly: a mesh imported with importGmshMesh, or generated with
     * generateTriangleMesh or generateQuadrilateralMesh. The geometry and the mesh configuration are not used
     * @param {Mesh} mesh - The mesh object
     */
    setMesh(mesh: Mesh): void;
    /**
     * Method to get the mesh object of the model, generating it from the geometry and the mesh configuration at
     * the first call
     * @returns {Mesh} The mesh object
     * @throws {FEAScriptError} INVALID_INPUT when no mesh can be made
     */
    getMesh(): Mesh;
    /**
     * Method to get the dimension of the mesh, "1D" or "2D", or null when no mesh is set
     * @returns {"1D" | "2D" | null}
     */
    getMeshDimension(): "1D" | "2D" | null;
    /**
     * Method to get the boundary conditions keyed by the boundary names of the mesh, with the deprecated numeric
     * keys of FEAScript 0.3 (and the Gmsh tags minus one) mapped to the names, with a warning
     * @param {object} meshData - The prepared mesh
     * @returns {object} The boundary conditions by boundary name
     * @private
     */
    private resolveBoundaryConditions;
    /**
     * Method to set the solver options. Called by setModelConfig with its `solver` option
     * @param {SolverOptions} solver - The solver options: method, "lusolve" (default), "jacobi", "frontal", or
     *  "jacobi-gpu" (with solveAsync); maxIterations and tolerance of the iterative linear solvers, the tolerance
     *  on the residual relative to the right-hand side
     * @throws {FEAScriptError} INVALID_INPUT, listing each problem
     */
    setSolverOptions(solver: SolverOptions): void;
    /**
     * Method to get the iteration limit and tolerance of the linear solver: those of the solve call, else those of
     * the solver options, else those of setModelConfig
     * @param {object} [options] - The options of the solve call
     * @returns {object} The maxIterations and tolerance of the linear solver
     * @private
     */
    private getLinearSolverOptions;
    /**
     * Method to add a boundary condition
     * @param {string | number} boundaryKey - The boundary name (for the Euler-Bernoulli beam, the 1-based node
     *  number)
     * @param {BoundaryCondition | BoundaryCondition[] | ArrayBoundaryCondition | ArrayBoundaryCondition[]} condition -
     *  The condition as an object with its type and named parameters, e.g. { type: "convection", h: 1,
     *  ambientTemperature: 20 }; for the Euler-Bernoulli beam, one such object or a list of them for the node. The array form of FEAScript 0.3, e.g. ["convection", 1, 20], is deprecated
     * @throws {FEAScriptError} INVALID_INPUT for a condition object with no or an unknown type, or with an unknown
     *  or missing parameter
     */
    addBoundaryCondition(boundaryKey: string | number, condition: BoundaryCondition | BoundaryCondition[] | ArrayBoundaryCondition | ArrayBoundaryCondition[]): void;
    /**
     * Method to stop a solve with a solver method that the selected model cannot use
     * @throws {FEAScriptError} If the combination is not supported
     * @private
     */
    private validateSolverMethod;
    /**
     * Method to check the model input that does not depend on the mesh, before anything is computed. Every
     * problem found is reported at once, in one error
     * @throws {FEAScriptError} INVALID_INPUT, listing each problem
     * @private
     */
    private validateModel;
    /**
     * Method to find boundary conditions with a type that the selected model does not recognize, or with missing
     * or non-numeric values (an unrecognized condition would otherwise be ignored, and a missing value gives NaN)
     * @returns {string[]} The problems found
     * @private
     */
    private findBoundaryConditionProblems;
    /**
     * Method to find missing coefficient functions, coefficients of the wrong type, and coefficient names that the
     * model does not use (e.g. a misspelled one, which would otherwise leave the default value in place)
     * @returns {string[]} The problems found
     * @private
     */
    private findCoefficientFunctionProblems;
    /**
     * Method to check that every boundary condition refers to a boundary (or, for the Euler-Bernoulli beam, a node)
     * of the mesh, and is not on an imported boundary that is incomplete. A condition on a boundary that does not
     * exist would otherwise stop the solve with a TypeError, and one on an incomplete boundary would apply to only
     * part of it
     * @param {object} meshData - Object containing the prepared mesh data
     * @throws {FEAScriptError} INVALID_INPUT, listing each such condition
     * @private
     */
    private validateBoundaries;
    /**
     * Method to stop a solve whose solution contains NaN or infinite values, e.g. from a coefficient function that
     * returns NaN for some x, instead of returning it
     * @param {Float64Array} solutionVector - The solution vector
     * @throws {FEAScriptError} NON_FINITE_VALUES
     * @private
     */
    private validateSolution;
    /**
     * Method to set the solver method
     * @deprecated Use setModelConfig(model, { solver: { method } }); setSolverMethod will be removed in a future
     *  version
     * @param {SolverMethod} solverMethod - The solver method
     */
    setSolverMethod(solverMethod: SolverMethod): void;
    /**
     * Method to solve the finite element problem synchronously
     * @param {SolveOptions} [options] - Additional parameters for the solver, such as `maxIterations` and `tolerance`
     * @returns {SolveResult} An object containing the solution vector (Float64Array, the same for every solver method) and mesh information.
     *  Models with more than one unknown per node (creeping flow, Euler-Bernoulli beam) also return `fields`, an object of
     *  named nodal fields (one value per mesh node) that can be plotted directly, e.g. `plotSolution(model, result, "contour", id, { field: "u" })`.
     *  Every result has `info`, the run report: `{ method, converged, iterations, residual, newton, solveTime }`, where
     *  `iterations` are those of the linear solver (null for the direct solvers), `residual` is ‖R − J u‖₂ / ‖R‖₂ of
     *  the linear system (null for the frontal solver and for nonlinear models), `newton` is `{ iterations, increment }` for nonlinear
     *  models (null otherwise), and `solveTime` is the time of the whole solve in milliseconds
     */
    solve(options?: SolveOptions): SolveResult;
    /**
     * Method to solve the finite element problem asynchronously
     * @param {object | null} [computeEngine] - An initialized WebGPU compute engine to reuse across solves; when omitted
     *  or null, a temporary one is created for this solve and terminated afterwards. A provided engine is not
     *  terminated, so the caller remains responsible for it
     * @param {SolveOptions} [options] - Additional parameters for the solver, such as `maxIterations` and `tolerance`
     * @returns {Promise<SolveResult>} A promise that resolves to an object containing the solution vector (Float64Array), the
     *  coordinates of the mesh nodes, and the run report `info` (as for solve)
     */
    solveAsync(computeEngine?: object | null, options?: SolveOptions): Promise<SolveResult>;
}
import type { ModelName } from "./types.js";
import type { SolverMethod } from "./types.js";
import type { ModelOptions } from "./types.js";
import type { Geometry } from "./types.js";
import type { MeshConfig } from "./types.js";
import type { Mesh } from "./types.js";
import type { SolverOptions } from "./types.js";
import type { BoundaryCondition } from "./types.js";
import type { ArrayBoundaryCondition } from "./types.js";
import type { SolveOptions } from "./types.js";
import type { SolveResult } from "./types.js";
