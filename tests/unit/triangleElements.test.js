/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for triangular element basis functions and quadrature
 *
 * Covers (linear and quadratic triangles):
 *  - Partition of unity and zero-sum derivatives
 *  - Kronecker delta property at the nodes
 *  - Derivatives against central finite differences
 *  - Quadrature weights sum and exact integration of monomials
 *
 * Run: node tests/unit/triangleElements.test.js (or npm test)
 */

import { BasisFunctions } from "../../src/mesh/basisFunctions.js";
import { NumericalIntegration } from "../../src/methods/numericalIntegration.js";
import { basicLog, errorLog } from "../../src/utilities/logging.js";

basicLog("");
basicLog("================================");
basicLog("Unit tests: triangular elements");

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

const TOL = 1e-12;
const close = (a, b, tol = TOL) => Math.abs(a - b) < tol;

// Reference-triangle node coordinates (Gmsh ordering)
const nodes = {
  linear: [
    [0, 0],
    [1, 0],
    [0, 1],
  ],
  quadratic: [
    [0, 0],
    [1, 0],
    [0, 1],
    [0.5, 0],
    [0.5, 0.5],
    [0, 0.5],
  ],
};

// ∫∫ ksi^p eta^q over the reference triangle = p! q! / (p + q + 2)!
const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
const exactMonomialIntegral = (p, q) => (factorial(p) * factorial(q)) / factorial(p + q + 2);

for (const order of ["linear", "quadratic"]) {
  const basis = new BasisFunctions({ meshDimension: "2D", elementOrder: order, elementShape: "triangle" });
  const integration = new NumericalIntegration({
    meshDimension: "2D",
    elementOrder: order,
    elementShape: "triangle",
  });
  const numNodes = nodes[order].length;

  // Partition of unity and zero-sum derivatives at an interior point
  const interior = basis.getBasisFunctions(0.2, 0.3);
  const sum = (arr) => arr.reduce((s, v) => s + v, 0);
  assert(interior.basisFunction.length === numNodes, `${order}: returns ${numNodes} basis functions`);
  assert(close(sum(interior.basisFunction), 1), `${order}: basis functions sum to 1`);
  assert(close(sum(interior.basisFunctionDerivKsi), 0), `${order}: ksi derivatives sum to 0`);
  assert(close(sum(interior.basisFunctionDerivEta), 0), `${order}: eta derivatives sum to 0`);

  // Kronecker delta at the nodes
  let deltaOk = true;
  nodes[order].forEach(([ksi, eta], nodeIndex) => {
    const { basisFunction } = basis.getBasisFunctions(ksi, eta);
    basisFunction.forEach((value, i) => {
      if (!close(value, i === nodeIndex ? 1 : 0)) deltaOk = false;
    });
  });
  assert(deltaOk, `${order}: Kronecker delta property at the nodes`);

  // Derivatives against central finite differences
  const h = 1e-6;
  const ksi0 = 0.25;
  const eta0 = 0.35;
  const analytic = basis.getBasisFunctions(ksi0, eta0);
  const dKsiPlus = basis.getBasisFunctions(ksi0 + h, eta0).basisFunction;
  const dKsiMinus = basis.getBasisFunctions(ksi0 - h, eta0).basisFunction;
  const dEtaPlus = basis.getBasisFunctions(ksi0, eta0 + h).basisFunction;
  const dEtaMinus = basis.getBasisFunctions(ksi0, eta0 - h).basisFunction;
  let derivOk = true;
  for (let i = 0; i < numNodes; i++) {
    const fdKsi = (dKsiPlus[i] - dKsiMinus[i]) / (2 * h);
    const fdEta = (dEtaPlus[i] - dEtaMinus[i]) / (2 * h);
    if (!close(analytic.basisFunctionDerivKsi[i], fdKsi, 1e-6)) derivOk = false;
    if (!close(analytic.basisFunctionDerivEta[i], fdEta, 1e-6)) derivOk = false;
  }
  assert(derivOk, `${order}: derivatives match finite differences`);

  // Quadrature
  const { gaussPoints, gaussWeights } = integration.getGaussPointsAndWeights();
  assert(gaussPoints.length === gaussWeights.length, `${order}: one weight per quadrature point`);
  assert(close(sum(gaussWeights), 0.5), `${order}: quadrature weights sum to 1/2`);

  const maxDegree = order === "linear" ? 2 : 4;
  let exactOk = true;
  for (let p = 0; p <= maxDegree; p++) {
    for (let q = 0; p + q <= maxDegree; q++) {
      const numeric = gaussPoints.reduce((s, [ksi, eta], i) => s + gaussWeights[i] * ksi ** p * eta ** q, 0);
      if (!close(numeric, exactMonomialIntegral(p, q))) exactOk = false;
    }
  }
  assert(exactOk, `${order}: quadrature exact for monomials up to degree ${maxDegree}`);
}

basicLog(`Triangular element tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
