// Unity-style Advanced Effects System
class EffectsManager {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.effects = new Map();
        this.setupEffects();
    }

    setupEffects() {
        this.setupVolumetricLighting();
        this.setupScreenSpaceReflections();
        this.setupMotionBlur();
        this.setupDepthOfField();
        this.setupGodRays();
        this.setupHeatHaze();
    }

    setupVolumetricLighting() {
        // Volumetric lighting for atmospheric effects
        this.volumetricLighting = {
            enabled: true,
            intensity: 1.0,
            density: 0.1,
            samples: 32,
            scattering: 0.5
        };

        this.createVolumetricLightMaterial();
    }

    createVolumetricLightMaterial() {
        this.volumetricLightMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                tDepth: { value: null },
                lightPosition: { value: new THREE.Vector3() },
                lightColor: { value: new THREE.Color(0x4ecdc4) },
                intensity: { value: this.volumetricLighting.intensity },
                density: { value: this.volumetricLighting.density },
                samples: { value: this.volumetricLighting.samples },
                scattering: { value: this.volumetricLighting.scattering },
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
                uniform vec3 lightPosition;
                uniform vec3 lightColor;
                uniform float intensity;
                uniform float density;
                uniform float samples;
                uniform float scattering;
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
                    vec3 position = getPosition(vUv);
                    
                    vec3 lightDir = normalize(lightPosition - position);
                    float lightDistance = length(lightPosition - position);
                    
                    float volumetric = 0.0;
                    float stepSize = lightDistance / samples;
                    
                    for (float i = 0.0; i < samples; i++) {
                        vec3 samplePos = position + lightDir * (i * stepSize);
                        float sampleDepth = length(samplePos);
                        
                        if (sampleDepth < cameraFar) {
                            volumetric += density * scattering;
                        }
                    }
                    
                    volumetric /= samples;
                    volumetric *= intensity;
                    
                    vec3 volumetricColor = lightColor * volumetric;
                    color.rgb += volumetricColor;
                    
                    gl_FragColor = color;
                }
            `,
            transparent: true
        });
    }

    setupScreenSpaceReflections() {
        // Screen space reflections for realistic reflections
        this.ssrMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                tDepth: { value: null },
                tNormal: { value: null },
                cameraNear: { value: this.camera.near },
                cameraFar: { value: this.camera.far },
                resolution: { value: new THREE.Vector2(1600, 720) },
                intensity: { value: 0.5 },
                maxDistance: { value: 10.0 },
                steps: { value: 32.0 }
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
                uniform float cameraNear;
                uniform float cameraFar;
                uniform vec2 resolution;
                uniform float intensity;
                uniform float maxDistance;
                uniform float steps;
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

                vec3 getNormal(vec2 coord) {
                    return texture2D(tNormal, coord).xyz * 2.0 - 1.0;
                }

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    vec3 position = getPosition(vUv);
                    vec3 normal = getNormal(vUv);
                    
                    vec3 viewDir = normalize(-position);
                    vec3 reflectDir = reflect(viewDir, normal);
                    
                    vec3 reflection = vec3(0.0);
                    float stepSize = maxDistance / steps;
                    
                    for (float i = 0.0; i < steps; i++) {
                        vec3 samplePos = position + reflectDir * (i * stepSize);
                        vec2 sampleCoord = (projectionMatrix * vec4(samplePos, 1.0)).xy;
                        sampleCoord = sampleCoord * 0.5 + 0.5;
                        
                        if (sampleCoord.x >= 0.0 && sampleCoord.x <= 1.0 && 
                            sampleCoord.y >= 0.0 && sampleCoord.y <= 1.0) {
                            float sampleDepth = getDepth(sampleCoord);
                            float currentDepth = length(samplePos);
                            
                            if (abs(sampleDepth - currentDepth) < 0.1) {
                                reflection = texture2D(tDiffuse, sampleCoord).rgb;
                                break;
                            }
                        }
                    }
                    
                    color.rgb = mix(color.rgb, reflection, intensity);
                    gl_FragColor = color;
                }
            `
        });
    }

    setupMotionBlur() {
        // Motion blur for fast-moving objects
        this.motionBlur = {
            enabled: false,
            intensity: 0.5,
            samples: 8
        };

        this.motionBlurMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                velocity: { value: new THREE.Vector2() },
                intensity: { value: this.motionBlur.intensity },
                samples: { value: this.motionBlur.samples }
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
                uniform vec2 velocity;
                uniform float intensity;
                uniform float samples;
                varying vec2 vUv;

                void main() {
                    vec4 color = vec4(0.0);
                    vec2 offset = velocity * intensity / samples;
                    
                    for (float i = 0.0; i < samples; i++) {
                        vec2 sampleCoord = vUv + offset * (i - samples * 0.5);
                        color += texture2D(tDiffuse, sampleCoord);
                    }
                    
                    color /= samples;
                    gl_FragColor = color;
                }
            `
        });
    }

    setupDepthOfField() {
        // Depth of field for cinematic focus
        this.depthOfField = {
            enabled: false,
            focusDistance: 10.0,
            aperture: 0.1,
            focalLength: 50.0
        };

        this.dofMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                tDepth: { value: null },
                focusDistance: { value: this.depthOfField.focusDistance },
                aperture: { value: this.depthOfField.aperture },
                focalLength: { value: this.depthOfField.focalLength },
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
                uniform float focusDistance;
                uniform float aperture;
                uniform float focalLength;
                uniform float cameraNear;
                uniform float cameraFar;
                varying vec2 vUv;

                float getDepth(vec2 coord) {
                    float depth = texture2D(tDepth, coord).r;
                    return cameraNear + (cameraFar - cameraNear) * depth;
                }

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    float depth = getDepth(vUv);
                    
                    float coc = abs(depth - focusDistance) * aperture / focalLength;
                    coc = min(coc, 1.0);
                    
                    vec4 blurredColor = vec4(0.0);
                    float samples = 16.0;
                    
                    for (float i = 0.0; i < samples; i++) {
                        float angle = (i / samples) * 6.28318;
                        vec2 offset = vec2(cos(angle), sin(angle)) * coc * 0.01;
                        blurredColor += texture2D(tDiffuse, vUv + offset);
                    }
                    
                    blurredColor /= samples;
                    color = mix(color, blurredColor, coc);
                    
                    gl_FragColor = color;
                }
            `
        });
    }

    setupGodRays() {
        // God rays for dramatic lighting
        this.godRays = {
            enabled: true,
            intensity: 0.5,
            samples: 64,
            decay: 0.95,
            exposure: 0.1
        };

        this.godRaysMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                lightPosition: { value: new THREE.Vector3() },
                lightColor: { value: new THREE.Color(0x4ecdc4) },
                intensity: { value: this.godRays.intensity },
                samples: { value: this.godRays.samples },
                decay: { value: this.godRays.decay },
                exposure: { value: this.godRays.exposure }
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
                uniform vec3 lightPosition;
                uniform vec3 lightColor;
                uniform float intensity;
                uniform float samples;
                uniform float decay;
                uniform float exposure;
                varying vec2 vUv;

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    
                    vec2 lightCoord = lightPosition.xy;
                    vec2 delta = (lightCoord - vUv) / samples;
                    float illuminationDecay = 1.0;
                    
                    vec3 godRays = vec3(0.0);
                    
                    for (float i = 0.0; i < samples; i++) {
                        vec2 sampleCoord = vUv + delta * i;
                        vec4 sampleColor = texture2D(tDiffuse, sampleCoord);
                        
                        godRays += sampleColor.rgb * illuminationDecay;
                        illuminationDecay *= decay;
                    }
                    
                    godRays *= intensity * exposure;
                    color.rgb += godRays * lightColor;
                    
                    gl_FragColor = color;
                }
            `,
            blending: THREE.AdditiveBlending
        });
    }

    setupHeatHaze() {
        // Heat haze effect for electrical components
        this.heatHaze = {
            enabled: true,
            intensity: 0.1,
            speed: 1.0,
            scale: 10.0
        };

        this.heatHazeMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0.0 },
                intensity: { value: this.heatHaze.intensity },
                speed: { value: this.heatHaze.speed },
                scale: { value: this.heatHaze.scale }
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
                uniform float time;
                uniform float intensity;
                uniform float speed;
                uniform float scale;
                varying vec2 vUv;

                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }

                void main() {
                    vec2 distortion = vec2(
                        noise(vUv * scale + time * speed) - 0.5,
                        noise(vUv * scale + time * speed + 100.0) - 0.5
                    ) * intensity;
                    
                    vec4 color = texture2D(tDiffuse, vUv + distortion);
                    gl_FragColor = color;
                }
            `
        });
    }

    // Effect application methods
    applyVolumetricLighting(lightPosition, lightColor) {
        if (!this.volumetricLighting.enabled) return;
        
        this.volumetricLightMaterial.uniforms.lightPosition.value.copy(lightPosition);
        this.volumetricLightMaterial.uniforms.lightColor.value.copy(lightColor);
        this.volumetricLightMaterial.uniforms.intensity.value = this.volumetricLighting.intensity;
    }

    applyScreenSpaceReflections() {
        if (!this.ssrMaterial) return;
        
        this.ssrMaterial.uniforms.cameraNear.value = this.camera.near;
        this.ssrMaterial.uniforms.cameraFar.value = this.camera.far;
        this.ssrMaterial.uniforms.resolution.value.set(1600, 720);
    }

    applyMotionBlur(velocity) {
        if (!this.motionBlur.enabled) return;
        
        this.motionBlurMaterial.uniforms.velocity.value.copy(velocity);
        this.motionBlurMaterial.uniforms.intensity.value = this.motionBlur.intensity;
    }

    applyDepthOfField() {
        if (!this.depthOfField.enabled) return;
        
        this.dofMaterial.uniforms.focusDistance.value = this.depthOfField.focusDistance;
        this.dofMaterial.uniforms.aperture.value = this.depthOfField.aperture;
        this.dofMaterial.uniforms.focalLength.value = this.depthOfField.focalLength;
    }

    applyGodRays(lightPosition, lightColor) {
        if (!this.godRays.enabled) return;
        
        this.godRaysMaterial.uniforms.lightPosition.value.copy(lightPosition);
        this.godRaysMaterial.uniforms.lightColor.value.copy(lightColor);
        this.godRaysMaterial.uniforms.intensity.value = this.godRays.intensity;
    }

    applyHeatHaze(deltaTime) {
        if (!this.heatHaze.enabled) return;
        
        this.heatHazeMaterial.uniforms.time.value += deltaTime;
        this.heatHazeMaterial.uniforms.intensity.value = this.heatHaze.intensity;
    }

    // Update method
    update(deltaTime) {
        this.applyHeatHaze(deltaTime);
        this.applyScreenSpaceReflections();
        this.applyDepthOfField();
    }

    // Settings
    setEffectEnabled(effectName, enabled) {
        switch (effectName) {
            case 'volumetricLighting':
                this.volumetricLighting.enabled = enabled;
                break;
            case 'motionBlur':
                this.motionBlur.enabled = enabled;
                break;
            case 'depthOfField':
                this.depthOfField.enabled = enabled;
                break;
            case 'godRays':
                this.godRays.enabled = enabled;
                break;
            case 'heatHaze':
                this.heatHaze.enabled = enabled;
                break;
        }
    }

    setEffectIntensity(effectName, intensity) {
        switch (effectName) {
            case 'volumetricLighting':
                this.volumetricLighting.intensity = intensity;
                break;
            case 'motionBlur':
                this.motionBlur.intensity = intensity;
                break;
            case 'depthOfField':
                this.depthOfField.aperture = intensity;
                break;
            case 'godRays':
                this.godRays.intensity = intensity;
                break;
            case 'heatHaze':
                this.heatHaze.intensity = intensity;
                break;
        }
    }
}

// Export for use in main game
window.EffectsManager = EffectsManager;