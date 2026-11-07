// Glass surface vertex transform and reflection/ghost fragment pass.
export const glassVertexShader = `
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
    `;
export const glassFragmentShader = `
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
    `;
