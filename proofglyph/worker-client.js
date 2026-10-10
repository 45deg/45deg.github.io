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
          this.cancel(new Error(event.message || "Worker の読み込みに失敗しました。"));
        };
        this.worker.onmessageerror = () => this.cancel(new Error("Worker の応答を読み取れませんでした。"));
      }
      const id = ++this.nextId;
      this.pending.set(id, {resolve, reject});
      try { this.worker.postMessage({...payload, id}); }
      catch (error) { this.cancel(error); }
    });
  }
  cancel(error = new Error("処理を中止しました。")) {
    // Keep an idle worker: checkMapped needs the previous compilation cache.
    if (!this.pending.size) return;
    this.worker?.terminate();
    this.worker = null;
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }
}
