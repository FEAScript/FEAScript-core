<img src="https://feascript.github.io/FEAScript-website/assets/feascript-general-form-pde.png" width="80" alt="FEAScript general form PDE logo">

# Regression Test — Nonlinear Reaction-Diffusion in 1D (General Form PDE)

## Purpose

This test guards the numerical output of the 1D nonlinear reaction-diffusion example against
unintended changes to the nonlinear general form PDE assembler or the Newton-Raphson method.

It replicates the physical problem set up in
[`nonlinearReactionDiffusion1D.js`](../../../examples/generalFormPDEScript/nonlinearReactionDiffusion1D/nonlinearReactionDiffusion1D.js)
for linear and quadratic elements, and asserts known good values.

## Problem setup

| Parameter           | Value                                  |
| ------------------- | -------------------------------------- |
| Domain              | 1D, x ∈ [0, 10]                        |
| Mesh                | 20 elements                            |
| Coefficients        | A = 1, B = 0, C = 0                    |
| Nonlinear term      | D = Da u², dD/du = 2 Da u, with Da = 1 |
| Boundary 0 (x = 0)  | `constantValue`, u = 1                 |
| Boundary 1 (x = 10) | `zeroGradient`                         |
| Solver              | Newton-Raphson with `lusolve`          |

The frontal solver is not yet supported for nonlinear `generalFormPDEScript`.

## Expected values

| Element order | u at x = 1  | u at x = 5  | u at x = 10 |
| ------------- | ----------- | ----------- | ----------- |
| Linear        | **0.50093** | **0.10962** | **0.05678** |
| Quadratic     | **0.50436** | **0.11040** | **0.05709** |

Tolerance used in the assertions: `1e-4`.

The linear values were updated when linear elements moved from a 1-point to a 2-point Gauss rule
([#105](https://github.com/FEAScript/FEAScript-core/issues/105)), which integrates the nonlinear reaction term
more accurately.

## How to run

From the repository root:

```bash
node tests/regression/nonlinearReactionDiffusion1D/regression.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

## After modifying the code

| Situation                              | Action                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results | Run the test — it must still pass.                                                                   |
| Intentional algorithm change           | Re-derive the expected values, update `cases` in `regression.test.js`, and document the reason here. |
