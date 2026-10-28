<img
src="https://feascript.github.io/FEAScript-website/assets/feascript-creeping-flow.png"
width="80"
alt="FEAScript creeping flow logo"

>

# Analytical Test — Couette Flow in 2D (Creeping Flow)

## Purpose

This test guards the Taylor-Hood creeping flow (Stokes) assembly on both element shapes:
Q2-Q1 quadrilaterals on a structured mesh, and P2-P1 triangles on a Gmsh mesh.

Couette flow has a linear velocity profile and zero pressure, which both element pairs
reproduce exactly, so the expected values are closed-form and the tolerance can be `1e-10`.

## Problem setup

Domain `x ∈ [0, 4]`, `y ∈ [0, 2]`, `lusolve`, μ = 1.

| Boundary     | Condition                  |
| ------------ | -------------------------- |
| Bottom       | `constantVelocity`, (0, 0) |
| Top          | `constantVelocity`, (1, 0) |
| Left / right | `stressFree` (natural)     |

| Case                 | Mesh                                              |
| -------------------- | ------------------------------------------------- |
| Q2-Q1 quadrilaterals | 4 × 2 structured quadratic elements               |
| Q2-Q1 quadrilaterals | `tests/meshes/rect_quad_quadratic.msh` (9-node)   |
| P2-P1 triangles      | `tests/meshes/rect_triang_quadratic.msh` (6-node) |

## Expected values

| Quantity | Exact solution |
| -------- | -------------- |
| u        | y / 2          |
| v        | 0              |
| p        | 0              |

Every nodal value must match within `1e-10`. Observed largest deviations are of order `1e-14`.

## How to run

From the repository root:

```bash
node tests/verification/analytical/creepingFlow2DCouette/analytical.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.
