// Energy Quest: Misteri Hemat Listrik
// Game Engine with Three.js

class GameState {
    static LOADING = 'loading';
    static OPENING_CUTSCENE = 'opening_cutscene';
    static MAIN_MENU = 'main_menu';
    static LEVEL_1 = 'level_1';
    static LEVEL_2 = 'level_2';
    static LEVEL_3 = 'level_3';
    static LEVEL_4 = 'level_4';
    static ENDING_CUTSCENE = 'ending_cutscene';
    static SETTINGS = 'settings';
    static ABOUT = 'about';
}

class FiniteStateMachine {
    constructor() {
        this.currentState = GameState.LOADING;
        this.states = new Map();
        this.transitions = new Map();
    }

    addState(state, enterCallback, updateCallback, exitCallback) {
        this.states.set(state, {
            enter: enterCallback,
            update: updateCallback,
            exit: exitCallback
        });
    }

    addTransition(fromState, toState, condition) {
        if (!this.transitions.has(fromState)) {
            this.transitions.set(fromState, []);
        }
        this.transitions.get(fromState).push({ to: toState, condition });
    }

    update() {
        const currentStateData = this.states.get(this.currentState);
        if (currentStateData && currentStateData.update) {
            currentStateData.update();
        }

        // Check transitions
        const possibleTransitions = this.transitions.get(this.currentState) || [];
        for (const transition of possibleTransitions) {
            if (transition.condition()) {
                this.changeState(transition.to);
                break;
            }
        }
    }

    changeState(newState) {
        const currentStateData = this.states.get(this.currentState);
        if (currentStateData && currentStateData.exit) {
            currentStateData.exit();
        }

        this.currentState = newState;

        const newStateData = this.states.get(this.currentState);
        if (newStateData && newStateData.enter) {
            newStateData.enter();
        }
    }
}

class FisherYatesShuffle {
    static shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

class EnergyQuestGame {
    constructor() {
        this.fsm = new FiniteStateMachine();
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.loader = new THREE.GLTFLoader();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Interactive objects
        this.interactiveObjects = new Map();
        this.hoveredObject = null;
        this.selectedObject = null;
        this.draggedObject = null;
        
        // Physics simulation
        this.physicsWorld = null;
        this.physicsBodies = new Map();
        
        // Particle systems
        this.particleSystems = new Map();
        
        // Animation system
        this.animations = new Map();
        this.clock = new THREE.Clock();
        
        // Lighting system
        this.dynamicLights = new Map();
        
        this.gameData = {
            energyKeys: [false, false, false],
            currentLevel: 1,
            powerMeter: 30,
            quizQuestions: [],
            currentQuizIndex: 0,
            quizScore: 0
        };

        this.assets = new Map();
        this.audioManager = new AudioManager();
        
        this.init();
    }

    init() {
        this.setupFSM();
        this.setupEventListeners();
        this.setupAudio();
        this.setupPhysics();
        this.setupParticleSystems();
        this.setupAnimationSystem();
        this.loadAssets();
    }

    setupFSM() {
        // Loading State
        this.fsm.addState(
            GameState.LOADING,
            () => this.enterLoading(),
            () => this.updateLoading(),
            () => this.exitLoading()
        );

        // Opening Cutscene State
        this.fsm.addState(
            GameState.OPENING_CUTSCENE,
            () => this.enterOpeningCutscene(),
            () => this.updateOpeningCutscene(),
            () => this.exitOpeningCutscene()
        );

        // Main Menu State
        this.fsm.addState(
            GameState.MAIN_MENU,
            () => this.enterMainMenu(),
            () => this.updateMainMenu(),
            () => this.exitMainMenu()
        );

        // Level States
        this.fsm.addState(
            GameState.LEVEL_1,
            () => this.enterLevel1(),
            () => this.updateLevel1(),
            () => this.exitLevel1()
        );

        this.fsm.addState(
            GameState.LEVEL_2,
            () => this.enterLevel2(),
            () => this.updateLevel2(),
            () => this.exitLevel2()
        );

        this.fsm.addState(
            GameState.LEVEL_3,
            () => this.enterLevel3(),
            () => this.updateLevel3(),
            () => this.exitLevel3()
        );

        this.fsm.addState(
            GameState.LEVEL_4,
            () => this.enterLevel4(),
            () => this.updateLevel4(),
            () => this.exitLevel4()
        );

        // Ending Cutscene State
        this.fsm.addState(
            GameState.ENDING_CUTSCENE,
            () => this.enterEndingCutscene(),
            () => this.updateEndingCutscene(),
            () => this.exitEndingCutscene()
        );

        // Transitions
        this.fsm.addTransition(GameState.LOADING, GameState.OPENING_CUTSCENE, () => this.assetsLoaded);
        this.fsm.addTransition(GameState.OPENING_CUTSCENE, GameState.MAIN_MENU, () => this.cutsceneFinished);
        this.fsm.addTransition(GameState.MAIN_MENU, GameState.LEVEL_1, () => this.startGameClicked);
        this.fsm.addTransition(GameState.LEVEL_1, GameState.LEVEL_2, () => this.level1Completed);
        this.fsm.addTransition(GameState.LEVEL_2, GameState.LEVEL_3, () => this.level2Completed);
        this.fsm.addTransition(GameState.LEVEL_3, GameState.LEVEL_4, () => this.level3Completed);
        this.fsm.addTransition(GameState.LEVEL_4, GameState.ENDING_CUTSCENE, () => this.level4Completed);
    }

    setupEventListeners() {
        // Menu buttons
        document.getElementById('start-game').addEventListener('click', () => {
            this.audioManager.playClick();
            this.startGameClicked = true;
        });

        document.getElementById('continue-game').addEventListener('click', () => {
            this.audioManager.playClick();
            this.loadGame();
        });

        document.getElementById('settings').addEventListener('click', () => {
            this.audioManager.playClick();
            this.showSettings();
        });

        document.getElementById('about').addEventListener('click', () => {
            this.audioManager.playClick();
            this.showAbout();
        });

        // Modal buttons
        document.getElementById('settings-close').addEventListener('click', () => {
            this.audioManager.playClick();
            this.hideSettings();
        });

        document.getElementById('about-close').addEventListener('click', () => {
            this.audioManager.playClick();
            this.hideAbout();
        });

        // Settings controls
        document.getElementById('music-volume').addEventListener('input', (e) => {
            this.audioManager.setMusicVolume(e.target.value);
        });

        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            this.audioManager.setSfxVolume(e.target.value);
        });

        // Puzzle buttons
        document.getElementById('puzzle-submit').addEventListener('click', () => {
            this.audioManager.playClick();
            this.submitPuzzle();
        });

        document.getElementById('puzzle-cancel').addEventListener('click', () => {
            this.audioManager.playClick();
            this.cancelPuzzle();
        });

