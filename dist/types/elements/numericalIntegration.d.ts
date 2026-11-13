/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
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
    constructor({ meshDimension, elementOrder, elementShape }: string);
    meshDimension: any;
    elementOrder: any;
    elementShape: any;
    /**
     * Function to return Gauss points and weights based on element configuration
     * @returns {object} An object containing:
     *  - gaussPoints: Array of Gauss points (for triangles: array of [ksi, eta] pairs)
     *  - gaussWeights: Array of Gauss weights (for triangles: sum to 1/2, the reference triangle area)
     */
    getGaussPointsAndWeights(): object;
}
