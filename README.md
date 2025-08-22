<img src="https://feascript.github.io/FEAScript-website/assets/FEAScriptLogo.png" width="80" alt="FEAScript Logo">

# FEAScript-core

[![npm version](https://img.shields.io/npm/v/feascript)](https://www.npmjs.com/package/feascript) <img src="https://img.shields.io/liberapay/receives/FEAScript.svg?logo=liberapay">

[FEAScript](https://feascript.com/) is a lightweight finite element simulation library built in JavaScript. It empowers users to create and execute simulations for physics and engineering applications in both browser-based and server-side environments. This is the core library of FEAScript.

> 🚧 **FEAScript is currently under heavy development.** Functionality and interfaces may change rapidly as new features and enhancements are introduced. 🚧

## Contents

- [Installation](#installation)
- [Example Usage](#example-usage)
- [FEAScript Platform](#feascript-platform)
- [Contribute](#contribute)
- [License](#license)

## Installation

FEAScript is entirely implemented in pure JavaScript and can run in two environments:

1. **In the browser** with a simple HTML page, where all simulations are executed locally without any installations or using any cloud services.
2. **Via Node.js** with plain JavaScript files, for server-side simulations.

### Option 1: In the Browser

You can use FEAScript in browser environments in two ways:

**Direct Import from the Web (ES Module):**

```html
<script type="module">
  import { FEAScriptModel } from "https://core.feascript.com/dist/feascript.esm.js";
</script>
```

**Download and Use Locally:**

```html
<script type="module">
  import { FEAScriptModel } from "./path/to/dist/feascript.esm.js";
</script>
```

You can Download the latest release from [GitHub Releases](https://github.com/FEAScript/FEAScript-core/releases). Explore various browser-based examples and use cases in our [website](https://feascript.com/#tutorials).

### Option 2: Via Node.js

Install FEAScript and its peer dependencies from npm:

```bash
npm install feascript mathjs plotly.js
```

Then, import it in your JavaScript file:

```javascript
import { FEAScriptModel } from "feascript";
```

**Important:** FEAScript is built as an ES module. If you're starting a completely new project (outside this repository), make sure to configure it to use ES modules by:

```bash
# Create package.json with type=module for ES modules support
echo '{"type":"module"}' > package.json
```

When running examples from within this repository, this step is not needed as the root package.json already has the proper configuration. Explore various Node.js examples and use cases [here](https://github.com/FEAScript/FEAScript-core/tree/main/examples).

## Example Usage

This is an indicative example of FEAScript, shown for execution in the browser. Adapt paths, solver types, and boundary conditions as needed for your specific problem:

```html
<body>
  <!-- ...body region... -->
  <script type="module">
    // Import FEAScript library
    import { FEAScriptModel } from "https://core.feascript.com/dist/feascript.esm.js";

    window.addEventListener("DOMContentLoaded", async () => {
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
      model.addBoundaryCondition("boundaryIndex", ["conditionType" /* parameters */]);

      // Solve
      const { solutionVector, nodesCoordinates } = model.solve();
    });
  </script>
  <!-- ...continue of body region... -->
</body>
```

## FEAScript Platform

For users who prefer a visual approach to creating simulations, we offer the [FEAScript platform](https://platform.feascript.com/) - a browser-based visual editor built on the [Blockly](https://developers.google.com/blockly) library. This no-code interface allows you to:

- Build and run finite element simulations directly in your browser by connecting visual blocks
- Create complex simulations without writing any JavaScript code
- Save and load projects in XML format for easy sharing and reuse

While FEAScript's JavaScript API offers full programmatic control for advanced customization, the FEAScript platform provides an accessible entry point for users without coding experience.

## Contribute

We warmly welcome contributors to help expand and refine FEAScript. Please see the [CONTRIBUTING.md](./CONTRIBUTING.md) file for detailed guidance on how to contribute.

## License

The core library of FEAScript is released under the [MIT license](https://github.com/FEAScript/FEAScript-core/blob/main/LICENSE). &copy; 2023-2025 FEAScript.
