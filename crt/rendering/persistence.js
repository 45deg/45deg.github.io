// Raster excitation and phosphor decay, integrated over each display frame.
// renderer.js uses state/exposure passes; tests/rendering.html verifies their energy.
export const persistenceFragmentShader = `
        varying vec2 vUv;
        uniform sampler2D u_currentFrame;
        uniform sampler2D u_previousFrame;
        uniform float u_persistenceAmount;
        uniform vec3 u_persistenceDecay;
        uniform float u_currentContribution;
        uniform float u_deltaTime;
        uniform float u_time;
        uniform float u_refreshRate;
        uniform float u_scanLines;
        uniform int u_interlaced;
        uniform float u_verticalBlank;
        uniform bool u_outputExposure;
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

            vec3 drive = currentColor + bloom * u_bloom * currentMask;
            float dt = max(u_deltaTime, 0.000001);
            float fields = u_interlaced == 1 ? 2.0 : 1.0;
            float period = fields / u_refreshRate;
            float line = min(floor((1.0 - vUv.y) * u_scanLines), u_scanLines - 1.0);
            float parity = u_interlaced == 1 ? mod(line, 2.0) : 0.0;
            float fieldLine = floor(line / fields);
            float linesPerField = u_scanLines / fields;
            // Horizontal position advances the beam within the line. Blanking is time,
            // not a permanently dark strip at the bottom of the picture.
            float scanOffset = (parity + (fieldLine + vUv.x) / linesPerField * (1.0 - u_verticalBlank)) / u_refreshRate;
            float lastPulse = floor((u_time - scanOffset) / period);
            float previousPulse = floor((u_time - dt - scanOffset) / period);
            float pulses = max(lastPulse - previousPulse, 0.0);
            float age = max(u_time - scanOffset - lastPulse * period, 0.0);
            vec3 rate = vec3(0.69314718056) / max(u_persistenceDecay, vec3(0.001));
            vec3 decay = exp(-rate * dt);
            vec3 pulseEnergy = drive * period * rate;
            vec3 added = pulseEnergy * exp(-rate * age)
                * (1.0 - exp(-rate * pulses * period)) / (1.0 - exp(-rate * period));
            vec3 state = previousColor * decay + added;
            // Integrate all pulses over the display frame; even a frame spanning
            // several sweeps gets the same energy per second. History stores state,
            // never the exposure or a per-frame gain.
            vec3 exposure = (previousColor * (1.0 - decay) + pulses * pulseEnergy - added) / (rate * dt);
            gl_FragColor = vec4(u_outputExposure
                ? mix(drive, max(exposure, vec3(0.0)), u_persistenceAmount)
                : state, 1.0);
        }`;
