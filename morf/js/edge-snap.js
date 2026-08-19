(() => {
  "use strict";

  // Search settings balance reach and minimum edge confidence for each UI level.
  const Lab = window.Morf ||= {};
  const settingsByStrength = {
    low: { radius: 10, threshold: 190 },
    medium: { radius: 22, threshold: 125 },
    high: { radius: 40, threshold: 70 }
  };

  function find(point, edgeMap, strength) {
    if (strength === "none" || !edgeMap) return { point, snapped: false };
    const settings = settingsByStrength[strength];
    // Scale the search radius with source resolution, but keep it within a
    // predictable range for very small or very large images.
    const imageScale = Math.max(0.7, Math.min(1.7, Math.max(edgeMap.width, edgeMap.height) / 960));
    const radius = Math.round(settings.radius * imageScale);
    const centerX = Math.round(point.x);
    const centerY = Math.round(point.y);
    let best = null;
    let bestCost = Infinity;
    const minX = Math.max(1, centerX - radius);
    const maxX = Math.min(edgeMap.width - 2, centerX + radius);
    const minY = Math.max(1, centerY - radius);
    const maxY = Math.min(edgeMap.height - 2, centerY + radius);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - point.x;
        const dy = y - point.y;
        const distance = Math.hypot(dx, dy);
        if (distance > radius) continue;
        const magnitude = edgeMap.pixels[y * edgeMap.width + x];
        if (magnitude < settings.threshold) continue;
        // Prefer nearby candidates while allowing a stronger edge to win when
        // candidates are at similar distances.
        const cost = distance + ((255 - magnitude) / 255) * radius * 0.45;
        if (cost < bestCost) {
          bestCost = cost;
          best = { x, y };
        }
      }
    }
    return best ? { point: best, snapped: true } : { point, snapped: false };
  }

  Lab.EdgeSnap = { find };
})();
