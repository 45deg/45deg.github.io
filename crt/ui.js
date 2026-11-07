// Owns GUI drafts and HTML controls, including capture capability hints.
// Settings/media commands handle edits and input selection; reflectSettings and
// reflectMedia update controls without accessing rendering uniforms.
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { getCaptureSupport } from './capture.js';

export function createUI({ settings, media }) {
    const draft = settings.getSnapshot();
    draft.scanMode = draft.material.u_interlaced ? '480i' : '240p';
    const guiControllers = [];

    function trackController(controller) {
        guiControllers.push(controller);
        return controller;
    }

    const gui = new GUI({ title: 'CRT パラメータ' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '20px';
    gui.domElement.style.right = '20px';
    gui.close();

    trackController(gui.add(draft.material, 'u_maskType', { 'シャドーマスク (ドット)': 0, 'アパチャーグリル (縦線)': 1, 'スロットマスク (千鳥長方形)': 2 }).name('マスク方式'));
    trackController(gui.add(draft.material, 'u_phosphorSize', 50, 400).name('素子密度').step(10));
    trackController(gui.add(draft.material, 'u_curvature', 0.0, 10.0).name('画面の湾曲度'));
    trackController(gui.add(draft.material, 'u_brightness', 0.5, 3.0).name('明るさ'));
    trackController(gui.add(draft.material, 'u_bloom', 0.0, 2.0).name('にじみ (Bloom)'));
    trackController(gui.add(draft.material, 'u_slotMaskOffset', 0.0, 1.0).name('配列ズレ (スロット)').step(0.1));

    const effectFolder = gui.addFolder('追加エフェクト');
    trackController(effectFolder.add(draft.material, 'u_noiseIntensity', 0.0, 0.5).name('アナログノイズ'));
    trackController(effectFolder.add(draft.material, 'u_rollingBar', 0.0, 0.5).name('フリッカー帯'));
    trackController(effectFolder.add(draft.material, 'u_chromaticAberration', 0.0, 0.05).name('レンズ色収差').step(0.001));

    const signalFolder = gui.addFolder('信号方式');
    trackController(signalFolder.add(draft.material, 'u_signalMode', { 'RGB': 0, 'Composite': 1, 'RF': 2 }).name('入力方式'));
    trackController(signalFolder.add(draft.material, 'u_signalArtifact', 0.0, 1.0).name('色分離失敗').step(0.01));
    trackController(signalFolder.add(draft.material, 'u_rfNoise', 0.0, 1.0).name('RFノイズ').step(0.01));

    const beamFolder = gui.addFolder('電子ビーム走査');
    trackController(beamFolder.add(draft.material, 'u_beamStrength', 0.0, 1.5).name('ビーム強調').step(0.01));
    trackController(beamFolder.add(draft.material, 'u_beamWidth', 0.2, 1.0).name('ビーム幅 / 行間隔').step(0.01));
    trackController(beamFolder.add(draft.material, 'u_refreshRate', { '50 Hz': 50, '60 Hz': 60 }).name('フィールド周波数'));
    const scanController = beamFolder.add(draft, 'scanMode', ['240p', '480i']).name('走査方式').onChange((mode) => settings.setScanMode(mode));
    trackController(beamFolder.add(draft.material, 'u_verticalBlank', 0.0, 0.18).name('垂直帰線').step(0.005));

    const persistenceFolder = gui.addFolder('残光・減衰');
    trackController(persistenceFolder.add(draft.persistence, 'u_persistenceAmount', 0.0, 1.0).name('残光の強さ').step(0.01));
    trackController(persistenceFolder.add(draft.persistence, 'u_currentContribution', 0.5, 1.5).name('現在フレーム寄与').step(0.01));
    trackController(persistenceFolder.add(draft.persistence.u_persistenceDecay, '0', 0.015, 0.35).name('R 半減期 (秒)').step(0.005));
    trackController(persistenceFolder.add(draft.persistence.u_persistenceDecay, '1', 0.015, 0.35).name('G 半減期 (秒)').step(0.005));
    trackController(persistenceFolder.add(draft.persistence.u_persistenceDecay, '2', 0.015, 0.35).name('B 半減期 (秒)').step(0.005));

    const glassFolder = gui.addFolder('ガラス反射');
    trackController(glassFolder.add(draft.glass, 'u_glassReflection', 0.0, 0.8).name('反射量').step(0.01));
    trackController(glassFolder.add(draft.glass, 'u_glassFresnel', 0.0, 2.0).name('端の反射').step(0.01));
    trackController(glassFolder.add(draft.glass, 'u_glassDepth', 0.0, 1.0).name('フェイス厚み').step(0.01));
    trackController(glassFolder.add(draft.glass, 'u_glassSmudge', 0.0, 0.8).name('画面汚れ').step(0.01));

    effectFolder.close();
    signalFolder.close();
    beamFolder.close();
    persistenceFolder.close();
    glassFolder.close();


    for (const controller of guiControllers) {
        controller.onChange(() => settings.update(draft));
    }
    function reflectSettings(snapshot) {
        for (const group of ['material', 'persistence', 'glass']) {
            for (const [key, value] of Object.entries(snapshot[group])) {
                if (Array.isArray(value)) draft[group][key].splice(0, value.length, ...value);
                else draft[group][key] = value;
            }
        }
        draft.scanMode = snapshot.material.u_interlaced ? '480i' : '240p';
        guiControllers.forEach((controller) => controller.updateDisplay());
        scanController.updateDisplay();
        document.querySelectorAll('.preset-btn').forEach((button) => {
            const active = button.dataset.preset === snapshot.activePreset;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }
    const unsubscribe = settings.subscribe(reflectSettings);
    reflectSettings(settings.getSnapshot());

    const events = new AbortController();
    const listen = (element, event, callback) => element.addEventListener(event, callback, { signal: events.signal });
    for (const button of document.querySelectorAll('.preset-btn')) {
        listen(button, 'click', () => settings.applyPreset(button.dataset.preset));
    }
    const panel = document.getElementById('ui-container');
    const content = document.getElementById('panel-content');
    const toggle = document.getElementById('panel-toggle');
    listen(toggle, 'click', () => {
        const collapsed = panel.classList.toggle('is-collapsed');
        content.hidden = collapsed;
        toggle.textContent = collapsed ? '▼' : '▲';
        toggle.setAttribute('aria-expanded', String(!collapsed));
        toggle.setAttribute('aria-label', collapsed ? 'パネルを開く' : 'パネルを閉じる');
    });
    const upload = document.getElementById('media-upload');
    listen(upload, 'change', () => {
        const file = upload.files[0];
        if (file) void media.loadFile(file);
        upload.value = ''; // Selecting the same file again is a retry.
    });
    const captureSupport = getCaptureSupport();
    const captureHint = document.getElementById('capture-support');
    captureHint.textContent = Object.values(captureSupport).map(support => support.reason).filter(Boolean).join(' ');
    captureHint.hidden = !captureHint.textContent;
    const captureButtons = {
        camera: document.getElementById('camera-start'),
        screen: document.getElementById('screen-start')
    };
    for (const [type, button] of Object.entries(captureButtons)) {
        listen(button, 'click', () => void media.startCapture(type));
    }
    const captureStop = document.getElementById('capture-stop');
    listen(captureStop, 'click', () => media.stopCapture());
    listen(document.getElementById('video-toggle'), 'click', () => void media.togglePlayback());
    listen(document.getElementById('video-rewind'), 'click', () => media.seekBy(-5));
    listen(document.getElementById('video-forward'), 'click', () => media.seekBy(5));
    function reflectMedia(state) {
        for (const [type, button] of Object.entries(captureButtons)) {
            button.disabled = !captureSupport[type].available || state.phase === 'loading';
        }
        captureStop.hidden = !state.canStopCapture;
        document.getElementById('media-status').textContent = state.message;
        document.getElementById('media-status').dataset.phase = state.phase;
        document.getElementById('video-controls').hidden = !state.isVideo;
        document.getElementById('video-toggle').textContent = state.paused ? '再生' : '一時停止';
    }
    const unsubscribeMedia = media.subscribe(reflectMedia);
    reflectMedia(media.getSnapshot());
    return { dispose() { events.abort(); unsubscribe(); unsubscribeMedia(); gui.destroy(); } };
}
