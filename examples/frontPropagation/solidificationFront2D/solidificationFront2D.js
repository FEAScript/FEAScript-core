/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Import FEAScript library
import { FEAScriptModel, version } from "feascript";

console.log("FEAScript Version:", version);

// 1. Create the model and select the physics
const model = new FEAScriptModel();
model.setModelConfig("frontPropagation", { solver: { method: "lusolve" } });

// 2. Define the mesh
model.setGeometry({ rectangle: [4, 2] });
model.setMeshConfig({ elements: "quadrilaterals", elementOrder: "quadratic", divisions: [12, 8] });

// 3. Apply the boundary conditions
model.addBoundaryCondition("bottom", { type: "constantValue", value: 0 }); // Bottom
model.addBoundaryCondition("left", { type: "constantValue", value: 0 }); // Left
model.addBoundaryCondition("top", { type: "zeroGradient" }); // Top
model.addBoundaryCondition("right", { type: "constantValue", value: 0 }); // Right

// 4. Solve
const { solutionVector, nodesCoordinates } = model.solve();

// 5. Print the results
console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Solution vector:", solutionVector);
