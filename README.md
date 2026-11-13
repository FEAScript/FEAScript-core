<img src="https://feascript.github.io/FEAScript-website/assets/feascript-logo.png" width="80" alt="FEAScript Logo">

# FEAScript-core

[![GitHub release](https://img.shields.io/github/v/release/FEAScript/FEAScript-core?logo=github)](https://github.com/FEAScript/FEAScript-core/releases)
[![npm version](https://img.shields.io/npm/v/feascript)](https://www.npmjs.com/package/feascript)
[![Last Commit](https://img.shields.io/github/last-commit/FEAScript/FEAScript-core?logo=github)](https://github.com/FEAScript/FEAScript-core/commits/main)
[![License](https://img.shields.io/github/license/FEAScript/FEAScript-core?logo=github)](https://github.com/FEAScript/FEAScript-core/blob/main/LICENSE)

<img src="https://feascript.com/assets/favicon.ico" alt="FEAScript Icon" width="18" height="18"> **[FEAScript](https://feascript.com/) is a finite element simulation library developed in JavaScript**. It runs engineering simulations in the browser or in Node.js, with no desktop software to install. <br>🎯 **A JavaScript API for FEM:** you set up the model, solve it and plot the results in JavaScript, and you can build the simulation into your own web pages and applications. This is the core library of the FEAScript project.

<img src="https://feascript.github.io/FEAScript-website/assets/cold-plate-logo-results-and-mesh.gif" width="300" alt="Results of heat conduction around the FEAScript logo">

> 🚧 **FEAScript is in development, and each release adds features.** Its API may change between minor releases; see the [changelog](CHANGELOG.md). [Donations](https://github.com/sponsors/FEAScript) pay for development time, documentation and tutorials.

## Contents

- [Features](#features)
- [How to use FEAScript](#how-to-use-feascript)
- [Examples](#examples)
- [Help FEAScript grow](#help-feascript-grow)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Physics models:** creeping (Stokes) flow, Euler–Bernoulli beam bending, front propagation, heat conduction, general-form PDE (linear and nonlinear)
- **Geometry and meshing:** a geometry (line, rectangle, or polygon with holes) with named boundaries, meshed with quadrilaterals (mapped grid) or triangles (Delaunay refinement, graded by position, built on [Delaunator](https://github.com/mapbox/delaunator) and [Constrainautor](https://github.com/kninnug/Constrainautor)), and unstructured mesh import from Gmsh (`.msh`) with quadrilateral and triangular elements (linear and quadratic)
- **Solvers:** frontal, Jacobi (CPU/WebGPU) and LU, Newton–Raphson for nonlinear systems
- **Spatially varying coefficients:** `thermalConductivity(x, y)` and `heatSource(x, y)` can be scalars or functions, evaluated at each Gauss point
- **Performance:** web worker support for multi-threaded computation
- **Visualization:** interactive rendering with vtk.js and Plotly

## How to use FEAScript

You can run simulations with FEAScript by calling its functions from JavaScript (the FEAScript API). The API is the core programmatic interface for FEAScript and works across multiple environments, including the browser (simple HTML pages and online JavaScript playgrounds, e.g. CodePen and Scribbler) and server-side runtimes such as Node.js. The most common ways to use FEAScript are outlined below:

1. **[In the browser](#use-feascript-in-the-browser)** – Run FEAScript directly in a simple HTML page to perform simulations locally with no additional installations or cloud services required.
2. **[In JavaScript playgrounds](#use-feascript-in-javascript-playgrounds)** – Try FEAScript in interactive JavaScript playgrounds such as CodePen or Scribbler.
3. **[With Node.js](#use-feascript-with-nodejs)** – Use FEAScript in server-side JavaScript applications.

The **[FEAScript documentation](https://docs.feascript.com)** covers installation, the physical models and their equations, meshes, boundary conditions, solvers and the full API reference.

### Use FEAScript in the browser

You can use FEAScript in browser environments in three ways:

- **Import from CDN (jsDelivr):**

  ```html
  <script type="module">
    import { FEAScriptModel } from "https://cdn.jsdelivr.net/gh/FEAScript/FEAScript-core/dist/feascript.esm.js";
  </script>
  ```

- **Import from hosted ESM build:**

  ```html
  <script type="module">
    import { FEAScriptModel } from "https://core.feascript.com/dist/feascript.esm.js";
  </script>
  ```

  > **Note:** Both URLs above always serve the latest FEAScript release, so your page updates automatically when a new version is published (new versions may include breaking changes). To freeze your page to a specific version, add a version tag to the jsDelivr URL:
  >
  > ```html
  > <script type="module">
  >   import { FEAScriptModel } from "https://cdn.jsdelivr.net/gh/FEAScript/FEAScript-core@0.3.1/dist/feascript.esm.js";
  > </script>
  > ```

- **Download and use locally:**

  You can download the latest stable release from [GitHub Releases](https://github.com/FEAScript/FEAScript-core/releases).

  ```html
  <script type="module">
    import { FEAScriptModel } from "./path/to/dist/feascript.esm.js";
  </script>
  ```

👉 Explore browser-based tutorials on our [website](https://feascript.com/tutorials/).

### Use FEAScript in JavaScript playgrounds

FEAScript works well in interactive JavaScript playgrounds where you can write code, visualize results inline, and share your work.

👉 Explore the following examples:

- [CodePen (interactive pens)](https://codepen.io/FEAScript)
- [Scribbler (notebooks)](https://hub.scribbler.live/portfolio/#!nikoscham/FEAScript-Scribbler-examples)

### Use FEAScript with Node.js

Install FEAScript and its peer dependencies from npm as follows:

```bash
npm install feascript
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

## Examples

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
      model.setModelConfig("physicsModel", { solver: { method: "lusolve" } }); // Example: "heatConduction"

      // Define the geometry: a line, a rectangle, or a polygon with holes and named boundaries
      model.setGeometry({ rectangle: [1.0, 0.5] }); // Boundaries "bottom", "right", "top", "left"

      // Configure the mesh: quadrilaterals (rectangles) or triangles (any polygon), and the element size
      model.setMeshConfig({
        elements: "quadrilaterals", // Choose either "quadrilaterals" or "triangles"
        elementOrder: "linear", // Choose either "linear" or "quadratic"
        size: 0.1, // Length of an element side (or divisions: [10, 5] for quadrilaterals)
      });

      // Add boundary conditions by boundary name: the condition type and its named parameters
      model.addBoundaryCondition("top", { type: "conditionType" /* , parameters */ }); // Example boundary condition

      // Solve the problem
      const { solutionVector, nodesCoordinates } = model.solve();
    });
  </script>
  <!-- ...rest of body region... -->
</body>
```

**Note:** The code above uses placeholder values that you should replace with appropriate options, e.g.:

- "physicsModel" should be replaced with an actual physics model such as "heatConduction" for heat conduction problems
- "conditionType" should be replaced with an actual boundary condition type with its parameters, such as
  `{ type: "constantTemperature", temperature: 100 }` or `{ type: "convection", h: 1, ambientTemperature: 20 }`
- `solver` selects the linear solver: `method` is "lusolve" (the default), "jacobi" or "frontal", and the
  iterative methods also take `maxIterations` and `tolerance`
- "top" is the name of a boundary of the geometry: "left" and "right" for a line, "bottom", "right", "top" and "left" for a rectangle, the names you give the edges of a polygon, or the names of the physical groups of a Gmsh mesh

Furthermore, the scripts under `examples/` contain Node.js examples. You can run them from the `FEAScript-core/` directory as follows:

```bash
node examples/heatConduction/heatConduction1DWall/heatConduction1DWall.js
```

Each script prints its computed solution to the console.

## Help FEAScript grow

> 💖 **If you find FEAScript useful, please consider supporting its development through a donation**. Your support helps fund new features, performance improvements, documentation and tutorials:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub%20Sponsors-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/FEAScript)
[![Donate on Liberapay](https://img.shields.io/badge/Donate-Liberapay-F6C915?logo=liberapay&logoColor=black)](https://liberapay.com/FEAScript/donate)

> 📨 You can also join the **FEAScript mailing list** to receive project updates and news: [Subscribe here](https://mailchi.mp/e29600955ffe/join-the-mailing-list)

## Contributing

We warmly welcome contributors to help expand and refine FEAScript. Please see the [CONTRIBUTING.md](./CONTRIBUTING.md) file for detailed guidance on how to contribute.

## License

The core library of FEAScript is released under the [MIT license](LICENSE). © 2023-2026 FEAScript.
