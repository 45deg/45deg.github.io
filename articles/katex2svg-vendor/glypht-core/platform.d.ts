/**
 * Returns the number of available CPU cores. Defaults to 2 otherwise.
 * @returns THe number of available CPU cores, or an approximation that should tell you how many worker threads to
 * create.
 */
export declare const getParallelism: () => Promise<number>;
/**
 * Load a file from a specific path, across browsers and JS runtimes.
 * @param path The path string or URL to load from.
 * @returns The file contents.
 */
export declare const fetchFile: (path: string | URL) => Promise<Uint8Array<ArrayBuffer>>;
//# sourceMappingURL=platform.d.ts.map