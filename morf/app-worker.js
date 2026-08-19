"use strict";

// This function is serialized into a Blob by app.js. Keep all worker-only
// dependencies inside its scope so it can run without imports.
function morfWorkerMain() {
let source = null;

self.addEventListener("message", ({ data }) => {
  if (data.type === "source") {
    source = {
      width: data.width,
      height: data.height,
      pixels: new Uint8ClampedArray(data.buffer)
    };
    // Edge detection runs once per source image and is reused during dragging.
    const edges = detectEdges();
    self.postMessage({ type: "edges", width: source.width, height: source.height, buffer: edges.buffer }, [edges.buffer]);
    self.postMessage({ type: "ready" });
    return;
  }
  if (data.type === "render" && source) render(data);
});

function detectEdges() {
  const { width, height, pixels } = source;
  const length = width * height;
  const gray = new Uint8Array(length);
  const magnitudes = new Uint16Array(length);
  const histogram = new Uint32Array(2041);
  let nonZeroCount = 0;
  // Convert to luminance before applying a 3x3 Sobel operator.
  for (let index = 0; index < length; index++) {
    const offset = index * 4;
    gray[index] = Math.round(pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114);
  }
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const topLeft = gray[(y - 1) * width + x - 1];
      const top = gray[(y - 1) * width + x];
      const topRight = gray[(y - 1) * width + x + 1];
      const left = gray[y * width + x - 1];
      const right = gray[y * width + x + 1];
      const bottomLeft = gray[(y + 1) * width + x - 1];
      const bottom = gray[(y + 1) * width + x];
      const bottomRight = gray[(y + 1) * width + x + 1];
      const gx = -topLeft + topRight - 2 * left + 2 * right - bottomLeft + bottomRight;
      const gy = -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight;
      const magnitude = Math.min(2040, Math.abs(gx) + Math.abs(gy));
      magnitudes[y * width + x] = magnitude;
      histogram[magnitude]++;
      if (magnitude > 0) nonZeroCount++;
    }
  }
  // Normalize against the 85th percentile so snap sensitivity remains useful
  // across both low-contrast and high-contrast images.
  const target = nonZeroCount * 0.85;
  let cumulative = 0;
  let percentile = 1;
  for (let magnitude = 1; magnitude < histogram.length; magnitude++) {
    cumulative += histogram[magnitude];
    if (cumulative >= target) {
      percentile = Math.max(1, magnitude);
      break;
    }
  }
  const scale = 220 / percentile;
  const edges = new Uint8Array(length);
  for (let index = 0; index < length; index++) {
    edges[index] = Math.min(255, Math.round(magnitudes[index] * scale));
  }
  return edges;
}

function homography(p) {
  const [p0, p1, p2, p3] = p;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;
  let g = 0, h = 0;
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
    g, h
  };
}

function mapHomography(matrix, u, v) {
  const z = matrix.g * u + matrix.h * v + 1;
  return {
    x: (matrix.a * u + matrix.b * v + matrix.c) / z,
    y: (matrix.d * u + matrix.e * v + matrix.f) / z
  };
}

function kernel(u1, v1, u2, v2) {
  // Thin-plate spline radial basis function: r^2 log(r).
  const squared = (u1 - u2) ** 2 + (v1 - v2) ** 2;
  return squared < 1e-14 ? 0 : 0.5 * squared * Math.log(squared);
}

function solve(matrix, values) {
  // Gauss-Jordan elimination with partial pivoting is sufficient for the small
  // systems used by the 2x2 through 5x5 control meshes.
  const n = values.length;
  const augmented = matrix.map((row, index) => [...row, values[index]]);
  for (let column = 0; column < n; column++) {
    let pivot = column;
    for (let row = column + 1; row < n; row++) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const divisor = augmented[column][column];
    if (Math.abs(divisor) < 1e-12) continue;
    for (let item = column; item <= n; item++) augmented[column][item] /= divisor;
    for (let row = 0; row < n; row++) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let item = column; item <= n; item++) augmented[row][item] -= factor * augmented[column][item];
    }
  }
  return augmented.map((row) => row[n]);
}

function tpsModel(points, meshSize, base) {
  // Model only the displacement from the corner homography. This preserves a
  // stable projective base while interior points add smooth local corrections.
  const count = points.length;
  const nodes = points.map((point, index) => {
    const u = (index % meshSize) / (meshSize - 1);
    const v = Math.floor(index / meshSize) / (meshSize - 1);
    const projected = mapHomography(base, u, v);
    return { u, v, dx: point.x - projected.x, dy: point.y - projected.y };
  });
  const size = count + 3;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));
  for (let row = 0; row < count; row++) {
    for (let column = 0; column < count; column++) {
      matrix[row][column] = kernel(nodes[row].u, nodes[row].v, nodes[column].u, nodes[column].v);
    }
    matrix[row][count] = 1;
    matrix[row][count + 1] = nodes[row].u;
    matrix[row][count + 2] = nodes[row].v;
    matrix[count][row] = 1;
    matrix[count + 1][row] = nodes[row].u;
    matrix[count + 2][row] = nodes[row].v;
  }
  const padding = [0, 0, 0];
  return {
    nodes,
    x: solve(matrix, [...nodes.map((node) => node.dx), ...padding]),
    y: solve(matrix, [...nodes.map((node) => node.dy), ...padding])
  };
}

