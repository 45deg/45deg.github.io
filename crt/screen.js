// Owns curved geometry, bezel meshes and pointer hit testing. updateSurface accepts
// dimensions; onControl emits media actions without accessing playback or settings.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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

export function createScreen({ material, glassMaterial, element, camera, controls, onControl }) {
    const events = new AbortController();
    const screenGroup = new THREE.Group();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const VIDEO_CONTROL_LAYOUT = [{ action: 'rewind' }, { action: 'togglePlayback' }, { action: 'fastForward' }];
    const emissionPlane = new THREE.Mesh(new THREE.PlaneGeometry(), material);
    emissionPlane.renderOrder = 0;
    screenGroup.add(emissionPlane);
    const glassPlane = new THREE.Mesh(new THREE.PlaneGeometry(), glassMaterial);
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

    function setButtonPressed(button, pressed) {
        if (button.userData.isPressed === pressed) {
            return;
        }

        button.userData.isPressed = pressed;
        button.userData.body.material = pressed ? bezelControlActiveMaterial : bezelControlMaterial;
        button.userData.body.position.z = pressed ? 0.003 : 0.006;
        button.userData.labelPlate.position.z = pressed ? 0.013 : 0.016;
    }

    const controlInteractionState = {
        activeButton: null,
        activePointerId: null
    };
    function releaseActiveControl() {
        if (controlInteractionState.activeButton) {
            setButtonPressed(controlInteractionState.activeButton, false);
        }

        controlInteractionState.activeButton = null;
        controlInteractionState.activePointerId = null;
        onControl('stopShuttle');
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

    function updatePointerFromEvent(event) {
        const rect = element.getBoundingClientRect();
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

    element.addEventListener('pointerdown', (event) => {
        const button = pickBezelControl(event);
        if (!button) {
            return;
        }

        controls.enabled = false;
        controlInteractionState.activeButton = button;
        controlInteractionState.activePointerId = event.pointerId;
        setButtonPressed(button, true);
        element.setPointerCapture(event.pointerId);

        if (button.userData.action !== 'togglePlayback') {
            onControl(button.userData.action);
            return;
        }

        onControl('togglePlayback');
    }, { signal: events.signal });

    element.addEventListener('pointerup', (event) => {
        if (controlInteractionState.activePointerId !== event.pointerId) {
            return;
        }

        if (element.hasPointerCapture(event.pointerId)) {
            element.releasePointerCapture(event.pointerId);
        }

        releaseActiveControl();
    }, { signal: events.signal });

    element.addEventListener('pointerleave', () => {
        if (controlInteractionState.activePointerId === null) {
            controls.enabled = true;
        }
    }, { signal: events.signal });

    element.addEventListener('pointercancel', (event) => {
        if (controlInteractionState.activePointerId !== event.pointerId) {
            return;
        }

        releaseActiveControl();
    }, { signal: events.signal });

    function updateSurface(aspect, curvature) {
        const metrics = getScreenMetrics(aspect, curvature);
        const nextGeometry = createCurvedScreenGeometry(aspect, curvature);

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


    window.addEventListener('blur', releaseActiveControl, { signal: events.signal });
    element.addEventListener('lostpointercapture', releaseActiveControl, { signal: events.signal });
    return {
        group: screenGroup,
        updateSurface,
        setVideoVisible(visible) {
            if (!visible) releaseActiveControl();
            bezelControlsGroup.visible = visible;
        },
        dispose() {
            events.abort();
            releaseActiveControl();
            const materials = new Set();
            screenGroup.traverse((object) => {
                object.geometry?.dispose();
                if (object.material && object.material !== material && object.material !== glassMaterial) materials.add(object.material);
            });
            for (const owned of materials) { owned.map?.dispose(); owned.dispose(); }
        }
    };
}
