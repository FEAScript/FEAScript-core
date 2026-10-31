// 2D L-shaped domain of the Code_Aster TPLP01 benchmark (dimensions in metres)
// A (0, 0), B (0.4, 0), C (0.4, 0.4), D (0.8, 0.4), E (0.8, 0.8), F (0, 0.8); C is the re-entrant corner
// Use the command "gmsh lshape.geo -2" to generate the mesh

lc = 0.05; // Characteristic length
lcCorner = 0.01; // Characteristic length at the re-entrant corner C

// Points (x, y, z, mesh size); the boundary is split at the reference points on the 0.2 m grid
Point(1) = {0, 0, 0, lc}; // A
Point(2) = {0.2, 0, 0, lc};
Point(3) = {0.4, 0, 0, lc}; // B
Point(4) = {0.4, 0.2, 0, lc};
Point(5) = {0.4, 0.4, 0, lcCorner}; // C
Point(6) = {0.6, 0.4, 0, lc};
Point(7) = {0.8, 0.4, 0, lc}; // D
Point(8) = {0.8, 0.8, 0, lc}; // E
Point(9) = {0.6, 0.8, 0, lc};
Point(10) = {0.4, 0.8, 0, lc};
Point(11) = {0.2, 0.8, 0, lc};
Point(12) = {0, 0.8, 0, lc}; // F

// Interior reference points, embedded so that the mesh has nodes there
Point(13) = {0.2, 0.2, 0, lc};
Point(14) = {0.2, 0.4, 0, lc};
Point(15) = {0.2, 0.6, 0, lc};
Point(16) = {0.4, 0.6, 0, lc};
Point(17) = {0.6, 0.6, 0, lc};

// Lines
Line(1) = {1, 2}; // AB
Line(2) = {2, 3}; // AB
Line(3) = {3, 4}; // BC
Line(4) = {4, 5}; // BC
Line(5) = {5, 6}; // CD
Line(6) = {6, 7}; // CD
Line(7) = {7, 8}; // DE
Line(8) = {8, 9}; // EF
Line(9) = {9, 10}; // EF
Line(10) = {10, 11}; // EF
Line(11) = {11, 12}; // EF
Line(12) = {12, 1}; // FA

// Line Loop and Surface
Line Loop(1) = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12};
Plane Surface(1) = {1};
Point{13, 14, 15, 16, 17} In Surface{1};

// Physical Lines
Physical Line("left", 1) = {12}; // FA, T = 10 degC
Physical Line("right", 2) = {7}; // DE, T = 0 degC
Physical Line("insulated", 3) = {1, 2, 3, 4, 5, 6, 8, 9, 10, 11}; // AB, BC, CD, EF, zero flux

// Physical Surface
Physical Surface("domain", 4) = {1};

// Generate 2D mesh
//Recombine Surface{1}; // Turns triangle mesh into quads
Mesh.ElementOrder = 2; // Set quadratic elements
Mesh 2;
