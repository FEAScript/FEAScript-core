/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Import FEAScript library
import { FEAScriptModel, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

// 1. Create the model and select the physics
const model = new FEAScriptModel();
model.setModelConfig("frontPropagationScript");

// 2. Define the mesh
model.setMeshConfig({
  meshDimension: "2D",
  elementOrder: "quadratic",
  numElementsX: 12,
  numElementsY: 8,
  maxX: 4,
  maxY: 2,
});

// 3. Apply the boundary conditions
model.addBoundaryCondition("0", ["constantValue", 0]); // Bottom
model.addBoundaryCondition("1", ["constantValue", 0]); // Left
model.addBoundaryCondition("2", ["zeroGradient"]); // Top
model.addBoundaryCondition("3", ["constantValue", 0]); // Right

// 4. Solve
model.setSolverMethod("lusolve");
const { solutionVector, nodesCoordinates } = model.solve();

// 5. Print the results
console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Solution vector:", solutionVector);
