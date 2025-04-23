<img src="https://feascript.github.io/FEAScript-website/assets/FEAScriptHeatTransfer.png" width="80" alt="FEAScript Logo">

## Heat Conduction in a Two-Dimensional Fin

This example demonstrates solving a steady-state heat transfer problem in a 2D rectangular domain using the FEAScript library. The problem represents a typical cooling fin scenario, where the objective is to model heat conduction and understand temperature distribution under specific boundary conditions.

### Available Versions

This example is available in three implementations:

1. **Standard Version** (`HeatConduction2DFin.html`) - Basic implementation using the FEAScriptModel class
2. **Web Worker Version** (`HeatConduction2DFinWorker.html`) - Implementation using Web Workers for better performance with larger models
3. **GMSH Version** (`HeatConduction2DFinGmsh.html`) - Experimental version supporting GMSH mesh file import

### Instructions

The mesh configuration and boundary conditions are defined directly in the JavaScript section of the HTML files. For a step-by-step guide and additional details, refer to the corresponding [tutorial](https://feascript.com/tutorials/HeatConduction2DFin.html) or the [Web Worker tutorial](https://feascript.com/tutorials/HeatConduction2DFinWorker.html).
