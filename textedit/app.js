import { createTextBoundaries, orderedRange } from './text-boundaries.mjs';
import { loadDocument, saveDocument, loadFontSize, FONT_KEY } from './storage.mjs';

const $ = (id) => document.getElementById(id);
const editor = $('editor');
const reader = $('reader');
// Document and selection state. `anchor` is the original start, even in reverse selection.
let text = '';
let mode = 'edit';
let anchor = null;
let selection = null;
const history = [];
let timer;
let composing = false;
let storageBlocked = false;
let adjustingEdge = 'end';
const textBoundaries = createTextBoundaries();
const unitLabels = { paragraph: '段落' };
// Selection edge controls
function adjacentBoundary(at, direction) {
  return textBoundaries.adjacentParagraph(text, at, direction);
}
function selectedEdgePosition() {
  if (adjustingEdge === 'start') return anchor;
  return selection[0] === anchor ? selection[1] : selection[0];
}
function canAdjust(direction, unit) {
  if (!selection) return false;
  const at = selectedEdgePosition(),
    next = adjacentBoundary(at, direction, unit),
    other = at === selection[0] ? selection[1] : selection[0];
  return next !== at && (at < other ? next < other : next > other);
}
const stepButtons = [...document.querySelectorAll('[data-unit]')];
function updateEdges() {
  for (const edge of ['start', 'end'])
    $('adjust-' + edge).setAttribute('aria-pressed', String(adjustingEdge === edge));
  for (const button of stepButtons) {
    const { unit, direction } = button.dataset;
    button.disabled = !canAdjust(Number(direction), unit);
    button.setAttribute(
      'aria-label',
      `${adjustingEdge === 'start' ? '開始' : '終了'}位置を1${unitLabels[unit]}${Number(direction) < 0 ? '前' : '後'}へ`,
    );
  }
}
function showEdge() {
  reader.querySelector('.cursor-' + adjustingEdge)?.scrollIntoView({ block: 'nearest' });
}
function adjustEdge(direction, unit) {
  if (!canAdjust(direction, unit)) return;
  moveCursor(adjustingEdge, adjacentBoundary(selectedEdgePosition(), direction, unit));
  showEdge();
}
for (const edge of ['start', 'end'])
  $('adjust-' + edge).onclick = () => {
    adjustingEdge = edge;
    $('hint').textContent =
      edge === 'start'
        ? '本文をタップして開始位置を移動'
        : '本文をタップして終了位置を移動';
    updateEdges();
    showEdge();
  };
for (const button of stepButtons)
  button.onclick = () =>
    adjustEdge(Number(button.dataset.direction), button.dataset.unit);
// Load the document; failed reads must not overwrite saved data
try {
  text = loadDocument(localStorage);
} catch {
  storageBlocked = true;
  queueMicrotask(() => notify('保存データを読み込めません'));
}
editor.value = text;
function activeTextView() {
  return mode === 'edit' ? editor : reader;
}
function notify(message) {
  $('notice').textContent = message;
  $('notice').classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => $('notice').classList.remove('show'), 2800);
}
function save() {
  if (storageBlocked) {
    notify('保存データを読み込めないため、上書きを停止しています');
    return false;
  }
  try {
    saveDocument(localStorage, text);
    return true;
  } catch {
    notify('保存できません。本文をコピーして保管してください');
    return false;
  }
}

