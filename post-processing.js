// Unity-style Post-Processing Effects
class PostProcessingPipeline {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.composer = null;
        this.effects = new Map();
        
        this.setupPipeline();
    }

    setupPipeline() {
        // Create render targets
        this.renderTargetA = new THREE.WebGLRenderTarget(1600, 720, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });

        this.renderTargetB = new THREE.WebGLRenderTarget(1600, 720, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });

        // Setup effects
        this.setupBloom();
        this.setupSSAO();
        this.setupColorGrading();
        this.setupVignette();
        this.setupChromaticAberration();
    }

    setupBloom() {
        // Brightness threshold for bloom
        this.bloomThreshold = 0.8;
        this.bloomStrength = 1.5;
        this.bloomRadius = 0.4;

        // Create bloom material
        this.bloomMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                threshold: { value: this.bloomThreshold },
                strength: { value: this.bloomStrength },
                radius: { value: this.bloomRadius }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float threshold;
                uniform float strength;
                uniform float radius;
                varying vec2 vUv;

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    
                    // Extract bright areas
                    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
                    float bloom = max(0.0, brightness - threshold);
                    
                    // Apply bloom
                    color.rgb += bloom * strength * color.rgb;
                    
                    gl_FragColor = color;
                }
            `
        });

        this.effects.set('bloom', this.bloomMaterial);
    }

    setupSSAO() {
        // Screen Space Ambient Occlusion
        this.ssaoRadius = 0.5;
        this.ssaoIntensity = 1.0;
        this.ssaoBias = 0.025;

        this.ssaoMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                tDepth: { value: null },
                tNormal: { value: null },
                radius: { value: this.ssaoRadius },
                intensity: { value: this.ssaoIntensity },
                bias: { value: this.ssaoBias },
                resolution: { value: new THREE.Vector2(1600, 720) },
                cameraNear: { value: this.camera.near },
                cameraFar: { value: this.camera.far }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform sampler2D tDepth;
                uniform sampler2D tNormal;
                uniform float radius;
                uniform float intensity;
                uniform float bias;
                uniform vec2 resolution;
                uniform float cameraNear;
                uniform float cameraFar;
                varying vec2 vUv;

                float getDepth(vec2 coord) {
                    float depth = texture2D(tDepth, coord).r;
                    return cameraNear + (cameraFar - cameraNear) * depth;
                }

                vec3 getPosition(vec2 coord) {
                    float depth = getDepth(coord);
                    vec2 ndc = coord * 2.0 - 1.0;
                    vec4 clipPos = vec4(ndc, -1.0, 1.0);
                    vec4 viewPos = inverse(projectionMatrix) * clipPos;
                    viewPos.xyz /= viewPos.w;
                    return viewPos.xyz * depth;
                }

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    vec3 normal = texture2D(tNormal, vUv).xyz * 2.0 - 1.0;
                    vec3 position = getPosition(vUv);
                    
                    float occlusion = 0.0;
                    float samples = 8.0;
                    
                    for (float i = 0.0; i < samples; i++) {
                        float angle = (i / samples) * 6.28318;
                        vec2 offset = vec2(cos(angle), sin(angle)) * radius / resolution;
                        vec3 samplePos = getPosition(vUv + offset);
                        
                        vec3 diff = samplePos - position;
                        float dist = length(diff);
                        
                        if (dist < radius) {
                            float occlusionFactor = max(0.0, dot(normal, normalize(diff)) + bias);
                            occlusion += occlusionFactor;
                        }
                    }
                    
                    occlusion /= samples;
                    occlusion = 1.0 - (occlusion * intensity);
                    
                    gl_FragColor = vec4(color.rgb * occlusion, color.a);
                }
            `
        });

        this.effects.set('ssao', this.ssaoMaterial);
    }

    setupColorGrading() {
        // Color grading and tone mapping
        this.exposure = 1.0;
        this.contrast = 1.0;
        this.saturation = 1.0;
        this.temperature = 0.0;
        this.tint = 0.0;

        this.colorGradingMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                exposure: { value: this.exposure },
                contrast: { value: this.contrast },
                saturation: { value: this.saturation },
                temperature: { value: this.temperature },
                tint: { value: this.tint }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float exposure;
                uniform float contrast;
                uniform float saturation;
                uniform float temperature;
                uniform float tint;
                varying vec2 vUv;

                vec3 adjustTemperature(vec3 color, float temp) {
                    vec3 tempColor = vec3(1.0);
                    tempColor.r = 1.0 + temp;
                    tempColor.b = 1.0 - temp;
                    return color * tempColor;
                }

                vec3 adjustTint(vec3 color, float tint) {
                    vec3 tintColor = vec3(1.0);
                    tintColor.r = 1.0 + tint;
                    tintColor.g = 1.0 - tint;
                    return color * tintColor;
                }

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    
                    // Exposure
                    color.rgb *= exposure;
                    
                    // Contrast
                    color.rgb = (color.rgb - 0.5) * contrast + 0.5;
                    
                    // Saturation
                    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                    color.rgb = mix(vec3(gray), color.rgb, saturation);
                    
                    // Temperature
                    color.rgb = adjustTemperature(color.rgb, temperature);
                    
                    // Tint
                    color.rgb = adjustTint(color.rgb, tint);
                    
                    // Tone mapping (Reinhard)
                    color.rgb = color.rgb / (1.0 + color.rgb);
                    
                    gl_FragColor = color;
                }
            `
        });

        this.effects.set('colorGrading', this.colorGradingMaterial);
    }

    setupVignette() {
        this.vignetteIntensity = 0.5;
        this.vignetteRadius = 0.8;

        this.vignetteMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                intensity: { value: this.vignetteIntensity },
                radius: { value: this.vignetteRadius }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float intensity;
                uniform float radius;
                varying vec2 vUv;

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(vUv, center);
                    float vignette = smoothstep(radius, 0.0, dist);
                    
                    color.rgb *= mix(1.0 - intensity, 1.0, vignette);
                    
                    gl_FragColor = color;
                }
            `
        });

        this.effects.set('vignette', this.vignetteMaterial);
    }

    setupChromaticAberration() {
        this.chromaticAberrationIntensity = 0.005;

        this.chromaticAberrationMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                intensity: { value: this.chromaticAberrationIntensity }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float intensity;
                varying vec2 vUv;

                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    vec2 offset = (vUv - center) * intensity;
                    
                    float r = texture2D(tDiffuse, vUv + offset).r;
                    float g = texture2D(tDiffuse, vUv).g;
                    float b = texture2D(tDiffuse, vUv - offset).b;
                    
                    gl_FragColor = vec4(r, g, b, 1.0);
                }
            `
        });

        this.effects.set('chromaticAberration', this.chromaticAberrationMaterial);
    }

    render() {
        // Render scene to render target
        this.renderer.setRenderTarget(this.renderTargetA);
        this.renderer.render(this.scene, this.camera);

        // Apply post-processing effects
        this.applyEffects();

        // Render final result to screen
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.scene, this.camera);
    }

    applyEffects() {
        // Create fullscreen quad
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = this.bloomMaterial;
        const quad = new THREE.Mesh(geometry, material);
        
        // Apply effects in sequence
        material.uniforms.tDiffuse.value = this.renderTargetA.texture;
        
        this.renderer.setRenderTarget(this.renderTargetB);
        this.renderer.render(new THREE.Scene().add(quad), new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
        
        // Swap render targets
        const temp = this.renderTargetA;
        this.renderTargetA = this.renderTargetB;
        this.renderTargetB = temp;
    }

    updateSettings(settings) {
        if (settings.bloom) {
            this.bloomMaterial.uniforms.threshold.value = settings.bloom.threshold;
            this.bloomMaterial.uniforms.strength.value = settings.bloom.strength;
            this.bloomMaterial.uniforms.radius.value = settings.bloom.radius;
        }
        
        if (settings.colorGrading) {
            this.colorGradingMaterial.uniforms.exposure.value = settings.colorGrading.exposure;
            this.colorGradingMaterial.uniforms.contrast.value = settings.colorGrading.contrast;
            this.colorGradingMaterial.uniforms.saturation.value = settings.colorGrading.saturation;
            this.colorGradingMaterial.uniforms.temperature.value = settings.colorGrading.temperature;
            this.colorGradingMaterial.uniforms.tint.value = settings.colorGrading.tint;
        }
        
        if (settings.vignette) {
            this.vignetteMaterial.uniforms.intensity.value = settings.vignette.intensity;
            this.vignetteMaterial.uniforms.radius.value = settings.vignette.radius;
        }
        
        if (settings.chromaticAberration) {
            this.chromaticAberrationMaterial.uniforms.intensity.value = settings.chromaticAberration.intensity;
        }
    }
}

// Export for use in main game
window.PostProcessingPipeline = PostProcessingPipeline;