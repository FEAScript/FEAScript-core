// 2D rectangle with a circular hole: 4 m (width) x 2 m (height), hole of radius 0.5 m at (2, 1)
// Generate the quadratic mesh with:
//   gmsh rect_with_hole.geo -2 -format msh41 -o rect_with_hole_quad_quadratic.msh
// and the linear mesh with:
//   gmsh rect_with_hole.geo -2 -format msh41 -setnumber order 1 -setnumber lc 0.045 -o rect_with_hole_quad_linear.msh

// 1. Mesh size and element order (both can be changed with -setnumber on the command line)
DefineConstant[ lc = 0.45, order = 2 ]; // Characteristic length, element order (1 linear, 2 quadratic)

// 2. Points (x, y, z, mesh size)
Point(1) = {0, 0, 0, lc};   // Bottom left
Point(2) = {4, 0, 0, lc};   // Bottom right
Point(3) = {4, 2, 0, lc};   // Top right
Point(4) = {0, 2, 0, lc};   // Top left
Point(5) = {2, 1, 0, lc};   // Hole centre
Point(6) = {2.5, 1, 0, lc}; // Hole, right
Point(7) = {2, 1.5, 0, lc}; // Hole, top
Point(8) = {1.5, 1, 0, lc}; // Hole, left
Point(9) = {2, 0.5, 0, lc}; // Hole, bottom

// 3. Lines, arcs and surface
Line(1) = {1, 2};                 // Bottom
Line(2) = {2, 3};                 // Right
Line(3) = {3, 4};                 // Top
Line(4) = {4, 1};                 // Left
Circle(5) = {6, 5, 7};            // Hole, quarter arcs
Circle(6) = {7, 5, 8};
Circle(7) = {8, 5, 9};
Circle(8) = {9, 5, 6};
Line Loop(1) = {1, 2, 3, 4};      // Outer boundary
Line Loop(2) = {5, 6, 7, 8};      // Hole
Plane Surface(1) = {1, 2};        // Domain

// 4. Physical groups: FEAScript keys the boundary conditions by these names
Physical Line("bottom", 1) = {1};          // FEAScript boundary "bottom"
Physical Line("left", 2)   = {4};          // FEAScript boundary "left"
Physical Line("top", 3)    = {3};          // FEAScript boundary "top"
Physical Line("right", 4)  = {2};          // FEAScript boundary "right"
Physical Line("hole", 5)   = {5, 6, 7, 8}; // FEAScript boundary "hole"
Physical Surface("domain", 6) = {1};       // Domain

// 5. Mesh
Recombine Surface{1};      // Quadrilaterals instead of triangles
Mesh.ElementOrder = order; // Element order
