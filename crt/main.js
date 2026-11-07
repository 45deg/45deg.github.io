// Application composition: settings owns configuration, media owns decoded inputs,
// rendering owns GPU state, and UI sends commands. This file owns the frame loop
// and connects source commits, settings changes and video controls. pagehide
// releases live capture even when keeping the rest of the app in the page cache.
import { createSettings } from './settings.js';
import { createMediaController } from './media.js';
import { createRenderer } from './rendering/renderer.js';
import { createTestPattern } from './rendering/test-pattern.js';
import { createUI } from './ui.js';

const settings = createSettings();
const rendering = createRenderer({
    container: document.body,
    initialSettings: settings.getSnapshot(),
    onControl(action) {
        if (action === 'togglePlayback') void media.togglePlayback();
        else if (action === 'rewind') media.startShuttle(-1);
        else if (action === 'fastForward') media.startShuttle(1);
        else if (action === 'stopShuttle') media.stopShuttle();
    }
});
const media = createMediaController({ onSource: (source) => rendering.setSource(source) });
const unsubscribeSettings = settings.subscribe((snapshot) => rendering.applySettings(snapshot));
const unsubscribeMedia = media.subscribe((state) => rendering.setVideoVisible(state.isVideo));
const ui = createUI({ settings, media });
rendering.setSource(createTestPattern());

let lastFrameTime = null;
let animationFrame;
function animate(time) {
    const deltaSeconds = lastFrameTime === null ? 1 / 60 : Math.max((time - lastFrameTime) / 1000, .000001);
    lastFrameTime = time;
    media.tick(Math.min(deltaSeconds, .05));
    const frame = media.takeFrame();
    if (frame) rendering.updateSourceFrame(frame);
    rendering.render(time / 1000, deltaSeconds);
    animationFrame = requestAnimationFrame(animate);
}
animationFrame = requestAnimationFrame(animate);
const events = new AbortController();
window.addEventListener('resize', () => rendering.resize(window.innerWidth, window.innerHeight), { signal: events.signal });
window.addEventListener('pagehide', (event) => {
    media.stopCapture();
    // Keep state intact if the browser parks the page in the back/forward cache.
    if (event.persisted) return;
    cancelAnimationFrame(animationFrame);
    events.abort();
    unsubscribeSettings(); unsubscribeMedia();
    ui.dispose(); media.dispose(); rendering.dispose();
}, { signal: events.signal });
