/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for FEAScriptModel input and output
 *
 * Boundary condition input checks:
 *  - An unknown (e.g. misspelled) condition type is reported as an error when solving
 *  - The supported condition types of every model, and the deprecated "constantTemp", are not reported
 *  - A condition given as a plain string is wrapped in an array, with a warning, and gives the same solution
 *  - Euler-Bernoulli beam conditions that are not an array of conditions are reported as an error
 *
 * Solution vector format, every model and every applicable solver method (lusolve, jacobi, frontal):
 *  - The solution vector is a Float64Array with one entry per degree of freedom
 *  - Every solver method gives the same values as lusolve
 *  - The interpolated contour plot is the same whichever solver method produced the solution
 *  - The LU solver returns a Float64Array also for a single unknown
 *
 * Worker model options, sent through the same steps as in the worker (serializeFunctions, structured clone,
 * deserializeFunctions):
 *  - Arrow functions, function expressions and methods are rebuilt and can be called
 *  - Numbers, booleans and nested objects are kept
 *  - Every model gives the same solution with the rebuilt options as with the original options
 *  - Native functions are rejected with an error
 *
 * Run: node tests/unit/model.test.js (or npm test)
 */

import { FEAScriptModel } from "../../src/FEAScript.js";
import { mathjsLUSolver } from "../../src/solvers/mathjsLUSolver.js";
import { plotInterpolatedSolution } from "../../src/visualization/plotlyPlot.js";
import { serializeFunctions, deserializeFunctions } from "../../src/workers/functionSerialization.js";
import { basicLog, errorLog } from "../../src/utilities/logging.js";

basicLog("");
basicLog("================================");
basicLog("Unit tests: FEAScriptModel input and output");

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

// Boundary condition input checks
{
  basicLog("");
  basicLog("[Boundary condition input checks]");

  // Run a function and return the [ERROR] and [WARN] messages it logs, together with its result (null if it threw,
  // e.g. when a rejected support leaves the system singular)
  function captureLogs(run) {
    const messages = [];
    const originalLog = console.log;
    console.log = (message, ...rest) => {
      if (typeof message === "string" && /\[(ERROR|WARN)\]/.test(message)) messages.push(message);
      else originalLog(message, ...rest);
    };
    let result = null;
    try {
      result = run();
    } catch {
      // The logged messages are what is checked
    } finally {
      console.log = originalLog;
    }
    return {
      result,
      errors: messages.filter((m) => m.includes("[ERROR]")),
      warnings: messages.filter((m) => m.includes("[WARN]")),
    };
  }

  function solveHeatConduction(boundaryConditions) {
    const model = new FEAScriptModel();
    model.setModelConfig("heatConductionScript");
    model.setMeshConfig({ meshDimension: "1D", elementOrder: "linear", numElementsX: 4, maxX: 1 });
    Object.entries(boundaryConditions).forEach(([key, condition]) =>
      model.addBoundaryCondition(key, condition),
    );
    return model.solve();
  }

  function solveGeneralForm(rightCondition) {
    const model = new FEAScriptModel();
    model.setModelConfig("generalFormPDEScript", {
      coefficientFunctions: { A: (x) => 1, B: (x) => 0, C: (x) => 0, D: (x) => 1 },
    });
    model.setMeshConfig({ meshDimension: "1D", elementOrder: "linear", numElementsX: 4, maxX: 1 });
    model.addBoundaryCondition("0", ["constantValue", 1]);
    model.addBoundaryCondition("1", rightCondition);
    return model.solve();
  }

  // Unknown condition type
  {
    const { errors } = captureLogs(() =>
      solveHeatConduction({ 0: ["convektion", 1, 25], 1: ["constantTemperature", 5] }),
    );
    assert(
      errors.some(
        (m) => m.includes('Unknown boundary condition type "convektion"') && m.includes("boundary 0"),
      ),
      "misspelled condition type is reported as an error",
    );
  }

  // Supported and deprecated condition types
  {
    const { errors } = captureLogs(() =>
      solveHeatConduction({ 0: ["convection", 1, 25], 1: ["constantTemperature", 5] }),
    );
    assert(errors.length === 0, "supported heat conduction condition types are not reported");

    const deprecated = captureLogs(() => solveHeatConduction({ 0: ["symmetry"], 1: ["constantTemp", 5] }));
    assert(deprecated.errors.length === 0, 'deprecated "constantTemp" is not reported as unknown');
  }

  // Plain string condition
  {
    const arrayRun = captureLogs(() => solveGeneralForm(["zeroGradient"]));
    const stringRun = captureLogs(() => solveGeneralForm("zeroGradient"));
    assert(
      stringRun.warnings.some((m) => m.includes('use ["zeroGradient"] instead of "zeroGradient"')),
      "plain string condition gives a warning",
    );
    assert(stringRun.errors.length === 0, "plain string condition is not reported as unknown");
    const largestDifference = Math.max(
      ...Array.from(arrayRun.result.solutionVector).map((value, index) =>
        Math.abs(value - stringRun.result.solutionVector[index]),
      ),
    );
    assert(largestDifference === 0, "plain string condition gives the same solution as the array form");
  }

  // Euler-Bernoulli beam conditions
  {
    const solveBeam = (condition) =>
      captureLogs(() => {
        const model = new FEAScriptModel();
        model.setModelConfig("eulerBernoulliBeamScript", { coefficientFunctions: { EI: (x) => 1 } });
        model.setMeshConfig({ meshDimension: "1D", elementOrder: "linear", numElementsX: 2, maxX: 1 });
        model.addBoundaryCondition("1", condition);
        model.addBoundaryCondition("3", [["force", -1]]);
        return model.solve();
      });
    assert(solveBeam([["fixed"]]).errors.length === 0, 'beam condition [["fixed"]] is not reported');
    assert(
      solveBeam(["fixed"]).errors.some((m) => m.includes("must be an array of conditions")),
      'beam condition ["fixed"] (not an array of conditions) is reported as an error',
    );
  }
}

