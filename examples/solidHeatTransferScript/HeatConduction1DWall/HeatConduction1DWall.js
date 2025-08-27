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
import { FEAScriptModel, logSystem, VERSION } from "feascript";

console.log("FEAScript Version:", VERSION);

// Create a new FEAScript model
const model = new FEAScriptModel();

// Set solver configuration
model.setSolverConfig("solidHeatTransferScript");

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

// Solve the problem and get the solution
const { solutionVector, nodesCoordinates } = model.solve();

// Print results to console
console.log(`Number of nodes: ${nodesCoordinates.nodesXCoordinates.length}`);
console.log("Node coordinates:", nodesCoordinates);
console.log("Solution vector:", solutionVector);