// Undo and control state
function recordUndoSnapshot() {
  history.push({
    text,
    start: editor.selectionStart,
    end: editor.selectionEnd,
    scroll: activeTextView().scrollTop,
  });
  if (history.length > 80) history.shift();
  $('undo').disabled = false;
}
function updateControls() {
  updateEdges();
  $('selection-count').hidden = !selection;
  $('copy-all').disabled = !text.length;
  $('selection-tools').hidden = !selection || selection[0] === selection[1];
  if (selection)
    $('selection-count').textContent =
      `${[...text.slice(...selection)].length.toLocaleString()}文字を選択`;
  $('range-mode').setAttribute('aria-pressed', String(mode === 'range'));
  drawMap();
}
// Selection rendering and cursor geometry
function createCursor(edge) {
  const span = document.createElement('span');
  span.className = `selection-cursor cursor-${edge}`;
  span.dataset.edge = edge;
  span.setAttribute('aria-label', edge === 'start' ? '選択の開始位置' : '選択の終了位置');
  return span;
}
function renderReader() {
  const scrollTop = reader.scrollTop;
  reader.replaceChildren();
  if (selection) {
    const first = selection[0] === anchor ? 'start' : 'end';
    reader.append(document.createTextNode(text.slice(0, selection[0])), createCursor(first));
    const mark = document.createElement('mark');
    mark.textContent = text.slice(...selection);
    reader.append(
      mark,
      createCursor(first === 'start' ? 'end' : 'start'),
      document.createTextNode(text.slice(selection[1])),
    );
  } else if (anchor !== null) {
    reader.append(
      document.createTextNode(text.slice(0, anchor)),
      createCursor('start'),
      document.createTextNode(text.slice(anchor)),
    );
  } else reader.textContent = text;
  reader.scrollTop = scrollTop;
  positionCursors();
}
function positionCursors() {
  const box = reader.getBoundingClientRect();
  for (const marker of reader.querySelectorAll('.selection-cursor')) {
    const at =
      marker.dataset.edge === 'start' ? anchor : selection?.find((pos) => pos !== anchor);
    if (at == null) continue;
    const walker = document.createTreeWalker(reader, NodeFilter.SHOW_TEXT);
    let node,
      remaining = at,
      last = null;
    while ((node = walker.nextNode())) {
      if (!node.length) continue;
      last = node;
      if (remaining < node.length) break;
      remaining -= node.length;
    }
    if (!node) {
      node = last;
      remaining = node?.length || 0;
    }
    if (!node) continue;
    const range = document.createRange();
    range.setStart(node, Math.min(remaining, node.length));
    range.collapse(true);
    let rect = range.getClientRects()[0];
    if (!rect || !rect.height) {
      const offset = Math.min(remaining, node.length);
      range.setStart(node, Math.max(0, offset - 1));
      range.setEnd(node, Math.min(node.length, offset || 1));
      const previous = range.getClientRects()[0];
      if (!previous) continue;
      rect = {
        left: offset ? previous.right : previous.left,
        top: previous.top,
        height: previous.height,
      };
    }
    marker.style.left = `${rect.left - box.left + reader.scrollLeft}px`;
    marker.style.top = `${rect.top - box.top + reader.scrollTop}px`;
    marker.style.height = `${rect.height + 24}px`;
  }
}
function moveCursor(edge, at) {
  if (at === null || anchor === null) return;
  at = textBoundaries.nearest(text, at);
  if (selection) {
    const other = edge === 'start' ? selection.find((pos) => pos !== anchor) : anchor;
    if (at === other) return;
    if (edge === 'start') anchor = at;
    selection = orderedRange(at, other);
  } else if (edge === 'start') anchor = at;
  adjustingEdge = edge;
  keyboardOffset = at;
  renderReader();
  updateControls();
}
// Cursor dragging
let cursorDrag = null,
  suppressCursorClick = false;
