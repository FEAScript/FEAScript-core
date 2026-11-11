import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import wasm from "rollup-plugin-wasm";

// Rewrites the worker URL in worker.js so the bundle loads the self-contained
// feascript-worker.esm.js (a sibling of feascript.esm.js in dist/) instead of
// the source wrapper.js. This keeps source-mode loading correct while making
// the bundle work from any host path (CDN or local dev server).
const rewriteWorkerUrl = {
  name: "rewrite-worker-url",
  renderChunk(code, chunk) {
    // Replace the source-relative wrapper.js path with the dist-sibling path so the
    // bundle resolves feascript-worker.esm.js correctly from any host path.
    if (/feascript\.(esm\.js|cjs|umd\.js)$/.test(chunk.fileName)) {
      return {
        code: code.replace('"./wrapper.js"', '"./feascript-worker.esm.js"'),
        map: null,
      };
    }
    return null;
  },
};

// In the UMD bundle, Rollup turns import.meta.url into document.currentScript.src, read where it is used.
// The worker code reads it inside async functions, after the script has run, when currentScript is null and
// the fallback is the page URL, so a CDN-loaded bundle looked for its worker files next to the page. This
// reads the script URL once while the bundle runs (umdScriptUrlIntro, inside the UMD factory so it adds no global)
// and points import.meta.url at it
const umdScriptUrl = {
  name: "umd-script-url",
  resolveImportMeta(property, { format }) {
    if (format === "umd" && property === "url") return "__feascriptScriptUrl";
    return null;
  },
};
const umdScriptUrlIntro =
  'var __feascriptScriptUrl = typeof document !== "undefined" && document.currentScript && ' +
  'document.currentScript.src ? document.currentScript.src : typeof location !== "undefined" ? ' +
  'location.href : typeof __filename !== "undefined" ? "file://" + __filename : "";';

// The inner loop of the mathjs sparse LU (csSpsolve) calls the generic divideScalar, multiply and subtract for every
// entry. In V8 (Node.js, Chromium), once csAmd has called multiply with sparse matrices, these calls are no longer
// inlined, and every LU solve after the first in a process (each Newton-Raphson iteration, each repeated solve) ran 2
// to 3 times slower. FEAScript only gives mathjs matrices of numbers, so plain arithmetic gives the same result, bit
// for bit. Reported to mathjs as josdejong/mathjs#3792; drop this once a mathjs release fixes it
const csSpsolveNumbers = {
  name: "mathjs-csspsolve-numbers",
  transform(code, id) {
    if (!/mathjs[\\/]lib[\\/]esm[\\/]function[\\/]algebra[\\/]sparse[\\/]csSpsolve\.js$/.test(id)) return null;
    const replacements = [
      ["x[j] = divideScalar(x[j], gvalues[lo ? p0 : p1 - 1]);", "x[j] = x[j] / gvalues[lo ? p0 : p1 - 1];"],
      ["x[i] = subtract(x[i], multiply(gvalues[p], x[j]));", "x[i] = x[i] - gvalues[p] * x[j];"],
    ];
    for (const [from, to] of replacements) {
      if (!code.includes(from)) this.error(`mathjs csSpsolve has changed; review the plain-arithmetic patch: ${from}`);
      code = code.replace(from, to);
    }
    return { code, map: null };
  },
};

const plugins = [
  csSpsolveNumbers,
  rewriteWorkerUrl,
  umdScriptUrl,
  resolve({
    browser: true,
    preferBuiltins: false,
  }),
  commonjs(),
  wasm({
    maxFileSize: 14000000,
  }),
  typescript({
    useTsconfigDeclarationDir: true,
    clean: true,
  }),
  terser(),
];

export default [
  // Main library bundle
  {
    input: "src/index.js",
    output: [
      {
        file: "dist/feascript.cjs", // .cjs, since the package is "type": "module"
        format: "cjs",
        sourcemap: true,
      },
      {
        file: "dist/feascript.esm.js",
        format: "esm",
        sourcemap: true,
      },
      {
        file: "dist/feascript.umd.js",
        format: "umd",
        name: "FEAScript",
        intro: umdScriptUrlIntro,
        sourcemap: true,
      },
    ],
    plugins,
    external: (id) => id === "@kitware/vtk.js" || id.startsWith("@kitware/vtk.js/") || id === "plotly.js",
  },
  // Self-contained worker bundle: bundles all bare-specifier deps (mathjs, @stdlib/*)
  // so the worker file has no bare specifiers and works in Firefox, where module
  // workers do not inherit the page's import map.
  {
    input: "src/workers/wrapper.js",
    output: {
      file: "dist/feascript-worker.esm.js",
      format: "esm",
      sourcemap: true,
    },
    plugins,
  },
];
