/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for the boundary condition input checks
 *
 * Covers:
 *  - An unknown (e.g. misspelled) condition type is reported as an error when solving
 *  - The supported condition types of every model, and the deprecated "constantTemp", are not reported
 *  - A condition given as a plain string is wrapped in an array, with a warning, and gives the same solution
 *  - Euler-Bernoulli beam conditions that are not an array of conditions are reported as an error
 *
 * Run: node tests/unit/boundaryConditions.test.js (or npm test)
 */

import { FEAScriptModel } from "../../src/FEAScript.js";
import { basicLog, errorLog } from "../../src/utilities/logging.js";

basicLog("");
basicLog("================================");
basicLog("Unit tests: boundary condition input checks");

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

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
