// Shared GLSL declarations plus explicit signal and phosphor screen passes.
export const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const screenShaderHeader = `
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
    uniform float u_refreshRate;
    uniform float u_scanLines;
    uniform int u_interlaced;
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

`;
export const signalShader = screenShaderHeader + `
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

`;
export const fragmentShader = screenShaderHeader + `
    vec3 sampleSignalColor(vec2 uv) {
        return texture2D(u_image, clamp(uv, 0.0, 1.0)).rgb;
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
            shape = 1.0 - smoothstep(0.28, 0.40, dist);
            float colorIndex = mod(u_index + mod(v_index, 2.0) * 2.0, 3.0);

            if (colorIndex < 1.0) { subIndex = 0.0; }
            else if (colorIndex < 2.0) { subIndex = 1.0; }
            else { subIndex = 2.0; }

            sampleUv = vec2((u_index + u_offset + 0.5) / dotsX, (v_index + 0.5) / dotsY);
            scanline = 1.0;
        } else if (u_maskType == 1) {
            vec2 cellId = floor(gridUv);
            vec2 cellLocal = fract(gridUv);

            subIndex = floor(cellLocal.x * 3.0);
            subLocal = vec2(fract(cellLocal.x * 3.0), cellLocal.y);
            sampleUv = vec2((cellId.x + (subIndex + 0.5) / 3.0) / gridCount.x, uv.y);

            float dist = abs(subLocal.x - 0.5);
            shape = 1.0 - smoothstep(0.20, 0.40, dist);
            float dLine1 = abs(uv.y - 0.333) * u_screenResolution.y;
            float dLine2 = abs(uv.y - 0.666) * u_screenResolution.y;
            float damper = smoothstep(0.5, 1.5, min(dLine1, dLine2));
            shape *= damper;
            scanline = 1.0;
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
            shape = 1.0 - smoothstep(-0.04, 0.04, dist);
            scanline = 1.0;
        }

        float densityLod = smoothstep(0.1, 0.5, max(fwidth(gridUv.x), fwidth(gridUv.y)));
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
        // Unresolved RGB stripes must converge to their average, not alias into
        // colored moire. Derivatives now follow the actual projected screen.
        float unresolvedMask = smoothstep(0.15, 0.4, fw);
        finalColor = mix(finalColor, texColor * u_brightness, unresolvedMask);

        float rollingBar = sin(uv.y * 15.0 - u_time * 8.0) * 0.5 + 0.5;
        finalColor *= (1.0 - rollingBar * u_rollingBar);

        // Raster line profile is independent of the phosphor pitch and output size.
        float linePhase = uv.y * u_scanLines;
        float lineFootprint = fwidth(linePhase);
        float lineContrast = clamp(u_beamStrength, 0.0, 1.0) * (1.0 - smoothstep(0.5, 1.5, lineFootprint));
        float beamWidth = clamp(u_beamWidth, 0.2, 1.0);
        float lineProfile = 1.0 - (1.0 - beamWidth) * cos(linePhase * 6.2831853);
        finalColor *= mix(1.0, lineProfile, lineContrast);

        vec2 vUv2 = uv * 2.0 - 1.0;
        float vignette = 1.0 - dot(vUv2, vUv2) * 0.15;
        finalColor *= vignette;

        float noise = rand(uv + mod(u_time, 10.0));
        finalColor += noise * u_noiseIntensity * finalColor;

        gl_FragColor = vec4(linearToSrgb(finalColor), 1.0);
    }
`;
