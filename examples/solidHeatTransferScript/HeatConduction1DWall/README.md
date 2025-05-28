<img src="https://feascript.github.io/FEAScript-website/assets/FEAScriptHeatTransfer.png" width="80" alt="FEAScript Logo">

## Heat Conduction Through a Wall

This example demonstrates solving a steady-state heat transfer problem in a 1D domain using the FEAScript library. The problem represents heat flow through a building wall, where heat conduction is modeled to determine temperature profiles under specific boundary conditions.

### Instructions

The example requires the `feascript` npm package and its peer dependencies (`mathjs`). It imports FEAScript directly from the npm package and runs the simulation in a Node.js environment, making it suitable for server-side applications or local development without a browser. To run the example you should follow these instructions:

1. **Create package.json with ES module support:**

   ```bash
   echo '{"type":"module"}' > package.json
   ```

2. **Install FEAScript and dependencies:**

   ```bash
   npm install feascript mathjs
   ```

3. **Run the example:**
   ```bash
   node HeatConduction1DWall.js
   ```

**Note:** For an HTML version of this example, and additional details, refer to the corresponding [tutorial](https://feascript.com/tutorials/HeatConduction1DWall.html).
