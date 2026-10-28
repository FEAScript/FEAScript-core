// 2D Rectangle: 4m (width) x 2m (height)
// Use the command "gmsh rect.geo -2" to generate the mesh

lc = 0.7; // Characteristic length
// Points (x, y, z, mesh size)
Point(1) = {0, 0, 0, lc}; // Bottom left
Point(2) = {4, 0, 0, lc}; // Bottom right
Point(3) = {4, 2, 0, lc}; // Top right
Point(4) = {0, 2, 0, lc}; // Top left

// Lines
Line(1) = {1, 2}; // bottom
Line(2) = {2, 3}; // right
Line(3) = {3, 4}; // top
Line(4) = {4, 1}; // left

// Line Loop and Surface
Line Loop(1) = {1, 2, 3, 4};
Plane Surface(1) = {1};

// Physical Lines
Physical Line("bottom") = {1};
Physical Line("right")  = {2};
Physical Line("top")    = {3};
Physical Line("left")   = {4};

// Physical Surface
Physical Surface("domain") = {1};

// Create structured mesh
//Transfinite Curve{1} = 20;
//Transfinite Curve{2} = 10;
//Transfinite Curve{3} = 20;
//Transfinite Curve{4} = 10;
//Transfinite Surface{1};

// Generate 2D mesh
//Recombine Surface{1}; // Turns triangle mesh into quads
Mesh.ElementOrder = 1; // Set quadratic elements 
Mesh 2;

