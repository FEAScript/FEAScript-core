<!-- Image placeholder -->
<img src="https://feascript.github.io/FEAScript-website/assets/FEAScriptGenPDE.png" width="80" alt="FEAScript Logo">

## General Form PDE Solver

This example demonstrates solving a general form partial differential equation using the FEAScript library. The problem models equations of the form:

$$
\frac{d}{dx}\left(A(x)\frac{du}{dx}\right) + B(x)\frac{du}{dx} + C(x)u = D(x)
$$

where $u$ is the unknown function, $x$ is the position, and $A$, $B$, $C$, $D$ are user-provided coefficient functions.

### Available Versions

This example is available in the following implementations:

1. **Advection-Diffusion with Gaussian Source** (`advectionDiffusion1D.js`) - Demonstrates an advection-diffusion problem with a Gaussian source term

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
   node advectionDiffusion1D.js
   ```