<img src="https://feascript.github.io/FEAScript-website/assets/FEAScriptGeneralFormPDE.png" width="80" alt="FEAScript General Form PDE Logo">

## Advection-Diffusion with Gaussian Source

This example demonstrates solving a one-dimensional advection-diffusion problem with a Gaussian source term using the FEAScript library. The problem models the transport equation:

$$
\frac{d^2u}{dx^2} - 10 \frac{du}{dx} = 10 \cdot e^{-200 \cdot (x - 0.5)^2}
$$

This can be written in the general form as:

$$
\frac{d}{dx}\left(A(x)\frac{du}{dx}\right) + B(x)\frac{du}{dx} + C(x)u = D(x)
$$

where:

- $A(x) = 1$ (diffusion coefficient)
- $B(x) = -10$ (advection coefficient)
- $C(x) = 0$ (no reaction term)
- $D(x) = 10 \cdot e^{-200 \cdot (x - 0.5)^2}$ (Gaussian source term centered at x = 0.5)

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
