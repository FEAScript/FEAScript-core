# Analytical Test — Spatially Varying Heat Conduction in 1D

## Purpose

This test guards the spatially varying `thermalConductivity` and `heatSource` coefficients of
`heatConductionScript` in 1D, covering the matrix assembler, the frontal assembler, and the
coefficient forwarding performed by `solveAsync`.

It differs from the tests under `tests/regression` in that no stored reference value is used. A
stored value can only record whatever the code produced when the test was written; here each case
has a closed-form solution of the underlying PDE, and the setups are chosen so the finite element
solution is exact at the nodes. That allows a tolerance of `1e-10` instead of `1e-4`, and the
expected values never need re-deriving when the mesh or element order changes.

## Problem setup

Common to every case: domain `x ∈ [0, 1]`, 8 elements, Dirichlet boundaries. The 1D `convection`
condition is avoided so that the expected solution is unambiguous.

| Case | k(x)    | Q(x)    | Boundaries         | Exact solution                  | Elements          |
| ---- | ------- | ------- | ------------------ | ------------------------------- | ----------------- |
| 1    | 1       | 1       | T(0) = T(1) = 0    | x (1 − x) / 2                   | linear            |
| 2    | 1 + x   | −1      | T(0) = 0, T(1) = 1 | x                               | linear, quadratic |
| 3    | 1 + x   | 5x      | T(0) = 0, T(1) = 1 | frontal vs `lusolve`            | linear            |
| 4    | counter | counter | T(0) = 0, T(1) = 1 | coefficients reach `solveAsync` | linear            |

Case 1 is the only one whose exact solution lies outside the finite element space, so it is what
pins the quadrature of the source term; case 2's `T = x` would still be reproduced by an
under-integrated source. Case 2 is also what pins the evaluation point, as it fails if the
conductivity is sampled anywhere other than the Gauss points.

Case 4 cannot be driven end to end, since `jacobi-gpu` requires a WebGPU compute engine.
Assembly happens before the solver method is branched on, so coefficients that count their own
invocations are enough to prove they reach the assembler.

## Expected values

Every nodal temperature must match the closed-form solution to within `1e-10`. Observed largest
deviations are of order `1e-15`.

## How to run

From the repository root:

```bash
node tests/verification/analytical/heatConduction1DVaryingCoefficients/analytical.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

A passing run prints five `PASS:` lines and `5 passed, 0 failed.`; a failing run prints `FAIL:`
with the largest deviation and its node, and exits with code 1.

## After modifying the code

| Situation                                             | Action                                                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results                | Run the test — it must still pass.                                                                       |
| Change to the coefficient API                         | Update the cases; the analytical solutions themselves stay valid.                                        |
| Intentional change to quadrature or element mapping   | The expected values do not move. If a case now fails, the change altered the physics, not the reference. |
| New assembler or solver path reading the coefficients | Add a case for it here, as cases 3 and 4 do for the frontal and asynchronous paths.                      |
