// Owns the canonical settings snapshot. Consumers receive copies, and all edits
// pass through update/applyPreset/setScanMode before subscribers are notified.
import { CRT_PRESETS } from './presets.js';

export function createSettings() {
    let current = {
        ...structuredClone(CRT_PRESETS.consumer),
        activePreset: 'consumer'
    };
    Object.assign(current.material, { u_refreshRate: 60, u_scanLines: 240, u_interlaced: 0 });
    const subscribers = new Set();
    const getSnapshot = () => structuredClone(current);
    function publish() {
        for (const subscriber of subscribers) subscriber(getSnapshot());
    }
    return {
        getSnapshot,
        subscribe(subscriber) {
            subscribers.add(subscriber);
            return () => subscribers.delete(subscriber);
        },
        update(draft) {
            current = {
                material: structuredClone(draft.material),
                persistence: structuredClone(draft.persistence),
                glass: structuredClone(draft.glass),
                activePreset: null
            };
            publish();
        },
        applyPreset(key) {
            const preset = CRT_PRESETS[key];
            if (!preset) throw new Error(`Unknown CRT preset: ${key}`);
            // An appearance preset does not change the user's scan standard.
            current = {
                material: { ...current.material, ...structuredClone(preset.material) },
                persistence: structuredClone(preset.persistence),
                glass: structuredClone(preset.glass),
                activePreset: key
            };
            publish();
        },
        setScanMode(mode) {
            if (mode !== '240p' && mode !== '480i') throw new Error(`Unknown scan mode: ${mode}`);
            current.material.u_scanLines = mode === '480i' ? 480 : 240;
            current.material.u_interlaced = mode === '480i' ? 1 : 0;
            publish();
        }
    };
}
