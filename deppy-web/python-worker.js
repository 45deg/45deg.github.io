// Keep execution off the UI thread so Stop can terminate even an infinite loop.
const INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v314.0.0/full/';
self.onmessage = async ({data: source}) => {
  try {
    const {loadPyodide} = await import(`${INDEX_URL}pyodide.mjs`);
    const pyodide = await loadPyodide({indexURL: INDEX_URL});
    const response = await fetch('./deppy-runtime.zip');
    if (!response.ok) throw new Error('DepPy runtime unavailable. Run the build script first.');
    pyodide.unpackArchive(await response.arrayBuffer(), 'zip', {extractDir: '/home/pyodide'});
    pyodide.setStdout({batched: text => self.postMessage({type: 'output', text})});
    pyodide.setStderr({batched: text => self.postMessage({type: 'output', text})});
    pyodide.setStdin({stdin: () => { throw new Error('Interactive input is not supported.'); }});
    // A real file is needed by DepPy's inspect-based decorators.
    pyodide.FS.writeFile('/home/pyodide/main.py', source);
    self.postMessage({type: 'running'});
    await pyodide.runPythonAsync("import runpy\nrunpy.run_path('/home/pyodide/main.py', run_name='__main__')\nNone");
    self.postMessage({type: 'done'});
  } catch (error) {
    self.postMessage({type: 'error', text: String(error)});
  }
};
