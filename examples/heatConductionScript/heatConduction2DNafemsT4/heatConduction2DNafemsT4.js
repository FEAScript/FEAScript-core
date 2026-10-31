/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.1 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// NAFEMS T4 benchmark: a 0.6 m × 1.0 m plate with a fixed temperature on the bottom edge, an
// insulated left edge, and convection to 0 °C on the top and right edges. The published target
// temperature at point E (x = 0.6 m, y = 0.2 m) is 18.3 °C (FEAScript mesh-converged value ≈ 18.25 °C)

// Import FEAScript library
import { FEAScriptModel, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

// 1. Create the model and select the physics
const model = new FEAScriptModel();
model.setModelConfig("heatConductionScript", {
  coefficientFunctions: {
    thermalConductivity: 52, // k = 52 W/(m·K)
  },
});

// 2. Define the mesh
model.setMeshConfig({
  meshDimension: "2D",
  elementOrder: "quadratic",
  numElementsX: 12,
  numElementsY: 20,
  maxX: 0.6,
  maxY: 1.0,
});

// 3. Apply the boundary conditions
model.addBoundaryCondition("0", ["constantTemperature", 100]); // Bottom: T = 100 °C
model.addBoundaryCondition("1", ["symmetry"]); // Left: insulated
model.addBoundaryCondition("2", ["convection", 750, 0]); // Top: h = 750 W/(m²·K), T∞ = 0 °C
model.addBoundaryCondition("3", ["convection", 750, 0]); // Right: h = 750 W/(m²·K), T∞ = 0 °C

// 4. Solve
model.setSolverMethod("lusolve");
const { solutionVector, nodesCoordinates } = model.solve();

// 5. Print the results
const { nodesXCoordinates, nodesYCoordinates } = nodesCoordinates;
const pointE = nodesXCoordinates.findIndex(
  (x, i) => Math.abs(x - 0.6) < 1e-10 && Math.abs(nodesYCoordinates[i] - 0.2) < 1e-10,
);
console.log(`Temperature at point E (x = 0.6 m, y = 0.2 m): ${solutionVector[pointE].toFixed(2)} °C`);
console.log("NAFEMS target temperature at point E: 18.3 °C (FEAScript mesh-converged value ≈ 18.25 °C)");
