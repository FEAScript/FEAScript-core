<img src="https://feascript.github.io/FEAScript-website/assets/feascript-structural-mechanics.png" width="80" alt="FEAScript Euler-Bernoulli beam logo">

# Analytical Test — Euler-Bernoulli Beam in 1D (Cantilever)

## Purpose

This test guards the 1D Euler-Bernoulli beam model (`assembleEulerBernoulliBeamMat`, cubic Hermite
elements) against closed-form results: the textbook element stiffness matrix and the classical
cantilever solution.

It differs from the tests under `tests/regression` in that no stored reference value is used. Both
checks have exact closed-form answers, which the cubic Hermite element reproduces, so a tight
tolerance is used. The regression test in `tests/regression/eulerBernoulliBeam` relies on these
checks to cross-validate its own baseline values.

## Problem setup

| Case | Setup                                                      | Exact result                                         |
| ---- | ---------------------------------------------------------- | ---------------------------------------------------- |
| 1    | Single element, constant EI, no boundary conditions        | Hermite beam element stiffness matrix (EI/L³ scaled) |
| 2    | Cantilever, L = 4, EI = 1e5, tip load P = −1000, 1 element | w_tip = P·L³/(3EI), θ_tip = P·L²/(2EI)               |

Case 1 is run for two independent EI/L combinations (`EI = 2e6, L = 5` and `EI = 7.5e4, L = 2.5`),
so that both the `EI` and the `L` scaling of every entry are checked. DOF order is
`[w1, θ1, w2, θ2]`.

## Expected values

- Case 1: every entry of the assembled matrix must match the closed-form matrix to within `1e-6`
  (entries are of order `EI/L³`).
- Case 2: the clamped-end deflection and rotation must be zero, and the tip deflection and rotation
  must match the closed form, to within `1e-9`.

## How to run

From the repository root:

```bash
node tests/verification/analytical/eulerBernoulliBeam1DCantilever/analytical.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

A passing run prints five `PASS:` lines and `5 passed, 0 failed.`; a failing run prints `FAIL:`
with the computed and expected values, and exits with code 1.

## After modifying the code

| Situation                                        | Action                                                                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results           | Run the test — it must still pass.                                                                       |
| Change to the beam assembler or Hermite elements | The expected values do not move. If a case now fails, the change altered the physics, not the reference. |
| New beam boundary condition or load type         | Add a closed-form case for it here.                                                                      |
