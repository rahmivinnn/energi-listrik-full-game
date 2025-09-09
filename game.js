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
    }

    setupAudio() {
        // Audio is handled by AudioManager class
        this.audioManager.playBackgroundMusic();
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
        
        // Add room model
        const roomModel = this.assets.get('ruangan');
        if (roomModel) {
            const room = roomModel.scene.clone();
            room.scale.set(1.5, 1.5, 1.5);
            room.position.set(0, -1, 0);
            this.scene.add(room);
        }

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x4ecdc4, 0.6);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        this.camera.position.set(0, 3, 8);
        this.camera.lookAt(0, 0, 0);

        this.setupCablePuzzle();
    }

    setupLevel2Scene() {
        this.scene.clear();
        
        // Add kitchen model
        const kitchenModel = this.assets.get('dapur');
        if (kitchenModel) {
            const kitchen = kitchenModel.scene.clone();
            kitchen.scale.set(1.2, 1.2, 1.2);
            kitchen.position.set(0, -1, 0);
            this.scene.add(kitchen);
        }

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x4ecdc4, 0.7);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        this.camera.position.set(0, 3, 8);
        this.camera.lookAt(0, 0, 0);

        this.setupEfficiencyPuzzle();
    }

    setupLevel3Scene() {
        this.scene.clear();
        
        // Add laboratory model
        const labModel = this.assets.get('laboratory');
        if (labModel) {
            const lab = labModel.scene.clone();
            lab.scale.set(1.3, 1.3, 1.3);
            lab.position.set(0, -1, 0);
            this.scene.add(lab);
        }

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x4ecdc4, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        this.camera.position.set(0, 3, 8);
        this.camera.lookAt(0, 0, 0);

        this.setupEnergySimulator();
    }

    setupLevel4Scene() {
        this.scene.clear();
        
        // Add basement model
        const basementModel = this.assets.get('ruang bawah tanah');
        if (basementModel) {
            const basement = basementModel.scene.clone();
            basement.scale.set(1.4, 1.4, 1.4);
            basement.position.set(0, -1, 0);
            this.scene.add(basement);
        }

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x4ecdc4, 0.9);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        this.camera.position.set(0, 3, 8);
        this.camera.lookAt(0, 0, 0);

        this.setupFinalDoor();
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
            this.renderer.render(this.scene, this.camera);
        }
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