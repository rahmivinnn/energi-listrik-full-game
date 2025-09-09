// Unity-style Advanced Shaders
class ShaderManager {
    constructor() {
        this.shaders = new Map();
        this.materials = new Map();
        this.setupShaders();
    }

    setupShaders() {
        this.createPBRShader();
        this.createEmissiveShader();
        this.createElectricShader();
        this.createEnergyFlowShader();
        this.createHologramShader();
        this.createWaterShader();
    }

    createPBRShader() {
        // Physically Based Rendering Shader
        const pbrShader = {
            uniforms: {
                map: { value: null },
                normalMap: { value: null },
                roughnessMap: { value: null },
                metalnessMap: { value: null },
                aoMap: { value: null },
                emissiveMap: { value: null },
                envMap: { value: null },
                color: { value: new THREE.Color(0xffffff) },
                emissive: { value: new THREE.Color(0x000000) },
                roughness: { value: 0.5 },
                metalness: { value: 0.0 },
                normalScale: { value: new THREE.Vector2(1, 1) },
                aoMapIntensity: { value: 1.0 },
                emissiveIntensity: { value: 1.0 },
                envMapIntensity: { value: 1.0 }
            },
            vertexShader: `
                uniform vec2 normalScale;
                uniform mat4 modelMatrix;
                uniform mat4 viewMatrix;
                uniform mat4 projectionMatrix;
                uniform mat3 normalMatrix;
                
                attribute vec3 position;
                attribute vec3 normal;
                attribute vec2 uv;
                attribute vec4 tangent;
                
                varying vec3 vWorldPosition;
                varying vec3 vWorldNormal;
                varying vec2 vUv;
                varying vec3 vTangent;
                varying vec3 vBitangent;
                varying vec3 vNormal;
                
                void main() {
                    vUv = uv;
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    vWorldNormal = normalize(normalMatrix * normal);
                    
                    vec3 worldTangent = normalize(normalMatrix * tangent.xyz);
                    vec3 worldBitangent = normalize(cross(vWorldNormal, worldTangent) * tangent.w);
                    
                    vTangent = worldTangent;
                    vBitangent = worldBitangent;
                    vNormal = vWorldNormal;
                    
                    gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D map;
                uniform sampler2D normalMap;
                uniform sampler2D roughnessMap;
                uniform sampler2D metalnessMap;
                uniform sampler2D aoMap;
                uniform sampler2D emissiveMap;
                uniform samplerCube envMap;
                
                uniform vec3 color;
                uniform vec3 emissive;
                uniform float roughness;
                uniform float metalness;
                uniform vec2 normalScale;
                uniform float aoMapIntensity;
                uniform float emissiveIntensity;
                uniform float envMapIntensity;
                
                varying vec3 vWorldPosition;
                varying vec3 vWorldNormal;
                varying vec2 vUv;
                varying vec3 vTangent;
                varying vec3 vBitangent;
                varying vec3 vNormal;
                
                // PBR Functions
                float DistributionGGX(vec3 N, vec3 H, float roughness) {
                    float a = roughness * roughness;
                    float a2 = a * a;
                    float NdotH = max(dot(N, H), 0.0);
                    float NdotH2 = NdotH * NdotH;
                    
                    float num = a2;
                    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
                    denom = 3.14159265359 * denom * denom;
                    
                    return num / denom;
                }
                
                float GeometrySchlickGGX(float NdotV, float roughness) {
                    float r = (roughness + 1.0);
                    float k = (r * r) / 8.0;
                    
                    float num = NdotV;
                    float denom = NdotV * (1.0 - k) + k;
                    
                    return num / denom;
                }
                
                float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
                    float NdotV = max(dot(N, V), 0.0);
                    float NdotL = max(dot(N, L), 0.0);
                    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
                    float ggx1 = GeometrySchlickGGX(NdotL, roughness);
                    
                    return ggx1 * ggx2;
                }
                
                vec3 fresnelSchlick(float cosTheta, vec3 F0) {
                    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
                }
                
                void main() {
                    vec3 albedo = texture2D(map, vUv).rgb * color;
                    float metallic = texture2D(metalnessMap, vUv).r * metalness;
                    float rough = texture2D(roughnessMap, vUv).r * roughness;
                    float ao = texture2D(aoMap, vUv).r * aoMapIntensity;
                    vec3 emissiveColor = texture2D(emissiveMap, vUv).rgb * emissive * emissiveIntensity;
                    
                    // Normal mapping
                    vec3 normalMap = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
                    normalMap.xy *= normalScale;
                    
                    vec3 N = normalize(vTangent * normalMap.x + vBitangent * normalMap.y + vNormal * normalMap.z);
                    
                    vec3 V = normalize(cameraPosition - vWorldPosition);
                    vec3 R = reflect(-V, N);
                    
                    vec3 F0 = mix(vec3(0.04), albedo, metallic);
                    
                    // IBL
                    vec3 F = fresnelSchlick(max(dot(N, V), 0.0), F0);
                    vec3 kS = F;
                    vec3 kD = (1.0 - kS) * (1.0 - metallic);
                    
                    vec3 irradiance = textureCube(envMap, N).rgb;
                    vec3 diffuse = irradiance * albedo;
                    
                    vec3 prefilteredColor = textureCube(envMap, R).rgb;
                    vec2 envBRDF = texture2D(envMap, vec2(max(dot(N, V), 0.0), rough)).rg;
                    vec3 specular = prefilteredColor * (F * envBRDF.x + envBRDF.y);
                    
                    vec3 ambient = (kD * diffuse + specular) * ao;
                    
                    gl_FragColor = vec4(ambient + emissiveColor, 1.0);
                }
            `
        };
        
        this.shaders.set('pbr', pbrShader);
    }

