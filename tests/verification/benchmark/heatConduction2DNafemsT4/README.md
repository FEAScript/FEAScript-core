<img
src="https://feascript.github.io/FEAScript-website/assets/feascript-heat-transfer.png"
width="80"
alt="FEAScript heat conduction logo"

>

# Benchmark Test — NAFEMS T4 (2D Heat Conduction with Convection)

## Purpose

This test replicates the NAFEMS T4 benchmark, also documented as a DIANA FEA tutorial
([2DHeatTransferConvection.pdf](https://tutorials.dianafea.com/2DHeatTransferConvection.pdf)),
and checks that `heatConductionScript` reproduces the published target temperature for a 2D
steady-state conduction problem with a convective (Robin) boundary condition.

This is an independent reproduction of the NAFEMS T4 problem and is not sponsored, endorsed, or
affiliated with NAFEMS or DIANA FEA BV.

## Problem setup

A 0.6 m by 1.0 m rectangular plate `ABCD` (`A` at the origin, `B` at `(0.6, 0)`, `C` at
`(0.6, 1.0)`, `D` at `(0, 1.0)`), thermal conductivity `k = 52 W/(m·K)`, no internal heat
generation:

| Edge        | Boundary condition                                |
| ----------- | ------------------------------------------------- |
| AB (bottom) | Constant temperature, T = 100 °C                  |
| AD (left)   | Insulated (natural, zero-flux — left unspecified) |
| CD (top)    | Convection, h = 750 W/(m²·K), ambient T = 0 °C    |
| BC (right)  | Convection, h = 750 W/(m²·K), ambient T = 0 °C    |

The published target is the temperature at point E, located on edge BC at `(x = 0.6, y = 0.2)`:
**18.3 °C**.

## Expected values

| Case           | Temperature at E | Compared against        | Tolerance |
| -------------- | ---------------- | ----------------------- | --------- |
| Mesh (12 × 20) | ≈ 18.26 °C       | NAFEMS target (18.3 °C) | `0.1` °C  |

## How to run

From the repository root:

```bash
node tests/verification/benchmark/heatConduction2DNafemsT4/benchmark.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

A passing run prints two `PASS:` lines followed by `2 passed, 0 failed.`. A failing run prints
one or more `FAIL:` lines, ends with the same summary line format, and exits with code 1.

## After modifying the code

| Situation                                                          | Action                                                                                                          |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Bug fix that should not change results                             | Run the test — it must still pass.                                                                              |
| Intentional algorithm change (new integration rule, mesh ordering) | Re-check the result stays close to the NAFEMS target and adjust the tolerance if needed.                        |
| Adding 8-node serendipity elements to FEAScript                    | Add a case using 8-node elements on the original 3 × 5 mesh for a tighter comparison against the NAFEMS target. |
| New boundary condition API (e.g. convection parameter order)       | Update both this test and the reference JavaScript examples together.                                           |
