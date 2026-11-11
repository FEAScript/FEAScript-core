/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { newtonRaphson } from "./solvers/newtonRaphson.js";
import { solveLinearSystem } from "./solvers/linearSystemSolver.js";
import { solveLinearSystemAsync } from "./solvers/linearSystemSolver.js";
import { generateMesh, prepareMesh, readMesh, readMeshConfig } from "./mesh/meshUtils.js";
import { readGeometry, translateOldMeshConfig } from "./mesh/geometry.js";
import { assembleFrontPropagationMat, assembleFrontPropagationFront } from "./physics/frontPropagation.js";
import {
  assembleGeneralFormPDEMat,
  assembleGeneralFormPDEFront,
  assembleGeneralFormPDENonlinearMat,
  assembleGeneralFormPDENonlinearFront,
} from "./physics/generalFormPDE.js";
import { assembleHeatConductionMat, assembleHeatConductionFront } from "./physics/heatConduction.js";
import { ThermalBoundaryConditions } from "./physics/thermalBoundaryConditions.js";
import { GenericBoundaryConditions } from "./physics/genericBoundaryConditions.js";
import { assembleCreepingFlowMatrix, extractCreepingFlowFields } from "./physics/creepingFlow.js";
import {
  assembleEulerBernoulliBeamMat,
  extractEulerBernoulliBeamFields,
} from "./physics/eulerBernoulliBeam.js";
import { runFrontalSolver } from "./solvers/frontalSolver.js";
import { FEAScriptError } from "./utilities/errors.js";
import { basicLog, debugLog, warnLog } from "./utilities/logging.js";

// Boundary condition types of each model, with the [smallest, largest] count of numbers after the type
// (the Euler-Bernoulli beam conditions are given per node, as an array of conditions)
const boundaryConditionValueCounts = {
  heatConductionScript: { constantTemperature: [1, 1], convection: [2, 2], symmetry: [0, 0] },
  generalFormPDEScript: { constantValue: [1, 1], zeroGradient: [0, 0] },
  frontPropagationScript: { constantValue: [1, 1], zeroGradient: [0, 0] },
  creepingFlowScript: { constantVelocity: [2, 2], stressFree: [0, 0] },
  eulerBernoulliBeamScript: {
    fixed: [0, 0],
    pinned: [0, 0],
    rotationFixed: [0, 0],
    deflection: [0, 1],
    rotation: [0, 1],
    force: [1, 1],
    moment: [1, 1],
    spring: [1, 2],
  },
};

// Coefficient functions of each model: the required ones must be functions, the optional ones may also be numbers
const coefficientFunctionNames = {
  heatConductionScript: { required: [], optional: ["thermalConductivity", "heatSource"] },
  generalFormPDEScript: { required: ["A", "B", "C", "D"], optional: [], nonlinear: ["dDdu"] },
  frontPropagationScript: { required: [], optional: [] },
  creepingFlowScript: { required: [], optional: ["viscosity"] },
  eulerBernoulliBeamScript: { required: ["EI"], optional: [], functions: ["c0", "q"] },
};

// Text of a value in a message: strings in quotes, so that "5" and 5 can be told apart
const describeValue = (value) => (typeof value === "string" ? `"${value}"` : String(value));

// Solver methods of solve() for each model. "jacobi-gpu" runs through solveAsync()
const supportedSolverMethods = {
  heatConductionScript: ["lusolve", "jacobi", "frontal"],
  generalFormPDEScript: ["lusolve", "jacobi", "frontal"],
  frontPropagationScript: ["lusolve", "jacobi", "frontal"],
  creepingFlowScript: ["lusolve"],
  eulerBernoulliBeamScript: ["lusolve", "jacobi"],
};

/**
 * Class to implement finite element analysis in JavaScript
 * @param {string} solverConfig - Parameter specifying the type of solver
 * @param {object} meshConfig - Object containing computational mesh details
 * @param {object} boundaryConditions - Object containing boundary conditions for the finite element analysis
 * @returns {object} An object containifng the solution vector and mesh information
 */
