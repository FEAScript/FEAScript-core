/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Types of the public API, written as JSDoc so that the TypeScript declarations (dist/types/) are generated from
 * the source (npm run build:types). This module has no runtime code: index.js re-exports it, so the types can be
 * imported from the package, e.g. `import type { SolveResult } from "feascript"`
 */

// ─── Models ───────────────────────────────────────────────────────

/**
 * The name of a physical model. The names of FEAScript 0.3, with the "Script" suffix, still work with a warning
 * @typedef {"heatConduction" | "generalFormPDE" | "frontPropagation" | "creepingFlow" | "eulerBernoulliBeam"
 *  | "heatConductionScript" | "generalFormPDEScript" | "frontPropagationScript" | "creepingFlowScript"
 *  | "eulerBernoulliBeamScript"} ModelName
 */

/**
 * A coefficient of the equation: a constant, or a function of the position evaluated at every integration point,
 * `(x) => ...` in 1D and `(x, y) => ...` in 2D. The nonlinear general form PDE also passes the solution,
 * `(x, u) => ...`. Which coefficients may be constants is said on each model page
 * @typedef {number | ((...values: number[]) => number)} Coefficient
 */

/**
 * The coefficients of a model, by name: thermalConductivity and heatSource (heat conduction), A, B, C, D and dDdu
 * (general form PDE), viscosity (creeping flow), EI, c0 and q (Euler-Bernoulli beam)
 * @typedef {Record<string, Coefficient>} CoefficientFunctions
 */

/**
 * A linear solver method. "jacobi-gpu" runs with solveAsync()
 * @typedef {"lusolve" | "jacobi" | "frontal" | "jacobi-gpu"} SolverMethod
 */

/**
 * The linear solver options, the `solver` option of setModelConfig
 * @typedef {object} SolverOptions
 * @property {SolverMethod} [method] - The linear solver method (default "lusolve")
 * @property {number} [maxIterations] - Iteration limit of the iterative linear solvers
 * @property {number} [tolerance] - Tolerance of the iterative linear solvers, on the residual relative to the
 *  right-hand side
 */

/**
 * The options of setModelConfig
 * @typedef {object} ModelOptions
 * @property {CoefficientFunctions} [coefficientFunctions] - The coefficients of the equation
 * @property {boolean} [nonlinear] - Solve the general form PDE with the Newton-Raphson method (default false)
 * @property {SolverOptions} [solver] - The linear solver
 * @property {number} [maxIterations] - Iteration limit of Newton-Raphson, and of the linear solver when `solver`
 *  does not set it
 * @property {number} [tolerance] - Tolerance of Newton-Raphson, and of the linear solver when `solver` does not
 *  set it
 */

// ─── Geometry and mesh ────────────────────────────────────────────

/**
 * A point [x, y]
 * @typedef {[number, number]} Point
 */

/**
 * One boundary of a path: it runs from where the previous one ended to `to`, a point or a polyline. The last
 * boundary may leave out `to`, to close the shape back to the start
 * @typedef {object} PathBoundary
 * @property {string} name - The name of the boundary, used as the key of its boundary condition
 * @property {Point | Point[]} [to] - The end point, or the points of a polyline
 */

/**
 * A polygon: a path of named boundaries, a polygon with one name, or a plain list of points
 * @typedef {{ start: Point, boundaries: PathBoundary[] } | { name: string, points: Point[] } | Point[]} Polygon
 */

/**
 * The domain of setGeometry: a line, a rectangle, or a polygon with holes
 * @typedef {{ line: number }
 *  | { rectangle: [number, number], holes?: Polygon[], points?: Point[] }
 *  | { shape: Polygon, holes?: Polygon[], points?: Point[] }} Geometry
 */

/**
 * How setMeshConfig meshes the geometry
 * @typedef {object} MeshConfig
 * @property {"quadrilaterals" | "triangles"} [elements] - The element shape (default "quadrilaterals")
 * @property {"linear" | "quadratic"} [elementOrder] - The element order (default "linear")
 * @property {number | ((x: number, y: number) => number)} [size] - The length of an element side; for triangles
 *  also a function of position
 * @property {number | [number, number]} [divisions] - Instead of size: the number of elements of a line, or
 *  [nx, ny] of a quadrilateral
 * @property {number} [minAngle] - Triangles: the smallest angle of the elements, in degrees (default 20)
 * @property {number} [maxNodes] - Triangles: the limit on the number of vertices (default 100000)
 * @property {"1D" | "2D"} [meshDimension] - Deprecated mesh setting of FEAScript 0.3; use setGeometry
 * @property {number} [numElementsX] - Deprecated mesh setting of FEAScript 0.3; use divisions
 * @property {number} [maxX] - Deprecated mesh setting of FEAScript 0.3; use setGeometry
 * @property {number} [numElementsY] - Deprecated mesh setting of FEAScript 0.3; use divisions
 * @property {number} [maxY] - Deprecated mesh setting of FEAScript 0.3; use setGeometry
 * @property {number} [angleLeft] - Deprecated mesh setting of FEAScript 0.3; use a shape
 * @property {number} [angleRight] - Deprecated mesh setting of FEAScript 0.3; use a shape
 * @property {Mesh} [parsedMesh] - Deprecated mesh setting of FEAScript 0.3; use setMesh
 */

