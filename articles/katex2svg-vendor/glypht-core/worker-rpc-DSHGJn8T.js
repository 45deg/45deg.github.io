class RpcDispatcher {
    worker;
    map;
    sentMessageId = 0;
    /**
     * Number of messages we're waiting for the worker to respond to. If greater than 0, we will avoid terminating the
     * worker until this hits 0.
     *
     * Terminating a web worker *should* be straightforward--we just tell it to remove any event listeners on its side,
     * all event loops are done, and the process can exit. Unfortunately, there is either a bug in
     * https://github.com/valadaptive/web-worker or Node that causes the event loop to stay alive forever if too many
     * compression threads are created under certain timing conditions. So, we need to manually refcount the number of
     * messages we're waiting on.
     */
    inflightRequests = 0;
    /**
     * True if we're waiting to terminate the worker.
     */
    deferClose = false;
    constructor(worker, map) {
        this.worker = worker;
        this.map = map;
    }
    send(name, message, transfer) {
        const id = this.sentMessageId++;
        const worker = this.worker;
        const fullMessage = {
            type: name,
            message,
            id,
        };
        worker.postMessage(fullMessage, transfer);
        this.inflightRequests++;
        return new Promise((resolve, reject) => {
            const ac = new AbortController();
            worker.addEventListener('message', msg => {
                const data = msg.data;
                if (data.originId !== id)
                    return;
                this.inflightRequests--;
                if (this.inflightRequests === 0 && this.deferClose) {
                    this.worker.terminate();
                }
                if (data.type === this.map[name]) {
                    ac.abort();
                    resolve(data.message);
                }
                else if (data.type === 'error') {
                    ac.abort();
                    reject(data.message);
                }
            }, { signal: ac.signal });
        });
    }
    sendAndForget(name, message, transfer) {
        const id = this.sentMessageId++;
        const worker = this.worker;
        const fullMessage = {
            type: name,
            message,
            id,
        };
        worker.postMessage(fullMessage, transfer);
    }
    close() {
        if (this.inflightRequests === 0) {
            this.worker.terminate();
        }
        else {
            this.deferClose = true;
        }
    }
}

export { RpcDispatcher as R };
