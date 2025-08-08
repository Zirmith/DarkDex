class AudioManager {
    constructor() {
        this.sounds = {
            lugiaCry: null,
            completionSound: null
        };
        this.isEnabled = true;
        this.volume = 0.7;
        this.initializeSounds();
    }

    initializeSounds() {
        try {
            // Lugia's cry from PokéAPI
            this.sounds.lugiaCry = new Audio('https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/249.ogg');
            this.sounds.lugiaCry.volume = this.volume;
            this.sounds.lugiaCry.preload = 'auto';

            // Completion sound (using a different Pokemon cry for completion)
            this.sounds.completionSound = new Audio('https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/150.ogg'); // Mewtwo
            this.sounds.completionSound.volume = this.volume * 0.8;
            this.sounds.completionSound.preload = 'auto';

            // Fallback to web audio if Pokemon cries don't work
            this.sounds.lugiaCry.onerror = () => {
                console.warn('Lugia cry failed to load, using fallback');
                this.createFallbackSound('lugiaCry', [440, 330, 220], 1500);
            };

            this.sounds.completionSound.onerror = () => {
                console.warn('Completion sound failed to load, using fallback');
                this.createFallbackSound('completionSound', [523, 659, 784], 800);
            };

        } catch (error) {
            console.error('Error initializing audio:', error);
            this.createFallbackSounds();
        }
    }

    createFallbackSound(soundName, frequencies, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.sounds[soundName] = {
                play: () => {
                    if (!this.isEnabled) return;
                    
                    const gainNode = audioContext.createGain();
                    gainNode.connect(audioContext.destination);
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, audioContext.currentTime + 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

                    frequencies.forEach((freq, index) => {
                        const oscillator = audioContext.createOscillator();
                        oscillator.connect(gainNode);
                        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                        oscillator.type = 'sine';
                        
                        const startTime = audioContext.currentTime + (index * duration / frequencies.length / 1000);
                        const endTime = startTime + (duration / frequencies.length / 1000);
                        
                        oscillator.start(startTime);
                        oscillator.stop(endTime);
                    });
                }
            };
        } catch (error) {
            console.error('Error creating fallback sound:', error);
            this.sounds[soundName] = { play: () => {} }; // Silent fallback
        }
    }

    createFallbackSounds() {
        this.createFallbackSound('lugiaCry', [440, 330, 220, 165], 1500);
        this.createFallbackSound('completionSound', [523, 659, 784, 1047], 800);
    }

    async playLugiaCry() {
        if (!this.isEnabled) return;
        
        try {
            if (this.sounds.lugiaCry && typeof this.sounds.lugiaCry.play === 'function') {
                await this.sounds.lugiaCry.play();
            }
        } catch (error) {
            console.warn('Could not play Lugia cry:', error);
        }
    }

    async playCompletionSound() {
        if (!this.isEnabled) return;
        
        try {
            if (this.sounds.completionSound && typeof this.sounds.completionSound.play === 'function') {
                await this.sounds.completionSound.play();
            }
        } catch (error) {
            console.warn('Could not play completion sound:', error);
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            if (sound && sound.volume !== undefined) {
                sound.volume = this.volume;
            }
        });
    }

    toggleSound() {
        this.isEnabled = !this.isEnabled;
        return this.isEnabled;
    }

    preloadSounds() {
        // Attempt to preload sounds
        Object.values(this.sounds).forEach(sound => {
            if (sound && sound.load) {
                try {
                    sound.load();
                } catch (error) {
                    console.warn('Could not preload sound:', error);
                }
            }
        });
    }
}

// Initialize audio manager
window.audioManager = new AudioManager();