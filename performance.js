// Unity-style Performance Optimization System
class PerformanceManager {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.lodSystem = new Map();
        this.frustumCulling = true;
        this.instancing = new Map();
        this.occlusionCulling = new Map();
        this.batching = new Map();
        this.setupPerformance();
    }

    setupPerformance() {
        // Enable frustum culling
        this.renderer.frustumCulled = true;
        
        // Setup LOD system
        this.setupLODSystem();
        
        // Setup instancing
        this.setupInstancing();
        
        // Setup occlusion culling
        this.setupOcclusionCulling();
        
        // Setup batching
        this.setupBatching();
        
        // Performance monitoring
        this.setupPerformanceMonitoring();
    }

    setupLODSystem() {
        this.lodLevels = [
            { distance: 0, quality: 'high' },
            { distance: 10, quality: 'medium' },
            { distance: 20, quality: 'low' },
            { distance: 50, quality: 'culled' }
        ];
    }

    setupInstancing() {
        // Create instanced geometry for repeated objects
        this.instancedMeshes = new Map();
        this.instanceCounts = new Map();
    }

    setupOcclusionCulling() {
        // Simple occlusion culling using raycasting
        this.occlusionQueries = new Map();
    }

    setupBatching() {
        // Geometry batching for similar objects
        this.batchedGeometries = new Map();
    }

    setupPerformanceMonitoring() {
        this.stats = {
            fps: 0,
            frameTime: 0,
            drawCalls: 0,
            triangles: 0,
            geometries: 0,
            textures: 0,
            memory: 0
        };
        
        this.frameCount = 0;
        this.lastTime = performance.now();
    }

    // LOD System
    createLODObject(object, lodLevels) {
        const lod = {
            object: object,
            levels: lodLevels,
            currentLevel: 0,
            lastUpdate: 0
        };
        
        this.lodSystem.set(object.uuid, lod);
        return lod;
    }

    updateLOD() {
        const cameraPosition = this.camera.position;
        
        this.lodSystem.forEach((lod, uuid) => {
            const distance = cameraPosition.distanceTo(lod.object.position);
            const newLevel = this.getLODLevel(distance);
            
            if (newLevel !== lod.currentLevel) {
                this.applyLODLevel(lod, newLevel);
                lod.currentLevel = newLevel;
            }
        });
    }

    getLODLevel(distance) {
        for (let i = this.lodLevels.length - 1; i >= 0; i--) {
            if (distance >= this.lodLevels[i].distance) {
                return i;
            }
        }
        return 0;
    }

    applyLODLevel(lod, level) {
        const lodLevel = this.lodLevels[level];
        
        switch (lodLevel.quality) {
            case 'high':
                lod.object.visible = true;
                lod.object.material = lod.levels.high;
                break;
            case 'medium':
                lod.object.visible = true;
                lod.object.material = lod.levels.medium;
                break;
            case 'low':
                lod.object.visible = true;
                lod.object.material = lod.levels.low;
                break;
            case 'culled':
                lod.object.visible = false;
                break;
        }
    }

    // Instancing System
    createInstancedMesh(geometry, material, count) {
        const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
        instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        
        this.instancedMeshes.set(instancedMesh.uuid, {
            mesh: instancedMesh,
            count: count,
            used: 0
        });
        
        return instancedMesh;
    }

    addInstance(instancedMeshId, position, rotation, scale) {
        const instancedData = this.instancedMeshes.get(instancedMeshId);
        if (!instancedData || instancedData.used >= instancedData.count) {
            return false;
        }
        
        const matrix = new THREE.Matrix4();
        matrix.compose(position, rotation, scale);
        
        instancedData.mesh.setMatrixAt(instancedData.used, matrix);
        instancedData.used++;
        
        instancedData.mesh.instanceMatrix.needsUpdate = true;
        return true;
    }

    updateInstance(instancedMeshId, index, position, rotation, scale) {
        const instancedData = this.instancedMeshes.get(instancedMeshId);
        if (!instancedData || index >= instancedData.used) {
            return false;
        }
        
        const matrix = new THREE.Matrix4();
        matrix.compose(position, rotation, scale);
        
        instancedData.mesh.setMatrixAt(index, matrix);
        instancedData.mesh.instanceMatrix.needsUpdate = true;
        return true;
    }

    // Occlusion Culling
    performOcclusionCulling() {
        if (!this.frustumCulling) return;
        
        const frustum = new THREE.Frustum();
        const matrix = new THREE.Matrix4().multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(matrix);
        
        this.scene.traverse((object) => {
            if (object.isMesh && object.geometry && object.material) {
                const inFrustum = frustum.intersectsObject(object);
                object.visible = inFrustum;
            }
        });
    }

    // Geometry Batching
    batchSimilarObjects(objects) {
        if (objects.length === 0) return null;
        
        const firstObject = objects[0];
        const geometry = firstObject.geometry.clone();
        const material = firstObject.material.clone();
        
        // Merge geometries
        const geometries = objects.map(obj => obj.geometry);
        const mergedGeometry = THREE.BufferGeometryUtils.mergeGeometries(geometries);
        
        const batchedMesh = new THREE.Mesh(mergedGeometry, material);
        
        this.batchedGeometries.set(batchedMesh.uuid, {
            mesh: batchedMesh,
            originalObjects: objects
        });
        
        return batchedMesh;
    }

    // Performance Monitoring
    updateStats() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.stats.fps = this.frameCount;
            this.stats.frameTime = 1000 / this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // Update renderer info
            const info = this.renderer.info;
            this.stats.drawCalls = info.render.calls;
            this.stats.triangles = info.render.triangles;
            this.stats.geometries = info.memory.geometries;
            this.stats.textures = info.memory.textures;
        }
    }

    getStats() {
        return { ...this.stats };
    }

    // Memory Management
    disposeObject(object) {
        if (object.geometry) {
            object.geometry.dispose();
        }
        
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
        
        if (object.texture) {
            object.texture.dispose();
        }
    }

    cleanupUnusedAssets() {
        // Clean up unused geometries
        this.scene.traverse((object) => {
            if (object.isMesh && !object.visible) {
                this.disposeObject(object);
            }
        });
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }

    // Quality Settings
    setQualityLevel(level) {
        switch (level) {
            case 'low':
                this.renderer.shadowMap.enabled = false;
                this.renderer.antialias = false;
                this.lodLevels[0].distance = 0;
                this.lodLevels[1].distance = 5;
                this.lodLevels[2].distance = 10;
                this.lodLevels[3].distance = 20;
                break;
                
            case 'medium':
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.BasicShadowMap;
                this.renderer.antialias = false;
                this.lodLevels[0].distance = 0;
                this.lodLevels[1].distance = 10;
                this.lodLevels[2].distance = 20;
                this.lodLevels[3].distance = 40;
                break;
                
            case 'high':
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                this.renderer.antialias = true;
                this.lodLevels[0].distance = 0;
                this.lodLevels[1].distance = 15;
                this.lodLevels[2].distance = 30;
                this.lodLevels[3].distance = 60;
                break;
                
            case 'ultra':
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                this.renderer.antialias = true;
                this.renderer.shadowMap.autoUpdate = true;
                this.lodLevels[0].distance = 0;
                this.lodLevels[1].distance = 25;
                this.lodLevels[2].distance = 50;
                this.lodLevels[3].distance = 100;
                break;
        }
    }

    // Adaptive Quality
    enableAdaptiveQuality() {
        this.adaptiveQuality = true;
        this.targetFPS = 60;
        this.qualityLevel = 'high';
    }

    updateAdaptiveQuality() {
        if (!this.adaptiveQuality) return;
        
        const currentFPS = this.stats.fps;
        
        if (currentFPS < this.targetFPS - 10) {
            // Lower quality
            switch (this.qualityLevel) {
                case 'ultra':
                    this.setQualityLevel('high');
                    this.qualityLevel = 'high';
                    break;
                case 'high':
                    this.setQualityLevel('medium');
                    this.qualityLevel = 'medium';
                    break;
                case 'medium':
                    this.setQualityLevel('low');
                    this.qualityLevel = 'low';
                    break;
            }
        } else if (currentFPS > this.targetFPS + 10) {
            // Raise quality
            switch (this.qualityLevel) {
                case 'low':
                    this.setQualityLevel('medium');
                    this.qualityLevel = 'medium';
                    break;
                case 'medium':
                    this.setQualityLevel('high');
                    this.qualityLevel = 'high';
                    break;
                case 'high':
                    this.setQualityLevel('ultra');
                    this.qualityLevel = 'ultra';
                    break;
            }
        }
    }

    // Update method
    update() {
        this.updateLOD();
        this.performOcclusionCulling();
        this.updateStats();
        this.updateAdaptiveQuality();
    }
}

// Export for use in main game
window.PerformanceManager = PerformanceManager;