<img src="https://feascript.github.io/FEAScript-website/assets/feascript-logo.png" width="80" alt="FEAScript Logo">

# General Form PDE Examples

This directory contains Node.js examples demonstrating how to use the FEAScript library to solve various partial differential equations in their general form.

## Examples

#### 1. Advection-Diffusion with Gaussian Source (advectionDiffusion1D)

This example demonstrates solving a one-dimensional advection-diffusion problem with a Gaussian source term. The problem models the transport of a substance under the effects of both diffusion and advection. For detailed information on the model setup refer to the corresponding [tutorial](https://feascript.com/tutorials/advection-diffusion-1d.html) in the FEAScript website.

## Running the Examples

#### 1. Create package.json with ES module support:

```bash
echo '{"type":"module"}' > package.json
```

#### 2. Install dependencies:

```bash
npm install feascript mathjs
```

#### 3. Run the example:

```bash
node advectionDiffusion1D.js
```

(for the "Advection-Diffusion with Gaussian Source" example)
