importScripts('teavm-runtime.js');
const engine = TeaVM.wasmGC.load('alloy.wasm');
self.onmessage = async ({data}) => {
  try {
    const wasm = await engine;
    const start = performance.now();
    const output = wasm.exports.analyze(data.source);
    self.postMessage({output, ms: Math.round(performance.now() - start)});
  } catch (error) {
    self.postMessage({output: `ERROR: ${error.message || error}`, ms: 0});
  }
};
