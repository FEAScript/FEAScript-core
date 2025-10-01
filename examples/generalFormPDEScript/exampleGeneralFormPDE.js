//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

// Example usage of generalFormPDESolver with a simple mesh and coefficients
import { generalFormPDESolver } from '../../src/solvers/generalFormPDEScript.js';

// Generate a uniform mesh from 0 to 1 with 20 nodes
const nNodes = 20;
const mesh = Array.from({ length: nNodes }, (_, i) => i / (nNodes - 1));

// Coefficient functions for Given equation: d²u/dx² + 10 du/dx = -10 * exp(-200 * (x - 0.5)²), for 0 < x < 1
const A = x => 1; // Diffusion coefficient
const B = x => 10; // first derivative term
const C = x => 0; // No reaction term
const D = x => -10 * Math.exp(-200 * Math.pow(x - 0.5, 2)); // Source function D(x)

// Dirichlet left boundary conditions: u(0) = 1, and Neumann right boundry conditions: u(1) = 0
const boundary = {
    left: { type: 'dirichlet', value: 1 },
    right: { type: 'neumann', value: 0 }
};

//Solve
const u = generalFormPDESolver({ A, B, C, D, mesh, boundary });
console.log('Mesh nodes:', mesh);
console.log('Solution u:', u);