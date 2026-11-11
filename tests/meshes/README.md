<img src="https://feascript.github.io/FEAScript-website/assets/feascript-mesh.png" width="80" alt="FEAScript mesh logo">

# Test Meshes

Gmsh meshes (`.msh` version 4.1, ASCII) shared by the tests, generated from
[`rect.geo`](rect.geo) (rectangle x ∈ [0, 4], y ∈ [0, 2], characteristic length 0.7) and
[`lshape.geo`](lshape.geo) (L-shaped domain, see [below](#l-shaped-domain-meshes)).

Mesh files are named `<geometry>_<element shape>_<element order>.msh`, with element shape
`quad` (quadrilaterals) or `triang` (triangles) and element order `linear` or `quadratic`.

| Mesh file                   | Gmsh element types                  | `elementOrder` |
| --------------------------- | ----------------------------------- | -------------- |
| `rect_quad_linear.msh`      | 4-node quadrilaterals, 2-node lines | `linear`       |
| `rect_quad_quadratic.msh`   | 9-node quadrilaterals, 3-node lines | `quadratic`    |
| `rect_triang_linear.msh`    | 3-node triangles, 2-node lines      | `linear`       |
| `rect_triang_quadratic.msh` | 6-node triangles, 3-node lines      | `quadratic`    |

Physical groups, the same in all `rect` meshes. The boundary conditions are keyed by the name; the tag minus
one is kept as a deprecated alias:

| Physical tag | Name   | Deprecated key |
| ------------ | ------ | -------------- |
| 1            | bottom | 0              |
| 2            | right  | 1              |
| 3            | top    | 2              |
| 4            | left   | 3              |
| 5            | domain | —            |

## Regenerating the meshes

`rect.geo` generates the linear triangle mesh as is. For the other meshes, edit two lines of
`rect.geo` first:

| Mesh file                   | `Recombine Surface{1};` | `Mesh.ElementOrder` |
| --------------------------- | ----------------------- | ------------------- |
| `rect_quad_linear.msh`      | Uncommented             | `1`                 |
| `rect_quad_quadratic.msh`   | Uncommented             | `2`                 |
| `rect_triang_linear.msh`    | Commented               | `1`                 |
| `rect_triang_quadratic.msh` | Commented               | `2`                 |

Then run (Gmsh 4.12.1 was used):

```bash
gmsh rect.geo -save -format msh41 -o <mesh file>
```

`rect_quad_quadratic.msh` has the same nodes and elements as `rect_quad.msh` used by the
[`heatConduction2DFinGmsh.js`](../../examples/heatConductionScript/heatConduction2DFin/heatConduction2DFinGmsh.js) example,
but its physical groups are tagged bottom, right, top, left; the example mesh tags them bottom, left, top, right,
like the sides of FEAScript structured meshes.

## Used by

- [`regression/heatConduction2DFin`](../regression/heatConduction2DFin/README.md)
- [`regression/solidificationFront2D`](../regression/solidificationFront2D/README.md)
- [`regression/lidDrivenCavity2DCreepingFlow`](../regression/lidDrivenCavity2DCreepingFlow/README.md)
- [`verification/analytical/creepingFlow2DCouette`](../verification/analytical/creepingFlow2DCouette/README.md)
- [`verification/analytical/frontPropagation2DPlanarFront`](../verification/analytical/frontPropagation2DPlanarFront/README.md)
- [`unit/plotInterpolation.test.js`](../unit/plotInterpolation.test.js)

## L-shaped domain meshes

[`lshape.geo`](lshape.geo) describes the L-shaped domain of the Code_Aster TPLP01 benchmark: the
square x, y ∈ [0, 0.8] without the quarter x ∈ [0.4, 0.8], y ∈ [0, 0.4]. The characteristic length
is 0.05, refined to 0.01 at the re-entrant corner (0.4, 0.4). The boundary is split, and interior
points are embedded, so that the meshes have nodes at the 13 reference points of TPLP01 (the 0.2 m
grid inside the domain).

| Mesh file                     | Gmsh element types                  | `elementOrder` |
| ----------------------------- | ----------------------------------- | -------------- |
| `lshape_quad_quadratic.msh`   | 9-node quadrilaterals, 3-node lines | `quadratic`    |
| `lshape_triang_quadratic.msh` | 6-node triangles, 3-node lines      | `quadratic`    |

| Physical tag | Name      | Edges            | Boundary key |
| ------------ | --------- | ---------------- | ------------ |
| 1            | left      | x = 0            | 0            |
| 2            | right     | x = 0.8, y ≥ 0.4 | 1            |
| 3            | insulated | all other edges  | 2            |
| 4            | domain    | —                | —            |

`lshape.geo` generates the triangle mesh as is. For the quadrilateral mesh, uncomment
`Recombine Surface{1};` first. Then run (Gmsh 4.12.1 was used):

```bash
gmsh lshape.geo -save -format msh41 -o <mesh file>
```

Used by [`verification/benchmark/heatConduction2DCodeAsterTplp01`](../verification/benchmark/heatConduction2DCodeAsterTplp01/README.md).

## Rectangle with a hole meshes

[`rect_with_hole.geo`](rect_with_hole.geo) describes the domain of the homepage fin example: the rectangle
x ∈ [0, 4], y ∈ [0, 2] without a circular hole of radius 0.5 at (2, 1). The quadratic elements along the hole
have curved edges, which the contour plot test uses to check the point location in curved elements
([#134](https://github.com/FEAScript/FEAScript-core/issues/134)).

| Mesh file                             | Gmsh element types                  | `elementOrder` |
| ------------------------------------- | ----------------------------------- | -------------- |
| `rect_with_hole_quad_quadratic.msh`   | 9-node quadrilaterals, 3-node lines | `quadratic`    |
| `rect_with_hole_triang_quadratic.msh` | 6-node triangles, 3-node lines      | `quadratic`    |

| Physical tag | Name   |
| ------------ | ------ |
| 1            | bottom |
| 2            | left   |
| 3            | top    |
| 4            | right  |
| 5            | hole   |
| 6            | domain |

`rect_with_hole_quad_quadratic.msh` is the same file as the one of the website tutorials. `rect_with_hole.geo`
generates it as is; for the triangle mesh, comment out `Recombine Surface{1};` first. Then run (Gmsh 4.12.1 was
used):

```bash
gmsh rect_with_hole.geo -2 -format msh41 -o <mesh file>
```

Used by [`unit/plotInterpolation.test.js`](../unit/plotInterpolation.test.js).
