# WebGPU Conjugate Gradient Solver Example

This example demonstrates the use of the new WebGPU-accelerated Conjugate Gradient solver in FEAScript for improved precision in linear system solving.

## Key Features

- **WebGPU Acceleration**: Uses WebGPU compute shaders when available for faster vector operations
- **CPU Fallback**: Automatically falls back to optimized CPU implementation when WebGPU is unavailable
- **Improved Precision**: Higher precision arithmetic and tighter convergence tolerances (1e-9 vs 1e-6)
- **Robust Error Handling**: Automatically detects matrix properties and falls back to stable iterative methods
- **Smart Matrix Detection**: Checks for matrix symmetry and positive definiteness required by CG

## Usage

```javascript
// Set the solver method to use WebGPU Conjugate Gradient
model.setSolverMethod("conjugate-gradient-webgpu");
```

## Fallback Behavior

The solver intelligently handles different matrix types:

1. **Symmetric Positive Definite**: Uses optimized Conjugate Gradient algorithm
2. **Non-symmetric or Indefinite**: Falls back to robust Gauss-Seidel-based iterative solver
3. **WebGPU Unavailable**: Uses CPU implementation with same algorithms

## Precision Improvements

- Default tolerance: 1e-9 (vs 1e-6 for other solvers)
- Explicit numerical casting for precision preservation
- Better convergence criteria and residual monitoring
- Numerical stability checks throughout the algorithm

## Performance

- WebGPU acceleration when available (browser environment)
- Optimized CPU fallback for Node.js and non-WebGPU environments
- Competitive performance with traditional direct solvers
- Better convergence for well-conditioned systems

## Compatibility

The WebGPU solver is fully compatible with existing FEAScript workflows and can be used as a drop-in replacement for other solver methods.