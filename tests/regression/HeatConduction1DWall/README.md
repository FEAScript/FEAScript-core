# Regression Test — HeatConduction1DWall

## Purpose

This test guards the numerical output of the 1D heat-conduction-through-a-wall example
against unintended changes to the solver, assembler, or mesh-generation logic.

It replicates the physical problem set up in
[`heatConduction1DWall.js`](../../../examples/heatConductionScript/heatConduction1DWall/heatConduction1DWall.js),
uses `lusolve` as the regression baseline, and asserts a known good value.

## Problem setup

| Parameter             | Value                          |
| --------------------- | ------------------------------ |
| Domain                | 1D, 0 – 0.15 m                 |
| Mesh                  | 10 linear elements             |
| Boundary 0 (x = 0)    | Convection, h = 1, T∞ = 25 °C  |
| Boundary 1 (x = 0.15) | Constant temperature, T = 5 °C |
| Solver                | LU decomposition (`lusolve`)   |

## Expected value

| Quantity                      | Value           |
| ----------------------------- | --------------- |
| Temperature at node 0 (x = 0) | **10.29412 °C** |

Tolerance used in the assertion: `1e-4`.

## How to run

From the repository root:

```bash
node tests/regression/HeatConduction1DWall/regression.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

A passing run prints a `PASS:` line for each check, followed by a summary line:

```
PASS: Temperature at node 0: expected 10.29412, got 10.294117647058822 (tolerance 0.0001)
1 passed, 0 failed.
```

A failing run prints one or more `FAIL:` lines, ends with the same summary line format, and exits with code 1.

## After modifying the code

| Situation                                                                   | Action                                                                                                    |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results                                      | Run the test — it must still pass.                                                                        |
| Intentional algorithm change (new element type, new integration rule, etc.) | Re-derive the expected value, update `EXPECTED_T0` in `regression.test.js`, and document the reason here. |
| New boundary condition API                                                  | Update both the test and the reference JavaScript example together.                                       |
| Adding a new solver method                                                  | Add a separate assertion block for the new method; keep the `lusolve` block untouched as the baseline.    |

## Change log

| Date       | Change                      | New expected value |
| ---------- | --------------------------- | ------------------ |
| 2026-06-14 | Initial regression baseline | 10.29412           |
