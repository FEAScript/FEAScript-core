/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for the TypeScript declarations of the npm package
 *
 *  - The declarations are generated from the JSDoc of the source without errors (as npm run build:types does,
 *    into a temporary folder instead of dist/types/)
 *  - tests/types/usage.ts, which uses the package as TypeScript code would, type-checks against them in strict
 *    mode, imported as "feascript": every model, the run report, the worker, the mesh generators and the plots
 *  - The mistakes marked @ts-expect-error in usage.ts are caught (an unknown model, solver method, condition
 *    type or parameter, element shape, result property, error code and log level, and the private methods)
 *
 * Run: node tests/unit/types.test.js (or npm test)
 */

import { execFileSync } from "child_process";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { fileURLToPath } from "url";
import { basicLog, errorLog } from "../../src/utilities/logging.js";

basicLog("");
basicLog("================================");
basicLog("Unit tests: TypeScript declarations");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    errorLog(`FAIL: ${message}`);
    failed++;
  } else {
    basicLog(`PASS: ${message}`);
    passed++;
  }
}

// Run the TypeScript compiler of the package, and return its output (empty when it succeeds) and whether it did
const root = fileURLToPath(new URL("../..", import.meta.url));
const tsc = join(root, "node_modules/typescript/bin/tsc");
function runTsc(args) {
  try {
    return { ok: true, output: execFileSync(process.execPath, [tsc, ...args], { encoding: "utf8" }) };
  } catch (error) {
    return { ok: false, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

const folder = mkdtempSync(join(tmpdir(), "feascript-types-"));
try {
  const typesFolder = join(folder, "types");
  const generation = runTsc(["-p", join(root, "tsconfig.types.json"), "--declarationDir", typesFolder]);
  assert(
    generation.ok,
    `The declarations are generated without errors${generation.ok ? "" : `:\n${generation.output}`}`,
  );

  // Check usage.ts as a TypeScript project of a user would, with "feascript" resolved to the declarations
  writeFileSync(
    join(folder, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        lib: ["ES2020", "DOM"],
        paths: { feascript: [join(typesFolder, "index.d.ts")] },
      },
      files: [join(root, "tests/types/usage.ts")],
    }),
  );
  const check = runTsc(["-p", join(folder, "tsconfig.json")]);
  assert(
    check.ok,
    `tests/types/usage.ts type-checks, and every @ts-expect-error mistake is caught${
      check.ok ? "" : `:\n${check.output}`
    }`,
  );
} finally {
  rmSync(folder, { recursive: true, force: true });
}

basicLog("");
if (failed > 0) {
  errorLog(`${passed} passed, ${failed} failed.`);
} else {
  basicLog(`${passed} passed, ${failed} failed.`);
}
basicLog("================================");
if (failed > 0) process.exit(1);
