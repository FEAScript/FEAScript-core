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
model.setModelConfig("eulerBernoulliBeamScript", {
  coefficientFunctions: {
    EI: (x) => 2.0e6, // Bending stiffness
    q: (x) => (x <= 5 ? -1000 : 0),
  },
});

// 2. Define the mesh
model.setMeshConfig({
  meshDimension: "1D",
  elementOrder: "linear",
  numElementsX: 2,
  maxX: 10,
});

// 3. Apply the boundary conditions
model.addBoundaryCondition("1", [["fixed"]]); // Clamped support
model.addBoundaryCondition("2", [["pinned"], ["moment", 1250]]); // Roller + applied moment
model.addBoundaryCondition("3", [
  ["spring", 200],
  ["force", -2500],
]); // Spring support + point load

// 4. Solve
model.setSolverMethod("lusolve");
const { nodesCoordinates, fields } = model.solve();

// 5. Print the results
const { nodesXCoordinates } = nodesCoordinates;
console.log("\nNode |    x (m) | Deflection w (m) | Rotation theta (rad)");
console.log("-----|----------|-------------------|----------------------");
for (let nodeIndex = 0; nodeIndex < nodesXCoordinates.length; nodeIndex++) {
  console.log(
    `  ${nodeIndex + 1}  | ${nodesXCoordinates[nodeIndex].toFixed(2).padStart(8)} | ${fields.w[nodeIndex]
      .toExponential(4)
      .padStart(17)} | ${fields.theta[nodeIndex].toExponential(4).padStart(20)}`,
  );
}
