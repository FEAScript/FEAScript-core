//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

import * as Comlink from "../vendor/comlink.mjs";
import * as ti from '../vendor/taichi.esm.js';

class WebGPUJacobiWorker {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    await ti.init();
    this.initialized = true;
  }

  async jacobiMethod(A, b, x0, maxIterations = 100, tolerance = 1e-7) {
    await this.initialize();

    const n = A.length;
    let x = [...x0];
    let xNew = new Array(n).fill(0);

    let iterationsCompleted = 0;
    let hasConverged = false;

    // Main iteration loop
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Perform Jacobi update using Taichi
      const matrixField = ti.field(ti.f32, [n * n]);
      const bField = ti.field(ti.f32, [n]);
      const xField = ti.field(ti.f32, [n]);
      const xNewField = ti.field(ti.f32, [n]);

      // Flatten the matrix for Taichi
      const flatA = A.flat();
      matrixField.fromArray(flatA);
      bField.fromArray(b);
      xField.fromArray(x);

      ti.addToKernelScope({matrixField, bField, xField, xNewField});

      ti.kernel((n) => {
        for (let i = 0; i < n; i++) {
          let sum = 0.0;
          for (let j = 0; j < n; j++) {
            if (j !== i) {
              sum += matrixField[ti.i32(i) * ti.i32(n) + ti.i32(j)] * xField[j];
            }
          }
          let diagonal = matrixField[ti.i32(i) * ti.i32(n) + ti.i32(i)];
          xNewField[i] = (bField[i] - sum) / diagonal;
        }
      })(n);

      xNew = await xNewField.toArray();

      // Check convergence by computing max difference
      const absDiffField = ti.field(ti.f32, [n]);
      diffField.fromArray(xNew.map((val, i) => val - x[i]));

      ti.addToKernelScope({diffField, absDiffField});

      ti.kernel((n) => {
        for (let i = 0; i < n; i++) {
          absDiffField[i] = ti.abs(diffField[i]);
        }
      })(n);

      const absDiffData = await absDiffField.toArray();

      // Find maximum absolute difference
      let maxDiff = 0;
      for (let i = 0; i < n; i++) {
        if (absDiffData[i] > maxDiff) maxDiff = absDiffData[i];
      }

      if (maxDiff < tolerance) {
        hasConverged = true;
        iterationsCompleted = iteration + 1;
        break;
      }

      // Swap for next iteration
      x = [...xNew];

      if (iteration === maxIterations - 1) {
        iterationsCompleted = maxIterations;
      }
    }

    return {
      solution: xNew,
      iterations: iterationsCompleted,
      converged: hasConverged,
    };
  }
}

Comlink.expose(new WebGPUJacobiWorker());