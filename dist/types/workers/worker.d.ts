/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Class to facilitate communication with web workers for FEAScript operations
 */
export class FEAScriptWorker {
    worker: Worker | null;
    feaWorker: any;
    isReady: boolean;
    started: Promise<void>;
    /**
     * Function to initialize the web worker and wrap it using Comlink
     * @private
     * @throws Will throw an error if the worker fails to initialize
     */
    private _initWorker;
    /**
     * Function to ensure that the worker is ready before performing any operations
     * @private
     * @returns {Promise<void>} Resolves as soon as the worker is ready
     * @throws Will throw an error if the worker fails to start, or is not ready within the timeout period
     */
    private _ensureReady;
    /**
     * Function to set the model configuration in the worker
     * @param {ModelName} modelConfig - The model configuration to set
     * @param {ModelOptions} [options] - Optional additional configuration, as in FEAScriptModel.setModelConfig. The
     *  coefficient functions are sent to the worker as source code, so they must be self-contained (no outer variables)
     * @returns {Promise<boolean>} Resolves when the configuration is set
     */
    setModelConfig(modelConfig: ModelName, options?: ModelOptions): Promise<boolean>;
    /**
     * Function to set the geometry in the worker
     * @param {Geometry} geometry - The geometry, as in FEAScriptModel.setGeometry
     * @returns {Promise<boolean>} Resolves when the geometry is set
     */
    setGeometry(geometry: Geometry): Promise<boolean>;
    /**
     * Function to set the mesh in the worker directly (a mesh of importGmshMesh, generateTriangleMesh or
     * generateQuadrilateralMesh)
     * @param {Mesh} mesh - The mesh object, as in FEAScriptModel.setMesh
     * @returns {Promise<boolean>} Resolves when the mesh is set
     */
    setMesh(mesh: Mesh): Promise<boolean>;
    /**
     * Function to set how the geometry is meshed in the worker. A size function is sent as its source code, so
     * it must be self-contained (no outer variables)
     * @param {MeshConfig} meshConfig - The mesh configuration, as in FEAScriptModel.setMeshConfig
     * @returns {Promise<boolean>} Resolves when the configuration is set
     */
    setMeshConfig(meshConfig: MeshConfig): Promise<boolean>;
    /**
     * Function to add a boundary condition to the worker
     * @param {string | number} boundaryKey - The boundary name (for the Euler-Bernoulli beam, the 1-based node
     *  number)
     * @param {BoundaryCondition | BoundaryCondition[] | ArrayBoundaryCondition | ArrayBoundaryCondition[]} condition - The condition object, as in FEAScriptModel.addBoundaryCondition, e.g.
     *  { type: "convection", h: 1, ambientTemperature: 20 }
     * @returns {Promise<boolean>} Resolves when the boundary condition is added
     */
    addBoundaryCondition(boundaryKey: string | number, condition: BoundaryCondition | BoundaryCondition[] | ArrayBoundaryCondition | ArrayBoundaryCondition[]): Promise<boolean>;
    /**
     * Function to set the solver method in the worker
     * @deprecated Use setModelConfig(model, { solver: { method } }); setSolverMethod will be removed in a future
     *  version
     * @param {SolverMethod} solverMethod - The solver method to set
     * @returns {Promise<boolean>} Resolves when the solver method is set
     */
    setSolverMethod(solverMethod: SolverMethod): Promise<boolean>;
    /**
     * Function to request the worker to solve the problem
     * @param {SolveOptions} [options] - Additional parameters for the solver, such as `maxIterations` and `tolerance`
     * @returns {Promise<WorkerSolveResult>} Resolves with the solution result
     */
    solve(options?: SolveOptions): Promise<WorkerSolveResult>;
    /**
     * Function to retrieve model information from the worker
     * @returns {Promise<ModelInfo>} Resolves with the model information
     */
    getModelInfo(): Promise<ModelInfo>;
    /**
     * Function to send a ping request to the worker to check its availability
     * @returns {Promise<boolean>} Resolves if the worker responds
     */
    ping(): Promise<boolean>;
    /**
     * Function to terminate the worker and clean up resources
     */
    terminate(): void;
}
import type { ModelName } from "../types.js";
import type { ModelOptions } from "../types.js";
import type { Geometry } from "../types.js";
import type { Mesh } from "../types.js";
import type { MeshConfig } from "../types.js";
import type { BoundaryCondition } from "../types.js";
import type { ArrayBoundaryCondition } from "../types.js";
import type { SolverMethod } from "../types.js";
import type { SolveOptions } from "../types.js";
import type { WorkerSolveResult } from "../types.js";
import type { ModelInfo } from "../types.js";
