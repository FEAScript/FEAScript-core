# Analytical Test — Spatially Varying Heat Conduction in 2D

## Purpose

This test guards the spatially varying `thermalConductivity` and `heatSource` coefficients of
`heatConductionScript` in 2D, where the coefficients are evaluated at the physical coordinates
produced by the 2D isoparametric mapping.

The 2D assembly path is a separate implementation from the 1D one, with its own Gauss loop and
its own mapping, so the 1D test does not cover it. As there, the expected values are closed-form
solutions rather than stored reference numbers, with the setups chosen so the finite element
solution is exact at the nodes and the tolerance can be `1e-10`.

## Problem setup

Common to both cases: domain `x ∈ [0, 1]`, `y ∈ [0, 1]`, 4 × 3 quadratic elements, `lusolve`.
Boundaries left unspecified are natural (zero flux), which both exact solutions satisfy.

| Case | k(x, y) | Q   | Boundaries                      | Exact solution |
| ---- | ------- | --- | ------------------------------- | -------------- |
| 1    | 1 + x   | −1  | left (1) T = 0, right (3) T = 1 | T = x          |
| 2    | 1 + y   | −1  | bottom (0) T = 0, top (2) T = 1 | T = y          |

Case 2 is case 1 rotated onto the other axis. It is what confirms the y-coordinate reaches the
coefficients rather than being dropped or swapped with x — a mutation swapping the two arguments
is invisible to case 1 alone and to the whole of the 1D test, where the coefficient is called
with x only.

## Expected values

Every nodal temperature must match the closed-form solution to within `1e-10`. Observed largest
deviations are of order `1e-15`; swapping x and y in the 2D assembler moves them to `1e-1`.

## How to run

From the repository root:

```bash
node tests/verification/analytical/heatConduction2DVaryingCoefficients/analytical.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

A passing run prints two `PASS:` lines and `2 passed, 0 failed.`; a failing run prints `FAIL:`
with the largest deviation and the node it occurred at, and exits with code 1.

## After modifying the code

| Situation                                           | Action                                                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results              | Run the test — it must still pass.                                                                       |
| Change to the coefficient API                       | Update the cases; the analytical solutions themselves stay valid.                                        |
| Intentional change to quadrature or element mapping | The expected values do not move. If a case now fails, the change altered the physics, not the reference. |
| Adding the frontal solver to the 2D coverage        | Add a case comparing it against `lusolve`, as case 3 of the 1D test does.                                |
