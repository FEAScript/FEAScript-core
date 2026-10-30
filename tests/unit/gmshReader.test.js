/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.1 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */

/**
 * Unit tests for the Gmsh reader (importGmshMesh)
 *
 * Uses the test meshes of linear and quadratic quadrilaterals and triangles
 *
 * Covers:
 *  - Mesh settings detection: the mesh dimension and element order are read from the Gmsh element
 *    types, so a mesh configuration without meshDimension and elementOrder gives the same solution
 *    as one that sets them
 *  - Non-contiguous node tags: each mesh is copied with gaps in its node tags (same geometry and
 *    connectivity) and compared against the original
 *    - No extra (disconnected) nodes are created by the gaps
 *    - Element and boundary node references point to the same coordinates
 *    - The heat conduction solution (lusolve and jacobi) is the same at every element node
 *
 * Run: node tests/unit/gmshReader.test.js (or npm test)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FEAScriptModel } from "../../src/FEAScript.js";
import { importGmshMesh } from "../../src/io/gmshReader.js";
import { basicLog, errorLog } from "../../src/utilities/logging.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const meshesDirectory = path.join(__dirname, "../meshes");

const TOLERANCE = 1e-8;

basicLog("");
basicLog("================================");
basicLog("Unit tests: Gmsh reader");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    errorLog(`FAIL: ${message}`);
    failed++;
  } else {
    basicLog(`PASS: ${message}`);
    passed++;
  }
}

const meshCases = [
  {
    meshFile: "rect_quad_linear.msh",
    elementOrder: "linear",
    solverMethods: ["lusolve"],
  },
  {
    meshFile: "rect_quad_quadratic.msh",
    elementOrder: "quadratic",
    solverMethods: ["lusolve"],
  },
  {
    meshFile: "rect_triang_linear.msh",
    elementOrder: "linear",
    solverMethods: ["lusolve", "jacobi"],
  },
  {
    meshFile: "rect_triang_quadratic.msh",
    elementOrder: "quadratic",
    solverMethods: ["lusolve"],
  },
];

// Gmsh physical tags: 1 bottom, 2 right, 3 top, 4 left (stored as boundary keys 0-3)
const boundaryConditions = {
  0: ["constantTemperature", 200],
  1: ["constantTemperature", 200],
  2: ["convection", 1, 20],
  3: ["symmetry"],
};

const readMeshFile = (meshFile) => fs.readFileSync(path.join(meshesDirectory, meshFile), "utf8");

const parseMesh = (meshContent) => importGmshMesh({ text: async () => meshContent });

// Coordinates of the nodes referenced by a list of 1-based node numbers
const nodeCoordinates = (mesh, nodeNumbers) =>
  nodeNumbers.map((node) => [mesh.nodesXCoordinates[node - 1], mesh.nodesYCoordinates[node - 1]]);

const largestDifference = (a, b) => {
  const flatB = b.flat(Infinity);
  return Math.max(0, ...a.flat(Infinity).map((value, i) => Math.abs(value - flatB[i])));
};

function runSimulation(parsedMesh, meshSettings, solverMethod) {
  const model = new FEAScriptModel();
  model.setModelConfig("heatConductionScript");
  model.setMeshConfig({ parsedMesh, ...meshSettings });
  Object.entries(boundaryConditions).forEach(([boundaryKey, condition]) => {
    model.addBoundaryCondition(boundaryKey, condition);
  });
  model.setSolverMethod(solverMethod);
  return model.solve({ maxIterations: 200000, tolerance: 1e-10 });
}

// ─── Mesh settings detection ────────────────────────────────────

for (const { meshFile, elementOrder } of meshCases) {
  const meshContent = readMeshFile(meshFile);
  const parsed = await parseMesh(meshContent);
  assert(
    parsed.meshDimension === "2D",
    `${meshFile}: detected mesh dimension '2D' (got '${parsed.meshDimension}')`,
  );
  assert(
    parsed.elementOrder === elementOrder,
    `${meshFile}: detected element order '${elementOrder}' (got '${parsed.elementOrder}')`,
  );

  // The model configuration holds the detected settings (e.g., for plotting)
  const model = new FEAScriptModel();
  model.setMeshConfig({ parsedMesh: parsed });
  assert(
    model.meshConfig.meshDimension === "2D" && model.meshConfig.elementOrder === elementOrder,
    `${meshFile}: model mesh configuration filled in with '2D' and '${elementOrder}' (got '${model.meshConfig.meshDimension}' and '${model.meshConfig.elementOrder}')`,
  );

  const configuredSolution = runSimulation(
    await parseMesh(meshContent),
    { meshDimension: "2D", elementOrder },
    "lusolve",
  ).solutionVector;
  const detectedSolution = runSimulation(await parseMesh(meshContent), {}, "lusolve").solutionVector;
  const solutionDifference = largestDifference(Array.from(detectedSolution), Array.from(configuredSolution));
  assert(
    solutionDifference === 0,
    `${meshFile}: same solution without meshDimension and elementOrder in the mesh configuration (largest difference ${solutionDifference})`,
  );
}

// ─── Non-contiguous node tags ───────────────────────────────────

// Node tags above TAG_GAP_START are shifted by TAG_GAP, leaving tags that no node uses
const TAG_GAP_START = 10;
const TAG_GAP = 100;

/**
 * Function to copy a Gmsh (.msh v4.1 ASCII) file with gaps in its node tags
 * @param {string} meshContent - Content of the original mesh file
 * @returns {string} Content of the mesh file with shifted node tags
 */
