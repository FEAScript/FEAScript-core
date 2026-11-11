/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Import FEAScript library
import { FEAScriptModel, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

// 1. Create the model and select the physics
const model = new FEAScriptModel();
model.setModelConfig("generalFormPDEScript", {
  coefficientFunctions: {
    // Equation d²u/dx² - 10 du/dx = 10 * exp(-200 * (x - 0.5)²)
    A: (x) => 1, // Diffusion coefficient
    B: (x) => -10, // Advection coefficient
    C: (x) => 0, // Reaction coefficient
    D: (x) => 10 * Math.exp(-200 * Math.pow(x - 0.5, 2)), // Source term
  },
});

// 2. Define the mesh
model.setGeometry({ line: 1.0 });
model.setMeshConfig({ elementOrder: "quadratic", divisions: 20 });

// 3. Apply the boundary conditions
model.addBoundaryCondition("left", ["constantValue", 1]); // Left
model.addBoundaryCondition("right", ["zeroGradient"]); // Right

// 4. Solve
model.setSolverMethod("lusolve");
const { solutionVector, nodesCoordinates } = model.solve();

// 5. Print the results
console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Solution vector:", solutionVector);