export class FEAScriptModel {
  constructor() {
    this.solverConfig = null;
    this.geometry = null; // The normalized geometry of setGeometry
    this.meshConfig = null; // The mesh configuration of setMeshConfig
    this.mesh = null; // The mesh object: set by setMesh, or generated from the geometry at the first solve
    this.boundaryConditions = {};
    this.solverMethod = "lusolve"; // Default solver method
    this.coefficientFunctions = null; // Add storage for coefficient functions
    warnLog(
      "FEAScript is provided “as is” without any warranty. The authors are not responsible for any damages or losses that may result from using the software. See the license for more details: https://github.com/FEAScript/FEAScript-core/blob/main/LICENSE",
    );
    basicLog("FEAScriptModel instance created");
  }

  /**
   * Method to set the model configuration
   * @param {string} modelConfig - Parameter specifying the type of model
   * @param {object} [options] - Optional additional configuration
   */
  setModelConfig(modelConfig, options = {}) {
    this.solverConfig = modelConfig;

    // Store coefficient functions if provided
    if (options?.coefficientFunctions !== undefined) {
      this.coefficientFunctions = options.coefficientFunctions;
      debugLog("coefficientFunctions set");
    }
    // Flag to solve the PDE with the Newton-Raphson method instead of a direct linear solve
    if (options?.nonlinear !== undefined) {
      this.nonlinear = options.nonlinear;
      debugLog(`nonlinear set to ${this.nonlinear}`);
    }
    // Only update if a value is provided
    if (options?.maxIterations !== undefined) {
      this.maxIterations = options.maxIterations;
      debugLog(`maxIterations set to ${this.maxIterations}`);
    }
    if (options?.tolerance !== undefined) {
      this.tolerance = options.tolerance;
      debugLog(`tolerance set to ${this.tolerance}`);
    }

    debugLog(`solverConfig set to ${modelConfig}`);
  }

  /**
   * Method to set the geometry of the domain, which setMeshConfig then meshes
   * @param {object} geometry - `{ line: length }` (1D, boundaries "left" and "right"), `{ rectangle: [width,
   *  height] }` (boundaries "bottom", "right", "top", "left") or `{ shape, holes, points }`, a
   *  polygon with holes whose boundaries are named, written as a path `{ start, boundaries: [{ name, to }] }`
   *  (see geometry.js). The boundary conditions are keyed by the boundary names
   */
  setGeometry(geometry) {
    this.geometry = readGeometry(geometry);
    this.mesh = null;
    debugLog(`geometry set: ${this.geometry.kind}, boundaries ${this.geometry.boundaryNames.join(", ")}`);
  }

  /**
   * Method to set how the geometry is meshed
   * @param {object} meshConfig - The mesh settings
   * @param {string} [meshConfig.elements="quadrilaterals"] - "quadrilaterals" (a rectangle or a convex
   *  four-sided shape, mapped from a grid) or "triangles" (any shape with holes, by Delaunay refinement)
   * @param {string} [meshConfig.elementOrder="linear"] - "linear" or "quadratic"
   * @param {number|function} [meshConfig.size] - The length of an element side; for triangles also a function
   *  (x, y) of position, for a mesh size that varies
   * @param {number|number[]} [meshConfig.divisions] - Instead of size: the number of elements of a line, or
   *  [nx, ny] along the bottom and the left side of a quadrilateral
   * @param {number} [meshConfig.minAngle=20] - Triangles: the smallest angle of the elements, in degrees
   * @param {number} [meshConfig.maxNodes=100000] - Triangles: the limit on the number of vertices
   */
  setMeshConfig(meshConfig) {
    if (meshConfig && typeof meshConfig === "object") {
      // The forms of FEAScript 0.3, kept for one minor release with a warning
      if (meshConfig.parsedMesh !== undefined) {
        warnLog(
          "setMeshConfig({ parsedMesh }) is deprecated and will be removed in a future version. Use setMesh(mesh).",
        );
        this.setMesh(meshConfig.parsedMesh);
        return;
      }
      if (meshConfig.meshDimension !== undefined || meshConfig.numElementsX !== undefined) {
        const { geometry, meshConfig: newMeshConfig, aliases } = translateOldMeshConfig(meshConfig);
        warnLog(
          `setMeshConfig with meshDimension, numElementsX and maxX is deprecated and will be removed in a future version. Use setGeometry(${JSON.stringify(
            geometry,
          )}) and setMeshConfig(${JSON.stringify(newMeshConfig)}), with the boundaries keyed by name.`,
        );
        this.setGeometry(geometry);
        if (aliases) this.geometry.aliases = aliases;
        this.setMeshConfig(newMeshConfig);
        return;
      }
    }
    this.meshConfig = readMeshConfig(meshConfig);
    this.mesh = null;
    debugLog(`meshConfig set: ${JSON.stringify(this.meshConfig)}`);
  }

