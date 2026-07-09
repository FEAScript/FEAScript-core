/**
 * Test runner — discovers and executes every *.test.js file under tests/.
 * Add a new test file anywhere in this tree and it runs automatically.
 *
 * Usage: node tests/run-all-tests.js
 */

import { readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { basicLog, errorLog, warnLog } from "../src/utilities/logging.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function collectTestFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectTestFiles(fullPath));
    } else if (entry.endsWith(".test.js")) {
      files.push(fullPath);
    }
  }
  return files;
}

const testFiles = collectTestFiles(__dirname);

if (testFiles.length === 0) {
  warnLog("No test files found.");
  process.exit(0);
}

basicLog(`Found ${testFiles.length} test file(s).`);
basicLog("");

let passed = 0;
let failed = 0;

for (const file of testFiles) {
  const label = relative(__dirname, file);
  const result = spawnSync(process.execPath, [file], { stdio: "inherit" });
  if (result.status === 0) {
    passed++;
  } else {
    errorLog(`FAILED: ${label}`);
    basicLog("");
    failed++;
  }
}

if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
process.exit(failed > 0 ? 1 : 0);
