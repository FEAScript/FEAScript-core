/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * The name of a physical model. The names of FEAScript 0.3, with the "Script" suffix, still work with a warning
 */
export type ModelName = "heatConduction" | "generalFormPDE" | "frontPropagation" | "creepingFlow" | "eulerBernoulliBeam" | "heatConductionScript" | "generalFormPDEScript" | "frontPropagationScript" | "creepingFlowScript" | "eulerBernoulliBeamScript";
/**
 * A coefficient of the equation: a constant, or a function of the position evaluated at every integration point,
 * `(x) => ...` in 1D and `(x, y) => ...` in 2D. The nonlinear general form PDE also passes the solution,
 * `(x, u) => ...`. Which coefficients may be constants is said on each model page
 */
export type Coefficient = number | ((...values: number[]) => number);
/**
 * The coefficients of a model, by name: thermalConductivity and heatSource (heat conduction), A, B, C, D and dDdu
 * (general form PDE), viscosity (creeping flow), EI, c0 and q (Euler-Bernoulli beam)
 */
export type CoefficientFunctions = Record<string, Coefficient>;
/**
 * A linear solver method. "jacobi-gpu" runs with solveAsync()
 */
export type SolverMethod = "lusolve" | "jacobi" | "frontal" | "jacobi-gpu";
/**
 * The linear solver options, the `solver` option of setModelConfig
 */
export type SolverOptions = {
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
};
/**
 * The options of setModelConfig
 */
export type ModelOptions = {
    /**
     * - The coefficients of the equation
     */
    coefficientFunctions?: CoefficientFunctions | undefined;
    /**
     * - Solve the general form PDE with the Newton-Raphson method (default false)
     */
    nonlinear?: boolean | undefined;
    /**
     * - The linear solver
     */
    solver?: SolverOptions | undefined;
    /**
     * - Iteration limit of Newton-Raphson, and of the linear solver when `solver`
     * does not set it
     */
    maxIterations?: number | undefined;
    /**
     * - Tolerance of Newton-Raphson, and of the linear solver when `solver` does not
     * set it
     */
    tolerance?: number | undefined;
};
/**
 * A point [x, y]
 */
export type Point = [number, number];
/**
 * One boundary of a path: it runs from where the previous one ended to `to`, a point or a polyline. The last
 * boundary may leave out `to`, to close the shape back to the start
 */
export type PathBoundary = {
    /**
     * - The name of the boundary, used as the key of its boundary condition
     */
    name: string;
    /**
     * - The end point, or the points of a polyline
     */
    to?: Point | Point[] | undefined;
};
/**
 * A polygon: a path of named boundaries, a polygon with one name, or a plain list of points
 */
export type Polygon = {
    start: Point;
    boundaries: PathBoundary[];
} | {
    name: string;
    points: Point[];
} | Point[];
/**
 * The domain of setGeometry: a line, a rectangle, or a polygon with holes
 */
export type Geometry = {
    line: number;
} | {
    rectangle: [number, number];
    holes?: Polygon[];
    points?: Point[];
} | {
    shape: Polygon;
    holes?: Polygon[];
    points?: Point[];
};
/**
 * How setMeshConfig meshes the geometry
 */
export type MeshConfig = {
    /**
     * - The element shape (default "quadrilaterals")
     */
    elements?: "quadrilaterals" | "triangles" | undefined;
    /**
     * - The element order (default "linear")
     */
    elementOrder?: "linear" | "quadratic" | undefined;
    /**
     * - The length of an element side; for triangles
     * also a function of position
     */
    size?: number | ((x: number, y: number) => number) | undefined;
    /**
     * - Instead of size: the number of elements of a line, or
     * [nx, ny] of a quadrilateral
     */
    divisions?: number | [number, number] | undefined;
    /**
     * - Triangles: the smallest angle of the elements, in degrees (default 20)
     */
    minAngle?: number | undefined;
    /**
     * - Triangles: the limit on the number of vertices (default 100000)
     */
    maxNodes?: number | undefined;
    /**
     * - Deprecated mesh setting of FEAScript 0.3; use setGeometry
     */
    meshDimension?: "1D" | "2D" | undefined;
    /**
     * - Deprecated mesh setting of FEAScript 0.3; use divisions
     */
    numElementsX?: number | undefined;
    /**
     * - Deprecated mesh setting of FEAScript 0.3; use setGeometry
     */
    maxX?: number | undefined;
    /**
     * - Deprecated mesh setting of FEAScript 0.3; use divisions
     */
    numElementsY?: number | undefined;
    /**
     * - Deprecated mesh setting of FEAScript 0.3; use setGeometry
     */
    maxY?: number | undefined;
    /**
     * - Deprecated mesh setting of FEAScript 0.3; use a shape
     */
    angleLeft?: number | undefined;
    /**
     * - Deprecated mesh setting of FEAScript 0.3; use a shape
     */
    angleRight?: number | undefined;
    /**
     * - Deprecated mesh setting of FEAScript 0.3; use setMesh
     */
    parsedMesh?: Mesh | undefined;
};
/**
 * A mesh, as returned by importGmshMesh, generateTriangleMesh, generateQuadrilateralMesh and getMesh, and taken
 * by setMesh. The properties listed are those for reading the mesh; the other ones are used by FEAScript
 */