  /**
   * Method to set the mesh directly: a mesh imported with importGmshMesh, or generated with
   * generateTriangleMesh or generateQuadrilateralMesh. The geometry and the mesh configuration are not used
   * @param {object} mesh - The mesh object
   */
  setMesh(mesh) {
    this.mesh = readMesh(mesh);
    basicLog(
      `Mesh set: ${this.mesh.nodesXCoordinates.length} nodes, ${this.mesh.nodalNumbering.length} ${
        this.mesh.elementOrder
      } elements, boundaries ${Object.keys(this.mesh.boundaryElements).join(", ")}`,
    );
  }

  /**
   * Method to get the mesh object of the model, generating it from the geometry and the mesh configuration at
   * the first call
   * @returns {object} The mesh object
   * @throws {FEAScriptError} INVALID_INPUT when no mesh can be made
   */
  getMesh() {
    if (this.mesh) return this.mesh;
    if (!this.geometry || !this.meshConfig) {
      throw new FEAScriptError(
        "INVALID_INPUT",
        "No mesh is set. Call setGeometry() and setMeshConfig(), or setMesh() with an imported or generated mesh.",
      );
    }
    this.mesh = generateMesh(this.geometry, this.meshConfig);
    return this.mesh;
  }

  /**
   * Method to get the dimension of the mesh, "1D" or "2D", or null when no mesh is set
   * @returns {string|null}
   */
  getMeshDimension() {
    return this.mesh?.meshDimension ?? this.geometry?.meshDimension ?? null;
  }

  /**
   * Method to get the boundary conditions keyed by the boundary names of the mesh, with the deprecated numeric
   * keys of FEAScript 0.3 (and the Gmsh tags minus one) mapped to the names, with a warning
   * @param {object} meshData - The prepared mesh
   * @returns {object} The boundary conditions by boundary name
   */
  resolveBoundaryConditions(meshData) {
    if (this.solverConfig === "eulerBernoulliBeamScript") return this.boundaryConditions;
    const resolved = {};
    Object.entries(this.boundaryConditions).forEach(([key, condition]) => {
      const name = meshData.boundaryElements[key] !== undefined ? key : meshData.aliases[key];
      if (name !== undefined && name !== key) {
        warnLog(
          `Boundary key "${key}" is deprecated and will be removed in a future version; use the boundary name "${name}".`,
        );
      }
      resolved[name ?? key] = condition;
    });
    return resolved;
  }

  addBoundaryCondition(boundaryKey, condition) {
    // A condition without parameters may be given as a plain string, e.g. "zeroGradient" instead of ["zeroGradient"]
    if (typeof condition === "string") {
      warnLog(
        `Boundary condition for boundary ${boundaryKey} should be an array: use ["${condition}"] instead of "${condition}".`,
      );
      condition = [condition];
    }
    if (!Array.isArray(condition)) {
      throw new FEAScriptError(
        "INVALID_INPUT",
        `Boundary condition for boundary ${boundaryKey} must be an array with the condition type first, e.g. ["constantValue", 0]; got ${describeValue(
          condition,
        )}.`,
      );
    }

    // Normalize deprecated boundary condition type strings and emit deprecation warnings
    const deprecatedBoundaryConditionTypes = {
      constantTemp: "constantTemperature",
    };
    const originalType = condition[0];
    if (Object.prototype.hasOwnProperty.call(deprecatedBoundaryConditionTypes, originalType)) {
      const normalizedType = deprecatedBoundaryConditionTypes[originalType];
      warnLog(
        `Boundary condition type "${originalType}" is deprecated and will be removed in a future version. ` +
          `Use "${normalizedType}" instead.`,
      );
      condition = [normalizedType, ...condition.slice(1)];
    }
    this.boundaryConditions[boundaryKey] = condition;
    debugLog(`boundaryConditions added for boundary: ${boundaryKey}, type: ${condition[0]}`);
  }

