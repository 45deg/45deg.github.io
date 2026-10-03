importScripts("refinepy.js", "runner.js");

self.onmessage = async ({ data }) => {
  try {
    const report = await runRefinepy(createRefinepy, data.source, data.selector);
    self.postMessage({ report });
  } catch (error) {
    self.postMessage({ error: error.message || String(error) });
  }
};
