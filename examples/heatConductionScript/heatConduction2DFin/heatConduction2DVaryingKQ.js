/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Heat Conduction in a 2D Fin with Spatially Varying k(x,y) and Q(x,y)
 *
 * Domain: 0 ≤ x ≤ 4 m, 0 ≤ y ≤ 2 m
 *
 * Thermal conductivity varies by material region:
 *   - Left half  (x < 2): k = 10 W/(m·K)  (high-conductivity metal)
 *   - Right half (x ≥ 2): k =  1 W/(m·K)  (low-conductivity ceramic)
 *
 * Heat source active only in the upper strip (y > 1.5):
 *   - Q = 500 W/m³  for y > 1.5
 *   - Q = 0         otherwise
 *
 * Boundary conditions:
 *   - Bottom (y = 0):  constant temperature, T = 200 °C  (heated base)
 *   - Left   (x = 0):  symmetry
 *   - Top    (y = 2):  convection, h = 1 W/(m²·K), T_inf = 20 °C
 *   - Right  (x = 4):  constant temperature, T = 200 °C
 */

// Import FEAScript library
import { FEAScriptModel, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

// 1. Create the model and select the physics (spatially varying coefficients)
const model = new FEAScriptModel();
model.setModelConfig("heatConductionScript", {
  coefficientFunctions: {
    // Bi-material fin: high-k metal on left, low-k ceramic on right
    thermalConductivity: (x, y) => (x < 2.0 ? 10 : 1),
    // Localised heat source in the upper strip
    heatSource: (x, y) => (y > 1.5 ? 500 : 0),
  },
});

// 2. Define the mesh
model.setMeshConfig({
  meshDimension: "2D",
  elementOrder: "quadratic",
  numElementsX: 8,
  numElementsY: 4,
  maxX: 4,
  maxY: 2,
});

// 3. Apply the boundary conditions
model.addBoundaryCondition("0", ["constantTemperature", 200]); // Bottom
model.addBoundaryCondition("1", ["symmetry"]); // Left
model.addBoundaryCondition("2", ["convection", 1, 20]); // Top
model.addBoundaryCondition("3", ["constantTemperature", 200]); // Right

// 4. Solve
const { solutionVector, nodesCoordinates } = model.solve();

// 5. Print the results
console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Temperature solution:", solutionVector);
