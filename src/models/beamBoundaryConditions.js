/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Lightweight Finite Element Simulation in JavaScript
 *  Version: 0.3.0 (RC) | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

// Internal imports
import { basicLog, debugLog, errorLog } from "../utilities/logging.js";

/**
 * Class to handle boundary conditions for the 1D Euler-Bernoulli beam model
 *
 * Unlike the side-based boundary conditions used by the scalar 1D/2D models
 * (which only tag the two ends of a 1D domain as boundary "0" and "1"),
 * beam problems routinely carry essential and natural conditions at interior
 * nodes as well (e.g. an intermediate roller support, or a point load applied
 * partway along the beam). For this reason, `boundaryConditions` here is keyed
 * by the 1-based GLOBAL NODE NUMBER rather than by a domain side, and each key
 * maps to an ARRAY of condition tuples, since a single node routinely carries
 * more than one condition at once (e.g. a spring support plus a point load):
 *
 *   boundaryConditions = {
 *     "1": [["fixed"]],                     // clamped: w = 0, theta = 0
 *     "2": [["pinned"], ["moment", 1250]],   // roller + applied moment
 *     "3": [["spring", 200], ["force", -2500]], // elastic support + applied force
 *   };
 *
 * Supported condition types:
 *  - ["fixed"]                       Essential: w = 0 and theta = 0 (clamped/built-in support)
 *  - ["pinned"] / ["deflection", v]  Essential: w = v (default v = 0; roller/pin support)
 *  - ["rotationFixed"] / ["rotation", v]  Essential: theta = v (default v = 0)
 *  - ["force", v]                    Natural: applies a concentrated transverse force v at the node
 *  - ["moment", v]                   Natural: applies a concentrated moment v at the node
 *  - ["spring", k, uRef]             Mixed/Robin: transverse elastic support of stiffness k about
 *                                     reference deflection uRef (default uRef = 0)
 */
export class BeamBoundaryConditions {
  /**
   * Constructor to initialize the BeamBoundaryConditions class
   * @param {object} boundaryConditions - Object containing boundary conditions, keyed by 1-based node number
   * @param {number} totalNodesX - Total number of nodes along the beam
   * @param {number} dofsPerNode - Number of degrees of freedom per node (2: deflection, rotation)
   */
  constructor(boundaryConditions, totalNodesX, dofsPerNode) {
    this.boundaryConditions = boundaryConditions;
    this.totalNodesX = totalNodesX;
    this.dofsPerNode = dofsPerNode;
  }

  /**
   * Function to impose natural (point force/moment) and spring (Robin-type) boundary conditions
   * This must be called BEFORE imposeEssentialBoundaryConditions(), since essential conditions
   * override (zero out) the equation row at a constrained DOF, which must take precedence over
   * any natural/spring contribution assembled at the same DOF
   * @param {array} residualVector - The residual (load) vector to be modified
   * @param {array} jacobianMatrix - The Jacobian (stiffness) matrix to be modified
   */
  imposeNaturalAndSpringBoundaryConditions(residualVector, jacobianMatrix) {
    Object.keys(this.boundaryConditions).forEach((nodeKey) => {
      const globalNodeIndex = Number(nodeKey) - 1; // Convert 1-based node number to 0-based index
      const deflectionDOF = this.dofsPerNode * globalNodeIndex;
      const rotationDOF = deflectionDOF + 1;

      this.boundaryConditions[nodeKey].forEach((condition) => {
        const [conditionType, value1, value2] = condition;

        if (conditionType === "force") {
          residualVector[deflectionDOF] += value1;
          debugLog(`Node ${nodeKey}: Applied point force ${value1} (natural BC)`);
        } else if (conditionType === "moment") {
          residualVector[rotationDOF] += value1;
          debugLog(`Node ${nodeKey}: Applied point moment ${value1} (natural BC)`);
        } else if (conditionType === "spring") {
          const springConstant = value1;
          const referenceDeflection = value2 ?? 0;
          jacobianMatrix[deflectionDOF][deflectionDOF] += springConstant;
          residualVector[deflectionDOF] += springConstant * referenceDeflection;
          debugLog(
            `Node ${nodeKey}: Applied transverse elastic spring, k=${springConstant} (mixed/Robin BC)`,
          );
        }
      });
    });
  }

  /**
   * Function to impose essential (deflection/rotation) boundary conditions (Dirichlet-type)
   * This must be called AFTER imposeNaturalAndSpringBoundaryConditions()
   * @param {array} residualVector - The residual vector to be modified
   * @param {array} jacobianMatrix - The Jacobian matrix to be modified
   */
  imposeEssentialBoundaryConditions(residualVector, jacobianMatrix) {
    const totalDOFs = residualVector.length;

    const applyDirichlet = (dofIndex, prescribedValue) => {
      residualVector[dofIndex] = prescribedValue;
      for (let colIndex = 0; colIndex < totalDOFs; colIndex++) {
        jacobianMatrix[dofIndex][colIndex] = 0;
      }
      jacobianMatrix[dofIndex][dofIndex] = 1;
    };

    Object.keys(this.boundaryConditions).forEach((nodeKey) => {
      const globalNodeIndex = Number(nodeKey) - 1; // Convert 1-based node number to 0-based index
      const deflectionDOF = this.dofsPerNode * globalNodeIndex;
      const rotationDOF = deflectionDOF + 1;

      this.boundaryConditions[nodeKey].forEach((condition) => {
        const [conditionType, value] = condition;

        if (conditionType === "fixed") {
          applyDirichlet(deflectionDOF, 0);
          applyDirichlet(rotationDOF, 0);
          debugLog(`Node ${nodeKey}: Applied fixed (clamped) support: w=0, theta=0 (essential BC)`);
        } else if (conditionType === "pinned" || conditionType === "deflection") {
          applyDirichlet(deflectionDOF, value ?? 0);
          debugLog(`Node ${nodeKey}: Applied deflection w=${value ?? 0} (essential BC)`);
        } else if (conditionType === "rotationFixed" || conditionType === "rotation") {
          applyDirichlet(rotationDOF, value ?? 0);
          debugLog(`Node ${nodeKey}: Applied rotation theta=${value ?? 0} (essential BC)`);
        } else if (
          conditionType !== "force" &&
          conditionType !== "moment" &&
          conditionType !== "spring"
        ) {
          errorLog(`Unknown beam boundary condition type: "${conditionType}"`);
        }
      });
    });
  }
}
