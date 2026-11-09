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
 * Input checks, which throw a FEAScriptError (INVALID_INPUT unless noted) instead of giving a wrong result:
 *  - An unknown (e.g. misspelled) condition type, a missing condition value and a value that is not a number
 *  - Every problem of the input is reported at once, in one error
 *  - A condition on a boundary, or a beam node, that is not in the mesh
 *  - The supported condition types, and the deprecated "constantTemp", still solve
 *  - A condition given as a plain string is wrapped in an array, with a warning, and gives the same solution;
 *    a condition that is not an array throws when added
 *  - Euler-Bernoulli beam conditions that are not an array of conditions, or of an unknown type
 *  - A missing or misspelled model, a missing coefficient function, and a coefficient that the model does not
 *    use (e.g. misspelled)
 *  - A coefficient function that returns NaN, with every solver method (NON_FINITE_VALUES)
 *  - Mesh settings: no elements, a missing length, a 3D dimension, and linear elements for creeping flow
 *    (UNSUPPORTED_MESH)
 *  - A FEAScriptError thrown in the worker keeps its code and details
 *
 * Plot input checks, which throw a FEAScriptError (INVALID_INPUT) instead of plotting something else or nothing:
 *  - An unknown field, and a field requested from a result without named fields
 *  - A plot type that the function cannot draw for the mesh dimension
 *  - A plot container that does not exist
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
 * Worker start:
 *  - A call made while the worker starts goes through as soon as the worker is ready
 *  - A worker that fails to start reports the failure to the waiting call, without waiting for the timeout
 *
 * Solver failures, which throw a FEAScriptError instead of returning an empty or a wrong result:
 *  - A solver method that the model does not support, whichever model and method
 *  - A method that does not converge
 *  - solveAsync with anything but the WebGPU Jacobi solver for heat conduction
 *  - A singular system, with the direct solvers
 *
 * Run: node tests/unit/model.test.js (or npm test)
 */

import { FEAScriptModel } from "../../src/FEAScript.js";
import { mathjsLUSolver } from "../../src/solvers/mathjsLUSolver.js";
import { plotSolution, plotInterpolatedSolution } from "../../src/visualization/plotlyPlot.js";
import { serializeFunctions, deserializeFunctions } from "../../src/workers/functionSerialization.js";
import { FEAScriptWorker } from "../../src/workers/worker.js";
import * as Comlink from "../../src/vendor/comlink.mjs";
import { FEAScriptError } from "../../src/utilities/errors.js";
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

