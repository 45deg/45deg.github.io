/** Options for the {@link WoffCompressionContext#compressFromTTF} method. */
export type CompressOptions = {
    /** The compression algorithm to use, either `woff` or `woff2`. */
    algorithm: 'woff' | 'woff2';
    /**
     * The compression level. For WOFF2, this can range from 0 to 11. For WOFF, this means the number of Zopfli
     * iterations and can theoretically go up to any value, although 15 is a good default.
     *
     * If not provided, the default is 15 iterations for WOFF and a level of 11 for WOFF2.
     */
    level?: number;
    /**
     * If true, the passed font file's buffer will be transferred to a worker thread and no longer usable on this
     * thread.
     */
    transfer?: boolean;
};
/** Options for the {@link WoffCompressionContext#decompressToTTF} method. */
export type DecompressOptions = {
    /**
     * If true, the passed font file's buffer will be transferred to a worker thread and no longer usable on this
     * thread.
     */
    transfer?: boolean;
};
/**
 * Context object for font compression and decompression. All operations are done off-thread using a worker pool. If
 * running in an environment where your program is meant to exit by itself (e.g. on the command line), you must call
 * {@link WoffCompressionContext#destroy} to close the worker threads and allow the program to exit.
 */
export declare class WoffCompressionContext {
    private pool;
    private destroyed;
    private parallelism;
    /**
     * Create a new compression/decompression context.
     * @param parallelism The number of worker threads to create. If not given, this will default to the number of cores
     * on the system or `navigator.hardwareConcurrency`.
     */
    constructor(parallelism?: number);
    /**
     * @returns The resolved number of worker threads, e.g. for ETA or progress estimation.
     */
    getParallelism(): Promise<number>;
    private checkDestroyed;
    /**
     * Compress an OpenType font file to WOFF or WOFF2.
     * @param ttf The font file to compress. This must be a single font, not a collection.
     * @param options Options object.
     * @returns Compressed font data.
     */
    compressFromTTF(ttf: Uint8Array, options: CompressOptions): Promise<Uint8Array<ArrayBuffer>>;
    /**
     * Decompress a WOFF or WOFF2-compressed font file. Throws an error if the input font is not compressed.
     * @param compressed The compressed font file data.
     * @param options Options object.
     * @returns Decompressed font file data.
     */
    decompressToTTF(compressed: Uint8Array, options?: DecompressOptions): Promise<Uint8Array<ArrayBuffer>>;
    /**
     * Return the compression type for a given font file.
     * @param fontData The font file to check.
     * @returns 'woff' if the file is compressed with WOFF1, 'woff2' if it's compressed with WOFF2, or null if it's not
     * compressed.
     */
    static compressionType(fontData: Uint8Array): 'woff' | 'woff2' | null;
    /**
     * Destroy this context. All previous calls to this context's compression and decompression methods *will* resolve,
     * but any further calls will error out.
     *
     * If running in Node, Bun, Deno, or another such runtime, this will allow the program to exit once all font
     * processing work is finished.
     */
    destroy(): void;
}
//# sourceMappingURL=compression.d.ts.map