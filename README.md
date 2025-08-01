<img src="https://feascript.github.io/FEAScript-website/assets/FEAScriptLogo.png" width="80" alt="FEAScript Logo">

# FEAScript-core

[FEAScript](https://feascript.com/) is a lightweight finite element simulation library built in JavaScript. It empowers users to create and execute simulations for physics and engineering applications in both browser-based and server-side environments. This is the core library of FEAScript.

> 🚧 **FEAScript is currently under heavy development.** Functionality and interfaces may change rapidly as new features and enhancements are introduced. 🚧

## Installation

FEAScript is entirely implemented in pure JavaScript and can run in two environments:

1. **In the browser** with a simple HTML page, where all simulations are executed locally without any installations or using any cloud services
2. **Via Node.js** with plain JavaScript files, for server-side simulations

### Option 1: In the Browser

You can use FEAScript in browser environments in two ways:

**Direct Import from CDN**:
Add this to your HTML file:

```html
<script type="module">
  import { FEAScriptModel } from "https://core.feascript.com/dist/feascript.esm.js";
</script>
```

**Download and Use Locally**:
1. Download the latest release from [GitHub Releases](https://github.com/FEAScript/FEAScript-core/releases)
2. Include it in your HTML file:

```html
<script type="module">
  import { FEAScriptModel } from "./path/to/dist/feascript.esm.js";
</script>
```

For browser-based examples and use cases, visit [our website tutorials](https://feascript.com/#tutorials).

### Option 2: Via Node.js

```bash
# Install FEAScript and its peer dependencies
npm install feascript mathjs plotly.js
```

Then import it in your JavaScript/TypeScript file:

```javascript
import { FEAScriptModel } from "feascript";
```

**Important:** FEAScript is built as an ES module. If you're starting a completely new project (outside this repository), make sure to configure it to use ES modules by (when running examples from within this repository, this step is not needed as the root package.json already has the proper configuration):

```bash
# Create package.json with type=module for ES modules support
echo '{"type":"module"}' > package.json
```

Explore various Node.js examples and use cases [here](https://github.com/FEAScript/FEAScript-core/tree/main/examples).

## Example Usage

**Browser Import:**
```javascript
// Import FEAScript library in browser
import { FEAScriptModel } from "https://core.feascript.com/dist/feascript.esm.js";
```

**Node.js Import:**
```javascript
// Import FEAScript library in Node.js
import { FEAScriptModel } from "feascript";
```
```javascript
// Create and configure model
const model = new FEAScriptModel();
model.setSolverConfig("solverType"); // e.g., "solidHeatTransfer" for a stationary solid heat transfer case
model.setMeshConfig({
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
model.setSolverMethod("linearSolver"); // lusolve (via mathjs) or jacobi
const { solutionVector, nodesCoordinates } = model.solve();
```

## Contribute

We warmly welcome contributors to help expand and refine FEAScript. Please see the [CONTRIBUTING.md](./CONTRIBUTING.md) file for detailed guidance on how to contribute.

## License

The core library of FEAScript is released under the [MIT license](https://github.com/FEAScript/FEAScript-core/blob/main/LICENSE). &copy; 2023-2025 FEAScript.
