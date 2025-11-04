//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

// External imports
import * as ti from "../vendor/taichi.esm.js";

// Internal imports
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Class providing GPU-accelerated linear algebra utilities using Taichi.js/WebGPU.
 * Methods are asynchronous to align with GPU buffer operations but computations are kept
 * functionally identical to their CPU counterparts elsewhere in the project.
 */
export class WebGPUComputeEngine {
  /**
   * Constructor to create the compute engine instance.
   * The engine is lazily initialized via initialize().
   */
  constructor() {
    this.initialized = false;
  }

  /**
   * Function to initialize the WebGPU compute engine
   */
  async initialize() {
    if (this.initialized) return;
    await ti.init();
    this.initialized = true;
  }

  /**
   * Function to read data from a buffer
   * @param {object} data - The buffer to read from
   * @param {number} size - The size of the data to read
   * @param {object} [type=Float32Array] - The type of the data array
   * @returns {object} The data read from the buffer
   */
  async readBuffer(data, size, type = Float32Array) {
    return data;
  }

  /**
   * Function to perform matrix-vector multiplication: y = A * x
   * @param {array} A - The matrix
   * @param {array} x - The vector
   * @param {object} [resultBuffer=null] - Optional buffer to store the result
   * @returns {array} The resulting vector
   */
  async matVecMul(A, x, resultBuffer = null) {
    const n = A.length;
    const m = A[0].length;

    const matrixField = ti.field(ti.f32, [n * m]);
    const vectorField = ti.field(ti.f32, [m]);
    const resultField = ti.field(ti.f32, [n]);

    const flatMatrix = A.flat();
    matrixField.fromArray(flatMatrix);
    vectorField.fromArray(x);

    ti.addToKernelScope({ matrixField, vectorField, resultField });

    ti.kernel((n, m) => {
      for (let i of ti.ndrange(n)) {
        let sum = 0.0;
        for (let j of ti.ndrange(m)) {
          sum += matrixField[ti.i32(i) * ti.i32(m) + ti.i32(j)] * vectorField[j];
        }
        resultField[i] = sum;
      }
    })(n, m);

    const result = await resultField.toArray();
    return result;
  }

  /**
   * Function to perform vector subtraction: result = a - b
   * @param {array} a - The first vector
   * @param {array} b - The second vector
   * @param {object} [resultBuffer=null] - Optional buffer to store the result
   * @returns {array} The resulting vector
   */
  async vecSub(a, b, resultBuffer = null) {
    const n = a.length;
    const aField = ti.field(ti.f32, [n]);
    const bField = ti.field(ti.f32, [n]);
    const resultField = ti.field(ti.f32, [n]);

    aField.fromArray(a);
    bField.fromArray(b);

    ti.addToKernelScope({ aField, bField, resultField });

    ti.kernel((n) => {
      for (let i of ti.ndrange(n)) {
        resultField[i] = aField[i] - bField[i];
      }
    })(n);

    const result = await resultField.toArray();
    return result;
  }

  /**
   * Function to perform vector division: result = a / b
   * @param {array} a - The first vector
   * @param {array} b - The second vector
   * @param {object} [resultBuffer=null] - Optional buffer to store the result
   * @returns {array} The resulting vector
   */
  async vecDiv(a, b, resultBuffer = null) {
    const n = a.length;
    const aField = ti.field(ti.f32, [n]);
    const bField = ti.field(ti.f32, [n]);
    const resultField = ti.field(ti.f32, [n]);

    aField.fromArray(a);
    bField.fromArray(b);

    ti.addToKernelScope({ aField, bField, resultField });

    ti.kernel((n) => {
      for (let i of ti.ndrange(n)) {
        resultField[i] = aField[i] / bField[i];
      }
    })(n);

    const result = await resultField.toArray();
    return result;
  }

  /**
   * Function to find the maximum value in a vector
   * @param {array} vector - The input vector
   * @returns {number} The maximum value in the vector
   */
  async vecMax(vector) {
    const n = vector.length;
    const vectorField = ti.field(ti.f32, [n]);
    const maxField = ti.field(ti.f32, [1]);

    vectorField.fromArray(vector);
    maxField.fromArray([-1e10]);

    ti.addToKernelScope({ vectorField, maxField });

    ti.kernel((n) => {
      for (let i of ti.ndrange(n)) {
        // For max, we can use a simple approach since atomic_max might not exist
        // Use a reduction pattern
      }
    })(n);

    // For simplicity, since atomic_max may not be available, let's use CPU for now
    const result = await vectorField.toArray();
    return Math.max(...result);
  }

