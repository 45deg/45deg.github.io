"use strict";
const example = document.getElementById("example");
let sourcemap = null;
let sourcePath = "examples/browser.ht";
const hieratic = document.getElementById("hieratic");
const proofglyph = document.getElementById("proofglyph");
const result = document.getElementById("result");
const status = document.getElementById("status");
const compileButton = document.getElementById("compile");
const checkButton = document.getElementById("check");
const instructionCount = document.getElementById("instruction-count");
function updateInstructionCount() {
  // Match the reader's tokens; an incomplete/unknown token has no valid count.
  const tokens = /[ \t\r\n]+|[$#][0-9]+|[*^>\\@:!]/gy;
  const source = proofglyph.value;
  let count = 0;
  while (tokens.lastIndex < source.length) {
    const token = tokens.exec(source);
    if (!token) {
      instructionCount.textContent = "命令数: —（記号列が不正）";
      return;
    }
    if (!/^[ \t\r\n]/.test(token[0])) count++;
  }
  instructionCount.textContent = `命令数: ${count.toLocaleString("ja-JP")}`;
}
function setProofglyph(source) {
  proofglyph.value = source;
  updateInstructionCount();
}
updateInstructionCount();
let selectedNames = new Set();
const compiler = new ProofglyphWorker();
const cancelButton = document.getElementById("cancel");
let initialized = false;
let operation = 0;

const fileTabs = document.getElementById("file-tabs");
const filePath = document.getElementById("file-path");
const filePanel = document.getElementById("file-panel");
const sources = new Map([[sourcePath, hieratic.value]]);
const editorStates = new Map();
let activePath = sourcePath;
let openPaths = [sourcePath];

function saveFile() {
  sources.set(activePath, hieratic.value);
  editorStates.set(activePath, {
    start: hieratic.selectionStart, end: hieratic.selectionEnd,
    top: hieratic.scrollTop, left: hieratic.scrollLeft
  });
}
function projectJSON() {
  return JSON.stringify([...sources].map(([path, source]) => ({path, source})));
}
function selectFile(path, focus = false, persist = true) {
  if (persist) saveFile();
  activePath = path;
  hieratic.value = sources.get(path) ?? "";
  const state = editorStates.get(path);
  hieratic.setSelectionRange(state?.start ?? 0, state?.end ?? 0);
  hieratic.scrollTop = state?.top ?? 0;
  hieratic.scrollLeft = state?.left ?? 0;
  filePath.textContent = path;
  for (const tab of fileTabs.children) {
    const selected = tab.dataset.path === path;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected) {
      filePanel.setAttribute("aria-labelledby", tab.id);
      hieratic.setAttribute("aria-label", `Hieratic: ${path}`);
      if (focus) {
        tab.focus();
        tab.scrollIntoView({block: "nearest", inline: "nearest"});
      }
    }
  }
}
function renderFileTabs() {
  fileTabs.replaceChildren();
  openPaths.forEach((path, index) => {
    const tab = document.createElement("button");
    tab.id = `file-tab-${index}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "file-panel");
    tab.dataset.path = path;
    tab.textContent = path.split("/").pop();
    tab.title = path === sourcePath ? `${path} (entry file)` : path;
    tab.addEventListener("click", () => selectFile(path));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % openPaths.length;
      if (event.key === "ArrowLeft") next = (index + openPaths.length - 1) % openPaths.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = openPaths.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectFile(openPaths[next], true);
    });
    fileTabs.append(tab);
  });
  selectFile(activePath, false, false);
}
function openProject(path, source) {
  saveFile();
  sourcePath = path;
  activePath = path;
  openPaths = [path];
  sources.set(path, source);
  hieratic.value = source;
  renderFileTabs();
}

const panes = hieratic.closest(".panes");

// Native resizing sets inline dimensions. Share height and let the grid follow width.
const editorResize = new ResizeObserver(entries => {
  for (const {target} of entries) {
    if (target.style.height) {
      const navigationHeight = target === proofglyph && !window.matchMedia("(max-width: 640px)").matches
        ? document.getElementById("editor-navigation").getBoundingClientRect().height : 0;
      panes.style.setProperty("--editor-height", `${Math.max(160, parseFloat(target.style.height) - navigationHeight)}px`);
      target.style.height = "";
    }
    if (target.style.width && !window.matchMedia("(max-width: 640px)").matches) {
      panes.style.setProperty(`--${target.id}-width`, target.style.width);
      target.style.width = "";
    }
  }
});
editorResize.observe(hieratic);
editorResize.observe(proofglyph);

const tabs = [...document.querySelectorAll('.app-header [role="tab"]')];
function selectTab(id, focus = false) {
  const active = tabs.find(tab => tab.getAttribute("aria-controls") === id);
  if (!active) return;
  for (const tab of tabs) {
    const selected = tab === active;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
  }
  if (focus) active.focus();
}
function selectHashTab() {
  const target = document.getElementById(location.hash.slice(1));
  const panel = target?.closest('[role="tabpanel"]');
  selectTab(panel?.id || "workspace");
}
function activateTab(id, focus = false) {
  selectTab(id, focus);
  if (location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab.getAttribute("aria-controls")));
  tab.addEventListener("keydown", event => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    const id = tabs[next].getAttribute("aria-controls");
    activateTab(id, true);
  });
});
window.addEventListener("hashchange", selectHashTab);
selectHashTab();

document.querySelectorAll("[data-snippet]").forEach(button => {
  button.addEventListener("click", () => {
    if (!initialized) return;
    openProject("examples/browser.ht", document.getElementById(button.dataset.snippet).textContent);
    selectedNames = new Set();
    example.value = "";
    compile();
    activateTab("workspace");
    hieratic.focus();
  });
});

function showText(text) {
  const pre = document.createElement("pre");
  pre.textContent = text;
  result.replaceChildren(pre);
}

const formulaObserver = new ResizeObserver(records => {
  for (const {target} of records) {
    target.style.fontSize = "14px";
    const math = target.querySelector(".katex-html");
    const width = math ? Math.max(math.scrollWidth, math.getBoundingClientRect().width) : target.scrollWidth;
    const available = target.clientWidth - 4;
    if (width > available && available > 0) target.style.fontSize = `${14 * available / width}px`;
  }
});

function showProofs(entries) {
  formulaObserver.disconnect();
  result.replaceChildren();
  const proofs = entries;
  if (!proofs.length) { showText("検査成功（証明済みの宣言はありません）"); return; }
  function card(entry, parent) {
    const article = document.createElement("article");
    article.className = "theorem";
    const heading = document.createElement("h3");
    heading.textContent = `${entry.declarationKind ?? (entry.origin === "assumption" ? "前提" : "証明済み")} ${entry.name}`;
    const state = document.createElement("span");
    state.textContent = "検査成功";
    heading.append(state);
    const formula = document.createElement("div");
    formula.className = "formula";
    formula.tabIndex = 0;
    const {latex} = globalThis.proofglyphMath.toLatex(entry.surfaceType ?? entry.type);
    if (globalThis.katex) {
      try { globalThis.katex.render(latex, formula, {displayMode: true, output: "htmlAndMathml", throwOnError: true, trust: false}); }
      catch (_) { formula.textContent = latex; }
    } else { formula.textContent = latex; }
    article.append(heading, formula);
    parent.append(article);
    formulaObserver.observe(formula);
  }
  const featured = proofs.filter(entry => selectedNames.has(entry.name));
  if (!featured.length) { proofs.forEach(entry => card(entry, result)); return; }
  featured.forEach(entry => card(entry, result));
  const others = proofs.filter(entry => !selectedNames.has(entry.name));
  if (others.length) {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = `その他の宣言（${others.length}件）`;
    details.append(summary);
    others.forEach(entry => card(entry, details));
    result.append(details);
  }
}

function setBusy(busy, kind) {
  if (busy) {
    const button = kind === "compile" ? compileButton : checkButton;
    button.insertAdjacentElement("afterend", cancelButton);
  }
  compileButton.disabled = busy;
  checkButton.disabled = busy;
  if (!busy && document.activeElement === cancelButton) {
    cancelButton.previousElementSibling.focus();
  }
  cancelButton.hidden = !busy;
  result.setAttribute("aria-busy", String(busy));
}
function cancelOperation() {
  if (!initialized) return;
  operation++;
  compiler.cancel();
  setBusy(false);
}
cancelButton.addEventListener("click", () => {
  cancelOperation();
  status.textContent = "処理を中止しました。";
});
async function run(kind) {
  cancelOperation();
  const current = operation;
  saveFile();
  const request = kind === "compile"
    ? {kind, path: sourcePath, files: projectJSON()}
    : {kind, source: proofglyph.value, mapped: Boolean(sourcemap)};
  if (kind === "compile") sourcemap = null;
  setBusy(true, kind);
  result.replaceChildren();
  status.textContent = kind === "compile" ? "コンパイル・検査中…" : "検査中…";
  try {
    const response = await compiler.request(request);
    if (current !== operation) return;
    if (response.files?.ok) {
      openPaths = JSON.parse(response.files.output);
      if (!openPaths.includes(activePath)) activePath = sourcePath;
      renderFileTabs();
    }
    if (response.compiled) {
      const compiled = response.compiled;
      if (!compiled.ok) {
        setProofglyph("");
        showText(compiled.output);
        status.textContent = "コンパイル失敗";
        return;
      }
      setProofglyph(compiled.output);
      sourcemap = JSON.parse(compiled.sourcemap);
    }
    const checked = response.checked;
    if (checked.ok) showProofs(JSON.parse(checked.entries));
    else showText(`検査失敗\n${checked.output}`);
    status.textContent = checked.ok ? "検査成功" : "検査失敗";
  } catch (error) {
    if (current !== operation) return;
    showText(error.message);
    status.textContent = "処理に失敗しました。再実行してください。";
  } finally {
    if (current === operation) setBusy(false);
  }
}
function check() { return run("check"); }
function compile() { return run("compile"); }

hieratic.addEventListener("input", () => {
  cancelOperation();
  saveFile();
  sourcemap = null;
  result.replaceChildren();
  status.textContent = "Hieratic の入力が変更されました。「コンパイルして検査」を実行してください。";
});
proofglyph.addEventListener("input", () => {
  updateInstructionCount();
  cancelOperation();
  sourcemap = null;
  result.replaceChildren();
  selectedNames = new Set();
  status.textContent = "Proofglyph の入力が変更されました。「記号列を検査」を実行してください。";
});
async function initialize() {
try {
  const {examples} = await compiler.request({kind: "examples"});
  for (const {path, source} of JSON.parse(examples)) {
    if (!sources.has(path)) sources.set(path, source);
  }
  initialized = true;
  compileButton.disabled = false;
  checkButton.disabled = false;
  compileButton.addEventListener("click", compile);
  checkButton.addEventListener("click", check);
  compile();
  let catalog;
  try {
    const response = await fetch("catalog.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    catalog = await response.json();
  } catch (error) {
    status.textContent = `カタログの読み込みに失敗しました: ${error.message}`;
    return;
  }
  function addGroup(label, prefix, items) {
    const group = document.createElement("optgroup");
    group.label = label;
    for (const [name, key] of items) {
      const option = document.createElement("option");
      option.value = JSON.stringify([prefix, ...key]);
      option.textContent = name;
      group.append(option);
    }
    example.append(group);
  }
  const subjects = new Map();
  for (const [name, matches] of Object.entries(catalog.proofs)) {
    const separator = name.indexOf("：");
    const subject = separator < 0 ? "証明例" : name.slice(0, separator);
    const title = separator < 0 ? name : name.slice(separator + 1);
    if (!subjects.has(subject)) subjects.set(subject, []);
    const paths = [...new Set(matches.map(match => match.path))];
    for (const path of paths) {
      const index = matches.findIndex(match => match.path === path);
      const label = paths.length === 1 ? title : `${title}（${matches[index].name}）`;
      subjects.get(subject).push([label, [name, index]]);
    }
  }
  for (const [subject, items] of subjects) addGroup(subject, "proof", items);
  example.disabled = false;
  example.addEventListener("change", () => {
    if (!example.value) return;
    const [, name, index] = JSON.parse(example.value);
    const path = catalog.proofs[name][index].path;
    const source = sources.get(path);
    if (source === undefined) {
      status.textContent = `ソースが見つかりません: ${path}`;
      return;
    }
    result.replaceChildren();
    selectedNames = new Set(catalog.proofs[name].filter(match => match.path === path).map(match => match.name));
    if (path.endsWith(".pg")) {
      sourcemap = null;
      openProject("examples/browser.ht", "");
      setProofglyph(source);
      check();
    } else {
      openProject(path, source);
      compile();
    }
  });

} catch (error) {
  status.textContent = `初期化に失敗しました: ${error.message}`;
}

}
initialize();
