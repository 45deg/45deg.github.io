const source = document.querySelector('#source');
const editorWrap = document.querySelector('#editor-wrap');
const editorHost = document.querySelector('#cm-editor');
const numbers = document.querySelector('#line-numbers');
const picker = document.querySelector('#examples');
const checkButton = document.querySelector('#check');
const runButton = document.querySelector('#run');
const stopButton = document.querySelector('#stop');
let pythonWorker;
const results = document.querySelector('#results');
const status = document.querySelector('#status');
const sourceMeta = document.querySelector('#source-meta');
const pages = {
  playground: document.querySelector('#playground-page'),
  about: document.querySelector('#about-page'),
};
const navigationLinks = [...document.querySelectorAll('[data-route]')];
let busy = false;
let checker;
let editor;
const MAX_SOURCE_BYTES = 64 * 1024;

function showRoute() {
  const requested = location.hash.slice(1);
  const route = Object.hasOwn(pages, requested) ? requested : 'playground';
  for (const [name, page] of Object.entries(pages)) page.hidden = name !== route;
  for (const link of navigationLinks) {
    if (link.dataset.route === route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}
window.addEventListener('hashchange', showRoute);
showRoute();

function getSource() {
  return editor ? editor.state.doc.toString() : source.value;
}

function setSource(value) {
  source.value = value;
  if (editor) {
    editor.dispatch({changes: {from: 0, to: editor.state.doc.length, insert: value}});
  }
  updateEditor();
}

async function loadCodeMirror() {
  const [{EditorView, basicSetup}, {python}] = await Promise.all([
    import('codemirror'),
    import('@codemirror/lang-python'),
  ]);
  const theme = EditorView.theme({
    '&': {height: '100%', fontSize: '13px', backgroundColor: '#fff', color: '#24352a'},
    '.cm-scroller': {overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', lineHeight: '1.65'},
    '.cm-content': {padding: '17px 0', minHeight: '100%'},
    '.cm-gutters': {backgroundColor: '#f7f9f7', border: 'none', color: '#9ca9a0'},
    '.cm-lineNumbers .cm-gutterElement': {minWidth: '38px', padding: '0 10px 0 8px'},
    '.cm-activeLine': {backgroundColor: '#f7f9f7'},
    '.cm-activeLineGutter': {backgroundColor: '#f0f4f0'},
  });
  const view = new EditorView({
    doc: source.value,
    parent: editorHost,
    extensions: [basicSetup, python(), EditorView.lineWrapping, theme, EditorView.updateListener.of(update => {
      if (update.docChanged) updateEditor();
    })],
  });
  view.contentDOM.setAttribute('aria-label', 'DepPy code');
  view.dom.addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.stopPropagation();
      check();
    }
  }, true);
  editor = view;
  editorWrap.classList.add('cm-ready');
  updateEditor();
}

async function loadChecker() {
  const response = await fetch('./checker.wasm');
  if (!response.ok) throw new Error('Checker unavailable. Run the build script first.');
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer());
  checker = instance.exports;
}

function analyze(sourceText) {
  const input = new TextEncoder().encode(sourceText);
  if (input.length > MAX_SOURCE_BYTES) throw new Error('Source must be under 64 KiB.');
  const inputPtr = checker.allocate(input.length);
  try {
    new Uint8Array(checker.memory.buffer, inputPtr, input.length).set(input);
    const packed = checker.check(inputPtr, input.length);
    const outputPtr = Number(packed & 0xffffffffn);
    const outputLength = Number(packed >> 32n);
    try {
      const output = new Uint8Array(checker.memory.buffer, outputPtr, outputLength);
      return JSON.parse(new TextDecoder().decode(output));
    } finally {
      checker.release(outputPtr, outputLength);
    }
  } finally {
    checker.release(inputPtr, input.length);
  }
}

function updateEditor() {
  const value = getSource();
  const count = value.split('\n').length;
  if (!editor) numbers.textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');
  sourceMeta.textContent = `${count} ${count === 1 ? 'line' : 'lines'} · ${new TextEncoder().encode(value).length.toLocaleString()} bytes`;
}

function setStatus(label, kind) {
  status.textContent = label;
  status.className = `status ${kind}`;
}

function textElement(tag, className, value) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = value;
  return element;
}

function locationFor(byteOffset) {
  const bytes = new TextEncoder().encode(getSource());
  const prefix = new TextDecoder().decode(bytes.slice(0, byteOffset));
  const lines = prefix.split('\n');
  return { line: lines.length, column: lines.at(-1).length + 1 };
}

