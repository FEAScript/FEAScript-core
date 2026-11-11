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
model.setModelConfig("eulerBernoulliBeam", {
  solver: { method: "lusolve" },
  coefficientFunctions: {
    EI: (x) => 2.0e6, // Bending stiffness
    q: (x) => (x <= 5 ? -1000 : 0),
  },
});

// 2. Define the mesh
model.setGeometry({ line: 10 });
model.setMeshConfig({ elementOrder: "linear", divisions: 2 });

// 3. Apply the boundary conditions
model.addBoundaryCondition("1", { type: "fixed" }); // Clamped support
model.addBoundaryCondition("2", [{ type: "pinned" }, { type: "moment", moment: 1250 }]); // Roller + applied moment
model.addBoundaryCondition("3", [
  { type: "spring", stiffness: 200 },
  { type: "force", force: -2500 },
]); // Spring support + point load

// 4. Solve
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
