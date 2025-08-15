// Sound System for Lulu's Tiny You
class SoundSystem {
    constructor() {
        this.enabled = true;
        this.sounds = {};
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.currentMusic = null;
        
        // Initialize Web Audio API context
        this.audioContext = null;
        this.initializeAudio();
        
        // Load sound preferences
        const savedPrefs = localStorage.getItem('soundPreferences');
        if (savedPrefs) {
            const prefs = JSON.parse(savedPrefs);
            this.enabled = prefs.enabled ?? true;
            this.musicVolume = prefs.musicVolume ?? 0.3;
            this.sfxVolume = prefs.sfxVolume ?? 0.5;
        }
    }
    
    initializeAudio() {
        // Initialize audio context on first user interaction
        const initContext = () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.createSounds();
            }
            document.removeEventListener('click', initContext);
            document.removeEventListener('touchstart', initContext);
        };
        
        document.addEventListener('click', initContext);
        document.addEventListener('touchstart', initContext);
    }
    
    createSounds() {
        // Create synthesized sounds using Web Audio API
        this.sounds = {
            // UI Sounds
            buttonClick: () => this.playTone(800, 0.05, 'square', 0.3),
            menuOpen: () => this.playTone(600, 0.1, 'sine', 0.4),
            menuClose: () => this.playTone(400, 0.1, 'sine', 0.4),
            
            // Pet interaction sounds
            feed: () => this.playSequence([523, 659, 784], 0.1, 'sine'),
            pet: () => this.playSequence([440, 554, 659], 0.15, 'triangle'),
            talk: () => this.playSequence([392, 523, 659, 784], 0.08, 'square', 0.2),
            
            // Happiness sounds
            happy: () => this.playSequence([523, 659, 784, 1047], 0.1, 'sine'),
            sad: () => this.playSequence([330, 294, 262], 0.2, 'triangle'),
            
            // Achievement sounds
            tokenCollect: () => this.playSequence([784, 988, 1319, 1568], 0.12, 'square', 0.4),
            levelUp: () => this.playSequence([523, 659, 784, 988, 1319], 0.15, 'sine'),
            achievement: () => this.playArpeggio([523, 659, 784, 988, 1319], 0.3),
            
            // Game sounds
            gameStart: () => this.playSequence([392, 523, 659], 0.1, 'square', 0.3),
            gameWin: () => this.playSequence([523, 659, 784, 988], 0.15, 'sine'),
            gameLose: () => this.playSequence([392, 330, 262], 0.2, 'triangle'),
            
            // Movement sounds
            step: () => this.playTone(200 + Math.random() * 100, 0.03, 'triangle', 0.2),
            
            // Special sounds
            ring: () => this.playRingSound(),
            love: () => this.playLoveSound(),
            
            // Background music (looping melodies)
            backgroundMusic: () => this.playBackgroundMusic()
        };
    }
    
    playTone(frequency, duration, type = 'sine', volume = 0.5) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        const actualVolume = volume * this.sfxVolume;
        gainNode.gain.setValueAtTime(actualVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playSequence(frequencies, noteDuration, type = 'sine', volume = 0.5) {
        if (!this.enabled || !this.audioContext) return;
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, noteDuration, type, volume);
            }, index * noteDuration * 1000);
        });
    }
    
    playArpeggio(frequencies, duration) {
        if (!this.enabled || !this.audioContext) return;
        
        const noteDuration = duration / frequencies.length;
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, duration - (index * noteDuration), 'sine', 0.3);
            }, index * noteDuration * 1000);
        });
    }
    
    playRingSound() {
        if (!this.enabled || !this.audioContext) return;
        
        // Play a special ring presentation sound
        const notes = [784, 988, 1175, 1319, 1568, 1319, 1175, 988, 784];
        this.playSequence(notes, 0.1, 'triangle', 0.4);
        
        // Add sparkle effect
        setTimeout(() => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.playTone(1568 + Math.random() * 500, 0.05, 'sine', 0.2);
                }, i * 50);
            }
        }, 900);
    }
    
    playLoveSound() {
        if (!this.enabled || !this.audioContext) return;
        
        // Play a romantic melody
        const melody = [523, 587, 659, 784, 659, 587, 523];
        this.playSequence(melody, 0.2, 'triangle', 0.3);
    }
    
    playBackgroundMusic() {
        if (!this.enabled || !this.audioContext || this.currentMusic) return;
        
        const playNote = (freq, startTime, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'triangle';
            
            const volume = 0.1 * this.musicVolume;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
            gainNode.gain.setValueAtTime(volume, startTime + duration - 0.01);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
            
            return oscillator;
        };
        
        // Simple looping melody
        const melody = [
            {note: 262, duration: 0.5}, // C
            {note: 294, duration: 0.5}, // D
            {note: 330, duration: 0.5}, // E
            {note: 262, duration: 0.5}, // C
            {note: 262, duration: 0.5}, // C
            {note: 294, duration: 0.5}, // D
            {note: 330, duration: 0.5}, // E
            {note: 262, duration: 0.5}, // C
            {note: 330, duration: 0.5}, // E
            {note: 349, duration: 0.5}, // F
            {note: 392, duration: 1.0}, // G
            {note: 330, duration: 0.5}, // E
            {note: 349, duration: 0.5}, // F
            {note: 392, duration: 1.0}, // G
        ];
        
        const playMelody = () => {
            if (!this.enabled || !this.currentMusic) return;
            
            let currentTime = this.audioContext.currentTime;
            melody.forEach(({note, duration}) => {
                playNote(note, currentTime, duration);
                currentTime += duration;
            });
            
            // Loop the melody
            setTimeout(() => playMelody(), melody.reduce((sum, n) => sum + n.duration, 0) * 1000);
        };
        
        this.currentMusic = true;
        playMelody();
    }
    
    stopBackgroundMusic() {
        this.currentMusic = false;
    }
    
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopBackgroundMusic();
        }
        this.savePreferences();
        return this.enabled;
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.savePreferences();
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.savePreferences();
    }
    
    savePreferences() {
        localStorage.setItem('soundPreferences', JSON.stringify({
            enabled: this.enabled,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume
        }));
    }
}

// Export for use in game
window.SoundSystem = SoundSystem;