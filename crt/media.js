// Owns file/capture selection, playback and frame notifications. loadBrowserMedia
// decodes files; capture.js prepares live streams. createMediaController commits
// only the newest input through onSource and releases replaced or stopped sources.
import { loadBrowserCapture } from './capture.js';

export function loadBrowserMedia(file, signal) {
    return new Promise((resolve, reject) => {
        const isVideo = file.type.startsWith('video/');
        const element = document.createElement(isVideo ? 'video' : 'img');
        const url = URL.createObjectURL(file);
        let disposed = false;
        function dispose() {
            if (disposed) return;
            disposed = true;
            if (isVideo) element.pause();
            element.removeAttribute('src');
            if (isVideo) element.load();
            URL.revokeObjectURL(url);
        }
        function detach() {
            signal.removeEventListener('abort', abort);
            element.removeEventListener(isVideo ? 'loadeddata' : 'load', ready);
            element.removeEventListener('error', failed);
        }
        function abort() {
            detach(); dispose();
            reject(new DOMException('Media load cancelled', 'AbortError'));
        }
        function failed() {
            detach(); dispose();
            reject(new Error('ファイルを読み込めませんでした。形式やファイルの状態を確認してください。'));
        }
        function ready() {
            const width = isVideo ? element.videoWidth : element.naturalWidth;
            const height = isVideo ? element.videoHeight : element.naturalHeight;
            if (!width || !height) { failed(); return; }
            detach();
            resolve({ element, width, height, kind: isVideo ? 'video' : 'image', dispose });
        }
        if (signal.aborted) { abort(); return; }
        signal.addEventListener('abort', abort, { once: true });
        element.addEventListener(isVideo ? 'loadeddata' : 'load', ready, { once: true });
        element.addEventListener('error', failed, { once: true });
        if (isVideo) {
            element.loop = true;
            element.muted = true;
            element.playsInline = true;
            element.preload = 'auto';
        }
        element.src = url;
    });
}

