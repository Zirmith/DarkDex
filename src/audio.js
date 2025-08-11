class AudioManager {
    constructor() {
        this.sounds = {
            lugiaCry: null,
            completionSound: null
        };
        this.isEnabled = true;
        this.volume = 0.7;
        this.audioCache = new Map();
        this.initializeSounds();
    }

    initializeSounds() {
        try {
            // Initialize sounds with caching
            this.initializeSound('lugiaCry', 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/249.ogg', 'lugia_cry.ogg', this.volume);
            this.initializeSound('completionSound', 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/150.ogg', 'completion_sound.ogg', this.volume * 0.8);

        } catch (error) {
            console.error('Error initializing audio:', error);
            this.createFallbackSounds();
        }
    }

    async initializeSound(soundName, url, filename, volume) {
        try {
            // Check if audio is cached locally first
            if (typeof window !== 'undefined' && window.electronAPI) {
                const cachedAudio = await window.electronAPI.invoke('get-audio-path', filename);
                if (cachedAudio.success) {
                    this.sounds[soundName] = new Audio(cachedAudio.path);
                    this.sounds[soundName].volume = volume;
                    this.sounds[soundName].preload = 'auto';
                    console.log(`Loaded cached audio: ${soundName}`);
                    return;
                }
            }

            // If not cached, load from URL and cache it
            this.sounds[soundName] = new Audio(url);
            this.sounds[soundName].volume = volume;
            this.sounds[soundName].preload = 'auto';

            // Cache the audio file when it loads successfully
            this.sounds[soundName].addEventListener('canplaythrough', async () => {
                if (typeof window !== 'undefined' && window.electronAPI) {
                    try {
                        await window.electronAPI.invoke('download-audio', url, filename);
                        console.log(`Cached audio: ${soundName}`);
                    } catch (error) {
                        console.warn(`Failed to cache audio ${soundName}:`, error);
                    }
                }
            });

            // Fallback to web audio if loading fails
            this.sounds[soundName].onerror = () => {
                console.warn(`${soundName} failed to load, using fallback`);
                if (soundName === 'lugiaCry') {
                    this.createFallbackSound('lugiaCry', [440, 330, 220], 1500);
                } else if (soundName === 'completionSound') {
                    this.createFallbackSound('completionSound', [523, 659, 784], 800);
                }
            };

        } catch (error) {
            console.error(`Error initializing sound ${soundName}:`, error);
            this.createFallbackSound(soundName, [440, 330, 220], 1000);
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

    async clearAudioCache() {
        if (typeof window !== 'undefined' && window.electronAPI) {
            try {
                await window.electronAPI.invoke('clear-cache', 'audio');
                console.log('Audio cache cleared');
                // Reinitialize sounds after clearing cache
                this.initializeSounds();
            } catch (error) {
                console.error('Error clearing audio cache:', error);
            }
        }
    }

    async getCacheStats() {
        if (typeof window !== 'undefined' && window.electronAPI) {
            try {
                const result = await window.electronAPI.invoke('get-cache-stats');
                if (result.success) {
                    return result.stats.audio;
                }
            } catch (error) {
                console.error('Error getting audio cache stats:', error);
            }
        }
        return { size: 0, files: 0 };
    }
}

// Initialize audio manager
window.audioManager = new AudioManager();