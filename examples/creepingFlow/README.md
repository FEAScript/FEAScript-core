<img src="https://feascript.github.io/FEAScript-website/assets/feascript-creeping-flow.png" width="80" alt="FEAScript creeping flow logo">

# Creeping Flow Examples

This directory contains Node.js examples demonstrating how to use the FEAScript library to solve
steady creeping flow (Stokes) problems.

## Examples

### 1. Creeping Flow on a Lid-Driven 2D Cavity (`lidDrivenCavity2DCreepingFlow.js`)

This example solves a 2D lid-driven cavity flow using the creeping flow solver with Taylor-Hood
(Q2-Q1) elements. For detailed information on the model setup, refer to the corresponding
[tutorial](https://feascript.com/tutorials/lid-driven-cavity-2d-creeping-flow.html) on the
FEAScript website.

### 2. Couette Flow in a 2D Channel (`couetteFlow2DCreepingFlow.js`)

A channel whose top wall moves with velocity U, with a fixed bottom wall and stress-free (open)
ends. The exact solution is the linear velocity profile u = U y / H with v = 0 and zero pressure,
which the Taylor-Hood elements reproduce exactly. The example prints the velocity along the left
end and the largest deviation from the exact solution.

### 3. Creeping Flow Through a 2D Pillar Array (`pillarArray2DCreepingFlow.js`)

A channel 8 long and 2 high with a staggered array of 8 round pillars, on an unstructured Gmsh mesh
of quadratic triangles (`pillar_triang_quadratic.msh`, P2-P1 Taylor-Hood elements). The inlet has a uniform
velocity u = 1, the walls and pillars are no-slip and the outlet is stress-free. The example prints
the largest velocity and the flow rate through the inlet and the outlet. The two flow rates differ by
about 2%: Taylor-Hood elements conserve mass only in the weak sense, and the rates are summed from
the boundary nodes. The inlet rate is below 2 because the corner nodes belong to the no-slip walls.
The mesh is generated from `pillar.geo`, in the tutorials directory of the FEAScript website.

## Running the Node.js examples

### 1. Create `package.json` with ES module support

```bash
echo '{"type":"module"}' > package.json
```

### 2. Install dependencies

```bash
npm install feascript
```

### 3. Run an example

From this directory, run any of the examples:

```bash
node lidDrivenCavity2DCreepingFlow/lidDrivenCavity2DCreepingFlow.js
node couetteFlow2DCreepingFlow/couetteFlow2DCreepingFlow.js
node pillarArray2DCreepingFlow/pillarArray2DCreepingFlow.js
```