/**
 * A mesh, as returned by importGmshMesh, generateTriangleMesh, generateQuadrilateralMesh and getMesh, and taken
 * by setMesh. The properties listed are those for reading the mesh; the other ones are used by FEAScript
 * @typedef {object} Mesh
 * @property {ArrayLike<number>} nodesXCoordinates - The x coordinates of the nodes
 * @property {ArrayLike<number>} [nodesYCoordinates] - The y coordinates of the nodes (2D meshes)
 * @property {"1D" | "2D"} [meshDimension] - The dimension of the mesh
 * @property {"linear" | "quadratic"} [elementOrder] - The element order
 * @property {string} [elementShape] - The element shape
 */

// ─── Boundary conditions ──────────────────────────────────────────

/**
 * A boundary condition, as a type and its named parameters
 * @typedef {{ type: "constantTemperature", temperature: number }
 *  | { type: "convection", h: number, ambientTemperature: number }
 *  | { type: "symmetry" }
 *  | { type: "constantValue", value: number }
 *  | { type: "zeroGradient" }
 *  | { type: "constantVelocity", u: number, v: number }
 *  | { type: "stressFree" }
 *  | { type: "fixed" }
 *  | { type: "pinned" }
 *  | { type: "rotationFixed" }
 *  | { type: "deflection", deflection?: number }
 *  | { type: "rotation", rotation?: number }
 *  | { type: "force", force: number }
 *  | { type: "moment", moment: number }
 *  | { type: "spring", stiffness: number, referenceDeflection?: number }} BoundaryCondition
 */

/**
 * A boundary condition in the array form of FEAScript 0.3, e.g. ["convection", 1, 20]. Deprecated: use a
 * BoundaryCondition object
 * @typedef {[string, ...number[]]} ArrayBoundaryCondition
 */

// ─── Results ──────────────────────────────────────────────────────

/**
 * The options of solve() and solveAsync(), which take precedence over those of setModelConfig for one solve
 * @typedef {object} SolveOptions
 * @property {number} [maxIterations] - Iteration limit of the iterative method in use
 * @property {number} [tolerance] - Tolerance of the iterative method in use
 */

/**
 * The run report of a solve, `result.info`, with the same properties for every model and solver method
 * @typedef {object} RunReport
 * @property {SolverMethod} method - The linear solver method used
 * @property {boolean} converged - Always true: a solve that does not converge throws NOT_CONVERGED
 * @property {number | null} iterations - Iterations of the linear solver, summed over the Newton-Raphson
 *  iterations; null for the direct solvers
 * @property {number | null} residual - ‖R − J u‖₂ / ‖R‖₂ of the linear system; null for the frontal solver and
 *  for nonlinear models
 * @property {{ iterations: number, increment: number } | null} newton - The Newton-Raphson iterations and the
 *  norm of the last increment, for nonlinear models; null otherwise
 * @property {number} solveTime - The time of the whole solve, in milliseconds
 */

/**
 * The result of solve() and solveAsync()
 * @typedef {object} SolveResult
 * @property {Float64Array} solutionVector - The computed unknowns, in the order of the mesh nodes
 * @property {{ nodesXCoordinates: ArrayLike<number>, nodesYCoordinates?: ArrayLike<number> }} nodesCoordinates -
 *  The coordinates of the mesh nodes
 * @property {Record<string, Float64Array>} [fields] - Named fields, one value per node, for models with more
 *  than one unknown per node (creeping flow: velocityMagnitude, u, v, p; Euler-Bernoulli beam: w, theta)
 * @property {RunReport} info - The run report
 */

/**
 * The result of FEAScriptWorker.solve(): the result of solve(), with the model name and the mesh dimension
 * @typedef {SolveResult & { solverConfig: string, meshDimension: "1D" | "2D" | null }} WorkerSolveResult
 */

/**
 * The model information of FEAScriptWorker.getModelInfo(), which the plot functions take in place of the model
 * @typedef {object} ModelInfo
 * @property {string} solverConfig - The model name
 * @property {Geometry | null} [geometry] - The geometry
 * @property {MeshConfig | null} [meshConfig] - The mesh configuration
 * @property {Mesh | null} [mesh] - The mesh (null before a solve, unless set with setMesh)
 * @property {"1D" | "2D" | null} [meshDimension] - The mesh dimension
 * @property {object} [boundaryConditions] - The boundary conditions
 * @property {SolverMethod} [solverMethod] - The linear solver method
 */

/**
 * A model to plot: the model itself, or its information from a worker
 * @typedef {import("./FEAScript.js").FEAScriptModel | ModelInfo} PlotModel
 */

/**
 * A result to plot: the result of solve(), solveAsync() or FEAScriptWorker.solve(), or an object with its
 * solution vector and node coordinates
 * @typedef {Pick<SolveResult, "solutionVector" | "nodesCoordinates"> & { fields?: Record<string, Float64Array> }}
 *  PlotResult
 */

/**
 * The code of a FEAScriptError
 * @typedef {"INVALID_INPUT" | "UNSUPPORTED_MESH" | "MESH_TOO_FINE" | "UNSUPPORTED_SOLVER" | "NOT_CONVERGED"
 *  | "SINGULAR_MATRIX" | "NON_FINITE_VALUES" | "INTERNAL_ERROR"} ErrorCode
 */

export {};
