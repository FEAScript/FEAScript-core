/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * TypeScript use of the package, type-checked against the generated declarations (dist/types/) by
 * tests/unit/types.test.js. It is never run. Each @ts-expect-error line is a mistake the declarations must catch:
 * if one compiles, tsc reports the unused directive and the test fails
 */

import {
  FEAScriptModel,
  FEAScriptWorker,
  FEAScriptError,
  importGmshMesh,
  generateTriangleMesh,
  generateQuadrilateralMesh,
  plotSolution,
  plotInterpolatedSolution,
  logSystem,
  version,
} from "feascript";
import type { BoundaryCondition, Geometry, RunReport, SolveResult } from "feascript";

logSystem("basic");
const versionText: string = version;

// Heat conduction in 2D, with the run report
const model = new FEAScriptModel();
model.setModelConfig("heatConduction", {
  solver: { method: "jacobi", maxIterations: 20000, tolerance: 1e-10 },
  coefficientFunctions: { thermalConductivity: (x: number, y: number) => (x < 2 ? 10 : 1), heatSource: 0 },
});
model.setGeometry({ rectangle: [4, 2] });
model.setMeshConfig({ elements: "quadrilaterals", elementOrder: "linear", divisions: [8, 4] });
model.addBoundaryCondition("bottom", { type: "constantTemperature", temperature: 200 });
model.addBoundaryCondition("top", { type: "convection", h: 1, ambientTemperature: 20 });
model.addBoundaryCondition("left", { type: "symmetry" });

const result: SolveResult = model.solve({ tolerance: 1e-8 });
const solution: Float64Array = result.solutionVector;
const x: ArrayLike<number> = result.nodesCoordinates.nodesXCoordinates;
const info: RunReport = result.info;
const iterations: number | null = info.iterations;
const residual: number | null = info.residual;
const solveTime: number = info.solveTime;
const newtonIncrement: number | undefined = info.newton?.increment;
plotSolution(model, result, "contour", "plot");
plotInterpolatedSolution(model, result, "contour", "plot", { field: "u" });

// A polygon with a hole, meshed with triangles, and a generated mesh
const geometry: Geometry = {
  shape: {
    start: [0, 0],
    boundaries: [
      { name: "bottom", to: [2, 0] },
      { name: "right", to: [2, 1] },
      {
        name: "step",
        to: [
          [1, 1],
          [1, 2],
        ],
      },
      { name: "top", to: [0, 2] },
      { name: "left" },
    ],
  },
  holes: [
    {
      name: "hole",
      points: [
        [0.4, 0.4],
        [0.6, 0.4],
        [0.6, 0.6],
      ],
    },
  ],
};
model.setGeometry(geometry);
model.setMeshConfig({
  elements: "triangles",
  elementOrder: "quadratic",
  size: (x, y) => 0.05 + 0.1 * y,
  minAngle: 25,
});
model.setMesh(generateTriangleMesh(geometry, { size: 0.1, elementOrder: "quadratic" }));
model.setMesh(generateQuadrilateralMesh({ rectangle: [1, 1] }, { divisions: [4, 4] }));
const dimension: "1D" | "2D" | null = model.getMeshDimension();

// A Gmsh mesh, read from a file
async function readGmsh(file: File) {
  model.setMesh(await importGmshMesh(file));
}

// The nonlinear general form PDE and the Euler-Bernoulli beam
const pde = new FEAScriptModel();
pde.setModelConfig("generalFormPDE", {
  nonlinear: true,
  coefficientFunctions: { A: () => 1, B: () => 0, C: () => 0, D: (x, u) => u * u, dDdu: (x, u) => 2 * u },
});
pde.setGeometry({ line: 1 });
pde.setMeshConfig({ elementOrder: "linear", divisions: 10 });
pde.addBoundaryCondition("left", { type: "constantValue", value: 1 });
pde.addBoundaryCondition("right", { type: "zeroGradient" });

const beam = new FEAScriptModel();
beam.setModelConfig("eulerBernoulliBeam", { coefficientFunctions: { EI: (x) => 2.0e6, q: (x) => -1000 } });
const supports: BoundaryCondition[] = [{ type: "pinned" }, { type: "spring", stiffness: 1e5 }];
beam.addBoundaryCondition(1, supports);
beam.addBoundaryCondition("3", { type: "force", force: -1 });

// The 0.3 forms, deprecated but still accepted
beam.addBoundaryCondition("2", ["force", -1]);
model.setMeshConfig({ meshDimension: "1D", numElementsX: 10, maxX: 1 });
model.setModelConfig("heatConductionScript");

// The worker and the GPU solver
async function solveInWorker() {
  const worker = new FEAScriptWorker();
  await worker.setModelConfig("heatConduction", { solver: { method: "lusolve" } });
  await worker.setGeometry({ line: 1 });
  await worker.setMeshConfig({ divisions: 10 });
  await worker.addBoundaryCondition("left", { type: "constantTemperature", temperature: 25 });
  const workerResult = await worker.solve();
  const workerSolution: Float64Array = workerResult.solutionVector;
  const workerInfo: RunReport = workerResult.info;
  plotSolution(await worker.getModelInfo(), workerResult, "line", "plot");
  worker.terminate();
}
async function solveOnGpu() {
  const gpuResult: SolveResult = await model.solveAsync(null, { maxIterations: 5000 });
}

// Errors
try {
  model.solve();
} catch (error) {
  if (error instanceof FEAScriptError && error.code === "NOT_CONVERGED") console.log(error.details);
}

// Mistakes the declarations must catch
// @ts-expect-error: unknown model name
model.setModelConfig("heatConductionn");
// @ts-expect-error: unknown solver method
model.setModelConfig("heatConduction", { solver: { method: "cg" } });
// @ts-expect-error: a condition parameter with the wrong name
model.addBoundaryCondition("top", { type: "convection", h: 1, ambient: 20 });
// @ts-expect-error: an unknown condition type
model.addBoundaryCondition("top", { type: "constantTemp", temperature: 20 });
// @ts-expect-error: unknown element shape
model.setMeshConfig({ elements: "hexahedra" });
// @ts-expect-error: a rectangle has two sides
model.setGeometry({ rectangle: [1, 2, 3] });
// @ts-expect-error: the result has no "solution" property
model.solve().solution;
// @ts-expect-error: iterations may be null (direct solvers)
const alwaysNumber: number = model.solve().info.iterations;
// @ts-expect-error: unknown error code
if (new FEAScriptError("INVALID_INPUT", "").code === "NOT_FOUND") console.log();
// @ts-expect-error: unknown log level
logSystem("verbose");
// @ts-expect-error: internal methods are private
model.validateModel();
