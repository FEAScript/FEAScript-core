<img src="https://feascript.github.io/FEAScript-website/assets/FEAScriptLogo.png" width="80" alt="FEAScript Logo">

# FEAScript-core

[FEAScript](https://feascript.com/) is a lightweight finite element simulation library built in JavaScript. It empowers users to create and execute browser-based simulations for physics and engineering applications. This is the core library of FEAScript.

> 🚧 **FEAScript is currently under heavy development.** Functionality and interfaces may change rapidly as new features and enhancements are introduced. 🚧

## Getting Started

FEAScript is entirely implemented in pure JavaScript and requires only a simple HTML page to operate. All simulations are executed locally in your browser, without the need for any cloud services.

### Example Usage

```javascript
// Import FEAScript library
import { FEAScriptModel, plotSolution } from "https://core.feascript.com/src/index.js";

// Create and configure model
const model = new FEAScriptModel();
model.setSolverConfig("solverType"); // e.g., "solidHeatTransfer" for a stationary solid heat transfer case
model.setMeshConfig({ // Define mesh configuration (assuming a rectangular domain for 2D)
  meshDimension: "1D" | "2D", // Mesh dimension
  elementOrder: "linear" | "quadratic", // Element order
  numElementsX: number, // Number of elements in x-direction
  numElementsY: number, // Number of elements in y-direction (for 2D)
  maxX: number, // Domain length in x-direction
  maxY: number, // Domain length in y-direction (for 2D)
});

// Apply boundary conditions
model.addBoundaryCondition("boundaryIndex", ["conditionType", /* parameters */]);

// Solve
const { solutionVector, nodesCoordinates } = model.solve();

// Plot results
plotSolution(
  solutionVector,
  nodesCoordinates,
  model.solverConfig,
  model.meshConfig.meshDimension,
  "plotType", // e.g., "contour"
  "targetDivId" // HTML div ID for plot
);
```

Explore various examples and use cases of FEAScript [here](https://github.com/FEAScript/FEAScript-core/tree/main/examples).

## Contribute

We warmly welcome contributors to help expand and refine FEAScript. Please see the [CONTRIBUTING.md](./CONTRIBUTING.md) file for detailed guidance on how to contribute.

## License

The core library of FEAScript is released under the [MIT license](https://github.com/FEAScript/FEAScript-core/blob/main/LICENSE). &copy; 2023-2025 FEAScript.
