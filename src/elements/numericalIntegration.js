/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.1 | https://feascript.com
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
   * @param {string} [elementOrder='linear'] - The order of elements
   * @param {string} [elementShape='quad'] - The 2D element shape, either 'quad' or 'triangle'
   */
  constructor({ meshDimension, elementOrder = "linear", elementShape = "quad" }) {
    this.meshDimension = meshDimension;
    this.elementOrder = elementOrder;
    this.elementShape = elementShape;
  }

  /**
   * Function to return Gauss points and weights based on element configuration
   * @returns {object} An object containing:
   *  - gaussPoints: Array of Gauss points (for triangles: array of [ksi, eta] pairs)
   *  - gaussWeights: Array of Gauss weights (for triangles: sum to 1/2, the reference triangle area)
   */
  getGaussPointsAndWeights() {
    let gaussPoints = []; // Gauss points
    let gaussWeights = []; // Gauss weights

    if (this.elementShape === "triangle") {
      // Collapsed (non-tensor-product) rules on the reference triangle (0,0), (0,1), (1,0)
      if (this.elementOrder === "linear") {
        // 3-point rule, exact up to degree 2
        gaussPoints = [
          [1 / 6, 1 / 6],
          [2 / 3, 1 / 6],
          [1 / 6, 2 / 3],
        ];
        gaussWeights = [1 / 6, 1 / 6, 1 / 6];
      } else if (this.elementOrder === "quadratic") {
        // 6-point rule, exact up to degree 4
        const a = 0.4459484909159649;
        const b = 0.0915762135097707;
        const wa = 0.2233815896780115 / 2;
        const wb = 0.1099517436553219 / 2;
        gaussPoints = [
          [a, a],
          [1 - 2 * a, a],
          [a, 1 - 2 * a],
          [b, b],
          [1 - 2 * b, b],
          [b, 1 - 2 * b],
        ];
        gaussWeights = [wa, wa, wa, wb, wb, wb];
      }
    } else if (this.elementOrder === "linear") {
      // For linear elements, use 2-point Gauss quadrature (exact up to degree 3), so that the
      // stiffness and mass terms of bilinear quadrilaterals (2×2 points) are integrated exactly
      gaussPoints[0] = (1 - 1 / Math.sqrt(3)) / 2;
      gaussPoints[1] = (1 + 1 / Math.sqrt(3)) / 2;
      gaussWeights[0] = 1 / 2;
      gaussWeights[1] = 1 / 2;
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
