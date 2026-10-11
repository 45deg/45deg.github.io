"use strict";
class ProofglyphWorker {
  constructor() {
    this.worker = null;
    this.pending = new Map();
    this.nextId = 0;
  }
  request(payload) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        this.worker = new Worker("worker.js");
        this.worker.onmessage = ({data}) => {
          const pending = this.pending.get(data.id);
          if (!pending) return;
          this.pending.delete(data.id);
          if (data.error) pending.reject(new Error(data.error));
          else pending.resolve(data.value);
        };
        this.worker.onerror = event => {
          event.preventDefault();
          this.cancel(new Error(event.message || globalThis.proofglyphI18n?.t("workerLoadFailed") || "Could not load the worker."));
        };
        this.worker.onmessageerror = () => this.cancel(new Error(globalThis.proofglyphI18n?.t("workerResponseFailed") || "Could not read the worker response."));
      }
      const id = ++this.nextId;
      this.pending.set(id, {resolve, reject});
      try { this.worker.postMessage({...payload, id}); }
      catch (error) { this.cancel(error); }
    });
  }
  cancel(error = new Error(globalThis.proofglyphI18n?.t("cancelled") || "Operation cancelled.")) {
    // Keep an idle worker: checkMapped needs the previous compilation cache.
    if (!this.pending.size) return;
    this.worker?.terminate();
    this.worker = null;
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }
}
