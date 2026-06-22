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

const instantiateWasm = async (path, imports) => {
    if (typeof path === 'object' && ('byteLength' in path)) {
        return await WebAssembly.instantiate(path, imports);
    }
    if ('instantiateStreaming' in WebAssembly) {
        const pathUrl = typeof path === 'string' ? new URL(path) : path;
        if (pathUrl.protocol !== 'file:') {
            const response = await fetch(pathUrl);
            return await WebAssembly.instantiateStreaming(response, imports);
        }
    }
    return await WebAssembly.instantiate(await fetchFile(path), imports);
};
/**
 * Instantiate and initialize a WebAssembly module, adding some useful wrapper functions.
 * @param source The WebAssembly module path, provided as a string or URL, or its direct byte contents.
 * @returns An augmented WebAssembly module.
 */
const initWasm = async (source) => {
    const stub = () => { throw new Error('Not implemented'); };
    const importFns = {
        fd_seek: stub,
        fd_write: stub,
        fd_close: stub,
        proc_exit: stub,
        emscripten_notify_memory_growth: () => {
            augmentedModule.memoryView = new DataView(instance.exports.memory.buffer);
            augmentedModule.HEAPU8 = new Uint8Array(instance.exports.memory.buffer);
        },
    };
    const imports = {
        env: importFns,
        wasi_snapshot_preview1: importFns,
    };
    const { module, instance } = await instantiateWasm(source, imports);
    const funcTable = instance.exports.__indirect_function_table;
    const augmentedModule = {
        wasmMemory: instance.exports.memory,
        HEAPU8: new Uint8Array(instance.exports.memory.buffer),
        memoryView: new DataView(instance.exports.memory.buffer),
        stackAlloc: instance.exports._emscripten_stack_alloc,
        stackRestore: instance.exports._emscripten_stack_restore,
        stackSave: instance.exports.emscripten_stack_get_current,
        addIndirectFunction(f) {
            const addr = funcTable.grow(1);
            funcTable.set(addr, f);
            return addr;
        },
        withStack(f) {
            const stack = instance.exports.emscripten_stack_get_current();
            try {
                return f();
            }
            finally {
                instance.exports._emscripten_stack_restore(stack);
            }
        },
        readUint32(addr) {
            return this.memoryView.getUint32(addr, true);
        },
        writeUint32(addr, value) {
            this.memoryView.setUint32(addr, value, true);
        },
        readFloat32(addr) {
            return this.memoryView.getFloat32(addr, true);
        },
        writeFloat32(addr, value) {
            this.memoryView.setFloat32(addr, value, true);
        },
        malloc(size) {
            const ptr = instance.exports.malloc(size);
            if (ptr === 0)
                throw new Error('Out of WASM memory');
            return ptr;
        },
    };
    for (const exported of WebAssembly.Module.exports(module)) {
        switch (exported.name) {
            case 'memory':
            case '_emscripten_stack_alloc':
            case '_emscripten_stack_restore':
            case 'emscripten_stack_get_current':
            case 'malloc':
            case '__indirect_function_table':
            case '_initialize':
                continue;
            default:
                augmentedModule[`_${exported.name}`] = instance.exports[exported.name];
                break;
        }
    }
    instance.exports._initialize();
    return augmentedModule;
};

const postMessageFromWorker = (message, transfer = []) => {
    try {
        postMessage(message, undefined, transfer);
    }
    catch (error) {
        postMessage({ type: 'error', message: error, originId: message.originId });
    }
};

export { initWasm as i, postMessageFromWorker as p };