// Input checks
{
  basicLog("");
  basicLog("[Input checks]");

  // Run a function and return what it threw (null if nothing) and the [ERROR] and [WARN] messages it logged,
  // together with its result
  function attempt(run) {
    const messages = [];
    const { log, time, timeEnd } = console;
    Object.assign(console, {
      log(message, ...rest) {
        if (typeof message === "string" && /\[(ERROR|WARN)\]/.test(message)) messages.push(message);
        else if (!(typeof message === "string" && message.includes("[INFO]"))) log(message, ...rest);
      },
      time() {},
      timeEnd() {},
    });
    let result = null;
    let failure = null;
    try {
      result = run();
    } catch (error) {
      failure = error;
    } finally {
      Object.assign(console, { log, time, timeEnd });
    }
    return {
      result,
      failure,
      errors: messages.filter((m) => m.includes("[ERROR]")),
      warnings: messages.filter((m) => m.includes("[WARN]")),
    };
  }

  // True when the run threw a FEAScriptError with this code, and with every given text in its message
  const threw = (run, code, ...texts) =>
    run.failure instanceof FEAScriptError &&
    run.failure.code === code &&
    texts.every((text) => run.failure.message.includes(text));

  const mesh1D = { meshDimension: "1D", elementOrder: "linear", numElementsX: 4, maxX: 1 };

  function solveHeatConduction(boundaryConditions, { meshConfig = mesh1D, coefficientFunctions } = {}) {
    const model = new FEAScriptModel();
    model.setModelConfig("heatConductionScript", coefficientFunctions ? { coefficientFunctions } : {});
    model.setMeshConfig(meshConfig);
    Object.entries(boundaryConditions).forEach(([key, condition]) =>
      model.addBoundaryCondition(key, condition),
    );
    return model.solve();
  }

  function solveGeneralForm(
    rightCondition,
    coefficientFunctions = { A: (x) => 1, B: (x) => 0, C: (x) => 0, D: (x) => 1 },
  ) {
    const model = new FEAScriptModel();
    model.setModelConfig("generalFormPDEScript", { coefficientFunctions });
    model.setMeshConfig(mesh1D);
    model.addBoundaryCondition("0", ["constantValue", 1]);
    model.addBoundaryCondition("1", rightCondition);
    return model.solve();
  }

  const solveBeam = (conditions) =>
    attempt(() => {
      const model = new FEAScriptModel();
      model.setModelConfig("eulerBernoulliBeamScript", { coefficientFunctions: { EI: (x) => 1 } });
      model.setMeshConfig({ meshDimension: "1D", elementOrder: "linear", numElementsX: 2, maxX: 1 });
      Object.entries(conditions).forEach(([key, condition]) => model.addBoundaryCondition(key, condition));
      return model.solve();
    });

  // Boundary condition types
  {
    const misspelled = attempt(() =>
      solveHeatConduction({ 0: ["convektion", 1, 25], 1: ["constantTemperature", 5] }),
    );
    assert(
      threw(misspelled, "INVALID_INPUT", 'Unknown boundary condition type "convektion"', "boundary 0"),
      "misspelled condition type throws INVALID_INPUT",
    );

    const supported = attempt(() =>
      solveHeatConduction({ 0: ["convection", 1, 25], 1: ["constantTemperature", 5] }),
    );
    assert(
      supported.failure === null && supported.errors.length === 0,
      "supported heat conduction condition types solve",
    );

    const deprecated = attempt(() => solveHeatConduction({ 0: ["symmetry"], 1: ["constantTemp", 5] }));
    assert(deprecated.failure === null, 'deprecated "constantTemp" still solves');
  }

  // Plain string and non-array conditions
  {
    const arrayRun = attempt(() => solveGeneralForm(["zeroGradient"]));
    const stringRun = attempt(() => solveGeneralForm("zeroGradient"));
    assert(
      stringRun.warnings.some((m) => m.includes('use ["zeroGradient"] instead of "zeroGradient"')),
      "plain string condition gives a warning",
    );
    assert(stringRun.failure === null, "plain string condition solves");
    const largestDifference = Math.max(
      ...Array.from(arrayRun.result.solutionVector).map((value, index) =>
        Math.abs(value - stringRun.result.solutionVector[index]),
      ),
    );
    assert(largestDifference === 0, "plain string condition gives the same solution as the array form");

    const numberRun = attempt(() => new FEAScriptModel().addBoundaryCondition("0", 5));
    assert(
      threw(numberRun, "INVALID_INPUT", "must be an array with the condition type first"),
      "a condition that is not an array throws INVALID_INPUT when added",
    );
  }

  // Boundary condition values
  {
    const missingValue = attempt(() =>
      solveHeatConduction({ 0: ["constantTemperature"], 1: ["constantTemperature", 5] }),
    );
    assert(
      threw(missingValue, "INVALID_INPUT", '"constantTemperature" on boundary 0 needs 1 number'),
      "a missing condition value throws INVALID_INPUT",
    );

    const stringValue = attempt(() =>
      solveHeatConduction({ 0: ["constantTemperature", "5"], 1: ["constantTemperature", 5] }),
    );
    assert(
      threw(stringValue, "INVALID_INPUT", 'must be a finite number; got "5"'),
      "a condition value given as a string throws INVALID_INPUT",
    );

    const twoProblems = attempt(() =>
      solveHeatConduction({ 0: ["convection", 1], 1: ["constantTemprature", 5] }),
    );
    assert(
      threw(twoProblems, "INVALID_INPUT", "2 problems found") && twoProblems.failure.details.length === 2,
      "every input problem is reported at once, in one error",
    );
  }

  // Boundaries that are not in the mesh
  {
    const missingBoundary = attempt(() =>
      solveHeatConduction({ 0: ["constantTemperature", 1], 5: ["constantTemperature", 5] }),
    );
    assert(
      threw(
        missingBoundary,
        "INVALID_INPUT",
        "Boundary 5 does not exist in the mesh",
        "Boundaries of the mesh: 0, 1",
      ),
      "a condition on a boundary that is not in the mesh throws INVALID_INPUT",
    );
  }

  // Euler-Bernoulli beam conditions
  {
    assert(
      solveBeam({ 1: [["fixed"]], 3: [["force", -1]] }).failure === null,
      'beam condition [["fixed"]] solves',
    );
    assert(
      threw(
        solveBeam({ 1: ["fixed"], 3: [["force", -1]] }),
        "INVALID_INPUT",
        "must be an array of conditions",
      ),
      'beam condition ["fixed"] (not an array of conditions) throws INVALID_INPUT',
    );
    assert(
      threw(
        solveBeam({ 1: [["fixed"]], 9: [["force", -1]] }),
        "INVALID_INPUT",
        "Node 9 does not exist",
        "nodes 1 to 3",
      ),
      "a beam condition on a node that is not in the mesh throws INVALID_INPUT",
    );
    assert(
      threw(
        solveBeam({ 1: [["fixed"]], 3: [["force"]] }),
        "INVALID_INPUT",
        '"force" on node 3 needs 1 number',
      ),
      "a beam force without a value throws INVALID_INPUT",
    );
    assert(
      threw(
        solveBeam({ 1: [["clamped"]], 3: [["force", -1]] }),
        "INVALID_INPUT",
        'Unknown boundary condition type "clamped"',
      ),
      "an unknown beam condition type throws INVALID_INPUT",
    );
  }

  // Model and coefficient functions
  {
    const noModel = attempt(() => {
      const model = new FEAScriptModel();
      model.setMeshConfig(mesh1D);
      return model.solve();
    });
    assert(
      threw(noModel, "INVALID_INPUT", "No model is set"),
      "a solve without a model throws INVALID_INPUT",
    );

    const unknownModel = attempt(() => {
      const model = new FEAScriptModel();
      model.setModelConfig("heatConductionScrpt");
      model.setMeshConfig(mesh1D);
      return model.solve();
    });
    assert(
      threw(unknownModel, "INVALID_INPUT", 'Unknown model "heatConductionScrpt"'),
      "a misspelled model throws INVALID_INPUT",
    );

    const missingFunction = attempt(() =>
      solveGeneralForm(["zeroGradient"], { A: (x) => 1, B: (x) => 0, C: (x) => 0 }),
    );
    assert(
      threw(missingFunction, "INVALID_INPUT", "needs the coefficient function D"),
      "a missing coefficient function throws INVALID_INPUT",
    );

    const misspelledCoefficient = attempt(() =>
      solveHeatConduction(
        { 0: ["constantTemperature", 1], 1: ["constantTemperature", 5] },
        { coefficientFunctions: { thermalConductivty: 2 } },
      ),
    );
    assert(
      threw(
        misspelledCoefficient,
        "INVALID_INPUT",
        "Coefficient thermalConductivty is not used by heatConductionScript",
        "Coefficients of this model: thermalConductivity, heatSource",
      ),
      "a coefficient that the model does not use (misspelled) throws INVALID_INPUT",
    );

    const nonlinearNameWhenLinear = attempt(() =>
      solveGeneralForm(["zeroGradient"], {
        A: (x) => 1,
        B: (x) => 0,
        C: (x) => 0,
        D: (x) => 1,
        dDdu: (x, u) => 0,
      }),
    );
    assert(
      nonlinearNameWhenLinear.failure === null,
      "dDdu is accepted for a linear general form PDE, where it is not needed",
    );

    const nanSource = attempt(() =>
      solveHeatConduction(
        { 0: ["constantTemperature", 1], 1: ["constantTemperature", 5] },
        { coefficientFunctions: { heatSource: (x) => (x > 0.5 ? NaN : 0) } },
      ),
    );
    assert(
      threw(nanSource, "NON_FINITE_VALUES", "NaN or infinite"),
      "a coefficient function that returns NaN throws NON_FINITE_VALUES, with lusolve",
    );
    for (const solverMethod of ["jacobi", "frontal"]) {
      const run = attempt(() => {
        const model = new FEAScriptModel();
        model.setModelConfig("heatConductionScript", {
          coefficientFunctions: { heatSource: (x) => (x > 0.5 ? NaN : 0) },
        });
        model.setMeshConfig(mesh1D);
        model.addBoundaryCondition("0", ["constantTemperature", 1]);
        model.addBoundaryCondition("1", ["constantTemperature", 5]);
        model.setSolverMethod(solverMethod);
        return model.solve();
      });
      assert(
        threw(run, "NON_FINITE_VALUES", "NaN or infinite"),
        `a coefficient function that returns NaN throws NON_FINITE_VALUES, with ${solverMethod}`,
      );
    }
  }

  // Mesh settings
  {
    const bcs = { 0: ["constantTemperature", 1], 1: ["constantTemperature", 5] };
    const zeroElements = attempt(() =>
      solveHeatConduction(bcs, { meshConfig: { ...mesh1D, numElementsX: 0 } }),
    );
    assert(
      threw(zeroElements, "INVALID_INPUT", "numElementsX must be a positive integer; got 0"),
      "zero elements throws INVALID_INPUT",
    );

    const noLength = attempt(() => solveHeatConduction(bcs, { meshConfig: { ...mesh1D, maxX: undefined } }));
    assert(
      threw(noLength, "INVALID_INPUT", "maxX is required"),
      "a missing mesh length throws INVALID_INPUT",
    );

    const dimension3D = attempt(() =>
      solveHeatConduction(bcs, { meshConfig: { ...mesh1D, meshDimension: "3D" } }),
    );
    assert(
      threw(dimension3D, "INVALID_INPUT", 'Mesh dimension must be either "1D" or "2D"; got "3D"'),
      "a 3D mesh dimension throws INVALID_INPUT",
    );

    const linearFlow = attempt(() => {
      const model = new FEAScriptModel();
      model.setModelConfig("creepingFlowScript");
      model.setMeshConfig({
        meshDimension: "2D",
        elementOrder: "linear",
        numElementsX: 2,
        numElementsY: 2,
        maxX: 1,
        maxY: 1,
      });
      ["0", "1", "2", "3"].forEach((key) => model.addBoundaryCondition(key, ["constantVelocity", 0, 0]));
      return model.solve();
    });
    assert(
      threw(linearFlow, "UNSUPPORTED_MESH", "requires quadratic elements"),
      "creeping flow with linear elements throws UNSUPPORTED_MESH",
    );
  }

  // A FEAScriptError thrown in the worker keeps its code and details on the way back
  {
    const throwHandler = Comlink.transferHandlers.get("throw");
    const sent = new FEAScriptError("INVALID_INPUT", "2 problems found", ["first", "second"]);
    const [serialized] = throwHandler.serialize({ value: sent });
    const received = attempt(() => throwHandler.deserialize(structuredClone(serialized)));
    assert(
      threw(received, "INVALID_INPUT", "2 problems found") &&
        received.failure.details.join() === "first,second",
      "a FEAScriptError keeps its code and details through the worker",
    );
    const [plainSerialized] = throwHandler.serialize({ value: new TypeError("plain") });
    const plain = attempt(() => throwHandler.deserialize(structuredClone(plainSerialized)));
    assert(plain.failure?.message === "plain", "other errors still go through the worker as before");
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
      solverMethods: ["lusolve", "frontal"],
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

// Plot input checks (Plotly and window are stubbed above)
{
  basicLog("");
  basicLog("[Plot input checks]");

  const plotFailure = (run) => {
    const { log, time, timeEnd } = console;
    Object.assign(console, { log() {}, time() {}, timeEnd() {} });
    try {
      run();
      return null;
    } catch (failure) {
      return failure;
    } finally {
      Object.assign(console, { log, time, timeEnd });
    }
  };
  const isInvalidInput = (failure, text) =>
    failure instanceof FEAScriptError && failure.code === "INVALID_INPUT" && failure.message.includes(text);

  const solveQuietly = (build) => {
    let solved;
    plotFailure(() => {
      solved = build();
    });
    return solved;
  };
  const heatModel = new FEAScriptModel();
  const heatResult = solveQuietly(() => {
    heatModel.setModelConfig("heatConductionScript");
    heatModel.setMeshConfig({ meshDimension: "1D", elementOrder: "linear", numElementsX: 4, maxX: 1 });
    heatModel.addBoundaryCondition("0", ["constantTemperature", 1]);
    heatModel.addBoundaryCondition("1", ["constantTemperature", 5]);
    return heatModel.solve();
  });
  const beamModel = new FEAScriptModel();
  const beamResult = solveQuietly(() => {
    beamModel.setModelConfig("eulerBernoulliBeamScript", { coefficientFunctions: { EI: (x) => 1 } });
    beamModel.setMeshConfig({ meshDimension: "1D", elementOrder: "linear", numElementsX: 2, maxX: 1 });
    beamModel.addBoundaryCondition("1", [["fixed"]]);
    beamModel.addBoundaryCondition("3", [["force", -1]]);
    return beamModel.solve();
  });

  assert(
    plotFailure(() => plotSolution(heatModel, heatResult, "line", "plotDiv")) === null,
    "a 1D line plot draws",
  );
  assert(
    plotFailure(() => plotSolution(beamModel, beamResult, "line", "plotDiv", { field: "theta" })) === null,
    "a named field of the beam draws",
  );
  assert(
    isInvalidInput(
      plotFailure(() => plotSolution(beamModel, beamResult, "line", "plotDiv", { field: "rotation" })),
      'Unknown field "rotation". Available fields: w, theta',
    ),
    "an unknown field throws INVALID_INPUT",
  );
  assert(
    isInvalidInput(
      plotFailure(() => plotSolution(heatModel, heatResult, "line", "plotDiv", { field: "u" })),
      "has no named fields",
    ),
    "a field requested from a result without named fields throws INVALID_INPUT",
  );
  assert(
    isInvalidInput(
      plotFailure(() => plotSolution(heatModel, heatResult, "contour", "plotDiv")),
      'cannot draw a "contour" plot of a 1D mesh',
    ),
    "a contour plot of a 1D mesh throws INVALID_INPUT",
  );
  assert(
    isInvalidInput(
      plotFailure(() => plotInterpolatedSolution(heatModel, heatResult, "line", "plotDiv")),
      'cannot draw a "line" plot of a 1D mesh',
    ),
    "an interpolated plot of a 1D mesh throws INVALID_INPUT",
  );

  globalThis.document = { getElementById: (id) => (id === "plotDiv" ? {} : null) };
  try {
    assert(
      isInvalidInput(
        plotFailure(() => plotSolution(heatModel, heatResult, "line", "plotDvi")),
        "Could not find plot container with id: plotDvi",
      ),
      "a plot container that does not exist throws INVALID_INPUT",
    );
  } finally {
    delete globalThis.document;
  }
}

// Solver failures
{
  basicLog("");
  basicLog("[Solver failures]");

  const failureOf = (run) => {
    const { log, error, time, timeEnd } = console;
    Object.assign(console, { log() {}, error() {}, time() {}, timeEnd() {} });
    try {
      run();
      return null;
    } catch (failure) {
      return failure;
    } finally {
      Object.assign(console, { log, error, time, timeEnd });
    }
  };

  const beamModel = (solverMethod) => {
    const model = new FEAScriptModel();
    model.setModelConfig("eulerBernoulliBeamScript", { coefficientFunctions: { EI: () => 1e5 } });
    model.setMeshConfig({ meshDimension: "1D", elementOrder: "linear", numElementsX: 4, maxX: 4 });
    model.addBoundaryCondition("1", [["fixed"]]);
    model.addBoundaryCondition("5", [["force", -1000]]);
    model.setSolverMethod(solverMethod);
    return model;
  };

  const flowModel = (solverMethod) => {
    const model = new FEAScriptModel();
    model.setModelConfig("creepingFlowScript", { coefficientFunctions: { viscosity: 1 } });
    model.setMeshConfig({
      meshDimension: "2D",
      elementOrder: "quadratic",
      numElementsX: 2,
      numElementsY: 2,
      maxX: 1,
      maxY: 1,
    });
    model.addBoundaryCondition("0", ["constantVelocity", 0, 0]);
    model.addBoundaryCondition("1", ["constantVelocity", 0, 0]);
    model.addBoundaryCondition("2", ["constantVelocity", 1, 0]);
    model.addBoundaryCondition("3", ["constantVelocity", 0, 0]);
    model.setSolverMethod(solverMethod);
    return model;
  };

  const unsupported = [
    ["Beam with frontal", beamModel("frontal")],
    ["Creeping flow with frontal", flowModel("frontal")],
    ["Creeping flow with jacobi", flowModel("jacobi")],
    ["Beam with an unknown method", beamModel("gauss")],
    ["Beam with jacobi-gpu in solve()", beamModel("jacobi-gpu")],
  ];
  for (const [name, model] of unsupported) {
    const failure = failureOf(() => model.solve());
    assert(
      failure instanceof FEAScriptError && failure.code === "UNSUPPORTED_SOLVER",
      `${name} throws UNSUPPORTED_SOLVER`,
    );
  }

  const diverged = failureOf(() => beamModel("jacobi").solve());
  assert(
    diverged instanceof FEAScriptError && diverged.code === "NOT_CONVERGED",
    "Jacobi on a beam, which diverges, throws NOT_CONVERGED",
  );

  const asyncFailure = await beamModel("lusolve")
    .solveAsync()
    .then(
      () => null,
      (failure) => failure,
    );
  assert(asyncFailure?.code === "UNSUPPORTED_SOLVER", "solveAsync refuses what it cannot solve");

  for (const solverMethod of ["frontal", "lusolve"]) {
    const model = new FEAScriptModel();
    model.setModelConfig("heatConductionScript", { coefficientFunctions: { thermalConductivity: () => 0 } });
    model.setMeshConfig({ meshDimension: "1D", elementOrder: "linear", numElementsX: 4, maxX: 1 });
    model.addBoundaryCondition("0", ["constantTemperature", 1]);
    model.addBoundaryCondition("1", ["convection", 1, 0]);
    model.setSolverMethod(solverMethod);
    const failure = failureOf(() => model.solve());
    assert(
      failure?.code === "SINGULAR_MATRIX",
      `Zero conductivity with ${solverMethod} throws SINGULAR_MATRIX`,
    );
  }

  assert(failureOf(() => flowModel("lusolve").solve()) === null, "Creeping flow still solves with lusolve");
  assert(failureOf(() => beamModel("lusolve").solve()) === null, "A beam still solves with lusolve");
}

// Worker start. Node has no web workers, so these replace the step that starts one
{
  basicLog("");
  basicLog("[Worker start]");

  const START_TIME = 20; // Milliseconds

  class StartingWorker extends FEAScriptWorker {
    async _initWorker() {
      await new Promise((resolve) => setTimeout(resolve, START_TIME));
      this.feaWorker = { ping: async () => true };
      this.isReady = true;
    }
  }

  class FailingWorker extends FEAScriptWorker {
    async _initWorker() {
      throw new Error("No worker");
    }
  }

  const startTime = performance.now();
  const answer = await new StartingWorker().ping();
  const waited = performance.now() - startTime;
  assert(
    answer === true && waited < 500,
    `A call waits only until the worker is ready (${waited.toFixed(0)} ms)`,
  );

  const failure = await new FailingWorker().ping().catch((error) => error.message);
  assert(failure === "No worker", "A worker that fails to start reports the failure to the waiting call");
}

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
