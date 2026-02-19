<img src="https://feascript.github.io/FEAScript-website/assets/feascript-logo.png" width="80" alt="FEAScript Logo">

# FEAScript-core

[![npm version](https://img.shields.io/npm/v/feascript)](https://www.npmjs.com/package/feascript)

[FEAScript](https://feascript.com/) is a lightweight finite element simulation library written in JavaScript. It empowers users to perform simulations for physics and engineering applications in both browser-based and server-side environments. This is the core library of the FEAScript project.

<img src="https://feascript.github.io/FEAScript-website/assets/cold-plate-logo-results-and-mesh.gif" width="300" alt="Results of heat conduction around the FEAScript logo"> <br/>

> 🚧 **FEAScript is currently under heavy development.** Its functionality and interfaces may change rapidly as new features and enhancements are introduced.

## Contents

- [How to Use FEAScript](#ways-to-use-feascript)
  - [Use FEAScript in the Browser](#use-feascript-in-the-browser)
  - [Use FEAScript with Node.js](#use-feascript-with-nodejs)
  - [Use FEAScript in JavaScript Playgrounds](#use-feascript-in-javascript-playgrounds)
- [Quick Example](#quick-example)
- [Support FEAScript](#support-feascript)
- [Contributing](#contributing)
- [License](#license)

## How to Use FEAScript

You can run simulations with FEAScript by calling its functions from JavaScript (the FEAScript API). The API is the core programmatic interface for FEAScript and works across multiple environments, including the browser (simple HTML pages and online JavaScript playgrounds, e.g. [CodePen](https://codepen.io/) and [Scribbler](https://scribbler.live/)) and server-side runtimes such as Node.js. The most common ways to use FEAScript are outlined below:

1. **[In the browser](#use-feascript-in-the-browser)** – Run FEAScript directly in a simple HTML page to perform simulations locally with no additional installations or cloud services required.
2. **[In JavaScript playgrounds](#use-feascript-in-javascript-playgrounds)** – Try FEAScript in interactive JavaScript playgrounds such as [CodePen](https://codepen.io/FEAScript) or [Scribbler](https://hub.scribbler.live/portfolio/#!nikoscham/FEAScript-Scribbler-examples).
3. **[With Node.js](#use-feascript-with-nodejs)** – Use FEAScript in server-side JavaScript applications.

#### Use FEAScript in the Browser

You can use FEAScript in browser environments in three ways:

- **Import from Hosted ESM Build:**

  ```html
  <script type="module">
    import { FEAScriptModel } from "https://core.feascript.com/dist/feascript.esm.js";
  </script>
  ```

- **Import from CDN:**

  ```html
  <script type="module">
    import { FEAScriptModel } from "https://cdn.jsdelivr.net/gh/FEAScript/FEAScript-core/dist/feascript.esm.js";
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

#### Use FEAScript in JavaScript Playgrounds

FEAScript works well in interactive JavaScript playgrounds where you can write code, visualize results inline, and share your work.

👉 Explore the following examples:

- [CodePen (interactive pens)](https://codepen.io/FEAScript)
- [Scribbler (notebooks)](https://hub.scribbler.live/portfolio/#!nikoscham/FEAScript-Scribbler-examples)

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

## Quick Example

Here is a minimal browser-based example using the FEAScript API. Adapt paths, physics model, and boundary conditions as needed for your specific problem:

```html
<body>
  <!-- ...body region... -->
  <script type="module">
    // Import FEAScript library
    import { FEAScriptModel } from "https://core.feascript.com/dist/feascript.esm.js";

    window.addEventListener("DOMContentLoaded", () => {
      // Create a new FEAScript model
      const model = new FEAScriptModel();

      // Select physics/PDE
      model.setModelConfig("physicsModel"); // Example: "heatConductionScript"

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

- "physicsModel" should be replaced with an actual solver type such as "heatConductionScript" for heat conduction problems
- "conditionType" should be replaced with an actual boundary condition type such as "constantTemp"
- "boundaryIndex" should be replaced with a string identifying the boundary

## Support FEAScript

> 💖 **If you find FEAScript useful, please consider supporting its development through a donation:**

<a href="https://github.com/sponsors/FEAScript">
  <img alt="GitHub Sponsors" src="https://feascript.github.io/FEAScript-website/assets/Sponsor_GitHub.svg">
</a>
<a href="https://liberapay.com/FEAScript/donate">
  <img alt="Donate using Liberapay" src="https://feascript.github.io/FEAScript-website/assets/Sponsor_Liberapay.svg">
</a>

Your support helps ensure the continued development and maintenance of this project.

## Contributing

We warmly welcome contributors to help expand and refine FEAScript. Please see the [CONTRIBUTING.md](./CONTRIBUTING.md) file for detailed guidance on how to contribute.

## License

The core library of FEAScript is released under the [MIT license](https://github.com/FEAScript/FEAScript-core/blob/main/LICENSE). &copy; 2023-2025 FEAScript.
