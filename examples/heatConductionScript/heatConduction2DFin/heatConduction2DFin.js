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
globalThis.math = math;

// Import FEAScript library
import { FEAScriptModel, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

// Create a new FEAScript model
const model = new FEAScriptModel();

// Select physics/PDE
model.setModelConfig("heatConductionScript");

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

// Set solver method (optional)
model.setSolverMethod("lusolve");

// Solve the problem
const { solutionVector, nodesCoordinates } = model.solve();

// Print results
console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Solution vector:", solutionVector);
