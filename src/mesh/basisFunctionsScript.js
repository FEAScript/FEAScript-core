/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";

/**
 * Class to handle basis functions and their derivatives based on element configuration
 */
export class BasisFunctions {
  /**
   * Constructor to initialize the BasisFunctions class
   * @param {string} meshDimension - The dimension of the mesh
   * @param {string} elementOrder - The order of elements
   */
  constructor({ meshDimension, elementOrder }) {
    this.meshDimension = meshDimension;
    this.elementOrder = elementOrder;
  }

  /**
   * Function to calculate basis functions and their derivatives based on the dimension and order
   * @param {number} ksi - Natural coordinate (for both 1D and 2D)
   * @param {number} [eta] - Second natural coordinate (only for 2D elements)
   * @returns {object} An object containing:
   *  - basisFunction: Array of evaluated basis functions
   *  - basisFunctionDerivKsi: Array of derivatives of basis functions with respect to ksi
   *  - basisFunctionDerivEta: Array of derivatives of basis functions with respect to eta (only for 2D elements)
   */
  getBasisFunctions(ksi, eta = null) {
    let basisFunction = [];
    let basisFunctionDerivKsi = [];
    let basisFunctionDerivEta = [];

    if (this.meshDimension === "1D") {
      if (this.elementOrder === "linear") {
        // Linear basis functions for 1D elements
        basisFunction[0] = 1 - ksi;
        basisFunction[1] = ksi;

        // Derivatives of basis functions with respect to ksi
        basisFunctionDerivKsi[0] = -1;
        basisFunctionDerivKsi[1] = 1;
      } else if (this.elementOrder === "quadratic") {
        // Quadratic basis functions for 1D elements
        basisFunction[0] = 1 - 3 * ksi + 2 * ksi ** 2;
        basisFunction[1] = 4 * ksi - 4 * ksi ** 2;
        basisFunction[2] = -ksi + 2 * ksi ** 2;

        // Derivatives of basis functions with respect to ksi
        basisFunctionDerivKsi[0] = -3 + 4 * ksi;
        basisFunctionDerivKsi[1] = 4 - 8 * ksi;
        basisFunctionDerivKsi[2] = -1 + 4 * ksi;
      }
    } else if (this.meshDimension === "2D") {
      if (eta === null) {
        errorLog("Eta coordinate is required for 2D elements");
        return;
      }

      if (this.elementOrder === "linear") {
        // Linear basis functions for 2D elements
        function l1(c) {
          return 1 - c;
        }
        function l2(c) {
          return c;
        }
        function dl1() {
          return -1;
        }
        function dl2() {
          return 1;
        }

        // Evaluate basis functions at (ksi, eta)
        basisFunction[0] = l1(ksi) * l1(eta);
        basisFunction[1] = l1(ksi) * l2(eta);
        basisFunction[2] = l2(ksi) * l1(eta);
        basisFunction[3] = l2(ksi) * l2(eta);

        // Derivatives with respect to ksi
        basisFunctionDerivKsi[0] = dl1() * l1(eta);
        basisFunctionDerivKsi[1] = dl1() * l2(eta);
        basisFunctionDerivKsi[2] = dl2() * l1(eta);
        basisFunctionDerivKsi[3] = dl2() * l2(eta);

        // Derivatives with respect to eta
        basisFunctionDerivEta[0] = l1(ksi) * dl1();
        basisFunctionDerivEta[1] = l1(ksi) * dl2();
        basisFunctionDerivEta[2] = l2(ksi) * dl1();
        basisFunctionDerivEta[3] = l2(ksi) * dl2();
      } else if (this.elementOrder === "quadratic") {
        // Quadratic basis functions for 2D elements
        function l1(c) {
          return 2 * c ** 2 - 3 * c + 1;
        }
        function l2(c) {
          return -4 * c ** 2 + 4 * c;
        }
        function l3(c) {
          return 2 * c ** 2 - c;
        }
        function dl1(c) {
          return 4 * c - 3;
        }
        function dl2(c) {
          return -8 * c + 4;
        }
        function dl3(c) {
          return 4 * c - 1;
        }

        // Evaluate basis functions at (ksi, eta)
        basisFunction[0] = l1(ksi) * l1(eta);
        basisFunction[1] = l1(ksi) * l2(eta);
        basisFunction[2] = l1(ksi) * l3(eta);
        basisFunction[3] = l2(ksi) * l1(eta);
        basisFunction[4] = l2(ksi) * l2(eta);
        basisFunction[5] = l2(ksi) * l3(eta);
        basisFunction[6] = l3(ksi) * l1(eta);
        basisFunction[7] = l3(ksi) * l2(eta);
        basisFunction[8] = l3(ksi) * l3(eta);

        // Derivatives with respect to ksi
        basisFunctionDerivKsi[0] = dl1(ksi) * l1(eta);
        basisFunctionDerivKsi[1] = dl1(ksi) * l2(eta);
        basisFunctionDerivKsi[2] = dl1(ksi) * l3(eta);
        basisFunctionDerivKsi[3] = dl2(ksi) * l1(eta);
        basisFunctionDerivKsi[4] = dl2(ksi) * l2(eta);
        basisFunctionDerivKsi[5] = dl2(ksi) * l3(eta);
        basisFunctionDerivKsi[6] = dl3(ksi) * l1(eta);
        basisFunctionDerivKsi[7] = dl3(ksi) * l2(eta);
        basisFunctionDerivKsi[8] = dl3(ksi) * l3(eta);

        // Derivatives with respect to eta
        basisFunctionDerivEta[0] = l1(ksi) * dl1(eta);
        basisFunctionDerivEta[1] = l1(ksi) * dl2(eta);
        basisFunctionDerivEta[2] = l1(ksi) * dl3(eta);
        basisFunctionDerivEta[3] = l2(ksi) * dl1(eta);
        basisFunctionDerivEta[4] = l2(ksi) * dl2(eta);
        basisFunctionDerivEta[5] = l2(ksi) * dl3(eta);
        basisFunctionDerivEta[6] = l3(ksi) * dl1(eta);
        basisFunctionDerivEta[7] = l3(ksi) * dl2(eta);
        basisFunctionDerivEta[8] = l3(ksi) * dl3(eta);
      }
    }

    return { basisFunction, basisFunctionDerivKsi, basisFunctionDerivEta };
  }
}
