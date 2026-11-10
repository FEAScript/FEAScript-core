# NOTICE

FEAScript
Copyright (c) 2023-2026 FEAScript

FEAScript makes use of the following third-party software:

1. **Comlink**
   - License: Apache 2.0 (https://github.com/GoogleChromeLabs/comlink/blob/main/LICENSE)
   - Source: https://github.com/GoogleChromeLabs/comlink
   - Included in `src/vendor/comlink.mjs` and bundled in `dist/`

2. **Constrainautor**
   - License: ISC (https://github.com/kninnug/Constrainautor/blob/master/LICENSE)
   - Source: https://github.com/kninnug/Constrainautor
   - Bundled in `dist/`, for the triangle mesh generator

3. **Delaunator**
   - License: ISC (https://github.com/mapbox/delaunator/blob/main/LICENSE)
   - Source: https://github.com/mapbox/delaunator
   - Bundled in `dist/`, for the triangle mesh generator

4. **math.js**
   - License: Apache 2.0 (https://github.com/josdejong/mathjs/blob/develop/LICENSE)
   - Source: https://github.com/josdejong/mathjs
   - Bundled in `dist/` (only the parts used by the sparse LU solver), together with its dependencies, all under the MIT license: complex.js, decimal.js, tiny-emitter, typed-function and @babel/runtime

5. **plotly.js**
   - License: MIT (https://github.com/plotly/plotly.js/blob/master/LICENSE)
   - Source: https://github.com/plotly/plotly.js
   - Optional peer dependency, loaded by the user; not bundled

6. **robust-predicates**
   - License: Unlicense (https://github.com/mourner/robust-predicates/blob/main/LICENSE)
   - Source: https://github.com/mourner/robust-predicates
   - Bundled in `dist/`, for the triangle mesh generator; a port of the geometric predicates of Jonathan Richard Shewchuk

7. **stdlib-js**
   - License: Apache 2.0 (https://github.com/stdlib-js/stdlib/blob/develop/LICENSE)
   - Source: https://github.com/stdlib-js/stdlib
   - The `@stdlib/blas-base-*` packages and their dependencies are bundled in `dist/`

8. **taichi.js**
   - License: MIT (https://github.com/AmesingFlank/taichi.js/blob/main/LICENSE)
   - Source: https://github.com/AmesingFlank/taichi.js
   - Included in `src/vendor/taichi.esm.js`, which also contains the TypeScript compiler (Apache 2.0, Copyright Microsoft Corporation, https://github.com/microsoft/TypeScript)

9. **vtk.js**
   - License: BSD 3-Clause (https://github.com/Kitware/vtk-js/blob/master/LICENSE)
   - Source: https://github.com/Kitware/vtk-js
   - Optional peer dependency, loaded by the user; not bundled
