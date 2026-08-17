/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Clamped and spring-supported Euler-Bernoulli beam
 *
 * Reproduces the "Bending of a Beam" example from J.N. Reddy, "An Introduction to
 * the Finite Element Method", 3rd ed., McGraw-Hill, 2006 (FEM1D example problems,
 * Chapter 7), solved there with the reference FEM1D Fortran program (MODEL=3,
 * NTYPE=0, IELEM=0 i.e. Hermite cubic elements).
 *
 * Geometry: a 10 m beam, clamped at x=0, resting on a roller at midspan (x=5 m),
 * and connected to a linear transverse spring at the free end (x=10 m).
 * Mesh: 2 Hermite cubic beam elements of 5 m each -> 3 nodes: [1, 2, 3]
 *
 *        1,000 N/m (on 0 <= x <= 5)      2,500 N (down, at node 3)
 *        v v v v v v v v v v            |
 *   /////|--------------------|-------------------|       ~~~~ spring, k = 1e-4*EI
 *   ///// 1  (clamped)         2 (roller)          3 (free end, spring)
 *         |<-------- 5 m ----->|<------- 5 m ------>|
 *                    ^ moment 1,250 N-m applied at node 2
 *
 * EI = 2e6 N-m^2 (constant), k_spring = 1e-4 * EI = 200 N/m
 *
 * Boundary conditions (see beamBoundaryConditions.js for the condition syntax):
 *  - Node 1 (x=0):  fixed            -> w=0, theta=0     (clamped support)
 *  - Node 2 (x=5):  pinned + moment  -> w=0, applied moment M=1250 N-m
 *  - Node 3 (x=10): spring + force   -> k=200 N/m, applied point load P=-2500 N
 */

// Import Math.js
import * as math from "mathjs";
global.math = math;

// Import FEAScript library
import { FEAScriptModel, printVersion } from "feascript";

console.log("FEAScript Version:", printVersion);

// Create a new FEAScript model
const model = new FEAScriptModel();

// Select physics/PDE
model.setModelConfig("eulerBernoulliBeamScript", {
  coefficientFunctions: {
    EI: (x) => 2.0e6, // Bending stiffness E*I (N-m^2), constant along the beam
    // Distributed transverse load: -1,000 N/m over the first (clamped) span only
    q: (x) => (x <= 5 ? -1000 : 0),
    // c0 defaults to 0 (no elastic foundation) when omitted
  },
});

// Define mesh configuration
// elementOrder is 'linear' because that only describes the 2-node beam geometry;
// the field itself is always interpolated with cubic Hermite shape functions internally
model.setMeshConfig({
  meshDimension: "1D",
  elementOrder: "linear",
  numElementsX: 2,
  maxX: 10,
});

// Define boundary conditions (keyed by 1-based global node number)
model.addBoundaryCondition("1", [["fixed"]]); // Clamped support
model.addBoundaryCondition("2", [["pinned"], ["moment", 1250]]); // Roller + applied moment
model.addBoundaryCondition("3", [["spring", 200], ["force", -2500]]); // Spring support + point load

// Set solver method
model.setSolverMethod("lusolve");

// Solve the problem
const { solutionVector } = model.solve();

// The solution vector is ordered [w_0, theta_0, w_1, theta_1, w_2, theta_2, ...]
// (mathjs' lusolve returns a nested array, so flatten defensively before reading it)
const flatSolution = solutionVector.map((entry) => (Array.isArray(entry) ? entry[0] : entry));

const nodeXCoordinates = [0, 5, 10];
console.log("\nNode |    x (m) | Deflection w (m) | Rotation theta (rad)");
console.log("-----|----------|-------------------|----------------------");
for (let nodeIndex = 0; nodeIndex < nodeXCoordinates.length; nodeIndex++) {
  const w = flatSolution[2 * nodeIndex];
  const theta = flatSolution[2 * nodeIndex + 1];
  console.log(
    `  ${nodeIndex + 1}  | ${nodeXCoordinates[nodeIndex].toFixed(2).padStart(8)} | ${w
      .toExponential(4)
      .padStart(17)} | ${theta.toExponential(4).padStart(20)}`,
  );
}
