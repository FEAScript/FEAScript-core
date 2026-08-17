/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Import Math.js
import * as math from "mathjs";
global.math = math;

// Import FEAScript library
import { FEAScriptModel, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

// Create a new FEAScript model
const model = new FEAScriptModel();

// Select physics/PDE
model.setModelConfig("eulerBernoulliBeamScript", {
  coefficientFunctions: {
    EI: (x) => 2.0e6, // Bending stiffness
    q: (x) => (x <= 5 ? -1000 : 0),
  },
});

// Define mesh configuration
model.setMeshConfig({
  meshDimension: "1D",
  elementOrder: "linear",
  numElementsX: 2,
  maxX: 10,
});

// Define boundary conditions
model.addBoundaryCondition("1", [["fixed"]]); // Clamped support
model.addBoundaryCondition("2", [["pinned"], ["moment", 1250]]); // Roller + applied moment
model.addBoundaryCondition("3", [
  ["spring", 200],
  ["force", -2500],
]); // Spring support + point load

// Set solver method
model.setSolverMethod("lusolve");

// Solve the problem
const { solutionVector } = model.solve();

// Print results
const flatSolution = solutionVector.map((entry) =>
  Array.isArray(entry) ? entry[0] : entry
);

const nodeXCoordinates = [0, 5, 10];
console.log("\nNode |    x (m) | Deflection w (m) | Rotation theta (rad)");
console.log("-----|----------|-------------------|----------------------");
for (let nodeIndex = 0; nodeIndex < nodeXCoordinates.length; nodeIndex++) {
  const w = flatSolution[2 * nodeIndex];
  const theta = flatSolution[2 * nodeIndex + 1];
  console.log(
    `  ${nodeIndex + 1}  | ${nodeXCoordinates[nodeIndex]
      .toFixed(2)
      .padStart(8)} | ${w.toExponential(4).padStart(17)} | ${theta
      .toExponential(4)
      .padStart(20)}`
  );
}
