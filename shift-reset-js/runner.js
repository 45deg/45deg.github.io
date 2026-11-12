// Pages serves this module as runner.js. Cache the compiled engine for the page
// and give each execution a worker that can be stopped independently.
const LOAD_TIMEOUT_MS = 30_000;
const RUN_TIMEOUT_MS = 5_000;
let engine;

async function loadEngine() {
  const response = await fetch(new URL('./engine_bg.wasm', import.meta.url), {
    signal: AbortSignal.timeout(LOAD_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return WebAssembly.compile(await response.arrayBuffer());
}

export async function runProgram(source, messages) {
  let module;
  try {
    module = await (engine ??= loadEngine());
  } catch {
    engine = undefined;
    throw new Error(messages.loadFailed);
  }

  const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  let timeout;
  try {
    return await new Promise((resolve, reject) => {
      timeout = setTimeout(() => reject(new Error(messages.timedOut)), RUN_TIMEOUT_MS);
      worker.onerror = () => reject(new Error(messages.runFailed));
      worker.onmessage = ({ data }) => resolve(data);
      worker.postMessage({ module, source });
    });
  } finally {
    clearTimeout(timeout);
    worker.terminate();
  }
}
