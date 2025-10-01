# Example: 1D General PDE Solver

This example demonstrates how to use the FEAScript 1D general PDE solver for equations of the form:

$$
\frac{d}{dx}\left(A(x)\frac{du}{dx}\right) + B(x)\frac{du}{dx} + C(x)u = D(x)
$$

where $u$ is the unknown, $x$ is the position, and $A$, $B$, $C$, $D$ are user-provided coefficient functions.

## How to Run

1. **Set up the mesh:**
   - Here, we use a uniform mesh from 0 to 1 with 20 nodes.
2. **Define coefficient functions:**
   - For the Given equation $-\frac{d^2u}{dx^2} = 1$, set $A(x) = 1$, $B(x) = 10$,
    $C(x) = 0$, $D(x) = -10 * exp(-200 * (x - 0.5)²)$, for 0 < x < 1.
3. **Set boundary conditions:**
   - Dirichlet boundaries: $u(0) = 1$, $u(1) = 0$.
4. **Solve and print results:**
   - The solution vector $u$ will be printed for each mesh node.

## Example Code

```js
const { generalFormPDESolver } = require("../../src/solvers/generalFormPDEScript");

// Generate a uniform mesh from 0 to 1 with 20 nodes
const nNodes = 20;
const mesh = Array.from({ length: nNodes }, (_, i) => i / (nNodes - 1));

// Coefficient functions for Given equation: d²u/dx² + 10 du/dx = -10 * exp(-200 * (x - 0.5)²), for 0 < x < 1
const A = x => 1; // Diffusion coefficient
const B = x => 0; // No first derivative term
const C = x => 0; // No reaction term
const D = x => 1; // Source function D(X)


// Dirichlet left boundary conditions: u(0) = 1, and Neumann right boundry conditions: u(1) = 0
const boundary = {
    left: { type: 'dirichlet', value: 1 },
    right: { type: 'neumann', value: 0 }
};

// Solve
const u = generalFormPDESolver({ A, B, C, D, mesh, boundary });

console.log('Mesh nodes:', mesh);
console.log('Solution u:', u);


## Output

The script prints the mesh nodes and the solution $u$ at each node. You can modify the coefficient functions and boundary conditions to solve other problems.

---

For more details, see the main project README or documentation.