function addNodeTagGaps(meshContent) {
  const shiftTag = (tag) => (tag > TAG_GAP_START ? tag + TAG_GAP : tag);
  const lines = meshContent.split("\n");
  const output = [];
  let lineIndex = 0;
  const nextParts = () => lines[lineIndex++].trim().split(/\s+/).map(Number);

  while (lineIndex < lines.length) {
    const line = lines[lineIndex++];
    output.push(line);

    if (line.trim() === "$Nodes") {
      const [numBlocks, numNodes, minTag, maxTag] = nextParts();
      output.push(`${numBlocks} ${numNodes} ${minTag} ${shiftTag(maxTag)}`);
      for (let block = 0; block < numBlocks; block++) {
        const blockHeader = nextParts();
        output.push(blockHeader.join(" "));
        const numBlockNodes = blockHeader[3];
        for (let i = 0; i < numBlockNodes; i++) output.push(String(shiftTag(nextParts()[0])));
        for (let i = 0; i < numBlockNodes; i++) output.push(lines[lineIndex++]);
      }
    } else if (line.trim() === "$Elements") {
      const elementsHeader = nextParts();
      output.push(elementsHeader.join(" "));
      for (let block = 0; block < elementsHeader[0]; block++) {
        const blockHeader = nextParts();
        output.push(blockHeader.join(" "));
        for (let i = 0; i < blockHeader[3]; i++) {
          const [elementTag, ...nodeTags] = nextParts();
          output.push([elementTag, ...nodeTags.map(shiftTag)].join(" "));
        }
      }
    }
  }

  return output.join("\n");
}

for (const { meshFile, solverMethods } of meshCases) {
  const meshContent = readMeshFile(meshFile);
  const original = await parseMesh(meshContent);
  const gapped = await parseMesh(addNodeTagGaps(meshContent));

  const originalElements = [
    ...original.nodalNumbering.quadElements,
    ...original.nodalNumbering.triangleElements,
  ];
  const gappedElements = [...gapped.nodalNumbering.quadElements, ...gapped.nodalNumbering.triangleElements];

  const numNodes = original.nodesXCoordinates.length;
  const definedNodes = gapped.nodesXCoordinates.filter((x) => x !== undefined).length;
  assert(
    gapped.nodesXCoordinates.length === numNodes && definedNodes === numNodes,
    `${meshFile}: ${numNodes} nodes with gapped tags (got ${gapped.nodesXCoordinates.length}, ${definedNodes} defined)`,
  );

  const elementDifference = largestDifference(
    gappedElements.map((element) => nodeCoordinates(gapped, element)),
    originalElements.map((element) => nodeCoordinates(original, element)),
  );
  assert(
    elementDifference === 0,
    `${meshFile}: element nodes have the same coordinates (largest difference ${elementDifference})`,
  );

  const boundaryTags = Object.keys(original.boundaryNodePairs);
  const boundaryDifference = largestDifference(
    boundaryTags.map((tag) => gapped.boundaryNodePairs[tag].map((pair) => nodeCoordinates(gapped, pair))),
    boundaryTags.map((tag) => original.boundaryNodePairs[tag].map((pair) => nodeCoordinates(original, pair))),
  );
  assert(
    boundaryDifference === 0,
    `${meshFile}: boundary nodes have the same coordinates (largest difference ${boundaryDifference})`,
  );

  // The simulation modifies the parsed mesh, so each one parses its own copy
  for (const solverMethod of solverMethods) {
    const originalSolution = runSimulation(await parseMesh(meshContent), {}, solverMethod).solutionVector;
    const gappedSolution = runSimulation(
      await parseMesh(addNodeTagGaps(meshContent)),
      {},
      solverMethod,
    ).solutionVector;

    const allFinite = Array.from(gappedSolution).every(Number.isFinite);
    const solutionDifference = largestDifference(
      gappedElements.map((element) => element.map((node) => gappedSolution[node - 1])),
      originalElements.map((element) => element.map((node) => originalSolution[node - 1])),
    );
    assert(
      allFinite && gappedSolution.length === numNodes && solutionDifference < TOLERANCE,
      `${meshFile}, ${solverMethod}: same temperatures at the element nodes, largest difference ${solutionDifference.toExponential(
        3,
      )} (tolerance ${TOLERANCE})`,
    );
  }
}

basicLog(`Gmsh reader tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
