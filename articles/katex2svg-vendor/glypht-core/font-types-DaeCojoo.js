import Worker from '@glypht/web-worker';
import { R as RpcDispatcher } from './worker-rpc-DSHGJn8T.js';
import '@smol-range/decompress';

/**
 * Context object for all font processing. This is what you use to load fonts.
 *
 * All subsetting is done off-thread using a worker. If running in an environment where your program is meant to exit by
 * itself (e.g. on the command line), you must call {@link GlyphtContext#destroy} after subsetting your fonts to close
 * the worker thread and allow the program to exit.
 */
class GlyphtContext {
    fontWorker;
    fontFinalizationRegistry;
    state = { destroyed: false };
    constructor() {
        this.fontWorker = new RpcDispatcher(new Worker(new URL('./font-worker.worker.js', import.meta.url), { type: 'module' }), {
            'update-fonts': 'updated-fonts',
            'subset-font': 'subsetted-font',
            'get-font-data': 'got-font-data',
            'get-font-file-data': 'got-font-file-data',
            'get-font-file-hash': 'got-font-file-hash',
        });
        // Automatically garbage-collect fonts
        this.fontFinalizationRegistry = new FinalizationRegistry(fontId => {
            this.fontWorker.sendAndForget('update-fonts', { loadFonts: [], unloadFonts: [fontId] });
        });
    }
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
    async loadFonts(fontFiles, options) {
        if (this.state.destroyed) {
            throw new DOMException('This GlyphtContext has been destroyed', 'InvalidStateError');
        }
        return (await this.fontWorker.send('update-fonts', { loadFonts: fontFiles, unloadFonts: [] }, options?.transfer ? fontFiles.map(f => f.buffer) : undefined)).fonts.map(fontMsg => this.hydrateFont(fontMsg));
    }
    hydrateFont(fontMessage) {
        const registry = this.fontFinalizationRegistry;
        const fontWorker = this.fontWorker;
        const ctxState = this.state;
        const fontId = fontMessage.id;
        fontMessage.destroy = async () => {
            if (ctxState.destroyed)
                return;
            const res = fontWorker.send('update-fonts', { loadFonts: [], unloadFonts: [fontId] });
            registry.unregister(fontMessage);
            await res;
        };
        const checkCtxAlive = () => {
            if (ctxState.destroyed) {
                throw new DOMException('This font\'s GlyphtContext has been destroyed', 'InvalidStateError');
            }
        };
        registry.register(fontMessage, fontId, fontMessage);
        fontMessage.subset = async (settings) => {
            checkCtxAlive();
            if (settings === null) {
                const { data: fontData, format } = await fontWorker.send('get-font-data', fontId);
                return {
                    familyName: fontMessage.familyName,
                    subfamilyName: fontMessage.subfamilyName,
                    format,
                    data: fontData,
                    styleValues: fontMessage.styleValues,
                    styleAttributes: fontMessage.styleAttributes,
                    axes: fontMessage.axes.map(axis => ({
                        type: 'variable',
                        tag: axis.tag,
                        name: axis.name,
                        value: { min: axis.min, max: axis.max, defaultValue: axis.defaultValue },
                    })),
                    namedInstance: null,
                    unicodeRanges: fontMessage.unicodeRanges,
                };
            }
            return await fontWorker.send('subset-font', { font: fontId, settings });
        };
        fontMessage.getFontFileData = async () => {
            checkCtxAlive();
            return await fontWorker.send('get-font-file-data', fontId);
        };
        fontMessage.getFontFileHash = async () => {
            checkCtxAlive();
            return await fontWorker.send('get-font-file-hash', fontId);
        };
        return fontMessage;
    }
    /**
     * Destroy this context, meaning any previously-loaded {@link FontRef}s can no longer be subset. All promises
     * previously returned from {@link FontRef#subset} *will* resolve, but any further calls will error out.
     *
     * If running in Node, Bun, Deno, or another such runtime, this will allow the program to exit once all font
     * processing work is finished.
     */
    destroy() {
        this.fontWorker.close();
        this.state.destroyed = true;
    }
}

/**
 * The names of every named character set from Google Fonts.
 */
