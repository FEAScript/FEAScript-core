<img src="https://feascript.github.io/FEAScript-website/assets/feascript-general-form-pde.png" width="80" alt="FEAScript general form PDE logo">

# Regression Test — Advection-Diffusion in 1D (General Form PDE)

## Purpose

This test guards the numerical output of the 1D advection-diffusion example against unintended
changes to the general form PDE assembler or the solvers.

It replicates the physical problem set up in
[`advectionDiffusion1D.js`](../../../examples/generalFormPDEScript/advectionDiffusion1D/advectionDiffusion1D.js)
for linear and quadratic elements and every applicable solver method, and asserts known good values.

## Problem setup

| Parameter          | Value                       |
| ------------------ | --------------------------- |
| Domain             | 1D, x ∈ [0, 1]              |
| Mesh               | 20 elements                 |
| Coefficients       | A = 1, B = −10, C = 0       |
| Source term        | D = 10 exp(−200 (x − 0.5)²) |
| Boundary 0 (x = 0) | `constantValue`, u = 1      |
| Boundary 1 (x = 1) | `zeroGradient`              |

| Element order | Solver methods                 |
| ------------- | ------------------------------ |
| Linear        | `lusolve`, `jacobi`, `frontal` |
| Quadratic     | `lusolve`, `frontal`           |

The Jacobi method requires a
diagonally dominant matrix, which quadratic elements do not give, so it is used with linear
elements only (with `maxIterations: 200000`, `tolerance: 1e-8`).

## Expected values

| Element order | u at x = 0.5 | u at x = 1  |
| ------------- | ------------ | ----------- |
| Linear        | **0.89376**  | **0.87555** |
| Quadratic     | **0.89447**  | **0.87563** |

Every solver method must give the same values. Tolerance used in the assertions: `1e-4`.

The linear values were updated when linear elements moved from a 1-point to a 2-point Gauss rule
([#105](https://github.com/FEAScript/FEAScript-core/issues/105)), which integrates the Gaussian source term more
accurately.

## How to run

From the repository root:

```bash
node tests/regression/advectionDiffusion1D/regression.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

A passing run prints ten `PASS:` lines followed by `10 passed, 0 failed.`. A failing run prints one or
more `FAIL:` lines, ends with the same summary line format, and exits with code 1.

## After modifying the code

| Situation                              | Action                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results | Run the test — it must still pass.                                                                   |
| Intentional algorithm change           | Re-derive the expected values, update `cases` in `regression.test.js`, and document the reason here. |
| Adding a new solver method             | Add it to the `solverMethods` of each applicable case and to the table above.                        |
