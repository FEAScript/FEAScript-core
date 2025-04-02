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
export { plotSolution } from "./visualization/plotSolutionScript.js";
export { printVersion, logSystem } from "./utilities/utilitiesScript.js";

// Temporarily commenting out the worker export to avoid CORS issues
// The Web Worker functionality relies on the Comlink library which is currently causing CORS errors:
// - Error: "Loading module from 'https://unpkg.com/comlink/dist/esm/comlink.mjs' was blocked because of a disallowed MIME type ('text/html')"
// - Error: "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource"
//
// export { FEAWorkerScript } from "./FEAWorkerScript.js";
