/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.2.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Class to handle numerical integration using Gauss quadrature
 */
export class NumericalIntegration {
  /**
   * Constructor to initialize the NumericalIntegration class
   * @param {string} meshDimension - The dimension of the mesh
   * @param {string} elementOrder - The order of elements
   * @param {number} nodesPerElement - Νodes in the reference element based on the first element in the nop array
   */
  constructor({ meshDimension, elementOrder, nodesPerElement }) {
    this.meshDimension = meshDimension;
    this.elementOrder = elementOrder;
    this.nodesPerElement = nodesPerElement;
  }

  /**
   * Function to return Gauss points and weights based on element configuration
   * @returns {object} An object containing:
   *  - gaussPoints: Array of Gauss points
   *  - gaussWeights: Array of Gauss weights
   */
  getGaussPointsAndWeights() {
    let gaussPoints = []; // Gauss points
    let gaussWeights = []; // Gauss weights

    if (this.elementOrder === "linear" && this.nodesPerElement == 4) {
      // For linear elements, use 1-point Gauss quadrature
      // Linear quadrilateral elements
      gaussPoints[0] = 1 / 2;
      gaussWeights[0] = 1;
    } else if (this.elementOrder === "linear" && this.nodesPerElement == 3) {
      // Linear triangular elements
      // Triangular Gauss quadrature is NOT fully implemented yet
      // TODO: Refactor triangle integration separately from quadrilateral elements
      // TODO: Triangles require paired (ksi, eta) Gauss points
      gaussPoints[0] = 1 / 3;
      gaussWeights[0] = 1;
    } else if (this.elementOrder === "quadratic" && this.nodesPerElement == 9) {
      // For quadratic elements, use 3-point Gauss quadrature
      // Quadratic quadrilateral elements
      gaussPoints[0] = (1 - Math.sqrt(3 / 5)) / 2;
      gaussPoints[1] = 1 / 2;
      gaussPoints[2] = (1 + Math.sqrt(3 / 5)) / 2;
      gaussWeights[0] = 5 / 18;
      gaussWeights[1] = 8 / 18;
      gaussWeights[2] = 5 / 18;
    } else if (this.elementOrder === "quadratic" && this.nodesPerElement == 6) {
      // Quadratic triangular elements
      // Triangular Gauss quadrature is NOT fully implemented yet
      // TODO: Refactor triangle integration separately from quadrilateral elements
      // TODO: Triangles require paired (ksi, eta) Gauss points
      gaussPoints[0] = 2 / 3;
      gaussPoints[1] = 1 / 6;
      gaussPoints[2] = 1 / 6;
      gaussWeights[0] = 1 / 3;
      gaussWeights[1] = 1 / 3;
      gaussWeights[2] = 1 / 3;
    }

    return { gaussPoints, gaussWeights };
  }
}
