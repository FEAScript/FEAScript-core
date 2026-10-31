<img src="https://feascript.github.io/FEAScript-website/assets/feascript-front-propagation.png" width="80" alt="FEAScript front propagation logo">

# Analytical Test — Planar Front in 1D (Front Propagation)

## Purpose

This test guards the 1D front propagation (eikonal) assembly for linear and quadratic elements, with
both `lusolve` and the frontal solver.

A front starting at the left boundary has the distance function `u = x` as exact solution. The
viscous term that stabilizes the eikonal equation, with coefficient ε = max(1e-2, 0.1 h), conflicts
with the zero-gradient condition at the right boundary: there the solution bends in a boundary layer
of width about ε, and the largest deviation, at the right boundary node, equals ε. The nodal check
therefore uses a tolerance of `5e-2`. Away from the right boundary the layer has decayed, so the
interior is checked separately with a tight tolerance, on meshes fine enough to resolve the layer.

## Problem setup

Domain `x ∈ [0, 2]`.

| Boundary      | Condition                |
| ------------- | ------------------------ |
| Left (key 0)  | `constantValue`, u = 0   |
| Right (key 1) | `zeroGradient` (natural) |

| Case                | Mesh                          |
| ------------------- | ----------------------------- |
| Linear              | 20 structured 2-node elements |
| Quadratic           | 20 structured 3-node elements |
| Interior, linear    | 80 structured 2-node elements |
| Interior, quadratic | 40 structured 3-node elements |

## Expected values

| Check                       | Expected                                                               |
| --------------------------- | ---------------------------------------------------------------------- |
| Nodal values vs u = x       | Largest deviation below `5e-2`                                         |
| Frontal vs `lusolve`        | Largest nodal difference below `1e-8`                                  |
| Left value `u = 1`          | Largest deviation from `u = 1 + x` below `5e-2`, `lusolve` and frontal |
| Interior (x ≤ 1.5) vs u = x | Largest deviation below `1e-8`                                         |

Observed largest deviations from `u = x`: `1.0e-2` for both linear and quadratic elements, at the right
boundary node, and `2.4e-10` in the interior on the 80- and 40-element meshes.

## How to run

From the repository root:

```bash
node tests/verification/analytical/frontPropagation1DPlanarFront/analytical.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

A passing run prints ten `PASS:` lines followed by `10 passed, 0 failed.`. A failing run prints one or
more `FAIL:` lines, ends with the same summary line format, and exits with code 1.

## After modifying the code

| Situation                                | Action                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results   | Run the test — it must still pass.                                                                            |
| Change to the viscous (stabilizing) term | The deviation from `u = x` may change; re-check the observed values above and adjust the tolerance if needed. |
| Adding a new solver method               | Add a comparison against `lusolve`, as the frontal solver check does.                                         |
