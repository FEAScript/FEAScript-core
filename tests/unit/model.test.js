/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for FEAScriptModel input and output
 *
 * Input checks, which throw a FEAScriptError (INVALID_INPUT unless noted) instead of giving a wrong result:
 *  - Condition objects: an unknown (e.g. misspelled) type, no type, a missing or unknown parameter, and a
 *    parameter that is not a number; the removed "constantTemp" names its replacement
 *  - The array form of 0.3 and plain strings still solve, with a warning that gives the object form, and give
 *    the same solution; a condition that is neither throws when added
 *  - Every problem of the input is reported at once, in one error
 *  - A condition on a boundary, or a beam node, that is not in the mesh
 *  - Euler-Bernoulli beam conditions: one object or a list per node, the array form of 0.3, a missing
 *    parameter, an array that is not an array of conditions, and an unknown type
 *  - The model names of 0.3 ("heatConductionScript") still solve, with a warning
 *  - Solver options: the method, iteration limit and tolerance reach the solver; setSolverMethod() still works
 *    with a warning; an unknown method or option and a negative tolerance throw
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
 * Run report (result.info), every model and every applicable solver method:
 *  - The method, converged and a non-negative solveTime are reported
 *  - Iterations: counted for "jacobi", null for the direct solvers
 *  - Residual: ‖R − J u‖₂ / ‖R‖₂ below the solve tolerance for "lusolve" and "jacobi", null for "frontal" and
 *    for the nonlinear models
 *  - Newton-Raphson iterations and increment for the nonlinear models, null for the linear ones
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
 * Version: the version export is the version of package.json, and the deprecated printVersion is still exported
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
import { version, printVersion } from "../../src/index.js";
import { readFileSync } from "fs";

// Applies a geometry with its mesh configuration to a model
const applyMesh = (model, { geometry, meshConfig }) => {
  model.setGeometry(geometry);
  model.setMeshConfig(meshConfig);
};

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