// Solution vector format
{
  basicLog("");
  basicLog("[Solution vector format]");

  const SOLVER_TOLERANCE = 1e-6;

  // Minimal browser stubs: capture the trace passed to Plotly instead of rendering it
  let plottedTrace = null;
  globalThis.window = { innerWidth: 700 };
  globalThis.Plotly = {
    newPlot: (plotDivId, data) => {
      plottedTrace = data[0];
    },
  };

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
      meshConfig: {
        ...mesh2D,
        elementOrder: "quadratic",
        numElementsX: 2,
        numElementsY: 2,
        maxX: 1,
        maxY: 1,
      },
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
}

// Worker model options
{
  basicLog("");
  basicLog("[Worker model options]");

  const SOLVER_TOLERANCE = 1e-12;

  // Send the options as FEAScriptWorker does: structuredClone throws on functions, as postMessage does
  function sendToWorker(options) {
    return deserializeFunctions(structuredClone(serializeFunctions(options)));
  }

  // Function forms
  const rebuilt = sendToWorker({
    arrow: (x) => 2 * x,
    expression: function (x) {
      return 3 * x;
    },
    method(x) {
      return 4 * x;
    },
    twoArguments: (x, u) => x + u ** 2,
    number: 5,
    flag: true,
    nested: { inner: (x) => x - 1 },
  });
  assert(rebuilt.arrow(2) === 4, "Arrow function is rebuilt");
  assert(rebuilt.expression(2) === 6, "Function expression is rebuilt");
  assert(rebuilt.method(2) === 8, "Method is rebuilt");
  assert(rebuilt.twoArguments(1, 3) === 10, "Function of two arguments is rebuilt");
  assert(rebuilt.number === 5 && rebuilt.flag === true, "Numbers and booleans are kept");
  assert(rebuilt.nested.inner(3) === 2, "Function in a nested object is rebuilt");

  // Native functions have no source code to send
  let nativeError = null;
  try {
    serializeFunctions({ coefficientFunctions: { D: Math.sin } });
  } catch (error) {
    nativeError = error;
  }
  assert(nativeError !== null, "Native function is rejected with an error");

  // Every model gives the same solution with the options sent to the worker
  const testCases = [
    {
      label: "General form PDE (linear)",
      modelConfig: "generalFormPDEScript",
      options: {
        coefficientFunctions: {
          A: (x) => 1,
          B: (x) => -10,
          C: (x) => 0,
          D: (x) => 10 * Math.exp(-200 * Math.pow(x - 0.5, 2)),
        },
      },
      meshConfig: { meshDimension: "1D", elementOrder: "quadratic", numElementsX: 20, maxX: 1.0 },
      boundaryConditions: { 0: ["constantValue", 1], 1: ["zeroGradient"] },
    },
    {
      label: "General form PDE (nonlinear)",
      modelConfig: "generalFormPDEScript",
      options: {
        nonlinear: true,
        maxIterations: 50,
        tolerance: 1e-8,
        coefficientFunctions: {
          A: (x) => 1,
          B: (x) => 0,
          C: (x) => 0,
          D: (x, u) => 0.5 * u ** 2,
          dDdu: (x, u) => 2 * 0.5 * u,
        },
      },
      meshConfig: { meshDimension: "1D", elementOrder: "linear", numElementsX: 20, maxX: 10.0 },
      boundaryConditions: { 0: ["constantValue", 1], 1: ["zeroGradient"] },
    },
    {
      label: "Euler-Bernoulli beam",
      modelConfig: "eulerBernoulliBeamScript",
      options: {
        coefficientFunctions: {
          EI: (x) => 2.0e6,
          q: (x) => (x <= 5 ? -1000 : 0),
        },
      },
      meshConfig: { meshDimension: "1D", elementOrder: "linear", numElementsX: 2, maxX: 10 },
      boundaryConditions: {
        1: [["fixed"]],
        2: [["pinned"], ["moment", 1250]],
        3: [
          ["spring", 200],
          ["force", -2500],
        ],
      },
    },
    {
      label: "Heat conduction (varying k and Q)",
      modelConfig: "heatConductionScript",
      options: {
        coefficientFunctions: {
          thermalConductivity: (x, y) => 1 + x + y,
          heatSource: 2,
        },
      },
      meshConfig: {
        meshDimension: "2D",
        elementOrder: "quadratic",
        numElementsX: 8,
        numElementsY: 4,
        maxX: 4,
        maxY: 2,
      },
      boundaryConditions: {
        0: ["constantTemperature", 200],
        1: ["symmetry"],
        2: ["convection", 1, 20],
        3: ["constantTemperature", 200],
      },
    },
    {
      label: "Creeping flow (varying viscosity)",
      modelConfig: "creepingFlowScript",
      options: {
        coefficientFunctions: {
          viscosity: (x, y) => 1 + x * y,
        },
      },
      meshConfig: {
        meshDimension: "2D",
        elementOrder: "quadratic",
        numElementsX: 4,
        numElementsY: 2,
        maxX: 4,
        maxY: 2,
      },
      boundaryConditions: {
        0: ["constantVelocity", 0, 0],
        1: ["constantVelocity", 0, 0],
        2: ["constantVelocity", 1, 0],
        3: ["constantVelocity", 0, 0],
      },
    },
  ];

  for (const testCase of testCases) {
    const solveWith = (options) => {
      const model = new FEAScriptModel();
      model.setModelConfig(testCase.modelConfig, options);
      model.setMeshConfig(testCase.meshConfig);
      Object.entries(testCase.boundaryConditions).forEach(([boundaryKey, condition]) =>
        model.addBoundaryCondition(boundaryKey, condition),
      );
      return model.solve().solutionVector;
    };

    const reference = solveWith(testCase.options);
    const solution = solveWith(sendToWorker(testCase.options));
    const difference = Math.max(...reference.map((value, i) => Math.abs(value - solution[i])));
    assert(
      reference.length > 0 && solution.length === reference.length && difference < SOLVER_TOLERANCE,
      `${
        testCase.label
      }: same solution with the options sent to the worker, largest difference ${difference.toExponential(
        3,
      )}`,
    );
  }
}

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
