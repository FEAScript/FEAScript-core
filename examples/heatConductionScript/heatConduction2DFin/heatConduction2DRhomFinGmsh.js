/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Import required Node.js modules
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import Math.js
import * as math from "mathjs";
global.math = math;

// Import FEAScript library
import { FEAScriptModel, importGmshQuadTri, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

// Get directory name for the current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the mesh file
const meshFilePath = path.join(__dirname, "rhom_quad.msh");
const meshContent = fs.readFileSync(meshFilePath, "utf8");

async function main() {
  // Create a new FEAScript model
  const model = new FEAScriptModel();

  // Select physics/PDE
  model.setModelConfig("heatConductionScript");

  // Create a mock File object for Node.js environment
  const mockFile = {
    text: async () => meshContent,
    name: "rhom_quad.msh",
  };

  // Parse the mesh data
  const result = await importGmshQuadTri(mockFile);

  // Define mesh configuration with the parsed result
  model.setMeshConfig({
    parsedMesh: result,
    meshDimension: "2D",
    elementOrder: "quadratic",
  });

  // Define boundary conditions
  model.addBoundaryCondition("0", ["constantTemp", 200]); // bottom boundary
  model.addBoundaryCondition("1", ["constantTemp", 200]); // right boundary
  model.addBoundaryCondition("2", ["convection", 1, 20]); // top boundary
  model.addBoundaryCondition("3", ["symmetry"]); // left boundary

  // Solve the problem
  model.setSolverMethod("lusolve");
  const { solutionVector, nodesCoordinates } = model.solve();

  // Print results
  console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
  console.log("Node coordinates:", nodesCoordinates);
  console.log("Solution vector:", solutionVector);
}

// Run the main function
main();
