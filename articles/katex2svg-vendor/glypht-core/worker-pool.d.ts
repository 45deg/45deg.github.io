import RpcDispatcher, { MessageSchema } from './worker-rpc.js';
export default class WorkerPool<S extends MessageSchema> {
    private workers;
    private allWorkers;
    private queuedOperations;
    private backpressureCallbacks;
    constructor(workers: RpcDispatcher<S>[]);
    private doWork;
    enqueue<T>(operation: (worker: RpcDispatcher<S>) => Promise<T>): Promise<T>;
    destroy(): void;
    backpressure(n: number): Promise<unknown>;
}
//# sourceMappingURL=worker-pool.d.ts.map