export function createMediaController({ load = loadBrowserMedia, capture = loadBrowserCapture, onSource } = {}) {
    let current = null;
    let pending = null;
    let loadId = 0;
    let frameDirty = false;
    let cancelFrameUpdates = () => {};
    let shuttle = null;
    let status = { phase: 'idle', fileName: '', message: '' };
    const subscribers = new Set();
    function getSnapshot() {
        return {
            ...status,
            isVideo: current?.kind === 'video' && !current.captureType,
            isCapturing: Boolean(current?.captureType),
            canStopCapture: Boolean(current?.captureType || pending?.captureType),
            paused: current?.element.paused ?? true
        };
    }
    function publish() {
        const snapshot = getSnapshot();
        for (const subscriber of subscribers) subscriber(snapshot);
    }
    function watchVideo(source) {
        const video = source.element;
        const events = new AbortController();
        let frameHandle = null;
        const markDirty = () => { frameDirty = true; };
        for (const event of ['seeked', 'loadeddata', 'timeupdate']) video.addEventListener(event, markDirty, { signal: events.signal });
        for (const event of ['play', 'pause']) video.addEventListener(event, publish, { signal: events.signal });
        video.addEventListener('error', () => {
            if (current !== source) return;
            if (source.captureType) {
                endCapture('キャプチャ映像の読み込みエラーが発生しました。', { phase: 'error' });
                return;
            }
            if (status.phase === 'loading') return;
            status = { ...status, phase: 'error', message: '動画の再生中に読み込みエラーが発生しました。' };
            publish();
        }, { signal: events.signal });
        if (source.captureType) {
            const label = source.captureType === 'camera' ? 'カメラ' : '画面共有';
            for (const track of source.stream.getVideoTracks()) {
                track.addEventListener('ended', () => {
                    if (current === source) endCapture(`${label}が終了しました。`);
                }, { signal: events.signal });
            }
            video.addEventListener('resize', () => {
                if (current !== source || !video.videoWidth || !video.videoHeight) return;
                if (source.width === video.videoWidth && source.height === video.videoHeight) return;
                source.width = video.videoWidth;
                source.height = video.videoHeight;
                try {
                    onSource(source);
                    frameDirty = true;
                } catch {
                    endCapture('キャプチャ映像のサイズを変更できませんでした。', { phase: 'error' });
                }
            }, { signal: events.signal });
        }
        if (typeof video.requestVideoFrameCallback === 'function') {
            const onFrame = () => {
                if (current !== source) return;
                markDirty();
                frameHandle = video.requestVideoFrameCallback(onFrame);
            };
            frameHandle = video.requestVideoFrameCallback(onFrame);
        }
        cancelFrameUpdates = () => {
            events.abort();
            if (frameHandle !== null) video.cancelVideoFrameCallback(frameHandle);
        };
    }
    async function play(source = current) {
        if (source?.kind !== 'video') return;
        try {
            await source.element.play();
        } catch {
            if (current !== source || status.phase === 'loading') return;
            status = { ...status, message: '再生を開始できませんでした。「再生」を押して再試行してください。' };
            publish();
        }
    }
    async function loadSource({ name, captureType, prepare }) {
        const requestId = ++loadId;
        pending?.controller.abort();
        const request = new AbortController();
        pending = { controller: request, captureType };
        status = { phase: 'loading', fileName: name, message: captureType ? `${name}を準備中…` : `${name} を読み込み中…` };
        publish();
        let candidate = null;
        try {
            candidate = await prepare(request.signal);
            // Guard even when an injected decoder cannot cancel its work.
            if (requestId !== loadId) { candidate.dispose(); return; }
            onSource(candidate);
            cancelFrameUpdates();
            cancelFrameUpdates = () => {};
            shuttle = null;
            current?.dispose();
            current = candidate;
            frameDirty = true;
            pending = null;
            status = { phase: 'ready', fileName: name, message: captureType ? `${name}の映像を表示しています。` : `${name} を読み込みました。` };
            if (current.kind === 'video') watchVideo(current);
            publish();
            if (!current.captureType) void play(current);
        } catch (error) {
            candidate?.dispose();
            if (requestId !== loadId) return;
            pending = null;
            status = { phase: 'error', fileName: name, message: error.message || 'メディアを読み込めませんでした。' };
            publish();
        } finally {
            if (requestId === loadId) pending = null;
        }
    }
    function loadFile(file) {
        return loadSource({ name: file.name, prepare: signal => load(file, signal) });
    }
    function startCapture(type) {
        return loadSource({
            name: type === 'camera' ? 'カメラ' : '画面共有',
            captureType: type,
            prepare: signal => capture(type, signal)
        });
    }
    function endCapture(message, { phase = 'idle', cancelPending = false } = {}) {
        if (!current?.captureType && !pending?.captureType) return;
        if (cancelPending && pending?.captureType) {
            ++loadId;
            pending.controller.abort();
            pending = null;
        }
        if (current?.captureType) {
            cancelFrameUpdates();
            cancelFrameUpdates = () => {};
            current.dispose();
            current = null;
            frameDirty = false;
        }
        // Ending the old stream must not cancel a newer input selection.
        if (!pending) status = { phase, fileName: '', message };
        publish();
    }
    function seekBy(seconds) {
        if (current?.kind !== 'video' || current.captureType) return;
        const video = current.element;
        if (!Number.isFinite(video.duration)) return;
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
        frameDirty = true;
    }
    function startShuttle(direction) {
        if (current?.kind !== 'video' || current.captureType) return;
        shuttle = { source: current, direction, speed: 1.8, wasPlaying: !current.element.paused };
        current.element.pause();
    }
    function stopShuttle() {
        const previous = shuttle;
        shuttle = null;
        if (previous?.source === current && previous.wasPlaying) void play(previous.source);
    }
    return {
        loadFile, startCapture, getSnapshot, seekBy,
        stopCapture() { endCapture('キャプチャを停止しました。', { cancelPending: true }); },
        subscribe(subscriber) { subscribers.add(subscriber); return () => subscribers.delete(subscriber); },
        togglePlayback() {
            if (current?.kind !== 'video' || current.captureType) return;
            if (current.element.paused) return play();
            current.element.pause();
        },
        startShuttle, stopShuttle,
        tick(deltaSeconds) {
            if (!shuttle || shuttle.source !== current) return;
            shuttle.speed = Math.min(shuttle.speed + 7.5 * deltaSeconds, 12);
            seekBy(shuttle.direction * shuttle.speed * deltaSeconds);
            const video = current.element;
            if (video.currentTime <= 0 || video.currentTime >= video.duration) stopShuttle();
        },
        takeFrame() {
            if (!current) return null;
            const needsPolling = current.kind === 'video' && typeof current.element.requestVideoFrameCallback !== 'function';
            if (!frameDirty && !needsPolling) return null;
            if (current.kind === 'video' && current.element.readyState < 2) return null;
            frameDirty = false;
            return current.element;
        },
        dispose() {
            ++loadId; pending?.controller.abort(); pending = null;
            cancelFrameUpdates(); shuttle = null;
            current?.dispose(); current = null;
            subscribers.clear();
        }
    };
}
