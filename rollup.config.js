import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import wasm from "rollup-plugin-wasm";

export default {
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
  plugins: [
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
  ],
  external: [],
};
