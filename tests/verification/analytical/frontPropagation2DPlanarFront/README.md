<img src="https://feascript.github.io/FEAScript-website/assets/feascript-front-propagation.png" width="80" alt="FEAScript front propagation logo">

# Analytical Test — Planar Front in 2D (Front Propagation)

## Purpose

This test guards the front propagation (eikonal) assembly on quadrilaterals (structured and Gmsh
meshes) and on triangles (Gmsh meshes), for linear and quadratic elements, with both `lusolve` and the frontal solver.

A planar front starting at the bottom boundary has the distance function `u = y` as exact
solution. The viscous term that stabilizes the eikonal equation shifts the computed solution
slightly away from it, so the tolerance is `5e-2` rather than round-off. The minimum of the viscous
term scales with the element size, so the coarse Gmsh linear quadrilaterals use `1.5e-1`.

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

## Expected values

| Check                 | Expected                                                                     |
| --------------------- | ---------------------------------------------------------------------------- |
| Nodal values vs u = y | Largest deviation below `5e-2` (`1.5e-1` for the Gmsh linear quadrilaterals) |
| Frontal vs `lusolve`  | Largest nodal difference below `1e-8`                                        |

Observed largest deviations from `u = y` are about `3e-2` (structured linear quadrilaterals,
quadratic elements), `4e-2` (linear triangles) and `1.2e-1` (Gmsh linear quadrilaterals).

## How to run

From the repository root:

```bash
node tests/verification/analytical/frontPropagation2DPlanarFront/analytical.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.