function mapWarp(base, model, u, v) {
  const projected = mapHomography(base, u, v);
  const count = model.nodes.length;
  let dx = model.x[count] + model.x[count + 1] * u + model.x[count + 2] * v;
  let dy = model.y[count] + model.y[count + 1] * u + model.y[count + 2] * v;
  for (let index = 0; index < count; index++) {
    const weight = kernel(u, v, model.nodes[index].u, model.nodes[index].v);
    dx += model.x[index] * weight;
    dy += model.y[index] * weight;
  }
  return { x: projected.x + dx, y: projected.y + dy };
}

function pixelOffset(x, y) {
  // Clamp convolution taps at the image boundary.
  const px = Math.max(0, Math.min(source.width - 1, x));
  const py = Math.max(0, Math.min(source.height - 1, y));
  return (py * source.width + px) * 4;
}

function sampleNearest(x, y, output, offset) {
  const sourceOffset = pixelOffset(Math.round(x), Math.round(y));
  for (let channel = 0; channel < 4; channel++) output[offset + channel] = source.pixels[sourceOffset + channel];
}

function sampleBilinear(x, y, output, offset) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const tx = x - x0, ty = y - y0;
  const offsets = [pixelOffset(x0, y0), pixelOffset(x0 + 1, y0), pixelOffset(x0, y0 + 1), pixelOffset(x0 + 1, y0 + 1)];
  const weights = [(1 - tx) * (1 - ty), tx * (1 - ty), (1 - tx) * ty, tx * ty];
  for (let channel = 0; channel < 4; channel++) {
    output[offset + channel] = offsets.reduce((sum, sourceOffset, index) => sum + source.pixels[sourceOffset + channel] * weights[index], 0);
  }
}

function cubicWeight(value) {
  const a = -0.5;
  const x = Math.abs(value);
  if (x <= 1) return (a + 2) * x ** 3 - (a + 3) * x ** 2 + 1;
  if (x < 2) return a * x ** 3 - 5 * a * x ** 2 + 8 * a * x - 4 * a;
  return 0;
}

function sinc(x) { return x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); }
function lanczosWeight(x) { return Math.abs(x) < 3 ? sinc(x) * sinc(x / 3) : 0; }

function sampleConvolution(x, y, output, offset, mode) {
  const baseX = Math.floor(x), baseY = Math.floor(y);
  const start = mode === "bicubic" ? -1 : -2;
  const end = mode === "bicubic" ? 2 : 3;
  const weightFunction = mode === "bicubic" ? cubicWeight : lanczosWeight;
  const totals = [0, 0, 0, 0];
  let weightTotal = 0;
  for (let row = start; row <= end; row++) {
    for (let column = start; column <= end; column++) {
      const weight = weightFunction(x - (baseX + column)) * weightFunction(y - (baseY + row));
      const sourceOffset = pixelOffset(baseX + column, baseY + row);
      for (let channel = 0; channel < 4; channel++) totals[channel] += source.pixels[sourceOffset + channel] * weight;
      weightTotal += weight;
    }
  }
  for (let channel = 0; channel < 4; channel++) output[offset + channel] = weightTotal ? totals[channel] / weightTotal : 0;
}

function render(job) {
  const n = job.meshSize;
  const corners = [job.points[0], job.points[n - 1], job.points[n * n - 1], job.points[n * (n - 1)]];
  const base = homography(corners);
  const model = tpsModel(job.points, n, base);
  const output = new Uint8ClampedArray(job.width * job.height * 4);
  // Inverse-map every output pixel into source coordinates, then sample it with
  // the user-selected reconstruction filter.
  for (let y = 0; y < job.height; y++) {
    const v = job.height === 1 ? 0 : y / (job.height - 1);
    for (let x = 0; x < job.width; x++) {
      const u = job.width === 1 ? 0 : x / (job.width - 1);
      const mapped = mapWarp(base, model, u, v);
      const offset = (y * job.width + x) * 4;
      if (job.sampling === "nearest") sampleNearest(mapped.x, mapped.y, output, offset);
      else if (job.sampling === "bilinear") sampleBilinear(mapped.x, mapped.y, output, offset);
      else sampleConvolution(mapped.x, mapped.y, output, offset, job.sampling);
    }
  }
  // Transfer ownership instead of copying the full output buffer.
  self.postMessage({ type: "result", token: job.token, width: job.width, height: job.height, buffer: output.buffer }, [output.buffer]);
}
}
