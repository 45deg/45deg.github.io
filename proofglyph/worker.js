"use strict";
importScripts("browser.bc.js");

self.onmessage = ({data}) => {
  const {id, kind} = data;
  const api = globalThis.proofglyph;
  try {
    let value;
    if (kind === "examples") value = {examples: api.examples};
    else if (kind === "compile") {
      const files = api.projectFiles(data.path, data.files);
      const compiled = api.compileProject(data.path, data.files);
      value = {files, compiled};
      if (compiled.ok) value.checked = api.checkMapped(compiled.output);
    } else if (kind === "check") {
      value = {checked: (data.mapped ? api.checkMapped : api.check)(data.source)};
    } else throw new Error(`Unknown operation: ${kind}`);
    self.postMessage({id, value});
  } catch (error) {
    self.postMessage({id, error: String(error.message || error)});
  }
};
