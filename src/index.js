//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

export { FEAScriptModel } from "./FEAScript.js";
export { importGmshQuadTri } from "./readers/gmshReaderScript.js";
export { logSystem, printVersion } from "./utilities/loggingScript.js";
export { plotSolution } from "./visualization/plotSolutionScript.js";
export { FEAScriptWorker } from "./workers/workerScript.js";
export const VERSION = "0.1.1";