/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Creates a color scale configuration for visualization
 * @param {object} [options] - Color scale options
 * @param {string} [options.presetName="Cool to Warm"] - Color map preset name
 * @param {boolean} [options.reverse=false] - Whether to reverse the color map
 * @param {boolean} [options.showScalarBar=true] - Whether to display the scalar bar
 * @param {string} [options.scalarBarTitle="Solution"] - Title for the scalar bar
 * @returns {object} Color scale configuration object
 */
export function createColorScale(options?: {
    presetName?: string | undefined;
    reverse?: boolean | undefined;
    showScalarBar?: boolean | undefined;
    scalarBarTitle?: string | undefined;
}): object;
/**
 * Creates contour line options for visualization
 * @param {object} [options] - Contour line options
 * @param {boolean} [options.enabled=true] - Whether contour lines are enabled
 * @param {number} [options.numberOfContours=12] - Number of contour lines
 * @param {Array<number>} [options.color=[0.15,0.15,0.15]] - RGB color array for contour lines
 * @param {number} [options.lineWidth=1] - Width of contour lines
 * @returns {object} Contour line configuration object
 */
export function createContourLineOptions(options?: {
    enabled?: boolean | undefined;
    numberOfContours?: number | undefined;
    color?: number[] | undefined;
    lineWidth?: number | undefined;
}): object;
/**
 * Plots the FEA solution using the VTK.js backend
 * @param {PlotModel} model - The model, or its information from FEAScriptWorker.getModelInfo()
 * @param {PlotResult} result - The result of solve(), with the solution vector and the node coordinates
 * @param {string} plotType - The type of plot (e.g., "line", "contour")
 * @param {string} plotDivId - The id of the HTML element for rendering
 * @param {object} [renderOptions={}] - Rendering options including colorScale, contourLines and field (the named
 *  field to plot, for models with more than one unknown per node)
 */
export function plotSolutionVtk(model: PlotModel, result: PlotResult, plotType: string, plotDivId: string, renderOptions?: object): Promise<void>;
/**
 * Plots an interpolated FEA solution using the VTK.js backend
 * @param {PlotModel} model - The model, or its information from FEAScriptWorker.getModelInfo()
 * @param {PlotResult} result - The result of solve(), with the solution vector and the node coordinates
 * @param {string} plotType - The type of plot (e.g., "contour")
 * @param {string} plotDivId - The id of the HTML element for rendering
 * @param {object} [renderOptions={}] - Rendering options including colorScale, contourLines and field (the named
 *  field to plot, for models with more than one unknown per node)
 */
export function plotInterpolatedSolutionVtk(model: PlotModel, result: PlotResult, plotType: string, plotDivId: string, renderOptions?: object): Promise<void>;
/**
 * Transforms solver output into VTK-compatible data structures
 * @param {PlotModel} model - The model, or its information from FEAScriptWorker.getModelInfo()
 * @param {PlotResult} result - The result of solve(), with the solution vector and the node coordinates
 * @param {object|null} [meshData=null] - Pre-prepared mesh data, or null to auto-prepare
 * @param {object} [options={}] - Options including mode ("surface" or "line") and field (the named field to export,
 *  for models with more than one unknown per node)
 * @returns {Promise<object>} VTK data object with points, scalars, cells, polyData, and metadata
 */
export function transformSolverOutputToVtkData(model: PlotModel, result: PlotResult, meshData?: object | null, options?: object): Promise<object>;
/**
 * Transforms solver output into a VTP (VTK PolyData XML) string
 * @param {PlotModel} model - The model, or its information from FEAScriptWorker.getModelInfo()
 * @param {PlotResult} result - The result of solve(), with the solution vector and the node coordinates
 * @param {object|null} [meshData=null] - Pre-prepared mesh data, or null to auto-prepare
 * @param {object} [options={}] - Options including mode ("surface" or "line") and field (the named field to export)
 * @returns {Promise<string>} VTP XML string
 */
export function transformSolverOutputToVTP(model: PlotModel, result: PlotResult, meshData?: object | null, options?: object): Promise<string>;
/**
 * Transforms solver output into typed array buffers suitable for ML pipelines
 * @param {PlotResult} result - The result of solve(), with the solution vector and the node coordinates
 * @returns {object} Object with features (Float32Array), featuresShape, labels, and points
 */
export function transformSolverOutputToMLBuffers(result: PlotResult): object;
import type { PlotModel } from "../types.js";
import type { PlotResult } from "../types.js";
