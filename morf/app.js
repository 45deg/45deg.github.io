(() => {
  "use strict";

  // Main-thread controller: owns UI state and delegates math, drawing, and image
  // processing to the small modules loaded before this file.
  const { DemoImage, EdgeSnap, Geometry, I18n, InputCanvas } = window.Morf;
  const { t } = I18n;
  I18n.apply();

  const $ = (selector) => document.querySelector(selector);
  const inputCanvas = $("#input-canvas");
  const outputCanvas = $("#output-canvas");
  const inputCtx = inputCanvas.getContext("2d");
  const outputCtx = outputCanvas.getContext("2d");
  const fileInput = $("#file-input");
  const inputStage = $("#input-stage");
  const workspace = $("#workspace");
  const aspectSelect = $("#aspect");
  const customAspect = $("#custom-aspect");
  const customWidth = $("#custom-width");
  const customHeight = $("#custom-height");
  const samplingSelect = $("#sampling");
  const meshSelect = $("#mesh-size");
  const edgeSnapSelect = $("#edge-snap");
  const pointBadge = $("#point-badge");
  const inputInstruction = $("#input-instruction");
  const outputSize = $("#output-size");
  const rendering = $("#rendering");
  const undoButton = $("#undo-button");
  const focusEditButton = $("#focus-edit-button");
  const viewButtons = [...document.querySelectorAll(".view-button")];
  const outputViewButton = $("[data-view='output']");
  const exportButton = $("#export-button");
  const exportStatus = $("#export-status");

  const sourceCanvas = document.createElement("canvas");
  const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  // Build the worker from a classic function so the app also works when index.html
  // is opened directly from disk, where module workers are commonly restricted.
  const workerUrl = URL.createObjectURL(new Blob([`(${morfWorkerMain.toString()})()`], { type: "text/javascript" }));
  const worker = new Worker(workerUrl);
  URL.revokeObjectURL(workerUrl);
  let meshSize = 2;
  let points = [];
  let activePoint = -1;
  let selectedPoint = -1;
  let dragStartState = null;
  let history = [];
  let sourceReady = false;
  let edgeMap = null;
  let renderTimer = 0;
  let renderToken = 0;
  let dragDepth = 0;
  let sourceFileStem = "";

  worker.addEventListener("message", ({ data }) => {
    if (data.type === "edges") {
      edgeMap = {
        width: data.width,
        height: data.height,
        pixels: new Uint8Array(data.buffer)
      };
      return;
    }
    if (data.type === "ready") {
      sourceReady = true;
      scheduleRender(0);
      return;
    }
    // Ignore stale renders that finished after a newer interaction was queued.
    if (data.type !== "result" || data.token !== renderToken) return;
    outputCanvas.width = data.width;
    outputCanvas.height = data.height;
    outputCtx.putImageData(new ImageData(new Uint8ClampedArray(data.buffer), data.width, data.height), 0, 0);
    outputSize.textContent = `${data.width} × ${data.height} px`;
    rendering.hidden = true;
    if (window.innerWidth <= 600 && workspace.dataset.mobileView === "input") {
      outputViewButton.classList.add("has-update");
    }
  });

  worker.addEventListener("error", () => {
    rendering.textContent = t("renderError");
    rendering.hidden = false;
  });

  function captureState() {
    return {
      meshSize,
      points: points.map(({ x, y }) => ({ x, y }))
    };
  }

  function updateUndoButton() {
    undoButton.disabled = history.length === 0;
  }

  function remember(state = captureState()) {
    if (!state.points.length) return;
    history.push(state);
    // Bound memory use while keeping enough steps for normal touch editing.
    if (history.length > 30) history.shift();
    updateUndoButton();
  }

  function restoreState(state) {
    meshSize = state.meshSize;
    meshSelect.value = String(meshSize);
    points = state.points.map(({ x, y }) => ({ x, y }));
    selectedPoint = -1;
    pointBadge.textContent = t("points.count", { count: points.length });
    inputInstruction.textContent = t(meshSize >= 3 ? "instruction.follow" : "instruction.drag");
    drawInput();
    scheduleRender(0);
  }

  function statesDiffer(first, second) {
    return first.meshSize !== second.meshSize || first.points.some((point, index) => (
      point.x !== second.points[index]?.x || point.y !== second.points[index]?.y
    ));
  }

  function setMobileView(view) {
    workspace.dataset.mobileView = view;
    viewButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === view)));
    if (view === "output" || view === "both") outputViewButton.classList.remove("has-update");
    requestAnimationFrame(drawInput);
  }

  function setFocusEditing(enabled) {
    document.body.classList.toggle("focus-editing", enabled);
    focusEditButton.setAttribute("aria-pressed", String(enabled));
    focusEditButton.querySelector("[data-button-label]").textContent = t(enabled ? "focus.done" : "focus.expand");
    requestAnimationFrame(drawInput);
  }

  function makeDemoImage() {
    DemoImage.draw(sourceCtx, sourceCanvas, t("demo.prompt"));
    finishImageLoad();
  }

  function finishImageLoad() {
    inputCanvas.width = sourceCanvas.width;
    inputCanvas.height = sourceCanvas.height;
    sourceReady = false;
    edgeMap = null;
    history = [];
    selectedPoint = -1;
    updateUndoButton();
    renderToken++;
    resetPoints();
    // Transfer source pixels once. Subsequent renders only send mesh parameters.
    const pixels = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    worker.postMessage({
      type: "source",
      width: sourceCanvas.width,
      height: sourceCanvas.height,
      buffer: pixels.data.buffer
    }, [pixels.data.buffer]);
  }

  function loadImage(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      // Cap large uploads before transferring pixels to the worker.
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      sourceCanvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      sourceCanvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      sourceCtx.drawImage(image, 0, 0, sourceCanvas.width, sourceCanvas.height);
      sourceFileStem = safeFileStem(file.name);
      URL.revokeObjectURL(url);
      finishImageLoad();
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  }

  function cornerPoints() {
    return Geometry.cornerPoints(points, meshSize);
  }

  function resetPoints() {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const insetX = w * 0.12;
    const insetY = h * 0.12;
    points = Geometry.meshFromCorners([
      { x: insetX, y: insetY },
      { x: w - insetX, y: insetY },
      { x: w - insetX, y: h - insetY },
      { x: insetX, y: h - insetY }
    ], meshSize);
    drawInput();
    scheduleRender(0);
  }

  function inputDisplayScale() {
    return InputCanvas.displayScale(inputCanvas);
  }

  function drawInput() {
    InputCanvas.draw({
      ctx: inputCtx,
      canvas: inputCanvas,
      sourceCanvas,
      points,
      meshSize,
      selectedPoint,
      activePoint,
      snapState: inputCanvas.dataset.snapState
    });
  }

  function getCanvasPoint(event) {
    return InputCanvas.eventPoint(inputCanvas, event);
  }

  function getAspectRatio(naturalWidth, naturalHeight) {
    if (aspectSelect.value === "auto") return naturalWidth / Math.max(1, naturalHeight);
    if (aspectSelect.value !== "custom") return Number(aspectSelect.value);
    return Math.max(1, Number(customWidth.value) || 1) / Math.max(1, Number(customHeight.value) || 1);
  }

  function outputDimensions() {
    const [topLeft, topRight, bottomRight, bottomLeft] = cornerPoints();
    const naturalWidth = (Geometry.distance(topLeft, topRight) + Geometry.distance(bottomLeft, bottomRight)) / 2;
    const naturalHeight = (Geometry.distance(topLeft, bottomLeft) + Geometry.distance(topRight, bottomRight)) / 2;
    // Preserve the selected region's approximate pixel area while enforcing the
    // requested aspect ratio and a practical maximum output size.
    const area = Math.max(160 * 160, naturalWidth * naturalHeight);
    const ratio = getAspectRatio(naturalWidth, naturalHeight);
    let width = Math.sqrt(area * ratio);
    let height = width / ratio;
    const scale = Math.min(1, 1100 / Math.max(width, height));
    return {
      width: Math.max(64, Math.round(width * scale)),
      height: Math.max(64, Math.round(height * scale))
    };
  }

  function scheduleRender(delay = 120) {
    // Coalesce rapid pointer events so expensive resampling stays responsive.
    clearTimeout(renderTimer);
    rendering.textContent = t("rendering");
    rendering.hidden = false;
    if (!sourceReady) return;
    const token = ++renderToken;
    renderTimer = setTimeout(() => {
      const { width, height } = outputDimensions();
      worker.postMessage({
        type: "render",
        token,
        width,
        height,
        meshSize,
        points: points.map(({ x, y }) => ({ x, y })),
        sampling: samplingSelect.value
      });
    }, delay);
  }

  function snapToEdge(point) {
    return EdgeSnap.find(point, edgeMap, edgeSnapSelect.value);
  }

  function moveControlPoint(index, target, baseState) {
    points = Geometry.moveControlPoint(points, index, target, baseState, {
      width: inputCanvas.width,
      height: inputCanvas.height
    });
  }

  inputCanvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    inputCanvas.focus({ preventScroll: true });
    const point = getCanvasPoint(event);
    // Keep the touch target close to 30 CSS pixels at every display scale.
    const hitRadius = 30 / Math.max(0.05, inputDisplayScale());
    activePoint = InputCanvas.hitTest(points, point, hitRadius);
    selectedPoint = activePoint;
    if (activePoint >= 0) {
      dragStartState = captureState();
      inputCanvas.setPointerCapture(event.pointerId);
      inputCanvas.classList.add("dragging");
    }
    drawInput();
  });

  inputCanvas.addEventListener("pointermove", (event) => {
    if (activePoint < 0) return;
    const rawPoint = getCanvasPoint(event);
    const snap = snapToEdge(rawPoint);
    const point = snap.point;
    inputCanvas.dataset.snapState = snap.snapped ? "snapped" : "free";
    moveControlPoint(activePoint, point, dragStartState);
    drawInput();
    scheduleRender();
  });

  function endDrag() {
    if (dragStartState && statesDiffer(dragStartState, captureState())) remember(dragStartState);
    dragStartState = null;
    activePoint = -1;
    inputCanvas.dataset.lastSnapState = inputCanvas.dataset.snapState || "free";
    delete inputCanvas.dataset.snapState;
    inputCanvas.classList.remove("dragging");
    drawInput();
  }
  inputCanvas.addEventListener("pointerup", endDrag);
  inputCanvas.addEventListener("pointercancel", endDrag);
  inputCanvas.addEventListener("keydown", (event) => {
    if (selectedPoint < 0 || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const keyboardStartState = captureState();
    remember(keyboardStartState);
    // Arrow keys move by one displayed pixel; Shift provides a ten-pixel step.
    const distance = (event.shiftKey ? 10 : 1) / Math.max(0.05, inputDisplayScale());
    const movement = {
      ArrowLeft: { x: -distance, y: 0 },
      ArrowRight: { x: distance, y: 0 },
      ArrowUp: { x: 0, y: -distance },
      ArrowDown: { x: 0, y: distance }
    }[event.key];
    const current = points[selectedPoint];
    moveControlPoint(selectedPoint, { x: current.x + movement.x, y: current.y + movement.y }, keyboardStartState);
    drawInput();
    scheduleRender();
  });

  fileInput.addEventListener("change", () => loadImage(fileInput.files[0]));

  function isImageDrag(dataTransfer) {
    const items = [...(dataTransfer?.items || [])];
    if (!items.length) return [...(dataTransfer?.types || [])].includes("Files");
    return items.some((item) => (
      item.kind === "file" && (!item.type || item.type.startsWith("image/"))
    ));
  }

  document.addEventListener("dragenter", (event) => {
    if (!isImageDrag(event.dataTransfer)) return;
    event.preventDefault();
    dragDepth++;
    inputStage.classList.add("is-over");
  });
  document.addEventListener("dragover", (event) => {
    if (!isImageDrag(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });
  document.addEventListener("dragleave", (event) => {
    if (dragDepth === 0) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) inputStage.classList.remove("is-over");
  });
  document.addEventListener("drop", (event) => {
    event.preventDefault();
    dragDepth = 0;
    inputStage.classList.remove("is-over");
    const imageFile = [...(event.dataTransfer?.files || [])].find((file) => file.type.startsWith("image/"));
    loadImage(imageFile);
  });

  aspectSelect.addEventListener("change", () => {
    customAspect.hidden = aspectSelect.value !== "custom";
    scheduleRender();
  });
  [customWidth, customHeight, samplingSelect].forEach((element) => {
    element.addEventListener("change", () => scheduleRender());
  });
  meshSelect.addEventListener("change", () => {
    // Rebuild the new grid from the current four corners. This keeps the visible
    // selection stable when switching between 4, 9, 16, and 25 points.
    const corners = cornerPoints();
    remember();
    meshSize = Number(meshSelect.value);
    selectedPoint = -1;
    points = Geometry.meshFromCorners(corners, meshSize);
    pointBadge.textContent = t("points.count", { count: points.length });
    inputInstruction.textContent = t(meshSize >= 3 ? "instruction.follow" : "instruction.drag");
    drawInput();
    scheduleRender(0);
  });
  undoButton.addEventListener("click", () => {
    const state = history.pop();
    if (!state) return;
    restoreState(state);
    updateUndoButton();
  });
  $("#reset-button").addEventListener("click", () => {
    remember();
    selectedPoint = -1;
    resetPoints();
  });
  $("#rotate-button").addEventListener("click", () => {
    remember();
    selectedPoint = -1;
    const previous = points;
    points = [];
    // Rotate the row-major mesh clockwise without changing point coordinates.
    for (let row = 0; row < meshSize; row++) {
      for (let column = 0; column < meshSize; column++) {
        points.push(previous[column * meshSize + (meshSize - 1 - row)]);
      }
    }
    drawInput(); scheduleRender(0);
  });
  viewButtons.forEach((button) => button.addEventListener("click", () => setMobileView(button.dataset.view)));
  focusEditButton.addEventListener("click", () => setFocusEditing(!document.body.classList.contains("focus-editing")));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("focus-editing")) setFocusEditing(false);
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && !undoButton.disabled) {
      event.preventDefault();
      undoButton.click();
    }
  });
  function canvasBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not encode the output canvas as PNG"));
      }, "image/png");
    });
  }

  function safeFileStem(filename) {
    const withoutExtension = filename.replace(/\.[^.]*$/, "");
    return withoutExtension
      .normalize("NFKC")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
      .replace(/[. ]+$/g, "")
      .trim()
      .slice(0, 80);
  }

  function exportFilename(date = new Date()) {
    const pad = (value, length = 2) => String(value).padStart(length, "0");
    const timestamp = [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      "-",
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
      "-",
      pad(date.getMilliseconds(), 3)
    ].join("");
    const sourcePrefix = sourceFileStem ? `${sourceFileStem}-` : "";
    return `${sourcePrefix}morf-${timestamp}.png`;
  }

  function downloadBlob(blob, filename, openPreview = false) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    if (openPreview) {
      // Older iOS versions ignore `download`, but can still show the PNG in a
      // new tab where the system image menu offers Save Image / Save to Files.
      link.target = "_blank";
      link.rel = "noopener";
    }
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  exportButton.addEventListener("click", async () => {
    exportButton.disabled = true;
    exportStatus.textContent = "";
    try {
      const blob = await canvasBlob(outputCanvas);
      const filename = exportFilename();
      const file = new File([blob], filename, { type: "image/png" });

      // iOS does not reliably honor programmatic anchor downloads. Its native
      // share sheet exposes system save/share destinations for the PNG file.
      if (isIOS() && navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          return;
        } catch (error) {
          if (error.name === "AbortError") return;
          // If sharing is unavailable at runtime, fall through to a preview.
        }
      }

      downloadBlob(blob, filename, isIOS());
    } catch (error) {
      console.error(error);
      exportStatus.textContent = t("export.error");
    } finally {
      exportButton.disabled = false;
    }
  });

  new ResizeObserver(() => requestAnimationFrame(drawInput)).observe(inputCanvas);

  makeDemoImage();
})();