// Version export
{
  const packageVersion = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url))).version;
  assert(
    version === packageVersion,
    `version (${version}) is the version of package.json (${packageVersion})`,
  );
  assert(typeof printVersion === "string", "the deprecated printVersion is still exported");
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

  const mesh1D = { geometry: { line: 1 }, meshConfig: { elementOrder: "linear", divisions: 4 } };

  function solveHeatConduction(boundaryConditions, { meshConfig = mesh1D, coefficientFunctions } = {}) {
    const model = new FEAScriptModel();
    model.setModelConfig("heatConduction", coefficientFunctions ? { coefficientFunctions } : {});
    applyMesh(model, meshConfig);
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
    model.setModelConfig("generalFormPDE", { coefficientFunctions });
    applyMesh(model, mesh1D);
    model.addBoundaryCondition("left", { type: "constantValue", value: 1 });
    model.addBoundaryCondition("right", rightCondition);
    return model.solve();
  }

  const solveBeam = (conditions) =>
    attempt(() => {
      const model = new FEAScriptModel();
      model.setModelConfig("eulerBernoulliBeam", { coefficientFunctions: { EI: (x) => 1 } });
      model.setGeometry({ line: 1 });
      model.setMeshConfig({ elementOrder: "linear", divisions: 2 });
      Object.entries(conditions).forEach(([key, condition]) => model.addBoundaryCondition(key, condition));
      return model.solve();
    });

  // Boundary condition objects
  {
    const supported = attempt(() =>
      solveHeatConduction({
        left: { type: "convection", h: 1, ambientTemperature: 25 },
        right: { type: "constantTemperature", temperature: 5 },
      }),
    );
    assert(
      supported.failure === null &&
        supported.errors.length === 0 &&
        !supported.warnings.some((m) => m.includes("deprecated")),
      "heat conduction condition objects solve, without warnings",
    );

    const misspelled = attempt(() =>
      solveHeatConduction({
        0: { type: "convektion", h: 1, ambientTemperature: 25 },
        1: { type: "constantTemperature", temperature: 5 },
      }),
    );
    assert(
      threw(misspelled, "INVALID_INPUT", 'Unknown boundary condition type "convektion"', "boundary 0"),
      "misspelled condition type throws INVALID_INPUT",
    );

    const noType = attempt(() => solveHeatConduction({ 0: { temperature: 1 }, 1: { type: "symmetry" } }));
    assert(
      threw(noType, "INVALID_INPUT", "needs a type"),
      "a condition object without a type throws INVALID_INPUT",
    );

    const missingParameter = attempt(() =>
      solveHeatConduction({ 0: { type: "convection", h: 1 }, 1: { type: "symmetry" } }),
    );
    assert(
      threw(
        missingParameter,
        "INVALID_INPUT",
        '"convection" on boundary 0 needs the parameter ambientTemperature',
      ),
      "a missing parameter throws INVALID_INPUT",
    );

    const unknownParameter = attempt(() =>
      solveHeatConduction({
        0: { type: "constantTemperature", temperature: 1, value: 2 },
        1: { type: "symmetry" },
      }),
    );
    assert(
      threw(unknownParameter, "INVALID_INPUT", "has no parameter value", "Its parameters: temperature"),
      "an unknown (e.g. misspelled) parameter throws INVALID_INPUT",
    );

    const twoParameterProblems = attempt(() =>
      solveHeatConduction({
        0: { type: "convection", hh: 1, ambientTemperature: 20 },
        1: { type: "symmetry" },
      }),
    );
    assert(
      threw(twoParameterProblems, "INVALID_INPUT", "2 problems found"),
      "every problem of a condition object is reported at once",
    );

    const stringValue = attempt(() =>
      solveHeatConduction({
        0: { type: "constantTemperature", temperature: "5" },
        1: { type: "constantTemperature", temperature: 5 },
      }),
    );
    assert(
      threw(stringValue, "INVALID_INPUT", "(temperature)", 'must be a finite number; got "5"'),
      "a parameter given as a string throws INVALID_INPUT, naming the parameter",
    );

    const removed = attempt(() =>
      solveHeatConduction({ 0: { type: "symmetry" }, 1: { type: "constantTemp", temperature: 5 } }),
    );
    assert(
      threw(
        removed,
        "INVALID_INPUT",
        'Unknown boundary condition type "constantTemp"',
        'renamed "constantTemperature"',
      ),
      'the removed "constantTemp" throws INVALID_INPUT, naming "constantTemperature"',
    );

    const numberRun = attempt(() => new FEAScriptModel().addBoundaryCondition("0", 5));
    assert(
      threw(numberRun, "INVALID_INPUT", "must be an object with its type and parameters"),
      "a condition that is not an object throws INVALID_INPUT when added",
    );
  }

  // The array form of FEAScript 0.3 and plain strings, kept with a warning
  {
    const objectRun = attempt(() => solveGeneralForm({ type: "zeroGradient" }));
    const arrayRun = attempt(() => solveGeneralForm(["zeroGradient"]));
    const stringRun = attempt(() => solveGeneralForm("zeroGradient"));
    assert(
      arrayRun.warnings.some((m) => m.includes('use { type: "zeroGradient" } instead of ["zeroGradient"]')),
      "array form condition gives a warning with the object form",
    );
    assert(
      stringRun.warnings.some((m) => m.includes('use { type: "zeroGradient" } instead of "zeroGradient"')),
      "plain string condition gives a warning with the object form",
    );
    const sameSolution = (run) =>
      run.failure === null &&
      Array.from(run.result.solutionVector).every(
        (value, index) => value === objectRun.result.solutionVector[index],
      );
    assert(sameSolution(arrayRun), "array form condition gives the same solution as the object form");
    assert(sameSolution(stringRun), "plain string condition gives the same solution as the object form");

    const convectionArray = attempt(() =>
      solveHeatConduction({ 0: ["convection", 1, 25], 1: ["constantTemperature", 5] }),
    );
    assert(
      convectionArray.failure === null &&
        convectionArray.warnings.some((m) =>
          m.includes(
            'use { type: "convection", h: 1, ambientTemperature: 25 } instead of ["convection",1,25]',
          ),
        ),
      "array form with values gives a warning that names each value",
    );

    const misspelled = attempt(() =>
      solveHeatConduction({ 0: ["convektion", 1, 25], 1: ["constantTemperature", 5] }),
    );
    assert(
      threw(misspelled, "INVALID_INPUT", 'Unknown boundary condition type "convektion"', "boundary 0"),
      "array form: misspelled condition type throws INVALID_INPUT",
    );

    const missingValue = attempt(() =>
      solveHeatConduction({ 0: ["constantTemperature"], 1: ["constantTemperature", 5] }),
    );
    assert(
      threw(missingValue, "INVALID_INPUT", '"constantTemperature" on boundary 0 needs 1 number'),
      "array form: a missing condition value throws INVALID_INPUT",
    );

    const twoProblems = attempt(() =>
      solveHeatConduction({ 0: ["convection", 1], 1: ["constantTemprature", 5] }),
    );
    assert(
      threw(twoProblems, "INVALID_INPUT", "2 problems found") && twoProblems.failure.details.length === 2,
      "every input problem is reported at once, in one error",
    );

    const removed = attempt(() => solveHeatConduction({ 0: ["symmetry"], 1: ["constantTemp", 5] }));
    assert(
      threw(
        removed,
        "INVALID_INPUT",
        'Unknown boundary condition type "constantTemp"',
        'renamed "constantTemperature"',
      ),
      'array form: the removed "constantTemp" throws INVALID_INPUT, naming "constantTemperature"',
    );
  }

  // Boundaries that are not in the mesh
  {
    const missingBoundary = attempt(() =>
      solveHeatConduction({
        left: { type: "constantTemperature", temperature: 1 },
        top: { type: "constantTemperature", temperature: 5 },
      }),
    );
    assert(
      threw(
        missingBoundary,
        "INVALID_INPUT",
        'Boundary "top" does not exist in the mesh',
        'Boundaries of the mesh: "left", "right"',
      ),
      "a condition on a boundary that is not in the mesh throws INVALID_INPUT",
    );
  }

  // Euler-Bernoulli beam conditions
  {
    const single = solveBeam({ 1: { type: "fixed" }, 3: { type: "force", force: -1 } });
    const list = solveBeam({ 1: [{ type: "fixed" }], 3: [{ type: "force", force: -1 }] });
    const arrays = solveBeam({ 1: [["fixed"]], 3: [["force", -1]] });
    assert(
      single.failure === null && !single.warnings.some((m) => m.includes("deprecated")),
      "beam condition objects solve, without warnings",
    );
    assert(
      list.failure === null &&
        Array.from(list.result.solutionVector).every((value, i) => value === single.result.solutionVector[i]),
      "a list of beam condition objects gives the same solution as single objects",
    );
    assert(
      arrays.failure === null &&
        arrays.warnings.some((m) =>
          m.includes('use { type: "force", force: -1 } instead of [["force",-1]]'),
        ) &&
        Array.from(arrays.result.solutionVector).every(
          (value, i) => value === single.result.solutionVector[i],
        ),
      'beam array form [["fixed"]] gives a warning and the same solution',
    );
    const springAndForce = solveBeam({
      1: { type: "fixed" },
      3: [
        { type: "spring", stiffness: 200 },
        { type: "force", force: -1 },
      ],
    });
    assert(
      springAndForce.failure === null,
      "a beam node with a list of conditions (spring and force) solves",
    );
    assert(
      threw(
        solveBeam({ 1: { type: "fixed" }, 3: { type: "spring", referenceDeflection: 0.1 } }),
        "INVALID_INPUT",
        "needs the parameter stiffness",
      ),
      "a beam spring without its stiffness throws INVALID_INPUT",
    );
    assert(
      threw(
        solveBeam({ 1: ["fixed"], 3: [["force", -1]] }),
        "INVALID_INPUT",
        "must be a condition object or a list of them",
      ),
      'beam array form ["fixed"] (not an array of conditions) throws INVALID_INPUT',
    );
    assert(
      threw(
        solveBeam({ 1: { type: "fixed" }, 9: { type: "force", force: -1 } }),
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
      "beam array form: a force without a value throws INVALID_INPUT",
    );
    assert(
      threw(
        solveBeam({ 1: { type: "clamped" }, 3: { type: "force", force: -1 } }),
        "INVALID_INPUT",
        'Unknown boundary condition type "clamped"',
      ),
      "an unknown beam condition type throws INVALID_INPUT",
    );
  }

  // Model names
  {
    const run = (modelName) =>
      attempt(() => {
        const model = new FEAScriptModel();
        model.setModelConfig(modelName);
        applyMesh(model, mesh1D);
        model.addBoundaryCondition("left", { type: "constantTemperature", temperature: 1 });
        model.addBoundaryCondition("right", { type: "constantTemperature", temperature: 5 });
        return model.solve();
      });
    const newName = run("heatConduction");
    const oldName = run("heatConductionScript");
    assert(
      newName.failure === null && !newName.warnings.some((m) => m.includes("deprecated")),
      'model "heatConduction" solves, without warnings',
    );
    assert(
      oldName.failure === null &&
        oldName.warnings.some(
          (m) => m.includes('"heatConductionScript" is deprecated') && m.includes('Use "heatConduction"'),
        ) &&
        Array.from(oldName.result.solutionVector).every(
          (value, i) => value === newName.result.solutionVector[i],
        ),
      'the model name of 0.3, "heatConductionScript", gives a warning and the same solution',
    );
  }

  // Solver options
  {
    const run = (setUp) =>
      attempt(() => {
        const model = new FEAScriptModel();
        setUp(model);
        applyMesh(model, mesh1D);
        model.addBoundaryCondition("left", { type: "constantTemperature", temperature: 1 });
        model.addBoundaryCondition("right", { type: "constantTemperature", temperature: 5 });
        return model.solve();
      });
    const lusolve = run((model) => model.setModelConfig("heatConduction"));
    const jacobi = run((model) =>
      model.setModelConfig("heatConduction", { solver: { method: "jacobi", tolerance: 1e-12 } }),
    );
    assert(
      jacobi.failure === null &&
        !jacobi.warnings.some((m) => m.includes("deprecated")) &&
        Array.from(jacobi.result.solutionVector).every(
          (value, i) => Math.abs(value - lusolve.result.solutionVector[i]) < 1e-9,
        ),
      'solver: { method: "jacobi", tolerance } solves, without warnings, as lusolve',
    );
    const fewIterations = run((model) =>
      model.setModelConfig("heatConduction", { solver: { method: "jacobi", maxIterations: 1 } }),
    );
    assert(
      threw(fewIterations, "NOT_CONVERGED"),
      "solver maxIterations reaches the Jacobi solver (1 iteration does not converge)",
    );
    const oldMethod = run((model) => {
      model.setModelConfig("heatConduction");
      model.setSolverMethod("jacobi");
    });
    assert(
      oldMethod.failure === null &&
        oldMethod.warnings.some(
          (m) => m.includes("setSolverMethod() is deprecated") && m.includes('solver: { method: "jacobi" }'),
        ),
      "setSolverMethod() still works, with a warning that gives the solver option",
    );
    const problems = attempt(() =>
      new FEAScriptModel().setModelConfig("heatConduction", {
        solver: { method: "gauss", tolerance: -1, preconditoner: "ic0" },
      }),
    );
    assert(
      threw(
        problems,
        "INVALID_INPUT",
        "3 problems found",
        'Unknown solver method "gauss"',
        "tolerance must be a positive number",
        "Unknown solver option preconditoner",
      ),
      "an unknown solver method, a negative tolerance and an unknown solver option throw INVALID_INPUT at once",
    );
  }

  // Model and coefficient functions
  {
    const noModel = attempt(() => {
      const model = new FEAScriptModel();
      applyMesh(model, mesh1D);
      return model.solve();
    });
    assert(
      threw(noModel, "INVALID_INPUT", "No model is set"),
      "a solve without a model throws INVALID_INPUT",
    );

    const unknownModel = attempt(() => {
      const model = new FEAScriptModel();
      model.setModelConfig("heatConductionScrpt");
      applyMesh(model, mesh1D);
      return model.solve();
    });
    assert(
      threw(unknownModel, "INVALID_INPUT", 'Unknown model "heatConductionScrpt"'),
      "a misspelled model throws INVALID_INPUT",
    );

    const missingFunction = attempt(() =>
      solveGeneralForm({ type: "zeroGradient" }, { A: (x) => 1, B: (x) => 0, C: (x) => 0 }),
    );
    assert(
      threw(missingFunction, "INVALID_INPUT", "needs the coefficient function D"),
      "a missing coefficient function throws INVALID_INPUT",
    );

    const misspelledCoefficient = attempt(() =>
      solveHeatConduction(
        {
          0: { type: "constantTemperature", temperature: 1 },
          1: { type: "constantTemperature", temperature: 5 },
        },
        { coefficientFunctions: { thermalConductivty: 2 } },
      ),
    );
    assert(
      threw(
        misspelledCoefficient,
        "INVALID_INPUT",
        "Coefficient thermalConductivty is not used by heatConduction",
        "Coefficients of this model: thermalConductivity, heatSource",
      ),
      "a coefficient that the model does not use (misspelled) throws INVALID_INPUT",
    );

    const nonlinearNameWhenLinear = attempt(() =>
      solveGeneralForm(
        { type: "zeroGradient" },
        {
          A: (x) => 1,
          B: (x) => 0,
          C: (x) => 0,
          D: (x) => 1,
          dDdu: (x, u) => 0,
        },
      ),
    );
    assert(
      nonlinearNameWhenLinear.failure === null,
      "dDdu is accepted for a linear general form PDE, where it is not needed",
    );

    const nanSource = attempt(() =>
      solveHeatConduction(
        {
          0: { type: "constantTemperature", temperature: 1 },
          1: { type: "constantTemperature", temperature: 5 },
        },
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
        model.setModelConfig("heatConduction", {
          solver: { method: solverMethod },
          coefficientFunctions: { heatSource: (x) => (x > 0.5 ? NaN : 0) },
        });
        applyMesh(model, mesh1D);
        model.addBoundaryCondition("left", { type: "constantTemperature", temperature: 1 });
        model.addBoundaryCondition("right", { type: "constantTemperature", temperature: 5 });
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
    const bcs = {
      left: { type: "constantTemperature", temperature: 1 },
      right: { type: "constantTemperature", temperature: 5 },
    };
    const zeroElements = attempt(() =>
      solveHeatConduction(bcs, {
        meshConfig: { ...mesh1D, meshConfig: { elementOrder: "linear", divisions: 0 } },
      }),
    );
    assert(
      threw(zeroElements, "INVALID_INPUT", "divisions must be a positive integer; got 0"),
      "zero elements throws INVALID_INPUT",
    );

    const noLength = attempt(() =>
      solveHeatConduction(bcs, { meshConfig: { ...mesh1D, geometry: { line: -1 } } }),
    );
    assert(
      threw(noLength, "INVALID_INPUT", "line must be a positive number"),
      "a negative mesh length throws INVALID_INPUT",
    );

    const noSize = attempt(() =>
      solveHeatConduction(bcs, { meshConfig: { ...mesh1D, meshConfig: { elementOrder: "linear" } } }),
    );
    assert(
      threw(noSize, "INVALID_INPUT", "needs a size", "or divisions"),
      "a mesh configuration without size or divisions throws INVALID_INPUT",
    );

    // The mesh settings of FEAScript 0.3 keep working, with a warning
    const oldForm = attempt(() => {
      const model = new FEAScriptModel();
      model.setModelConfig("heatConduction");
      model.setMeshConfig({ meshDimension: "1D", elementOrder: "linear", numElementsX: 4, maxX: 1 });
      model.addBoundaryCondition("0", { type: "constantTemperature", temperature: 1 });
      model.addBoundaryCondition("1", { type: "constantTemperature", temperature: 5 });
      return model.solve();
    });
    const newForm = solveHeatConduction(bcs);
    assert(
      !oldForm.failure &&
        oldForm.warnings.some((warning) => warning.includes("deprecated")) &&
        oldForm.result.solutionVector.every((value, i) => value === newForm.solutionVector[i]),
      "the mesh settings and boundary keys of 0.3 give the same solution as the geometry and the names",
    );

    const dimension3D = attempt(() => {
      const model = new FEAScriptModel();
      model.setModelConfig("heatConduction");
      model.setMeshConfig({ meshDimension: "3D", elementOrder: "linear", numElementsX: 4, maxX: 1 });
      return model.solve();
    });
    assert(
      threw(dimension3D, "INVALID_INPUT", 'Mesh dimension must be either "1D" or "2D"; got "3D"'),
      "a 3D mesh dimension throws INVALID_INPUT",
    );

    const linearFlow = attempt(() => {
      const model = new FEAScriptModel();
      model.setModelConfig("creepingFlow");
      model.setGeometry({ rectangle: [1, 1] });
      model.setMeshConfig({ elements: "quadrilaterals", elementOrder: "linear", divisions: [2, 2] });
      ["bottom", "left", "top", "right"].forEach((key) =>
        model.addBoundaryCondition(key, { type: "constantVelocity", u: 0, v: 0 }),
      );
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
    geometry: { rectangle: [4, 2] },
    meshConfig: { elements: "quadrilaterals", elementOrder: "linear", divisions: [4, 2] },
  };
  const mesh1D = { geometry: { line: 1 }, meshConfig: { elementOrder: "linear", divisions: 4 } };

  // The Jacobi method is used with linear elements only (it requires diagonally dominant matrices)
  const cases = [
    {
      label: "heat conduction 1D",
      modelConfig: ["heatConduction"],
      meshConfig: mesh1D,
      boundaryConditions: {
        left: { type: "constantTemperature", temperature: 0 },
        right: { type: "constantTemperature", temperature: 1 },
      },
      solverMethods: ["lusolve", "jacobi", "frontal"],
      degreesOfFreedom: 5,
    },
    {
      label: "heat conduction 2D",
      modelConfig: ["heatConduction"],
      meshConfig: mesh2D,
      boundaryConditions: {
        bottom: { type: "constantTemperature", temperature: 200 },
        left: { type: "symmetry" },
        top: { type: "convection", h: 1, ambientTemperature: 20 },
        right: { type: "constantTemperature", temperature: 200 },
      },
      solverMethods: ["lusolve", "jacobi", "frontal"],
      degreesOfFreedom: 15,
      plot: true,
    },
    {
      label: "front propagation 2D",
      modelConfig: ["frontPropagation"],
      meshConfig: mesh2D,
      boundaryConditions: {
        bottom: { type: "constantValue", value: 0 },
        left: { type: "constantValue", value: 0 },
        top: { type: "zeroGradient" },
        right: { type: "constantValue", value: 0 },
      },
      solverMethods: ["lusolve", "frontal"],
      degreesOfFreedom: 15,
      plot: true,
    },
    {
      label: "general form PDE 1D",
      modelConfig: [
        "generalFormPDE",
        { coefficientFunctions: { A: () => 1, B: () => 0, C: () => 0, D: () => 1 } },
      ],
      meshConfig: mesh1D,
      boundaryConditions: {
        left: { type: "constantValue", value: 0 },
        right: { type: "constantValue", value: 0 },
      },
      solverMethods: ["lusolve", "jacobi"],
      degreesOfFreedom: 5,
    },
    {
      label: "nonlinear general form PDE 1D",
      modelConfig: [
        "generalFormPDE",
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
      boundaryConditions: { left: { type: "constantValue", value: 1 }, right: { type: "zeroGradient" } },
      solverMethods: ["lusolve", "frontal"],
      degreesOfFreedom: 5,
    },
    {
      label: "creeping flow 2D",
      modelConfig: ["creepingFlow"],
      meshConfig: {
        geometry: { rectangle: [1, 1] },
        meshConfig: { elements: "quadrilaterals", elementOrder: "quadratic", divisions: [2, 2] },
      },
      boundaryConditions: {
        bottom: { type: "constantVelocity", u: 0, v: 0 },
        left: { type: "constantVelocity", u: 0, v: 0 },
        top: { type: "constantVelocity", u: 1, v: 0 },
        right: { type: "constantVelocity", u: 0, v: 0 },
      },
      solverMethods: ["lusolve"],
      // 25 velocity nodes (u and v) and 9 pressure nodes
      degreesOfFreedom: 59,
    },
    {
      label: "Euler-Bernoulli beam 1D",
      modelConfig: ["eulerBernoulliBeam", { coefficientFunctions: { EI: () => 1, q: () => -1 } }],
      meshConfig: { ...mesh1D, meshConfig: { elementOrder: "linear", divisions: 2 } },
      boundaryConditions: { 1: [{ type: "fixed" }], 3: [{ type: "force", force: -1 }] },
      solverMethods: ["lusolve"],
      // Deflection and rotation at 3 nodes
      degreesOfFreedom: 6,
    },
  ];

  function runSimulation({ modelConfig, meshConfig, boundaryConditions }, solverMethod) {
    const model = new FEAScriptModel();
    // The solver goes into the options of the model, beside its coefficient functions
    const [modelName, modelOptions = {}] = modelConfig;
    model.setModelConfig(modelName, { ...modelOptions, solver: { method: solverMethod } });
    applyMesh(model, meshConfig);
    Object.entries(boundaryConditions).forEach(([boundaryKey, condition]) => {
      model.addBoundaryCondition(boundaryKey, condition);
    });
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

      // Run report
      const { info } = result;
      const nonlinear = testCase.modelConfig[0] === "frontPropagation" || testCase.modelConfig[1]?.nonlinear;
      assert(
        info?.method === solverMethod && info.converged === true,
        `${label}: run report names the method and convergence (got ${JSON.stringify(info)})`,
      );
      assert(
        typeof info.solveTime === "number" && info.solveTime >= 0,
        `${label}: run report has the solve time (${info.solveTime} ms)`,
      );
      assert(
        solverMethod === "jacobi" ? info.iterations > 0 : info.iterations === null,
        `${label}: run report iterations ${solverMethod === "jacobi" ? "counted" : "null"} (got ${
          info.iterations
        })`,
      );
      assert(
        solverMethod === "frontal" || nonlinear
          ? info.residual === null
          : info.residual >= 0 && info.residual < 1e-10,
        `${label}: run report residual ${
          solverMethod === "frontal" || nonlinear ? "null" : "below 1e-10"
        } (got ${info.residual})`,
      );
      assert(
        nonlinear ? info.newton?.iterations > 0 && info.newton.increment <= 1e-4 : info.newton === null,
        `${label}: run report Newton-Raphson ${
          nonlinear ? "iterations and increment" : "null"
        } (got ${JSON.stringify(info.newton)})`,
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
      modelConfig: "generalFormPDE",
      options: {
        coefficientFunctions: {
          A: (x) => 1,
          B: (x) => -10,
          C: (x) => 0,
          D: (x) => 10 * Math.exp(-200 * Math.pow(x - 0.5, 2)),
        },
      },
      meshConfig: { geometry: { line: 1.0 }, meshConfig: { elementOrder: "quadratic", divisions: 20 } },
      boundaryConditions: { left: { type: "constantValue", value: 1 }, right: { type: "zeroGradient" } },
    },
    {
      label: "General form PDE (nonlinear)",
      modelConfig: "generalFormPDE",
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
      meshConfig: { geometry: { line: 10.0 }, meshConfig: { elementOrder: "linear", divisions: 20 } },
      boundaryConditions: { left: { type: "constantValue", value: 1 }, right: { type: "zeroGradient" } },
    },
    {
      label: "Euler-Bernoulli beam",
      modelConfig: "eulerBernoulliBeam",
      options: {
        coefficientFunctions: {
          EI: (x) => 2.0e6,
          q: (x) => (x <= 5 ? -1000 : 0),
        },
      },
      meshConfig: { geometry: { line: 10 }, meshConfig: { elementOrder: "linear", divisions: 2 } },
      boundaryConditions: {
        1: [{ type: "fixed" }],
        2: [{ type: "pinned" }, { type: "moment", moment: 1250 }],
        3: [
          { type: "spring", stiffness: 200 },
          { type: "force", force: -2500 },
        ],
      },
    },
    {
      label: "Heat conduction (varying k and Q)",
      modelConfig: "heatConduction",
      options: {
        coefficientFunctions: {
          thermalConductivity: (x, y) => 1 + x + y,
          heatSource: 2,
        },
      },
      meshConfig: {
        geometry: { rectangle: [4, 2] },
        meshConfig: { elements: "quadrilaterals", elementOrder: "quadratic", divisions: [8, 4] },
      },
      boundaryConditions: {
        bottom: { type: "constantTemperature", temperature: 200 },
        left: { type: "symmetry" },
        top: { type: "convection", h: 1, ambientTemperature: 20 },
        right: { type: "constantTemperature", temperature: 200 },
      },
    },
    {
      label: "Creeping flow (varying viscosity)",
      modelConfig: "creepingFlow",
      options: {
        coefficientFunctions: {
          viscosity: (x, y) => 1 + x * y,
        },
      },
      meshConfig: {
        geometry: { rectangle: [4, 2] },
        meshConfig: { elements: "quadrilaterals", elementOrder: "quadratic", divisions: [4, 2] },
      },
      boundaryConditions: {
        bottom: { type: "constantVelocity", u: 0, v: 0 },
        left: { type: "constantVelocity", u: 0, v: 0 },
        top: { type: "constantVelocity", u: 1, v: 0 },
        right: { type: "constantVelocity", u: 0, v: 0 },
      },
    },
  ];

  for (const testCase of testCases) {
    const solveWith = (options) => {
      const model = new FEAScriptModel();
      model.setModelConfig(testCase.modelConfig, options);
      applyMesh(model, testCase.meshConfig);
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
    heatModel.setModelConfig("heatConduction");
    heatModel.setGeometry({ line: 1 });
    heatModel.setMeshConfig({ elementOrder: "linear", divisions: 4 });
    heatModel.addBoundaryCondition("left", { type: "constantTemperature", temperature: 1 });
    heatModel.addBoundaryCondition("right", { type: "constantTemperature", temperature: 5 });
    return heatModel.solve();
  });
  const beamModel = new FEAScriptModel();
  const beamResult = solveQuietly(() => {
    beamModel.setModelConfig("eulerBernoulliBeam", { coefficientFunctions: { EI: (x) => 1 } });
    beamModel.setGeometry({ line: 1 });
    beamModel.setMeshConfig({ elementOrder: "linear", divisions: 2 });
    beamModel.addBoundaryCondition("1", { type: "fixed" });
    beamModel.addBoundaryCondition("3", { type: "force", force: -1 });
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
    model.setModelConfig("eulerBernoulliBeam", {
      solver: { method: solverMethod },
      coefficientFunctions: { EI: () => 1e5 },
    });
    model.setGeometry({ line: 4 });
    model.setMeshConfig({ elementOrder: "linear", divisions: 4 });
    model.addBoundaryCondition("1", { type: "fixed" });
    model.addBoundaryCondition("5", { type: "force", force: -1000 });
    return model;
  };

  const flowModel = (solverMethod) => {
    const model = new FEAScriptModel();
    model.setModelConfig("creepingFlow", {
      solver: { method: solverMethod },
      coefficientFunctions: { viscosity: 1 },
    });
    model.setGeometry({ rectangle: [1, 1] });
    model.setMeshConfig({ elements: "quadrilaterals", elementOrder: "quadratic", divisions: [2, 2] });
    model.addBoundaryCondition("bottom", { type: "constantVelocity", u: 0, v: 0 });
    model.addBoundaryCondition("left", { type: "constantVelocity", u: 0, v: 0 });
    model.addBoundaryCondition("top", { type: "constantVelocity", u: 1, v: 0 });
    model.addBoundaryCondition("right", { type: "constantVelocity", u: 0, v: 0 });
    return model;
  };

  const unsupported = [
    ["Beam with frontal", beamModel("frontal")],
    ["Creeping flow with frontal", flowModel("frontal")],
    ["Creeping flow with jacobi", flowModel("jacobi")],
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
    model.setModelConfig("heatConduction", {
      solver: { method: solverMethod },
      coefficientFunctions: { thermalConductivity: () => 0 },
    });
    model.setGeometry({ line: 1 });
    model.setMeshConfig({ elementOrder: "linear", divisions: 4 });
    model.addBoundaryCondition("left", { type: "constantTemperature", temperature: 1 });
    model.addBoundaryCondition("right", { type: "convection", h: 1, ambientTemperature: 0 });
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
