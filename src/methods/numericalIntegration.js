/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
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
   */
  constructor({ meshDimension, elementOrder }) {
    this.meshDimension = meshDimension;
    this.elementOrder = elementOrder;
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

    if (this.elementOrder === "linear") {
      // For linear elements, use 1-point Gauss quadrature
      gaussPoints[0] = 0.5;
      gaussWeights[0] = 1;
    } else if (this.elementOrder === "quadratic") {
      // For quadratic elements, use 3-point Gauss quadrature
      gaussPoints[0] = (1 - Math.sqrt(3 / 5)) / 2;
      gaussPoints[1] = 0.5;
      gaussPoints[2] = (1 + Math.sqrt(3 / 5)) / 2;
      gaussWeights[0] = 5 / 18;
      gaussWeights[1] = 8 / 18;
      gaussWeights[2] = 5 / 18;
    } else if (this.elementOrder === "hermiteCubic") {
      // For cubic Hermite elements, use 6-point Gauss quadrature (exact up to degree 11)
      gaussPoints[0] = 0.03376524289842399;
      gaussPoints[1] = 0.16939530676686775;
      gaussPoints[2] = 0.38069040695840155;
      gaussPoints[3] = 0.61930959304159845;
      gaussPoints[4] = 0.8306046932331322;
      gaussPoints[5] = 0.966234757101576;
      gaussWeights[0] = 0.08566224618958517;
      gaussWeights[1] = 0.1803807865240693;
      gaussWeights[2] = 0.23395696728634552;
      gaussWeights[3] = 0.23395696728634552;
      gaussWeights[4] = 0.1803807865240693;
      gaussWeights[5] = 0.08566224618958517;
    }

    return { gaussPoints, gaussWeights };
  }
}
