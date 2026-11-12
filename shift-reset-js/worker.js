// Instantiate the already compiled Boa module and evaluate one source string.
import init, { evaluate } from './engine.js';

self.onmessage = async ({ data }) => {
  await init({ module_or_path: data.module });
  self.postMessage(evaluate(data.source));
};
