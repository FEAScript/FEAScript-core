<img src="https://feascript.github.io/FEAScript-website/assets/FEAScriptLogo.png" width="80" alt="FEAScript Logo">

# FEAScript-core

[FEAScript](https://feascript.com/) is a lightweight finite element simulation library built in JavaScript. It empowers users to create and execute browser-based simulations for physics and engineering applications. This is the core library of FEAScript.

> 🚧 **FEAScript is currently under heavy development.** Functionality and interfaces may change rapidly as new features and enhancements are introduced. 🚧

## Installation

FEAScript is entirely implemented in pure JavaScript and requires only a simple HTML page to operate. All simulations are executed locally in your browser, without the need for any cloud services. You can use FEAScript in your projects through one of the following methods:

### Option 1: NPM Installation

```bash
# Install FEAScript and its peer dependencies
npm install feascript mathjs plotly.js
```

Then import it in your JavaScript/TypeScript file:

```javascript
// ES Modules
import { FEAScriptModel, plotSolution } from "feascript";

// CommonJS
const { FEAScriptModel, plotSolution } = require("feascript");
```

**Important:** FEAScript is built as an ES module. If you're starting a new project, make sure to configure it to use ES modules by running:

```bash
# Create package.json with type=module for ES modules support
echo '{"type":"module"}' > package.json
```

If you already have a package.json file, manually add `"type": "module"` to enable ES modules in your project.

### Option 2: Direct Import from CDN

Add this line to your HTML or JavaScript module:

```javascript
import { FEAScriptModel, plotSolution } from "https://core.feascript.com/dist/feascript.esm.js";
```

### Option 3: Download and Use Locally

1. Download the latest release from [GitHub Releases](https://github.com/FEAScript/FEAScript-core/releases)
2. Include it in your project:

```html
<script type="module">
  import { FEAScriptModel, plotSolution } from "./path/to/dist/feascript.esm.js";
  // Your code here
</script>
```

### Example Usage

```javascript
// Import FEAScript library
import { FEAScriptModel, plotSolution } from "https://core.feascript.com/dist/feascript.esm.js";

// Create and configure model
const model = new FEAScriptModel();
model.setSolverConfig("solverType"); // e.g., "solidHeatTransfer" for a stationary solid heat transfer case
model.setMeshConfig({
  // Define mesh configuration (assuming a rectangular domain for 2D)
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
