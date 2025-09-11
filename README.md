<img src="https://feascript.github.io/FEAScript-website/assets/FEAScriptLogo.png" width="80" alt="FEAScript Logo">

# FEAScript-core

[![npm version](https://img.shields.io/npm/v/feascript)](https://www.npmjs.com/package/feascript) 
<!-- [![liberapay](https://img.shields.io/liberapay/receives/FEAScript.svg?logo=liberapay)](https://liberapay.com/FEAScript/) -->

[FEAScript](https://feascript.com/) is a lightweight finite element simulation library built in JavaScript. It empowers users to create and execute simulations for physics and engineering applications in both browser-based and server-side environments. This is the core library of the FEAScript project.

> 🚧 **FEAScript is currently under heavy development.** Its functionality and interfaces may change rapidly as new features and enhancements are introduced.

## Contents

- [Ways to Use FEAScript](#ways-to-use-feascript)
  - [JavaScript API (FEAScript Core)](#javascript-api-feascript-core)
    - [Use FEAScript in the Browser](#use-feascript-in-the-browser)
    - [Use FEAScript with Node.js](#use-feascript-with-nodejs)
    - [Use FEAScript with Scribbler](#use-feascript-with-scribbler)
  - [Visual Editor (FEAScript Platform)](#visual-editor-feascript-platform)
- [Quick Example](#quick-example)
- [Support FEAScript](#support-feascript)
- [Contributing](#contributing)
- [License](#license)

## Ways to Use FEAScript

FEAScript offers two main approaches to creating simulations:

1. **[JavaScript API (FEAScript Core)](#javascript-api-feascript-core)** – For developers comfortable with coding, providing full programmatic control in browsers, Node.js, or interactive notebooks.
2. **[Visual Editor (FEAScript Platform)](#visual-editor-feascript-platform)** – For users who prefer a no-code approach, offering a block-based visual interface built with [Blockly](https://developers.google.com/blockly).

Each approach is explained in detail below.

### JavaScript API (FEAScript Core)

The JavaScript API is the core programmatic interface for FEAScript. Written entirely in pure JavaScript, it runs in three environments:

1. **[In the browser](#use-feascript-in-the-browser)** – Use FEAScript in a simple HTML page, running simulations locally without additional installations or cloud services.
2. **[With Node.js](#use-feascript-with-nodejs)** – Use FEAScript in server-side JavaScript applications or CLI tools.
3. **[With Scribbler](#use-feascript-with-scribbler)** – Use FEAScript in the [Scribbler](https://scribbler.live/) interactive JavaScript notebook environment.

#### Use FEAScript in the Browser

You can use FEAScript in browser environments in two ways:

- **Import from Hosted ESM Build:**

  ```html
  <script type="module">
    import { FEAScriptModel } from "https://core.feascript.com/dist/feascript.esm.js";
  </script>
  ```

- **Download and Use Locally:**

  You can download the latest stable release from [GitHub Releases](https://github.com/FEAScript/FEAScript-core/releases).

  ```html
  <script type="module">
    import { FEAScriptModel } from "./path/to/dist/feascript.esm.js";
  </script>
  ```

👉 Explore browser-based tutorials on our [website](https://feascript.com/#tutorials).

#### Use FEAScript with Node.js

Install FEAScript and its peer dependencies from npm as follows:

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

When running examples from within this repository, this step isn’t needed as the root package.json already has the proper configuration.

👉 Explore Node.js use cases on the [examples directory](https://github.com/FEAScript/FEAScript-core/tree/main/examples).

#### Use FEAScript with Scribbler

FEAScript also works well in interactive JavaScript notebook environments where you can write code, visualize results inline, and share your work with others. [Scribbler](https://scribbler.live/) is one such platform that comes with preloaded scientific libraries, making it an excellent choice for FEAScript simulations.

👉 Explore FEAScript notebook examples on the [Scribbler Hub](https://hub.scribbler.live/portfolio/#!nikoscham/FEAScript-Scribbler-examples).

### Visual Editor (FEAScript Platform)

For users who prefer a visual approach to creating simulations, we offer the [FEAScript Platform](https://platform.feascript.com/) - a browser-based visual editor built on the [Blockly](https://developers.google.com/blockly) library. This no-code interface allows you to:

- Build and run finite element simulations directly in your browser by connecting visual blocks together
- Create complex simulations without writing any JavaScript code
- Save and load projects in XML format for easy sharing and reuse

While FEAScript's JavaScript API offers full programmatic control for advanced customization, the FEAScript Platform provides an accessible entry point for users without coding experience.

👉 Explore various FEAScript Platform examples on our [website](https://feascript.com/#tutorials).

## Quick Example

Here is a minimal browser-based example using the JavaScript API. Adapt paths, solver types, and boundary conditions as needed for your specific problem:

```html
<body>
  <!-- ...body region... -->
  <script type="module">
    // Import FEAScript library
    import { FEAScriptModel } from "https://core.feascript.com/dist/feascript.esm.js";

    window.addEventListener("DOMContentLoaded", () => {
      // Create a new FEAScript model
      const model = new FEAScriptModel();

      // Set the solver type for your problem
      model.setSolverConfig("solverType"); // Example: "solidHeatTransferScript"

      // Configure the mesh
      model.setMeshConfig({
        meshDimension: "1D", // Choose either "1D" or "2D"
        elementOrder: "linear", // Choose either "linear" or "quadratic"
        numElementsX: 10, // Number of elements in x-direction
        numElementsY: 6, // Number of elements in y-direction (for 2D only)
        maxX: 1.0, // Domain length in x-direction
        maxY: 0.5, // Domain length in y-direction (for 2D only)
      });

      // Add boundary conditions with appropriate parameters
      model.addBoundaryCondition("boundaryIndex", ["conditionType" /* parameters */]); // Example boundary condition

      // Solve the problem
      const { solutionVector, nodesCoordinates } = model.solve();
    });
  </script>
  <!-- ...rest of body region... -->
</body>
```

**Note:** The code above uses placeholder values that you should replace with appropriate options, e.g.:

- "solverType" should be replaced with an actual solver type such as "solidHeatTransferScript" for heat conduction problems
- "conditionType" should be replaced with an actual boundary condition type such as "constantTemp"
- "boundaryIndex" should be replaced with a string identifying the boundary

## Support FEAScript

> 💖 **If you find FEAScript useful, please consider supporting its development through a donation:**

<a href="https://liberapay.com/FEAScript/donate">
  <img alt="Donate using Liberapay" src="https://liberapay.com/assets/widgets/donate.svg">
</a>

Your support helps ensure the continued development and maintenance of this project.

## Contributing

We warmly welcome contributors to help expand and refine FEAScript. Please see the [CONTRIBUTING.md](./CONTRIBUTING.md) file for detailed guidance on how to contribute.

## License

The core library of FEAScript is released under the [MIT license](https://github.com/FEAScript/FEAScript-core/blob/main/LICENSE). &copy; 2023-2025 FEAScript.
