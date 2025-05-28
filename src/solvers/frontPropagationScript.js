//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

// Internal imports
import { numericalIntegration } from "../methods/numericalIntegrationScript.js";
import { basisFunctions } from "../mesh/basisFunctionsScript.js";
import { meshGeneration } from "../mesh/meshGenerationScript.js";
import { ThermalBoundaryConditions } from "./thermalBoundaryConditionsScript.js";
import { basicLog, debugLog, errorLog } from "../utilities/loggingScript.js";