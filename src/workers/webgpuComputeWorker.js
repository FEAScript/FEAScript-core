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
import * as ti from "../vendor/taichi.esm.js";
import { WebGPUComputeEngine } from "../utilities/webgpuComputeEngine.js";

class WebGPUComputeWorker {
  constructor() {
    this.computeEngine = null;
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await ti.init();
      this.initialized = true;
    }
    if (!this.computeEngine) {
      this.computeEngine = new WebGPUComputeEngine();
      // Don't initialize again, already done
    }
  }

  async vecAdd(a, b) {
    await this.initialize();
    return this.computeEngine.vecAdd(a, b);
  }

  async matVecMul(A, x) {
    await this.initialize();
    return this.computeEngine.matVecMul(A, x);
  }

  async matMatMul(A, B) {
    await this.initialize();
    return this.computeEngine.matMatMul(A, B);
  }

  async transpose(A) {
    await this.initialize();
    return this.computeEngine.transpose(A);
  }

  async diagonal(A) {
    await this.initialize();
    return this.computeEngine.diagonal(A);
  }

  async sparseMatVecMul(sparseMatrix, x) {
    await this.initialize();
    return this.computeEngine.sparseMatVecMul(sparseMatrix, x);
  }

  async dotProduct(a, b) {
    await this.initialize();
    const n = a.length;
    const aField = ti.field(ti.f32, [n]);
    const bField = ti.field(ti.f32, [n]);
    const resultField = ti.field(ti.f32, [1]);

    aField.fromArray(a);
    bField.fromArray(b);
    resultField.fromArray([0]);

    ti.addToKernelScope({aField, bField, resultField});

    ti.kernel((n) => {
      for (let i of ti.ndrange(n)) {
        ti.atomicAdd(resultField[0], aField[i] * bField[i]);
      }
    })(n);

    const result = await resultField.toArray();
    return result[0];
  }

  async norm(vector) {
    await this.initialize();
    const n = vector.length;
    const aField = ti.field(ti.f32, [n]);
    const resultField = ti.field(ti.f32, [1]);

    aField.fromArray(vector);
    resultField.fromArray([0]);

    ti.addToKernelScope({aField, resultField});

    ti.kernel((n) => {
      for (let i of ti.ndrange(n)) {
        ti.atomicAdd(resultField[0], aField[i] * aField[i]);
      }
    })(n);

    ti.kernel(() => {
      resultField[0] = ti.sqrt(resultField[0]);
    })();

    const result = await resultField.toArray();
    return result[0];
  }

  async normalize(vector) {
    await this.initialize();
    const n = vector.length;
    const aField = ti.field(ti.f32, [n]);
    const resultField = ti.field(ti.f32, [n]);
    const tempField = ti.field(ti.f32, [1]);

    aField.fromArray(vector);
    tempField.fromArray([0]);

    ti.addToKernelScope({aField, resultField, tempField});

    ti.kernel((n) => {
      for (let i of ti.ndrange(n)) {
        ti.atomicAdd(tempField[0], aField[i] * aField[i]);
      }
    })(n);

    ti.kernel((n) => {
      const normVal = ti.sqrt(tempField[0]);
      for (let i of ti.ndrange(n)) {
        resultField[i] = aField[i] / normVal;
      }
    })(n);

    const result = await resultField.toArray();
    return result;
  }

  async copy(data) {
    await this.initialize();
    return this.computeEngine.copy(data);
  }

  async fill(data, value) {
    await this.initialize();
    return this.computeEngine.fill(data, value);
  }

  async scale(data, scalar) {
    await this.initialize();
    return this.computeEngine.scale(data, scalar);
  }

  async residual(A, x, b) {
    await this.initialize();
    return this.computeEngine.residual(A, x, b);
  }

  async preconditioner(A, r, type = 'jacobi', omega = 1.0) {
    await this.initialize();
    return this.computeEngine.preconditioner(A, r, type, omega);
  }

  async conjugateGradient(A, b, x0 = null, tol = 1e-6, maxIter = 1000, preconditionerType = null) {
    await this.initialize();
    return this.computeEngine.conjugateGradient(A, b, x0, tol, maxIter, preconditionerType);
  }

  async jacobiSolve(A, b, x0, maxIter = 1000, tol = 1e-6) {
    await this.initialize();
    try {
      return await this.computeEngine.jacobiSolve(A, b, x0, maxIter, tol);
    } catch (e) {
      console.error('Error in jacobiSolve:', e);
      throw new Error('Jacobi solve failed: ' + e.message);
    }
  }

  async destroy() {
    if (this.computeEngine) {
      this.computeEngine.destroy();
      this.computeEngine = null;
    }
    this.initialized = false;
  }
}

Comlink.expose(new WebGPUComputeWorker());