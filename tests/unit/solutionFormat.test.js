/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for the solution vector format
 *
 * Covers every model and every applicable solver method (lusolve, jacobi, frontal):
 *  - The solution vector is a Float64Array with one entry per degree of freedom
 *  - Every solver method gives the same values as lusolve
 *  - The interpolated contour plot is the same whichever solver method produced the solution
 *  - The LU solver returns a Float64Array also for a single unknown
 *
 * Run: node tests/unit/solutionFormat.test.js (or npm test)
 */

import { FEAScriptModel } from "../../src/FEAScript.js";
import { mathjsLUSolver } from "../../src/solvers/mathjsLUSolver.js";
import { plotInterpolatedSolution } from "../../src/visualization/plotlyPlot.js";
import { basicLog, errorLog } from "../../src/utilities/logging.js";

const SOLVER_TOLERANCE = 1e-6;

// Minimal browser stubs: capture the trace passed to Plotly instead of rendering it
let plottedTrace = null;
globalThis.window = { innerWidth: 700 };
globalThis.Plotly = {
  newPlot: (plotDivId, data) => {
    plottedTrace = data[0];
  },
};

basicLog("");
basicLog("================================");
basicLog("Unit tests: solution vector format");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    errorLog(`FAIL: ${message}`);
    failed++;
  } else {
    basicLog(`PASS: ${message}`);
    passed++;
  }
}

const mesh2D = {
  meshDimension: "2D",
  elementOrder: "linear",
  numElementsX: 4,
  numElementsY: 2,
  maxX: 4,
  maxY: 2,
};
const mesh1D = { meshDimension: "1D", elementOrder: "linear", numElementsX: 4, maxX: 1 };

// The Jacobi method is used with linear elements only (it requires diagonally dominant matrices)
const cases = [
  {
    label: "heat conduction 1D",
    modelConfig: ["heatConductionScript"],
    meshConfig: mesh1D,
    boundaryConditions: { 0: ["constantTemperature", 0], 1: ["constantTemperature", 1] },
    solverMethods: ["lusolve", "jacobi", "frontal"],
    degreesOfFreedom: 5,
  },
  {
    label: "heat conduction 2D",
    modelConfig: ["heatConductionScript"],
    meshConfig: mesh2D,
    boundaryConditions: {
      0: ["constantTemperature", 200],
      1: ["symmetry"],
      2: ["convection", 1, 20],
      3: ["constantTemperature", 200],
    },
    solverMethods: ["lusolve", "jacobi", "frontal"],
    degreesOfFreedom: 15,
    plot: true,
  },
  {
    label: "front propagation 2D",
    modelConfig: ["frontPropagationScript"],
    meshConfig: mesh2D,
    boundaryConditions: {
      0: ["constantValue", 0],
      1: ["constantValue", 0],
      2: ["zeroGradient"],
      3: ["constantValue", 0],
    },
    solverMethods: ["lusolve", "frontal"],
    degreesOfFreedom: 15,
    plot: true,
  },
  {
    label: "general form PDE 1D",
    modelConfig: [
      "generalFormPDEScript",
      { coefficientFunctions: { A: () => 1, B: () => 0, C: () => 0, D: () => 1 } },
    ],
    meshConfig: mesh1D,
    boundaryConditions: { 0: ["constantValue", 0], 1: ["constantValue", 0] },
    solverMethods: ["lusolve", "jacobi"],
    degreesOfFreedom: 5,
  },
  {
    label: "nonlinear general form PDE 1D",
    modelConfig: [
      "generalFormPDEScript",
      {
        nonlinear: true,
        coefficientFunctions: {
          A: () => 1,
          B: () => 0,
          C: () => 0,
          D: (x, u) => u * u,
          dDdu: (x, u) => 2 * u,
        },
      },
    ],
    meshConfig: mesh1D,
    boundaryConditions: { 0: ["constantValue", 1], 1: ["zeroGradient"] },
    solverMethods: ["lusolve"],
    degreesOfFreedom: 5,
  },
  {
    label: "creeping flow 2D",
    modelConfig: ["creepingFlowScript"],
    meshConfig: { ...mesh2D, elementOrder: "quadratic", numElementsX: 2, numElementsY: 2, maxX: 1, maxY: 1 },
    boundaryConditions: {
      0: ["constantVelocity", 0, 0],
      1: ["constantVelocity", 0, 0],
      2: ["constantVelocity", 1, 0],
      3: ["constantVelocity", 0, 0],
    },
    solverMethods: ["lusolve"],
    // 25 velocity nodes (u and v) and 9 pressure nodes
    degreesOfFreedom: 59,
  },
  {
    label: "Euler-Bernoulli beam 1D",
    modelConfig: ["eulerBernoulliBeamScript", { coefficientFunctions: { EI: () => 1, q: () => -1 } }],
    meshConfig: { ...mesh1D, numElementsX: 2 },
    boundaryConditions: { 1: [["fixed"]], 3: [["force", -1]] },
    solverMethods: ["lusolve"],
    // Deflection and rotation at 3 nodes
    degreesOfFreedom: 6,
  },
];

