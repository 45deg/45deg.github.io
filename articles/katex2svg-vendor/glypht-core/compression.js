import Worker from '@glypht/web-worker';
import { R as RpcDispatcher } from './worker-rpc-DSHGJn8T.js';

let parallelismResult = null;
/**
 * Returns the number of available CPU cores. Defaults to 2 otherwise.
 * @returns THe number of available CPU cores, or an approximation that should tell you how many worker threads to
 * create.
 */
const getParallelism = async () => {
    if (parallelismResult !== null) {
        return parallelismResult;
    }
    parallelismResult = 2;
    if (typeof navigator === 'object' && typeof navigator.hardwareConcurrency === 'number') {
        parallelismResult = navigator.hardwareConcurrency;
    }
    else {
        try {
            const os = await import('os');
            if (typeof os.availableParallelism === 'function') {
                parallelismResult = os.availableParallelism();
            }
            else if (typeof os.cpus === 'function') {
                parallelismResult = os.cpus().length;
            }
        }
        catch {
            // Ignore errors and just stick with the default parallelism value
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return parallelismResult;
};
/**
 * Load a file from a specific path, across browsers and JS runtimes.
 * @param path The path string or URL to load from.
 * @returns The file contents.
 */
const fetchFile = async (path) => {
    let pathUrl, filePath;
    if (typeof path === 'string') {
        try {
            pathUrl = new URL(path);
        }
        catch {
            // The module path isn't a URL
            filePath = path;
        }
    }
    else {
        pathUrl = path;
    }
    if (pathUrl) {
        try {
            // Node, at least, does not support `fetch`ing a file: URI. If we get one of those, always try to load it
            // using Node's filesystem APIs.
            if (pathUrl.protocol === 'file:') {
                filePath = (await import('node:url')).fileURLToPath(pathUrl);
            }
        }
        catch {
            // We're running in an environment which doesn't support node:url or fileURLToPath. Maybe it'll at least
            // support `fetch`ing a file: URI.
        }
    }
    if (filePath) {
        let fsp;
        try {
            fsp = await import('node:fs/promises');
        }
        catch {
            // *sigh* We're running in a CloudFlare worker, which does not have documented support for Node's fs API.
            // You know, this entire song and dance (*three* try/catch blocks' worth!) could be avoided if Node would
            // just implement support for fetching $&#! file URIs...
        }
        if (fsp) {
            // TypeScript changed the array buffer view types to be parameterized over the buffer type, but *didn't*
            // update the type definitions for Node APIs!
            const buf = await fsp.readFile(filePath);
            // We return a Uint8Array instead of an ArrayBuffer just in case Node pools buffers for file loads. I don't
            // think it does, but you never know...
            return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
        }
    }
    if (!pathUrl) {
        throw new Error(`Your runtime does not support any loading strategy for ${path}.`);
    }
    return new Uint8Array(await (await fetch(pathUrl)).arrayBuffer());
};

const filterArrayInPlace = (arr, predicate) => {
    let nextKeptIndex = 0;
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (predicate(item)) {
            arr[nextKeptIndex] = item;
            nextKeptIndex++;
        }
    }
    arr.length = nextKeptIndex;
};
class WorkerPool {
    workers;
    allWorkers;
    queuedOperations = [];
    backpressureCallbacks = [];
    constructor(workers) {
        this.workers = workers;
        this.allWorkers = workers.slice(0);
    }
    doWork() {
        while (this.workers.length > 0 && this.queuedOperations.length > 0) {
            const nextOperation = this.queuedOperations.pop();
            const worker = this.workers.pop();
            filterArrayInPlace(this.backpressureCallbacks, ({ n, cb }) => {
                if (this.queuedOperations.length <= n) {
                    cb();
                    return false;
                }
                return true;
            });
            const onComplete = () => {
                this.workers.push(worker);
                queueMicrotask(() => {
                    this.doWork();
                });
            };
            nextOperation.fn(worker).then(value => {
                onComplete();
                nextOperation.resolve(value);
            }, error => {
                onComplete();
                nextOperation.reject(error);
            });
        }
    }
    enqueue(operation) {
        let resolve, reject;
        const promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });
        this.queuedOperations.push({
            resolve,
            reject,
            fn: operation,
        });
        this.doWork();
        return promise;
    }
    destroy() {
        for (const worker of this.allWorkers) {
            worker.close();
        }
        this.allWorkers.length = 0;
    }
    backpressure(n) {
        if (this.queuedOperations.length <= n)
            return Promise.resolve();
        return new Promise(resolve => {
            this.backpressureCallbacks.push({ n, cb: resolve });
        });
    }
}

