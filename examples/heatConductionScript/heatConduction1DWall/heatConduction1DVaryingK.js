/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Heat Conduction in a 1D Bi-Material Wall with Spatially Varying k(x)
 *
 * Domain: 0 ≤ x ≤ 0.15 m
 * Material interface at x = 0.075 m:
 *   - Left half (x < 0.075 m):  k = 10 W/(m·K)  (e.g. concrete)
 *   - Right half (x ≥ 0.075 m): k =  1 W/(m·K)  (e.g. insulation)
 * Boundary conditions:
 *   - Left  (x = 0):    convection, h = 25 W/(m²·K), T_inf = 5 °C
 *   - Right (x = 0.15): constant temperature, T = 20 °C
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
model.setModelConfig("heatConductionScript", {
  coefficientFunctions: {
    // Bi-material: high-conductivity concrete | low-conductivity insulation
    thermalConductivity: (x) => (x < 0.075 ? 10 : 1),
    heatSource: 0,
  },
});

// Define mesh configuration
model.setMeshConfig({
  meshDimension: "1D",
  elementOrder: "linear",
  numElementsX: 20,
  maxX: 0.15,
});

// Define boundary conditions
model.addBoundaryCondition("0", ["convection", 25, 5]); // Left boundary: convection
model.addBoundaryCondition("1", ["constantTemp", 20]); // Right boundary: fixed temperature

// Solve the problem
const { solutionVector, nodesCoordinates } = model.solve();

// Print results
console.log(`Number of nodes: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates (x):", nodesCoordinates.nodesXCoordinates);
console.log("Temperature solution:", solutionVector);
