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
model.setModelConfig("creepingFlow", {
  solver: { method: "lusolve" },
  coefficientFunctions: {
    viscosity: 1, // μ
  },
});

// 2. Define the mesh
model.setGeometry({ rectangle: [4, 2] });
model.setMeshConfig({ elements: "quadrilaterals", elementOrder: "quadratic", divisions: [12, 6] });

// 3. Apply the boundary conditions
model.addBoundaryCondition("bottom", { type: "constantVelocity", u: 0, v: 0 }); // Bottom
model.addBoundaryCondition("left", { type: "constantVelocity", u: 0, v: 0 }); // Left
model.addBoundaryCondition("top", { type: "constantVelocity", u: 1, v: 0 }); // Top
model.addBoundaryCondition("right", { type: "constantVelocity", u: 0, v: 0 }); // Right

// 4. Solve
const { nodesCoordinates, fields } = model.solve();

// 5. Print the results (one value per mesh node for each field)
console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("x-velocity u:", fields.u);
console.log("y-velocity v:", fields.v);
console.log("Pressure p:", fields.p);
