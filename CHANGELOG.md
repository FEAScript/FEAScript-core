# Changelog

All notable changes to FEAScript-core are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/) (while in 0.x, minor versions may contain breaking changes).

## [0.4.0] (RC)

### Added

- One way to set up a domain, whatever its mesh:
  `setGeometry()` takes the geometry, `{ line: length }`, `{ rectangle: [width, height] }` or
  `{ shape, holes, points }`, where a polygon is a path `{ start, boundaries: [{ name, to }] }` (each boundary runs
  from where the previous one ended to `to`, a point or a polyline, and the last may leave out `to` to close the
  shape), a polygon `{ name, points }` with one name, or a plain list of points; `setMeshConfig()` then takes how to mesh it, `{ elements, elementOrder,
  size, divisions, minAngle, maxNodes }`, with `elements: "quadrilaterals"` (a rectangle or a convex four-sided
  shape, mapped from a grid) or `"triangles"` (any shape with holes). The `size` is the length of an element side,
  for triangles also a function of position for a graded mesh; `divisions` is the number of elements of a line or
  `[nx, ny]` of a quadrilateral, for an exact element count. The boundary conditions are keyed by the boundary
  names: `"left"` and `"right"` for a line, `"bottom"`, `"right"`, `"top"` and `"left"` for a rectangle, the
  names given for a polygon, and the names of the physical groups for a Gmsh mesh
- `setMesh(mesh)` takes a mesh directly: one imported with `importGmshMesh`, or generated with
  `generateTriangleMesh(geometry, options)` or `generateQuadrilateralMesh(geometry, options)`, which are exported
  and return the same mesh object (nodes, elements, boundary element sides by name, aliases). The geometry
  checks (a polygon that is not simple, a hole outside the shape or inside another hole, a point outside the
  domain, a path that does not close) throw `FEAScriptError` `"INVALID_INPUT"` listing every problem
