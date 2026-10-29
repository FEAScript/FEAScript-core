/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Import FEAScript library
import { FEAScriptModel, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

// Reaction rate coefficient for the nonlinear source term
const Da = 1;

// 1. Create the model and select the physics
const model = new FEAScriptModel();
model.setModelConfig("generalFormPDEScript", {
  nonlinear: true, // Solve with the Newton-Raphson method
  coefficientFunctions: {
    // Equation d²u/dx² - Da * u² = 0
    A: (x) => 1, // Diffusion coefficient
    B: (x) => 0, // Advection coefficient
    C: (x) => 0, // Linear reaction coefficient
    D: (x, u) => Da * u ** 2, // Nonlinear reaction/source term
    dDdu: (x, u) => 2 * Da * u, // Derivative of D with respect to u, required for the Jacobian
  },
});

// 2. Define the mesh
model.setMeshConfig({
  meshDimension: "1D",
  elementOrder: "linear",
  numElementsX: 20,
  maxX: 10.0,
});

// 3. Apply the boundary conditions
model.addBoundaryCondition("0", ["constantValue", 1]); // Left
model.addBoundaryCondition("1", ["zeroGradient"]); // Right

// 4. Solve
model.setSolverMethod("lusolve");
const { solutionVector, nodesCoordinates } = model.solve({
  maxIterations: 100,
  tolerance: 1e-5,
});

// 5. Print the results
console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Solution vector:", solutionVector);
