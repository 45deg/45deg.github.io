import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050607);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 10);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

function createRenderTarget() {
    const renderSize = renderer.getDrawingBufferSize(new THREE.Vector2());
    return new THREE.WebGLRenderTarget(renderSize.x, renderSize.y, {
        colorSpace: THREE.LinearSRGBColorSpace,
        type: THREE.HalfFloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        generateMipmaps: false
    });
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 0.05;
controls.maxDistance = 8.0;

const sourceScene = new THREE.Scene();
const sourceCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const screenGroup = new THREE.Group();
scene.add(screenGroup);

const ambientLight = new THREE.HemisphereLight(0xe9eef6, 0x08090b, 1.15);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
keyLight.position.set(1.4, 1.1, 2.2);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x8fb4ff, 0.28);
fillLight.position.set(-1.3, -0.6, 1.1);
scene.add(fillLight);

const SCREEN_SCALE = 0.88;

function createCurvedScreenGeometry(aspect, curvature) {
    const width = aspect * 2.0 * SCREEN_SCALE;
    const height = 2.0 * SCREEN_SCALE;
    const geometry = new THREE.PlaneGeometry(width, height, 96, 96);
    const position = geometry.attributes.position;
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;
    const curveAmount = curvature * 0.012;
    const horizontalDepth = curveAmount * 0.72;
    const verticalDepth = curveAmount * 0.46;
    const cornerDepth = horizontalDepth + verticalDepth;

    function sagFromRadius(distance, halfSpan, targetDepth) {
        if (targetDepth <= 0.0 || halfSpan <= 0.0) {
            return 0.0;
        }

        const radius = (halfSpan * halfSpan + targetDepth * targetDepth) / (2.0 * targetDepth);
        const clampedDistance = Math.min(Math.abs(distance), halfSpan);
        return radius - Math.sqrt(Math.max(radius * radius - clampedDistance * clampedDistance, 0.0));
    }

    for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        const toricSag = sagFromRadius(x, halfWidth, horizontalDepth) + sagFromRadius(y, halfHeight, verticalDepth);
        const normalizedSag = cornerDepth > 0.0 ? toricSag * (curveAmount / cornerDepth) : 0.0;

        position.setXYZ(
            i,
            x,
            y,
            -normalizedSag
        );
    }

    geometry.computeVertexNormals();
    return geometry;
}

function getScreenMetrics(aspect, curvature) {
    const width = aspect * 2.0 * SCREEN_SCALE;
    const height = 2.0 * SCREEN_SCALE;
    const curveDepth = curvature * 0.012;
    const gap = 0.028 + curvature * 0.002;
    const bezelThickness = 0.24;
    const bezelDepth = 0.024;
    const openingWidth = width + gap * 2.0;
    const openingHeight = height + gap * 2.0;

    return {
        width,
        height,
        gap,
        bezelThickness,
        bezelDepth,
        curveDepth,
        openingWidth,
        openingHeight,
        outerWidth: openingWidth + bezelThickness * 2.0,
        outerHeight: openingHeight + bezelThickness * 2.0,
        emissionDepth: 0.006 + curvature * 0.0008,
        glassOffset: 0.008 + curvature * 0.0004
    };
}

function createTestPattern() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 1024, 768);

    const colors = ['#C0C0C0', '#C0C000', '#00C0C0', '#00C000', '#C000C0', '#C00000', '#0000C0'];
    const barWidth = 1024 / colors.length;
    for (let i = 0; i < colors.length; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(i * barWidth, 0, barWidth, 500);
    }
    const bottomColors = ['#0000C0', '#000000', '#C000C0', '#000000', '#00C0C0', '#000000', '#C0C0C0'];
    for (let i = 0; i < bottomColors.length; i++) {
        ctx.fillStyle = bottomColors[i];
        ctx.fillRect(i * barWidth, 500, barWidth, 100);
    }

    ctx.beginPath();
    ctx.arc(512, 350, 200, 0, Math.PI * 2);
    ctx.lineWidth = 15;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 70px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CRT SIMULATOR', 512, 330);
    ctx.font = '30px sans-serif';
    ctx.fillText('Zoom in to see RGB phosphors', 512, 390);

    const grad = ctx.createLinearGradient(0, 600, 1024, 600);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 600, 1024, 168);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.NoColorSpace;
    return { texture: tex, aspect: canvas.width / canvas.height };
}

const defaultTexInfo = createTestPattern();
const MAX_SOURCE_DIMENSION = 1024;
const VIDEO_SHUTTLE_BASE_SPEED = 1.8;
const VIDEO_SHUTTLE_MAX_SPEED = 12.0;
const VIDEO_SHUTTLE_ACCELERATION = 7.5;
const VIDEO_CONTROL_LAYOUT = [
    { action: 'rewind' },
    { action: 'togglePlayback' },
    { action: 'fastForward' }
];

function getClampedMediaSize(width, height, maxDimension = MAX_SOURCE_DIMENSION) {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    const scale = Math.min(1, maxDimension / Math.max(safeWidth, safeHeight));

    return {
        width: Math.max(1, Math.round(safeWidth * scale)),
        height: Math.max(1, Math.round(safeHeight * scale))
    };
}

function createSourceCanvasTexture(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.NoColorSpace;

    return { canvas, ctx, texture };
}

let sourceCanvasState = null;

const mediaState = {
    currentVideo: null,
    videoFrameSource: null,
    activeObjectURL: null,
    isVideoLoaded: false,
    videoFrameCallbackHandle: null,
    videoFrameNeedsUpdate: false,
    usesVideoFrameCallback: false
};