- `generateTriangleMesh()`, a mesh generator for a polygon with holes
  ([#135](https://github.com/FEAScript/FEAScript-core/issues/135)): a constrained Delaunay triangulation of the
  polygon (Delaunator and Constrainautor), refined by Ruppert's algorithm with off-centers until every triangle has
  angles of at least `minAngle` (default 20°) and an area of at most that of the equilateral triangle of side
  `size`, a number or a function of position for a graded mesh. Points inside the domain can be made nodes. Small
  input angles are handled with concentric shell splitting, so the refinement always stops. Linear or quadratic
  triangles. A refinement that passes `maxNodes` throws `FEAScriptError` `"MESH_TOO_FINE"`
- `generateQuadrilateralMesh()`: the structured mesh of 0.3, generalized to any convex four-sided shape by a
  bilinear map of the grid (a rectangle and the former skewed trapezoid are special cases), with linear or
  quadratic elements and the same node numbering as before
- `FEAScriptWorker` has `setGeometry()` and `setMesh()`, and its `setMeshConfig()` accepts a `size` function

- Benchmark tests for 2D heat conduction from the Code_Aster validation manual: TPLP302 (strip with a
  Fourier series solution) and TPLP01 (L-shaped domain with a re-entrant corner, on Gmsh triangle and
  quadrilateral meshes)

- `FEAScriptError`, with a `code`, is exported, and stops a solve that would otherwise return an empty or a wrong
  result ([#125](https://github.com/FEAScript/FEAScript-core/issues/125)). Its `details` list every problem found
  by one check, so that all the input mistakes are reported at once, like a compiler does. A `FEAScriptError`
  thrown in `FEAScriptWorker` keeps its `code` and `details`
- Input checks that were missing, so far ignored or left to fail later with a `TypeError` or a wrong result: a
  misspelled or unset model, a boundary condition on a boundary (or beam node) that is not in the mesh, a missing
  condition value or one that is not a number (e.g. `["constantTemperature"]` or `["constantTemperature", "5"]`), a
  missing coefficient function (`A`–`D` of the general form PDE, `dDdu` when nonlinear, `EI` of the beam), and a
  number of elements that is not a positive integer or a length that is not positive, and a coefficient that the
  model does not use, e.g. a misspelled `thermalConductivty` that would leave the default value in place
- A NaN or infinite value in the assembled system or in the solution throws `"NON_FINITE_VALUES"`. The sparse LU
  solver took a NaN on the right-hand side for a zero, so a coefficient function that returns NaN somewhere gave a
  finite but wrong solution
- The frontal solver runs the nonlinear general form PDE (`nonlinear: true`) inside Newton–Raphson
  ([#101](https://github.com/FEAScript/FEAScript-core/issues/101)), as it does front propagation. It stopped with
  `"UNSUPPORTED_SOLVER"` before
- Boundary conditions as objects with named parameters
  ([#123](https://github.com/FEAScript/FEAScript-core/issues/123)), e.g.
  `addBoundaryCondition("top", { type: "convection", h: 1, ambientTemperature: 20 })` instead of
  `["convection", 1, 20]`. The parameters of each type:
  - Heat conduction: `{ type: "constantTemperature", temperature }`,
    `{ type: "convection", h, ambientTemperature }` and `{ type: "symmetry" }`
  - General form PDE and front propagation: `{ type: "constantValue", value }` and `{ type: "zeroGradient" }`
  - Creeping flow: `{ type: "constantVelocity", u, v }` and `{ type: "stressFree" }`
  - Euler-Bernoulli beam, one object or a list of them per node: `{ type: "fixed" }`, `{ type: "pinned" }`,
    `{ type: "rotationFixed" }`, `{ type: "deflection", deflection }`, `{ type: "rotation", rotation }`,
    `{ type: "force", force }`, `{ type: "moment", moment }` and
    `{ type: "spring", stiffness, referenceDeflection }`. The deflection, the rotation and the reference
    deflection default to 0

  A condition object with no type, an unknown type, or a missing or unknown (e.g. misspelled) parameter throws
  `FEAScriptError` `"INVALID_INPUT"` when it is added, listing every problem. A value that is not a number is
  reported with the name of its parameter
- Solver options in `setModelConfig` ([#122](https://github.com/FEAScript/FEAScript-core/issues/122)):
  `setModelConfig("heatConduction", { solver: { method: "jacobi", maxIterations: 20000, tolerance: 1e-10 } })`.
  The `method` is `"lusolve"` (the default), `"jacobi"`, `"frontal"` or `"jacobi-gpu"` (with `solveAsync()`), and
  `maxIterations` and `tolerance` apply to the iterative linear solvers, also inside Newton-Raphson. The
  top-level `maxIterations` and `tolerance` of `setModelConfig` keep setting Newton-Raphson, and the linear solver
  when `solver` does not set them. An unknown method or option, or an iteration limit or tolerance that is not
  positive, throws `FEAScriptError` `"INVALID_INPUT"`. Preconditioners will be added as solver options with the
  PCG solver ([#115](https://github.com/FEAScript/FEAScript-core/issues/115),
  [#116](https://github.com/FEAScript/FEAScript-core/issues/116))
- `version`, the version of FEAScript as in its npm package, e.g. `"0.4.0"`
  ([#128](https://github.com/FEAScript/FEAScript-core/issues/128))
- A run report, `result.info`, from `solve()`, `solveAsync()` and `FEAScriptWorker.solve()`
  ([#127](https://github.com/FEAScript/FEAScript-core/issues/127)): `{ method, converged, iterations, residual,
  newton, solveTime }`, with the same properties for every model and solver method. `iterations` are those of the
  linear solver (`null` for the direct solvers), `residual` is ‖R − J u‖₂ / ‖R‖₂ of the linear system computed
  in 64-bit floats for every method (`null` for `"frontal"`, which assembles no system matrix, and for nonlinear
  models), `newton` is `{ iterations, increment }` for the nonlinear models, and `solveTime` is the time of the
  whole solve in milliseconds
- TypeScript declarations in the npm package ([#126](https://github.com/FEAScript/FEAScript-core/issues/126)),
  generated from the JSDoc of the source into `dist/types/` (`npm run build:types`, part of `npm run build`) and
  named by `types` in `package.json`. TypeScript projects are type-checked against the API, and editors complete
  the model names, solver methods, geometry and mesh settings, boundary condition types with their parameters,
  and the result with its run report. The types of the inputs and results (`Geometry`, `MeshConfig`,
  `BoundaryCondition`, `SolveResult`, `RunReport`, ...) are exported for `import type`. A test type-checks a
  TypeScript use of the package against the declarations, and checks that they catch common mistakes

### Changed

- Model names without the `Script` suffix ([#124](https://github.com/FEAScript/FEAScript-core/issues/124)):
  `"heatConduction"`, `"generalFormPDE"`, `"frontPropagation"`, `"creepingFlow"` and `"eulerBernoulliBeam"`.
  `model.solverConfig`, and the `solverConfig` of a worker result, hold the new name also when the old one is
  given
- The example folders are named after the models, e.g. `examples/heatConduction/` instead of
  `examples/heatConductionScript/`. Links to the old folders on `main` no longer work; links to a release tag,
  such as `tree/0.3.1/examples/heatConductionScript`, still do

- A mesh imported with `importGmshMesh` is converted to the mesh object once, with its boundaries keyed by the
  names of the physical groups, and the boundary lines are matched to element sides through a lookup table
  instead of a search over all elements for each line
- A solve that cannot succeed now throws a `FEAScriptError` instead of logging an error and returning a result:
  `"UNSUPPORTED_SOLVER"` for a solver method the model does not support, such as the frontal solver for creeping
  flow or beams, and for anything `solveAsync()` cannot run, and `"NOT_CONVERGED"` for a Jacobi solve, a front
  propagation or a nonlinear general form PDE that does not converge, and `"SINGULAR_MATRIX"` for a singular system,
  where the frontal solver returned zeros and the LU solver failed with a `TypeError`. Code that read a partial
  result after such a failure must now catch the error
- The other input checks also throw a `FEAScriptError` instead of logging an error and going on
  ([#125](https://github.com/FEAScript/FEAScript-core/issues/125)): `"INVALID_INPUT"` for an unknown boundary
  condition type (it was ignored), a condition that is not an array, a mesh dimension other than 1D or 2D, and a
  negative creeping flow viscosity; `"UNSUPPORTED_MESH"` for a mesh the model or the Gmsh reader cannot use yet
  (creeping flow without quadratic 2D elements, a beam that is not on a linear 1D mesh, a 2D general form PDE, a
  Gmsh mesh that is not 2D or that mixes element orders or shapes); and `"INTERNAL_ERROR"` for a frontal solver
  step that fails, which returned a wrong solution. A condition on an imported Gmsh boundary with a node pair that
  is not on an element side throws `"INVALID_INPUT"`, as it would apply to only part of the boundary; such a
  boundary without a condition only gives a warning. Plots throw `"INVALID_INPUT"` for an unknown field and for a
  field requested from a result without named fields (they plotted another field), for a plot type they cannot
  draw (they drew nothing) and for a plot container that does not exist. A mesh setting that conflicts with an
  imported Gmsh mesh is a warning instead of an error, as the mesh value is used, and so is a vtk.js plot outside a
  browser
- Dirichlet conditions (constant temperature, value and velocity, beam supports) are applied symmetrically
  ([#117](https://github.com/FEAScript/FEAScript-core/issues/117)): the known values move to the right-hand side and
  the columns of the prescribed nodes are eliminated as well as their rows, so a symmetric system matrix stays
  symmetric. The solution is the same, and the frontal solver is not affected
- The Jacobi solver (`"jacobi"`) stops on the residual relative to the right-hand side, ‖R − J u‖ / ‖R‖, instead
  of on the size of the update, and its default `tolerance` is `1e-8`. The update size could be small while the
  solution was still about 1e-3 away, so the method reported convergence too early
- The WebGPU Jacobi solver (`"jacobi-gpu"`) stops on the same relative residual, ‖R − J u‖ / ‖R‖, as `"jacobi"`
  ([#113](https://github.com/FEAScript/FEAScript-core/issues/113)), instead of on the largest absolute residual,
  which depended on the scale of the problem (e.g. on fixed temperatures of 200 °C). Its default `tolerance` stays
  `1e-4`: the GPU works in 32-bit floats, where the relative residual stops falling at about 1e-7 to 1e-5,
  depending on the size of the system
- A WebGPU compute engine reused for systems of different sizes (`solveAsync(computeEngine)`) kept running its
  kernels on the fields of the first system, and returned a wrong solution as converged. The kernels are now
  compiled again when the system size changes
- The sparse LU solver imports only the math.js functions it uses (`slu`, `lusolve`, `flatten`, `SparseMatrix`)
  instead of the whole library. This makes the bundles in `dist/` about 60% smaller, e.g. `feascript.esm.js`
  goes from 730 KB to 308 KB
- The system matrix is assembled directly into compressed sparse row (CSR) storage with typed arrays
  ([#120](https://github.com/FEAScript/FEAScript-core/issues/120)). The sparsity pattern is computed once from the
  element connectivity, and element contributions are added at fixed positions, instead of growing a `Map` per
  row. Assembly of the 2D fin on a 320×160 mesh (51,681 nodes) takes about 0.1 s, and the peak memory of a
  `"lusolve"` solve falls from 375 MB to 355 MB (one core of an AMD Ryzen 5 9600X). `SparseMatrix` keeps its
  methods; entries outside the pattern are still accepted
- `"lusolve"` uses a fill-reducing ordering suited to each model
  ([#132](https://github.com/FEAScript/FEAScript-core/issues/132)). Creeping flow, whose saddle-point matrix has
  zeros on the diagonal of its pressure rows, is now factorized with an approximate minimum degree ordering of
  JᵀJ and a pivoting threshold of 0.001, which halves the fill-in of the LU decomposition. The other models keep
  the ordering of J + Jᵀ with partial pivoting, which is the faster one for them. On one core of an AMD Ryzen 5
  9600X, together with the CSR assembly, the lid-driven cavity on a 64×64 mesh (16,641 nodes) solves in 10 s
  instead of 145 s, with a peak memory of 0.73 GB instead of 1.26 GB. The ordering and the threshold can be
  passed to `mathjsLUSolver` (`ordering`, `pivotThreshold`)

### Deprecated

- `setMeshConfig({ meshDimension, numElementsX, maxX, numElementsY, maxY, angleLeft, angleRight })`: use
  `setGeometry()` with `{ line }`, `{ rectangle }` or a four-point shape, and `setMeshConfig({ elements,
  elementOrder, divisions })`. The old form keeps working with a warning, and is removed in 0.7.0 at the earliest
- `setMeshConfig({ parsedMesh })`: use `setMesh(mesh)`
- The numeric boundary keys: `"0"` to `"3"` of the structured meshes (bottom, left, top, right), `"0"` and `"1"`
  of 1D meshes (left, right), and the Gmsh physical tag minus one. They keep working as aliases of the boundary
  names, with a warning
- The model names with the `Script` suffix, e.g. `"heatConductionScript"`: use `"heatConduction"`
  ([#124](https://github.com/FEAScript/FEAScript-core/issues/124)). They keep working with a warning
- The array form of boundary conditions, e.g. `["convection", 1, 20]`, and conditions given as a plain string, e.g.
  `"zeroGradient"`: use the condition objects ([#123](https://github.com/FEAScript/FEAScript-core/issues/123)). They
  keep working, with a warning that gives the object form of the condition
- `setSolverMethod(method)` of `FEAScriptModel` and `FEAScriptWorker`: use
  `setModelConfig(model, { solver: { method } })` ([#122](https://github.com/FEAScript/FEAScript-core/issues/122)).
  It keeps working with a warning
- Model information in the form of 0.3 passed to the plot functions, with the mesh settings (`meshDimension`,
  `numElementsX`, ...) or an imported mesh (`parsedMesh`) in `meshConfig`: pass the model itself, the information
  of `FEAScriptWorker.getModelInfo()`, or `{ solverConfig, mesh }`. It keeps working with a warning
- `printVersion`: use `version` ([#128](https://github.com/FEAScript/FEAScript-core/issues/128)). `printVersion`
  is a string, so reading it cannot log a warning; it is marked `@deprecated` for editors, and keeps its value
  `"0.4.0 (RC)"` until it is removed

### Removed

- The `"constantTemp"` boundary condition, deprecated in 0.3.0
  ([#129](https://github.com/FEAScript/FEAScript-core/issues/129)): use
  `{ type: "constantTemperature", temperature }`. It now throws `FEAScriptError` `"INVALID_INPUT"`, with a message
  that names its replacement
- The NAFEMS T4 Node.js example: the benchmark is covered by its test
  (`tests/verification/benchmark/heatConduction2DNafemsT4`) and by the verification pages of the documentation

### Fixed

- `FEAScriptWorker` starts its first call as soon as the worker is ready. It checked once a second, so every new
  worker added up to a second before the first result. A worker that fails to start now reports the failure to the
  waiting call straight away, instead of after the 50 s timeout
- Frontal solver memory and run time on medium-sized problems
  ([#121](https://github.com/FEAScript/FEAScript-core/issues/121)):
  - The front was allocated with the size of the whole system (N × N), and the solver eliminated at most one node
    per assembled element, so the front kept growing. It now eliminates every fully summed node before assembling
    the next element. It sizes the front from its maximum width, computed in a prefront pass, and stores it in
    typed arrays.
  - The unused determinant bookkeeping, which cost O(N) per pivot, is removed.
  - The elements are assembled in the order that keeps the front narrowest: the solver compares the order of
    the mesh, sweeps along x and y, and a breadth-first order through neighboring elements, and keeps the one
    with the smallest maximum front width. On one core of an AMD Ryzen 5 9600X, a 32×320 quadratic strip solves
    in 0.5 s instead of 16.7 s, with a third of the memory, and the L-shaped Gmsh mesh of the TPLP01 test 2.4×
    faster. Structured meshes numbered across their short side are unchanged.
  - Results on one core of an Intel N100:
    - 80×40 quadratic mesh (13k nodes): previously ran out of memory, now solves in 0.9 s.
    - 160×80 linear mesh (13k nodes): 31 s → 1.1 s.
- Creeping flow with velocity conditions on every boundary: at a node shared by a moving wall and a fixed wall,
  the condition applied last won, so one corner of a moving lid leaked fluid through a side wall. With the
  pressure fixed at one node, this gave a spurious flow near that node. Zero-velocity (no-slip) conditions now
  take precedence at shared nodes, and the lid-driven cavity is now mirror-symmetric
- Sparse LU (`lusolve`) speed ([#136](https://github.com/FEAScript/FEAScript-core/issues/136)). The inner loop of
  the mathjs sparse LU called mathjs's generic divide, multiply and subtract functions for every entry. The bundles
  now use plain arithmetic there, with the same solution bit for bit:
  - In Node.js and Chromium, every solve after the first in a process, including every Newton-Raphson iteration
    after the first, ran 2 to 3 times slower than the first, because V8 stopped inlining those functions. Every
    solve now runs at the speed of the first.
  - In Firefox, every solve was slow. It is now 3 to 12 times faster.
  - On one core of an AMD Ryzen 5 9600X:

    | Case | Before | After |
    |---|---|---|
    | Lid-driven cavity 64×64, repeated solve in Node.js | 26.4 s | 8.7 s |
    | Lid-driven cavity 64×64, repeated solve in Chromium | 21.9 s | 7.4 s |
    | Lid-driven cavity 64×64, first solve in Firefox | 217.6 s | 18.1 s |
    | Heat conduction, 51,681 nodes, first solve in Firefox | 21.0 s | 3.9 s |
    | Heat conduction, Gmsh quadratic triangles, first solve in Firefox | 60.3 s | 6.9 s |

    First solves in Node.js and Chromium are unchanged or slightly faster.
  - Loading FEAScript from `src/` with mathjs from npm keeps the old speed until mathjs fixes it
    ([josdejong/mathjs#3792](https://github.com/josdejong/mathjs/issues/3792))
- Contour plot values in quadratic elements with curved edges, such as the elements along the hole of the homepage
  fin example ([#134](https://github.com/FEAScript/FEAScript-core/issues/134)). `plotInterpolatedSolution` and the
  VTK plot located a grid point in a 9-node quadrilateral by inverting the bilinear map of its four corners, and in
  a 6-node triangle by the barycentric coordinates of its three vertices, then evaluated the quadratic basis
  functions at that point. Where the edges are curved, the two maps differ, and the plotted values were off by up
  to 0.25 for a field of range about 10. Quadratic elements are now located by inverting their full isoparametric
  map with Newton's method; linear elements are unchanged. The solution itself was not affected

## [0.3.1] - 2026-10-30

### Fixed

- The FEAScript icon at the start of the README showed at full size on npmjs.com, which ignores the
  `style` attribute; it now has a fixed width and height

## [0.3.0] - 2026-10-30

### Added

- Triangular elements (linear and quadratic), including triangular meshes imported from Gmsh ([#97](https://github.com/FEAScript/FEAScript-core/issues/97))
- Euler–Bernoulli beam model (`eulerBernoulliBeamScript`) with cubic Hermite elements and fixed, pinned,
  spring, force and moment conditions ([#86](https://github.com/FEAScript/FEAScript-core/issues/86))
- Viscosity in the creeping flow model: `coefficientFunctions: { viscosity }`, a number or a function of
  (x, y) ([#102](https://github.com/FEAScript/FEAScript-core/issues/102))
- Named result fields for models with several unknowns per node: `solve()` returns `fields`
  (`velocityMagnitude`, `u`, `v`, `p` for creeping flow; `w`, `theta` for the beam), and the plotting
  functions take a `{ field }` option ([#106](https://github.com/FEAScript/FEAScript-core/issues/106))
- Nonlinear 1D problems with the Newton–Raphson method in the general form PDE ([#90](https://github.com/FEAScript/FEAScript-core/issues/90))
- Spatially varying coefficients: `thermalConductivity` and `heatSource` as functions of position ([#92](https://github.com/FEAScript/FEAScript-core/issues/92))
- 1D front propagation
- Frontal solver for every model that supports it, including the linear general form PDE ([#100](https://github.com/FEAScript/FEAScript-core/issues/100))
- vtk.js visualization (`plotSolutionVtk`, `plotInterpolatedSolutionVtk`) and VTK/VTP export ([#73](https://github.com/FEAScript/FEAScript-core/issues/73), [#79](https://github.com/FEAScript/FEAScript-core/issues/79))
- `FEAScriptWorker` takes the same model options as `FEAScriptModel`, so every model can run in a web
  worker ([#107](https://github.com/FEAScript/FEAScript-core/issues/107))
- Gmsh import detects the mesh dimension and element order
- Input validation for solvers and boundary conditions ([#83](https://github.com/FEAScript/FEAScript-core/issues/83))
- Regression, analytical and benchmark tests (including NAFEMS T4), run with `npm test` on Node.js 18
  and later
- Node.js examples for the NAFEMS T4 benchmark, Couette flow and a cantilever beam

### Changed

- Sparse matrix format during assembly ([#99](https://github.com/FEAScript/FEAScript-core/issues/99))
- BLAS routines from stdlib ([#81](https://github.com/FEAScript/FEAScript-core/issues/81))
- Linear elements use a 2-point Gauss rule per direction (2 × 2 on quadrilaterals) instead of 1 point,
  so linear quadrilaterals no longer under-integrate the stiffness matrix; results on linear elements
  change slightly ([#105](https://github.com/FEAScript/FEAScript-core/issues/105))
- Every solver returns the solution vector as a `Float64Array`
- The CommonJS build is `dist/feascript.cjs` (was `dist/feascript.cjs.js`), so `require("feascript")`
  works ([#112](https://github.com/FEAScript/FEAScript-core/issues/112))
- Source files are reorganized and lose the `Script` suffix ([#80](https://github.com/FEAScript/FEAScript-core/issues/80), [#94](https://github.com/FEAScript/FEAScript-core/issues/94))

### Deprecated

- The `"constantTemp"` boundary condition; use `"constantTemperature"`

### Removed

- `setSolverConfig`; use `setModelConfig` ([#73](https://github.com/FEAScript/FEAScript-core/issues/73))
- `importGmshQuadTri`; use `importGmshMesh` ([#80](https://github.com/FEAScript/FEAScript-core/issues/80))
- The private `_creepingFlowMetadata` and `_eulerBernoulliBeamMetadata` properties; use `result.fields`
  ([#106](https://github.com/FEAScript/FEAScript-core/issues/106))

### Fixed

- 1D convection and nonzero front values
- Non-contiguous node tags in the Gmsh reader ([#96](https://github.com/FEAScript/FEAScript-core/issues/96))

## [0.2.0] - 2026-02-25

### Added

- Creeping (Stokes) flow model (`creepingFlowScript`) with Taylor–Hood elements ([#63](https://github.com/FEAScript/FEAScript-core/issues/63))
- WebGPU Jacobi solver ([#53](https://github.com/FEAScript/FEAScript-core/issues/53))
- Arbitrary geometries from Gmsh meshes ([#58](https://github.com/FEAScript/FEAScript-core/issues/58), [#59](https://github.com/FEAScript/FEAScript-core/issues/59))
- Skewed structured 2D meshes (`angleLeft`, `angleRight`) ([#60](https://github.com/FEAScript/FEAScript-core/issues/60))
- `plotInterpolatedSolution`

### Changed

- Solvers consolidated behind a single interface ([#56](https://github.com/FEAScript/FEAScript-core/issues/56))
- `setModelConfig` replaces `setSolverConfig`, which is deprecated

## [0.1.3] - 2025-10-08

### Added

- General form PDE model (`generalFormPDEScript`) ([#48](https://github.com/FEAScript/FEAScript-core/issues/48))
- Frontal solver ([#40](https://github.com/FEAScript/FEAScript-core/issues/40), [#43](https://github.com/FEAScript/FEAScript-core/issues/43))
- 1D PDE solver ([#42](https://github.com/FEAScript/FEAScript-core/issues/42))
- `printVersion` ([#45](https://github.com/FEAScript/FEAScript-core/issues/45))
- Automated tests on pull requests ([#44](https://github.com/FEAScript/FEAScript-core/issues/44))

### Changed

- `solidHeatTransferScript` is renamed to `heatConductionScript` ([#47](https://github.com/FEAScript/FEAScript-core/issues/47))

### Fixed

- Signs of the advection and reaction terms in the general form PDE

## [0.1.2] - 2025-07-31

### Added

- Front propagation model (`frontPropagationScript`) for the eikonal equation ([#29](https://github.com/FEAScript/FEAScript-core/issues/29))
- Solidification front example ([#30](https://github.com/FEAScript/FEAScript-core/issues/30))

## [0.1.1] - 2025-05-22

### Added

- First build published to npm ([#25](https://github.com/FEAScript/FEAScript-core/issues/25))

## [0.1.0] - 2025-05-15

- Initial release: steady heat conduction in 1D and 2D (`solidHeatTransferScript`), structured meshes and
  Gmsh import, Jacobi and LU solvers, Plotly plotting, and a web worker (`FEAScriptWorker`)

[0.4.0]: https://github.com/FEAScript/FEAScript-core/compare/0.3.1...HEAD
[0.3.1]: https://github.com/FEAScript/FEAScript-core/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/FEAScript/FEAScript-core/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/FEAScript/FEAScript-core/compare/0.1.3...0.2.0
[0.1.3]: https://github.com/FEAScript/FEAScript-core/compare/0.1.2...0.1.3
[0.1.2]: https://github.com/FEAScript/FEAScript-core/compare/0.1.1...0.1.2
[0.1.1]: https://github.com/FEAScript/FEAScript-core/compare/0.1.0...0.1.1
[0.1.0]: https://github.com/FEAScript/FEAScript-core/releases/tag/0.1.0
