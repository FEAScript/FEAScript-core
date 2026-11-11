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
model.setModelConfig("creepingFlowScript", {
  coefficientFunctions: {
    viscosity: 1, // μ
  },
});

// 2. Define the mesh
model.setGeometry({ rectangle: [4, 2] });
model.setMeshConfig({ elements: "quadrilaterals", elementOrder: "quadratic", divisions: [12, 6] });

// 3. Apply the boundary conditions
model.addBoundaryCondition("bottom", ["constantVelocity", 0, 0]); // Bottom
model.addBoundaryCondition("left", ["constantVelocity", 0, 0]); // Left
model.addBoundaryCondition("top", ["constantVelocity", 1, 0]); // Top
model.addBoundaryCondition("right", ["constantVelocity", 0, 0]); // Right

// 4. Solve
model.setSolverMethod("lusolve");
const { nodesCoordinates, fields } = model.solve();

// 5. Print the results (one value per mesh node for each field)
console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("x-velocity u:", fields.u);
console.log("y-velocity v:", fields.v);
console.log("Pressure p:", fields.p);
