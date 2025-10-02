//   ______ ______           _____           _       _     //
//  |  ____|  ____|   /\    / ____|         (_)     | |    //
//  | |__  | |__     /  \  | (___   ___ ____ _ ____ | |_   //
//  |  __| |  __|   / /\ \  \___ \ / __|  __| |  _ \| __|  //
//  | |    | |____ / ____ \ ____) | (__| |  | | |_) | |    //
//  |_|    |______/_/    \_\_____/ \___|_|  |_|  __/| |    //
//                                            | |   | |    //
//                                            |_|   | |_   //
//       Website: https://feascript.com/             \__|  //

// Global logging level
let currentLogLevel = "basic";

/**
 * Function to set the logging system level
 * @param {string} level - Logging level (basic, debug)
 */
export function logSystem(level) {
  if (level !== "basic" && level !== "debug") {
    console.log(
      "%c[WARN] Invalid log level: " + level + ". Using basic instead.",
      "color: #FFC107; font-weight: bold;"
    ); // Yellow for warnings
    currentLogLevel = "basic";
  } else {
    currentLogLevel = level;
    basicLog(`Log level set to: ${level}`);
  }
}

/**
 * Function to log debug messages - only logs if level is 'debug'
 * @param {string} message - Message to log
 */
export function debugLog(message) {
  if (currentLogLevel === "debug") {
    console.log("%c[DEBUG] " + message, "color: #2196F3; font-weight: bold;"); // Blue color for debug
  }
}

/**
 * Function to log basic information - always logs
 * @param {string} message - Message to log
 */
export function basicLog(message) {
  console.log("%c[INFO] " + message, "color: #4CAF50; font-weight: bold;"); // Green color for basic info
}

/**
 * Function to log error messages
 * @param {string} message - Message to log
 */
export function errorLog(message) {
  console.log("%c[ERROR] " + message, "color: #F44336; font-weight: bold;"); // Red color for errors
}

/**
 * Function to handle version information and fetch the latest update date and release from GitHub
 */
export async function printVersionInformation() {
  basicLog("Fetching latest FEAScript version information...");
  try {
    const commitResponse = await fetch("https://api.github.com/repos/FEAScript/FEAScript/commits/main");
    const commitData = await commitResponse.json();
    const latestCommitDate = new Date(commitData.commit.committer.date).toLocaleString();
    basicLog(`Latest FEAScript update: ${latestCommitDate}`);
    return latestCommitDate;
  } catch (error) {
    errorLog("Failed to fetch version information: " + error);
    return "Version information unavailable";
  }
}
