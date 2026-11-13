/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Function to create plots of the solution vector
 * @param {PlotModel} model - The model, or its information from FEAScriptWorker.getModelInfo()
 * @param {PlotResult} result - The result of solve(), with the solution vector and the node coordinates
 * @param {string} plotType - The type of plot
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 * @param {{ field?: string }} [options] - Plot options:
 *  - field: The named field to plot, for models with more than one unknown per node (e.g. "u", "v", "p" for
 *    creeping flow, "w", "theta" for the Euler-Bernoulli beam); defaults to the main field of the model
 */
export function plotSolution(model: PlotModel, result: PlotResult, plotType: string, plotDivId: string, options?: {
    field?: string;
}): void;
/**
 * Function to generate a dense visualization grid and interpolate the FEM solution on it
 * @param {PlotModel} model - The model, or its information from FEAScriptWorker.getModelInfo()
 * @param {PlotResult} result - The result of solve(), with the solution vector and the node coordinates
 * @param {string} plotType - The type of plot
 * @param {string} plotDivId - The id of the div where the plot will be rendered
 * @param {{ field?: string }} [options] - Plot options:
 *  - field: The named field to plot, for models with more than one unknown per node; defaults to the main field of the model
 */
export function plotInterpolatedSolution(model: PlotModel, result: PlotResult, plotType: string, plotDivId: string, options?: {
    field?: string;
}): void;
import type { PlotModel } from "../types.js";
import type { PlotResult } from "../types.js";
