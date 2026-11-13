/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to get the local node indices on each side of the reference element
 * @param {string} meshDimension - The dimension of the mesh, either '1D' or '2D'
 * @param {string} elementOrder - The order of elements, either 'linear' or 'quadratic'
 * @param {string} [elementShape='quad'] - The 2D element shape, either 'quad' or 'triangle'
 * @returns {object} Map from side index to the local node indices on that side
 */
export function getBoundarySides(meshDimension: string, elementOrder: string, elementShape?: string): object;
export namespace triangleBoundarySides {
    let linear: {
        0: number[];
        1: number[];
        2: number[];
    };
    let quadratic: {
        0: number[];
        1: number[];
        2: number[];
    };
}
/**
 * Class to handle basis functions and their derivatives based on element configuration
 */
export class BasisFunctions {
    /**
     * Constructor to initialize the BasisFunctions class
     * @param {string} meshDimension - The dimension of the mesh
     * @param {string} [elementOrder='linear'] - The order of elements
     * @param {string} [elementShape='quad'] - The 2D element shape, either 'quad' or 'triangle'
     */
    constructor({ meshDimension, elementOrder, elementShape }: string);
    meshDimension: any;
    elementOrder: any;
    elementShape: any;
    /**
     * Function to calculate basis functions and their derivatives based on the dimension and order
     * @param {number} ksi - Natural coordinate (for both 1D and 2D), in [0, 1]
     * @param {number} [eta] - Second natural coordinate (only for 2D elements)
     * @param {number} [elementLength] - Physical element length, only required for 1D 'hermiteCubic' elements
     * @returns {object} An object containing:
     *  - basisFunction: Array of evaluated basis functions
     *  - basisFunctionDerivKsi: Array of derivatives of basis functions with respect to ksi
     *  - basisFunctionDerivEta: Array of derivatives of basis functions with respect to eta (only for 2D elements)
     *  - basisFunctionDerivKsi2: Array of second derivatives of basis functions with respect to ksi
     *    (only for 1D 'hermiteCubic' elements)
     *
     * 'hermiteCubic' is a general-purpose interpolation type, not specific to beams: it makes both
     * the value and the slope continuous across elements (unlike the C0 Lagrange types above), which
     * any fourth-order problem needs (e.g. beam or plate bending). eulerBernoulliBeam.js is currently
     * the only place in this codebase that uses it.
     */
    getBasisFunctions(ksi: number, eta?: number, elementLength?: number): object;
}
