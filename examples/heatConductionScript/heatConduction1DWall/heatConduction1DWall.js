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
model.setModelConfig("heatConductionScript");

// Define mesh configuration
model.setMeshConfig({
  meshDimension: "1D",
  elementOrder: "linear",
  numElementsX: 10,
  maxX: 0.15,
});

// Define boundary conditions
model.addBoundaryCondition("0", ["convection", 1, 25]);
model.addBoundaryCondition("1", ["constantTemp", 5]);

// Set solver method (optional)
model.setSolverMethod("lusolve");

// Solve the problem
const { solutionVector, nodesCoordinates } = model.solve();

// Print results
console.log(`Number of nodes: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Solution vector:", solutionVector);
