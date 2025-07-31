<img src="https://feascript.github.io/FEAScript-website/assets/FEAScriptFrontPropagation.png" width="80" alt="FEAScript Logo">

## Solidification Front Propagation in a Two-Dimensional Domain

This example demonstrates solving an eikonal equation in a two-dimensional domain using the FEAScript library. The problem represents a typical solidification front propagation scenario, where the objective is to track the movement of an interface, such as in metal cooling or crystal growth processes.

### Instructions

This example requires the `feascript` npm package and its peer dependencies (`mathjs`). It imports FEAScript directly from the npm package and runs the simulation in a Node.js environment. To run the example, follow these instructions:

1. **Create package.json with ES module support:**

   ```bash
   echo '{"type":"module"}' > package.json
   ```

2. **Install dependencies:**

   ```bash
   npm install feascript mathjs
   ```

3. **Run the example:**

   ```bash
   node SolidificationFront2D.js
   ```

**Note:** For detailed information on the model setup, boundary conditions, and simulation results, refer to the comments in the JavaScript files and the corresponding standard [tutorial](https://feascript.com/tutorials/SolidificationFront2D.html).
