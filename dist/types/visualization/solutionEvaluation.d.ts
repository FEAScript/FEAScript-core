/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.1 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/** @import { PlotModel, PlotResult } from "../types.js" */
/**
 * Function to evaluate a 2D solution at given points, e.g. to sample it on a grid of another program or to read
 * it along a line. Each point is located in the mesh and the nodal values of its element are interpolated with the
 * element basis functions, so the values are exact for the fields the elements reproduce (linear fields on linear
 * elements, quadratic fields on straight-sided quadratic elements)
 * @param {PlotModel} model - The FEAScriptModel, or the model information of a worker (FEAScriptWorker.getModelInfo())
 * @param {PlotResult} result - The result of solve(), with the solution vector and the node coordinates
 * @param {Array<[number, number]>} points - The points, as [x, y] pairs
 * @param {{ field?: string }} [options] - Evaluation options:
 *  - field: The named field to evaluate, for models with more than one unknown per node; defaults to the main field of the model
 * @returns {Float64Array} The value at each point, in the order of the points; NaN for a point outside the mesh
 *  (outside the domain or inside a hole). Points on the boundary count as inside
 * @throws {FEAScriptError} INVALID_INPUT
 */
export function evaluateSolution(model: PlotModel, result: PlotResult, points: Array<[number, number]>, options?: {
    field?: string;
}): Float64Array;
/**
 * Function to prepare the location of points in a 2D mesh and the interpolation of nodal values there
 *
 * A point outside the boundary (ray casting) is rejected first. Otherwise the elements around the nodes of the
 * element that held the previous point are tried (quick search, for points that follow each other, as on a grid),
 * then all elements (slow search)
 * @param {PlotModel} model - The FEAScriptModel, or the model information of a worker
 * @param {{ nodesXCoordinates: ArrayLike<number>, nodesYCoordinates: ArrayLike<number> }} nodesCoordinates - The
 *  node coordinates of the result
 * @param {ArrayLike<number>} nodalValues - One value per mesh node
 * @returns {(x: number, y: number) => number | null} A function giving the interpolated value at a point, or null
 *  for a point outside the mesh
 */
export function createSolutionLocator(model: PlotModel, nodesCoordinates: {
    nodesXCoordinates: ArrayLike<number>;
    nodesYCoordinates: ArrayLike<number>;
}, nodalValues: ArrayLike<number>): (x: number, y: number) => number | null;
import type { PlotModel } from "../types.js";
import type { PlotResult } from "../types.js";
