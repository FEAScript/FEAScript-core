/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.4.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Runs tests/umd/umd.test.html in headless Chromium and Firefox and fails if a check fails. The page cannot run
 * in Node.js (it loads the bundle with a script tag and starts web workers), so this serves the repository root
 * and drives real browsers with Playwright. Chromium gets its software GPU (SwiftShader), so the WebGPU check
 * runs instead of reporting SKIP. The file name does not end in .test.js, so npm test does not pick it up.
 *
 * Run: npm run test:browser (builds first), or node tests/umd/runBrowserTests.js after npm run build
 */

// External imports
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const pagePath = "/tests/umd/umd.test.html";
const pageTimeout = 120000; // Milliseconds. The WebGPU check on a software GPU takes a few seconds

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const browsers = [
  {
    name: "Chromium",
    type: chromium,
    options: {
      args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan", "--use-webgpu-adapter=swiftshader"],
    },
  },
  { name: "Firefox", type: firefox, options: {} },
];

/**
 * Function to serve the repository root, so the page reaches dist/ and src/ at the same paths as on a CDN
 * @returns {Promise<object>} The server and its base URL
 */
function startServer() {
  const server = createServer((request, response) => {
    const urlPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const filePath = normalize(join(root, urlPath));
    if (filePath !== root && !filePath.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
    });
    response.end(readFileSync(filePath));
  });
  return new Promise((resolveServer) =>
    server.listen(0, "127.0.0.1", () =>
      resolveServer({ server, baseUrl: `http://127.0.0.1:${server.address().port}` }),
    ),
  );
}

/**
 * Function to run the page in one browser
 * @param {object} browserSpec - The browser name, its Playwright type and launch options
 * @param {string} url - The URL of the page
 * @returns {Promise<boolean>} Whether every check passed
 */
async function runInBrowser({ name, type, options }, url) {
  console.log(`\n[${name}]`);
  let browser;
  try {
    browser = await type.launch(options);
  } catch (error) {
    console.log(`FAIL: ${name} did not start (${error.message.split("\n")[0]}). Run: npx playwright install`);
    return false;
  }
  try {
    const page = await browser.newPage();
    page.on("pageerror", (error) => console.log(`  page error: ${error.message}`));
    await page.goto(url);
    await page
      .waitForFunction(() => document.title === "PASS" || document.title === "FAIL", null, {
        timeout: pageTimeout,
      })
      .catch(() => {});
    const title = await page.title();
    const lines = await page.$$eval("#results li", (items) => items.map((item) => item.textContent));
    lines.forEach((line) => console.log(line));
    if (title !== "PASS" && title !== "FAIL") {
      console.log(`FAIL: the page did not finish within ${pageTimeout / 1000} s`);
    }
    return title === "PASS";
  } finally {
    await browser.close();
  }
}

if (!existsSync(join(root, "dist/feascript.umd.js"))) {
  console.log("dist/feascript.umd.js is missing. Run npm run build first.");
  process.exit(1);
}

const { server, baseUrl } = await startServer();
let allPassed = true;
try {
  for (const browserSpec of browsers) {
    allPassed = (await runInBrowser(browserSpec, baseUrl + pagePath)) && allPassed;
  }
} finally {
  server.close();
}
console.log(`\n${allPassed ? "All browsers passed." : "At least one browser failed."}`);
process.exit(allPassed ? 0 : 1);