export type Mesh = {
    /**
     * - The x coordinates of the nodes
     */
    nodesXCoordinates: ArrayLike<number>;
    /**
     * - The y coordinates of the nodes (2D meshes)
     */
    nodesYCoordinates?: ArrayLike<number> | undefined;
    /**
     * - The dimension of the mesh
     */
    meshDimension?: "1D" | "2D" | undefined;
    /**
     * - The element order
     */
    elementOrder?: "linear" | "quadratic" | undefined;
    /**
     * - The element shape
     */
    elementShape?: string | undefined;
};
/**
 * A boundary condition, as a type and its named parameters
 */
export type BoundaryCondition = {
    type: "constantTemperature";
    temperature: number;
} | {
    type: "convection";
    h: number;
    ambientTemperature: number;
} | {
    type: "symmetry";
} | {
    type: "constantValue";
    value: number;
} | {
    type: "zeroGradient";
} | {
    type: "constantVelocity";
    u: number;
    v: number;
} | {
    type: "stressFree";
} | {
    type: "fixed";
} | {
    type: "pinned";
} | {
    type: "rotationFixed";
} | {
    type: "deflection";
    deflection?: number;
} | {
    type: "rotation";
    rotation?: number;
} | {
    type: "force";
    force: number;
} | {
    type: "moment";
    moment: number;
} | {
    type: "spring";
    stiffness: number;
    referenceDeflection?: number;
};
/**
 * A boundary condition in the array form of FEAScript 0.3, e.g. ["convection", 1, 20]. Deprecated: use a
 * BoundaryCondition object
 */
export type ArrayBoundaryCondition = [string, ...number[]];
/**
 * The options of solve() and solveAsync(), which take precedence over those of setModelConfig for one solve
 */
export type SolveOptions = {
    /**
     * - Iteration limit of the iterative method in use
     */
    maxIterations?: number | undefined;
    /**
     * - Tolerance of the iterative method in use
     */
    tolerance?: number | undefined;
};
/**
 * The run report of a solve, `result.info`, with the same properties for every model and solver method
 */
export type RunReport = {
    /**
     * - The linear solver method used
     */
    method: SolverMethod;
    /**
     * - Always true: a solve that does not converge throws NOT_CONVERGED
     */
    converged: boolean;
    /**
     * - Iterations of the linear solver, summed over the Newton-Raphson
     * iterations; null for the direct solvers
     */
    iterations: number | null;
    /**
     * - ‖R − J u‖₂ / ‖R‖₂ of the linear system; null for the frontal solver and
     * for nonlinear models
     */
    residual: number | null;
    /**
     * - The Newton-Raphson iterations and the
     * norm of the last increment, for nonlinear models; null otherwise
     */
    newton: {
        iterations: number;
        increment: number;
    } | null;
    /**
     * - The time of the whole solve, in milliseconds
     */
    solveTime: number;
};
/**
 * The result of solve() and solveAsync()
 */
export type SolveResult = {
    /**
     * - The computed unknowns, in the order of the mesh nodes
     */
    solutionVector: Float64Array;
    /**
     * -
     * The coordinates of the mesh nodes
     */
    nodesCoordinates: {
        nodesXCoordinates: ArrayLike<number>;
        nodesYCoordinates?: ArrayLike<number>;
    };
    /**
     * - Named fields, one value per node, for models with more
     * than one unknown per node (creeping flow: velocityMagnitude, u, v, p; Euler-Bernoulli beam: w, theta)
     */
    fields?: Record<string, Float64Array<ArrayBufferLike>> | undefined;
    /**
     * - The run report
     */
    info: RunReport;
};
/**
 * The result of FEAScriptWorker.solve(): the result of solve(), with the model name and the mesh dimension
 */
export type WorkerSolveResult = SolveResult & {
    solverConfig: string;
    meshDimension: "1D" | "2D" | null;
};
/**
 * The model information of FEAScriptWorker.getModelInfo(), which the plot functions take in place of the model
 */
export type ModelInfo = {
    /**
     * - The model name
     */
    solverConfig: string;
    /**
     * - The geometry
     */
    geometry?: Geometry | null | undefined;
    /**
     * - The mesh configuration
     */
    meshConfig?: MeshConfig | null | undefined;
    /**
     * - The mesh (null before a solve, unless set with setMesh)
     */
    mesh?: Mesh | null | undefined;
    /**
     * - The mesh dimension
     */
    meshDimension?: "1D" | "2D" | null | undefined;
    /**
     * - The boundary conditions
     */
    boundaryConditions?: object | undefined;
    /**
     * - The linear solver method
     */
    solverMethod?: SolverMethod | undefined;
};
/**
 * A model to plot: the model itself, or its information from a worker
 */
export type PlotModel = import("./FEAScript.js").FEAScriptModel | ModelInfo;
/**
 * A result to plot: the result of solve(), solveAsync() or FEAScriptWorker.solve(), or an object with its
 * solution vector and node coordinates
 */
export type PlotResult = Pick<SolveResult, "solutionVector" | "nodesCoordinates"> & {
    fields?: Record<string, Float64Array>;
};
/**
 * The code of a FEAScriptError
 */
export type ErrorCode = "INVALID_INPUT" | "UNSUPPORTED_MESH" | "MESH_TOO_FINE" | "UNSUPPORTED_SOLVER" | "NOT_CONVERGED" | "SINGULAR_MATRIX" | "NON_FINITE_VALUES" | "INTERNAL_ERROR";
