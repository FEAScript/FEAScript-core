import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";

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
      globals: {
        mathjs: "math",
      },
    },
  ],
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      useTsconfigDeclarationDir: true,
      clean: true,
    }),
    terser(),
  ],
  external: ["mathjs"],
};
