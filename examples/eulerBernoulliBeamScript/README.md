<img src="https://feascript.github.io/FEAScript-website/assets/feascript-structural-mechanics.png" width="80" alt="FEAScript Beam1DFEM Logo">

# 1D Euler-Bernoulli Beam Examples

This directory contains Node.js examples demonstrating how to use the FEAScript library to solve
1D beam bending problems with the Euler-Bernoulli beam theory, using cubic Hermite finite elements.

## Examples

#### 1. Clamped and Spring-Supported Beam (`Beam1DEuler_Bernoulli.js`)

Reproduces the "Bending of a Beam" example from J.N. Reddy, _An Introduction to the Finite Element
Method_, 3rd ed., McGraw-Hill, 2006 (FEM1D example problems, Chapter 7). A 10 m beam is clamped at
one end, supported by a roller at midspan, and connected to a linear elastic spring at the free
end. It carries a uniformly distributed load over the clamped span, a concentrated moment at the
roller, and a point load at the free end.

## Model overview

The 1D Euler-Bernoulli beam solver (`eulerBernoulliBeamScript`) assembles the fourth-order beam
bending equation

```
d²/dx²( EI(x) d²w/dx² ) + c0(x) w = q(x)
```

using cubic Hermite shape functions, so that both the deflection `w` and the rotation
`theta = dw/dx` are continuous across element boundaries (C¹ continuity), as required for a
fourth-order (curvature-based) formulation. Each node therefore carries **2 degrees of freedom**,
ordered as `[w_0, theta_0, w_1, theta_1, ...]` in the solution vector.

### Mesh configuration

The beam geometry only needs each element's 2 end nodes, so `elementOrder` should be set to
`"linear"` when configuring the mesh — this describes the geometry only. The field itself is
always interpolated with cubic Hermite shape functions internally, independent of this setting
(a "subparametric" element formulation, standard for beam elements).

```javascript
model.setMeshConfig({
  meshDimension: "1D",
  elementOrder: "linear",
  numElementsX: 2,
  maxX: 10,
});
```

### Coefficient functions

```javascript
model.setModelConfig("eulerBernoulliBeamScript", {
  coefficientFunctions: {
    EI: (x) => 2.0e6, // Bending stiffness E*I(x) [required]
    c0: (x) => 0, // Elastic foundation modulus [optional, defaults to 0]
    q: (x) => -1000, // Distributed transverse load [optional, defaults to 0]
  },
});
```

### Boundary conditions

Unlike the scalar 1D models (which tag only the two ends of the domain as boundary `"0"`/`"1"`),
beam problems commonly need essential and natural conditions at interior nodes as well (e.g. a
midspan support, or a point load applied partway along the beam). Boundary conditions for the beam
solver are therefore keyed by the **1-based global node number**, and each key maps to an **array**
of condition tuples, since a node can carry more than one condition at once (e.g. a spring support
plus a point load):

```javascript
model.addBoundaryCondition("1", [["fixed"]]); // w=0, theta=0 (clamped)
model.addBoundaryCondition("2", [["pinned"], ["moment", 1250]]); // w=0, plus an applied moment
model.addBoundaryCondition("3", [["spring", 200], ["force", -2500]]); // elastic support, plus a point load
```

| Condition type                      | Kind             | Effect                                                    |
| ------------------------------------ | ---------------- | ----------------------------------------------------------- |
| `["fixed"]`                          | Essential         | `w = 0` and `theta = 0` (clamped support)                   |
| `["pinned"]` / `["deflection", v]`   | Essential         | `w = v` (default `v = 0`; roller/pin support)                |
| `["rotationFixed"]` / `["rotation", v]` | Essential      | `theta = v` (default `v = 0`)                                |
| `["force", v]`                       | Natural           | Applies a concentrated transverse force `v` at the node       |
| `["moment", v]`                      | Natural           | Applies a concentrated moment `v` at the node                 |
| `["spring", k, uRef]`                | Mixed (Robin)     | Transverse elastic support of stiffness `k` about `uRef` (default `uRef = 0`) |

## Running the Node.js Examples

#### 1. Create package.json with ES module support:

```bash
echo '{"type":"module"}' > package.json
```

#### 2. Install dependencies:

```bash
npm install feascript
```

#### 3. Run the example:

```bash
node Beam1DEuler_Bernoulli.js
```
