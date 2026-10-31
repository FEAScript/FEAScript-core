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
model.setModelConfig("heatConductionScript");

// 2. Define the mesh
model.setMeshConfig({
  meshDimension: "1D",
  elementOrder: "linear",
  numElementsX: 10,
  maxX: 0.15,
});

// 3. Apply the boundary conditions
model.addBoundaryCondition("0", ["convection", 1, 25]); // Left
model.addBoundaryCondition("1", ["constantTemperature", 5]); // Right

// 4. Solve
model.setSolverMethod("jacobi");
const { solutionVector, nodesCoordinates } = model.solve();

// 5. Print the results
console.log(`Number of nodes: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Solution vector:", solutionVector);
