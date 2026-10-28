/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for 2D element basis functions and quadrature
 *
 * Covers (linear and quadratic quadrilaterals and triangles):
 *  - Partition of unity and zero-sum derivatives
 *  - Kronecker delta property at the nodes (FEAScript node numbering)
 *  - Derivatives against central finite differences
 *  - Quadrature weights sum (reference element area) and exact integration of monomials
 *
 * Run: node tests/unit/elements2D.test.js (or npm test)
 */

import { BasisFunctions } from "../../src/mesh/basisFunctions.js";
import { getIntegrationPoints2D } from "../../src/mesh/meshUtils.js";
import { NumericalIntegration } from "../../src/numerics/numericalIntegration.js";
import { basicLog, errorLog } from "../../src/utilities/logging.js";

basicLog("");
basicLog("================================");
basicLog("Unit tests: 2D elements");

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

const TOLERANCE = 1e-12;
const close = (a, b, tolerance = TOLERANCE) => Math.abs(a - b) < tolerance;
const sum = (values) => values.reduce((total, value) => total + value, 0);
const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));

// Reference element node coordinates (FEAScript numbering: bottom to top, then left to right)
//
// Quadrilaterals:              Triangles:
// 1 --- 3     2--5--8          1          2
// |     |     |     |          | \        | \
// |     |     1  4  7          |   \      1   4
// |     |     |     |          |     \    |     \
// 0 --- 2     0--3--6          0 --- 2    0--3--5
const elements = [
  {
    elementShape: "quad",
    elementOrder: "linear",
    nodes: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    area: 1,
    // ∫∫ ksi^p eta^q over [0, 1] x [0, 1] = 1 / ((p + 1)(q + 1)), 1-point Gauss rule per direction
    exactIntegral: (p, q) => 1 / ((p + 1) * (q + 1)),
    isExact: (p, q) => p <= 1 && q <= 1,
    exactnessLabel: "degree 1 in each direction",
  },
  {
    elementShape: "quad",
    elementOrder: "quadratic",
    nodes: [
      [0, 0],
      [0, 0.5],
      [0, 1],
      [0.5, 0],
      [0.5, 0.5],
      [0.5, 1],
      [1, 0],
      [1, 0.5],
      [1, 1],
    ],
    area: 1,
    // 3-point Gauss rule per direction
    exactIntegral: (p, q) => 1 / ((p + 1) * (q + 1)),
    isExact: (p, q) => p <= 5 && q <= 5,
    exactnessLabel: "degree 5 in each direction",
  },
  {
    elementShape: "triangle",
    elementOrder: "linear",
    nodes: [
      [0, 0],
      [0, 1],
      [1, 0],
    ],
    area: 0.5,
    // ∫∫ ksi^p eta^q over the reference triangle = p! q! / (p + q + 2)!, 3-point rule
    exactIntegral: (p, q) => (factorial(p) * factorial(q)) / factorial(p + q + 2),
    isExact: (p, q) => p + q <= 2,
    exactnessLabel: "total degree 2",
  },
  {
    elementShape: "triangle",
    elementOrder: "quadratic",
    nodes: [
      [0, 0],
      [0, 0.5],
      [0, 1],
      [0.5, 0],
      [0.5, 0.5],
      [1, 0],
    ],
    area: 0.5,
    // 6-point rule
    exactIntegral: (p, q) => (factorial(p) * factorial(q)) / factorial(p + q + 2),
    isExact: (p, q) => p + q <= 4,
    exactnessLabel: "total degree 4",
  },
];

for (const element of elements) {
  const { elementShape, elementOrder, nodes } = element;
  const label = `${elementOrder} ${elementShape === "quad" ? "quadrilateral" : "triangle"}`;
  const basis = new BasisFunctions({ meshDimension: "2D", elementOrder, elementShape });
  const numNodes = nodes.length;

  // Partition of unity and zero-sum derivatives at an interior point
  const interior = basis.getBasisFunctions(0.2, 0.3);
  assert(interior.basisFunction.length === numNodes, `${label}: returns ${numNodes} basis functions`);
  assert(close(sum(interior.basisFunction), 1), `${label}: basis functions sum to 1`);
  assert(close(sum(interior.basisFunctionDerivKsi), 0), `${label}: ksi derivatives sum to 0`);
  assert(close(sum(interior.basisFunctionDerivEta), 0), `${label}: eta derivatives sum to 0`);

  // Kronecker delta at the nodes
  let deltaOk = true;
  nodes.forEach(([ksi, eta], nodeIndex) => {
    const { basisFunction } = basis.getBasisFunctions(ksi, eta);
    basisFunction.forEach((value, i) => {
      if (!close(value, i === nodeIndex ? 1 : 0)) deltaOk = false;
    });
  });
  assert(deltaOk, `${label}: Kronecker delta property at the nodes`);

  // Derivatives against central finite differences
  const h = 1e-6;
  const ksi0 = 0.25;
  const eta0 = 0.35;
  const analytic = basis.getBasisFunctions(ksi0, eta0);
  const ksiPlus = basis.getBasisFunctions(ksi0 + h, eta0).basisFunction;
  const ksiMinus = basis.getBasisFunctions(ksi0 - h, eta0).basisFunction;
  const etaPlus = basis.getBasisFunctions(ksi0, eta0 + h).basisFunction;
  const etaMinus = basis.getBasisFunctions(ksi0, eta0 - h).basisFunction;
  let derivativesOk = true;
  for (let i = 0; i < numNodes; i++) {
    const finiteDifferenceKsi = (ksiPlus[i] - ksiMinus[i]) / (2 * h);
    const finiteDifferenceEta = (etaPlus[i] - etaMinus[i]) / (2 * h);
    if (!close(analytic.basisFunctionDerivKsi[i], finiteDifferenceKsi, 1e-6)) derivativesOk = false;
    if (!close(analytic.basisFunctionDerivEta[i], finiteDifferenceEta, 1e-6)) derivativesOk = false;
  }
  assert(derivativesOk, `${label}: derivatives match finite differences`);

  // Quadrature, through the same 2D integration points used by the assemblers
  const { gaussPoints, gaussWeights } = new NumericalIntegration({
    meshDimension: "2D",
    elementOrder,
    elementShape,
  }).getGaussPointsAndWeights();
  const integrationPoints = getIntegrationPoints2D(gaussPoints, gaussWeights, elementShape);
  assert(
    close(sum(integrationPoints.map(([, , weight]) => weight)), element.area),
    `${label}: quadrature weights sum to the reference element area (${element.area})`,
  );

  let exactOk = true;
  for (let p = 0; p <= 6; p++) {
    for (let q = 0; q <= 6; q++) {
      if (!element.isExact(p, q)) continue;
      const numeric = integrationPoints.reduce(
        (total, [ksi, eta, weight]) => total + weight * ksi ** p * eta ** q,
        0,
      );
      if (!close(numeric, element.exactIntegral(p, q))) exactOk = false;
    }
  }
  assert(exactOk, `${label}: quadrature exact for monomials up to ${element.exactnessLabel}`);
}

basicLog(`2D element tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
