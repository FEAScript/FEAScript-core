/**
 * ════════════════════════════════════════════════════════════════
 *  FEAScript Core Library
 *  Finite Element Simulation in JavaScript
 *  Version: 0.3.0 | https://feascript.com
 *  MIT License © 2023–2026 FEAScript
 * ════════════════════════════════════════════════════════════════
 */
/**
 * Function to test if a point is inside a triangle using barycentric coordinates,
 * also returning the natural coordinates (ksi, eta)
 * @param {number} x - X-coordinate of the point
 * @param {number} y - Y-coordinate of the point
 * @param {array} vertices - Triangle vertices [[x0,y0],[x1,y1],[x2,y2]]
 * @returns {object} Object containing inside boolean and natural coordinates {inside, ksi, eta}
 */
export function pointInsideTriangle(x, y, vertices) {
  const tolerance = 1e-12;
  const [v0, v1, v2] = vertices;

  const denom = (v1[1] - v2[1]) * (v0[0] - v2[0]) + (v2[0] - v1[0]) * (v0[1] - v2[1]);

  const ksi = ((v1[1] - v2[1]) * (x - v2[0]) + (v2[0] - v1[0]) * (y - v2[1])) / denom;
  const eta = ((v2[1] - v0[1]) * (x - v2[0]) + (v0[0] - v2[0]) * (y - v2[1])) / denom;
  const gamma = 1 - ksi - eta;

  const inside = ksi >= -tolerance && eta >= -tolerance && gamma >= -tolerance;
  return { inside, ksi, eta };
}

/**
 * Function to test if a point is inside a triangular element, also returning the natural coordinates
 * (ksi, eta) of the FEAScript reference triangle
 * @param {number} x - X-coordinate of the point
 * @param {number} y - Y-coordinate of the point
 * @param {array} vertices - Triangle vertices in FEAScript order [[x0,y0],[x1,y1],[x2,y2]]
 * @returns {object} Object containing inside boolean and natural coordinates {inside, ksi, eta}
 */
export function pointInsideTriangularElement(x, y, vertices) {
  // Vertices order (reference coordinates):
  //   1 (0,1)
  //   | \
  //   |   \
  //   0 --- 2 (1,0)
  // The barycentric weights of vertices 2 and 1 are the natural coordinates ksi and eta
  const { inside, ksi: weight0, eta: weight1 } = pointInsideTriangle(x, y, vertices);
  return { inside, ksi: 1 - weight0 - weight1, eta: weight1 };
}

/**
 * Function to test if a point is inside a quadrilateral by spliting it into triangles and using barycentric coordinates
 * @param {number} x - X-coordinate of the point
 * @param {number} y - Y-coordinate of the point
 * @param {array} vertices - Quadrilateral vertices [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]
 * @returns {object} Object containing inside boolean and natural coordinates {inside, ksi, eta}
 */
export function pointInsideQuadrilateral(x, y, vertices) {
  const [firstTriangleVertices, secondTriangleVertices] = splitQuadrilateral(vertices);
  const pointInsideFirstTriangle = pointInsideTriangle(x, y, firstTriangleVertices);
  const pointInsideSecondTriangle = pointInsideTriangle(x, y, secondTriangleVertices);

  const inside = pointInsideFirstTriangle.inside || pointInsideSecondTriangle.inside;
  let ksi = 0;
  let eta = 0;

  if (inside) {
    const [v0, v1, v2, v3] = vertices;

    // Function to calculate distance from point to line segment
    const getDistanceFromLine = (p1, p2) => {
      const num = Math.abs((p2[0] - p1[0]) * (p1[1] - y) - (p1[0] - x) * (p2[1] - p1[1]));
      const den = Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
      return num / den;
    };

    // Calculate distances to edges based on vertex order:
    //   1 (v1) --- 3 (v3)
    //   |          |
    //   0 (v0) --- 2 (v2)

    const distLeft = getDistanceFromLine(v0, v1);
    const distRight = getDistanceFromLine(v2, v3);
    const distBottom = getDistanceFromLine(v0, v2);
    const distTop = getDistanceFromLine(v1, v3);

    ksi = distLeft / (distLeft + distRight);
    eta = distBottom / (distBottom + distTop);

    // The distance ratios are exact only for parallelograms, so refine them with Newton iterations
    // on the bilinear mapping x(ksi, eta) = v0 (1-ksi)(1-eta) + v1 (1-ksi) eta + v2 ksi (1-eta) + v3 ksi eta
    for (let iteration = 0; iteration < 20; iteration++) {
      const mappedX =
        v0[0] * (1 - ksi) * (1 - eta) + v1[0] * (1 - ksi) * eta + v2[0] * ksi * (1 - eta) + v3[0] * ksi * eta;
      const mappedY =
        v0[1] * (1 - ksi) * (1 - eta) + v1[1] * (1 - ksi) * eta + v2[1] * ksi * (1 - eta) + v3[1] * ksi * eta;
      const ksiDerivX = (v2[0] - v0[0]) * (1 - eta) + (v3[0] - v1[0]) * eta;
      const ksiDerivY = (v2[1] - v0[1]) * (1 - eta) + (v3[1] - v1[1]) * eta;
      const etaDerivX = (v1[0] - v0[0]) * (1 - ksi) + (v3[0] - v2[0]) * ksi;
      const etaDerivY = (v1[1] - v0[1]) * (1 - ksi) + (v3[1] - v2[1]) * ksi;
      const detJacobian = ksiDerivX * etaDerivY - etaDerivX * ksiDerivY;
      const residualX = x - mappedX;
      const residualY = y - mappedY;
      const deltaKsi = (etaDerivY * residualX - etaDerivX * residualY) / detJacobian;
      const deltaEta = (ksiDerivX * residualY - ksiDerivY * residualX) / detJacobian;
      ksi += deltaKsi;
      eta += deltaEta;
      if (Math.abs(deltaKsi) + Math.abs(deltaEta) < 1e-14) break;
    }
  }

  return { inside, ksi, eta };
}

/**
 * Function to split the quadrilateral elements into two triangles
 * @param {array} vertices - Quadrilateral vertices [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]
 * @returns {array} Array of triangle vertices: [[v0,v1,v3], [v0,v2,v3]]
 */
export function splitQuadrilateral(vertices) {
  const [v0, v1, v2, v3] = vertices;
  // Vertices order:
  //   1 --- 3
  //   |     |
  //   0 --- 2
  return [
    [v0, v1, v3],
    [v0, v2, v3],
  ];
}
