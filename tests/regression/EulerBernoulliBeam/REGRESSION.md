# Regression Test — EulerBernoulliBeam

## Purpose

This test guards the numerical output of the 1D Euler-Bernoulli beam example against
unintended changes to the beam solver, assembler, or mesh-generation logic.

It replicates exactly the problem set up in
[`Beam1DEuler_Bernoulli.js`](../../../examples/Beam1DFEM/Beam1DEuler_Bernoulli.js) — the
"Bending of a Beam" example from J.N. Reddy, _An Introduction to the Finite Element Method_,
3rd ed., McGraw-Hill, 2006 (FEM1D example problems, Chapter 7) — and asserts both a set of
known-good baseline values and, independently of those baseline numbers, that the resulting
finite element solution satisfies global static equilibrium.

## Problem setup

| Parameter                    | Value                                                   |
| ----------------------------- | -------------------------------------------------------- |
| Domain                        | 1D beam, 0 – 10 m                                        |
| Mesh                          | 2 cubic Hermite beam elements of 5 m each (3 nodes)      |
| Bending stiffness EI          | 2.0 × 10⁶ N·m² (constant)                                |
| Distributed load              | −1,000 N/m over 0 ≤ x ≤ 5 m only                          |
| Node 1 (x = 0)                | Fixed (clamped): w = 0, theta = 0                        |
| Node 2 (x = 5)                | Pinned (roller): w = 0, plus an applied moment M = 1,250 N·m |
| Node 3 (x = 10)               | Transverse spring k = 200 N/m, plus a point load P = −2,500 N |
| Solver                        | LU decomposition (`lusolve`)                              |

## Expected values

| Quantity                | Value                     |
| ------------------------ | ------------------------- |
| w₁ (deflection, node 1)  | 0 m                        |
| θ₁ (rotation, node 1)    | 0 rad                      |
| w₂ (deflection, node 2)  | 0 m                        |
| θ₂ (rotation, node 2)    | −5.6790761806 × 10⁻³ rad   |
| w₃ (deflection, node 3)  | −8.0144777663 × 10⁻² m     |
| θ₃ (rotation, node 3)    | −2.1203895209 × 10⁻² rad   |

Tolerance used in the baseline assertions: `1e-8`.

These baseline values were derived from the FEAScript implementation itself (the source
material only publishes the `.inp`-style problem setup, not the FEM1D program's numeric
output), and were independently cross-checked three ways before being adopted as the
regression baseline:

1. The single-element bending stiffness matrix (for constant EI) was verified against the
   closed-form Hermite beam element stiffness matrix found in any FEM textbook — see
   `tests/unit/eulerBernoulliBeam.test.js`.
2. A simple cantilever case (fixed-free beam under a tip point load) was verified against the
   classical closed-form solution `w_tip = P·L³/(3EI)`, `theta_tip = P·L²/(2EI)` — also in
   `tests/unit/eulerBernoulliBeam.test.js`.
3. The full statically-indeterminate solution above was checked against global force and
   moment equilibrium (see below) — this check is also asserted every run, independently of
   the baseline numbers.

## Equilibrium check

In addition to the baseline values, this test recomputes the raw (no boundary conditions
applied) element assembly, uses it to recover the support reactions and spring force from the
solved DOF values, and asserts:

- **Force equilibrium**: sum of the clamped reaction, roller reaction, spring force, distributed
  load resultant, and applied point load is ~0.
- **Moment equilibrium** about x = 0: sum of the clamped reaction moment, roller reaction moment
  arm, spring force moment arm, distributed load resultant moment arm, point load moment arm,
  and applied moment is ~0.

Tolerance used for the equilibrium assertions: `1e-6`.

## How to run

From the repository root:

```bash
node tests/regression/EulerBernoulliBeam/regression.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

## After modifying the code

| Situation                                                                    | Action                                                                                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Bug fix that should not change results                                       | Run the test — it must still pass.                                                                        |
| Intentional algorithm change (new integration rule, new element type, etc.)  | Re-derive the expected values, update `EXPECTED` in `regression.test.js`, and document the reason here.  |
| New boundary condition type                                                  | Update both the test and `Beam1DEuler_Bernoulli.js` together.                                             |

## Change log

| Date       | Change                      | New expected values |
| ---------- | ---------------------------- | -------------------- |
| 2026-07-17 | Initial regression baseline | See table above      |