  /**
   * Function to perform an element-wise operation on a vector: result[i] = op(a[i])
   * @param {array} a - The input vector
   * @param {string} op - The operation to perform ('abs', 'sqrt', 'exp', 'log', 'sin', 'cos', 'tan')
   * @param {object} [resultBuffer=null] - Optional buffer to store the result
   * @returns {array} The resulting vector
   */
  async elementWiseOp(a, op, resultBuffer = null) {
    const n = a.length;
    const aField = ti.field(ti.f32, [n]);
    const resultField = ti.field(ti.f32, [n]);

    aField.fromArray(a);

    ti.addToKernelScope({ aField, resultField });

    ti.kernel((n, op) => {
      for (let i of ti.ndrange(n)) {
        if (op === "abs") {
          resultField[i] = ti.abs(aField[i]);
        } else if (op === "sqrt") {
          resultField[i] = ti.sqrt(aField[i]);
        } else if (op === "exp") {
          resultField[i] = ti.exp(aField[i]);
        } else if (op === "log") {
          resultField[i] = ti.log(aField[i]);
        } else if (op === "sin") {
          resultField[i] = ti.sin(aField[i]);
        } else if (op === "cos") {
          resultField[i] = ti.cos(aField[i]);
        } else if (op === "tan") {
          resultField[i] = ti.tan(aField[i]);
        } else {
          resultField[i] = aField[i];
        }
      }
    })(n, op);

    const result = await resultField.toArray();
    return result;
  }

  /**
   * Function to perform a scalar operation on a vector: result[i] = op(a[i], scalar)
   * @param {array} a - The input vector
   * @param {number} scalar - The scalar value
   * @param {string} op - The operation to perform ('add', 'mul', 'div', 'pow')
   * @param {object} [resultBuffer=null] - Optional buffer to store the result
   * @returns {array} The resulting vector
   */
  async scalarOp(a, scalar, op, resultBuffer = null) {
    const n = a.length;
    const aField = ti.field(ti.f32, [n]);
    const resultField = ti.field(ti.f32, [n]);

    aField.fromArray(a);

    ti.addToKernelScope({ aField, resultField });

    ti.kernel((n, scalar, op) => {
      for (let i of ti.ndrange(n)) {
        if (op === "add") {
          resultField[i] = aField[i] + scalar;
        } else if (op === "mul") {
          resultField[i] = aField[i] * scalar;
        } else if (op === "div") {
          resultField[i] = aField[i] / scalar;
        } else if (op === "pow") {
          resultField[i] = ti.pow(aField[i], scalar);
        } else {
          resultField[i] = aField[i];
        }
      }
    })(n, scalar, op);

    const result = await resultField.toArray();
    return result;
  }

  /**
   * Function to perform vector addition: c = a + b
   * @param {array} a - The first vector
   * @param {array} b - The second vector
   * @returns {array} The resulting vector
   */
  async vecAdd(a, b) {
    const n = a.length;
    const aField = ti.field(ti.f32, [n]);
    const bField = ti.field(ti.f32, [n]);
    const cField = ti.field(ti.f32, [n]);

    aField.fromArray(a);
    bField.fromArray(b);

    ti.addToKernelScope({ aField, bField, cField });

    ti.kernel((n) => {
      for (let i of ti.ndrange(n)) {
        cField[i] = aField[i] + bField[i];
      }
    })(n);

    const result = await cField.toArray();
    return result;
  }

  /**
   * Function to perform element-wise vector multiplication: c = a .* b
   * @param {array} a - The first vector
   * @param {array} b - The second vector
   * @returns {array} The resulting vector
   */
  async vecMul(a, b) {
    const n = a.length;
    const aField = ti.field(ti.f32, [n]);
    const bField = ti.field(ti.f32, [n]);
    const cField = ti.field(ti.f32, [n]);

    aField.fromArray(a);
    bField.fromArray(b);

    ti.addToKernelScope({ aField, bField, cField });

    ti.kernel((n) => {
      for (let i of ti.ndrange(n)) {
        cField[i] = aField[i] * bField[i];
      }
    })(n);

    const result = await cField.toArray();
    return result;
  }
  /**
   * Function to compute the dot product of two vectors: result = a · b
   * @param {array} a - The first vector
   * @param {array} b - The second vector
   * @returns {number} The dot product
   */
  async dotProduct(a, b) {
    const n = a.length;
    const aField = ti.field(ti.f32, [n]);
    const bField = ti.field(ti.f32, [n]);
    const resultField = ti.field(ti.f32, [1]);

    aField.fromArray(a);
    bField.fromArray(b);
    resultField.fromArray([0]);

    ti.addToKernelScope({ aField, bField, resultField });

    ti.kernel((n) => {
      for (let i of ti.ndrange(n)) {
        ti.atomicAdd(resultField[0], aField[i] * bField[i]);
      }
    })(n);

    const result = await resultField.toArray();
    return result[0];
  }

