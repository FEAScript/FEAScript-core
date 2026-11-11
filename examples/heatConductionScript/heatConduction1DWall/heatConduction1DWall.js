/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Import FEAScript library
import { FEAScriptModel, version } from "feascript";

console.log("FEAScript Version:", version);

// 1. Create the model and select the physics
const model = new FEAScriptModel();
model.setModelConfig("heatConduction", { solver: { method: "jacobi" } });

// 2. Define the mesh
model.setGeometry({ line: 0.15 });
model.setMeshConfig({ elementOrder: "linear", divisions: 10 });

// 3. Apply the boundary conditions
model.addBoundaryCondition("left", { type: "convection", h: 1, ambientTemperature: 25 }); // Left
model.addBoundaryCondition("right", { type: "constantTemperature", temperature: 5 }); // Right

// 4. Solve
const { solutionVector, nodesCoordinates } = model.solve();

// 5. Print the results
console.log(`Number of nodes: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Solution vector:", solutionVector);
