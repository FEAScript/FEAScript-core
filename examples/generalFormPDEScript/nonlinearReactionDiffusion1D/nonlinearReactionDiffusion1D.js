/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Import Math.js
import * as math from "mathjs";
global.math = math;

// Import FEAScript library
import { FEAScriptModel, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

// Create a new FEAScript model
const model = new FEAScriptModel();

// Reaction rate coefficient for the nonlinear source term
const Da = 1;

// Select physics/PDE
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

// Define mesh configuration
model.setMeshConfig({
  meshDimension: "1D",
  elementOrder: "linear",
  numElementsX: 20,
  maxX: 10.0,
});

// Define boundary conditions
model.addBoundaryCondition("0", ["constantValue", 1]); // Left boundary
model.addBoundaryCondition("1", "zeroGradient"); // Right boundary

// Set solver method
model.setSolverMethod("lusolve");

// Solve the problem
const { solutionVector, nodesCoordinates } = model.solve({
  maxIterations: 100,
  tolerance: 1e-5,
});

// Print results
console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Solution vector:", solutionVector);
