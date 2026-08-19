(() => {
  "use strict";

  // Canvas-specific coordinate conversion, hit testing, and overlay rendering.
  const Lab = window.Morf ||= {};

  function displayScale(canvas) {
    const displayedWidth = canvas.getBoundingClientRect().width;
    return displayedWidth > 0 ? displayedWidth / canvas.width : 1;
  }

  function eventPoint(canvas, event) {
    // Pointer events use CSS pixels; mesh geometry uses intrinsic canvas pixels.
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height
    };
  }

  function hitTest(points, point, radius) {
    return points.reduce((best, candidate, index) => {
      const candidateDistance = Lab.Geometry.distance(candidate, point);
      return candidateDistance < best.distance ? { index, distance: candidateDistance } : best;
    }, { index: -1, distance: radius }).index;
  }

  function draw({ ctx, canvas, sourceCanvas, points, meshSize, selectedPoint, activePoint, snapState }) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sourceCanvas, 0, 0);
    if (!points.length) return;
    const perimeter = Lab.Geometry.perimeterPoints(points, meshSize);
    // Compensate strokes and handles for responsive CSS scaling so they remain
    // comfortably visible and tappable on mobile screens.
    const scale = Math.max(0.05, displayScale(canvas));
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.fillStyle = "rgba(37, 99, 235, .13)";
    ctx.strokeStyle = "rgba(255, 255, 255, .78)";
    ctx.lineWidth = Math.max(1.5 / scale, canvas.width / 800);
    ctx.beginPath();
    perimeter.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, .66)";
    for (let row = 0; row < meshSize; row++) {
      ctx.beginPath();
      for (let column = 0; column < meshSize; column++) {
        const point = points[row * meshSize + column];
        column ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y);
      }
      ctx.stroke();
    }
    for (let column = 0; column < meshSize; column++) {
      ctx.beginPath();
      for (let row = 0; row < meshSize; row++) {
        const point = points[row * meshSize + column];
        row ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y);
      }
      ctx.stroke();
    }

    // Slightly reduce dense-mesh handles to avoid excessive overlap.
    const targetRadius = meshSize >= 5 ? 7.5 : meshSize >= 4 ? 8.5 : 10;
    const radius = targetRadius / scale;
    points.forEach((point, index) => {
      const isCorner = index === 0 || index === meshSize - 1 || index === meshSize * meshSize - 1 || index === meshSize * (meshSize - 1);
      const isSelected = index === selectedPoint || index === activePoint;
      const isSnapped = index === activePoint && snapState === "snapped";
      const pointRadius = isCorner ? radius * 1.15 : radius;
      ctx.fillStyle = isCorner ? "#2563eb" : "#ffffff";
      ctx.strokeStyle = isCorner ? "white" : "#2563eb";
      ctx.lineWidth = 2 / scale;
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (isSelected) {
        ctx.strokeStyle = isSnapped ? "#16a34a" : "#f59e0b";
        ctx.lineWidth = 3 / scale;
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointRadius + 5 / scale, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  Lab.InputCanvas = { displayScale, draw, eventPoint, hitTest };
})();
