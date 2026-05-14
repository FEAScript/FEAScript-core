/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
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

// Import Math.js
import * as math from "mathjs";
globalThis.math = math;

// Import FEAScript library
import { FEAScriptModel, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

// Create a new FEAScript model
const model = new FEAScriptModel();

// Select physics/PDE with spatially varying coefficients
model.setModelConfig("heatConductionScript", {
  coefficientFunctions: {
    // Bi-material fin: high-k metal on left, low-k ceramic on right
    thermalConductivity: (x, y) => (x < 2.0 ? 10 : 1),
    // Localised heat source in the upper strip
    heatSource: (x, y) => (y > 1.5 ? 500 : 0),
  },
});

// Define mesh configuration
model.setMeshConfig({
  meshDimension: "2D",
  elementOrder: "quadratic",
  numElementsX: 8,
  numElementsY: 4,
  maxX: 4,
  maxY: 2,
});

// Define boundary conditions
model.addBoundaryCondition("0", ["constantTemp", 200]); // Bottom boundary
model.addBoundaryCondition("1", ["symmetry"]); // Left boundary
model.addBoundaryCondition("2", ["convection", 1, 20]); // Top boundary
model.addBoundaryCondition("3", ["constantTemp", 200]); // Right boundary

// Solve the problem
const { solutionVector, nodesCoordinates } = model.solve();

// Print results
console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Temperature solution:", solutionVector);
