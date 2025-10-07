//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

// Import Math.js
import * as math from "mathjs";
global.math = math;

// Import FEAScript library
import { FEAScriptModel, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

// Create a new FEAScript model
const model = new FEAScriptModel();

// Set solver configuration with coefficient functions
model.setSolverConfig("generalFormPDEScript", {
  coefficientFunctions: {
    // Equation d²u/dx² + 10 du/dx = -10 * exp(-200 * (x - 0.5)²)
    A: (x) => 1, // Diffusion coefficient
    B: (x) => 10, // Advection coefficient
    C: (x) => 0, // Reaction coefficient
    D: (x) => -10 * Math.exp(-200 * Math.pow(x - 0.5, 2)), // Source term
  },
});

// Define mesh configuration
model.setMeshConfig({
  meshDimension: "1D",
  elementOrder: "quadratic",
  numElementsX: 20,
  maxX: 1.0,
});

// Define boundary conditions
model.addBoundaryCondition("0", ["constantValue", 1]); // Left boundary, u(0) = 1
model.addBoundaryCondition("1", "zeroGradient"); // Right boundary, zero gradient (du/dx = 0)

// Set solver method
model.setSolverMethod("lusolve");

// Solve the problem
const { solutionVector, nodesCoordinates } = model.solve();

// Print results
console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Solution vector:", solutionVector);