    createEmissiveShader() {
        // Emissive material for electrical components
        const emissiveShader = {
            uniforms: {
                color: { value: new THREE.Color(0x4ecdc4) },
                intensity: { value: 1.0 },
                pulseSpeed: { value: 2.0 },
                time: { value: 0.0 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                
                void main() {
                    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float intensity;
                uniform float pulseSpeed;
                uniform float time;
                
                varying vec3 vWorldPosition;
                varying vec3 vNormal;
                
                void main() {
                    float pulse = sin(time * pulseSpeed) * 0.5 + 0.5;
                    vec3 emissive = color * intensity * (0.5 + pulse * 0.5);
                    
                    gl_FragColor = vec4(emissive, 1.0);
                }
            `
        };
        
        this.shaders.set('emissive', emissiveShader);
    }

    createElectricShader() {
        // Electric current effect
        const electricShader = {
            uniforms: {
                color: { value: new THREE.Color(0x4ecdc4) },
                intensity: { value: 1.0 },
                speed: { value: 5.0 },
                time: { value: 0.0 },
                noiseScale: { value: 10.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float intensity;
                uniform float speed;
                uniform float time;
                uniform float noiseScale;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                void main() {
                    vec2 uv = vUv;
                    float noiseValue = noise(uv * noiseScale + time * speed);
                    float electric = step(0.8, noiseValue) * intensity;
                    
                    vec3 electricColor = color * electric;
                    
                    gl_FragColor = vec4(electricColor, electric);
                }
            `
        };
        
        this.shaders.set('electric', electricShader);
    }

    createEnergyFlowShader() {
        // Energy flow visualization
        const energyFlowShader = {
            uniforms: {
                color: { value: new THREE.Color(0x4ecdc4) },
                intensity: { value: 1.0 },
                speed: { value: 3.0 },
                time: { value: 0.0 },
                flowDirection: { value: new THREE.Vector2(1.0, 0.0) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float intensity;
                uniform float speed;
                uniform float time;
                uniform vec2 flowDirection;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vec2 uv = vUv;
                    vec2 flow = flowDirection * time * speed;
                    
                    float flowPattern = sin((uv.x + flow.x) * 10.0) * cos((uv.y + flow.y) * 10.0);
                    float energy = smoothstep(0.3, 0.7, flowPattern) * intensity;
                    
                    vec3 energyColor = color * energy;
                    
                    gl_FragColor = vec4(energyColor, energy);
                }
            `
        };
        
        this.shaders.set('energyFlow', energyFlowShader);
    }

    createHologramShader() {
        // Hologram effect for UI elements
        const hologramShader = {
            uniforms: {
                color: { value: new THREE.Color(0x4ecdc4) },
                intensity: { value: 1.0 },
                scanlineSpeed: { value: 2.0 },
                time: { value: 0.0 },
                opacity: { value: 0.8 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float intensity;
                uniform float scanlineSpeed;
                uniform float time;
                uniform float opacity;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vec2 uv = vUv;
                    
                    // Scanlines
                    float scanline = sin(uv.y * 100.0 + time * scanlineSpeed) * 0.5 + 0.5;
                    
                    // Glitch effect
                    float glitch = step(0.95, sin(time * 10.0 + uv.x * 50.0));
                    
                    // Flicker
                    float flicker = sin(time * 20.0) * 0.1 + 0.9;
                    
                    vec3 hologramColor = color * intensity * scanline * flicker;
                    hologramColor += glitch * vec3(1.0, 0.0, 0.0);
                    
                    gl_FragColor = vec4(hologramColor, opacity);
                }
            `
        };
        
        this.shaders.set('hologram', hologramShader);
    }

    createWaterShader() {
        // Water surface shader
        const waterShader = {
            uniforms: {
                color: { value: new THREE.Color(0x4ecdc4) },
                time: { value: 0.0 },
                waveSpeed: { value: 1.0 },
                waveHeight: { value: 0.1 },
                waveFrequency: { value: 10.0 },
                opacity: { value: 0.8 }
            },
            vertexShader: `
                uniform float time;
                uniform float waveSpeed;
                uniform float waveHeight;
                uniform float waveFrequency;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Wave displacement
                    float wave = sin(position.x * waveFrequency + time * waveSpeed) * 
                                cos(position.z * waveFrequency + time * waveSpeed) * waveHeight;
                    
                    vec3 newPosition = position;
                    newPosition.y += wave;
                    
                    vNormal = normalize(normalMatrix * normal);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float time;
                uniform float opacity;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    vec3 waterColor = color;
                    
                    // Fresnel effect
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = 1.0 - max(dot(vNormal, viewDirection), 0.0);
                    
                    waterColor = mix(waterColor, vec3(1.0), fresnel * 0.3);
                    
                    gl_FragColor = vec4(waterColor, opacity);
                }
            `
        };
        
        this.shaders.set('water', waterShader);
    }

    createMaterial(shaderName, uniforms = {}) {
        const shader = this.shaders.get(shaderName);
        if (!shader) {
            console.error(`Shader '${shaderName}' not found`);
            return null;
        }

        const material = new THREE.ShaderMaterial({
            uniforms: { ...shader.uniforms, ...uniforms },
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
            transparent: shaderName === 'hologram' || shaderName === 'water',
            side: THREE.DoubleSide
        });

        this.materials.set(shaderName, material);
        return material;
    }

    updateUniforms(material, uniforms) {
        Object.keys(uniforms).forEach(key => {
            if (material.uniforms[key]) {
                material.uniforms[key].value = uniforms[key];
            }
        });
    }

    animateMaterial(material, deltaTime) {
        if (material.uniforms.time) {
            material.uniforms.time.value += deltaTime;
        }
    }
}

// Export for use in main game
window.ShaderManager = ShaderManager;