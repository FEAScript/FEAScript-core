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
globalThis.math = math;

// Import FEAScript library
import {
  FEAScriptModel,
  createColorScale,
  createContourLineOptions,
  plotInterpolatedSolution,
  printVersion,
} from "feascript";

console.log("FEAScript Version:", printVersion);

function createPlotSection(title, plotDivId) {
  const section = document.createElement("section");
  section.style.margin = "1rem 0 2rem";

  const heading = document.createElement("h2");
  heading.textContent = title;
  heading.style.fontFamily = "sans-serif";
  heading.style.fontSize = "1rem";
  heading.style.margin = "0 0 0.5rem";

  const plotDiv = document.createElement("div");
  plotDiv.id = plotDivId;
  plotDiv.style.width = "100%";
  plotDiv.style.height = "420px";
  plotDiv.style.border = "1px solid #d0d7de";
  plotDiv.style.borderRadius = "8px";
  plotDiv.style.overflow = "hidden";

  section.append(heading, plotDiv);
  return { section, plotDivId };
}

function ensurePlotRoot() {
  const existingRoot = document.getElementById("feascript-fin-plots");
  if (existingRoot) {
    existingRoot.innerHTML = "";
    return existingRoot;
  }

  const root = document.createElement("div");
  root.id = "feascript-fin-plots";
  root.style.maxWidth = "1100px";
  root.style.margin = "1.5rem auto";
  root.style.padding = "0 1rem 2rem";
  document.body.appendChild(root);
  return root;
}

async function renderVisualizations(model, result) {
  if (typeof document === "undefined") {
    return;
  }

  const plotRoot = ensurePlotRoot();
  const vtkPlot = createPlotSection("VTK.js contour visualization", "heat-fin-vtk-plot");
  const plotlyPlot = createPlotSection("Plotly contour visualization", "heat-fin-plotly-plot");
  plotRoot.append(vtkPlot.section, plotlyPlot.section);

  const renderOptions = {
    colorScale: createColorScale({
      presetName: "Cool to Warm",
      scalarBarTitle: "Temperature",
    }),
    contourLines: createContourLineOptions({
      enabled: true,
      numberOfContours: 14,
      lineWidth: 1.25,
    }),
  };

  await plotInterpolatedSolution(model, result, "contour", vtkPlot.plotDivId, {
    ...renderOptions,
    backend: "vtk",
  });

  await plotInterpolatedSolution(model, result, "contour", plotlyPlot.plotDivId, {
    ...renderOptions,
    backend: "plotly",
  });
}

async function runExample() {
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
  const result = model.solve();
  const { solutionVector, nodesCoordinates } = result;

  // Print results
  console.log(`Number of nodes in mesh: ${nodesCoordinates.nodesXCoordinates.length}`);
  console.log("Node coordinates:", nodesCoordinates);
  console.log("Solution vector:", solutionVector);

  await renderVisualizations(model, result);
}

if (typeof document !== "undefined" && document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    runExample().catch((error) => {
      console.error("Failed to run heat conduction fin example:", error);
    });
  }, { once: true });
} else {
  runExample().catch((error) => {
    console.error("Failed to run heat conduction fin example:", error);
  });
}