function focusOffset(byteOffset) {
  const bytes = new TextEncoder().encode(getSource());
  const prefix = new TextDecoder().decode(bytes.slice(0, byteOffset));
  if (editor) {
    editor.dispatch({selection: {anchor: prefix.length}, scrollIntoView: true});
    editor.focus();
    return;
  }
  source.focus();
  source.setSelectionRange(prefix.length, prefix.length);
  const line = prefix.split('\n').length - 1;
  source.scrollTop = Math.max(0, line - 4) * parseFloat(getComputedStyle(source).lineHeight);
}

function sourceSlice(start, end) {
  const bytes = new TextEncoder().encode(getSource());
  return new TextDecoder().decode(bytes.slice(start, end)).trim();
}

function detailBlock(label, value) {
  const block = document.createElement('div');
  block.className = 'proof-block';
  block.append(textElement('h4', '', label));
  block.append(textElement('pre', '', value));
  return block;
}

function renderDeclarations(declarations) {
  if (!declarations.length) return;
  results.append(textElement('h3', 'goals-heading', `Checked declarations · ${declarations.length}`));
  for (const declaration of declarations) {
    const details = document.createElement('details');
    details.className = 'proof-detail';
    const summary = document.createElement('summary');
    summary.append(textElement('strong', 'proof-name', declaration.name));
    summary.append(textElement('span', 'proof-kind', declaration.kind));
    const badge = declaration.verifiedSpec
      ? 'VC proved'
      : declaration.axioms.length
        ? `${declaration.axioms.length} ${declaration.axioms.length === 1 ? 'axiom' : 'axioms'}`
        : 'Axiom-free';
    summary.append(textElement('span', declaration.axioms.length ? 'proof-axioms has-axioms' : 'proof-axioms', badge));
    details.append(summary);
    const content = document.createElement('div');
    content.className = 'proof-content';
    const snippet = sourceSlice(declaration.start, declaration.end);
    if (snippet) content.append(detailBlock('Source', snippet));
    content.append(detailBlock('Kernel type', declaration.type));
    content.append(detailBlock('Kernel term', declaration.term || 'Assumed axiom; no proof term.'));
    if (declaration.verifiedSpec) {
      content.append(detailBlock('Verification theorem', declaration.verifiedSpec.type));
      content.append(detailBlock('Verification proof', declaration.verifiedSpec.term || 'No proof term.'));
    }
    if (declaration.axioms.length) content.append(detailBlock('Declaration axioms', declaration.axioms.join('\n')));
    details.append(content);
    results.append(details);
  }
}

function renderAnalysis(data) {
  results.replaceChildren();
  if (data.checked) {
    setStatus('Passed', 'success');
    const count = data.declarations?.length || 0;
    const card = textElement('div', 'summary success-summary', `✓ ${count} ${count === 1 ? 'declaration' : 'declarations'} checked`);
    results.append(card);
    renderDeclarations(data.declarations || []);
  } else {
    setStatus('Failed', 'failure');
    results.append(textElement('div', 'summary failure-summary', `${data.diagnostics.length} ${data.diagnostics.length === 1 ? 'issue' : 'issues'} found`));
  }
  for (const diagnostic of data.diagnostics) {
    const position = diagnostic.line && diagnostic.column
      ? { line: diagnostic.line, column: diagnostic.column }
      : locationFor(diagnostic.start || 0);
    const card = document.createElement('button');
    card.className = 'diagnostic';
    card.type = 'button';
    card.append(textElement('span', 'diagnostic-location', `Line ${position.line}, column ${position.column} · ${diagnostic.kind}`));
    card.append(textElement('span', 'diagnostic-message', diagnostic.message));
    if (diagnostic.expected && diagnostic.actual) {
      card.append(textElement('span', 'diagnostic-detail', `Expected: ${diagnostic.expected} · Actual: ${diagnostic.actual}`));
    }
    card.addEventListener('click', () => focusOffset(diagnostic.start || 0));
    results.append(card);
  }
  if (data.goals.length) {
    results.append(textElement('h3', 'goals-heading', `Open goals · ${data.goals.length}`));
    for (const goal of data.goals) {
      const card = document.createElement('div');
      card.className = 'goal';
      card.append(textElement('strong', '', goal.name));
      card.append(textElement('code', '', `⊢ ${goal.expected}`));
      if (goal.context.length) card.append(textElement('p', '', goal.context.map(item => `${item.name}: ${item.type}`).join(' · ')));
      results.append(card);
    }
  }
}

