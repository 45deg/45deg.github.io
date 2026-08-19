(() => {
  "use strict";

  // Pure geometry helpers shared by the controller and canvas renderer.
  const Lab = window.Morf ||= {};

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function cornerPoints(points, size) {
    return [points[0], points[size - 1], points[size * size - 1], points[size * (size - 1)]];
  }

  function perimeterPoints(points, size) {
    // Walk clockwise around the grid. Filling this path follows concave edits
    // instead of replacing them with a convex hull.
    const perimeter = [];
    for (let column = 0; column < size; column++) perimeter.push(points[column]);
    for (let row = 1; row < size; row++) perimeter.push(points[row * size + size - 1]);
    for (let column = size - 2; column >= 0; column--) perimeter.push(points[(size - 1) * size + column]);
    for (let row = size - 2; row > 0; row--) perimeter.push(points[row * size]);
    return perimeter;
  }

  function homography([p0, p1, p2, p3]) {
    // Map the unit square onto a four-corner projective quadrilateral.
    const dx1 = p1.x - p2.x;
    const dx2 = p3.x - p2.x;
    const dx3 = p0.x - p1.x + p2.x - p3.x;
    const dy1 = p1.y - p2.y;
    const dy2 = p3.y - p2.y;
    const dy3 = p0.y - p1.y + p2.y - p3.y;
    let g = 0;
    let h = 0;
    const denominator = dx1 * dy2 - dx2 * dy1;
    if ((Math.abs(dx3) > 1e-8 || Math.abs(dy3) > 1e-8) && Math.abs(denominator) > 1e-8) {
      g = (dx3 * dy2 - dx2 * dy3) / denominator;
      h = (dx1 * dy3 - dx3 * dy1) / denominator;
    }
    return {
      a: p1.x - p0.x + g * p1.x,
      b: p3.x - p0.x + h * p3.x,
      c: p0.x,
      d: p1.y - p0.y + g * p1.y,
      e: p3.y - p0.y + h * p3.y,
      f: p0.y,
      g,
      h
    };
  }

  function mapPoint(matrix, u, v) {
    const z = matrix.g * u + matrix.h * v + 1;
    return {
      x: (matrix.a * u + matrix.b * v + matrix.c) / z,
      y: (matrix.d * u + matrix.e * v + matrix.f) / z
    };
  }

  function meshFromCorners(corners, size) {
    // Sample the corner homography on a regular size-by-size parameter grid.
    const matrix = homography(corners);
    const points = [];
    for (let row = 0; row < size; row++) {
      for (let column = 0; column < size; column++) {
        points.push(mapPoint(matrix, column / (size - 1), row / (size - 1)));
      }
    }
    return points;
  }

  function cornerPosition(index, size) {
    if (index === 0) return { u: 0, v: 0 };
    if (index === size - 1) return { u: 1, v: 0 };
    if (index === size * size - 1) return { u: 1, v: 1 };
    if (index === size * (size - 1)) return { u: 0, v: 1 };
    return null;
  }

  function clampPoint(point, bounds) {
    return {
      x: Math.max(0, Math.min(bounds.width - 1, point.x)),
      y: Math.max(0, Math.min(bounds.height - 1, point.y))
    };
  }

  function moveControlPoint(points, index, target, baseState, bounds) {
    const clampedTarget = clampPoint(target, bounds);
    const corner = cornerPosition(index, baseState.meshSize);
    // Interior points always move independently. Four-point meshes do not have
    // neighboring points that need to follow a corner.
    if (baseState.meshSize < 3 || !corner) {
      const next = points.map(({ x, y }) => ({ x, y }));
      next[index] = clampedTarget;
      return next;
    }
    const origin = baseState.points[index];
    const delta = { x: clampedTarget.x - origin.x, y: clampedTarget.y - origin.y };
    // For larger meshes, distribute a corner's delta with bilinear weights. The
    // dragged corner receives the full delta and the opposite corner receives 0.
    return baseState.points.map((point, pointIndex) => {
      const u = (pointIndex % baseState.meshSize) / (baseState.meshSize - 1);
      const v = Math.floor(pointIndex / baseState.meshSize) / (baseState.meshSize - 1);
      const horizontalWeight = corner.u === 0 ? 1 - u : u;
      const verticalWeight = corner.v === 0 ? 1 - v : v;
      const weight = horizontalWeight * verticalWeight;
      return clampPoint({ x: point.x + delta.x * weight, y: point.y + delta.y * weight }, bounds);
    });
  }

  Lab.Geometry = {
    cornerPoints,
    distance,
    homography,
    mapPoint,
    meshFromCorners,
    moveControlPoint,
    perimeterPoints
  };
})();
