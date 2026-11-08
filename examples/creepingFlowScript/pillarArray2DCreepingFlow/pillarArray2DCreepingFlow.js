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

// Read the mesh file (P2 triangles, generated from pillar.geo on the FEAScript website)
const meshFilePath = path.join(__dirname, "pillar_triang_quadratic.msh");
const meshContent = fs.readFileSync(meshFilePath, "utf8");

// Volume flow rate per unit depth through the vertical line x = xLine, from the nodes on that line
// (trapezoidal rule over the boundary nodes, which is enough for a check of mass conservation)
function flowRate(nodesCoordinates, u, xLine) {
  const { nodesXCoordinates: x, nodesYCoordinates: y } = nodesCoordinates;
  const points = [];
  for (let i = 0; i < x.length; i++) {
    if (Math.abs(x[i] - xLine) < 1e-9) points.push([y[i], u[i]]);
  }
  points.sort((a, b) => a[0] - b[0]);
  let rate = 0;
  for (let i = 1; i < points.length; i++) {
    rate += 0.5 * (points[i][1] + points[i - 1][1]) * (points[i][0] - points[i - 1][0]);
  }
  return rate;
}

async function main() {
  // 1. Create the model and select the physics
  const model = new FEAScriptModel();
  model.setModelConfig("creepingFlowScript", {
    coefficientFunctions: {
      viscosity: 1, // μ
    },
  });

  // 2. Load the Gmsh mesh (in Node.js, any object with an async text() method replaces a File)
  const mesh = await importGmshMesh({ text: async () => meshContent });
  model.setMeshConfig({ parsedMesh: mesh });

  // 3. Apply the boundary conditions (key = Gmsh physical group tag - 1)
  model.addBoundaryCondition("0", ["constantVelocity", 1, 0]); // Inlet (x = 0)
  model.addBoundaryCondition("1", ["constantVelocity", 0, 0]); // Channel walls (no-slip)
  model.addBoundaryCondition("2", ["stressFree"]); // Outlet (x = 8)
  model.addBoundaryCondition("3", ["constantVelocity", 0, 0]); // Pillars (no-slip)

  // 4. Solve
  model.setSolverMethod("lusolve");
  const { nodesCoordinates, fields } = model.solve();

  // 5. Print the results
  console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
  console.log(`Largest velocity magnitude: ${Math.max(...fields.velocityMagnitude).toFixed(3)}`);
  console.log(`Flow rate at the inlet:  ${flowRate(nodesCoordinates, fields.u, 0).toFixed(4)}`);
  console.log(`Flow rate at the outlet: ${flowRate(nodesCoordinates, fields.u, 8).toFixed(4)}`);
}

// Run the main function
main();
