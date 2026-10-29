<img
src="https://feascript.github.io/FEAScript-website/assets/feascript-heat-transfer.png"
width="80"
alt="FEAScript heat conduction logo"

>

# Regression Test — Heat Conduction in a 1D Wall

## Purpose

This test guards the numerical output of the 1D heat-conduction-through-a-wall example
against unintended changes to the solver, assembler, or mesh-generation logic.

It replicates the physical problem set up in
[`heatConduction1DWall.js`](../../../examples/heatConductionScript/heatConduction1DWall/heatConduction1DWall.js)
for linear and quadratic elements and every applicable solver method, and asserts known good values.

## Problem setup

| Parameter             | Value                          |
| --------------------- | ------------------------------ |
| Domain                | 1D, 0 – 0.15 m                 |
| Mesh                  | 10 elements                    |
| Boundary 0 (x = 0)    | Convection, h = 1, T∞ = 25 °C  |
| Boundary 1 (x = 0.15) | Constant temperature, T = 5 °C |

| Element order | Solver methods                 |
| ------------- | ------------------------------ |
| Linear        | `lusolve`, `frontal`, `jacobi` |
| Quadratic     | `lusolve`, `frontal`           |

The Jacobi method requires a diagonally dominant matrix, which quadratic elements do not give,
so it is used with linear elements only (with `maxIterations: 200000`, `tolerance: 1e-8`).

## Expected values

The exact solution is linear, so every case gives the same nodal values.

| Quantity                   | Value          |
| -------------------------- | -------------- |
| Temperature at x = 0       | **7.60870 °C** |
| Temperature at x = 0.075 m | **6.30435 °C** |

Tolerance used in the assertions: `1e-4`.

## How to run

From the repository root:

```bash
node tests/regression/heatConduction1DWall/regression.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

A passing run prints a `PASS:` line for each check, followed by a summary line:

```
PASS: linear elements, lusolve: temperature at x=0: expected 7.6087, got 7.608695652173906 (tolerance 0.0001)
...
10 passed, 0 failed.
```

A failing run prints one or more `FAIL:` lines, ends with the same summary line format, and exits with code 1.

## After modifying the code

| Situation                                                                   | Action                                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results                                      | Run the test — it must still pass.                                                                      |
| Intentional algorithm change (new element type, new integration rule, etc.) | Re-derive the expected values, update `EXPECTED` in `regression.test.js`, and document the reason here. |
| New boundary condition API                                                  | Update both the test and the reference JavaScript example together.                                     |
| Adding a new solver method                                                  | Add it to `cases` in `regression.test.js` and to the table above.                                       |