const SUBSET_NAMES = ["adlam", "ahom", "anatolian-hieroglyphs", "arabic", "armenian", "avestan", "balinese", "bamum", "bassa-vah", "batak", "bengali", "bhaiksuki", "brahmi", "braille", "buginese", "buhid", "canadian-aboriginal", "carian", "caucasian-albanian", "chakma", "cham", "cherokee", "chinese-hongkong", "chinese-simplified", "chinese-traditional", "chorasmian", "coptic", "cuneiform", "cypriot", "cypro-minoan", "cyrillic-ext", "cyrillic", "deseret", "devanagari", "dives-akuru", "dogra", "duployan", "egyptian-hieroglyphs", "elbasan", "elymaic", "ethiopic", "garay", "georgian", "glagolitic", "gothic", "grantha", "greek-ext", "greek", "gujarati", "gunjala-gondi", "gurmukhi", "gurung-khema", "hanifi-rohingya", "hanunoo", "hatran", "hebrew", "imperial-aramaic", "indic-siyaq-numbers", "inscriptional-pahlavi", "inscriptional-parthian", "japanese", "javanese", "kaithi", "kana-extended", "kannada", "kawi", "kayah-li", "kharoshthi", "khitan-small-script", "khmer", "khojki", "khudawadi", "kirat-rai", "korean", "lao", "latin-ext", "latin", "lepcha", "limbu", "linear-a", "linear-b", "lisu", "lycian", "lydian", "mahajani", "makasar", "malayalam", "mandaic", "manichaean", "marchen", "masaram-gondi", "math", "mayan-numerals", "medefaidrin", "meetei-mayek", "mende-kikakui", "meroitic-cursive", "meroitic-hieroglyphs", "meroitic", "miao", "modi", "mongolian", "mro", "multani", "music", "myanmar", "nabataean", "nag-mundari", "nandinagari", "new-tai-lue", "newa", "nko", "nushu", "nyiakeng-puachue-hmong", "ogham", "ol-chiki", "ol-onal", "old-hungarian", "old-italic", "old-north-arabian", "old-permic", "old-persian", "old-sogdian", "old-south-arabian", "old-turkic", "old-uyghur", "oriya", "osage", "osmanya", "ottoman-siyaq-numbers", "pahawh-hmong", "palmyrene", "pau-cin-hau", "phags-pa", "phoenician", "psalter-pahlavi", "rejang", "runic", "samaritan", "saurashtra", "sharada", "shavian", "siddham", "signwriting", "sinhala", "sogdian", "sora-sompeng", "soyombo", "sundanese", "sunuwar", "syloti-nagri", "symbols2", "symbols", "syriac", "tagalog", "tagbanwa", "tai-le", "tai-tham", "tai-viet", "takri", "tamil-supplement", "tamil", "tangsa", "tangut", "telugu", "thaana", "thai", "tibetan", "tifinagh", "tirhuta", "todhri", "toto", "tulu-tigalari", "ugaritic", "vai", "vietnamese", "vithkuqi", "wancho", "warang-citi", "yezidi", "yi", "zanabazar-square", "znamenny"];

/**
 * Format for an axis value record ({@link AxisValue}).
 */
var AxisValueFormat;
(function (AxisValueFormat) {
    AxisValueFormat[AxisValueFormat["SingleValue"] = 1] = "SingleValue";
    AxisValueFormat[AxisValueFormat["Range"] = 2] = "Range";
    AxisValueFormat[AxisValueFormat["LinkedValue"] = 3] = "LinkedValue";
    AxisValueFormat[AxisValueFormat["MultipleValues"] = 4] = "MultipleValues";
})(AxisValueFormat || (AxisValueFormat = {}));
/** Flags for an {@link AxisValue}. */
var AxisValueFlags;
(function (AxisValueFlags) {
    /**
     * If set, this axis value table provides axis value information that is applicable to other fonts within the same
     * font family. This is used if the other fonts were released earlier and did not include information about values
     * for some axis. If newer versions of the other fonts include the information themselves and are present, then this
     * table is ignored.
     */
    AxisValueFlags[AxisValueFlags["OlderSibling"] = 1] = "OlderSibling";
    /**
     * If set, it indicates that the axis value represents the “normal” value for the axis and may be omitted when
     * composing name strings.
     */
    AxisValueFlags[AxisValueFlags["Elidable"] = 2] = "Elidable";
})(AxisValueFlags || (AxisValueFlags = {}));

export { AxisValueFormat as A, GlyphtContext as G, SUBSET_NAMES as S, AxisValueFlags as a };
