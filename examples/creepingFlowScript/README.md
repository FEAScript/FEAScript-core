<img src="https://feascript.github.io/FEAScript-website/assets/feascript-creeping-flow.png" width="80" 
alt="FEAScript creepingFlow Logo">

# Creeping Flow Examples

This directory contains Node.js examples demonstrating how to use the FEAScript library to solve steady creeping flow (Stokes) problems.

## Examples

#### 1. Lid-Driven Cavity (2D Creeping Flow) (`lidDrivenCavity2DCreepingFlow.js`)

This example solves a 2D lid-driven cavity flow using the creeping flow solver with Taylor-Hood (Q2-Q1) elements. For detailed information on the model setup, refer to the corresponding [tutorial](https://feascript.com/tutorials/lid-driven-cavity-2d-creeping-flow.html) on the FEAScript website.

## Running the Examples

#### 1. Create package.json with ES module support:

```bash
echo '{"type":"module"}' > package.json
```

#### 2. Install dependencies:

```bash
npm install feascript mathjs
```

#### 3. Run the example:

```bash
node lidDrivenCavity2DCreepingFlow.js
```

(for the "Lid-Driven Cavity (2D Creeping Flow)" example)
