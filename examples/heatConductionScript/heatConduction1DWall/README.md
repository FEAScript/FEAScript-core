<img src="https://feascript.github.io/FEAScript-website/assets/FEAScriptHeatTransfer.png" width="80" alt="FEAScript Heat Conduction Logo">

## Heat Conduction Through a Wall

This example demonstrates solving a steady-state heat transfer problem in a 1D domain using the FEAScript library. The problem represents heat flow through a building wall, where heat conduction is modeled to determine temperature profiles under specific boundary conditions.

### Instructions

The example requires the `feascript` npm package and its peer dependencies (`mathjs`). It imports FEAScript directly from the npm package and runs the simulation in a Node.js environment, making it suitable for server-side applications or local development without a browser (no WEB APIs here). To run the example you should follow these instructions:

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
   node HeatConduction1DWall.js
   ```

   **Note:** For detailed information on the model setup, boundary conditions, and simulation results, refer to the comments in the JavaScript files and the corresponding [tutorial](https://feascript.com/tutorials/HeatConduction1DWall.html).