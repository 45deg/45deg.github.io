// Owns Three.js, pass-local uniforms, source texture and history targets.
// setSource uploads prepared media; applySettings is the only settings-to-GPU path;
// render integrates raster light, then draws phosphors and glass on screen.js geometry.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createScreen } from '../screen.js';
import { vertexShader, signalShader, fragmentShader } from './shaders.js';
import { glassVertexShader, glassFragmentShader } from './glass-shaders.js';
import { persistenceFragmentShader } from './persistence.js';

function createUniforms(values) {
    return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, {
        value: Array.isArray(value) ? new THREE.Vector3(...value) : value
    }]));
}

// Settings have one owner; this is the explicit fan-out to the raster pass.
function persistenceScanSettings(settings) {
    const { u_refreshRate, u_scanLines, u_interlaced, u_verticalBlank, u_bloom } = settings.material;
    return { u_refreshRate, u_scanLines, u_interlaced, u_verticalBlank, u_bloom };
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

export function createRenderer({ container, initialSettings, onControl }) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050607);
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 10);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    function createRenderTarget() {
        return new THREE.WebGLRenderTarget(1024, 240, {
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

    const ambientLight = new THREE.HemisphereLight(0xe9eef6, 0x08090b, 1.15);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    keyLight.position.set(1.4, 1.1, 2.2);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8fb4ff, 0.28);
    fillLight.position.set(-1.3, -0.6, 1.1);
    scene.add(fillLight);

    function getClampedMediaSize(width, height, maxDimension = 1024) {
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

    const material = new THREE.ShaderMaterial({
        vertexShader, fragmentShader, side: THREE.DoubleSide,
        uniforms: {
            ...createUniforms(initialSettings.material),
            u_image: { value: null }, u_textureAspect: { value: 4 / 3 },
            u_screenResolution: { value: new THREE.Vector2(1024, 240) }, u_time: { value: 0 }
        },
        extensions: { derivatives: true }
    });
    const sourceMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: signalShader + `void main() { gl_FragColor = vec4(sampleSignalColor(vUv), 1.0); }`,
        uniforms: {
            ...createUniforms(initialSettings.material),
            u_image: { value: null }, u_textureAspect: { value: 4 / 3 },
            u_screenResolution: { value: new THREE.Vector2(1024, 240) }, u_time: { value: 0 }
        }
    });
    const sourcePlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), sourceMaterial);
    sourceScene.add(sourcePlane);
    const frameTarget = createRenderTarget();
    let persistenceReadTarget = createRenderTarget();
    let persistenceWriteTarget = createRenderTarget();

    const exposureTarget = createRenderTarget();

    const persistenceScene = new THREE.Scene();
    const compositeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const persistenceMaterial = new THREE.ShaderMaterial({
        uniforms: {
            u_currentFrame: { value: frameTarget.texture },
            u_previousFrame: { value: persistenceReadTarget.texture },
            ...createUniforms(initialSettings.persistence),
            ...createUniforms(persistenceScanSettings(initialSettings)),
            u_deltaTime: { value: 1 / 60 }, u_time: { value: 0 },
            u_outputExposure: { value: false },

            u_frameTexelSize: { value: new THREE.Vector2(1 / 1024, 1 / 240) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position.xy, 0.0, 1.0);
            }
        `,
        fragmentShader: persistenceFragmentShader
    });

    const persistenceQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), persistenceMaterial);
    persistenceScene.add(persistenceQuad);

    const glassMaterial = new THREE.ShaderMaterial({
        uniforms: {
            u_emissionFrame: { value: persistenceWriteTarget.texture },
            ...createUniforms(initialSettings.glass),
            u_glassTint: { value: new THREE.Color(0xbfd7ff) },
            u_time: { value: 0.0 }
        },
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: glassVertexShader,
        fragmentShader: glassFragmentShader
    });

    const screen = createScreen({ material, glassMaterial, element: renderer.domElement, camera, controls, onControl });
    scene.add(screen.group);

    function updateSignalResolution() {
        const width = sourceCanvasState?.canvas.width ?? 1024;
        const height = material.uniforms.u_scanLines.value;
        material.uniforms.u_screenResolution.value.set(width, height);
        sourceMaterial.uniforms.u_screenResolution.value.set(width, height);
        for (const target of [frameTarget, persistenceReadTarget, persistenceWriteTarget, exposureTarget]) {
            target.setSize(width, height);
        }
        persistenceMaterial.uniforms.u_frameTexelSize.value.set(1 / width, 1 / height);
    }

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

    function setSource({ element, width, height }) {
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

        sourceMaterial.uniforms.u_image.value = sourceCanvasState.texture;
        material.uniforms.u_textureAspect.value = width / height;
        sourceMaterial.uniforms.u_textureAspect.value = width / height;
        updateSignalResolution();
        screen.updateSurface(width / height, material.uniforms.u_curvature.value);
        resetPersistenceTargets();

    }

    function applySettings(next) {
        const resetHistory = next.activePreset !== null || [
            'u_signalMode', 'u_signalArtifact', 'u_rfNoise', 'u_beamStrength',
            'u_beamWidth', 'u_refreshRate', 'u_scanLines', 'u_verticalBlank'
        ].some(key => material.uniforms[key].value !== next.material[key]);
        const oldCurvature = material.uniforms.u_curvature.value;
        const oldLines = material.uniforms.u_scanLines.value;
        setUniformValues(material.uniforms, next.material);
        setUniformValues(sourceMaterial.uniforms, next.material);
        setUniformValues(persistenceMaterial.uniforms, next.persistence);
        setUniformValues(persistenceMaterial.uniforms, persistenceScanSettings(next));
        setUniformValues(glassMaterial.uniforms, next.glass);
        if (oldLines !== next.material.u_scanLines) updateSignalResolution();
        if (oldCurvature !== next.material.u_curvature) {
            screen.updateSurface(material.uniforms.u_textureAspect.value, next.material.u_curvature);
        }
        if (resetHistory) resetPersistenceTargets();
    }

    function updateSourceFrame(element) {
        if (!sourceCanvasState) return;
        sourceCanvasState.ctx.drawImage(element, 0, 0, sourceCanvasState.canvas.width, sourceCanvasState.canvas.height);
        sourceCanvasState.texture.needsUpdate = true;
    }

    function resize(width, height) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function render(timeSeconds, deltaSeconds) {
        for (const pass of [material, sourceMaterial, persistenceMaterial, glassMaterial]) pass.uniforms.u_time.value = timeSeconds;
        persistenceMaterial.uniforms.u_deltaTime.value = deltaSeconds;
        controls.update();
        renderer.setRenderTarget(frameTarget);
        renderer.clear();
        renderer.render(sourceScene, sourceCamera);

        persistenceMaterial.uniforms.u_currentFrame.value = frameTarget.texture;
        persistenceMaterial.uniforms.u_previousFrame.value = persistenceReadTarget.texture;

        persistenceMaterial.uniforms.u_outputExposure.value = true;
        renderer.setRenderTarget(exposureTarget);
        renderer.clear();
        renderer.render(persistenceScene, compositeCamera);
        persistenceMaterial.uniforms.u_outputExposure.value = false;
        renderer.setRenderTarget(persistenceWriteTarget);
        renderer.clear();
        renderer.render(persistenceScene, compositeCamera);
        renderer.setRenderTarget(null);

        material.uniforms.u_image.value = exposureTarget.texture;
        glassMaterial.uniforms.u_emissionFrame.value = exposureTarget.texture;
        renderer.clear();
        renderer.render(scene, camera);

        const swapTarget = persistenceReadTarget;
        persistenceReadTarget = persistenceWriteTarget;
        persistenceWriteTarget = swapTarget;

    }
    return {
        setSource, updateSourceFrame, applySettings, render, resize,
        setVideoVisible: screen.setVideoVisible,
        dispose() {
            screen.dispose(); controls.dispose();
            sourceCanvasState?.texture.dispose();
            sourcePlane.geometry.dispose(); persistenceQuad.geometry.dispose();
            for (const pass of [material, sourceMaterial, persistenceMaterial, glassMaterial]) pass.dispose();
            for (const target of [frameTarget, persistenceReadTarget, persistenceWriteTarget, exposureTarget]) target.dispose();
            renderer.dispose(); renderer.domElement.remove();
        }
    };
}
