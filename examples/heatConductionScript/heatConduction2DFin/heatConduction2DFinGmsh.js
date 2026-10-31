/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Import required Node.js modules
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import FEAScript library
import { FEAScriptModel, importGmshMesh, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

// Get directory name for the current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the mesh file
const meshFilePath = path.join(__dirname, "rect_quad.msh");
const meshContent = fs.readFileSync(meshFilePath, "utf8");

async function main() {
  // 1. Create the model and select the physics
  const model = new FEAScriptModel();
  model.setModelConfig("heatConductionScript");

  // 2. Load the Gmsh mesh (in Node.js, any object with an async text() method replaces a File)
  const mesh = await importGmshMesh({ text: async () => meshContent });
  model.setMeshConfig({ parsedMesh: mesh });

  // 3. Apply the boundary conditions (key = Gmsh physical group tag - 1)
  model.addBoundaryCondition("0", ["constantTemperature", 200]); // Bottom
  model.addBoundaryCondition("1", ["symmetry"]); // Left
  model.addBoundaryCondition("2", ["convection", 1, 20]); // Top
  model.addBoundaryCondition("3", ["constantTemperature", 200]); // Right

  // 4. Solve
  const { solutionVector, nodesCoordinates } = model.solve();

  // 5. Print the results
  console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
  console.log("Node coordinates:", nodesCoordinates);
  console.log("Solution vector:", solutionVector);
}

// Run the main function
main();
