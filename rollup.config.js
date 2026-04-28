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
    if (/feascript\.(esm|cjs|umd)\.js$/.test(chunk.fileName)) {
      return {
        code: code.replace('"./wrapper.js"', '"./feascript-worker.esm.js"'),
        map: null,
      };
    }
    return null;
  },
};

const plugins = [
  rewriteWorkerUrl,
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
        file: "dist/feascript.cjs.js",
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
