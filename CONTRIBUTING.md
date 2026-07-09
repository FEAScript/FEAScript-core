## Contributing to FEAScript

Thank you for your interest in contributing! FEAScript is in early development, with continuous additions of new features and improvements. To ensure a smooth and collaborative development process, please review and follow the guidelines below.

## Contents

- [Development Environment & Coding Style](#development-environment--coding-style)
- [Variable & File Naming](#variable--file-naming)
- [File Structure](#file-structure)
- [Branching & Workflow](#branching--workflow)
- [Local Testing](#local-testing)
- [Running the Node.js Examples](#running-the-nodejs-examples)

## Development Environment & Coding Style

- Use [Visual Studio Code](https://code.visualstudio.com/) with the [Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) for automatic code formatting
- Use a **110-character line width** to maintain consistent formatting
- Observe the code near your intended changes and aim to preserve that style in your modifications

## Variable & File Naming

- Use [camelCase](https://en.wikipedia.org/wiki/Camel_case) formatting for variable names throughout the code
- JavaScript source file names use camelCase (e.g., `logging.js`, `meshGeneration.js`, `newtonRaphson.js`)

### Exceptions

- Public entry file: `index.js` (standard entry point convention)
- Core model file: `FEAScript.js` (matches the library name)

## File Structure

All files in the FEAScript-core codebase should follow this structure:

1.  Banner: All files start with the FEAScript banner
2.  Imports:
    - External imports first, alphabetically ordered
    - Internal imports next, grouped by module/folder
3.  Classes/Functions: Implementation with proper JSDoc comments

Example:

```javascript
/**
 * ════════════════════════════════════════════════════════════
 *  FEAScript Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: {VERSION} | https://feascript.com
 *  MIT License © 2023–20xx FEAScript
 * ════════════════════════════════════════════════════════════
 */

// External imports
import { mathLibrary } from "math-package";

// Internal imports
import { relatedFunction } from "../utilities/helper.js";

/**
 * Class to handle specific functionality
 */
export class MyClass {
  /**
   * Constructor to initialize the class
   * @param {object} options - Configuration options
   */
  constructor(options) {
    // Implementation
  }

  /**
   * Function to perform a specific action
   * @param {number} input - Input value
   * @returns {number} Processed result
   */
  doSomething(input) {
    // Implementation
    return input * DEFAULT_VALUE;
  }
}
```

## Branching & Workflow

To contribute a new feature or fix:

- Do not commit directly to `main`
- Instead, create a short‑lived branch:
  - `feature/<topic>` for new functionality
  - `fix/<issue>` for bug fixes

External contributors:

1.  Fork the repo
2.  Branch from `main` in your fork
3.  Push and open a PR from your fork’s branch into `main`

## Local Testing

Before submitting a pull request, test your modifications by running the FEAScript library from a local directory. For example, you can load the library in your HTML file as follows:

```javascript
import { FEAScriptModel, plotSolution, printVersion } from "[USER_DIRECTORY]/FEAScript-core/src/index.js";
```

FEAScript can be run on a local server. You **must** start the server from the workspace root directory (the folder that contains both `FEAScript-core/` and `FEAScript-website/`), not from inside either subfolder. The HTML files use relative paths such as `../feascript-website.css` and `../../FEAScript-core/src/index.js` that only resolve correctly from that root.

```bash
# Navigate to the workspace root first
cd /path/to/FEAScript-workspace

# Then start the server
python3 -m http.server
```

The server will be available at `http://127.0.0.1:8000/`. Open a tutorial at its full path, e.g.:

```
http://127.0.0.1:8000/FEAScript-website/tutorials/solidification-front-2d-worker.html
```

Static file server npm packages like [serve](https://github.com/vercel/serve#readme) and [Vite](https://vite.dev/) can also be used.

## Running the Node.js Examples

All examples under `examples/` can be run directly with Node.js to verify the library works in a non-browser environment. Run them from the `FEAScript-core/` directory (so that the `feascript` package resolves via `node_modules`):

```bash
cd /path/to/FEAScript-workspace/FEAScript-core

# Heat conduction — 1D wall
node examples/heatConductionScript/heatConduction1DWall/heatConduction1DWall.js

# Heat conduction — 2D fin (structured mesh)
node examples/heatConductionScript/heatConduction2DFin/heatConduction2DFin.js

# Heat conduction — 2D fin (rectangular Gmsh mesh)
node examples/heatConductionScript/heatConduction2DFin/heatConduction2DFinGmsh.js

# Heat conduction — 2D rhomboid fin (Gmsh mesh)
node examples/heatConductionScript/heatConduction2DFin/heatConduction2DRhomFinGmsh.js

# Advection-diffusion — 1D with Gaussian source
node examples/generalFormPDEScript/advectionDiffusion1D/advectionDiffusion1D.js

# Solidification front propagation — 2D
node examples/frontPropagationScript/solidificationFront2D/solidificationFront2D.js

# Lid-driven cavity — 2D creeping flow
node examples/creepingFlowScript/lidDrivenCavity2DCreepingFlow/lidDrivenCavity2DCreepingFlow.js
```

Each script prints its computed solution array to the console. A successful run exits with code 0 and produces numerical output; any import or runtime error indicates a problem.

To run all examples in one go and check for failures:

```bash
for f in \
  examples/heatConductionScript/heatConduction1DWall/heatConduction1DWall.js \
  examples/heatConductionScript/heatConduction2DFin/heatConduction2DFin.js \
  examples/heatConductionScript/heatConduction2DFin/heatConduction2DFinGmsh.js \
  examples/heatConductionScript/heatConduction2DFin/heatConduction2DRhomFinGmsh.js \
  examples/generalFormPDEScript/advectionDiffusion1D/advectionDiffusion1D.js \
  examples/frontPropagationScript/solidificationFront2D/solidificationFront2D.js \
  examples/creepingFlowScript/lidDrivenCavity2DCreepingFlow/lidDrivenCavity2DCreepingFlow.js; do
  echo -n "  $f ... "
  node "$f" > /dev/null 2>&1 && echo "OK" || echo "FAILED"
done
```
