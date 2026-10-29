<img
src="https://feascript.github.io/FEAScript-website/assets/feascript-creeping-flow.png"
width="80"
alt="FEAScript creeping flow logo"

>

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
| Q2-Q1, 12 × 6 structured           | **−0.32956**            | **0.04266**  | **−0.01122** | **91**         |
| Q2-Q1, `rect_quad_quadratic.msh`   | **−0.26737**            | **0.05610**  | **0.00276**  | **41**         |
| P2-P1, `rect_triang_quadratic.msh` | **−0.31934**            | **0.05782**  | **0.01150**  | **35**         |

The minimum x-velocity is the strongest return flow of the recirculation below the lid. The
pressure nodes are the element corners (13 × 7 for the structured mesh) or the triangle vertices.
Tolerance used in the assertions: `1e-4`.

## How to run

From the repository root:

```bash
node tests/regression/lidDrivenCavity2DCreepingFlow/regression.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

## After modifying the code

| Situation                              | Action                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results | Run the test — it must still pass.                                                                   |
| Intentional algorithm change           | Re-derive the expected values, update `cases` in `regression.test.js`, and document the reason here. |