function setSourceFromElement(element, width, height) {
    const nextSize = getClampedMediaSize(width, height);

    if (!sourceCanvasState || sourceCanvasState.canvas.width !== nextSize.width || sourceCanvasState.canvas.height !== nextSize.height) {
        if (sourceCanvasState) {
            sourceCanvasState.texture.dispose();
        }

        sourceCanvasState = createSourceCanvasTexture(nextSize.width, nextSize.height);
    }

    sourceCanvasState.ctx.clearRect(0, 0, nextSize.width, nextSize.height);
    sourceCanvasState.ctx.drawImage(element, 0, 0, nextSize.width, nextSize.height);
    sourceCanvasState.texture.needsUpdate = true;

    material.uniforms.u_image.value = sourceCanvasState.texture;
    material.uniforms.u_textureAspect.value = width / height;
    updateScreenSurface(width / height);
    resetPersistenceTargets();

    return sourceCanvasState.texture;
}

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D u_image;
    uniform float u_textureAspect;
    uniform vec2 u_screenResolution;
    uniform int u_maskType;
    uniform float u_phosphorSize;
    uniform float u_curvature;
    uniform float u_brightness;
    uniform float u_bloom;
    uniform float u_slotMaskOffset;
    uniform float u_time;
    uniform float u_noiseIntensity;
    uniform float u_rollingBar;
    uniform float u_chromaticAberration;
    uniform int u_signalMode;
    uniform float u_signalArtifact;
    uniform float u_rfNoise;
    uniform float u_beamStrength;
    uniform float u_beamWidth;
    uniform float u_beamSpeed;
    uniform float u_verticalBlank;

    float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    float luminance(vec3 color) {
        return dot(color, vec3(0.299, 0.587, 0.114));
    }

    vec3 srgbToLinear(vec3 color) {
        return mix(
            color / 12.92,
            pow((color + 0.055) / 1.055, vec3(2.4)),
            step(vec3(0.04045), color)
        );
    }

    vec3 linearToSrgb(vec3 color) {
        color = max(color, vec3(0.0));
        return mix(
            color * 12.92,
            1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055,
            step(vec3(0.0031308), color)
        );
    }

    vec3 sampleSourceColor(vec2 uv) {
        return srgbToLinear(texture2D(u_image, clamp(uv, 0.0, 1.0)).rgb);
    }

    vec3 rgbToYiq(vec3 color) {
        return vec3(
            dot(color, vec3(0.299, 0.587, 0.114)),
            dot(color, vec3(0.596, -0.274, -0.322)),
            dot(color, vec3(0.211, -0.523, 0.312))
        );
    }

    vec3 yiqToRgb(vec3 yiq) {
        return vec3(
            yiq.x + 0.956 * yiq.y + 0.621 * yiq.z,
            yiq.x - 0.272 * yiq.y - 0.647 * yiq.z,
            yiq.x - 1.106 * yiq.y + 1.703 * yiq.z
        );
    }

    vec3 sampleSignalColor(vec2 uv) {
        uv = clamp(uv, 0.0, 1.0);

        if (u_signalMode == 0) {
            return sampleSourceColor(uv);
        }

        float px = 1.0 / max(u_screenResolution.x, 1.0);
        float py = 1.0 / max(u_screenResolution.y, 1.0);
        float lineIndex = floor(uv.y * u_screenResolution.y);
        float linePhase = mod(lineIndex, 2.0);
        float shimmer = sin(lineIndex * 0.43 + u_time * 31.0) * 0.0012 * u_rfNoise;
        vec2 jitteredUv = uv;

        if (u_signalMode == 2) {
            jitteredUv.x += shimmer;
            jitteredUv.y += sin(uv.x * 9.0 + u_time * 5.0) * 0.0009 * u_rfNoise;
        }

        jitteredUv = clamp(jitteredUv, 0.0, 1.0);

        vec3 center = sampleSourceColor(jitteredUv);
        vec3 left = sampleSourceColor(jitteredUv - vec2(px * 1.5, 0.0));
        vec3 right = sampleSourceColor(jitteredUv + vec2(px * 1.5, 0.0));
        vec3 farLeft = sampleSourceColor(jitteredUv - vec2(px * 3.0, 0.0));
        vec3 farRight = sampleSourceColor(jitteredUv + vec2(px * 3.0, 0.0));
        vec3 up = sampleSourceColor(jitteredUv - vec2(0.0, py));
        vec3 down = sampleSourceColor(jitteredUv + vec2(0.0, py));

        vec3 yiqCenter = rgbToYiq(center);
        vec3 yiqLeft = rgbToYiq(left);
        vec3 yiqRight = rgbToYiq(right);
        vec3 yiqFarLeft = rgbToYiq(farLeft);
        vec3 yiqFarRight = rgbToYiq(farRight);
        vec3 yiqUp = rgbToYiq(up);
        vec3 yiqDown = rgbToYiq(down);
        vec3 lumaBand = vec3((yiqLeft.x + yiqCenter.x * 2.0 + yiqRight.x) * 0.25, yiqCenter.yz);
        vec2 chromaBand = (
            yiqFarLeft.yz +
            yiqLeft.yz * 2.0 +
            yiqCenter.yz * 4.0 +
            yiqRight.yz * 2.0 +
            yiqFarRight.yz
        ) * 0.1;

        float subcarrier = sin(uv.x * u_screenResolution.x * 1.22 + linePhase * 3.14159265 + u_time * 21.0);
        float quadrature = cos(uv.x * u_screenResolution.x * 1.22 + linePhase * 3.14159265 + u_time * 21.0);
        float dotCrawl = sin(uv.x * u_screenResolution.x * 2.44 + lineIndex * 1.5707963 - u_time * 13.0);
        float crossLuma = (yiqRight.x - yiqLeft.x) * 0.16 + (yiqDown.x - yiqUp.x) * 0.08;

        vec3 decodedYiq = yiqCenter;
        decodedYiq.x = mix(yiqCenter.x, lumaBand.x + dotCrawl * dot(chromaBand, vec2(0.65, 0.35)) * 0.08, 0.62 * u_signalArtifact);
        decodedYiq.yz = mix(yiqCenter.yz, chromaBand, 0.76 * u_signalArtifact);
        decodedYiq.y += subcarrier * crossLuma * 0.28 * u_signalArtifact;
        decodedYiq.z += quadrature * crossLuma * 0.22 * u_signalArtifact;
        vec3 composite = yiqToRgb(decodedYiq);

        if (u_signalMode == 2) {
            vec3 rfBlur = (farLeft + left + center + right + farRight) * 0.2;
            float snow = (rand(jitteredUv * vec2(421.7, 283.3) + u_time) - 0.5) * 0.12 * u_rfNoise;
            float chromaError = sin(uv.x * 44.0 + uv.y * 310.0 + u_time * 24.0) * 0.035 * u_rfNoise;
            composite = mix(composite, rfBlur, 0.3 + 0.25 * u_rfNoise);
            composite += vec3(snow + chromaError, snow * 0.8, snow - chromaError);
            composite += vec3(yiqRight.x - yiqCenter.x, yiqCenter.x - yiqLeft.x, yiqLeft.x - yiqCenter.x) * 0.12 * u_rfNoise;
        }

        return clamp(composite, 0.0, 1.0);
    }

    void main() {
        vec2 uv = vUv;

        vec2 gridCount = vec2(u_phosphorSize, u_phosphorSize / u_textureAspect);
        vec2 gridUv = uv * gridCount;

        float subIndex;
        vec2 sampleUv;
        float shape;
        float scanline;
        vec2 subLocal;

        if (u_maskType == 0) {
            float dotsX = u_phosphorSize * 3.0;
            float dotsY = dotsX / u_textureAspect / 0.866025404;

            vec2 dotGrid = vec2(uv.x * dotsX, uv.y * dotsY);
            float v_index = floor(dotGrid.y);
            float u_offset = mod(v_index, 2.0) * 0.5;
            float u_index = floor(dotGrid.x - u_offset);
            vec2 localPos = vec2(fract(dotGrid.x - u_offset), fract(dotGrid.y));
            subLocal = localPos;
            vec2 p = localPos - 0.5;
            p.y *= 0.866025404;
            float dist = length(p);
            shape = smoothstep(0.40, 0.28, dist);
            float colorIndex = mod(u_index + mod(v_index, 2.0) * 2.0, 3.0);

            if (colorIndex < 1.0) { subIndex = 0.0; }
            else if (colorIndex < 2.0) { subIndex = 1.0; }
            else { subIndex = 2.0; }

            sampleUv = vec2((u_index + u_offset + 0.5) / dotsX, (v_index + 0.5) / dotsY);
            scanline = 0.8 + 0.2 * cos(dist * 3.1415 / 0.40);
        } else if (u_maskType == 1) {
            vec2 cellId = floor(gridUv);
            vec2 cellLocal = fract(gridUv);

            subIndex = floor(cellLocal.x * 3.0);
            subLocal = vec2(fract(cellLocal.x * 3.0), cellLocal.y);
            sampleUv = vec2((cellId.x + (subIndex + 0.5) / 3.0) / gridCount.x, uv.y);

            float dist = abs(subLocal.x - 0.5);
            shape = smoothstep(0.40, 0.20, dist);
            float dLine1 = abs(uv.y - 0.333) * u_screenResolution.y;
            float dLine2 = abs(uv.y - 0.666) * u_screenResolution.y;
            float damper = smoothstep(0.5, 1.5, min(dLine1, dLine2));
            shape *= damper;
            scanline = 0.8 + 0.2 * sin(uv.y * u_screenResolution.y * 0.5);
        } else {
            vec2 cellId = floor(gridUv);
            vec2 cellLocal = fract(gridUv);
            subIndex = floor(cellLocal.x * 3.0);

            float globalColumnIndex = cellId.x * 3.0 + subIndex;
            float colOffset = step(1.0, mod(globalColumnIndex, 2.0)) * u_slotMaskOffset;
            float yOffsetGrid = gridUv.y + colOffset;
            float currentCellY = floor(yOffsetGrid);
            float yLocal = fract(yOffsetGrid);

            subLocal = vec2(fract(cellLocal.x * 3.0), yLocal);
            sampleUv = vec2(
                (cellId.x + (subIndex + 0.5) / 3.0) / gridCount.x,
                (currentCellY + 0.5 - colOffset) / gridCount.y
            );

            vec2 physicalP = vec2((subLocal.x - 0.5) / 3.0, subLocal.y - 0.5);
            vec2 boxSize = vec2(0.28 / 3.0, 0.42);
            float cornerRadius = 0.05;
            vec2 q = abs(physicalP) - boxSize + cornerRadius;
            float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - cornerRadius;
            shape = smoothstep(0.04, -0.04, dist);
            scanline = 0.9 + 0.1 * sin(yLocal * 3.1415);
        }

        float densityLod = smoothstep(280.0, 380.0, u_phosphorSize);
        float simpleShape;
        if (u_maskType == 0) {
            vec2 p = subLocal - 0.5;
            p.y *= 0.866025404;
            float dist = length(p);
            float aa = max(fwidth(dist), 0.001);
            simpleShape = 1.0 - smoothstep(0.34 - aa, 0.34 + aa, dist);
        } else if (u_maskType == 1) {
            float dist = abs(subLocal.x - 0.5);
            float aa = max(fwidth(dist), 0.001);
            simpleShape = 1.0 - smoothstep(0.26 - aa, 0.26 + aa, dist);
        } else {
            vec2 p = abs(vec2(subLocal.x - 0.5, subLocal.y - 0.5));
            float dist = max(p.x - 0.28, p.y - 0.38);
            float aa = max(fwidth(dist), 0.001);
            simpleShape = 1.0 - smoothstep(-aa, aa, dist);
        }
        shape = mix(shape, simpleShape, densityLod);

        vec2 centerDist = sampleUv - 0.5;
        float caStrength = dot(centerDist, centerDist) * u_chromaticAberration;
        vec2 redOffset = centerDist * caStrength;
        vec2 blueOffset = -centerDist * caStrength;

        vec3 texColor;
        texColor.r = sampleSignalColor(sampleUv - redOffset).r;
        texColor.g = sampleSignalColor(sampleUv).g;
        texColor.b = sampleSignalColor(sampleUv - blueOffset).b;

        vec3 phosphorColor = vec3(0.0);
        float intensity = 0.0;

        if (subIndex == 0.0) {
            phosphorColor = vec3(1.0, 0.05, 0.05);
            intensity = texColor.r;
        } else if (subIndex == 1.0) {
            phosphorColor = vec3(0.05, 1.0, 0.05);
            intensity = texColor.g;
        } else {
            phosphorColor = vec3(0.05, 0.2, 1.0);
            intensity = texColor.b;
        }

        float fw = max(fwidth(gridUv.x), fwidth(gridUv.y));
        float coverageBoost = smoothstep(0.18, 0.7, fw);
        float boostedShape = mix(shape, 1.0, coverageBoost * 0.32);
        vec3 pixelGlow = phosphorColor * intensity * boostedShape * u_brightness * scanline;
        vec3 finalColor = pixelGlow * 3.0;

        float rollingBar = sin(uv.y * 15.0 - u_time * 8.0) * 0.5 + 0.5;
        finalColor *= (1.0 - rollingBar * u_rollingBar);

        float beamPhase = fract(u_time * u_beamSpeed);
        float beamSignal = clamp(max(max(texColor.r, texColor.g), texColor.b), 0.0, 1.0);
        float beamWidth = mix(u_beamWidth, u_beamWidth * 1.9, beamSignal);
        float beamDistance = abs(uv.y - beamPhase);
        float beamCore = exp(-(beamDistance * beamDistance) / max(beamWidth * beamWidth, 0.00001));
        float beamGlow = smoothstep(beamWidth * 4.0, 0.0, beamDistance);
        float retraceMask = smoothstep(1.0 - u_verticalBlank, 1.0, uv.y) * smoothstep(0.0, 0.08, beamPhase);
        finalColor *= 0.92 + beamCore * u_beamStrength * (0.55 + beamSignal * 0.75);
        finalColor += vec3(beamGlow * beamSignal * 0.08 * u_beamStrength);
        finalColor *= 1.0 - retraceMask * 0.65;

        vec2 vUv2 = uv * 2.0 - 1.0;
        float vignette = 1.0 - dot(vUv2, vUv2) * 0.15;
        finalColor *= vignette;

        float noise = rand(uv + mod(u_time, 10.0));
        finalColor += noise * u_noiseIntensity * finalColor;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        u_image: { value: defaultTexInfo.texture },
        u_textureAspect: { value: defaultTexInfo.aspect },
        u_screenResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_maskType: { value: 2 },
        u_phosphorSize: { value: 400.0 },
        u_curvature: { value: 4.0 },
        u_brightness: { value: 1.2 },
        u_bloom: { value: 0.8 },
        u_slotMaskOffset: { value: 0.5 },
        u_time: { value: 0.0 },
        u_noiseIntensity: { value: 0.1 },
        u_rollingBar: { value: 0.15 },
        u_chromaticAberration: { value: 0.01 },
        u_signalMode: { value: 0 },
        u_signalArtifact: { value: 0.45 },
        u_rfNoise: { value: 0.35 },
        u_beamStrength: { value: 0.45 },
        u_beamWidth: { value: 0.028 },
        u_beamSpeed: { value: 0.42 },
        u_verticalBlank: { value: 0.07 }
    },
    extensions: {
        derivatives: true
    }
});

const sourcePlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
sourceScene.add(sourcePlane);

const emissionDisplayMaterial = new THREE.ShaderMaterial({
    uniforms: {
        u_emissionFrame: { value: null }
    },
    side: THREE.DoubleSide,
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D u_emissionFrame;

        vec3 linearToSrgb(vec3 color) {
            color = max(color, vec3(0.0));
            return mix(
                color * 12.92,
                1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055,
                step(vec3(0.0031308), color)
            );
        }

        void main() {
            gl_FragColor = vec4(linearToSrgb(texture2D(u_emissionFrame, vUv).rgb), 1.0);
        }
    `
});

let screenGeometry = createCurvedScreenGeometry(defaultTexInfo.aspect, material.uniforms.u_curvature.value);
const emissionPlane = new THREE.Mesh(screenGeometry, emissionDisplayMaterial);
emissionPlane.renderOrder = 0;
screenGroup.add(emissionPlane);

const frameTarget = createRenderTarget();
let persistenceReadTarget = createRenderTarget();
let persistenceWriteTarget = createRenderTarget();

const persistenceScene = new THREE.Scene();
const compositeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const persistenceMaterial = new THREE.ShaderMaterial({
    uniforms: {
        u_currentFrame: { value: frameTarget.texture },
        u_previousFrame: { value: persistenceReadTarget.texture },
        u_persistenceAmount: { value: 0.85 },
        u_persistenceDecay: { value: new THREE.Vector3(0.09, 0.14, 0.065) },
        u_currentContribution: { value: 1.0 },
        u_deltaTime: { value: 1.0 / 60.0 },
        u_bloom: { value: material.uniforms.u_bloom.value },
        u_frameTexelSize: { value: new THREE.Vector2(1.0 / window.innerWidth, 1.0 / window.innerHeight) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D u_currentFrame;
        uniform sampler2D u_previousFrame;
        uniform float u_persistenceAmount;
        uniform vec3 u_persistenceDecay;
        uniform float u_currentContribution;
        uniform float u_deltaTime;
        uniform float u_bloom;
        uniform vec2 u_frameTexelSize;

        float emissionMask(vec3 color) {
            float peak = max(max(color.r, color.g), color.b);
            return smoothstep(0.035, 0.28, peak);
        }

        vec3 bloomTap(vec2 uv) {
            vec3 color = texture2D(u_currentFrame, clamp(uv, 0.0, 1.0)).rgb;
            return max(color - vec3(0.72), vec3(0.0)) * emissionMask(color);
        }

        void main() {
            vec3 currentColor = texture2D(u_currentFrame, vUv).rgb * u_currentContribution;
            vec3 previousColor = texture2D(u_previousFrame, vUv).rgb;
            float currentMask = emissionMask(currentColor);
            vec2 r1 = u_frameTexelSize * 3.0;
            vec2 r2 = u_frameTexelSize * 7.0;
            vec3 bloom = bloomTap(vUv) * 0.18;
            bloom += bloomTap(vUv + vec2(r1.x, 0.0)) * 0.12;
            bloom += bloomTap(vUv - vec2(r1.x, 0.0)) * 0.12;
            bloom += bloomTap(vUv + vec2(0.0, r1.y)) * 0.12;
            bloom += bloomTap(vUv - vec2(0.0, r1.y)) * 0.12;
            bloom += bloomTap(vUv + vec2(r2.x, r2.y)) * 0.085;
            bloom += bloomTap(vUv + vec2(-r2.x, r2.y)) * 0.085;
            bloom += bloomTap(vUv + vec2(r2.x, -r2.y)) * 0.085;
            bloom += bloomTap(vUv - vec2(r2.x, r2.y)) * 0.085;

            vec3 halfLife = max(u_persistenceDecay, vec3(0.001));
            vec3 decay = exp2(-u_deltaTime / halfLife) * u_persistenceAmount;
            vec3 persisted = currentColor + bloom * u_bloom * currentMask + previousColor * decay;
            gl_FragColor = vec4(persisted, 1.0);
        }
    `
});

const persistenceQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), persistenceMaterial);
persistenceScene.add(persistenceQuad);
const initialRenderSize = renderer.getDrawingBufferSize(new THREE.Vector2());
persistenceMaterial.uniforms.u_frameTexelSize.value.set(1.0 / initialRenderSize.x, 1.0 / initialRenderSize.y);

const glassMaterial = new THREE.ShaderMaterial({
    uniforms: {
        u_emissionFrame: { value: persistenceWriteTarget.texture },
        u_glassReflection: { value: 0.26 },
        u_glassFresnel: { value: 1.15 },
        u_glassTint: { value: new THREE.Color(0xbfd7ff) },
        u_glassDepth: { value: 0.2 },
        u_glassSmudge: { value: 0.08 },
        u_time: { value: 0.0 }
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
            vUv = uv;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;
        uniform sampler2D u_emissionFrame;
        uniform float u_glassReflection;
        uniform float u_glassFresnel;
        uniform vec3 u_glassTint;
        uniform float u_glassDepth;
        uniform float u_glassSmudge;
        uniform float u_time;

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);

            return mix(
                mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
                u.y
            );
        }

        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;

            for (int i = 0; i < 4; i++) {
                value += noise(p) * amplitude;
                p = p * 2.03 + vec2(17.1, 9.2);
                amplitude *= 0.5;
            }

            return value;
        }

        vec3 linearToSrgb(vec3 color) {
            color = max(color, vec3(0.0));
            return mix(
                color * 12.92,
                1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055,
                step(vec3(0.0031308), color)
            );
        }

        void main() {
            vec3 emissionColor = texture2D(u_emissionFrame, vUv).rgb;
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            float fresnelView = pow(1.0 - max(dot(normalize(vWorldNormal), viewDir), 0.0), 2.2);

            vec2 glassUv = vUv * 2.0 - 1.0;
            float edge = clamp(length(glassUv), 0.0, 1.0);
            float fresnel = (pow(edge, 1.35) * 0.55 + fresnelView) * u_glassFresnel;
            float diagonalHighlight = smoothstep(0.13, 0.0, abs(vUv.x * 1.18 + vUv.y * 0.72 - 0.94));
            float edgeHighlight = smoothstep(0.42, 1.0, edge);
            vec2 smudgeUv = vUv * vec2(3.2, 2.4);
            vec2 smearWarp = vec2(
                fbm(smudgeUv * vec2(0.65, 1.4) + vec2(2.1, 4.8)),
                fbm(smudgeUv * vec2(0.55, 1.1) + vec2(7.4, 1.6))
            ) - 0.5;
            smudgeUv += smearWarp * vec2(0.55, 0.2);

            float wipeDirection = smudgeUv.x * 1.15 + smudgeUv.y * 0.38;
            float longStreaks = 1.0 - smoothstep(0.08, 0.4, abs(fract(wipeDirection) - 0.5) * 2.0);
            float brokenCoverage = smoothstep(0.42, 0.82, fbm(vec2(smudgeUv.x * 0.7, smudgeUv.y * 3.8) + vec2(3.7, 8.9)));
            float microBreakup = smoothstep(0.48, 0.8, fbm(smudgeUv * vec2(5.5, 12.0) + vec2(11.3, 2.4)));
            float fingerArc = 1.0 - smoothstep(0.18, 0.7, abs(length((vUv - vec2(0.52, 0.46)) * vec2(1.0, 1.6)) - 0.34));
            float centerFalloff = 1.0 - smoothstep(0.18, 0.92, edge);
            float smudge = (
                longStreaks * brokenCoverage * 0.7 +
                microBreakup * fingerArc * 0.45
            ) * (0.2 + edge * 0.55 + centerFalloff * 0.25) * u_glassSmudge;
            vec2 thicknessOffset = glassUv * 0.006 * u_glassDepth;
            vec3 depthGhost = texture2D(u_emissionFrame, clamp(vUv - thicknessOffset, 0.0, 1.0)).rgb * 0.12 * u_glassDepth;
            float sceneDarkness = 1.0 - smoothstep(0.18, 0.85, max(max(emissionColor.r, emissionColor.g), emissionColor.b));
            vec3 reflection = u_glassTint * (diagonalHighlight * 0.85 + edgeHighlight * 0.3);
            vec3 dirt = u_glassTint * smudge;
            vec3 finalColor = depthGhost;
            finalColor += reflection * u_glassReflection * (0.18 + fresnel) * (0.45 + sceneDarkness * 0.55);
            finalColor += dirt * (0.22 + edge * 0.28 + sceneDarkness * 0.5);
            float alpha = clamp(max(max(finalColor.r, finalColor.g), finalColor.b) * 1.2, 0.0, 0.9);

            gl_FragColor = vec4(linearToSrgb(finalColor), alpha);
        }
    `
});

const glassPlane = new THREE.Mesh(screenGeometry.clone(), glassMaterial);
glassPlane.renderOrder = 2;
screenGroup.add(glassPlane);

const bezelGroup = new THREE.Group();
screenGroup.add(bezelGroup);

const bezelMaterial = new THREE.MeshStandardMaterial({
    color: 0x171717,
    roughness: 0.78,
    metalness: 0.15
});

const bezelLipMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a0b,
    roughness: 0.92,
    metalness: 0.02
});

const bezelControlMaterial = new THREE.MeshStandardMaterial({
    color: 0xc8bea8,
    roughness: 0.42,
    metalness: 0.34,
    envMapIntensity: 0.7
});

const bezelControlActiveMaterial = new THREE.MeshStandardMaterial({
    color: 0xb6ab93,
    roughness: 0.52,
    metalness: 0.24,
    emissive: 0x14110c,
    envMapIntensity: 0.5
});

const bezelControlPanelMaterial = new THREE.MeshStandardMaterial({
    color: 0x111214,
    roughness: 0.92,
    metalness: 0.08
});

function createBezelPart(material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
    mesh.renderOrder = 1;
    bezelGroup.add(mesh);
    return mesh;
}

const bezelParts = {
    top: createBezelPart(bezelMaterial),
    bottom: createBezelPart(bezelMaterial),
    left: createBezelPart(bezelMaterial),
    right: createBezelPart(bezelMaterial),
    cavityTop: createBezelPart(bezelLipMaterial),
    cavityBottom: createBezelPart(bezelLipMaterial),
    cavityLeft: createBezelPart(bezelLipMaterial),
    cavityRight: createBezelPart(bezelLipMaterial),
    backShell: createBezelPart(bezelMaterial)
};

const bezelControlsGroup = new THREE.Group();
bezelControlsGroup.visible = false;
bezelGroup.add(bezelControlsGroup);
const bezelControlPanel = new THREE.Mesh(
    new RoundedBoxGeometry(1, 1, 1, 8, 0.05),
    bezelControlPanelMaterial
);
bezelControlsGroup.add(bezelControlPanel);

function drawTriangle(ctx, x, y, width, height, direction) {
    ctx.beginPath();

    if (direction === 'right') {
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y + height * 0.5);
        ctx.lineTo(x, y + height);
    } else {
        ctx.moveTo(x + width, y);
        ctx.lineTo(x, y + height * 0.5);
        ctx.lineTo(x + width, y + height);
    }

    ctx.closePath();
    ctx.fill();
}

function drawPauseBars(ctx, x, y, width, height) {
    const barWidth = width * 0.28;
    const gap = width * 0.18;
    ctx.fillRect(x, y, barWidth, height);
    ctx.fillRect(x + barWidth + gap, y, barWidth, height);
}

function drawButtonGlyph(ctx, action) {
    ctx.save();
    ctx.fillStyle = '#23313f';
    ctx.shadowColor = 'rgba(255,255,255,0.18)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 1;

    if (action === 'rewind') {
        drawTriangle(ctx, 160, 54, 68, 84, 'left');
        drawTriangle(ctx, 222, 54, 68, 84, 'left');
        ctx.fillRect(298, 56, 18, 80);
    } else if (action === 'fastForward') {
        ctx.fillRect(196, 56, 18, 80);
        drawTriangle(ctx, 222, 54, 68, 84, 'right');
        drawTriangle(ctx, 284, 54, 68, 84, 'right');
    } else {
        drawTriangle(ctx, 166, 54, 74, 84, 'right');
        drawPauseBars(ctx, 266, 56, 74, 80);
    }

    ctx.restore();
}

function createButtonLabelTexture(action) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    drawButtonGlyph(ctx, action);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function createBezelControl({ action }) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
        new RoundedBoxGeometry(1, 1, 1, 8, 0.045),
        bezelControlMaterial
    );
    const labelTexture = createButtonLabelTexture(action);
    const labelPlate = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
            map: labelTexture,
            transparent: true,
            alphaTest: 0.08,
        })
    );

    body.position.z = 0.006;
    labelPlate.position.z = 0.016;
    group.add(body);
    group.add(labelPlate);

    group.userData = {
        action,
        body,
        labelPlate,
        labelTexture,
        isPressed: false
    };

    bezelControlsGroup.add(group);
    return group;
}

const bezelControls = VIDEO_CONTROL_LAYOUT.map(createBezelControl);

function updateVideoControlVisibility() {
    bezelControlsGroup.visible = mediaState.isVideoLoaded;
}

function setButtonPressed(button, pressed) {
    if (button.userData.isPressed === pressed) {
        return;
    }

    button.userData.isPressed = pressed;
    button.userData.body.material = pressed ? bezelControlActiveMaterial : bezelControlMaterial;
    button.userData.body.position.z = pressed ? 0.003 : 0.006;
    button.userData.labelPlate.position.z = pressed ? 0.013 : 0.016;
}

async function toggleVideoPlayback() {
    if (!mediaState.currentVideo) {
        return;
    }

    if (mediaState.currentVideo.paused) {
        try {
            await mediaState.currentVideo.play();
        } catch (error) {
            console.warn('Video playback could not resume.', error);
        }
        return;
    }

    mediaState.currentVideo.pause();
}

const controlInteractionState = {
    activeButton: null,
    activePointerId: null
};
const shuttleState = {
    direction: 0,
    speed: 0,
    active: false,
    wasPlaying: false
};

function clampVideoTime(time, duration) {
    if (!Number.isFinite(duration) || duration <= 0) {
        return 0;
    }

    return THREE.MathUtils.clamp(time, 0, duration);
}

function isShuttleControl(action) {
    return action === 'rewind' || action === 'fastForward';
}

function getShuttleDirection(action) {
    if (action === 'rewind') {
        return -1;
    }

    if (action === 'fastForward') {
        return 1;
    }

    return 0;
}

function startVideoShuttle(action) {
    if (!mediaState.currentVideo) {
        return;
    }

    shuttleState.direction = getShuttleDirection(action);
    shuttleState.speed = VIDEO_SHUTTLE_BASE_SPEED;
    shuttleState.active = shuttleState.direction !== 0;
    shuttleState.wasPlaying = !mediaState.currentVideo.paused;

    if (shuttleState.active && shuttleState.wasPlaying) {
        mediaState.currentVideo.pause();
    }
}

async function stopVideoShuttle() {
    if (!shuttleState.active) {
        shuttleState.direction = 0;
        shuttleState.speed = 0;
        shuttleState.wasPlaying = false;
        return;
    }

    shuttleState.active = false;
    shuttleState.direction = 0;
    shuttleState.speed = 0;

    if (shuttleState.wasPlaying && mediaState.currentVideo) {
        try {
            await mediaState.currentVideo.play();
        } catch (error) {
            console.warn('Video playback could not resume after shuttle.', error);
        }
    }

    shuttleState.wasPlaying = false;
}

function releaseActiveControl() {
    if (controlInteractionState.activeButton) {
        setButtonPressed(controlInteractionState.activeButton, false);
    }

    controlInteractionState.activeButton = null;
    controlInteractionState.activePointerId = null;
    void stopVideoShuttle();
    controls.enabled = true;
}

function layoutBezelControls(metrics) {
    const baseWidths = {
        rewind: 0.18,
        togglePlayback: 0.235,
        fastForward: 0.18
    };
    const baseGap = 0.042;
    const availableWidth = metrics.outerWidth - metrics.bezelThickness * 0.7;
    const baseTotalWidth = Object.values(baseWidths).reduce((sum, width) => sum + width, 0) + baseGap * (bezelControls.length - 1);
    const widthScale = THREE.MathUtils.clamp(availableWidth / (baseTotalWidth + 0.08), 0.92, 1.02);
    const spacing = baseGap * widthScale;
    const buttonHeight = Math.min(metrics.bezelThickness * 0.34, 0.078);
    const buttonDepth = Math.min(metrics.bezelDepth * 0.56, 0.018);
    const buttonY = bezelParts.bottom.position.y;
    const panelWidth = baseTotalWidth * widthScale + 0.095;
    const panelHeight = buttonHeight + 0.06;
    const panelDepth = Math.min(metrics.bezelDepth * 0.68, 0.02);
    const panelZ = bezelParts.bottom.position.z + metrics.bezelDepth * 0.34;
    const totalButtonWidth = Object.values(baseWidths).reduce((sum, width) => sum + width * widthScale, 0) + spacing * (bezelControls.length - 1);
    let currentX = -totalButtonWidth * 0.5;

    bezelControlPanel.scale.set(panelWidth, panelHeight, panelDepth);
    bezelControlPanel.position.set(0, buttonY, panelZ);

    bezelControls.forEach((button) => {
        const buttonWidth = baseWidths[button.userData.action] * widthScale;
        const centerX = currentX + buttonWidth * 0.5;
        button.position.set(centerX, buttonY, panelZ + panelDepth * 0.34);
        button.userData.body.scale.set(buttonWidth, buttonHeight, buttonDepth);
        button.userData.labelPlate.scale.set(buttonWidth * 0.54, buttonHeight * 0.58, 1);
        currentX += buttonWidth + spacing;
    });
}

function disposeActiveObjectURL() {
    if (mediaState.activeObjectURL) {
        URL.revokeObjectURL(mediaState.activeObjectURL);
        mediaState.activeObjectURL = null;
    }
}

function teardownCurrentVideo() {
    if (!mediaState.currentVideo) {
        return;
    }

    if (mediaState.videoFrameCallbackHandle !== null && typeof mediaState.currentVideo.cancelVideoFrameCallback === 'function') {
        mediaState.currentVideo.cancelVideoFrameCallback(mediaState.videoFrameCallbackHandle);
    }

    mediaState.currentVideo.pause();
    mediaState.currentVideo.removeAttribute('src');
    mediaState.currentVideo.load();
    mediaState.currentVideo = null;
    mediaState.videoFrameSource = null;
    mediaState.isVideoLoaded = false;
    mediaState.videoFrameCallbackHandle = null;
    mediaState.videoFrameNeedsUpdate = false;
    mediaState.usesVideoFrameCallback = false;
    updateVideoControlVisibility();
}

function markVideoFrameDirty() {
    mediaState.videoFrameNeedsUpdate = true;
}

function scheduleVideoFrameUpdates(video) {
    if (typeof video.requestVideoFrameCallback !== 'function') {
        mediaState.usesVideoFrameCallback = false;
        return;
    }

    mediaState.usesVideoFrameCallback = true;
    const onFrame = () => {
        if (mediaState.currentVideo !== video) {
            return;
        }

        markVideoFrameDirty();
        mediaState.videoFrameCallbackHandle = video.requestVideoFrameCallback(onFrame);
    };

    mediaState.videoFrameCallbackHandle = video.requestVideoFrameCallback(onFrame);
}

function applyVideoSource(video) {
    setSourceFromElement(video, video.videoWidth, video.videoHeight);
    mediaState.videoFrameSource = video;
    mediaState.isVideoLoaded = true;
    markVideoFrameDirty();
    scheduleVideoFrameUpdates(video);
    updateVideoControlVisibility();
}

function loadVideo(fileURL) {
    const video = document.createElement('video');
    video.src = fileURL;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.addEventListener('loadedmetadata', () => {
        applyVideoSource(video);
    }, { once: true });
    video.addEventListener('seeked', markVideoFrameDirty);
    video.addEventListener('timeupdate', markVideoFrameDirty);
    video.play().catch((error) => {
        console.warn('Video autoplay could not start immediately.', error);
    });

    mediaState.currentVideo = video;
}

function loadImage(fileURL) {
    const img = new Image();
    img.onload = () => {
        setSourceFromElement(img, img.width, img.height);
        disposeActiveObjectURL();
    };
    img.src = fileURL;
}

function loadMediaFile(file) {
    teardownCurrentVideo();
    mediaState.videoFrameSource = null;
    mediaState.isVideoLoaded = false;
    updateVideoControlVisibility();
    disposeActiveObjectURL();

    const fileURL = URL.createObjectURL(file);
    mediaState.activeObjectURL = fileURL;

    if (file.type.startsWith('video/')) {
        loadVideo(fileURL);
        return;
    }

    loadImage(fileURL);
}

function updateVideoShuttle(deltaSeconds) {
    if (!shuttleState.active || !mediaState.currentVideo) {
        return;
    }

    shuttleState.speed = Math.min(
        shuttleState.speed + VIDEO_SHUTTLE_ACCELERATION * deltaSeconds,
        VIDEO_SHUTTLE_MAX_SPEED
    );

    const nextTime = clampVideoTime(
        mediaState.currentVideo.currentTime + shuttleState.direction * shuttleState.speed * deltaSeconds,
        mediaState.currentVideo.duration
    );

    mediaState.currentVideo.currentTime = nextTime;
    markVideoFrameDirty();

    const atStart = nextTime <= 0.001;
    const atEnd = Number.isFinite(mediaState.currentVideo.duration)
        && nextTime >= mediaState.currentVideo.duration - 0.001;

    if (atStart || atEnd) {
        void stopVideoShuttle();
    }
}

function updatePointerFromEvent(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pickBezelControl(event) {
    if (!bezelControlsGroup.visible) {
        return null;
    }

    updatePointerFromEvent(event);
    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(
        bezelControls.map((button) => button.userData.body),
        false
    );

    if (intersections.length === 0) {
        return null;
    }

    return bezelControls.find((button) => button.userData.body === intersections[0].object) ?? null;
}

renderer.domElement.addEventListener('pointerdown', async (event) => {
    const button = pickBezelControl(event);
    if (!button) {
        return;
    }

    controls.enabled = false;
    controlInteractionState.activeButton = button;
    controlInteractionState.activePointerId = event.pointerId;
    setButtonPressed(button, true);
    renderer.domElement.setPointerCapture(event.pointerId);

    if (isShuttleControl(button.userData.action)) {
        startVideoShuttle(button.userData.action);
        return;
    }

    await toggleVideoPlayback();
});

renderer.domElement.addEventListener('pointerup', (event) => {
    if (controlInteractionState.activePointerId !== event.pointerId) {
        return;
    }

    if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
    }

    releaseActiveControl();
});

renderer.domElement.addEventListener('pointerleave', () => {
    if (controlInteractionState.activePointerId === null) {
        controls.enabled = true;
    }
});

renderer.domElement.addEventListener('pointercancel', (event) => {
    if (controlInteractionState.activePointerId !== event.pointerId) {
        return;
    }

    releaseActiveControl();
});

function resetPersistenceTargets() {
    const currentTarget = renderer.getRenderTarget();
    const clearColor = renderer.getClearColor(new THREE.Color());
    const clearAlpha = renderer.getClearAlpha();

    renderer.setRenderTarget(persistenceReadTarget);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();

    renderer.setRenderTarget(persistenceWriteTarget);
    renderer.clear();

    renderer.setRenderTarget(frameTarget);
    renderer.clear();
    renderer.setRenderTarget(currentTarget);
    renderer.setClearColor(clearColor, clearAlpha);
}

function updateScreenSurface(aspect = material.uniforms.u_textureAspect.value) {
    const metrics = getScreenMetrics(aspect, material.uniforms.u_curvature.value);
    const nextGeometry = createCurvedScreenGeometry(aspect, material.uniforms.u_curvature.value);

    emissionPlane.geometry.dispose();
    glassPlane.geometry.dispose();

    emissionPlane.geometry = nextGeometry;
    glassPlane.geometry = nextGeometry.clone();
    emissionPlane.position.z = metrics.curveDepth - metrics.emissionDepth;
    glassPlane.position.z = metrics.curveDepth + metrics.glassOffset;

    const emissionEdgeZ = emissionPlane.position.z - metrics.curveDepth;
    const glassEdgeZ = glassPlane.position.z - metrics.curveDepth;

    const bezelBackOffset = 0.006;
    const bezelFrontZ = glassEdgeZ + bezelBackOffset + metrics.bezelDepth * 0.5;
    const bezelShellZ = emissionEdgeZ - 0.03;
    const cavityDepth = Math.max(glassEdgeZ - emissionEdgeZ - 0.004, 0.008);
    const cavityZ = emissionEdgeZ + cavityDepth * 0.5 + 0.002;

    bezelParts.top.scale.set(metrics.outerWidth, metrics.bezelThickness, metrics.bezelDepth);
    bezelParts.top.position.set(0, (metrics.openingHeight + metrics.bezelThickness) * 0.5, bezelFrontZ);
    bezelParts.bottom.scale.set(metrics.outerWidth, metrics.bezelThickness, metrics.bezelDepth);
    bezelParts.bottom.position.set(0, -(metrics.openingHeight + metrics.bezelThickness) * 0.5, bezelFrontZ);
    bezelParts.left.scale.set(metrics.bezelThickness, metrics.openingHeight, metrics.bezelDepth);
    bezelParts.left.position.set(-(metrics.openingWidth + metrics.bezelThickness) * 0.5, 0, bezelFrontZ);
    bezelParts.right.scale.set(metrics.bezelThickness, metrics.openingHeight, metrics.bezelDepth);
    bezelParts.right.position.set((metrics.openingWidth + metrics.bezelThickness) * 0.5, 0, bezelFrontZ);

    bezelParts.cavityTop.scale.set(metrics.openingWidth, metrics.gap, cavityDepth);
    bezelParts.cavityTop.position.set(0, metrics.height * 0.5 + metrics.gap * 0.5, cavityZ);
    bezelParts.cavityBottom.scale.set(metrics.openingWidth, metrics.gap, cavityDepth);
    bezelParts.cavityBottom.position.set(0, -(metrics.height * 0.5 + metrics.gap * 0.5), cavityZ);
    bezelParts.cavityLeft.scale.set(metrics.gap, metrics.height, cavityDepth);
    bezelParts.cavityLeft.position.set(-(metrics.width * 0.5 + metrics.gap * 0.5), 0, cavityZ);
    bezelParts.cavityRight.scale.set(metrics.gap, metrics.height, cavityDepth);
    bezelParts.cavityRight.position.set(metrics.width * 0.5 + metrics.gap * 0.5, 0, cavityZ);

    bezelParts.backShell.scale.set(metrics.outerWidth + 0.06, metrics.outerHeight + 0.06, 0.05);
    bezelParts.backShell.position.set(0, 0, bezelShellZ);
    layoutBezelControls(metrics);
}

const CRT_PRESETS = {
    consumer: {
        material: {
            u_maskType: 2,
            u_phosphorSize: 400.0,
            u_curvature: 4.0,
            u_brightness: 1.2,
            u_bloom: 0.8,
            u_slotMaskOffset: 0.5,
            u_noiseIntensity: 0.1,
            u_rollingBar: 0.15,
            u_chromaticAberration: 0.01,
            u_signalMode: 0,
            u_signalArtifact: 0.45,
            u_rfNoise: 0.35,
            u_beamStrength: 0.45,
            u_beamWidth: 0.028,
            u_beamSpeed: 0.42,
            u_verticalBlank: 0.07
        },
        persistence: {
            u_persistenceAmount: 0.85,
            u_currentContribution: 1.0,
            u_persistenceDecay: [0.09, 0.14, 0.065]
        },
        glass: {
            u_glassReflection: 0.26,
            u_glassFresnel: 1.15,
            u_glassDepth: 0.2,
            u_glassSmudge: 0.08
        }
    },
    broadcast: {
        material: {
            u_maskType: 1,
            u_phosphorSize: 330.0,
            u_curvature: 2.4,
            u_brightness: 1.35,
            u_bloom: 0.45,
            u_slotMaskOffset: 0.0,
            u_noiseIntensity: 0.035,
            u_rollingBar: 0.045,
            u_chromaticAberration: 0.004,
            u_signalMode: 0,
            u_signalArtifact: 0.08,
            u_rfNoise: 0.03,
            u_beamStrength: 0.32,
            u_beamWidth: 0.018,
            u_beamSpeed: 0.55,
            u_verticalBlank: 0.035
        },
        persistence: {
            u_persistenceAmount: 0.72,
            u_currentContribution: 1.08,
            u_persistenceDecay: [0.055, 0.095, 0.045]
        },
        glass: {
            u_glassReflection: 0.18,
            u_glassFresnel: 0.85,
            u_glassDepth: 0.13,
            u_glassSmudge: 0.035
        }
    },
    arcade: {
        material: {
            u_maskType: 2,
            u_phosphorSize: 210.0,
            u_curvature: 5.8,
            u_brightness: 1.55,
            u_bloom: 1.15,
            u_slotMaskOffset: 0.5,
            u_noiseIntensity: 0.08,
            u_rollingBar: 0.1,
            u_chromaticAberration: 0.018,
            u_signalMode: 1,
            u_signalArtifact: 0.32,
            u_rfNoise: 0.12,
            u_beamStrength: 0.72,
            u_beamWidth: 0.036,
            u_beamSpeed: 0.5,
            u_verticalBlank: 0.08
        },
        persistence: {
            u_persistenceAmount: 0.88,
            u_currentContribution: 1.08,
            u_persistenceDecay: [0.105, 0.18, 0.075]
        },
        glass: {
            u_glassReflection: 0.32,
            u_glassFresnel: 1.25,
            u_glassDepth: 0.28,
            u_glassSmudge: 0.12
        }
    },
    pvm: {
        material: {
            u_maskType: 0,
            u_phosphorSize: 390.0,
            u_curvature: 1.2,
            u_brightness: 1.15,
            u_bloom: 0.22,
            u_slotMaskOffset: 0.0,
            u_noiseIntensity: 0.015,
            u_rollingBar: 0.02,
            u_chromaticAberration: 0.002,
            u_signalMode: 0,
            u_signalArtifact: 0.02,
            u_rfNoise: 0.0,
            u_beamStrength: 0.22,
            u_beamWidth: 0.012,
            u_beamSpeed: 0.7,
            u_verticalBlank: 0.025
        },
        persistence: {
            u_persistenceAmount: 0.6,
            u_currentContribution: 1.18,
            u_persistenceDecay: [0.035, 0.07, 0.03]
        },
        glass: {
            u_glassReflection: 0.12,
            u_glassFresnel: 0.55,
            u_glassDepth: 0.08,
            u_glassSmudge: 0.015
        }
    },
    rf: {
        material: {
            u_maskType: 2,
            u_phosphorSize: 165.0,
            u_curvature: 6.8,
            u_brightness: 1.05,
            u_bloom: 1.35,
            u_slotMaskOffset: 0.6,
            u_noiseIntensity: 0.22,
            u_rollingBar: 0.26,
            u_chromaticAberration: 0.03,
            u_signalMode: 2,
            u_signalArtifact: 0.72,
            u_rfNoise: 0.78,
            u_beamStrength: 0.9,
            u_beamWidth: 0.048,
            u_beamSpeed: 0.34,
            u_verticalBlank: 0.11
        },
        persistence: {
            u_persistenceAmount: 0.94,
            u_currentContribution: 0.9,
            u_persistenceDecay: [0.14, 0.22, 0.1]
        },
        glass: {
            u_glassReflection: 0.36,
            u_glassFresnel: 1.45,
            u_glassDepth: 0.34,
            u_glassSmudge: 0.22
        }
    },
    aged: {
        material: {
            u_maskType: 0,
            u_phosphorSize: 260.0,
            u_curvature: 7.6,
            u_brightness: 0.92,
            u_bloom: 0.95,
            u_slotMaskOffset: 0.2,
            u_noiseIntensity: 0.16,
            u_rollingBar: 0.22,
            u_chromaticAberration: 0.022,
            u_signalMode: 1,
            u_signalArtifact: 0.52,
            u_rfNoise: 0.28,
            u_beamStrength: 0.58,
            u_beamWidth: 0.04,
            u_beamSpeed: 0.36,
            u_verticalBlank: 0.095
        },
        persistence: {
            u_persistenceAmount: 0.9,
            u_currentContribution: 0.92,
            u_persistenceDecay: [0.16, 0.24, 0.13]
        },
        glass: {
            u_glassReflection: 0.42,
            u_glassFresnel: 1.65,
            u_glassDepth: 0.42,
            u_glassSmudge: 0.34
        }
    }
};

const guiControllers = [];

function trackController(controller) {
    guiControllers.push(controller);
    return controller;
}

function setUniformValues(uniforms, values) {
    Object.entries(values).forEach(([key, value]) => {
        const uniform = uniforms[key];
        if (!uniform) {
            return;
        }

        if (Array.isArray(value) && uniform.value?.set) {
            uniform.value.set(...value);
            return;
        }

        uniform.value = value;
    });
}

function updatePresetButtons(activePresetKey) {
    document.querySelectorAll('.preset-btn').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.preset === activePresetKey);
    });
}

function applyCrtPreset(presetKey) {
    const preset = CRT_PRESETS[presetKey];
    if (!preset) {
        return;
    }

    setUniformValues(material.uniforms, preset.material);
    setUniformValues(persistenceMaterial.uniforms, preset.persistence);
    setUniformValues(glassMaterial.uniforms, preset.glass);
    updateScreenSurface();
    resetPersistenceTargets();
    guiControllers.forEach((controller) => controller.updateDisplay());
    updatePresetButtons(presetKey);
}

const gui = new GUI({ title: 'CRT パラメータ' });
gui.domElement.style.position = 'absolute';
gui.domElement.style.top = '20px';
gui.domElement.style.right = '20px';
gui.close();

trackController(gui.add(material.uniforms.u_maskType, 'value', { 'シャドーマスク (ドット)': 0, 'アパチャーグリル (縦線)': 1, 'スロットマスク (千鳥長方形)': 2 }).name('マスク方式'));
trackController(gui.add(material.uniforms.u_phosphorSize, 'value', 50, 400).name('素子密度').step(10));
trackController(gui.add(material.uniforms.u_curvature, 'value', 0.0, 10.0).name('画面の湾曲度').onChange(() => {
    updateScreenSurface();
}));
trackController(gui.add(material.uniforms.u_brightness, 'value', 0.5, 3.0).name('明るさ'));
trackController(gui.add(material.uniforms.u_bloom, 'value', 0.0, 2.0).name('にじみ (Bloom)'));
trackController(gui.add(material.uniforms.u_slotMaskOffset, 'value', 0.0, 1.0).name('配列ズレ (スロット)').step(0.1));

const effectFolder = gui.addFolder('追加エフェクト');
trackController(effectFolder.add(material.uniforms.u_noiseIntensity, 'value', 0.0, 0.5).name('アナログノイズ'));
trackController(effectFolder.add(material.uniforms.u_rollingBar, 'value', 0.0, 0.5).name('フリッカー帯'));
trackController(effectFolder.add(material.uniforms.u_chromaticAberration, 'value', 0.0, 0.05).name('レンズ色収差').step(0.001));

const signalFolder = gui.addFolder('信号方式');
trackController(signalFolder.add(material.uniforms.u_signalMode, 'value', { 'RGB': 0, 'Composite': 1, 'RF': 2 }).name('入力方式').onChange(resetPersistenceTargets));
trackController(signalFolder.add(material.uniforms.u_signalArtifact, 'value', 0.0, 1.0).name('色分離失敗').step(0.01).onChange(resetPersistenceTargets));
trackController(signalFolder.add(material.uniforms.u_rfNoise, 'value', 0.0, 1.0).name('RFノイズ').step(0.01).onChange(resetPersistenceTargets));

const beamFolder = gui.addFolder('電子ビーム走査');
trackController(beamFolder.add(material.uniforms.u_beamStrength, 'value', 0.0, 1.5).name('ビーム強調').step(0.01).onChange(resetPersistenceTargets));
trackController(beamFolder.add(material.uniforms.u_beamWidth, 'value', 0.005, 0.08).name('ビーム幅').step(0.001).onChange(resetPersistenceTargets));
trackController(beamFolder.add(material.uniforms.u_beamSpeed, 'value', 0.05, 1.5).name('走査速度').step(0.01));
trackController(beamFolder.add(material.uniforms.u_verticalBlank, 'value', 0.0, 0.18).name('垂直帰線').step(0.005).onChange(resetPersistenceTargets));

const persistenceFolder = gui.addFolder('残光・減衰');
trackController(persistenceFolder.add(persistenceMaterial.uniforms.u_persistenceAmount, 'value', 0.0, 1.0).name('残光の強さ').step(0.01));
trackController(persistenceFolder.add(persistenceMaterial.uniforms.u_currentContribution, 'value', 0.5, 1.5).name('現在フレーム寄与').step(0.01));
trackController(persistenceFolder.add(persistenceMaterial.uniforms.u_persistenceDecay.value, 'x', 0.015, 0.35).name('R 半減期').step(0.005));
trackController(persistenceFolder.add(persistenceMaterial.uniforms.u_persistenceDecay.value, 'y', 0.015, 0.35).name('G 半減期').step(0.005));
trackController(persistenceFolder.add(persistenceMaterial.uniforms.u_persistenceDecay.value, 'z', 0.015, 0.35).name('B 半減期').step(0.005));

const glassFolder = gui.addFolder('ガラス反射');
trackController(glassFolder.add(glassMaterial.uniforms.u_glassReflection, 'value', 0.0, 0.8).name('反射量').step(0.01));
trackController(glassFolder.add(glassMaterial.uniforms.u_glassFresnel, 'value', 0.0, 2.0).name('端の反射').step(0.01));
trackController(glassFolder.add(glassMaterial.uniforms.u_glassDepth, 'value', 0.0, 1.0).name('フェイス厚み').step(0.01));
trackController(glassFolder.add(glassMaterial.uniforms.u_glassSmudge, 'value', 0.0, 0.8).name('画面汚れ').step(0.01));

effectFolder.close();
signalFolder.close();
beamFolder.close();
persistenceFolder.close();
glassFolder.close();

document.querySelectorAll('.preset-btn').forEach((button) => {
    button.addEventListener('click', () => {
        applyCrtPreset(button.dataset.preset);
    });
});

applyCrtPreset('consumer');

const uiContainer = document.getElementById('ui-container');
const panelToggle = document.getElementById('panel-toggle');

panelToggle.addEventListener('click', () => {
    const isCollapsed = uiContainer.classList.toggle('is-collapsed');
    panelToggle.textContent = isCollapsed ? '▼' : '▲';
    panelToggle.setAttribute('aria-expanded', String(!isCollapsed));
    panelToggle.setAttribute('aria-label', isCollapsed ? 'パネルを開く' : 'パネルを閉じる');
});

document.getElementById('media-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    loadMediaFile(file);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.u_screenResolution.value.set(window.innerWidth, window.innerHeight);

    const renderSize = renderer.getDrawingBufferSize(new THREE.Vector2());
    frameTarget.setSize(renderSize.x, renderSize.y);
    persistenceReadTarget.setSize(renderSize.x, renderSize.y);
    persistenceWriteTarget.setSize(renderSize.x, renderSize.y);
    persistenceMaterial.uniforms.u_frameTexelSize.value.set(1.0 / renderSize.x, 1.0 / renderSize.y);
    resetPersistenceTargets();
});

let lastFrameTime = 0;

function animate(time) {
    requestAnimationFrame(animate);
    const deltaSeconds = Math.min(Math.max((time - lastFrameTime) * 0.001, 0), 0.05);
    lastFrameTime = time;
    material.uniforms.u_time.value = time * 0.001;
    glassMaterial.uniforms.u_time.value = time * 0.001;
    persistenceMaterial.uniforms.u_deltaTime.value = deltaSeconds || (1.0 / 60.0);
    persistenceMaterial.uniforms.u_bloom.value = material.uniforms.u_bloom.value;
    controls.update();
    updateVideoShuttle(deltaSeconds);

    if (
        mediaState.videoFrameSource &&
        sourceCanvasState &&
        (mediaState.videoFrameNeedsUpdate || !mediaState.usesVideoFrameCallback)
    ) {
        sourceCanvasState.ctx.drawImage(
            mediaState.videoFrameSource,
            0,
            0,
            sourceCanvasState.canvas.width,
            sourceCanvasState.canvas.height
        );
        sourceCanvasState.texture.needsUpdate = true;
        mediaState.videoFrameNeedsUpdate = false;
    }

    renderer.setRenderTarget(frameTarget);
    renderer.clear();
    renderer.render(sourceScene, sourceCamera);

    persistenceMaterial.uniforms.u_currentFrame.value = frameTarget.texture;
    persistenceMaterial.uniforms.u_previousFrame.value = persistenceReadTarget.texture;

    renderer.setRenderTarget(persistenceWriteTarget);
    renderer.clear();
    renderer.render(persistenceScene, compositeCamera);
    renderer.setRenderTarget(null);

    emissionDisplayMaterial.uniforms.u_emissionFrame.value = persistenceWriteTarget.texture;
    glassMaterial.uniforms.u_emissionFrame.value = persistenceWriteTarget.texture;
    renderer.clear();
    renderer.render(scene, camera);

    const swapTarget = persistenceReadTarget;
    persistenceReadTarget = persistenceWriteTarget;
    persistenceWriteTarget = swapTarget;
}

updateScreenSurface(defaultTexInfo.aspect);
resetPersistenceTargets();
animate(0);