function finishRun() {
  pythonWorker?.terminate();
  pythonWorker = undefined;
  busy = false;
  runButton.disabled = false;
  checkButton.disabled = !checker;
  stopButton.hidden = true;
}

function runPython() {
  if (busy) return;
  const code = getSource();
  if (new TextEncoder().encode(code).length > MAX_SOURCE_BYTES) {
    setStatus('Error', 'failure');
    results.replaceChildren(textElement('p', 'request-error', 'Source must be under 64 KiB.'));
    return;
  }
  busy = true;
  runButton.disabled = true;
  checkButton.disabled = true;
  stopButton.hidden = false;
  setStatus('Loading Python…', 'loading');
  const output = textElement('pre', 'python-output', '');
  results.replaceChildren(textElement('p', '', 'Python execution · proofs are not checked'), output);
  try {
    pythonWorker = new Worker('./python-worker.js', {type: 'module'});
    pythonWorker.onmessage = ({data}) => {
      if (data.type === 'output') {
        // Bound rendered output for accidental print loops.
        if (output.textContent.length < 100000) output.textContent += data.text.slice(0, 10000) + '\n';
      } else if (data.type === 'running') {
        setStatus('Running…', 'loading');
      } else {
        if (data.type === 'error') output.textContent += data.text;
        else if (!output.textContent) output.textContent = 'Completed without output. Use print() to display a result.';
        setStatus(data.type === 'done' ? 'Completed' : 'Execution error', data.type === 'done' ? 'success' : 'failure');
        finishRun();
      }
    };
    pythonWorker.onerror = event => {
      output.textContent += event.message || 'Python worker could not load.';
      setStatus('Execution error', 'failure');
      finishRun();
    };
    pythonWorker.postMessage(code);
  } catch (error) {
    output.textContent = error.message;
    setStatus('Execution error', 'failure');
    finishRun();
  }
}

runButton.addEventListener('click', runPython);
stopButton.addEventListener('click', () => {
  finishRun();
  setStatus('Stopped', 'idle');
});

async function check() {
  if (busy || !checker) return;
  busy = true;
  checkButton.disabled = true;
  runButton.disabled = true;
  setStatus('Checking…', 'loading');
  results.replaceChildren(textElement('p', 'working', 'Checking…'));
  try {
    renderAnalysis(analyze(getSource()));
  } catch (error) {
    setStatus('Error', 'failure');
    results.replaceChildren(textElement('p', 'request-error', error.message));
  } finally {
    busy = false;
    checkButton.disabled = false;
    runButton.disabled = false;
  }
}

source.addEventListener('input', updateEditor);
source.addEventListener('scroll', () => { numbers.scrollTop = source.scrollTop; });
source.addEventListener('keydown', event => {
  if (event.key === 'Tab') {
    event.preventDefault();
    const start = source.selectionStart;
    source.setRangeText('    ', start, source.selectionEnd, 'end');
    updateEditor();
  }
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    check();
  }
});
checkButton.addEventListener('click', check);
picker.addEventListener('change', () => {
  if (pythonWorker) finishRun();
  if (picker.value && picker.value in examples) {
    setSource(examples[picker.value].source);
    setStatus('Ready', 'idle');
    results.replaceChildren(textElement('div', 'empty-state', 'Run a check to see results.'));
  }
});

let examples = {};
checkButton.disabled = true;
Promise.all([fetch('./examples.json?v=10').then(response => {
  if (!response.ok) throw new Error('Examples unavailable.');
  return response.json();
}), loadChecker()]).then(([data]) => {
  examples = data;
  picker.replaceChildren();
  const groups = new Map();
  for (const [key, value] of Object.entries(examples)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = value.label;
    const groupName = value.group || 'Examples';
    if (!groups.has(groupName)) {
      const group = document.createElement('optgroup');
      group.label = groupName;
      groups.set(groupName, group);
      picker.append(group);
    }
    groups.get(groupName).append(option);
  }
  picker.value = 'basics';
  setSource(examples.basics.source);
  checkButton.disabled = busy;
}).catch(error => {
  picker.replaceChildren(new Option('Unavailable', ''));
  setStatus('Error', 'failure');
  results.replaceChildren(textElement('p', 'request-error', error.message));
});
loadCodeMirror().catch(error => {
  console.warn('CodeMirror CDN unavailable; using the plain-text editor.', error);
});
