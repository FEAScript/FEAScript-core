<img src="https://feascript.github.io/FEAScript-website/assets/feascript-heat-transfer.png" width="80" alt="FEAScript heat conduction logo">

# Benchmark Test — Code_Aster TPLP302 (2D Heat Conduction in a Strip)

## Purpose

This test replicates the Code_Aster validation test TPLP302
([V4.05.302](https://ericca.uqtr.ca/fr12.4/man_v/v4/v4.05.302.pdf)) and checks that
`heatConductionScript` reproduces a 2D steady-state conduction problem with an analytical solution:
a long strip heated on one end, with a temperature jump at the two heated corners.

This is an independent reproduction of the TPLP302 problem and is not sponsored, endorsed, or
affiliated with EDF or the Code_Aster project.

## Problem setup

A 0.2 m by 2 m strip `ABCD` (`A` at the origin, `B` at `(0.2, 0)`, `C` at `(0.2, 2)`, `D` at
`(0, 2)`), thermal conductivity `k = 1 W/(m·K)`, no internal heat generation:

| Edge        | Boundary condition                                |
| ----------- | ------------------------------------------------- |
| AB (bottom) | Constant temperature, T = 100 °C                  |
| AD (left)   | Constant temperature, T = 0 °C                    |
| BC (right)  | Constant temperature, T = 0 °C                    |
| CD (top)    | Insulated (natural, zero-flux — left unspecified) |

The strip is ten widths long, so the top edge has no effect and the solution is that of a
semi-infinite strip (Welty, Wicks and Wilson, _Fundamentals of Momentum, Heat and Mass Transfer_):

```
T(x, y) = (4 Tp / π) Σ_{n ≥ 0} exp(−(2n+1) π y / l) / (2n+1) · sin((2n+1) π x / l)
```

with `Tp = 100 °C` and `l = 0.2 m`. TPLP302 truncates the series at `n = 1000`, as does the test.

## Expected values

| Point | x (m) | y (m) | TPLP302 reference | Mesh 8 × 80 |
| ----- | ----- | ----- | ----------------- | ----------- |
| E     | 0.05  | 0.05  | **43.496 °C**     | 43.483 °C   |
| F     | 0.05  | 0.10  | **18.978 °C**     | 18.977 °C   |
| G     | 0.05  | 0.15  | **8.559 °C**      | 8.558 °C    |
| H     | 0.10  | 0.05  | **54.467 °C**     | 54.470 °C   |
| I     | 0.10  | 0.10  | **26.096 °C**     | 26.096 °C   |
| J     | 0.10  | 0.15  | **12.032 °C**     | 12.032 °C   |
| K     | 0.10  | 0.20  | **5.499 °C**      | 5.499 °C    |

| Case                      | Compared against        | Tolerance            |
| ------------------------- | ----------------------- | -------------------- |
| Quadratic mesh (8 × 80)   | TPLP302 reference table | `1e-3` (relative)    |
| Quadratic mesh (16 × 160) | Fourier series          | `2e-3` °C (absolute) |

On the 16 × 160 mesh the largest deviation from the series is about `1e-4` °C. The largest error
on the 8 × 80 mesh is at E, the point closest to the corner where the temperature jumps from
100 °C to 0 °C. At that corner node the last condition applied wins, which is the 0 °C of the side
edges.

## How to run

From the repository root:

```bash
node tests/verification/benchmark/heatConduction2DCodeAsterTplp302/benchmark.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

A passing run prints fourteen `PASS:` lines followed by `14 passed, 0 failed.`. A failing run prints one or
more `FAIL:` lines, ends with the same summary line format, and exits with code 1.

## After modifying the code

| Situation                                        | Action                                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Bug fix that should not change results           | Run the test — it must still pass.                                                        |
| Intentional algorithm change                     | Re-check that the results stay close to the reference and adjust the tolerance if needed. |
| Change to the order boundary conditions apply in | Check the corner nodes: the values next to E and H may shift on the 8 × 80 mesh.          |
