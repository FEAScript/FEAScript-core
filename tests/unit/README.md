<img src="https://feascript.github.io/FEAScript-website/assets/feascript-general-form-pde.png" width="80" alt="FEAScript general form PDE logo">

# Unit Tests

This folder contains unit tests for individual FEAScript modules, including solvers, assemblers,
and utilities.

| Test file                   | Covers                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `solvers.test.js`           | Jacobi solver convergence; sparse matrix assembly and CSR/CSC/dense conversion; sparse solver input                 |
| `model.test.js`             | Boundary condition input checks; solution format for every model and solver method; `FEAScriptWorker` model options |
| `elements2D.test.js`        | Basis functions and quadrature rules of linear and quadratic quadrilaterals and triangles                           |
| `plotInterpolation.test.js` | Point location and solution interpolation of the contour plot, for all 2D element types                             |
| `gmshReader.test.js`        | Gmsh reader, including meshes with non-contiguous node tags (same nodes, connectivity, solution)                    |

Run all unit, regression, and verification tests from the repository root with:

```bash
npm test
```

Each unit test can also be run directly with:

```bash
node tests/unit/<test-file>.js
```