reader.addEventListener('pointerdown', (event) => {
  const marker = event.target.closest('.selection-cursor');
  if (!marker || event.button !== 0) return;
  event.preventDefault();
  cursorDrag = { id: event.pointerId, edge: marker.dataset.edge };
  suppressCursorClick = true;
  reader.setPointerCapture(event.pointerId);
});
reader.addEventListener('pointermove', (event) => {
  if (cursorDrag?.id !== event.pointerId) return;
  event.preventDefault();
  const box = reader.getBoundingClientRect();
  if (event.clientY < box.top + 30) reader.scrollTop -= 18;
  else if (event.clientY > box.bottom - 30) reader.scrollTop += 18;
  reader.classList.add('cursor-hit-test');
  const at = textOffsetAtPoint({
    clientX: Math.max(box.left + 1, Math.min(box.right - 1, event.clientX)),
    clientY: Math.max(box.top + 1, Math.min(box.bottom - 1, event.clientY)),
  });
  reader.classList.remove('cursor-hit-test');
  moveCursor(cursorDrag.edge, at);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
  reader.addEventListener(type, (event) => {
    if (cursorDrag?.id !== event.pointerId) return;
    cursorDrag = null;
    if (reader.hasPointerCapture(event.pointerId))
      reader.releasePointerCapture(event.pointerId);
    setTimeout(() => {
      suppressCursorClick = false;
    }, 0);
  });
reader.addEventListener(
  'click',
  (event) => {
    if (suppressCursorClick) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  },
  true,
);
// Selection mode and text hit testing
function setMode(next) {
  const previous = activeTextView();
  const ratio =
    previous.scrollTop / Math.max(1, previous.scrollHeight - previous.clientHeight);
  mode = next;
  keyboardOffset = editor.selectionStart;
  anchor = null;
  selection = null;
  editor.hidden = next !== 'edit';
  reader.hidden = next === 'edit';
  $('done').hidden = next === 'edit';
  document.querySelector('.mode-bar').hidden = next === 'edit';
  $('hint').textContent = '開始位置をタップ';
  if (next !== 'edit') {
    editor.blur();
    renderReader();
  }
  activeTextView().scrollTop = ratio * Math.max(0, activeTextView().scrollHeight - activeTextView().clientHeight);
  updateControls();
}
function textOffsetAtPoint(event) {
  let node, offset;
  if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(event.clientX, event.clientY);
    node = pos?.offsetNode;
    offset = pos?.offset;
  } else {
    const pos = document.caretRangeFromPoint?.(event.clientX, event.clientY);
    node = pos?.startContainer;
    offset = pos?.startOffset;
  }
  if (!node || !reader.contains(node)) return null;
  const range = document.createRange();
  range.selectNodeContents(reader);
  range.setEnd(node, offset);
  return Math.min(text.length, range.toString().length);
}
let keyboardOffset = 0;
function selectAt(at) {
  if (at === null) return;
  if (selection) {
    moveCursor(adjustingEdge, at);
    return;
  }
  at = textBoundaries.nearest(text, at);
  keyboardOffset = at;
  if (anchor === null) {
    anchor = at;
    selection = null;
    $('hint').textContent = 'スクロールして終了位置をタップ';
  } else {
    selection = orderedRange(anchor, at);
    if (selection[0] === selection[1]) {
      selection = null;
      $('hint').textContent = '別の位置をタップして範囲を選択';
    } else {
      adjustingEdge = 'end';
      $('hint').textContent = '選択を保持中';
    }
  }
  renderReader();
  updateControls();
}
reader.addEventListener('click', (event) => selectAt(textOffsetAtPoint(event)));
reader.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    selectAt(keyboardOffset);
    return;
  }
  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    if (event.key === 'Home') keyboardOffset = 0;
    else if (event.key === 'End') keyboardOffset = text.length;
    else if (event.key === 'ArrowRight')
      keyboardOffset += text.codePointAt(keyboardOffset) > 65535 ? 2 : 1;
    else
      keyboardOffset -=
        keyboardOffset > 1 && /[\uDC00-\uDFFF]/.test(text[keyboardOffset - 1]) ? 2 : 1;
    keyboardOffset = Math.max(0, Math.min(text.length, keyboardOffset));
    $('hint').textContent = `${keyboardOffset}文字目・Enterで位置を指定`;
  }
});
// A scroll gesture must not become a selection tap.
let pointerStart = null;
reader.addEventListener('pointerdown', (event) => {
  pointerStart = [event.clientX, event.clientY, reader.scrollTop];
});
reader.addEventListener(
  'click',
  (event) => {
    if (
      pointerStart &&
      (Math.abs(event.clientY - pointerStart[1]) > 12 ||
        Math.abs(reader.scrollTop - pointerStart[2]) > 5)
    ) {
      event.stopImmediatePropagation();
    }
    pointerStart = null;
  },
  true,
);
$('range-mode').onclick = () => setMode(mode === 'range' ? 'edit' : 'range');
$('done').onclick = () => setMode('edit');
$('reset-selection').onclick = () => {
  if (!selection) return;
  selection = null;
  $('hint').textContent = '開始位置を保持しています。終了位置をタップ';
  renderReader();
  updateControls();
  reader.focus({ preventScroll: true });
};
// Clipboard and editing actions
async function copyText(value, successMessage) {
  try {
    await navigator.clipboard.writeText(value);
    notify(successMessage);
    return true;
  } catch {
    notify('コピーできません。編集画面で標準のコピーをお使いください');
    return false;
  }
}
$('copy-all').onclick = () => {
  if (text.length) return copyText(text, '全文をコピーしました');
};
async function copySelection() {
  if (!selection) return false;
  return copyText(text.slice(...selection), 'コピーしました');
}
function removeSelection() {
  if (!selection) return;
  recordUndoSnapshot();
  const start = selection[0],
    end = selection[1];
  text = text.slice(0, start) + text.slice(end);
  editor.value = text;
  setMode('edit');
  editor.setSelectionRange(start, start);
  save();
  updateControls();
  notify('削除しました。「元に戻す」で戻せます');
}
$('copy').onclick = copySelection;
$('delete').onclick = removeSelection;
$('cut').onclick = async () => {
  const original = text,
    range = selection?.slice();
  if (await copySelection()) {
    if (
      text === original &&
      selection &&
      selection[0] === range[0] &&
      selection[1] === range[1]
    )
      removeSelection();
  }
};
editor.addEventListener('beforeinput', () => {
  if (!composing) recordUndoSnapshot();
});
editor.addEventListener('compositionstart', () => {
  recordUndoSnapshot();
  composing = true;
});
editor.addEventListener('compositionend', () => {
  composing = false;
  text = editor.value;
  save();
  updateControls();
});
editor.addEventListener('input', () => {
  text = editor.value;
  if (!composing) save();
  updateControls();
});
$('undo').onclick = () => {
  const item = history.pop();
  if (!item) return;
  text = item.text;
  editor.value = text;
  setMode('edit');
  editor.setSelectionRange(item.start, item.end);
  editor.scrollTop = item.scroll;
  $('undo').disabled = !history.length;
  save();
  updateControls();
  notify('元に戻しました');
};
editor.addEventListener('keydown', (event) => {
  if (
    (event.metaKey || event.ctrlKey) &&
    event.key.toLowerCase() === 'z' &&
    !event.shiftKey
  ) {
    event.preventDefault();
    $('undo').click();
  }
});
// Document minimap
function drawMap() {
  const el = activeTextView(),
    max = Math.max(0, el.scrollHeight - el.clientHeight),
    ratio = max ? el.scrollTop / max : 0;
  $('scroll').value = String(Math.round(ratio * 1000));
  const viewRatio = Math.min(1, el.clientHeight / Math.max(1, el.scrollHeight));
  $('viewport').style.height = `${viewRatio * 100}%`;
  $('viewport').style.top = `${ratio * (1 - viewRatio) * 100}%`;
  $('map-selection').hidden = !selection;
  if (selection) {
    $('map-selection').style.top = `${(selection[0] / Math.max(1, text.length)) * 100}%`;
    $('map-selection').style.height =
      `${Math.max(0.5, ((selection[1] - selection[0]) / Math.max(1, text.length)) * 100)}%`;
  }
  const canvas = $('map'),
    rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * 2;
  canvas.height = rect.height * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  const lines = text.split('\n'),
    step = Math.min(5, (rect.height - 16) / Math.max(1, lines.length));
  lines.forEach((line, i) => {
    if (!line) return;
    ctx.fillStyle = line.startsWith('#') ? '#6b7897' : '#c0c7d4';
    ctx.fillRect(5, 6 + i * step, Math.min(rect.width - 10, line.length * 0.65), 1.3);
  });
}
editor.addEventListener('scroll', drawMap);
reader.addEventListener('scroll', drawMap);
$('scroll').addEventListener('input', () => {
  const el = activeTextView();
  el.scrollTop = (Number($('scroll').value) / 1000) * (el.scrollHeight - el.clientHeight);
  drawMap();
});
// Font preferences and dialog
let fontSize = 18;
try {
  fontSize = loadFontSize(localStorage);
} catch {}
function applyFontSize(value) {
  const el = activeTextView(),
    ratio = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
  fontSize = value;
  document.documentElement.style.setProperty('--editor-font-size', `${value / 16}rem`);
  $('font-smaller').disabled = value <= 14;
  $('font-larger').disabled = value >= 28;
  $('font-size').value = String(value);
  $('font-value').textContent = `${value}px`;
  el.scrollTop = ratio * Math.max(0, el.scrollHeight - el.clientHeight);
  drawMap();
  positionCursors();
}
$('font-settings').onclick = () => $('font-dialog').showModal();
$('font-close').onclick = () => $('font-dialog').close();
document.querySelectorAll('dialog').forEach((dialog) => {
  let startedOutside = false;
  const isOutside = (event) => {
    const rect = dialog.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  };
  dialog.addEventListener('pointerdown', (event) => {
    startedOutside = event.target === dialog && isOutside(event);
  });
  dialog.addEventListener('pointercancel', () => {
    startedOutside = false;
  });
  dialog.addEventListener('close', () => {
    startedOutside = false;
  });
  dialog.addEventListener('click', (event) => {
    if (startedOutside && event.target === dialog && isOutside(event)) dialog.close();
    startedOutside = false;
  });
});
function changeFontSize(value) {
  applyFontSize(Math.max(14, Math.min(28, value)));
  try {
    localStorage.setItem(FONT_KEY, String(fontSize));
  } catch {
    notify('文字サイズは今回のみ適用されます');
  }
}
$('font-size').addEventListener('input', () =>
  changeFontSize(Number($('font-size').value)),
);
$('font-smaller').onclick = () => changeFontSize(fontSize - 1);
$('font-larger').onclick = () => changeFontSize(fontSize + 1);
// Initial layout and browser integration
applyFontSize(fontSize);
new ResizeObserver(() => {
  drawMap();
  positionCursors();
}).observe(document.querySelector('.workspace'));
function fitKeyboard() {
  document.documentElement.style.setProperty(
    '--app-height',
    `${window.visualViewport?.height || window.innerHeight}px`,
  );
}
window.visualViewport?.addEventListener('resize', fitKeyboard);
fitKeyboard();
window.addEventListener('pagehide', save);
updateControls();
if (document.modelContext?.registerTool) {
  try {
    Promise.resolve(
      document.modelContext.registerTool({
        name: 'read_document',
        description: '現在の本文を読み取ります。',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute(input) {
          if (!input || typeof input !== 'object' || Object.keys(input).length)
            throw new Error('引数は空のオブジェクトで指定してください');
          return { text };
        },
      }),
    ).catch(() => {});
  } catch {}
}
