<img src="https://feascript.github.io/FEAScript-website/assets/feascript-creeping-flow.png" width="80" alt="FEAScript creeping flow logo">

# Regression Test — Lid-Driven Cavity in 2D (Creeping Flow)

## Purpose

This test guards the numerical output of the lid-driven cavity example against unintended
changes to the Taylor-Hood creeping flow (Stokes) assembler or the flow boundary conditions.

It replicates the physical problem set up in
[`lidDrivenCavity2DCreepingFlow.js`](../../../examples/creepingFlowScript/lidDrivenCavity2DCreepingFlow/lidDrivenCavity2DCreepingFlow.js)
on structured and Gmsh quadrilaterals and on Gmsh triangles, and asserts known good values.

## Problem setup

| Parameter         | Value                      |
| ----------------- | -------------------------- |
| Domain            | 2D, x ∈ [0, 4], y ∈ [0, 2] |
| Top (lid)         | `constantVelocity`, (1, 0) |
| Bottom/left/right | `constantVelocity`, (0, 0) |
| Solver            | `lusolve`                  |

| Mesh                                                             | Elements                                 |
| ---------------------------------------------------------------- | ---------------------------------------- |
| 12 × 6 structured quadrilaterals                                 | Q2-Q1 (9-node velocity, 4-node pressure) |
| Quadratic quadrilaterals, `tests/meshes/rect_quad_quadratic.msh` | Q2-Q1 (9-node velocity, 4-node pressure) |
| Quadratic triangles, `tests/meshes/rect_triang_quadratic.msh`    | P2-P1 (6-node velocity, 3-node pressure) |

Creeping flow requires quadratic elements (Taylor-Hood), and the saddle-point system is solved
with `lusolve` only: the frontal solver is not supported for this model, and the Jacobi method
does not converge for saddle-point systems.

## Expected values

| Mesh                               | Minimum u (return flow) | Nodal mean u | Nodal mean v | Pressure nodes |
| ---------------------------------- | ----------------------- | ------------ | ------------ | -------------- |
| Q2-Q1, 12 × 6 structured           | **−0.32446**            | **0.03988**  | **0**        | **91**         |
| Q2-Q1, `rect_quad_quadratic.msh`   | **−0.31898**            | **0.02027**  | **−0.00013** | **41**         |
| P2-P1, `rect_triang_quadratic.msh` | **−0.31768**            | **0.04319**  | **−0.00020** | **35**         |

The minimum x-velocity is the strongest return flow of the recirculation below the lid. The
pressure nodes are the element corners (13 × 7 for the structured mesh) or the triangle vertices.
Tolerance used in the assertions: `1e-4`.

The values were updated when zero-velocity (no-slip) conditions started to take precedence at nodes shared with a
moving wall. Before, the condition applied last won, so one corner of the lid took the lid velocity and leaked
mass through a side wall; with the pressure pinned at one node, this produced a spurious flow near that node. The
structured mesh solution is now mirror-symmetric about x = 2 (nodal mean v is zero), as the Stokes flow in this
cavity must be.

On the structured mesh the test also checks that the velocity is mirror-symmetric about x = 2,
u(x, y) = u(4 − x, y) and v(x, y) = −v(4 − x, y), to within `1e-10`, as the Stokes flow in this cavity must be.

The test also solves each case with a viscosity of 2.5, given as a number and as a function of
(x, y). The Stokes equations with velocity boundary conditions are linear in μ, so the velocity
must be unchanged and the pressure scaled by 2.5 (relative tolerance `1e-10`).

## How to run

From the repository root:

```bash
node tests/regression/lidDrivenCavity2DCreepingFlow/regression.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

A passing run prints twenty-five `PASS:` lines followed by `25 passed, 0 failed.`. A failing run prints one or
more `FAIL:` lines, ends with the same summary line format, and exits with code 1.

## After modifying the code

| Situation                              | Action                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results | Run the test — it must still pass.                                                                   |
| Intentional algorithm change           | Re-derive the expected values, update `cases` in `regression.test.js`, and document the reason here. |
