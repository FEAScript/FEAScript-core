# Changelog

All notable changes to FEAScript-core are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/) (while in 0.x, minor versions may contain breaking changes).

## [0.3.0] - 2026-10-30

### Added

- Triangular elements (linear and quadratic), including triangular meshes imported from Gmsh (#97)
- Euler–Bernoulli beam model (`eulerBernoulliBeamScript`) with cubic Hermite elements and fixed, pinned,
  spring, force and moment conditions (#86)
- Viscosity in the creeping flow model: `coefficientFunctions: { viscosity }`, a number or a function of
  (x, y) (#102)
- Named result fields for models with several unknowns per node: `solve()` returns `fields`
  (`velocityMagnitude`, `u`, `v`, `p` for creeping flow; `w`, `theta` for the beam), and the plotting
  functions take a `{ field }` option (#106)
- Nonlinear 1D problems with the Newton–Raphson method in the general form PDE (#90)
- Spatially varying coefficients: `thermalConductivity` and `heatSource` as functions of position (#92)
- 1D front propagation
- Frontal solver for every model that supports it, including the linear general form PDE (#100)
- vtk.js visualization (`plotSolutionVtk`, `plotInterpolatedSolutionVtk`) and VTK/VTP export (#73, #79)
- `FEAScriptWorker` takes the same model options as `FEAScriptModel`, so every model can run in a web
  worker (#107)
- Gmsh import detects the mesh dimension and element order
- Input validation for solvers and boundary conditions (#83)
- Regression, analytical and benchmark tests (including NAFEMS T4), run with `npm test` on Node.js 18
  and later
- Node.js examples for the NAFEMS T4 benchmark, Couette flow and a cantilever beam

### Changed

- Sparse matrix format during assembly (#99)
- BLAS routines from stdlib (#81)
- Linear elements use a 2-point Gauss rule per direction (2 × 2 on quadrilaterals) instead of 1 point,
  so linear quadrilaterals no longer under-integrate the stiffness matrix; results on linear elements
  change slightly (#105)
- Every solver returns the solution vector as a `Float64Array`
- The CommonJS build is `dist/feascript.cjs` (was `dist/feascript.cjs.js`), so `require("feascript")`
  works (#112)
- Source files are reorganized and lose the `Script` suffix (#80, #94)

### Deprecated

- The `"constantTemp"` boundary condition; use `"constantTemperature"`

### Removed

- `setSolverConfig`; use `setModelConfig` (#73)
- `importGmshQuadTri`; use `importGmshMesh` (#80)
- The private `_creepingFlowMetadata` and `_eulerBernoulliBeamMetadata` properties; use `result.fields`
  (#106)

### Fixed

- 1D convection and nonzero front values
- Non-contiguous node tags in the Gmsh reader (#96)

## [0.2.0] - 2026-02-25

### Added

- Creeping (Stokes) flow model (`creepingFlowScript`) with Taylor–Hood elements (#63)
- WebGPU Jacobi solver (#53)
- Arbitrary geometries from Gmsh meshes (#58, #59)
- Skewed structured 2D meshes (`angleLeft`, `angleRight`) (#60)
- `plotInterpolatedSolution`

### Changed

- Solvers consolidated behind a single interface (#56)
- `setModelConfig` replaces `setSolverConfig`, which is deprecated

## [0.1.3] - 2025-10-08

### Added

- General form PDE model (`generalFormPDEScript`) (#48)
- Frontal solver (#40, #43)
- 1D PDE solver (#42)
- `printVersion` (#45)
- Automated tests on pull requests (#44)

### Changed

- `solidHeatTransferScript` is renamed to `heatConductionScript` (#47)

### Fixed

- Signs of the advection and reaction terms in the general form PDE

## [0.1.2] - 2025-07-31

### Added

- Front propagation model (`frontPropagationScript`) for the eikonal equation (#29)
- Solidification front example (#30)

## [0.1.1] - 2025-05-22

### Added

- First build published to npm (#25)

## [0.1.0] - 2025-05-15

- Initial release: steady heat conduction in 1D and 2D (`solidHeatTransferScript`), structured meshes and
  Gmsh import, Jacobi and LU solvers, Plotly plotting, and a web worker (`FEAScriptWorker`)

[0.3.0]: https://github.com/FEAScript/FEAScript-core/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/FEAScript/FEAScript-core/compare/0.1.3...0.2.0
[0.1.3]: https://github.com/FEAScript/FEAScript-core/compare/0.1.2...0.1.3
[0.1.2]: https://github.com/FEAScript/FEAScript-core/compare/0.1.1...0.1.2
[0.1.1]: https://github.com/FEAScript/FEAScript-core/compare/0.1.0...0.1.1
[0.1.0]: https://github.com/FEAScript/FEAScript-core/releases/tag/0.1.0
