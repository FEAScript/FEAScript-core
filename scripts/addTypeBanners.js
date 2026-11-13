/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Adds the FEAScript banner to the TypeScript declarations that tsc generated, which keeps it only on some
 * files. The banner is copied from src/index.js, so it always carries the version of the source. The vendored
 * libraries (dist/types/vendor/) keep their own headers.
 *
 * Run: node scripts/addTypeBanners.js [folder] (npm run build:types runs it on dist/types)
 */

// External imports
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const folder = process.argv[2] ?? join(root, "dist/types");

const source = readFileSync(join(root, "src/index.js"), "utf8");
const banner = source.slice(0, source.indexOf("*/") + 2);
if (!banner.includes("FEAScript Core Library")) {
  throw new Error("The banner of src/index.js was not found");
}

let added = 0;
for (const entry of readdirSync(folder, { recursive: true })) {
  const file = join(folder, entry);
  if (!/\.d\.m?ts$/.test(file) || relative(folder, file).split(sep)[0] === "vendor") continue;
  const declarations = readFileSync(file, "utf8");
  if (declarations.includes("FEAScript Core Library")) continue;
  writeFileSync(file, `${banner}\n\n${declarations}`);
  added++;
}
console.log(`Added the banner to ${added} declaration files in ${relative(root, folder) || "."}`);
