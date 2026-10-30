/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Cantilever beam of length L, clamped at x = 0, with a point load P at the free end. The exact
// tip deflection and rotation are w(L) = P L³ / (3 EI) and θ(L) = P L² / (2 EI)

// Import FEAScript library
import { FEAScriptModel, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

const beamLength = 4; // L (m)
const bendingStiffness = 1.0e5; // EI (N·m²)
const tipLoad = -1000; // P (N), downward

// 1. Create the model and select the physics
const model = new FEAScriptModel();
model.setModelConfig("eulerBernoulliBeamScript", {
  coefficientFunctions: {
    EI: (x) => bendingStiffness, // Bending stiffness
  },
});

// 2. Define the mesh
model.setMeshConfig({
  meshDimension: "1D",
  elementOrder: "linear",
  numElementsX: 4,
  maxX: beamLength,
});

// 3. Apply the boundary conditions (keyed by node number)
model.addBoundaryCondition("1", [["fixed"]]); // Clamped support at x = 0
model.addBoundaryCondition("5", [["force", tipLoad]]); // Tip load at x = L (last node)

// 4. Solve
model.setSolverMethod("lusolve");
const { fields } = model.solve();

// 5. Print the results
const tipDeflection = fields.w.at(-1);
const tipRotation = fields.theta.at(-1);
const exactTipDeflection = (tipLoad * beamLength ** 3) / (3 * bendingStiffness);
const exactTipRotation = (tipLoad * beamLength ** 2) / (2 * bendingStiffness);
console.log(
  `Tip deflection w(L): ${tipDeflection.toExponential(6)} m (exact ${exactTipDeflection.toExponential(6)} m)`,
);
console.log(
  `Tip rotation θ(L): ${tipRotation.toExponential(6)} rad (exact ${exactTipRotation.toExponential(6)} rad)`,
);