  /**
   * Method to stop a solve with a solver method that the selected model cannot use
   * @throws {FEAScriptError} If the combination is not supported
   */
  validateSolverMethod() {
    const { solverConfig, solverMethod, nonlinear } = this;
    const supported = supportedSolverMethods[solverConfig]?.includes(solverMethod) ?? true;
    if (supported) return;
    const asyncHint = solverMethod === "jacobi-gpu" ? " Use solveAsync() for it" : "";
    throw new FEAScriptError(
      "UNSUPPORTED_SOLVER",
      `Solver method "${solverMethod}" is not supported for ${
        nonlinear ? "nonlinear " : ""
      }${solverConfig}.${asyncHint}`,
    );
  }

  /**
   * Method to check the model input that does not depend on the mesh, before anything is computed. Every
   * problem found is reported at once, in one error
   * @throws {FEAScriptError} INVALID_INPUT, listing each problem
   */
  validateModel() {
    const problems = [];
    const supportedModels = Object.keys(boundaryConditionValueCounts);
    if (!this.solverConfig) {
      problems.push(
        `No model is set. Call setModelConfig() first, with one of: ${supportedModels.join(", ")}.`,
      );
    } else if (!supportedModels.includes(this.solverConfig)) {
      problems.push(`Unknown model "${this.solverConfig}". Supported models: ${supportedModels.join(", ")}.`);
    }
    if (!this.mesh && !(this.geometry && this.meshConfig)) {
      problems.push(
        "No mesh is set. Call setGeometry() and setMeshConfig(), or setMesh() with an imported or generated mesh.",
      );
    }
    if (supportedModels.includes(this.solverConfig)) {
      problems.push(...this.findBoundaryConditionProblems(), ...this.findCoefficientFunctionProblems());
    }
    FEAScriptError.throwIfAny("INVALID_INPUT", problems);
  }

  /**
   * Method to find boundary conditions with a type that the selected model does not recognize, or with missing
   * or non-numeric values (an unrecognized condition would otherwise be ignored, and a missing value gives NaN)
   * @returns {string[]} The problems found
   */
  findBoundaryConditionProblems() {
    const problems = [];
    const valueCounts = boundaryConditionValueCounts[this.solverConfig];
    const supportedTypes = Object.keys(valueCounts).join(", ");

    const checkCondition = (condition, place) => {
      const [type, ...values] = condition;
      if (!Object.prototype.hasOwnProperty.call(valueCounts, type)) {
        problems.push(
          `Unknown boundary condition type ${describeValue(type)} on ${place} for ${
            this.solverConfig
          }. Supported types: ${supportedTypes}.`,
        );
        return;
      }
      const [smallestCount, largestCount] = valueCounts[type];
      if (values.length < smallestCount) {
        problems.push(
          `Boundary condition "${type}" on ${place} needs ${smallestCount} number${
            smallestCount > 1 ? "s" : ""
          } after the type; got ${values.length}.`,
        );
      }
      values.slice(0, largestCount).forEach((value, valueIndex) => {
        if (typeof value !== "number" || !Number.isFinite(value)) {
          problems.push(
            `Value ${
              valueIndex + 1
            } of boundary condition "${type}" on ${place} must be a finite number; got ${describeValue(
              value,
            )}.`,
          );
        }
      });
    };

    Object.entries(this.boundaryConditions).forEach(([key, condition]) => {
      if (this.solverConfig === "eulerBernoulliBeamScript") {
        if (!condition.every(Array.isArray)) {
          problems.push(
            `Boundary conditions of node ${key} must be an array of conditions, e.g. [["fixed"]] or [["pinned"], ["moment", 1250]].`,
          );
          return;
        }
        condition.forEach((nodeCondition) => checkCondition(nodeCondition, `node ${key}`));
      } else {
        checkCondition(condition, `boundary ${key}`);
      }
    });
    return problems;
  }

