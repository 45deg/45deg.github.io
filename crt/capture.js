// getCaptureSupport reports browser capabilities; loadBrowserCapture requests a
// stream and waits for a drawable video frame. Each returned source owns its
// tracks and video element, including cleanup after cancellation or failure.
export function getCaptureSupport({
    mediaDevices = globalThis.navigator?.mediaDevices,
    secureContext = globalThis.isSecureContext
} = {}) {
    const support = {};
    for (const [type, method, label] of [
        ['camera', 'getUserMedia', 'カメラ'],
        ['screen', 'getDisplayMedia', '画面共有']
    ]) {
        const available = Boolean(secureContext && typeof mediaDevices?.[method] === 'function');
        support[type] = {
            available,
            reason: available ? '' : !secureContext
                ? `${label}はHTTPSまたはlocalhostで利用できます。`
                : `このブラウザは${label}に対応していません。`
        };
    }
    return support;
}

function captureError(error, type) {
    const label = type === 'camera' ? 'カメラ' : '画面共有';
    switch (error.name) {
        case 'NotAllowedError':
            return new Error(`${label}が許可されなかったか、選択がキャンセルされました。ブラウザやOSのアクセス許可を確認してください。`);
        case 'NotFoundError':
            return new Error(type === 'camera' ? '利用できるカメラが見つかりませんでした。' : '共有できる画面が見つかりませんでした。');
        case 'NotReadableError':
            return new Error(`${label}を開始できませんでした。他のアプリの使用状況やOSのアクセス許可を確認してください。`);
        case 'InvalidStateError':
            return new Error(`このページを開いた状態で、${label}ボタンを押して再試行してください。`);
        default:
            return new Error(`${label}の映像を取得できませんでした。もう一度お試しください。`);
    }
}

export async function loadBrowserCapture(type, signal, {
    mediaDevices = globalThis.navigator?.mediaDevices,
    secureContext = globalThis.isSecureContext
} = {}) {
    const support = getCaptureSupport({ mediaDevices, secureContext })[type];
    if (!support) throw new Error('不明なキャプチャ入力です。');
    if (!support.available) throw new Error(support.reason);
    if (signal.aborted) throw new DOMException('Capture cancelled', 'AbortError');

    let stream;
    try {
        // Call before any await so getDisplayMedia retains the button activation.
        stream = await (type === 'camera'
            ? mediaDevices.getUserMedia({ video: true, audio: false })
            : mediaDevices.getDisplayMedia({ video: true, audio: false }));
    } catch (error) {
        throw captureError(error, type);
    }
    // Permission dialogs cannot be aborted. Release a late grant without using it.
    if (signal.aborted) {
        stream.getTracks().forEach(track => track.stop());
        throw new DOMException('Capture cancelled', 'AbortError');
    }

    return new Promise((resolve, reject) => {
        const element = document.createElement('video');
        const track = stream.getVideoTracks()[0];
        let disposed = false;
        let settled = false;
        let playing = false;
        function dispose() {
            if (disposed) return;
            disposed = true;
            detach();
            stream.getTracks().forEach(track => track.stop());
            element.pause();
            element.srcObject = null;
            element.load();
        }
        function detach() {
            signal.removeEventListener('abort', abort);
            element.removeEventListener('loadeddata', ready);
            element.removeEventListener('error', failed);
            track?.removeEventListener('ended', failed);
        }
        function abort() {
            dispose();
            reject(new DOMException('Capture cancelled', 'AbortError'));
        }
        function failed() {
            if (settled) return;
            settled = true;
            dispose();
            reject(new Error('キャプチャ映像を表示できませんでした。もう一度お試しください。'));
        }
        function ready() {
            if (disposed || !playing || element.readyState < 2) return;
            const width = element.videoWidth, height = element.videoHeight;
            if (!width || !height || track.readyState === 'ended') { failed(); return; }
            settled = true;
            detach();
            resolve({ element, width, height, kind: 'video', captureType: type, stream, dispose });
        }
        if (!track || track.readyState === 'ended') { failed(); return; }
        signal.addEventListener('abort', abort, { once: true });
        element.addEventListener('loadeddata', ready, { once: true });
        element.addEventListener('error', failed, { once: true });
        track.addEventListener('ended', failed, { once: true });
        element.muted = true;
        element.playsInline = true;
        element.srcObject = stream;
        void element.play().then(() => {
            playing = true;
            ready();
        }).catch(() => { if (!disposed) failed(); });
    });
}
