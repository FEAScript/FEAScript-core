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
model.setModelConfig("heatConduction", { solver: { method: "frontal" } });

// 2. Define the mesh
model.setGeometry({ rectangle: [4, 2] });
model.setMeshConfig({ elements: "quadrilaterals", elementOrder: "quadratic", divisions: [8, 4] });

// 3. Apply the boundary conditions
model.addBoundaryCondition("bottom", { type: "constantTemperature", temperature: 200 }); // Bottom
model.addBoundaryCondition("left", { type: "symmetry" }); // Left
model.addBoundaryCondition("top", { type: "convection", h: 1, ambientTemperature: 20 }); // Top
model.addBoundaryCondition("right", { type: "constantTemperature", temperature: 200 }); // Right

// 4. Solve
const { solutionVector, nodesCoordinates } = model.solve();

// 5. Print the results
console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Solution vector:", solutionVector);
