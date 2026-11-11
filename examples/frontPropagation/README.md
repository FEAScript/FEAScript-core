<img src="https://feascript.github.io/FEAScript-website/assets/feascript-front-propagation.png" width="80" alt="FEAScript front propagation logo">

# Front Propagation Examples

This directory contains Node.js examples demonstrating how to use the FEAScript library to solve
front propagation problems using the eikonal equation.

## Examples

### 1. Solidification Front Propagation in a 2D Domain (`solidificationFront2D.js`)

This example demonstrates solving an eikonal equation in a 2D domain to track the movement of a
solidification interface. For detailed information on the model setup, refer to the corresponding
[tutorial](https://feascript.com/tutorials/solidification-front-2d.html) on the FEAScript website.

## Running the Node.js examples

### 1. Create `package.json` with ES module support

```bash
echo '{"type":"module"}' > package.json
```

### 2. Install dependencies

```bash
npm install feascript
```

### 3. Run an example

From this directory, run any of the examples:

```bash
node solidificationFront2D/solidificationFront2D.js
```
