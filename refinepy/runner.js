/* Shared by the browser worker and the Node smoke tests. Each run gets fresh FS
 * and solver state; generated code cannot retain data from an earlier source. */
globalThis.runRefinepy = async function (createModule, source, selector) {
  if (typeof source !== "string" || new TextEncoder().encode(source).length > 1024 * 1024) {
    throw new Error("Source must be text of at most 1 MiB.");
  }
  if (typeof selector !== "string" || !selector.trim() || selector.length > 256) {
    throw new Error("Provide a function name or * (at most 256 characters).");
  }
  const stdout = [];
  const stderr = [];
  const module = await createModule({
    noInitialRun: true,
    print: (line) => stdout.push(line),
    printErr: (line) => stderr.push(line),
  });
  module.FS.mkdir("/workspace");
  module.FS.writeFile("/workspace/playground.py", source);
  module.FS.writeFile("/workspace/pyproject.toml", `[tool.refinepy]\ntargets = [${JSON.stringify(`playground:${selector.trim()}`)}]\n`);
  module.callMain(["--config", "/workspace/pyproject.toml", "--format", "json"]);
  try {
    const report = JSON.parse(stdout.join("\n"));
    if (report.schema_version !== 3 || !Array.isArray(report.targets) || !Array.isArray(report.diagnostics)) {
      throw new Error("Unexpected report format");
    }
    return report;
  } catch (error) {
    throw new Error(`Verifier did not produce a valid report: ${error.message}${stderr.length ? `\n${stderr.join("\n")}` : ""}`);
  }
};
