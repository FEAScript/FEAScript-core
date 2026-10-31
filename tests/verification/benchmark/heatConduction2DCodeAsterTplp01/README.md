<img src="https://feascript.github.io/FEAScript-website/assets/feascript-heat-transfer.png" width="80" alt="FEAScript heat conduction logo">

# Benchmark Test — Code_Aster TPLP01 (2D Heat Conduction in an L-Shaped Domain)

## Purpose

This test replicates the Code_Aster validation test TPLP01
([V4.05.001](https://ericca.uqtr.ca/fr12.4/man_v/v4/v4.05.001.pdf)) and checks that
`heatConductionScript` handles a domain with a re-entrant corner, where the temperature gradient is
singular, on Gmsh meshes of both quadratic triangles and quadratic quadrilaterals.

TPLP01 takes the problem and its reference values from the VPCS validation guide (Société Française
des Mécaniciens, AFNOR, 1990), which cites G. T. Symm, NPL Report NAC 31, 1973.

This is an independent reproduction of the TPLP01 problem and is not sponsored, endorsed, or
affiliated with EDF, the Code_Aster project, SFM or AFNOR.

## Problem setup

An L-shaped domain `ABCDEF`: a 0.8 m by 0.8 m square without its 0.4 m by 0.4 m bottom right
quarter. `A` at the origin, `B` at `(0.4, 0)`, `C` at `(0.4, 0.4)` (the re-entrant corner), `D` at
`(0.8, 0.4)`, `E` at `(0.8, 0.8)`, `F` at `(0, 0.8)`. Thermal conductivity `k = 1 W/(m·K)`, no
internal heat generation:

| Edge           | Boundary condition              |
| -------------- | ------------------------------- |
| FA (left)      | Constant temperature, T = 10 °C |
| DE (right)     | Constant temperature, T = 0 °C  |
| AB, BC, CD, EF | Insulated (`symmetry`)          |

| Case              | Mesh                                                     |
| ----------------- | -------------------------------------------------------- |
| P2 triangles      | `tests/meshes/lshape_triang_quadratic.msh` (6-node, 618) |
| Q2 quadrilaterals | `tests/meshes/lshape_quad_quadratic.msh` (9-node, 321)   |

Both meshes come from [`lshape.geo`](../../../meshes/lshape.geo): element size 0.05 m, refined to
0.01 m at `C`, with mesh nodes at all 13 reference points.

## Expected values

| x (m) | y (m) | TPLP01 reference | P2 triangles | Q2 quadrilaterals |
| ----- | ----- | ---------------- | ------------ | ----------------- |
| 0.2   | 0.0   | **9.316 °C**     | 9.307 °C     | 9.307 °C          |
| 0.2   | 0.2   | **9.001 °C** ¹   | 9.100 °C     | 9.101 °C          |
| 0.2   | 0.4   | **8.514 °C**     | 8.516 °C     | 8.517 °C          |
| 0.2   | 0.6   | **8.018 °C**     | 8.018 °C     | 8.018 °C          |
| 0.2   | 0.8   | **7.869 °C**     | 7.874 °C     | 7.874 °C          |
| 0.4   | 0.0   | **9.009 °C**     | 9.008 °C     | 9.008 °C          |
| 0.4   | 0.2   | **8.640 °C**     | 8.660 °C     | 8.660 °C          |
| 0.4   | 0.4   | **6.667 °C**     | 6.666 °C     | 6.665 °C          |
| 0.4   | 0.6   | **5.680 °C**     | 5.670 °C     | 5.670 °C          |
| 0.4   | 0.8   | **5.495 °C**     | 5.496 °C     | 5.496 °C          |
| 0.6   | 0.4   | **2.972 °C**     | 2.967 °C     | 2.967 °C          |
| 0.6   | 0.6   | **2.881 °C**     | 2.881 °C     | 2.881 °C          |
| 0.6   | 0.8   | **2.816 °C**     | 2.819 °C     | 2.819 °C          |

Tolerance used in the assertions: `5e-3` (relative); TPLP01 itself uses 1 %. Apart from the point
marked ¹, the largest deviation is 0.24 %, at `(0.4, 0.2)`. The values hardly change on a mesh of
about 20 000 nodes, so the remaining deviations are mostly in the reference values.

¹ The published 9.001 °C at `(0.2, 0.2)` is 1.1 % below the FEAScript result, which is
mesh-converged (9.1007 °C on the 20 000-node mesh) and the same on triangles and quadrilaterals.
It is likely a misprint of about 9.10 °C. This point is checked with a relative tolerance of
`1.5e-2`.

## How to run

From the repository root:

```bash
node tests/verification/benchmark/heatConduction2DCodeAsterTplp01/benchmark.test.js
```

The `test` script in `package.json` also runs this file, so `npm test` works too.

A passing run prints twenty-six `PASS:` lines followed by `26 passed, 0 failed.`. A failing run prints one or
more `FAIL:` lines, ends with the same summary line format, and exits with code 1.

## After modifying the code

| Situation                              | Action                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| Bug fix that should not change results | Run the test — it must still pass.                                                        |
| Intentional algorithm change           | Re-check that the results stay close to the reference and adjust the tolerance if needed. |
| Regenerating the meshes                | Keep nodes at the 13 reference points (see [`tests/meshes`](../../../meshes/README.md)).  |