        // 3D Interaction Events
        this.setup3DInteractions();
    }

    setupAudio() {
        // Audio is handled by AudioManager class
        this.audioManager.playBackgroundMusic();
    }

    setupPhysics() {
        // Simple physics simulation for electrical components
        this.physicsWorld = {
            objects: new Map(),
            gravity: new THREE.Vector3(0, -9.82, 0),
            update: (deltaTime) => {
                // Update physics objects
                this.physicsWorld.objects.forEach((obj, id) => {
                    if (obj.velocity) {
                        obj.position.add(obj.velocity.clone().multiplyScalar(deltaTime));
                        obj.velocity.add(this.physicsWorld.gravity.clone().multiplyScalar(deltaTime));
                    }
                });
            }
        };
    }

    setupParticleSystems() {
        // Create particle systems for different effects
        this.createElectricParticles();
        this.createEnergyFlowParticles();
        this.createSparkParticles();
    }

    createElectricParticles() {
        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 10;
            positions[i3 + 1] = (Math.random() - 0.5) * 10;
            positions[i3 + 2] = (Math.random() - 0.5) * 10;

            colors[i3] = 0.3 + Math.random() * 0.7; // R
            colors[i3 + 1] = 0.8 + Math.random() * 0.2; // G
            colors[i3 + 2] = 0.9 + Math.random() * 0.1; // B

            sizes[i] = Math.random() * 0.5 + 0.1;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.electricParticles = new THREE.Points(particles, material);
        this.particleSystems.set('electric', this.electricParticles);
    }

    createEnergyFlowParticles() {
        const particleCount = 200;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = 0;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = 0;

            colors[i3] = 0.2; // R
            colors[i3 + 1] = 0.9; // G
            colors[i3 + 2] = 1.0; // B
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        this.energyFlowParticles = new THREE.Points(particles, material);
        this.particleSystems.set('energyFlow', this.energyFlowParticles);
    }

    createSparkParticles() {
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = 0;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = 0;

            colors[i3] = 1.0; // R
            colors[i3 + 1] = 0.8; // G
            colors[i3 + 2] = 0.2; // B
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.sparkParticles = new THREE.Points(particles, material);
        this.particleSystems.set('spark', this.sparkParticles);
    }

    setupAnimationSystem() {
        // Animation mixer for smooth transitions
        this.animationMixer = new THREE.AnimationMixer();
        this.animations = new Map();
    }

    setup3DInteractions() {
        const canvas = document.getElementById('game-canvas');
        
        // Mouse events for 3D interaction
        canvas.addEventListener('mousemove', (event) => {
            this.onMouseMove(event);
        });

        canvas.addEventListener('click', (event) => {
            this.onMouseClick(event);
        });

        canvas.addEventListener('mousedown', (event) => {
            this.onMouseDown(event);
        });

        canvas.addEventListener('mouseup', (event) => {
            this.onMouseUp(event);
        });

        // Touch events for mobile
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        });

        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        });

        canvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.onMouseUp(event);
        });
    }

    onMouseMove(event) {
        if (!this.renderer || !this.camera) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check for hover
        this.checkHover();
    }

    onMouseClick(event) {
        if (!this.renderer || !this.camera) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.handleClick();
    }

    onMouseDown(event) {
        if (!this.renderer || !this.camera) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.handleMouseDown();
    }

    onMouseUp(event) {
        this.handleMouseUp();
    }

    checkHover() {
        const intersects = this.raycaster.intersectObjects(Array.from(this.interactiveObjects.values()));
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            if (this.hoveredObject !== object) {
                // Remove previous hover effect
                if (this.hoveredObject) {
                    this.removeHoverEffect(this.hoveredObject);
                }
                
                // Add hover effect to new object
                this.hoveredObject = object;
                this.addHoverEffect(object);
                
                // Change cursor
                document.body.style.cursor = 'pointer';
            }
        } else {
            if (this.hoveredObject) {
                this.removeHoverEffect(this.hoveredObject);
                this.hoveredObject = null;
                document.body.style.cursor = 'default';
            }
        }
    }

    handleClick() {
        const intersects = this.raycaster.intersectObjects(Array.from(this.interactiveObjects.values()));
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            const interactiveData = this.getInteractiveData(object);
            
            if (interactiveData) {
                this.audioManager.playClick();
                this.interactWithObject(object, interactiveData);
            }
        }
    }

    handleMouseDown() {
        const intersects = this.raycaster.intersectObjects(Array.from(this.interactiveObjects.values()));
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            const interactiveData = this.getInteractiveData(object);
            
            if (interactiveData && interactiveData.draggable) {
                this.draggedObject = object;
                this.startDragging(object);
            }
        }
    }

    handleMouseUp() {
        if (this.draggedObject) {
            this.stopDragging(this.draggedObject);
            this.draggedObject = null;
        }
    }

    addInteractiveObject(object, data) {
        this.interactiveObjects.set(object.uuid, object);
        object.userData.interactive = data;
        
        // Add visual feedback
        this.addInteractiveVisuals(object);
    }

    removeInteractiveObject(object) {
        this.interactiveObjects.delete(object.uuid);
        delete object.userData.interactive;
        this.removeInteractiveVisuals(object);
    }

    getInteractiveData(object) {
        return object.userData.interactive;
    }

    addInteractiveVisuals(object) {
        // Add outline effect
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0x4ecdc4,
            side: THREE.BackSide
        });
        
        const outlineGeometry = object.geometry.clone();
        outlineGeometry.scale(1.05, 1.05, 1.05);
        
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        outline.visible = false;
        outline.userData.isOutline = true;
        
        object.add(outline);
        object.userData.outline = outline;
    }

    removeInteractiveVisuals(object) {
        if (object.userData.outline) {
            object.remove(object.userData.outline);
            delete object.userData.outline;
        }
    }

    addHoverEffect(object) {
        if (object.userData.outline) {
            object.userData.outline.visible = true;
        }
        
        // Add glow effect
        object.userData.originalMaterial = object.material;
        const glowMaterial = object.material.clone();
        glowMaterial.emissive = new THREE.Color(0x4ecdc4);
        glowMaterial.emissiveIntensity = 0.3;
        object.material = glowMaterial;
        
        // Add particle effect
        this.showParticleEffect(object.position, 'electric');
    }

    removeHoverEffect(object) {
        if (object.userData.outline) {
            object.userData.outline.visible = false;
        }
        
        if (object.userData.originalMaterial) {
            object.material = object.userData.originalMaterial;
        }
    }

    interactWithObject(object, data) {
        switch (data.type) {
            case 'cable_component':
                this.handleCableComponentInteraction(object, data);
                break;
            case 'appliance':
                this.handleApplianceInteraction(object, data);
                break;
            case 'simulator':
                this.handleSimulatorInteraction(object, data);
                break;
            case 'slider':
                this.handleSliderInteraction(object, data);
                break;
            case 'door':
                this.handleDoorInteraction(object, data);
                break;
            case 'key_slot':
                this.handleKeySlotInteraction(object, data);
                break;
            default:
                console.log('Unknown interaction type:', data.type);
        }
    }

    handleKeySlotInteraction(object, data) {
        // Key slot interaction - just show feedback
        this.showFeedback(`Slot Kunci Energi ${data.keyIndex + 1}`, 'info');
    }

    handleCableComponentInteraction(object, data) {
        // Animate the component
        this.animateObject(object, 'pulse');
        
        // Show electrical effect
        this.showParticleEffect(object.position, 'spark');
        
        // Handle cable connection logic
        if (this.fsm.currentState === GameState.LEVEL_1) {
            this.handleCableComponentInteraction3D(object, data);
        }
    }

    handleCableComponentInteraction3D(object, data) {
        const componentType = data.componentType;
        
        if (this.cableConnections.length === 0 && componentType === 'battery+') {
            this.cableConnections.push(componentType);
            this.animateObject(object, 'pulse');
            this.showParticleEffect(object.position, 'electric');
            this.audioManager.playElectric();
        } else if (this.cableConnections.length === 1 && componentType === 'switch') {
            this.cableConnections.push(componentType);
            this.animateObject(object, 'toggle');
            this.showParticleEffect(object.position, 'electric');
            this.audioManager.playElectric();
        } else if (this.cableConnections.length === 2 && componentType === 'lamp') {
            this.cableConnections.push(componentType);
            this.animateObject(object, 'pulse');
            this.showParticleEffect(object.position, 'electric');
            this.audioManager.playElectric();
        } else if (this.cableConnections.length === 3 && componentType === 'battery-') {
            this.cableConnections.push(componentType);
            this.animateObject(object, 'pulse');
            this.showParticleEffect(object.position, 'electric');
            this.audioManager.playElectric();
            this.checkCablePuzzle3D();
        }
    }

    checkCablePuzzle3D() {
        const correctSequence = ['battery+', 'switch', 'lamp', 'battery-'];
        const isCorrect = this.cableConnections.every((connection, index) => 
            connection === correctSequence[index]
        );

        if (isCorrect) {
            // Turn on the lamp
            if (this.cableComponents && this.cableComponents.lamp) {
                this.cableComponents.lamp.userData.isOn = true;
                this.cableComponents.lamp.material.emissiveIntensity = 0.5;
                this.cableComponents.lamp.material.emissive.setHex(0xffff00);
            }
            
            this.audioManager.playSuccess();
            this.showFeedback('Rangkaian listrik berhasil diperbaiki! Listrik mengalir dalam rangkaian tertutup.', 'success');
            this.collectEnergyKey(0);
            setTimeout(() => {
                this.hidePuzzleInterface();
                this.level1Completed = true;
            }, 2000);
        } else {
            this.audioManager.playError();
            this.showFeedback('Rangkaian terbuka atau salah sambung. Arus tidak mengalir.', 'error');
            this.resetCablePuzzle3D();
        }
    }

    resetCablePuzzle3D() {
        this.cableConnections = [];
        
        // Reset all components
        Object.values(this.cableComponents).forEach(component => {
            component.userData.isOn = false;
            if (component.userData.componentType === 'lamp') {
                component.material.emissiveIntensity = 0;
                component.material.emissive.setHex(0x000000);
            }
        });
    }

    handleApplianceInteraction(object, data) {
        // Toggle appliance state
        data.on = !data.on;
        object.userData.isOn = data.on;
        
        // Animate toggle
        this.animateObject(object, 'toggle');
        
        // Show energy effect
        if (data.on) {
            this.showParticleEffect(object.position, 'energyFlow');
            this.audioManager.playElectric();
        } else {
            this.audioManager.playClick();
        }
        
        // Update appliance visual state
        this.updateApplianceVisual(object, data);
        
        // Update power meter
        this.updatePowerMeter();
        
        // Check efficiency puzzle
        this.checkEfficiencyPuzzle();
    }

    updateApplianceVisual(object, data) {
        if (data.applianceType === 'light') {
            if (data.on) {
                object.material.emissiveIntensity = 0.5;
                object.material.emissive.setHex(0xffff00);
            } else {
                object.material.emissiveIntensity = 0;
                object.material.emissive.setHex(0x000000);
            }
        } else if (data.applianceType === 'fan') {
            if (data.on) {
                object.rotation.y += 0.1;
                this.animateObject(object, 'pulse');
            }
        }
    }

    handleSimulatorInteraction(object, data) {
        // Show simulation interface
        this.showEnergySimulator();
    }

    handleSliderInteraction(object, data) {
        // Update slider value based on mouse position
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = (this.mouse.x + 1) / 2; // Convert from -1,1 to 0,1
        
        // Update slider position
        const track = object.userData.track;
        const trackStart = track.position.x - 0.15;
        const trackEnd = track.position.x + 0.15;
        const newX = trackStart + (trackEnd - trackStart) * mouseX;
        
        object.position.x = Math.max(trackStart, Math.min(trackEnd, newX));
        
        // Update value (0-1)
        data.value = (object.position.x - trackStart) / (trackEnd - trackStart);
        
        // Update simulator
        this.updateSimulatorFromSliders();
        
        // Show particle effect
        this.showParticleEffect(object.position, 'electric');
    }

    updateSimulatorFromSliders() {
        if (!this.simulatorSliders) return;
        
        let totalEnergy = 0;
        
        this.simulatorSliders.forEach((slider, appliance) => {
            const interactiveData = this.getInteractiveData(slider);
            const value = interactiveData.value;
            
            // Convert slider value to hours (0-24)
            const hours = value * 24;
            
            // Calculate energy consumption
            const consumption = this.getApplianceConsumption(appliance);
            const dailyEnergy = (consumption * hours) / 1000; // kWh
            const monthlyEnergy = dailyEnergy * 30; // kWh per month
            totalEnergy += monthlyEnergy;
        });
        
        const billAmount = totalEnergy * 1500; // Rp 1,500 per kWh
        
        // Update bill display
        this.updateBillDisplay(billAmount);
        
        // Check if target is met
        if (billAmount <= this.targetBill) {
            this.collectEnergyKey(2);
            this.showFeedback('Tagihan listrik efisien tercapai! Blueprint alat rahasia ilmuwan ditemukan.', 'success');
            setTimeout(() => {
                this.hidePuzzleInterface();
                this.level3Completed = true;
            }, 2000);
        }
    }

    getApplianceConsumption(appliance) {
        const consumptions = {
            light: 20,
            ac: 1000,
            tv: 100,
            fridge: 150,
            computer: 200
        };
        return consumptions[appliance] || 0;
    }

    updateBillDisplay(billAmount) {
        // Update UI bill display
        const billElement = document.getElementById('bill-amount');
        if (billElement) {
            billElement.textContent = Math.round(billAmount).toLocaleString();
        }
        
        // Update 3D bill display
        if (this.billDisplay) {
            const billDisplayMaterial = this.billDisplay.material;
            if (billAmount <= this.targetBill) {
                billDisplayMaterial.color.setHex(0x4ecdc4);
            } else {
                billDisplayMaterial.color.setHex(0xff6b6b);
            }
        }
    }

    handleDoorInteraction(object, data) {
        // Check if all keys collected
        const allKeysCollected = this.gameData.energyKeys.every(key => key);
        
        if (allKeysCollected) {
            this.animateObject(object, 'open');
            this.showParticleEffect(object.position, 'energyFlow');
            this.audioManager.playDoorOpen();
            
            // Update key slots
            this.updateEnergyKeySlots();
            
            setTimeout(() => {
                this.startQuiz();
            }, 2000);
        } else {
            this.audioManager.playError();
            this.showFeedback('Kumpulkan semua Kunci Energi terlebih dahulu!', 'error');
        }
    }

    updateEnergyKeySlots() {
        if (this.energyKeySlots) {
            this.energyKeySlots.forEach((slot, index) => {
                if (this.gameData.energyKeys[index]) {
                    slot.material.emissiveIntensity = 0.5;
                    slot.material.emissive.setHex(0x4ecdc4);
                    this.showParticleEffect(slot.position, 'electric');
                }
            });
        }
    }

    animateObject(object, animationType) {
        const animationData = {
            object: object,
            type: animationType,
            startTime: this.clock.getElapsedTime(),
            duration: 1.0
        };
        
        this.animations.set(object.uuid, animationData);
    }

    showParticleEffect(position, type) {
        const particles = this.particleSystems.get(type);
        if (particles) {
            particles.position.copy(position);
            particles.visible = true;
            
            // Hide after animation
            setTimeout(() => {
                particles.visible = false;
            }, 2000);
        }
    }

    startDragging(object) {
        object.userData.isDragging = true;
        object.userData.dragStartPosition = object.position.clone();
        
        // Add drag effect
        this.showParticleEffect(object.position, 'electric');
    }

    stopDragging(object) {
        object.userData.isDragging = false;
        
        // Check for valid drop position
        this.checkDropPosition(object);
    }

    checkDropPosition(object) {
        // Check if dropped on valid connection point
        const intersects = this.raycaster.intersectObjects(Array.from(this.interactiveObjects.values()));
        
        if (intersects.length > 0) {
            const targetObject = intersects[0].object;
            const targetData = this.getInteractiveData(targetObject);
            
            if (targetData && targetData.acceptsConnection) {
                this.connectObjects(object, targetObject);
            } else {
                // Return to original position
                object.position.copy(object.userData.dragStartPosition);
            }
        } else {
            // Return to original position
            object.position.copy(object.userData.dragStartPosition);
        }
    }

    connectObjects(object1, object2) {
        // Create connection line
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
            object1.position.x, object1.position.y, object1.position.z,
            object2.position.x, object2.position.y, object2.position.z
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: 0x4ecdc4,
            linewidth: 3
        });
        
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        
        // Store connection
        if (!object1.userData.connections) {
            object1.userData.connections = [];
        }
        object1.userData.connections.push({ object: object2, line: line });
        
        // Show connection effect
        this.showParticleEffect(object1.position, 'energyFlow');
        this.showParticleEffect(object2.position, 'energyFlow');
        
        // Play connection sound
        this.audioManager.playElectric();
    }

    async loadAssets() {
        const assetPaths = [
            '3D/ruangan/scene.gltf',
            '3D/dapur/scene.gltf',
            '3D/laboratory/scene.gltf',
            '3D/ruang bawah tanah/scene.gltf',
            '3D/baterai/scene.gltf',
            '3D/lampu/scene.gltf',
            '3D/saklar/scene.gltf',
            '3D/tv/scene.gltf',
            '3D/ilmuwan/scene.gltf',
            '3D/siswa smp/scene.gltf'
        ];

        let loadedCount = 0;
        const totalAssets = assetPaths.length;

        for (const path of assetPaths) {
            try {
                const gltf = await this.loadGLTF(path);
                const assetName = path.split('/')[1];
                this.assets.set(assetName, gltf);
                loadedCount++;
                
                const progress = (loadedCount / totalAssets) * 100;
                this.updateLoadingProgress(progress);
                
                if (loadedCount === totalAssets) {
                    this.assetsLoaded = true;
                }
            } catch (error) {
                console.error(`Failed to load asset: ${path}`, error);
            }
        }
    }

    loadGLTF(path) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => resolve(gltf),
                (progress) => {
                    // Progress callback
                },
                (error) => reject(error)
            );
        });
    }

    updateLoadingProgress(progress) {
        const progressBar = document.querySelector('.loading-progress');
        const loadingText = document.querySelector('.loading-text');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (loadingText) {
            if (progress < 100) {
                loadingText.textContent = `Memuat aset 3D... ${Math.round(progress)}%`;
            } else {
                loadingText.textContent = 'Siap memulai petualangan!';
            }
        }
    }

    // State Enter Methods
    enterLoading() {
        this.showScreen('loading-screen');
        this.assetsLoaded = false;
        this.cutsceneFinished = false;
        this.startGameClicked = false;
        this.level1Completed = false;
        this.level2Completed = false;
        this.level3Completed = false;
        this.level4Completed = false;
    }

    enterOpeningCutscene() {
        this.showScreen('opening-cutscene');
        this.startCutscene();
    }

    enterMainMenu() {
        this.showScreen('main-menu');
        this.setupMainMenuScene();
    }

    enterLevel1() {
        this.showScreen('game-canvas-container');
        this.setupLevel1Scene();
        this.showInstructions('Jelajahi ruang tamu dan perbaiki rangkaian listrik!');
    }

    enterLevel2() {
        this.setupLevel2Scene();
        this.showInstructions('Kelola peralatan dapur dengan efisien!');
    }

    enterLevel3() {
        this.setupLevel3Scene();
        this.showInstructions('Atur konsumsi energi agar tidak melebihi batas tagihan!');
    }

    enterLevel4() {
        this.setupLevel4Scene();
        this.showInstructions('Gunakan semua Kunci Energi untuk membuka pintu rahasia!');
        this.startQuiz();
    }

    enterEndingCutscene() {
        this.showScreen('opening-cutscene');
        this.startEndingCutscene();
    }

    // State Update Methods
    updateLoading() {
        // Loading is handled by asset loading
    }

    updateOpeningCutscene() {
        // Cutscene is handled by animation
    }

    updateMainMenu() {
        // Menu is handled by UI
    }

    updateLevel1() {
        this.updateGameScene();
    }

    updateLevel2() {
        this.updateGameScene();
    }

    updateLevel3() {
        this.updateGameScene();
    }

    updateLevel4() {
        this.updateGameScene();
    }

    updateEndingCutscene() {
        // Ending cutscene is handled by animation
    }

    // State Exit Methods
    exitLoading() {
        // Cleanup loading screen
    }

    exitOpeningCutscene() {
        // Cleanup cutscene
    }

    exitMainMenu() {
        // Cleanup menu
    }

    exitLevel1() {
        // Cleanup level 1
    }

    exitLevel2() {
        // Cleanup level 2
    }

    exitLevel3() {
        // Cleanup level 3
    }

    exitLevel4() {
        // Cleanup level 4
    }

    exitEndingCutscene() {
        // Cleanup ending
    }

    // Screen Management
    showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.add('hidden'));
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }
    }

    // Cutscene Management
    startCutscene() {
        const cutsceneTitle = document.getElementById('cutscene-title');
        const cutsceneSubtitle = document.getElementById('cutscene-subtitle');
        const cutsceneCharacterText = document.getElementById('cutscene-character-text');

        // Animate text appearance
        setTimeout(() => {
            cutsceneTitle.style.opacity = '1';
            cutsceneTitle.style.transform = 'translateY(0)';
        }, 500);

        setTimeout(() => {
            cutsceneSubtitle.style.opacity = '1';
            cutsceneSubtitle.style.transform = 'translateY(0)';
        }, 2000);

        setTimeout(() => {
            cutsceneCharacterText.style.opacity = '1';
            cutsceneCharacterText.style.transform = 'translateY(0)';
        }, 4000);

        // Auto advance after cutscene
        setTimeout(() => {
            this.cutsceneFinished = true;
        }, 8000);
    }

    startEndingCutscene() {
        const cutsceneTitle = document.getElementById('cutscene-title');
        const cutsceneSubtitle = document.getElementById('cutscene-subtitle');
        const cutsceneCharacterText = document.getElementById('cutscene-character-text');

        cutsceneTitle.textContent = 'Selamat! Misteri telah terpecahkan!';
        cutsceneSubtitle.textContent = 'Ilmuwan telah ditemukan kembali.';
        cutsceneCharacterText.textContent = 'Gunakanlah pengetahuan ini dalam kehidupan nyata, dan jadilah generasi yang hemat energi.';

        this.startCutscene();
    }

    // Scene Setup Methods
    setupMainMenuScene() {
        // Setup 3D scene for main menu background
        if (!this.scene) {
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, 1600/720, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ 
                canvas: document.getElementById('game-canvas'),
                antialias: true 
            });
            this.renderer.setSize(1600, 720);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        // Add house model to background
        const houseModel = this.assets.get('ruangan');
        if (houseModel) {
            const house = houseModel.scene.clone();
            house.scale.set(2, 2, 2);
            house.position.set(0, -2, -5);
            this.scene.add(house);
        }

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x4ecdc4, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        this.animate();
    }

    setupLevel1Scene() {
        this.scene.clear();
        this.interactiveObjects.clear();
        
        // Add room model
        const roomModel = this.assets.get('ruangan');
        if (roomModel) {
            const room = roomModel.scene.clone();
            room.scale.set(1.5, 1.5, 1.5);
            room.position.set(0, -1, 0);
            this.scene.add(room);
        }

        // Add interactive electrical components
        this.setupInteractiveCableComponents();

        // Add dynamic lighting
        this.setupDynamicLighting();

        // Add particle systems to scene
        this.particleSystems.forEach((particles, name) => {
            this.scene.add(particles);
            particles.visible = false;
        });

        // Setup camera controls
        this.setupCameraControls();

        this.camera.position.set(0, 3, 8);
        this.camera.lookAt(0, 0, 0);

        this.setupCablePuzzle();
    }

    setupInteractiveCableComponents() {
        // Create interactive battery (+)
        const batteryGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.3);
        const batteryMaterial = new THREE.MeshPhongMaterial({ color: 0x4ecdc4 });
        const batteryPlus = new THREE.Mesh(batteryGeometry, batteryMaterial);
        batteryPlus.position.set(-2, 0, 0);
        batteryPlus.userData.componentType = 'battery+';
        
        this.addInteractiveObject(batteryPlus, {
            type: 'cable_component',
            componentType: 'battery+',
            draggable: true,
            acceptsConnection: true
        });
        this.scene.add(batteryPlus);

        // Create interactive switch
        const switchGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
        const switchMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const switchComponent = new THREE.Mesh(switchGeometry, switchMaterial);
        switchComponent.position.set(-1, 0, 0);
        switchComponent.userData.componentType = 'switch';
        
        this.addInteractiveObject(switchComponent, {
            type: 'cable_component',
            componentType: 'switch',
            draggable: true,
            acceptsConnection: true
        });
        this.scene.add(switchComponent);

        // Create interactive lamp
        const lampGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const lampMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0x000000,
            emissiveIntensity: 0
        });
        const lampComponent = new THREE.Mesh(lampGeometry, lampMaterial);
        lampComponent.position.set(0, 0, 0);
        lampComponent.userData.componentType = 'lamp';
        lampComponent.userData.isOn = false;
        
        this.addInteractiveObject(lampComponent, {
            type: 'cable_component',
            componentType: 'lamp',
            draggable: true,
            acceptsConnection: true
        });
        this.scene.add(lampComponent);

        // Create interactive battery (-)
        const batteryMinus = new THREE.Mesh(batteryGeometry, batteryMaterial);
        batteryMinus.position.set(1, 0, 0);
        batteryMinus.userData.componentType = 'battery-';
        
        this.addInteractiveObject(batteryMinus, {
            type: 'cable_component',
            componentType: 'battery-',
            draggable: true,
            acceptsConnection: true
        });
        this.scene.add(batteryMinus);

        // Store components for puzzle logic
        this.cableComponents = {
            'battery+': batteryPlus,
            'switch': switchComponent,
            'lamp': lampComponent,
            'battery-': batteryMinus
        };
    }

    setupDynamicLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0x4ecdc4, 0.6);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Dynamic point lights for electrical effects
        const pointLight1 = new THREE.PointLight(0x4ecdc4, 1, 5);
        pointLight1.position.set(-2, 1, 0);
        pointLight1.userData.isDynamic = true;
        this.scene.add(pointLight1);
        this.dynamicLights.set('battery+', pointLight1);

        const pointLight2 = new THREE.PointLight(0x4ecdc4, 1, 5);
        pointLight2.position.set(0, 1, 0);
        pointLight2.userData.isDynamic = true;
        this.scene.add(pointLight2);
        this.dynamicLights.set('lamp', pointLight2);
    }

    setupCameraControls() {
        if (this.controls) {
            this.controls.dispose();
        }
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 15;
    }

    setupLevel2Scene() {
        this.scene.clear();
        this.interactiveObjects.clear();
        
        // Add kitchen model
        const kitchenModel = this.assets.get('dapur');
        if (kitchenModel) {
            const kitchen = kitchenModel.scene.clone();
            kitchen.scale.set(1.2, 1.2, 1.2);
            kitchen.position.set(0, -1, 0);
            this.scene.add(kitchen);
        }

        // Add interactive appliances
        this.setupInteractiveAppliances();

        // Add dynamic lighting
        this.setupDynamicLighting();

        // Add particle systems to scene
        this.particleSystems.forEach((particles, name) => {
            this.scene.add(particles);
            particles.visible = false;
        });

        // Setup camera controls
        this.setupCameraControls();

        this.camera.position.set(0, 3, 8);
        this.camera.lookAt(0, 0, 0);

        this.setupEfficiencyPuzzle();
    }

    setupInteractiveAppliances() {
        // Interactive Light
        const lightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const lightMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0x000000,
            emissiveIntensity: 0
        });
        const lightAppliance = new THREE.Mesh(lightGeometry, lightMaterial);
        lightAppliance.position.set(-2, 2, -1);
        lightAppliance.userData.applianceType = 'light';
        lightAppliance.userData.isOn = true;
        lightAppliance.userData.consumption = 20;
        
        this.addInteractiveObject(lightAppliance, {
            type: 'appliance',
            applianceType: 'light',
            on: true,
            consumption: 20
        });
        this.scene.add(lightAppliance);

        // Interactive Fridge
        const fridgeGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.6);
        const fridgeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        const fridgeAppliance = new THREE.Mesh(fridgeGeometry, fridgeMaterial);
        fridgeAppliance.position.set(2, 0, -1);
        fridgeAppliance.userData.applianceType = 'fridge';
        fridgeAppliance.userData.isOn = true;
        fridgeAppliance.userData.consumption = 150;
        
        this.addInteractiveObject(fridgeAppliance, {
            type: 'appliance',
            applianceType: 'fridge',
            on: true,
            consumption: 150
        });
        this.scene.add(fridgeAppliance);

        // Interactive Fan
        const fanGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
        const fanMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const fanAppliance = new THREE.Mesh(fanGeometry, fanMaterial);
        fanAppliance.position.set(0, 1.5, -1);
        fanAppliance.userData.applianceType = 'fan';
        fanAppliance.userData.isOn = false;
        fanAppliance.userData.consumption = 50;
        
        this.addInteractiveObject(fanAppliance, {
            type: 'appliance',
            applianceType: 'fan',
            on: false,
            consumption: 50
        });
        this.scene.add(fanAppliance);

        // Interactive Rice Cooker
        const riceCookerGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
        const riceCookerMaterial = new THREE.MeshPhongMaterial({ color: 0xff6b6b });
        const riceCookerAppliance = new THREE.Mesh(riceCookerGeometry, riceCookerMaterial);
        riceCookerAppliance.position.set(-1, 0.2, 1);
        riceCookerAppliance.userData.applianceType = 'riceCooker';
        riceCookerAppliance.userData.isOn = false;
        riceCookerAppliance.userData.consumption = 800;
        
        this.addInteractiveObject(riceCookerAppliance, {
            type: 'appliance',
            applianceType: 'riceCooker',
            on: false,
            consumption: 800
        });
        this.scene.add(riceCookerAppliance);

        // Store appliances for efficiency puzzle
        this.appliances = {
            light: { on: true, consumption: 20, object: lightAppliance },
            fridge: { on: true, consumption: 150, object: fridgeAppliance },
            fan: { on: false, consumption: 50, object: fanAppliance },
            riceCooker: { on: false, consumption: 800, object: riceCookerAppliance }
        };
    }

    setupLevel3Scene() {
        this.scene.clear();
        this.interactiveObjects.clear();
        
        // Add laboratory model
        const labModel = this.assets.get('laboratory');
        if (labModel) {
            const lab = labModel.scene.clone();
            lab.scale.set(1.3, 1.3, 1.3);
            lab.position.set(0, -1, 0);
            this.scene.add(lab);
        }

        // Add interactive simulator console
        this.setupInteractiveSimulator();

        // Add dynamic lighting
        this.setupDynamicLighting();

        // Add particle systems to scene
        this.particleSystems.forEach((particles, name) => {
            this.scene.add(particles);
            particles.visible = false;
        });

        // Setup camera controls
        this.setupCameraControls();

        this.camera.position.set(0, 3, 8);
        this.camera.lookAt(0, 0, 0);

        this.setupEnergySimulator();
    }

    setupInteractiveSimulator() {
        // Create simulator console
        const consoleGeometry = new THREE.BoxGeometry(2, 0.5, 1);
        const consoleMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const simulatorConsole = new THREE.Mesh(consoleGeometry, consoleMaterial);
        simulatorConsole.position.set(0, 0.5, 0);
        
        this.addInteractiveObject(simulatorConsole, {
            type: 'simulator',
            draggable: false
        });
        this.scene.add(simulatorConsole);

        // Create interactive sliders for each appliance
        this.setupSimulatorSliders();

        // Create bill display screen
        this.setupBillDisplay();
    }

    setupSimulatorSliders() {
        const sliderPositions = [
            { x: -0.8, y: 0.8, z: 0.5, appliance: 'light' },
            { x: -0.4, y: 0.8, z: 0.5, appliance: 'ac' },
            { x: 0, y: 0.8, z: 0.5, appliance: 'tv' },
            { x: 0.4, y: 0.8, z: 0.5, appliance: 'fridge' },
            { x: 0.8, y: 0.8, z: 0.5, appliance: 'computer' }
        ];

        this.simulatorSliders = new Map();

        sliderPositions.forEach((pos, index) => {
            // Slider track
            const trackGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.05);
            const trackMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
            const track = new THREE.Mesh(trackGeometry, trackMaterial);
            track.position.set(pos.x, pos.y, pos.z);
            this.scene.add(track);

            // Slider handle
            const handleGeometry = new THREE.SphereGeometry(0.08, 16, 16);
            const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x4ecdc4 });
            const handle = new THREE.Mesh(handleGeometry, handleMaterial);
            handle.position.set(pos.x, pos.y, pos.z + 0.1);
            handle.userData.appliance = pos.appliance;
            handle.userData.value = 0.5; // 0-1 range
            handle.userData.track = track;
            
            this.addInteractiveObject(handle, {
                type: 'slider',
                appliance: pos.appliance,
                draggable: true,
                value: 0.5
            });
            this.scene.add(handle);

            this.simulatorSliders.set(pos.appliance, handle);
        });
    }

    setupBillDisplay() {
        // Create bill display screen
        const screenGeometry = new THREE.PlaneGeometry(1.5, 0.8);
        const screenMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.8
        });
        const billScreen = new THREE.Mesh(screenGeometry, screenMaterial);
        billScreen.position.set(0, 1.5, 0.5);
        billScreen.userData.isScreen = true;
        this.scene.add(billScreen);

        // Create bill text (using CSS2DRenderer would be better, but keeping it simple)
        this.billDisplay = billScreen;
    }

    setupLevel4Scene() {
        this.scene.clear();
        this.interactiveObjects.clear();
        
        // Add basement model
        const basementModel = this.assets.get('ruang bawah tanah');
        if (basementModel) {
            const basement = basementModel.scene.clone();
            basement.scale.set(1.4, 1.4, 1.4);
            basement.position.set(0, -1, 0);
            this.scene.add(basement);
        }

        // Add interactive final door
        this.setupInteractiveFinalDoor();

        // Add dynamic lighting
        this.setupDynamicLighting();

        // Add particle systems to scene
        this.particleSystems.forEach((particles, name) => {
            this.scene.add(particles);
            particles.visible = false;
        });

        // Setup camera controls
        this.setupCameraControls();

        this.camera.position.set(0, 3, 8);
        this.camera.lookAt(0, 0, 0);

        this.setupFinalDoor();
    }

    setupInteractiveFinalDoor() {
        // Create final door
        const doorGeometry = new THREE.BoxGeometry(1, 2, 0.2);
        const doorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513,
            emissive: 0x000000,
            emissiveIntensity: 0
        });
        const finalDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        finalDoor.position.set(0, 0, 2);
        finalDoor.userData.isDoor = true;
        finalDoor.userData.isOpen = false;
        
        this.addInteractiveObject(finalDoor, {
            type: 'door',
            draggable: false
        });
        this.scene.add(finalDoor);

        // Create energy key slots
        this.setupEnergyKeySlots();

        // Create door frame with energy effects
        this.setupDoorFrame();
    }

    setupEnergyKeySlots() {
        const keySlotPositions = [
            { x: -0.3, y: 0.5, z: 2.1 },
            { x: 0, y: 0.5, z: 2.1 },
            { x: 0.3, y: 0.5, z: 2.1 }
        ];

        this.energyKeySlots = new Map();

        keySlotPositions.forEach((pos, index) => {
            // Key slot
            const slotGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8);
            const slotMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x4ecdc4,
                emissive: 0x000000,
                emissiveIntensity: 0
            });
            const keySlot = new THREE.Mesh(slotGeometry, slotMaterial);
            keySlot.position.set(pos.x, pos.y, pos.z);
            keySlot.userData.keyIndex = index;
            keySlot.userData.hasKey = false;
            
            this.addInteractiveObject(keySlot, {
                type: 'key_slot',
                keyIndex: index,
                hasKey: false
            });
            this.scene.add(keySlot);

            this.energyKeySlots.set(index, keySlot);
        });
    }

    setupDoorFrame() {
        // Create door frame with energy effects
        const frameGeometry = new THREE.BoxGeometry(1.2, 2.2, 0.1);
        const frameMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4ecdc4,
            emissive: 0x4ecdc4,
            emissiveIntensity: 0.2
        });
        const doorFrame = new THREE.Mesh(frameGeometry, frameMaterial);
        doorFrame.position.set(0, 0, 1.9);
        this.scene.add(doorFrame);

        // Add energy field effect
        const fieldGeometry = new THREE.PlaneGeometry(1.5, 2.5);
        const fieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x4ecdc4,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        const energyField = new THREE.Mesh(fieldGeometry, fieldMaterial);
        energyField.position.set(0, 0, 1.8);
        energyField.userData.isEnergyField = true;
        this.scene.add(energyField);
    }

    // Puzzle Setup Methods
    setupCablePuzzle() {
        // Cable puzzle will be shown when player interacts with cable components
        this.currentPuzzle = 'cable';
        this.cableConnections = [];
        this.cableComponents = ['battery+', 'switch', 'lamp', 'battery-'];
    }

    setupEfficiencyPuzzle() {
        this.currentPuzzle = 'efficiency';
        this.appliances = {
            light: { on: true, consumption: 20 },
            fridge: { on: true, consumption: 150 },
            fan: { on: false, consumption: 50 },
            riceCooker: { on: false, consumption: 800 }
        };
        this.updatePowerMeter();
    }

    setupEnergySimulator() {
        this.currentPuzzle = 'simulator';
        this.simulatorAppliances = {
            light: { on: false, consumption: 20, hours: 0 },
            ac: { on: false, consumption: 1000, hours: 0 },
            tv: { on: false, consumption: 100, hours: 0 },
            fridge: { on: true, consumption: 150, hours: 24 },
            computer: { on: false, consumption: 200, hours: 0 }
        };
        this.targetBill = 300000; // Rp 300,000
        this.updateSimulator();
    }

    setupFinalDoor() {
        this.currentPuzzle = 'door';
        this.doorUnlocked = false;
    }

    // Puzzle Logic Methods
    showCablePuzzle() {
        const puzzleInterface = document.getElementById('puzzle-interface');
        const puzzleContent = document.getElementById('puzzle-content');
        
        puzzleContent.innerHTML = `
            <div class="cable-puzzle">
                <h3>Perbaiki Rangkaian Listrik</h3>
                <div class="cable-components">
                    <div class="cable-component" data-component="battery+">🔋+</div>
                    <div class="cable-component" data-component="switch">🔌</div>
                    <div class="cable-component" data-component="lamp">💡</div>
                    <div class="cable-component" data-component="battery-">🔋-</div>
                </div>
                <div class="cable-lines">
                    <div class="cable-line" id="line-1"></div>
                    <div class="cable-line" id="line-2"></div>
                    <div class="cable-line" id="line-3"></div>
                </div>
                <p>Hubungkan komponen dalam urutan yang benar: Baterai (+) → Saklar → Lampu → Baterai (-)</p>
            </div>
        `;
        
        puzzleInterface.classList.remove('hidden');
        this.setupCablePuzzleEvents();
    }

    setupCablePuzzleEvents() {
        const components = document.querySelectorAll('.cable-component');
        components.forEach(component => {
            component.addEventListener('click', () => {
                this.handleCableComponentClick(component);
            });
        });
    }

    handleCableComponentClick(component) {
        const componentType = component.dataset.component;
        
        if (this.cableConnections.length === 0 && componentType === 'battery+') {
            this.cableConnections.push(componentType);
            component.classList.add('connected');
            this.drawCableLine(0, component);
            this.audioManager.playElectric();
        } else if (this.cableConnections.length === 1 && componentType === 'switch') {
            this.cableConnections.push(componentType);
            component.classList.add('connected');
            this.drawCableLine(1, component);
            this.audioManager.playElectric();
        } else if (this.cableConnections.length === 2 && componentType === 'lamp') {
            this.cableConnections.push(componentType);
            component.classList.add('connected');
            this.drawCableLine(2, component);
            this.audioManager.playElectric();
        } else if (this.cableConnections.length === 3 && componentType === 'battery-') {
            this.cableConnections.push(componentType);
            component.classList.add('connected');
            this.drawCableLine(3, component);
            this.audioManager.playElectric();
            this.checkCablePuzzle();
        }
    }

    drawCableLine(index, component) {
        const line = document.getElementById(`line-${index + 1}`);
        if (line) {
            line.classList.add('active');
        }
    }

    checkCablePuzzle() {
        const correctSequence = ['battery+', 'switch', 'lamp', 'battery-'];
        const isCorrect = this.cableConnections.every((connection, index) => 
            connection === correctSequence[index]
        );

        if (isCorrect) {
            this.audioManager.playSuccess();
            this.showFeedback('Rangkaian listrik berhasil diperbaiki! Listrik mengalir dalam rangkaian tertutup.', 'success');
            this.collectEnergyKey(0);
            setTimeout(() => {
                this.hidePuzzleInterface();
                this.level1Completed = true;
            }, 2000);
        } else {
            this.audioManager.playError();
            this.showFeedback('Rangkaian terbuka atau salah sambung. Arus tidak mengalir.', 'error');
            this.resetCablePuzzle();
        }
    }

    resetCablePuzzle() {
        this.cableConnections = [];
        document.querySelectorAll('.cable-component').forEach(component => {
            component.classList.remove('connected');
        });
        document.querySelectorAll('.cable-line').forEach(line => {
            line.classList.remove('active');
        });
    }

    showEfficiencyPuzzle() {
        const puzzleInterface = document.getElementById('puzzle-interface');
        const puzzleContent = document.getElementById('puzzle-content');
        
        puzzleContent.innerHTML = `
            <div class="efficiency-puzzle">
                <h3>Kelola Efisiensi Energi</h3>
                <div class="appliances">
                    <div class="appliance-item">
                        <span>Lampu:</span>
                        <button class="appliance-btn" data-appliance="light">${this.appliances.light.on ? 'ON' : 'OFF'}</button>
                    </div>
                    <div class="appliance-item">
                        <span>Kulkas:</span>
                        <button class="appliance-btn" data-appliance="fridge">${this.appliances.fridge.on ? 'ON' : 'OFF'}</button>
                    </div>
                    <div class="appliance-item">
                        <span>Kipas:</span>
                        <button class="appliance-btn" data-appliance="fan">${this.appliances.fan.on ? 'ON' : 'OFF'}</button>
                    </div>
                    <div class="appliance-item">
                        <span>Rice Cooker:</span>
                        <button class="appliance-btn" data-appliance="riceCooker">${this.appliances.riceCooker.on ? 'ON' : 'OFF'}</button>
                    </div>
                </div>
                <p>Atur peralatan agar Power Meter tetap hijau (efisien)</p>
            </div>
        `;
        
        puzzleInterface.classList.remove('hidden');
        this.setupEfficiencyPuzzleEvents();
    }

    setupEfficiencyPuzzleEvents() {
        const buttons = document.querySelectorAll('.appliance-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const appliance = button.dataset.appliance;
                this.toggleAppliance(appliance);
                button.textContent = this.appliances[appliance].on ? 'ON' : 'OFF';
                this.updatePowerMeter();
                this.checkEfficiencyPuzzle();
            });
        });
    }

    toggleAppliance(appliance) {
        this.appliances[appliance].on = !this.appliances[appliance].on;
    }

    updatePowerMeter() {
        const totalConsumption = Object.values(this.appliances)
            .filter(appliance => appliance.on)
            .reduce((sum, appliance) => sum + appliance.consumption, 0);

        let meterClass = 'efficient';
        let meterText = 'Efisien';
        
        if (totalConsumption > 200) {
            meterClass = 'danger';
            meterText = 'Boros';
        } else if (totalConsumption > 100) {
            meterClass = 'warning';
            meterText = 'Sedang';
        }

        const meterFill = document.getElementById('meter-fill');
        const meterTextElement = document.getElementById('meter-text');
        
        meterFill.className = `meter-fill ${meterClass}`;
        meterTextElement.textContent = meterText;
        
        this.gameData.powerMeter = totalConsumption;
    }

    checkEfficiencyPuzzle() {
        const totalConsumption = Object.values(this.appliances)
            .filter(appliance => appliance.on)
            .reduce((sum, appliance) => sum + appliance.consumption, 0);

        if (totalConsumption <= 100) {
            this.audioManager.playSuccess();
            this.showFeedback('Efisiensi energi tercapai! Menutup kulkas dengan cepat menghemat energi.', 'success');
            this.collectEnergyKey(1);
            setTimeout(() => {
                this.hidePuzzleInterface();
                this.level2Completed = true;
            }, 2000);
        }
    }

    showEnergySimulator() {
        const puzzleInterface = document.getElementById('puzzle-interface');
        const puzzleContent = document.getElementById('puzzle-content');
        
        puzzleContent.innerHTML = `
            <div class="energy-simulator">
                <h3>Simulator Tagihan Listrik</h3>
                <div class="simulator-appliances">
                    ${Object.entries(this.simulatorAppliances).map(([name, appliance]) => `
                        <div class="simulator-item">
                            <span>${this.getApplianceName(name)}:</span>
                            <button class="simulator-btn" data-appliance="${name}">${appliance.on ? 'ON' : 'OFF'}</button>
                            <input type="number" class="hours-input" data-appliance="${name}" value="${appliance.hours}" min="0" max="24">
                            <span>jam/hari</span>
                        </div>
                    `).join('')}
                </div>
                <div class="bill-display">
                    <h4>Estimasi Tagihan Bulanan: Rp <span id="bill-amount">0</span></h4>
                    <p>Target: ≤ Rp 300,000</p>
                </div>
            </div>
        `;
        
        puzzleInterface.classList.remove('hidden');
        this.setupSimulatorEvents();
        this.updateSimulator();
    }

    getApplianceName(name) {
        const names = {
            light: 'Lampu',
            ac: 'AC',
            tv: 'TV',
            fridge: 'Kulkas',
            computer: 'Komputer'
        };
        return names[name] || name;
    }

    setupSimulatorEvents() {
        const buttons = document.querySelectorAll('.simulator-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const appliance = button.dataset.appliance;
                this.toggleSimulatorAppliance(appliance);
                button.textContent = this.simulatorAppliances[appliance].on ? 'ON' : 'OFF';
                this.updateSimulator();
                this.checkSimulatorPuzzle();
            });
        });

        const inputs = document.querySelectorAll('.hours-input');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                const appliance = input.dataset.appliance;
                this.simulatorAppliances[appliance].hours = parseInt(input.value) || 0;
                this.updateSimulator();
                this.checkSimulatorPuzzle();
            });
        });
    }

    toggleSimulatorAppliance(appliance) {
        this.simulatorAppliances[appliance].on = !this.simulatorAppliances[appliance].on;
    }

    updateSimulator() {
        let totalEnergy = 0;
        
        Object.entries(this.simulatorAppliances).forEach(([name, appliance]) => {
            if (appliance.on) {
                const dailyEnergy = (appliance.consumption * appliance.hours) / 1000; // kWh
                const monthlyEnergy = dailyEnergy * 30; // kWh per month
                totalEnergy += monthlyEnergy;
            }
        });

        const billAmount = totalEnergy * 1500; // Rp 1,500 per kWh
        document.getElementById('bill-amount').textContent = Math.round(billAmount).toLocaleString();
        
        const billDisplay = document.querySelector('.bill-display');
        if (billAmount <= this.targetBill) {
            billDisplay.style.color = '#4ecdc4';
        } else {
            billDisplay.style.color = '#ff6b6b';
        }
    }

    checkSimulatorPuzzle() {
        let totalEnergy = 0;
        
        Object.entries(this.simulatorAppliances).forEach(([name, appliance]) => {
            if (appliance.on) {
                const dailyEnergy = (appliance.consumption * appliance.hours) / 1000;
                const monthlyEnergy = dailyEnergy * 30;
                totalEnergy += monthlyEnergy;
            }
        });

        const billAmount = totalEnergy * 1500;
        
        if (billAmount <= this.targetBill) {
            this.audioManager.playSuccess();
            this.showFeedback('Tagihan listrik efisien tercapai! Blueprint alat rahasia ilmuwan ditemukan.', 'success');
            this.collectEnergyKey(2);
            setTimeout(() => {
                this.hidePuzzleInterface();
                this.level3Completed = true;
            }, 2000);
        }
    }

    setupFinalDoor() {
        // Check if all energy keys are collected
        const allKeysCollected = this.gameData.energyKeys.every(key => key);
        
        if (allKeysCollected) {
            this.doorUnlocked = true;
            this.audioManager.playDoorOpen();
            this.showFeedback('Semua Kunci Energi telah dikumpulkan! Pintu rahasia terbuka.', 'success');
            setTimeout(() => {
                this.startQuiz();
            }, 2000);
        } else {
            this.audioManager.playError();
            this.showFeedback('Kumpulkan semua Kunci Energi terlebih dahulu!', 'error');
        }
    }

    // Quiz System with Fisher-Yates Shuffle
    startQuiz() {
        this.setupQuizQuestions();
        this.shuffledQuestions = FisherYatesShuffle.shuffle(this.gameData.quizQuestions);
        this.currentQuizIndex = 0;
        this.quizScore = 0;
        
        this.showQuizInterface();
        this.displayCurrentQuestion();
    }

    setupQuizQuestions() {
        this.gameData.quizQuestions = [
            {
                question: "Apa yang terjadi jika rangkaian listrik terbuka?",
                options: ["Arus mengalir", "Arus tidak mengalir", "Tegangan naik", "Daya bertambah"],
                correct: 1
            },
            {
                question: "Fungsi saklar dalam rangkaian listrik adalah...",
                options: ["Meningkatkan tegangan", "Memutus dan menghubungkan arus", "Mengubah arus AC ke DC", "Menyimpan energi"],
                correct: 1
            },
            {
                question: "Satuan daya listrik adalah...",
                options: ["Volt", "Ampere", "Watt", "Ohm"],
                correct: 2
            },
            {
                question: "Cara menghemat energi di rumah adalah...",
                options: ["Membiarkan lampu menyala terus", "Mematikan peralatan yang tidak digunakan", "Menggunakan AC 24 jam", "Membuka kulkas terus-menerus"],
                correct: 1
            },
            {
                question: "Rumus energi listrik adalah...",
                options: ["E = P × t", "E = V × I", "E = P / t", "E = V / I"],
                correct: 0
            },
            {
                question: "Kulkas yang pintunya dibiarkan terbuka akan...",
                options: ["Menghemat energi", "Memboroskan energi", "Tidak berpengaruh", "Meningkatkan efisiensi"],
                correct: 1
            },
            {
                question: "Lampu LED lebih efisien daripada lampu pijar karena...",
                options: ["Lebih terang", "Menggunakan daya lebih sedikit", "Lebih murah", "Lebih besar"],
                correct: 1
            },
            {
                question: "Tagihan listrik dihitung berdasarkan...",
                options: ["Tegangan", "Arus", "Energi yang digunakan", "Daya maksimum"],
                correct: 2
            },
            {
                question: "AC yang disetel pada suhu rendah akan...",
                options: ["Menghemat energi", "Memboroskan energi", "Tidak berpengaruh", "Meningkatkan efisiensi"],
                correct: 1
            },
            {
                question: "Standby mode pada peralatan elektronik...",
                options: ["Tidak menggunakan energi", "Masih menggunakan sedikit energi", "Menggunakan energi penuh", "Menghemat energi total"],
                correct: 1
            }
        ];
    }

    showQuizInterface() {
        const quizInterface = document.getElementById('quiz-interface');
        quizInterface.classList.remove('hidden');
    }

    displayCurrentQuestion() {
        if (this.currentQuizIndex >= this.shuffledQuestions.length) {
            this.finishQuiz();
            return;
        }

        const question = this.shuffledQuestions[this.currentQuizIndex];
        const questionElement = document.getElementById('quiz-question');
        const optionsElement = document.getElementById('quiz-options');
        const progressElement = document.getElementById('quiz-progress-text');

        questionElement.textContent = question.question;
        progressElement.textContent = `Soal ${this.currentQuizIndex + 1} dari ${this.shuffledQuestions.length}`;

        optionsElement.innerHTML = question.options.map((option, index) => `
            <div class="quiz-option" data-answer="${index}">${option}</div>
        `).join('');

        this.setupQuizEvents();
    }

    setupQuizEvents() {
        const options = document.querySelectorAll('.quiz-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                this.handleQuizAnswer(parseInt(option.dataset.answer));
            });
        });
    }

    handleQuizAnswer(selectedAnswer) {
        const question = this.shuffledQuestions[this.currentQuizIndex];
        const options = document.querySelectorAll('.quiz-option');
        
        // Highlight correct answer
        options[question.correct].classList.add('selected');
        
        if (selectedAnswer === question.correct) {
            this.quizScore++;
            this.audioManager.playSuccess();
            this.showFeedback('Jawaban benar!', 'success');
        } else {
            this.audioManager.playError();
            this.showFeedback('Jawaban salah!', 'error');
        }

        setTimeout(() => {
            this.currentQuizIndex++;
            this.displayCurrentQuestion();
        }, 2000);
    }

    finishQuiz() {
        const quizInterface = document.getElementById('quiz-interface');
        quizInterface.classList.add('hidden');
        
        const scorePercentage = (this.quizScore / this.shuffledQuestions.length) * 100;
        
        if (scorePercentage >= 70) {
            this.showFeedback(`Quiz selesai! Skor: ${this.quizScore}/${this.shuffledQuestions.length} (${Math.round(scorePercentage)}%) - Lulus!`, 'success');
            setTimeout(() => {
                this.level4Completed = true;
            }, 3000);
        } else {
            this.showFeedback(`Quiz selesai! Skor: ${this.quizScore}/${this.shuffledQuestions.length} (${Math.round(scorePercentage)}%) - Coba lagi!`, 'error');
            setTimeout(() => {
                this.startQuiz(); // Restart quiz
            }, 3000);
        }
    }

    // UI Helper Methods
    showInstructions(text) {
        const instructionElement = document.getElementById('instruction-text');
        instructionElement.textContent = text;
    }

    showFeedback(message, type) {
        const feedbackElement = document.getElementById('feedback');
        const feedbackContent = document.getElementById('feedback-content');
        
        feedbackContent.textContent = message;
        feedbackContent.className = `feedback-content ${type}`;
        feedbackElement.classList.remove('hidden');
        
        setTimeout(() => {
            feedbackElement.classList.add('hidden');
        }, 3000);
    }

    hidePuzzleInterface() {
        const puzzleInterface = document.getElementById('puzzle-interface');
        puzzleInterface.classList.add('hidden');
    }

    collectEnergyKey(keyIndex) {
        this.gameData.energyKeys[keyIndex] = true;
        const keyElement = document.getElementById(`key-${keyIndex + 1}`);
        keyElement.classList.add('collected');
        this.audioManager.playKeyCollect();
    }

    updateGameScene() {
        if (this.renderer && this.scene && this.camera) {
            const deltaTime = this.clock.getDelta();
            
            // Update physics
            this.physicsWorld.update(deltaTime);
            
            // Update animations
            this.updateAnimations(deltaTime);
            
            // Update particle systems
            this.updateParticleSystems(deltaTime);
            
            // Update dynamic lighting
            this.updateDynamicLighting(deltaTime);
            
            // Update camera controls
            if (this.controls) {
                this.controls.update();
            }
            
            // Update dragged objects
            this.updateDraggedObjects();
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
        }
    }

    updateAnimations(deltaTime) {
        this.animations.forEach((animation, uuid) => {
            const elapsed = this.clock.getElapsedTime() - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1);
            
            switch (animation.type) {
                case 'pulse':
                    const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.1;
                    animation.object.scale.setScalar(scale);
                    break;
                    
                case 'toggle':
                    const rotation = progress * Math.PI;
                    animation.object.rotation.y = rotation;
                    break;
                    
                case 'open':
                    const openProgress = Math.sin(progress * Math.PI / 2);
                    animation.object.rotation.y = openProgress * Math.PI / 2;
                    break;
            }
            
            if (progress >= 1) {
                this.animations.delete(uuid);
            }
        });
    }

    updateParticleSystems(deltaTime) {
        this.particleSystems.forEach((particles, name) => {
            if (particles.visible) {
                // Animate particles
                const positions = particles.geometry.attributes.position.array;
                const colors = particles.geometry.attributes.color.array;
                
                for (let i = 0; i < positions.length; i += 3) {
                    // Add some movement to particles
                    positions[i] += (Math.random() - 0.5) * 0.01;
                    positions[i + 1] += (Math.random() - 0.5) * 0.01;
                    positions[i + 2] += (Math.random() - 0.5) * 0.01;
                }
                
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    updateDynamicLighting(deltaTime) {
        this.dynamicLights.forEach((light, name) => {
            if (light.userData.isDynamic) {
                // Add subtle pulsing to lights
                const intensity = 1 + Math.sin(this.clock.getElapsedTime() * 2) * 0.2;
                light.intensity = intensity;
                
                // Update light position based on connected objects
                if (name === 'lamp' && this.cableComponents && this.cableComponents.lamp) {
                    const lamp = this.cableComponents.lamp;
                    light.position.copy(lamp.position);
                    light.position.y += 0.5;
                    
                    // Update lamp material based on connection
                    if (lamp.userData.isOn) {
                        lamp.material.emissiveIntensity = 0.5;
                        lamp.material.emissive.setHex(0xffff00);
                    } else {
                        lamp.material.emissiveIntensity = 0;
                        lamp.material.emissive.setHex(0x000000);
                    }
                }
            }
        });
    }

    updateDraggedObjects() {
        if (this.draggedObject) {
            const interactiveData = this.getInteractiveData(this.draggedObject);
            
            if (interactiveData && interactiveData.type === 'slider') {
                // Handle slider dragging
                this.updateSliderPosition(this.draggedObject, interactiveData);
            } else {
                // Handle regular object dragging
                const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
                vector.unproject(this.camera);
                
                const dir = vector.sub(this.camera.position).normalize();
                const distance = -this.camera.position.z / dir.z;
                const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
                
                this.draggedObject.position.copy(pos);
            }
            
            // Show drag effect
            this.showParticleEffect(this.draggedObject.position, 'electric');
        }
    }

    updateSliderPosition(slider, data) {
        const track = slider.userData.track;
        const mouseX = (this.mouse.x + 1) / 2; // Convert from -1,1 to 0,1
        
        const trackStart = track.position.x - 0.15;
        const trackEnd = track.position.x + 0.15;
        const newX = trackStart + (trackEnd - trackStart) * mouseX;
        
        slider.position.x = Math.max(trackStart, Math.min(trackEnd, newX));
        
        // Update value (0-1)
        data.value = (slider.position.x - trackStart) / (trackEnd - trackStart);
        
        // Update simulator in real-time
        this.updateSimulatorFromSliders();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.fsm.update();
    }

    // Modal Management
    showSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
    }

    hideSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    showAbout() {
        document.getElementById('about-modal').classList.remove('hidden');
    }

    hideAbout() {
        document.getElementById('about-modal').classList.add('hidden');
    }

    // Game Save/Load
    saveGame() {
        const saveData = {
            energyKeys: this.gameData.energyKeys,
            currentLevel: this.gameData.currentLevel,
            powerMeter: this.gameData.powerMeter
        };
        localStorage.setItem('energyQuestSave', JSON.stringify(saveData));
    }

    loadGame() {
        const saveData = localStorage.getItem('energyQuestSave');
        if (saveData) {
            const data = JSON.parse(saveData);
            this.gameData.energyKeys = data.energyKeys;
            this.gameData.currentLevel = data.currentLevel;
            this.gameData.powerMeter = data.powerMeter;
            
            // Update UI
            this.gameData.energyKeys.forEach((collected, index) => {
                if (collected) {
                    const keyElement = document.getElementById(`key-${index + 1}`);
                    keyElement.classList.add('collected');
                }
            });
            
            this.startGameClicked = true;
        } else {
            this.showFeedback('Tidak ada data penyimpanan ditemukan!', 'error');
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new EnergyQuestGame();
    
    // Add click handlers for level interactions
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('cable-component') || 
            event.target.classList.contains('appliance-btn') ||
            event.target.classList.contains('simulator-btn')) {
            // Handle puzzle interactions
            return;
        }
        
        // Handle level progression
        if (game.fsm.currentState === GameState.LEVEL_1 && !game.currentPuzzle) {
            game.showCablePuzzle();
        } else if (game.fsm.currentState === GameState.LEVEL_2 && !game.currentPuzzle) {
            game.showEfficiencyPuzzle();
        } else if (game.fsm.currentState === GameState.LEVEL_3 && !game.currentPuzzle) {
            game.showEnergySimulator();
        } else if (game.fsm.currentState === GameState.LEVEL_4 && !game.currentPuzzle) {
            game.setupFinalDoor();
        }
    });
});