  /**
   * Method to find missing coefficient functions, coefficients of the wrong type, and coefficient names that the
   * model does not use (e.g. a misspelled one, which would otherwise leave the default value in place)
   * @returns {string[]} The problems found
   */
  findCoefficientFunctionProblems() {
    const problems = [];
    const {
      required,
      optional,
      nonlinear = [],
      functions = [],
    } = coefficientFunctionNames[this.solverConfig];
    const requiredFunctions = this.nonlinear ? [...required, ...nonlinear] : required;
    const coefficientFunctions = this.coefficientFunctions ?? {};

    requiredFunctions.forEach((name) => {
      if (typeof coefficientFunctions[name] !== "function") {
        problems.push(
          `${
            this.solverConfig
          } needs the coefficient function ${name}, e.g. coefficientFunctions: { ${name}: (x) => 1 }; got ${describeValue(
            coefficientFunctions[name],
          )}.`,
        );
      }
    });
    functions.forEach((name) => {
      const value = coefficientFunctions[name];
      if (value !== undefined && typeof value !== "function") {
        problems.push(`Coefficient ${name} must be a function of x; got ${describeValue(value)}.`);
      }
    });
    optional.forEach((name) => {
      const value = coefficientFunctions[name];
      const isNumber = typeof value === "number" && Number.isFinite(value);
      if (value !== undefined && !isNumber && typeof value !== "function") {
        problems.push(
          `Coefficient ${name} must be a finite number or a function; got ${describeValue(value)}.`,
        );
      }
    });

    const knownNames = [...required, ...optional, ...nonlinear, ...functions];
    const unknownNames = Object.keys(coefficientFunctions).filter((name) => !knownNames.includes(name));
    const modelCoefficients =
      knownNames.length > 0
        ? `Coefficients of this model: ${knownNames.join(", ")}.`
        : "This model has no coefficients.";
    unknownNames.forEach((name) => {
      problems.push(`Coefficient ${name} is not used by ${this.solverConfig}. ${modelCoefficients}`);
    });
    return problems;
  }

  /**
   * Method to check that every boundary condition refers to a boundary (or, for the Euler-Bernoulli beam, a node)
   * of the mesh, and is not on an imported boundary that is incomplete. A condition on a boundary that does not
   * exist would otherwise stop the solve with a TypeError, and one on an incomplete boundary would apply to only
   * part of it
   * @param {object} meshData - Object containing the prepared mesh data
   * @throws {FEAScriptError} INVALID_INPUT, listing each such condition
   */
  validateBoundaries(meshData, boundaryConditions = this.boundaryConditions) {
    const problems = [];
    if (this.solverConfig === "eulerBernoulliBeamScript") {
      const totalNodes = meshData.totalNodesX;
      Object.keys(boundaryConditions).forEach((nodeKey) => {
        const nodeNumber = Number(nodeKey);
        if (!Number.isInteger(nodeNumber) || nodeNumber < 1 || nodeNumber > totalNodes) {
          problems.push(`Node ${nodeKey} does not exist; the beam mesh has nodes 1 to ${totalNodes}.`);
        }
      });
    } else {
      const boundaryElements = meshData.boundaryElements ?? {};
      const meshBoundaries = Object.keys(boundaryElements).map((name) => `"${name}"`);
      const incompleteBoundaries = meshData.incompleteBoundaries ?? {};
      Object.keys(boundaryConditions).forEach((boundaryKey) => {
        const incomplete = incompleteBoundaries[boundaryKey];
        if (incomplete) {
          problems.push(
            `Boundary "${boundaryKey}" of the imported mesh is incomplete: ${
              incomplete.missingPairs
            } of its node pair${
              incomplete.missingPairs > 1 ? "s are" : " is"
            } not on an element side, so its condition would apply to only part of it. Check the physical group of tag ${
              incomplete.tag
            } in the Gmsh file.`,
          );
        }
        if (!Array.isArray(boundaryElements[boundaryKey])) {
          problems.push(
            `Boundary "${boundaryKey}" does not exist in the mesh. Boundaries of the mesh: ${meshBoundaries.join(
              ", ",
            )}.`,
          );
        }
      });
    }
    FEAScriptError.throwIfAny("INVALID_INPUT", problems);
  }

  /**
   * Method to stop a solve whose solution contains NaN or infinite values, e.g. from a coefficient function that
   * returns NaN for some x, instead of returning it
   * @param {Float64Array} solutionVector - The solution vector
   * @throws {FEAScriptError} NON_FINITE_VALUES
   */
  validateSolution(solutionVector) {
    const entryIndex = solutionVector.findIndex((value) => !Number.isFinite(value));
    if (entryIndex === -1) return;
    throw new FEAScriptError(
      "NON_FINITE_VALUES",
      `The solution contains NaN or infinite values (first at entry ${entryIndex} of ${solutionVector.length}). Check that the coefficient functions return finite numbers over the whole domain.`,
    );
  }

  setSolverMethod(solverMethod) {
    this.solverMethod = solverMethod;
    debugLog(`solverMethod set to: ${solverMethod}`);
  }