  /**
   * Function to compute the L2 norm of a vector: result = ||a||_2
   * @param {array} a - The input vector
   * @returns {number} The L2 norm of the vector
   */
  async norm(a) {
    const n = a.length;
    const aField = ti.field(ti.f32, [n]);
    const resultField = ti.field(ti.f32, [1]);

    aField.fromArray(a);
    resultField.fromArray([0]);

    ti.addToKernelScope({ aField, resultField });

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

  /**
   * Function to normalize a vector
   * @param {array} a - The vector to normalize
   * @returns {array} The normalized vector
   */
  async normalize(a) {
    const n = a.length;
    const aField = ti.field(ti.f32, [n]);
    const resultField = ti.field(ti.f32, [n]);
    const tempField = ti.field(ti.f32, [1]);

    aField.fromArray(a);
    tempField.fromArray([0]);

    ti.addToKernelScope({ aField, resultField, tempField });

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

  /**
   * Function to perform matrix-matrix multiplication: C = A * B
   * @param {array} A - The first matrix
   * @param {array} B - The second matrix
   * @returns {array} The resulting matrix
   */
  async matMatMul(A, B) {
    const m = A.length;
    const k = A[0].length;
    const n = B[0].length;

    const AField = ti.field(ti.f32, [m * k]);
    const BField = ti.field(ti.f32, [k * n]);
    const CField = ti.field(ti.f32, [m * n]);

    AField.fromArray(A.flat());
    BField.fromArray(B.flat());

    ti.addToKernelScope({ AField, BField, CField });

    ti.kernel((m, n, k) => {
      for (let i of ti.ndrange(m)) {
        for (let j of ti.ndrange(n)) {
          let sum = 0.0;
          for (let p of ti.ndrange(k)) {
            sum +=
              AField[ti.i32(i) * ti.i32(k) + ti.i32(p)] *
              BField[ti.i32(p) * ti.i32(n) + ti.i32(j)];
          }
          CField[ti.i32(i) * ti.i32(n) + ti.i32(j)] = sum;
        }
      }
    })(m, n, k);

    const flatC = await CField.toArray();
    const C = [];
    for (let i = 0; i < m; i++) {
      C.push(flatC.slice(i * n, (i + 1) * n));
    }
    return C;
  }

  /**
   * Function to transpose a matrix: B = A^T
   * @param {array} A - The matrix to transpose
   * @param {object} [resultBuffer=null] - Optional buffer to store the result
   * @returns {array} The transposed matrix
   */
  async transpose(A, resultBuffer = null) {
    const m = A.length;
    const n = A[0].length;

    const AField = ti.field(ti.f32, [m * n]);
    const BField = ti.field(ti.f32, [n * m]);

    const flatA = A.flat();
    AField.fromArray(flatA);

    ti.addToKernelScope({ AField, BField });

    ti.kernel((m, n) => {
      for (let i of ti.ndrange(m)) {
        for (let j of ti.ndrange(n)) {
          BField[ti.i32(j) * ti.i32(m) + ti.i32(i)] = AField[ti.i32(i) * ti.i32(n) + ti.i32(j)];
        }
      }
    })(m, n);

    const result = await BField.toArray();
    // Reshape to n x m
    const B = [];
    for (let i = 0; i < n; i++) {
      B.push(result.slice(i * m, (i + 1) * m));
    }
    return B;
  }

  /**
   * Function to extract the diagonal elements of a matrix: result = diag(A)
   * @param {array} A - The input matrix
   * @param {object} [resultBuffer=null] - Optional buffer to store the result
   * @returns {array} The vector of diagonal elements
   */
  async diagonal(A, resultBuffer = null) {
    const n = Math.min(A.length, A[0].length);

    const AField = ti.field(ti.f32, [A.length * A[0].length]);
    const resultField = ti.field(ti.f32, [n]);

    const flatA = A.flat();
    AField.fromArray(flatA);

    ti.addToKernelScope({ AField, resultField });

    ti.kernel((n, cols) => {
      for (let i of ti.ndrange(n)) {
        resultField[i] = AField[ti.i32(i) * ti.i32(cols) + ti.i32(i)];
      }
    })(n, A[0].length);

    const result = await resultField.toArray();
    return result;
  }

  /**
   * Function to perform sparse matrix-vector multiplication using CSR format
   * @param {object} sparseMatrix - Object with {values, col_indices, row_indices, rows, cols}
   * @param {array} x - The vector to multiply with
   * @param {object} [resultBuffer=null] - Optional buffer to store the result
   * @returns {array} The resulting vector
   */
  async sparseMatVecMul(sparseMatrix, x, resultBuffer = null) {
    // Convert incoming snake_case keys to internal camelCase for code style
    const { values, col_indices: colIndices, row_indices: rowIndices, rows, cols } = sparseMatrix;
    const nnz = values.length;

    const valuesField = ti.field(ti.f32, [nnz]);
    const colIndicesField = ti.field(ti.i32, [nnz]);
    const rowIndicesField = ti.field(ti.i32, [nnz]);
    const xField = ti.field(ti.f32, [cols]);
    const resultField = ti.field(ti.f32, [rows]);

    valuesField.fromArray(values);
    colIndicesField.fromArray(colIndices);
    rowIndicesField.fromArray(rowIndices);
    xField.fromArray(x);
    resultField.fromArray(new Array(rows).fill(0));

    ti.addToKernelScope({ valuesField, colIndicesField, rowIndicesField, xField, resultField });

    ti.kernel((nnz) => {
      for (let k of ti.ndrange(nnz)) {
        ti.atomicAdd(resultField[rowIndicesField[k]], valuesField[k] * xField[colIndicesField[k]]);
      }
    })(nnz);

    const result = await resultField.toArray();
    return result;
  }

  /**
   * Function to create a deep copy of a vector or matrix
   * @param {array} data - The vector or matrix to copy
   * @returns {array} A deep copy of the input data
   */
  async copy(data) {
    if (Array.isArray(data[0])) {
      // Matrix
      const m = data.length;
      const n = data[0].length;
      const AField = ti.field(ti.f32, [m * n]);
      const resultField = ti.field(ti.f32, [m * n]);

      const flatA = data.flat();
      AField.fromArray(flatA);

      ti.addToKernelScope({ AField, resultField });

      ti.kernel((total) => {
        for (let i of ti.ndrange(total)) {
          resultField[i] = AField[i];
        }
      })(m * n);

      const result = await resultField.toArray();
      // Reshape
      const C = [];
      for (let i = 0; i < m; i++) {
        C.push(result.slice(i * n, (i + 1) * n));
      }
      return C;
    } else {
      // Vector
      const n = data.length;
      const aField = ti.field(ti.f32, [n]);
      const resultField = ti.field(ti.f32, [n]);

      aField.fromArray(data);

      ti.addToKernelScope({ aField, resultField });

      ti.kernel((n) => {
        for (let i of ti.ndrange(n)) {
          resultField[i] = aField[i];
        }
      })(n);

      const result = await resultField.toArray();
      return result;
    }
  }

  /**
   * Function to fill a vector or matrix with a constant value
   * @param {array} data - The vector or matrix to fill (determines size)
   * @param {number} value - The value to fill with
   * @returns {array} The filled vector or matrix
   */
  async fill(data, value) {
    if (Array.isArray(data[0])) {
      // Matrix
      const m = data.length;
      const n = data[0].length;
      const resultField = ti.field(ti.f32, [m * n]);

      ti.addToKernelScope({ resultField });

      ti.kernel((total, value) => {
        for (let i of ti.ndrange(total)) {
          resultField[i] = value;
        }
      })(m * n, value);

      const result = await resultField.toArray();
      // Reshape
      const C = [];
      for (let i = 0; i < m; i++) {
        C.push(result.slice(i * n, (i + 1) * n));
      }
      return C;
    } else {
      // Vector
      const n = data.length;
      const resultField = ti.field(ti.f32, [n]);

      ti.addToKernelScope({ resultField });

      ti.kernel((n, value) => {
        for (let i of ti.ndrange(n)) {
          resultField[i] = value;
        }
      })(n, value);

      const result = await resultField.toArray();
      return result;
    }
  }

  /**
   * Function to scale a vector or matrix by a scalar
   * @param {array} data - The vector or matrix to scale
   * @param {number} scalar - The scalar value to scale by
   * @returns {array} The scaled vector or matrix
   */
  async scale(data, scalar) {
    if (Array.isArray(data[0])) {
      // Matrix
      const m = data.length;
      const n = data[0].length;
      const AField = ti.field(ti.f32, [m * n]);
      const resultField = ti.field(ti.f32, [m * n]);

      const flatA = data.flat();
      AField.fromArray(flatA);

      ti.addToKernelScope({ AField, resultField });

      ti.kernel((total, scalar) => {
        for (let i of ti.ndrange(total)) {
          resultField[i] = AField[i] * scalar;
        }
      })(m * n, scalar);

      const result = await resultField.toArray();
      // Reshape
      const C = [];
      for (let i = 0; i < m; i++) {
        C.push(result.slice(i * n, (i + 1) * n));
      }
      return C;
    } else {
      // Vector
      const n = data.length;
      const aField = ti.field(ti.f32, [n]);
      const resultField = ti.field(ti.f32, [n]);

      aField.fromArray(data);

      ti.addToKernelScope({ aField, resultField });

      ti.kernel((n, scalar) => {
        for (let i of ti.ndrange(n)) {
          resultField[i] = aField[i] * scalar;
        }
      })(n, scalar);

      const result = await resultField.toArray();
      return result;
    }
  }

  /**
   * Function to compute the residual vector: r = b - A * x
   * @param {array} A - The system matrix
   * @param {array} x - The solution vector
   * @param {array} b - The right-hand side vector
   * @returns {array} The residual vector
   */
  async residual(A, x, b) {
    const Ax = await this.matVecMul(A, x);
    return this.vecSub(b, Ax);
  }

  /**
   * Function to apply a preconditioner: solve M * z = r for z
   * @param {array} A - The system matrix
   * @param {array} r - The residual vector
   * @param {string} [type='jacobi'] - The type of preconditioner ('jacobi' or 'ssor')
   * @param {number} [omega=1.0] - The relaxation factor for SSOR
   * @returns {array} The vector z
   */
  async preconditioner(A, r, type = "jacobi", omega = 1.0) {
    const n = r.length;

    if (type === "jacobi") {
      // Jacobi: M = diag(A), so z_i = r_i / A_ii
      const diag = await this.diagonal(A);
      const invDiag = diag.map((d) => 1.0 / d);
      return this.vecMul(invDiag, r);
    } else if (type === "ssor") {
      // SSOR: Simplified Symmetric Successive Over-Relaxation
      // This is a basic implementation; full SSOR would require forward/backward sweeps
      const diag = await this.diagonal(A);
      const invDiag = diag.map((d) => omega / d);

      // For simplicity, approximate with Jacobi-like application
      // Full SSOR would need iterative application or matrix splitting
      return this.vecMul(invDiag, r);
    } else {
      errorLog(`Unsupported preconditioner type: ${type}`);
      return null;
    }
  }

  /**
   * Function to solve a system of linear equations using the Conjugate Gradient method (GPU asynchronous version)
   * @param {array} A - The system matrix
   * @param {array} b - The right-hand side vector
   * @param {array} [x0=null] - The initial guess for the solution
   * @param {number} [tol=1e-6] - The convergence tolerance
   * @param {number} [maxIter=1000] - The maximum number of iterations
   * @param {string} [preconditionerType=null] - The type of preconditioner to use
   * @returns {array} The solution vector
   */
  async webgpuConjugateGradientSolver(A, b, x0 = null, tol, maxIter, preconditionerType = null) {
    const n = b.length;
    let x = x0 ? await this.copy(x0) : new Array(n).fill(0.0);

    // Initial residual r = b - A*x
    let r = await this.residual(A, x, b);
    let rr = await this.dotProduct(r, r);
    let rnorm0 = Math.sqrt(rr);

    basicLog(`CG: Initial residual norm: ${rnorm0}`);

    if (rnorm0 < tol) {
      basicLog(`CG: Already converged`);
      return x;
    }

    // Initial search direction
    let p = preconditionerType ? await this.preconditioner(A, r, preconditionerType) : await this.copy(r);

    for (let iter = 0; iter < maxIter; iter++) {
      // Compute A*p
      const Ap = await this.matVecMul(A, p);

      // Compute p·Ap
      const pAp = await this.dotProduct(p, Ap);

      if (Math.abs(pAp) < 1e-16) {
        errorLog(`CG: p^T * A * p is too small (${pAp}), stopping`);
        break;
      }

      // Compute alpha = (r·r) / (p·Ap)
      const alpha = rr / pAp;

      // Update solution: x = x + alpha*p
      const alphaP = await this.scale(p, alpha);
      x = await this.vecAdd(x, alphaP);

      // Update residual: r = r - alpha*A*p
      const alphaAp = await this.scale(Ap, alpha);
      r = await this.vecSub(r, alphaAp);

      // Compute new r·r
      const rrNew = await this.dotProduct(r, r);
      const rnorm = Math.sqrt(rrNew);

      debugLog(`CG: Iteration ${iter + 1}, residual norm: ${rnorm}`);

      // Check convergence
      if (rnorm < tol * rnorm0) {
        basicLog(`CG: Converged in ${iter + 1} iterations`);
        break;
      }

      // Compute beta = (r_new·r_new) / (r_old·r_old)
      const beta = rrNew / rr;

      // Update search direction: p = r + beta*p (or z + beta*p if preconditioned)
      if (preconditionerType) {
        const z = await this.preconditioner(A, r, preconditionerType);
        const betaP = await this.scale(p, beta);
        p = await this.vecAdd(z, betaP);
      } else {
        const betaP = await this.scale(p, beta);
        p = await this.vecAdd(r, betaP);
      }

      // Update rr for next iteration
      rr = rrNew;
    }

    return x;
  }

  /**
   * Function to solve a system of linear equations using the Jacobi iterative method (GPU asynchronous version)
   *
   * @param {array} A - The system matrix
   * @param {array} b - The right-hand side vector
   * @param {array} x0 - Initial guess for solution vector
   * @param {number} [maxIter=1000] - Maximum number of iterations
   * @param {number} [tol=1e-6] - Convergence tolerance
   * @returns {array} The solution vector
   */
  async webgpuJacobiSolver(A, b, x0, maxIter, tol) {
    const n = b.length;
    const flatA = A.flat();

    const AField = ti.field(ti.f32, [n * n]);
    const bField = ti.field(ti.f32, [n]);
    const xField = ti.field(ti.f32, [n]);
    const xNewField = ti.field(ti.f32, [n]);
    const diagField = ti.field(ti.f32, [n]);
    const maxResidualField = ti.field(ti.f32, [1]);

    AField.fromArray(flatA);
    bField.fromArray(b);
    xField.fromArray(x0);
    xNewField.fromArray(x0);

    ti.addToKernelScope({ AField, bField, xField, xNewField, diagField, maxResidualField });

    ti.kernel((n) => {
      for (let i of ti.ndrange(n)) {
        diagField[i] = AField[ti.i32(i) * ti.i32(n) + ti.i32(i)];
      }
    })(n);

    const jacobiStep = ti.kernel((n) => {
      maxResidualField[0] = 0.0;
      for (let i of ti.ndrange(n)) {
        let sum = 0.0;
        for (let j of ti.ndrange(n)) {
          sum += AField[ti.i32(i) * ti.i32(n) + ti.i32(j)] * xField[j];
        }
        const ri = bField[i] - sum;
        xNewField[i] = xField[i] + ri / diagField[i];
        ti.atomicMax(maxResidualField[0], ti.abs(ri));
      }
    });

    const swapSolution = ti.kernel((n) => {
      for (let i of ti.ndrange(n)) {
        xField[i] = xNewField[i];
      }
    });

    for (let iter = 0; iter < maxIter; iter++) {
      jacobiStep(n);
      const rnorm = (await maxResidualField.toArray())[0];
      debugLog(`Jacobi: Iteration ${iter + 1}, residual norm: ${rnorm}`);
      if (rnorm < tol) {
        return { solutionVector: await xNewField.toArray(), iterations: iter + 1, converged: true };
      }
      swapSolution(n);
    }

    errorLog(`Jacobi: Did not converge in ${maxIter} iterations`);
    return { solutionVector: await xField.toArray(), iterations: maxIter, converged: false };
  }

  /**
   * Function to destroy the compute engine and clean up resources
   */
  async destroy() {
    if (this.initialized) {
      // Clean up Taichi.js resources and WebGPU context
      if (typeof ti.destroy === "function") {
        await ti.destroy();
      }
      this.initialized = false;
    }
  }

}
