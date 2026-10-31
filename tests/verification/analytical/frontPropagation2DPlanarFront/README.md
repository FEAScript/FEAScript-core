<img src="https://feascript.github.io/FEAScript-website/assets/feascript-front-propagation.png" width="80" alt="FEAScript front propagation logo">

# Analytical Test — Planar Front in 2D (Front Propagation)

## Purpose

This test guards the front propagation (eikonal) assembly on quadrilaterals (structured and Gmsh
meshes) and on triangles (Gmsh meshes), for linear and quadratic elements, with both `lusolve` and the frontal solver.

A planar front starting at the bottom boundary has the distance function `u = y` as exact
solution. The viscous term that stabilizes the eikonal equation, with coefficient
ε = max(1e-2, 0.1 h), conflicts with the zero-gradient condition at the top boundary: there the
solution bends in a boundary layer of width about ε, and the largest deviation is close to ε. The nodal
check therefore uses a tolerance of `5e-2`; ε scales with the element size, so the coarse Gmsh linear
quadrilaterals use `1.5e-1`. Away from the top boundary the layer has decayed, so the interior is
checked separately with a tight tolerance, on a mesh fine enough to resolve the layer.

## Problem setup

Domain `x ∈ [0, 4]`, `y ∈ [0, 2]`.

| Boundary           | Condition                |
| ------------------ | ------------------------ |
| Bottom (key 0)     | `constantValue`, u = 0   |
| Left / right / top | `zeroGradient` (natural) |

| Case                           | Mesh                                              |
| ------------------------------ | ------------------------------------------------- |
| Quadrilaterals, linear         | 12 × 8 structured linear elements                 |
| Gmsh quadrilaterals, linear    | `tests/meshes/rect_quad_linear.msh` (4-node)      |
| Gmsh quadrilaterals, quadratic | `tests/meshes/rect_quad_quadratic.msh` (9-node)   |
| Triangles, linear              | `tests/meshes/rect_triang_linear.msh` (3-node)    |
| Triangles, quadratic           | `tests/meshes/rect_triang_quadratic.msh` (6-node) |
| Interior, linear               | 80 × 40 structured linear elements                |

## Expected values

| Check                       | Expected                                                                     |
| --------------------------- | ---------------------------------------------------------------------------- |
| Nodal values vs u = y       | Largest deviation below `5e-2` (`1.5e-1` for the Gmsh linear quadrilaterals) |
| Frontal vs `lusolve`        | Largest nodal difference below `1e-8`                                        |
| Interior (y ≤ 1.5) vs u = y | Largest deviation below `1e-5`                                               |

Observed largest deviations from `u = y`: `2.8e-2` (structured linear quadrilaterals), `7.1e-2` (Gmsh linear
quadrilaterals), `2.7e-2` (Gmsh quadratic quadrilaterals), `4.4e-2` (linear triangles) and `2.3e-2` (quadratic
triangles), all at the top boundary, where each is close to the viscous coefficient ε of the elements there
(about 10 % above it on the coarse Gmsh linear quadrilaterals, whose elements are too coarse to resolve
the layer). In the
interior of the 80 × 40 mesh the largest deviation is `2.1e-6`, most likely set by where the Newton-Raphson iterations stop
rather than by the viscous term.

## How to run

From the repository root:

```bash
node tests/verification/analytical/frontPropagation2DPlanarFront/analytical.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

A passing run prints eleven `PASS:` lines followed by `11 passed, 0 failed.`. A failing run prints one or
more `FAIL:` lines, ends with the same summary line format, and exits with code 1.

## After modifying the code

| Situation                                  | Action                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results     | Run the test — it must still pass.                                                                            |
| Change to the viscous (stabilizing) term   | The deviation from `u = y` may change; re-check the observed values above and adjust the tolerance if needed. |
| Adding a new solver method or element type | Add a case for it here and to the case table above.                                                           |
