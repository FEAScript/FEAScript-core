//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

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
    }

    return { gaussPoints, gaussWeights };
  }
}
