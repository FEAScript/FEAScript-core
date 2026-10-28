<img
src="https://feascript.github.io/FEAScript-website/assets/feascript-heat-transfer.png"
width="80"
alt="FEAScript heat conduction logo"

>

# Regression Test — Heat Conduction in a 2D Fin

## Purpose

This test guards the numerical output of the 2D heat-conduction-in-a-fin example against
unintended changes to the solver, assembler, Gmsh import or mesh-generation logic, for every
2D element type and order and every applicable solver method.

It replicates the physical problem set up in
[`heatConduction2DFin.js`](../../../examples/heatConductionScript/heatConduction2DFin/heatConduction2DFin.js)
(structured mesh) and
[`heatConduction2DFinGmsh.js`](../../../examples/heatConductionScript/heatConduction2DFin/heatConduction2DFinGmsh.js)
(Gmsh meshes), and asserts known good values.

## Problem setup

| Parameter      | Value                            |
| -------------- | -------------------------------- |
| Domain         | 2D, x ∈ [0, 4] m, y ∈ [0, 2] m   |
| Bottom (y = 0) | Constant temperature, T = 200 °C |
| Right (x = 4)  | Constant temperature, T = 200 °C |
| Top (y = 2)    | Convection, h = 1, T∞ = 20 °C    |
| Left (x = 0)   | Symmetry (zero flux)             |

The boundary keys differ between the meshes: the structured mesh uses 0 bottom, 1 left, 2 top,
3 right, and the Gmsh meshes use 0 bottom, 1 right, 2 top, 3 left.

| Mesh                                                             | Solver methods                 |
| ---------------------------------------------------------------- | ------------------------------ |
| 8 × 4 linear quadrilaterals (structured)                         | `lusolve`, `frontal`, `jacobi` |
| 8 × 4 quadratic quadrilaterals (structured)                      | `lusolve`, `frontal`           |
| Linear quadrilaterals, `tests/meshes/rect_quad_linear.msh`       | `lusolve`, `frontal`           |
| Quadratic quadrilaterals, `tests/meshes/rect_quad_quadratic.msh` | `lusolve`, `frontal`           |
| Linear triangles, `tests/meshes/rect_triang_linear.msh`          | `lusolve`, `frontal`, `jacobi` |
| Quadratic triangles, `tests/meshes/rect_triang_quadratic.msh`    | `lusolve`, `frontal`           |

The Jacobi method requires a diagonally dominant matrix. Quadratic elements and the distorted
elements of the Gmsh linear quadrilateral mesh do not give one, so it is used with the structured
linear quadrilaterals and the linear triangles only (with `maxIterations: 200000`, `tolerance: 1e-8`).

## Expected values

| Mesh                           | Temperature at (x = 0, y = 2) | Nodal mean temperature |
| ------------------------------ | ----------------------------- | ---------------------- |
| 8 × 4 linear quadrilaterals    | **82.07057 °C**               | **154.20475 °C**       |
| 8 × 4 quadratic quadrilaterals | **81.31873 °C**               | **153.83640 °C**       |
| `rect_quad_linear.msh`         | **83.13780 °C**               | **155.41548 °C**       |
| `rect_quad_quadratic.msh`      | **81.32071 °C**               | **154.97068 °C**       |
| `rect_triang_linear.msh`       | **81.19625 °C**               | **154.83616 °C**       |
| `rect_triang_quadratic.msh`    | **81.32257 °C**               | **154.05011 °C**       |

The point (x = 0, y = 2) sits at the top-left corner of the fin — on the symmetry boundary and
the convection boundary — and is sensitive to both the heat transfer coefficient and the thermal
gradient across the domain. The nodal mean covers the whole field. Every solver method must give
the same values. Tolerance used in the assertions: `1e-4`.

## Patch test

On each Gmsh mesh, the left and right sides are also insulated, which gives 1D conduction with
the linear exact solution T = 200 − 60y. Every element type and order must reproduce it to
round-off with `lusolve` and `frontal` (tolerance `1e-10`), which checks the edge integration
used by the convection boundary condition.

## How to run

From the repository root:

```bash
node tests/regression/HeatConduction2DFin/regression.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

A passing run prints a `PASS:` line for each check, followed by a summary line:

```
PASS: 8 × 4 quadratic quadrilaterals, lusolve: temperature at (x=0, y=2): expected 81.31873, got 81.31873348502957 (tolerance 0.0001)
...
50 passed, 0 failed.
```

A failing run prints one or more `FAIL:` lines, ends with the same summary line format, and exits with code 1.

## After modifying the code

| Situation                                                                   | Action                                                                                               |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results                                      | Run the test — it must still pass.                                                                   |
| Intentional algorithm change (new element type, new integration rule, etc.) | Re-derive the expected values, update `cases` in `regression.test.js`, and document the reason here. |
| New boundary condition API                                                  | Update both the test and the reference JavaScript examples together.                                 |
| Adding a new solver method                                                  | Add it to the `solverMethods` of each applicable case and to the table above.                        |