  /**
   * Method to solve the finite element problem synchronously
   * @param {object} [options] - Additional parameters for the solver, such as `maxIterations` and `tolerance`
   * @returns {object} An object containing the solution vector (Float64Array, the same for every solver method) and mesh information.
   *  Models with more than one unknown per node (creeping flow, Euler-Bernoulli beam) also return `fields`, an object of
   *  named nodal fields (one value per mesh node) that can be plotted directly, e.g. `plotSolution(model, result, "contour", id, { field: "u" })`
   */
  solve(options = {}) {
    this.validateModel();
    this.validateSolverMethod();
    /**
     * For consistency across both linear and nonlinear formulations,
     * we always refer to the assembled right-hand side vector as
     * `residualVector` and the assembled system matrix as `jacobianMatrix`.
     *
     * In linear problems `jacobianMatrix` is equivalent to the
     * classic stiffness/conductivity matrix and `residualVector`
     * corresponds to the traditional load (RHS) vector.
     */

    let jacobianMatrix = [];
    let residualVector = [];
    let solutionVector = new Float64Array(0);
    let initialSolution = [];
    let fields = null; // Named nodal fields, for models with more than one unknown per node

    // Prepare the mesh
    basicLog("Preparing mesh...");
    const meshData = prepareMesh(this);
    const boundaryConditions = this.resolveBoundaryConditions(meshData);
    this.validateBoundaries(meshData, boundaryConditions);
    basicLog("Mesh preparation completed");

    // Extract node coordinates and nodal numbering from meshData
    const nodesCoordinates = {
      nodesXCoordinates: meshData.nodesXCoordinates,
      nodesYCoordinates: meshData.nodesYCoordinates,
    };

    // Select and execute the appropriate solver based on solverConfig
    basicLog("Beginning solving process...");
    console.time("totalSolvingTime");
    basicLog(`Using solver ${this.solverConfig}`);
    if (this.solverConfig === "heatConductionScript") {
      // Check if using frontal solver
      if (this.solverMethod === "frontal") {
        const thermalBoundaryConditions = new ThermalBoundaryConditions(
          boundaryConditions,
          meshData.boundaryElements,
          meshData.nop,
          meshData.meshDimension,
          meshData.elementOrder,
          meshData.elementShape,
        );
        const frontalResult = runFrontalSolver(
          (elementArgs) =>
            assembleHeatConductionFront({
              ...elementArgs,
              coefficientFunctions: this.coefficientFunctions,
            }),
          meshData,
          thermalBoundaryConditions,
        );
        solutionVector = frontalResult.solutionVector;
      } else {
        // Use regular linear solver methods
        ({ jacobianMatrix, residualVector } = assembleHeatConductionMat(
          meshData,
          boundaryConditions,
          this.coefficientFunctions,
        ));
        const linearSystemResult = solveLinearSystem(this.solverMethod, jacobianMatrix, residualVector, {
          maxIterations: options.maxIterations ?? this.maxIterations,
          tolerance: options.tolerance ?? this.tolerance,
        });
        solutionVector = linearSystemResult.solutionVector;
      }
    } else if (this.solverConfig === "frontPropagationScript") {
      // Initialize eikonalActivationFlag
      let eikonalActivationFlag = 0; // TODO: make activationFlag a generic variable (not only for eikonal)
      const eikonalExteralIterations = 5; // Number of incremental steps for the eikonal equation

      // Create context object with all necessary properties
      const context = {
        meshData: meshData,
        boundaryConditions: boundaryConditions,
        eikonalActivationFlag: eikonalActivationFlag,
        solverMethod: this.solverMethod,
        initialSolution,
        // TODO: Consider using different maxIterations/tolerance for Newton-Raphson and linear solver
        maxIterations: options.maxIterations ?? this.maxIterations,
        tolerance: options.tolerance ?? this.tolerance,
        // Used only by the frontal solver
        assembleFront: (elementArgs) =>
          assembleFrontPropagationFront({
            ...elementArgs,
            eikonalActivationFlag: context.eikonalActivationFlag,
          }),
        boundaryConditionsHandler: new GenericBoundaryConditions(
          boundaryConditions,
          meshData.boundaryElements,
          meshData.nop,
          meshData.meshDimension,
          meshData.elementOrder,
          meshData.elementShape,
        ),
      };

      // Count the incremental steps with an integer, so that the last step activates the eikonal equation
      // exactly (accumulating 1 / eikonalExteralIterations can overshoot 1 and skip it)
      for (let stepIndex = 0; stepIndex <= eikonalExteralIterations; stepIndex++) {
        eikonalActivationFlag = stepIndex / eikonalExteralIterations;

        // Update the context object with current eikonalActivationFlag
        context.eikonalActivationFlag = eikonalActivationFlag;

        // Pass the previous solution as initial guess
        if (solutionVector.length > 0) {
          context.initialSolution = [...solutionVector];
        }

        // Solve the assembled non-linear system
        const newtonRaphsonResult = newtonRaphson(assembleFrontPropagationMat, context);

        // Extract results
        jacobianMatrix = newtonRaphsonResult.jacobianMatrix;
        residualVector = newtonRaphsonResult.residualVector;
        solutionVector = newtonRaphsonResult.solutionVector;

        // Stop at the first step that does not converge, instead of continuing from a wrong solution
        if (!newtonRaphsonResult.converged) {
          throw new FEAScriptError(
            "NOT_CONVERGED",
            `Front propagation did not converge at eikonal activation ${eikonalActivationFlag} (step ${stepIndex} of ${eikonalExteralIterations}). The solution is not valid; a finer mesh may be required.`,
          );
        }
      }
    } else if (this.solverConfig === "generalFormPDEScript") {
      // Check if using frontal solver for the linear PDE (the nonlinear PDE uses it inside Newton-Raphson)
      if (this.solverMethod === "frontal" && !this.nonlinear) {
        const genericBoundaryConditions = new GenericBoundaryConditions(
          boundaryConditions,
          meshData.boundaryElements,
          meshData.nop,
          meshData.meshDimension,
          meshData.elementOrder,
          meshData.elementShape,
        );
        const frontalResult = runFrontalSolver(
          (elementArgs) =>
            assembleGeneralFormPDEFront({
              ...elementArgs,
              coefficientFunctions: this.coefficientFunctions,
            }),
          meshData,
          genericBoundaryConditions,
        );
        solutionVector = frontalResult.solutionVector;
      } else if (this.nonlinear) {
        // Solve the nonlinear PDE with the Newton-Raphson method
        const context = {
          meshData,
          boundaryConditions: boundaryConditions,
          solverMethod: this.solverMethod,
          maxIterations: options.maxIterations ?? this.maxIterations,
          tolerance: options.tolerance ?? this.tolerance,
          // Used only by the frontal solver
          assembleFront: (elementArgs) =>
            assembleGeneralFormPDENonlinearFront({
              ...elementArgs,
              coefficientFunctions: this.coefficientFunctions,
            }),
          boundaryConditionsHandler: new GenericBoundaryConditions(
            boundaryConditions,
            meshData.boundaryElements,
            meshData.nop,
            meshData.meshDimension,
            meshData.elementOrder,
            meshData.elementShape,
          ),
        };

        const newtonRaphsonResult = newtonRaphson(
          (meshDataArg, boundaryConditionsArg, solutionVectorArg) =>
            assembleGeneralFormPDENonlinearMat(
              meshDataArg,
              boundaryConditionsArg,
              this.coefficientFunctions,
              solutionVectorArg,
            ),
          context,
        );

        if (!newtonRaphsonResult.converged) {
          throw new FEAScriptError(
            "NOT_CONVERGED",
            `Nonlinear general form PDE did not converge after ${newtonRaphsonResult.iterations} iterations`,
          );
        }

        jacobianMatrix = newtonRaphsonResult.jacobianMatrix;
        residualVector = newtonRaphsonResult.residualVector;
        solutionVector = newtonRaphsonResult.solutionVector;
      } else {
        // Use regular linear solver methods
        ({ jacobianMatrix, residualVector } = assembleGeneralFormPDEMat(
          meshData,
          boundaryConditions,
          this.coefficientFunctions,
        ));

        const linearSystemResult = solveLinearSystem(this.solverMethod, jacobianMatrix, residualVector, {
          maxIterations: options.maxIterations ?? this.maxIterations,
          tolerance: options.tolerance ?? this.tolerance,
        });
        solutionVector = linearSystemResult.solutionVector;
      }
    } else if (this.solverConfig === "creepingFlowScript") {
      // Use regular linear solver methods for steady creeping flow
      const creepingFlowResult = assembleCreepingFlowMatrix(
        meshData,
        boundaryConditions,
        this.coefficientFunctions,
      );
      jacobianMatrix = creepingFlowResult.jacobianMatrix;
      residualVector = creepingFlowResult.residualVector;

      // The pressure rows of the saddle-point matrix have zeros on the diagonal. The LU decomposition fills in
      // much less with a column ordering of AᵀA and a small pivoting threshold (3 to 4 times faster)
      const linearSystemResult = solveLinearSystem(this.solverMethod, jacobianMatrix, residualVector, {
        maxIterations: options.maxIterations ?? this.maxIterations,
        tolerance: options.tolerance ?? this.tolerance,
        ordering: 3,
        pivotThreshold: 0.001,
      });
      solutionVector = linearSystemResult.solutionVector;

      // Split the solution vector into velocity and pressure fields
      fields = extractCreepingFlowFields(solutionVector, meshData, creepingFlowResult.pressureNodeIndices);
    } else if (this.solverConfig === "eulerBernoulliBeamScript") {
      // Use regular linear solver methods for the 1D Euler-Bernoulli beam model
      const beamResult = assembleEulerBernoulliBeamMat(
        meshData,
        boundaryConditions,
        this.coefficientFunctions,
      );
      jacobianMatrix = beamResult.jacobianMatrix;
      residualVector = beamResult.residualVector;

      const linearSystemResult = solveLinearSystem(this.solverMethod, jacobianMatrix, residualVector, {
        maxIterations: options.maxIterations ?? this.maxIterations,
        tolerance: options.tolerance ?? this.tolerance,
      });
      solutionVector = linearSystemResult.solutionVector;

      // Split the solution vector into deflection and rotation fields (2 DOFs per node)
      fields = extractEulerBernoulliBeamFields(solutionVector, beamResult.dofsPerNode);
    }

    console.timeEnd("totalSolvingTime");
    this.validateSolution(solutionVector);
    basicLog("Solving process completed");

    return fields ? { solutionVector, nodesCoordinates, fields } : { solutionVector, nodesCoordinates };
  }

