// The example query opens a sample from the guide. restore updates its editor and guide link.
// run delegates to runner.js (local CLI or browser Wasm) and displays the result.
import { runProgram } from './runner.js';

const english = document.documentElement.lang === 'en';
const messages = english ? {
  loadFailed: 'The JavaScript engine did not load. Try running the example again.',
  runFailed: 'Could not run the program.',
  timedOut: 'Execution stopped after 5 seconds.',
} : {
  loadFailed: 'JavaScript エンジンを読み込めませんでした。もう一度実行してください。',
  runFailed: 'プログラムを実行できませんでした。',
  timedOut: '実行時間が5秒を超えたため停止しました。',
};

const element = (id) => document.getElementById(id);
const source = element('source');
const select = element('example');
const guideLink = element('example-guide');
const guidePage = guideLink.getAttribute('href').split('#')[0];
const output = element('output');
const controls = ['run', 'restore', 'example', 'clear'].map(element);
let examples = [];
let running = false;

function highlight() {
  element('highlight-code').innerHTML = Prism.highlight(source.value + '\n', Prism.languages.javascript, 'javascript');
  syncScroll();
}
function syncScroll() {
  element('highlight').scrollTop = source.scrollTop;
  element('highlight').scrollLeft = source.scrollLeft;
}
function restore() {
  const index = Number(select.value);
  const example = examples[index];
  if (!example) return;
  source.value = example.source;
  source.scrollTop = source.scrollLeft = 0;
  output.textContent = '';
  guideLink.href = `${guidePage}#sample-${index + 1}`;
  highlight();
}
async function run() {
  if (running) return;
  setRunning(true);
  output.textContent = '';
  try {
    output.textContent = await runProgram(source.value, messages);
  } catch (error) {
    output.textContent = error.message;
  } finally {
    setRunning(false);
  }
}

function setRunning(value) {
  running = value;
  source.readOnly = value;
  output.setAttribute('aria-busy', String(value));
  for (const control of controls) control.disabled = value;
}

element('run').addEventListener('click', run);
element('restore').addEventListener('click', restore);
element('clear').addEventListener('click', () => { output.textContent = ''; });
select.addEventListener('change', restore);
source.addEventListener('input', highlight);
source.addEventListener('scroll', syncScroll);
source.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    run();
  }
});
try {
  const response = await fetch(english ? './examples_en.json' : './examples.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  examples = await response.json();
  examples.forEach((example, index) => select.add(new Option(example.label, index)));
  const exampleNumber = new URLSearchParams(location.search).get('example');
  const index = Number(exampleNumber) - 1;
  if (examples[index]) select.value = String(index);
  restore();
} catch (error) {
  output.textContent = error.message;
  element('restore').disabled = true;
}