function runSimulation({ modelConfig, meshConfig, boundaryConditions }, solverMethod) {
  const model = new FEAScriptModel();
  model.setModelConfig(...modelConfig);
  model.setMeshConfig(meshConfig);
  Object.entries(boundaryConditions).forEach(([boundaryKey, condition]) => {
    model.addBoundaryCondition(boundaryKey, condition);
  });
  model.setSolverMethod(solverMethod);
  return { model, result: model.solve({ maxIterations: 200000, tolerance: 1e-10 }) };
}

const largestDifference = (a, b) => Math.max(...Array.from(a, (value, i) => Math.abs(value - b[i])));

for (const testCase of cases) {
  let referenceSolution = null;
  let referencePlot = null;

  for (const solverMethod of testCase.solverMethods) {
    const label = `${testCase.label}, ${solverMethod}`;
    const { model, result } = runSimulation(testCase, solverMethod);
    const { solutionVector } = result;

    assert(solutionVector instanceof Float64Array, `${label}: solution vector is a Float64Array`);
    assert(
      solutionVector.length === testCase.degreesOfFreedom,
      `${label}: ${testCase.degreesOfFreedom} entries (got ${solutionVector.length})`,
    );

    if (testCase.plot) {
      plottedTrace = null;
      plotInterpolatedSolution(model, result, "contour", "plotDiv");
    }

    if (referenceSolution === null) {
      referenceSolution = solutionVector;
      referencePlot = plottedTrace;
      continue;
    }

    const difference = largestDifference(solutionVector, referenceSolution);
    assert(
      difference < SOLVER_TOLERANCE,
      `${label}: matches lusolve, largest difference ${difference.toExponential(
        3,
      )} (tolerance ${SOLVER_TOLERANCE})`,
    );

    if (testCase.plot) {
      const plotDifference = Math.max(
        ...plottedTrace.z.map((value, i) =>
          value === null && referencePlot.z[i] === null ? 0 : Math.abs(value - referencePlot.z[i]),
        ),
      );
      assert(
        plotDifference < SOLVER_TOLERANCE,
        `${label}: interpolated contour plot matches lusolve, largest difference ${plotDifference.toExponential(
          3,
        )} (tolerance ${SOLVER_TOLERANCE})`,
      );
    }
  }
}

// Single unknown: the LU solver must still return a Float64Array (not a scalar)
const { solutionVector: singleUnknown } = mathjsLUSolver([[2]], [4], { matrixType: "sparse" });
assert(
  singleUnknown instanceof Float64Array && singleUnknown.length === 1 && singleUnknown[0] === 2,
  "LU solver, single unknown: Float64Array [2]",
);

basicLog(`Solution vector format tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
