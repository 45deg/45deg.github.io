import { FontRef } from './font-types.js';
/** Options for the {@link GlyphtContext#loadFonts} method. */
export type LoadFontsOptions = {
    /**
     * If true, all `Uint8Array`s passed in as font files will be transferred to the worker thread and
     * no longer usable on this thread.
     */
    transfer?: boolean;
};
/**
 * Context object for all font processing. This is what you use to load fonts.
 *
 * All subsetting is done off-thread using a worker. If running in an environment where your program is meant to exit by
 * itself (e.g. on the command line), you must call {@link GlyphtContext#destroy} after subsetting your fonts to close
 * the worker thread and allow the program to exit.
 */
export declare class GlyphtContext {
    private fontWorker;
    private fontFinalizationRegistry;
    private state;
    constructor();
    /**
     * Load a set of fonts. This will return a list of {@link FontRef}s that can be subset.
     *
     * There is no equivalent method for loading a single font, because a single font file could be a collection of
     * multiple fonts and hence have to return an array anyway.
     *
     * @param fontFiles Font files to load.
     * @param options Options object.
     * @returns A list of loaded fonts.
     */
    loadFonts(fontFiles: Uint8Array[], options?: LoadFontsOptions): Promise<FontRef[]>;
    private hydrateFont;
    /**
     * Destroy this context, meaning any previously-loaded {@link FontRef}s can no longer be subset. All promises
     * previously returned from {@link FontRef#subset} *will* resolve, but any further calls will error out.
     *
     * If running in Node, Bun, Deno, or another such runtime, this will allow the program to exit once all font
     * processing work is finished.
     */
    destroy(): void;
}
//# sourceMappingURL=context.d.ts.map