/**
 * Context object for font compression and decompression. All operations are done off-thread using a worker pool. If
 * running in an environment where your program is meant to exit by itself (e.g. on the command line), you must call
 * {@link WoffCompressionContext#destroy} to close the worker threads and allow the program to exit.
 */
class WoffCompressionContext {
    pool;
    destroyed = false;
    parallelism;
    /**
     * Create a new compression/decompression context.
     * @param parallelism The number of worker threads to create. If not given, this will default to the number of cores
     * on the system or `navigator.hardwareConcurrency`.
     */
    constructor(parallelism) {
        const resolvedParallelism = parallelism ?? getParallelism();
        this.parallelism = resolvedParallelism;
        this.pool = (async () => {
            const woffWasmUrls = [
                new URL('./woff1.wasm', import.meta.url),
                new URL('./woff2.wasm', import.meta.url),
            ];
            const [woff1, woff2] = await Promise.all(woffWasmUrls.map(url => fetchFile(url)));
            const workers = [];
            for (let i = 0, parallelism = await resolvedParallelism; i < parallelism; i++) {
                const worker = new Worker(new URL('./compression-worker.worker.js', import.meta.url), { type: 'module' });
                const dispatcher = new RpcDispatcher(worker, {
                    'compress-font': 'compressed-font',
                    'decompress-font': 'decompressed-font',
                });
                dispatcher.sendAndForget('init-woff-wasm', { woff1, woff2 });
                workers.push(dispatcher);
            }
            return new WorkerPool(workers);
        })();
    }
    /**
     * @returns The resolved number of worker threads, e.g. for ETA or progress estimation.
     */
    async getParallelism() {
        return await this.parallelism;
    }
    checkDestroyed() {
        if (this.destroyed) {
            throw new DOMException('This WoffCompressionContext has been destroyed', 'InvalidStateError');
        }
    }
    /**
     * Compress an OpenType font file to WOFF or WOFF2.
     * @param ttf The font file to compress. This must be a single font, not a collection.
     * @param options Options object.
     * @returns Compressed font data.
     */
    async compressFromTTF(ttf, options) {
        this.checkDestroyed();
        const pool = await this.pool;
        const quality = options.level ?? (options.algorithm === 'woff' ? 15 : 11);
        return await pool.enqueue((async (worker) => {
            const compressed = await worker.send('compress-font', { data: ttf, algorithm: options.algorithm, quality }, options.transfer ? [ttf.buffer] : undefined);
            return compressed;
        }));
    }
    /**
     * Decompress a WOFF or WOFF2-compressed font file. Throws an error if the input font is not compressed.
     * @param compressed The compressed font file data.
     * @param options Options object.
     * @returns Decompressed font file data.
     */
    async decompressToTTF(compressed, options) {
        this.checkDestroyed();
        const algorithm = WoffCompressionContext.compressionType(compressed);
        if (algorithm === null) {
            throw new Error('This font file is not compressed');
        }
        const pool = await this.pool;
        return await pool.enqueue((async (worker) => {
            const decompressed = await worker.send('decompress-font', { data: compressed, algorithm }, options?.transfer ? [compressed.buffer] : undefined);
            return decompressed;
        }));
    }
    /**
     * Return the compression type for a given font file.
     * @param fontData The font file to check.
     * @returns 'woff' if the file is compressed with WOFF1, 'woff2' if it's compressed with WOFF2, or null if it's not
     * compressed.
     */
    static compressionType(fontData) {
        if (fontData.length < 4) {
            return null;
        }
        const magic = (fontData[3] |
            (fontData[2] << 8) |
            (fontData[1] << 16) |
            (fontData[0] << 24));
        // WOFF1
        if (magic === 0x774F4646) {
            return 'woff';
        }
        // WOFF2
        else if (magic === 0x774F4632) {
            return 'woff2';
        }
        return null;
    }
    /**
     * Destroy this context. All previous calls to this context's compression and decompression methods *will* resolve,
     * but any further calls will error out.
     *
     * If running in Node, Bun, Deno, or another such runtime, this will allow the program to exit once all font
     * processing work is finished.
     */
    destroy() {
        void this.pool.then(pool => pool.destroy());
        this.destroyed = true;
    }
}

export { WoffCompressionContext };
