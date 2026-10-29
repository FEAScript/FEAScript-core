<img
src="https://feascript.github.io/FEAScript-website/assets/feascript-front-propagation.png"
width="80"
alt="FEAScript front propagation logo"

>

# Analytical Test — Planar Front in 1D (Front Propagation)

## Purpose

This test guards the 1D front propagation (eikonal) assembly for linear and quadratic elements, with
both `lusolve` and the frontal solver.

A front starting at the left boundary has the distance function `u = x` as exact solution. The
viscous term that stabilizes the eikonal equation shifts the computed solution slightly away from it,
so the tolerance is `5e-2` rather than round-off.

## Problem setup

Domain `x ∈ [0, 2]`, 20 elements.

| Boundary      | Condition                |
| ------------- | ------------------------ |
| Left (key 0)  | `constantValue`, u = 0   |
| Right (key 1) | `zeroGradient` (natural) |

| Case      | Mesh                          |
| --------- | ----------------------------- |
| Linear    | 20 structured 2-node elements |
| Quadratic | 20 structured 3-node elements |

## Expected values

| Check                 | Expected                              |
| --------------------- | ------------------------------------- |
| Nodal values vs u = x | Largest deviation below `5e-2`        |
| Frontal vs `lusolve`  | Largest nodal difference below `1e-8` |

Observed largest deviations from `u = x` are about `1e-2` for both linear and quadratic elements.

## How to run

From the repository root:

```bash
node tests/verification/analytical/frontPropagation1DPlanarFront/analytical.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.
