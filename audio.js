// Audio System for Energy Quest Game
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.isMuted = false;
        
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    // Create procedural sound effects
    createSound(type, frequency, duration, volume = 1) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        switch (type) {
            case 'click':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                break;
                
            case 'success':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, this.audioContext.currentTime + duration);
                gainNode.gain.setValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                break;
                
            case 'error':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, this.audioContext.currentTime + duration);
                gainNode.gain.setValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                break;
                
            case 'electric':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(frequency * 1.2, this.audioContext.currentTime + duration * 0.3);
                oscillator.frequency.setValueAtTime(frequency * 0.8, this.audioContext.currentTime + duration * 0.6);
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime + duration);
                gainNode.gain.setValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                break;
                
            case 'ambient':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(volume * this.musicVolume * 0.3, this.audioContext.currentTime);
                break;
        }

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Background music using multiple oscillators
    playBackgroundMusic() {
        if (!this.audioContext || this.isMuted) return;

        // Create ambient background music
        const frequencies = [220, 277.18, 329.63, 440]; // A3, C#4, E4, A4
        const oscillators = [];

        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            
            // Create gentle volume modulation
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.1, this.audioContext.currentTime + 2);
            
            oscillator.start(this.audioContext.currentTime);
            oscillators.push({ oscillator, gainNode });
        });

        // Store for cleanup
        this.backgroundMusic = oscillators;
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.forEach(({ oscillator, gainNode }) => {
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
                oscillator.stop(this.audioContext.currentTime + 1);
            });
            this.backgroundMusic = null;
        }
    }

    // Sound effect methods
    playClick() {
        this.createSound('click', 800, 0.1);
    }

    playSuccess() {
        this.createSound('success', 523.25, 0.5); // C5
    }

    playError() {
        this.createSound('error', 200, 0.8);
    }

    playElectric() {
        this.createSound('electric', 1000, 0.3);
    }

    playKeyCollect() {
        this.createSound('success', 659.25, 0.4); // E5
    }

    playDoorOpen() {
        this.createSound('success', 440, 1.0); // A4
    }

    playAmbient() {
        this.createSound('ambient', 220, 2.0);
    }

    // Volume controls
    setMusicVolume(volume) {
        this.musicVolume = volume / 100;
    }

    setSfxVolume(volume) {
        this.sfxVolume = volume / 100;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
    }
}

// Export for use in main game
window.AudioManager = AudioManager;