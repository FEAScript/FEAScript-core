/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 | https://feascript.com
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
model.setModelConfig("creepingFlowScript");

// Define mesh configuration
model.setMeshConfig({
  meshDimension: "2D",
  elementOrder: "quadratic",
  numElementsX: 12,
  numElementsY: 6,
  maxX: 4,
  maxY: 2,
});

// Define boundary conditions
model.addBoundaryCondition("0", ["constantVelocity", 0, 0]); // Bottom boundary
model.addBoundaryCondition("1", ["constantVelocity", 0, 0]); // Left boundary
model.addBoundaryCondition("2", ["constantVelocity", 1, 0]); // Top boundary
model.addBoundaryCondition("3", ["constantVelocity", 0, 0]); // Right boundary

// Set solver method (optional)
model.setSolverMethod("lusolve");

// Solve the problem
const { solutionVector, nodesCoordinates } = model.solve();

// Print results
console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Solution vector:", solutionVector);
