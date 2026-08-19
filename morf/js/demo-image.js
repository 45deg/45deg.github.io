(() => {
  "use strict";

  // Draw a deterministic built-in image so the editor is immediately usable.
  const Lab = window.Morf ||= {};

  function draw(ctx, canvas, prompt) {
    canvas.width = 960;
    canvas.height = 640;
    const gradient = ctx.createLinearGradient(0, 0, 960, 640);
    gradient.addColorStop(0, "#eff6ff");
    gradient.addColorStop(1, "#dbeafe");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 960, 640);
    ctx.strokeStyle = "rgba(37, 99, 235, .16)";
    ctx.lineWidth = 2;
    for (let x = 0; x <= 960; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 640);
      ctx.stroke();
    }
    for (let y = 0; y <= 640; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(960, y);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(480, 320);
    ctx.rotate(-0.08);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(15, 23, 42, .18)";
    ctx.shadowBlur = 30;
    ctx.fillRect(-310, -190, 620, 380);
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#1e3a8a";
    ctx.font = "700 54px system-ui, sans-serif";
    ctx.fillText("Morf", -250, -85);
    ctx.fillStyle = "#475569";
    ctx.font = "28px system-ui, sans-serif";
    ctx.fillText(prompt, -250, -30);
    [["1", "#ef4444"], ["2", "#f59e0b"], ["3", "#10b981"], ["4", "#3b82f6"]].forEach(([label, color], index) => {
      const x = -235 + index * 150;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, 80, 43, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "700 30px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x, 80);
    });
    ctx.restore();
  }

  Lab.DemoImage = { draw };
})();
