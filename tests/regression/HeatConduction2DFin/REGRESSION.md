# Regression Test — HeatConduction2DFin

## Purpose

This test guards the numerical output of the 2D heat-conduction-in-a-fin example
against unintended changes to the solver, assembler, or mesh-generation logic.

It replicates exactly the problem set up in
[`HeatConduction2DFin.html`](../../../examples/solidHeatTransferScript/HeatConduction2DFin/HeatConduction2DFin.html)
and asserts a known good value at a representative interior point.

## Problem setup

| Parameter                  | Value                            |
| -------------------------- | -------------------------------- |
| Domain                     | 2D, x ∈ [0, 4] m, y ∈ [0, 2] m   |
| Mesh                       | 8 × 4 quadratic elements         |
| Boundary 0 (bottom, y = 0) | Constant temperature, T = 200 °C |
| Boundary 1 (left, x = 0)   | Symmetry (zero flux)             |
| Boundary 2 (top, y = 2)    | Convection, h = 1, T∞ = 20 °C    |
| Boundary 3 (right, x = 4)  | Constant temperature, T = 200 °C |
| Solver                     | LU decomposition (`lusolve`)     |

## Expected value

| Quantity                           | Value           |
| ---------------------------------- | --------------- |
| Temperature at node (x = 0, y = 2) | **81.31873 °C** |

This point sits at the top-left corner of the fin — on the symmetry boundary and
the convection boundary — and is sensitive to both the heat transfer coefficient
and the thermal gradient across the domain.

Tolerance used in the assertion: `1e-4`.

## How to run

From the repository root:

```bash
node tests/regression/HeatConduction2DFin/regression.test.js
```

A passing run prints:

```
PASS: T(x=0, y=2) = 81.31873 (expected 81.31873)
```

A failing run prints a `FAIL:` message and exits with code 1.

Running `npm test` executes all regression tests, including this one.

## After modifying the code

| Situation                                                                   | Action                                                                                                   |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results                                      | Run the test — it must still pass.                                                                       |
| Intentional algorithm change (new element type, new integration rule, etc.) | Re-derive the expected value, update `EXPECTED_T` in `regression.test.js`, and document the reason here. |
| New boundary condition API                                                  | Update both the test and the reference HTML example together.                                            |
| Mesh refinement study                                                       | Add a separate assertion block for the refined mesh; keep the current block as the coarse-mesh baseline. |

## Change log

| Date       | Change                      | New expected value |
| ---------- | --------------------------- | ------------------ |
| 2026-06-14 | Initial regression baseline | 81.31873           |
