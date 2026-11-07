// Named CRT appearances consumed by settings.js, which owns defaults and edits.
// Decay values are RGB half-lives in seconds; RF/Aged keep long trails for effect.
export const CRT_PRESETS = {
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
            u_signalMode: 1,
            u_signalArtifact: 0.45,
            u_rfNoise: 0.0,
            u_beamStrength: 0.45,
            u_beamWidth: 0.65,
            u_verticalBlank: 0.07
        },
        persistence: {
            u_persistenceAmount: 0.65,
            u_currentContribution: 1.0,
            u_persistenceDecay: [0.03, 0.045, 0.025]
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
            u_beamWidth: 0.65,
            u_verticalBlank: 0.035
        },
        persistence: {
            u_persistenceAmount: 0.5,
            u_currentContribution: 1.08,
            u_persistenceDecay: [0.02, 0.03, 0.015]
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
            u_beamWidth: 0.65,
            u_verticalBlank: 0.08
        },
        persistence: {
            u_persistenceAmount: 0.75,
            u_currentContribution: 1.08,
            u_persistenceDecay: [0.045, 0.065, 0.03]
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
            u_beamWidth: 0.65,
            u_verticalBlank: 0.025
        },
        persistence: {
            u_persistenceAmount: 0.4,
            u_currentContribution: 1.18,
            u_persistenceDecay: [0.015, 0.02, 0.015]
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
            u_beamWidth: 0.65,
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
            u_beamWidth: 0.65,
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
