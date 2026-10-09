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
let selectedNames = new Set();

// Native textarea resizing sets an inline width. Let the grid follow that width
// so a resized editor does not overlap the adjacent pane.
const editorResize = new ResizeObserver(entries => {
  if (window.matchMedia("(max-width: 640px)").matches) return;
  for (const {target} of entries) {
    if (!target.style.width) continue;
    target.closest(".panes").style.setProperty(`--${target.id}-width`, target.style.width);
    target.style.width = "";
  }
});
editorResize.observe(hieratic);
editorResize.observe(proofglyph);

const tabs = [...document.querySelectorAll('[role="tab"]')];
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
    if (!globalThis.proofglyph) return;
    hieratic.value = document.getElementById(button.dataset.snippet).textContent;
    sourcePath = "examples/browser.ht";
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

function showProofs(entries) {
  result.replaceChildren();
  const proofs = entries.filter(entry => entry.origin === "proven");
  if (!proofs.length) { showText("検査成功（証明済みの宣言はありません）"); return; }
  function card(entry, parent) {
    const article = document.createElement("article");
    article.className = "theorem";
    const heading = document.createElement("h3");
    heading.textContent = entry.name;
    const state = document.createElement("span");
    state.textContent = "検査成功";
    heading.append(state);
    const formula = document.createElement("div");
    formula.className = "formula";
    formula.tabIndex = 0;
    const {latex} = globalThis.proofglyphMath.toLatex(entry.type);
    if (globalThis.katex) {
      try { globalThis.katex.render(latex, formula, {displayMode: true, output: "htmlAndMathml", throwOnError: true, trust: false}); }
      catch (_) { formula.textContent = latex; }
    } else { formula.textContent = latex; }
    article.append(heading, formula);
    parent.append(article);
  }
  const featured = proofs.filter(entry => selectedNames.has(entry.name));
  if (!featured.length) { proofs.forEach(entry => card(entry, result)); return; }
  featured.forEach(entry => card(entry, result));
  const others = proofs.filter(entry => !selectedNames.has(entry.name));
  if (others.length) {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = `補題・定義（${others.length}件）`;
    details.append(summary);
    others.forEach(entry => card(entry, details));
    result.append(details);
  }
}

function check() {
  const checked = (sourcemap ? globalThis.proofglyph.checkMapped : globalThis.proofglyph.check)(proofglyph.value);
  if (checked.ok) showProofs(JSON.parse(checked.entries));
  else showText(`検査失敗\n${checked.output}`);
  status.textContent = checked.ok ? "検査成功" : "検査失敗";
}

function compile() {
  sourcemap = null;
  const compiled = globalThis.proofglyph.compileAt(sourcePath, hieratic.value);
  if (!compiled.ok) {
    proofglyph.value = "";
    showText(compiled.output);
    status.textContent = "コンパイル失敗";
    return;
  }
  proofglyph.value = compiled.output;
  sourcemap = JSON.parse(compiled.sourcemap);
  check();
}

hieratic.addEventListener("input", () => {
  sourcemap = null;
  result.replaceChildren();
  status.textContent = "Hieratic の入力が変更されました。「コンパイルして検査」を実行してください。";
});
proofglyph.addEventListener("input", () => {
  sourcemap = null;
  result.replaceChildren();
  selectedNames = new Set();
  status.textContent = "Proofglyph の入力が変更されました。「記号列を検査」を実行してください。";
});
async function initialize() {
if (globalThis.proofglyph) {
  const sources = new Map(JSON.parse(globalThis.proofglyph.examples)
    .map(entry => [entry.path, entry.source]));
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
      hieratic.value = "";
      sourcePath = "examples/browser.ht";
      proofglyph.value = source;
      check();
    } else {
      sourcePath = path;
      hieratic.value = source;
      compile();
    }
  });

} else {
  status.textContent = "初期化に失敗しました。";
}

}
initialize();
