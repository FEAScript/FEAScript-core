/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Couette flow: a 4 × 2 channel whose top wall moves with velocity U, with stress-free (open) ends.
// The exact solution is the linear velocity profile u = U y / H, v = 0, with zero pressure, which
// Taylor-Hood elements reproduce exactly

// Import FEAScript library
import { FEAScriptModel, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

const wallVelocity = 1; // U
const channelHeight = 2; // H

// 1. Create the model and select the physics
const model = new FEAScriptModel();
model.setModelConfig("creepingFlowScript", {
  coefficientFunctions: {
    viscosity: 1, // μ
  },
});

// 2. Define the mesh (creeping flow needs quadratic elements)
model.setGeometry({ rectangle: [4, channelHeight] });
model.setMeshConfig({ elements: "quadrilaterals", elementOrder: "quadratic", divisions: [4, 2] });

// 3. Apply the boundary conditions
model.addBoundaryCondition("bottom", ["constantVelocity", 0, 0]); // Bottom: fixed wall
model.addBoundaryCondition("left", ["stressFree"]); // Left: open end
model.addBoundaryCondition("top", ["constantVelocity", wallVelocity, 0]); // Top: moving wall
model.addBoundaryCondition("right", ["stressFree"]); // Right: open end

// 4. Solve
model.setSolverMethod("lusolve");
const { nodesCoordinates, fields } = model.solve();

// 5. Print the results
const { nodesYCoordinates } = nodesCoordinates;
const largestDeviation = Math.max(
  ...nodesYCoordinates.map((y, i) => Math.abs(fields.u[i] - (wallVelocity * y) / channelHeight)),
);
console.log("Velocity u along the left end (x = 0):");
nodesYCoordinates.forEach((y, i) => {
  if (nodesCoordinates.nodesXCoordinates[i] === 0) {
    console.log(
      `  y = ${y.toFixed(2)}: u = ${fields.u[i].toFixed(4)} (exact ${(wallVelocity * y) / channelHeight})`,
    );
  }
});
console.log(`Largest deviation from u = U y / H: ${largestDeviation.toExponential(2)}`);
console.log(`Largest |v|: ${Math.max(...fields.v.map(Math.abs)).toExponential(2)} (exact 0)`);
console.log(`Largest |p|: ${Math.max(...fields.p.map(Math.abs)).toExponential(2)} (exact 0)`);
