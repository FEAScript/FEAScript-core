<img
src="https://feascript.github.io/FEAScript-website/assets/feascript-front-propagation.png"
width="80"
alt="FEAScript front propagation logo"

>

# Regression Test — Solidification Front in 2D

## Purpose

This test guards the numerical output of the 2D solidification front example against unintended
changes to the front propagation (eikonal) assembler, the Newton-Raphson method, or the solvers,
for every 2D element type and order and every applicable solver method.

It replicates the physical problem set up in
[`solidificationFront2D.js`](../../../examples/frontPropagationScript/solidificationFront2D/solidificationFront2D.js)
and asserts known good values. The exact distance function is checked separately by the
[planar front verification test](../../verification/analytical/frontPropagation2DPlanarFront/README.md).

## Problem setup

| Parameter           | Value                      |
| ------------------- | -------------------------- |
| Domain              | 2D, x ∈ [0, 4], y ∈ [0, 2] |
| Bottom, left, right | `constantValue`, u = 0     |
| Top                 | `zeroGradient`             |

The boundary keys are the same for both mesh kinds (0, 1 and 3 fixed, 2 free): the structured
mesh uses 0 bottom, 1 left, 2 top, 3 right, and the Gmsh meshes use 0 bottom, 1 right, 2 top, 3 left.

| Mesh                                                             | Solver methods       |
| ---------------------------------------------------------------- | -------------------- |
| 12 × 8 linear quadrilaterals (structured)                        | `lusolve`, `frontal` |
| 12 × 8 quadratic quadrilaterals (structured)                     | `lusolve`, `frontal` |
| Linear quadrilaterals, `tests/meshes/rect_quad_linear.msh`       | `lusolve`, `frontal` |
| Quadratic quadrilaterals, `tests/meshes/rect_quad_quadratic.msh` | `lusolve`, `frontal` |
| Linear triangles, `tests/meshes/rect_triang_linear.msh`          | `lusolve`, `frontal` |
| Quadratic triangles, `tests/meshes/rect_triang_quadratic.msh`    | `lusolve`, `frontal` |

## Expected values

| Mesh                            | Value at (x = 2, y = 2) | Nodal mean value |
| ------------------------------- | ----------------------- | ---------------- |
| 12 × 8 linear quadrilaterals    | **1.96120**             | **0.59658**      |
| 12 × 8 quadratic quadrilaterals | **1.98119**             | **0.62860**      |
| `rect_quad_linear.msh`          | **1.89534**             | **0.53004**      |
| `rect_quad_quadratic.msh`       | **1.95905**             | **0.59014**      |
| `rect_triang_linear.msh`        | **1.89210**             | **0.54573**      |
| `rect_triang_quadratic.msh`     | **1.96578**             | **0.59833**      |

The point (x = 2, y = 2) is the farthest point from the fixed boundaries, where the exact
distance is 2. The viscous term that stabilizes the eikonal equation has a minimum that scales
with the element size, so the coarse Gmsh meshes (characteristic length 0.7) are further from the
exact value. Every solver method must give the same values. Tolerance used in the assertions: `1e-4`.

The linear quadrilateral values were updated when linear quadrilaterals moved from a 1-point to a 2 × 2 Gauss
rule ([#105](https://github.com/FEAScript/FEAScript-core/issues/105)), which no longer under-integrates the
element matrices.

## How to run

From the repository root:

```bash
node tests/regression/solidificationFront2D/regression.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

## After modifying the code

| Situation                              | Action                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results | Run the test — it must still pass.                                                                   |
| Intentional algorithm change           | Re-derive the expected values, update `cases` in `regression.test.js`, and document the reason here. |
| Adding a new solver method             | Add it to `solverMethods` in `regression.test.js` and to the table above.                            |
