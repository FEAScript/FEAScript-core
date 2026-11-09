<img src="https://feascript.github.io/FEAScript-website/assets/feascript-logo.png" width="80" alt="FEAScript logo">

# UMD Test — Loading FEAScript with a Script Tag

## Purpose

This test checks the UMD build, `dist/feascript.umd.js`, in a browser. The UMD build lets a page load FEAScript
with a classic `<script>` tag, as Plotly is loaded, with no import map and no `type="module"`:

```html
<script src="https://cdn.jsdelivr.net/npm/feascript@0.4.0/dist/feascript.umd.js"></script>
<script>
  const { FEAScriptModel, plotSolution } = FEAScript;
</script>
```

It guards the parts that only break in a real browser: the `FEAScript` global, and the web workers, which must
find their files next to the bundle and not next to the page. The page sits in `tests/umd/`, away from `dist/`,
so a worker that looked beside the page would fail here.

## Checks

| Check                            | What it shows                                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `window.FEAScript` is defined    | The bundle runs as a classic script and exposes its exports on the global `FEAScript`                                        |
| Main-thread solve                | The 1D wall of `examples/heatConductionScript/heatConduction1DWall` solves with `lusolve` (T = 5 °C on the right)            |
| Plotly plot                      | `plotSolution` draws with the Plotly global                                                                                  |
| Worker solve matches main thread | `FEAScriptWorker` loads `dist/feascript-worker.esm.js` beside the bundle and gives the same solution                         |
| WebGPU solve matches LU          | `jacobi-gpu` loads its worker from `src/workers/` beside `dist/` and matches `lusolve` within `1e-3`, or SKIP without WebGPU |

The WebGPU check uses 4 elements with both temperatures fixed and a tolerance of `1e-3`. The GPU solver uses
32-bit floats and plain Jacobi, which converges slowly on the 10-element wall, whose convection node is weakly
coupled.

## How to run

The test page is [`umd.test.html`](umd.test.html). It is not part of `npm test`, which runs in Node.js.

### Automatically, in headless browsers

From the repository root:

```bash
npm run test:browser
```

This builds the bundles, then [`runBrowserTests.js`](runBrowserTests.js) serves the repository root and opens the
page in headless Chromium and Firefox with [Playwright](https://playwright.dev/) (a dev dependency). It prints
each check per browser, ends with `All browsers passed.` or `At least one browser failed.`, and exits with code
1 on a failure. Chromium runs on its software GPU (SwiftShader), so the WebGPU check runs; Firefox reports it
as SKIP. On a new machine, download the browsers once with `npx playwright install chromium firefox`.

Playwright is pinned to 1.61, the last version that runs on Node.js 18, which the core still supports.

### By hand, in your own browser

Build, serve the repository root with any static server and open the page:

```bash
npm run build
npx http-server . -p 8080
```

```
http://127.0.0.1:8080/tests/umd/umd.test.html
```

A passing run lists `PASS:` lines and sets the page title to `PASS`; a failing one shows `FAIL:` lines in red
and sets the title to `FAIL`. The same lines are printed to the console.

The WebGPU check needs a browser with WebGPU and a GPU adapter. Without them it reports SKIP, which counts as a
pass. Chrome on Linux, for example, has no adapter with its default settings; turn on "Unsafe WebGPU Support"
and "Vulkan" in `chrome://flags` to run it on the GPU.

## When to run it

| Situation                                                 | Action                                                                            |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Before a release                                          | `npm run test:browser`; every line must pass.                                     |
| After a release                                           | Point the script tag of the page at the jsDelivr URL and open it in your browser. |
| A change to `rollup.config.js` or to how the workers load | `npm run test:browser`.                                                           |
| A new export that script-tag users need                   | Add a check for it to `umd.test.html`.                                            |