  /**
   * Method to solve the finite element problem asynchronously
   * @param {object} [computeEngine] - An initialized WebGPU compute engine to reuse across solves; when omitted
   *  or null, a temporary one is created for this solve and terminated afterwards. A provided engine is not
   *  terminated, so the caller remains responsible for it
   * @param {object} [options] - Additional parameters for the solver, such as `maxIterations` and `tolerance`
   * @returns {Promise<object>} A promise that resolves to an object containing the solution vector (Float64Array) and the coordinates of the mesh nodes
   */
  async solveAsync(computeEngine, options = {}) {
    this.validateModel();
    const refuse = () =>
      new FEAScriptError(
        "UNSUPPORTED_SOLVER",
        `solveAsync() supports heatConductionScript with "jacobi-gpu", not ${this.solverConfig} with "${this.solverMethod}"`,
      );
    if (this.solverConfig !== "heatConductionScript") throw refuse();

    let jacobianMatrix = [];
    let residualVector = [];
    let solutionVector = new Float64Array(0);

    basicLog("Preparing mesh...");
    const meshData = prepareMesh(this);
    const boundaryConditions = this.resolveBoundaryConditions(meshData);
    this.validateBoundaries(meshData, boundaryConditions);
    basicLog("Mesh preparation completed");
    const nodesCoordinates = {
      nodesXCoordinates: meshData.nodesXCoordinates,
      nodesYCoordinates: meshData.nodesYCoordinates,
    };

    basicLog("Beginning solving process...");
    console.time("totalSolvingTime");

    basicLog(`Using solver: ${this.solverConfig}`);
    if (this.solverConfig === "heatConductionScript") {
      ({ jacobianMatrix, residualVector } = assembleHeatConductionMat(
        meshData,
        boundaryConditions,
        this.coefficientFunctions,
      ));

      if (this.solverMethod !== "jacobi-gpu") {
        console.timeEnd("totalSolvingTime");
        throw refuse();
      }

      const { solutionVector: x } = await solveLinearSystemAsync(
        "jacobi-gpu",
        jacobianMatrix,
        residualVector,
        {
          computeEngine,
          maxIterations: options.maxIterations ?? this.maxIterations,
          tolerance: options.tolerance ?? this.tolerance,
        },
      );
      solutionVector = x;
    }
    console.timeEnd("totalSolvingTime");
    this.validateSolution(solutionVector);
    basicLog("Solving process completed");

    return { solutionVector, nodesCoordinates };
  }
}
