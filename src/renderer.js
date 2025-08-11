// Main application logic
class DarkDexApp {
    constructor() {
        this.isInitialized = false;
        this.splashShown = false;
        this.loadingProgress = 0;
        this.totalSteps = 4;
        this.pokemonLoadProgress = 0;
        this.totalPokemon = 1010;
        this.allPokemonData = [];
        this.init();
    }

    async init() {
        try {
            console.log('Initializing DarkDex...');
            
            // Show splash screen and start loading
            this.showSplashScreen();
            
            // Play Lugia's cry on startup
            setTimeout(() => {
                window.audioManager.playLugiaCry();
            }, 1000);
            
            // Setup window controls
            this.setupWindowControls();
            
            // Step 1: Check connection
            this.updateLoadingStep('step-connection', 'loading');
            this.updateLoadingStatus('Establishing Shadow Connection...');
            await window.pokemonAPI.checkConnection();
            this.updateLoadingStep('step-connection', 'complete');
            this.updateProgress(5);
            
            // Step 2: Load Pokemon data with detailed progress
            this.updateLoadingStep('step-pokemon', 'loading');
            this.updateLoadingStatus('Summoning Shadow Pokémon...');
            await this.loadPokemonDataWithProgress();
            this.updateLoadingStep('step-pokemon', 'complete');
            this.updateProgress(75);
            
            // Step 3: Prepare sprites
            this.updateLoadingStep('step-sprites', 'loading');
            this.updateLoadingStatus('Materializing Shadow Forms...');
            
            // Cache splash sprite first
            await window.spriteManager.cacheSplashSprite();
            
            // Update splash screen with cached sprite
            this.updateSplashSprite();
            
            await this.preloadInitialSprites();
            this.updateLoadingStep('step-sprites', 'complete');
            this.updateProgress(95);
            
            // Step 4: Finalize
            this.updateLoadingStep('step-complete', 'loading');
            this.updateLoadingStatus('Shadow Database Ready!');
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.updateLoadingStep('step-complete', 'complete');
            this.updateProgress(100);
            
            // Play completion sound
            window.audioManager.playCompletionSound();
            
            // Wait a moment then hide splash
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.hideSplashScreen();
            
            // Show main interface
            this.showMainInterface();
            
            this.isInitialized = true;
            console.log('DarkDex initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize DarkDex:', error);
            this.showLoadingError(error.message);
        }
    }

    showSplashScreen() {
        const splashScreen = document.getElementById('splash-screen');
        const mainContainer = document.getElementById('main-container');
        
        if (!splashScreen) return;

        // Ensure main container is hidden
        if (mainContainer) {
            mainContainer.style.display = 'none';
        }

        // Show splash screen
        splashScreen.style.display = 'flex';
        
        // Create particles dynamically
        this.createSplashParticles();
    }

    async hideSplashScreen() {
        return new Promise((resolve) => {
            const splashScreen = document.getElementById('splash-screen');
            if (!splashScreen) {
                resolve();
                return;
            }
            
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                splashScreen.style.display = 'none';
                resolve();
            }, 1000);
        });
    }

    updateSplashSprite() {
        const splashLugia = document.querySelector('.splash-lugia');
        if (splashLugia && window.spriteManager) {
            const cachedSprite = window.spriteManager.getSplashSprite();
            if (cachedSprite) {
                splashLugia.src = cachedSprite;
            }
        }
    }
    updateLoadingStep(stepId, status) {
        const step = document.getElementById(stepId);
        if (!step) return;
        
        const statusElement = step.querySelector('.step-status');
        if (statusElement) {
            statusElement.className = `step-status ${status}`;
        }
    }

    updateLoadingStatus(text) {
        const statusText = document.getElementById('loading-status-text');
        if (statusText) {
            statusText.textContent = text;
        }
    }

    updateProgress(percentage) {
        const progressBar = document.getElementById('loading-progress');
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, percentage)}%`;
        }
    }

    showLoadingError(message) {
        this.updateLoadingStatus('Shadow Database Error');
        
        // Mark current step as error
        const steps = ['step-connection', 'step-pokemon', 'step-sprites', 'step-complete'];
        steps.forEach(stepId => {
            const step = document.getElementById(stepId);
            if (step) {
                const status = step.querySelector('.step-status');
                if (status && status.classList.contains('loading')) {
                    status.className = 'step-status error';
                }
            }
        });
        
        // Show error message
        const statusText = document.getElementById('loading-status-text');
        if (statusText) {
            statusText.innerHTML = `
                <div style="color: var(--error-color); margin-bottom: 16px;">
                    <i class="ri-error-warning-line" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
                    Connection to Shadow Realm Failed
                </div>
                <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 16px;">
                    ${message}
                </div>
                <button onclick="location.reload()" style="padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Retry Connection
                </button>
            `;
        }
    }

    createSplashParticles() {
        const particlesContainer = document.querySelector('.particles');
        if (!particlesContainer) return;

        // Create multiple floating particles
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 6 + 2}px;
                height: ${Math.random() * 6 + 2}px;
                background: var(--shadow-silver);
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: particleFloat ${Math.random() * 4 + 3}s ease-in-out infinite;
                animation-delay: ${Math.random() * 3}s;
                opacity: ${Math.random() * 0.8 + 0.2};
                box-shadow: 0 0 ${Math.random() * 10 + 5}px var(--shadow-silver);
            `;
            particlesContainer.appendChild(particle);
        }
    }

    setupWindowControls() {
        if (typeof require === 'undefined') return; // Skip if not in Electron

        const minimizeBtn = document.getElementById('minimize-btn');
        const maximizeBtn = document.getElementById('maximize-btn');
        const closeBtn = document.getElementById('close-btn');

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                window.electronAPI.invoke('window-minimize');
            });
        }

        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', async () => {
                await window.electronAPI.invoke('window-maximize');
                const isMaximized = await window.electronAPI.invoke('window-is-maximized');
                maximizeBtn.innerHTML = isMaximized ? 
                    '<i class="ri-checkbox-multiple-blank-line"></i>' : 
                    '<i class="ri-checkbox-blank-line"></i>';
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                window.electronAPI.invoke('window-close');
            });
        }
    }

    showMainInterface() {
        const mainContainer = document.getElementById('main-container');
        const loadingScreen = document.getElementById('loading-screen');
        const pokemonGrid = document.getElementById('pokemon-grid');
        
        if (mainContainer) mainContainer.style.display = 'flex';
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (pokemonGrid) pokemonGrid.style.display = 'grid';
    }

    async loadPokemonDataWithProgress() {
        try {
            console.log('Loading Pokemon data with progress...');
            
            // Check for cached complete data first
            this.updateLoadingStatus('Checking Shadow Database cache...');
            const cachedPokemon = await window.pokemonAPI.getCachedAllPokemon();
            
            if (cachedPokemon && cachedPokemon.length > 0) {
                this.updateLoadingStatus(`Loading ${cachedPokemon.length} Pokémon from cache...`);
                this.updateProgress(50);
                
                // Simulate loading progress for cached data
                for (let i = 0; i < cachedPokemon.length; i += 50) {
                    const progress = 50 + ((i / cachedPokemon.length) * 25); // 50% to 75%
                    this.updateProgress(progress);
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                
                this.allPokemonData = cachedPokemon;
                window.searchManager.setPokemonData(cachedPokemon);
                this.updateLoadingStatus(`Loaded ${cachedPokemon.length} Pokémon from cache!`);
                return;
            }
            
            // If no cache or incomplete cache, try to fetch from API
            this.updateLoadingStatus('No cache found, fetching from Shadow Realm...');
            
            try {
                // Get the Pokemon list first
                this.updateLoadingStatus('Fetching Pokémon registry...');
                const pokemonList = await window.pokemonAPI.getPokemonList(this.totalPokemon, 0);
                
                if (!pokemonList) {
                    throw new Error('Could not fetch Pokemon list - check internet connection');
                }
                
                this.updateProgress(10);
                
                const detailedPokemon = [];

                // Process in batches with detailed progress updates
                const batchSize = 15;
                let processed = 0;

                for (let i = 0; i < pokemonList.results.length; i += batchSize) {
                    const batch = pokemonList.results.slice(i, i + batchSize);
                    
                    const batchPromises = batch.map(async (pokemon, index) => {
                        try {
                            const currentIndex = i + index + 1;
                            const pokemonName = pokemon.name;
                            
                            // Check if data is cached
                            const isFromCache = window.pokemonAPI.cache.has(`pokemon_${pokemonName}`) || 
                                              await this.checkIfCached(`pokemon_${pokemonName}`);
                            
                            const cacheStatus = isFromCache ? '[CACHED]' : '[DOWNLOADING]';
                            this.updateLoadingStatus(
                                `Loading ${pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)} (#${currentIndex}/${this.totalPokemon}) ${cacheStatus}`
                            );

                            // Load complete Pokemon data
                            const completeData = await window.pokemonAPI.getCompletePokemonData(pokemonName);
                            
                            processed++;
                            const progress = 10 + (processed / this.totalPokemon) * 65; // 10% to 75%
                            this.updateProgress(progress);
                            
                            return completeData;
                        } catch (error) {
                            console.error(`Error fetching ${pokemon.name}:`, error);
                            processed++;
                            const progress = 10 + (processed / this.totalPokemon) * 65;
                            this.updateProgress(progress);
                            return null;
                        }
                    });

                    const batchResults = await Promise.all(batchPromises);
                    detailedPokemon.push(...batchResults.filter(p => p !== null));

                    // Small delay between batches to show progress and prevent overwhelming
                    if (i + batchSize < pokemonList.results.length) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }

                // Store all Pokemon data
                this.allPokemonData = detailedPokemon;
                
                // Initialize search manager with all Pokemon
                window.searchManager.setPokemonData(detailedPokemon);
                
                this.updateLoadingStatus(`Loaded ${detailedPokemon.length} Pokémon successfully!`);
                
            } catch (error) {
                console.error('Error loading Pokemon data from API:', error);
                
                // Try to load any partial cached data as fallback
                this.updateLoadingStatus('API failed, checking for partial cache...');
                const partialCache = await this.loadPartialCachedData();
                
                if (partialCache && partialCache.length > 0) {
                    this.allPokemonData = partialCache;
                    window.searchManager.setPokemonData(partialCache);
                    this.updateLoadingStatus(`Loaded ${partialCache.length} Pokémon from partial cache`);
                } else {
                    throw new Error('No internet connection and no cached data available');
                }
            }
            
        } catch (error) {
            console.error('Error loading Pokemon data:', error);
            throw error;
        }
    }

    async loadPartialCachedData() {
        try {
            const cachedPokemon = [];
            
            // Try to load individual cached Pokemon - more comprehensive search
            for (let i = 1; i <= 2000; i++) {
                try {
                    const cached = await window.pokemonAPI.fetchData(null, `complete_pokemon_${i}`);
                    if (cached) {
                        cachedPokemon.push(cached);
                    }
                } catch (error) {
                    // Skip missing cache entries
                    continue;
                }
                
                // Update loading status periodically
                if (i % 100 === 0) {
                    this.updateLoadingStatus(`Checking cache... found ${cachedPokemon.length} Pokemon so far`);
                }
                
                // Break if we haven't found any Pokemon in the last 200 IDs
                if (i > 300 && cachedPokemon.length === 0) {
                    break;
                }
            }
            
            console.log(`Loaded ${cachedPokemon.length} Pokemon from partial cache`);
            return cachedPokemon;
        } catch (error) {
            console.error('Error loading partial cached data:', error);
            return [];
        }
    }

    async checkIfCached(key) {
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                const result = await window.electronAPI.invoke('get-cached-data', window.pokemonAPI.sanitizeKey(key));
                return result.success;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    async preloadInitialSprites() {
        if (!window.spriteManager || !window.searchManager.filteredPokemon) return;
        
        const pokemonToPreload = window.searchManager.filteredPokemon.slice(0, 100);
        let preloaded = 0;
        
        for (const pokemon of pokemonToPreload) {
            try {
                const pokemonName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
                this.updateLoadingStatus(`Caching sprite for ${pokemonName}... (${preloaded + 1}/${pokemonToPreload.length})`);
                
                // Load both regular and shiny sprites
                await window.spriteManager.loadSprite(pokemon, { useShowdown: true });
                await window.spriteManager.loadSprite(pokemon, { useShowdown: true, shiny: true });
                
                preloaded++;
                
                const progress = 75 + (preloaded / pokemonToPreload.length) * 20; // 75% to 95%
                this.updateProgress(progress);
                
                // Small delay to show progress
                if (preloaded % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            } catch (error) {
                console.error(`Error preloading sprite for ${pokemon.name}:`, error);
                preloaded++;
            }
        }
        
        this.updateLoadingStatus(`Cached ${preloaded} sprites successfully!`);
    }

    // Public methods for external use
    async refreshData() {
        this.updateLoadingStatus('Refreshing Shadow Database...');
        await this.loadPokemonDataWithProgress();
    }

    async clearCache(type = 'all') {
        try {
            switch (type) {
                case 'data':
                    if (window.pokemonAPI) {
                        await window.pokemonAPI.clearDataCache();
                    }
                    break;
                case 'sprites':
                    if (window.spriteManager) {
                        await window.spriteManager.clearSpriteCache();
                    }
                    break;
                case 'audio':
                    if (window.audioManager) {
                        await window.audioManager.clearAudioCache();
                    }
                    break;
                case 'all':
                default:
                    if (window.pokemonAPI) {
                        await window.pokemonAPI.clearAllCache();
                    }
                    if (window.spriteManager) {
                        window.spriteManager.clearCache();
                    }
                    if (window.audioManager) {
                        window.audioManager.clearAudioCache();
                    }
                    break;
            }
            console.log(`${type} cache cleared successfully`);
        } catch (error) {
            console.error(`Error clearing ${type} cache:`, error);
        }
    }

    async getCacheStats() {
        if (window.pokemonAPI) {
            return await window.pokemonAPI.getCacheStats();
        }
        return null;
    }
    getPokemonData() {
        return this.allPokemonData;
    }
}

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Escape to clear search or close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('pokemon-modal');
        const searchInput = document.getElementById('search-input');
        
        if (modal && modal.style.display !== 'none') {
            modal.style.display = 'none';
        } else if (searchInput && document.activeElement === searchInput) {
            searchInput.blur();
        }
    }
    
    // Ctrl/Cmd + R to refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (window.darkdexApp && window.darkdexApp.isInitialized) {
            window.darkdexApp.refreshData();
        }
    }

    // Ctrl/Cmd + Shift + C to clear cache
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (window.darkdexApp && window.darkdexApp.isInitialized) {
            if (confirm('Clear all cached data? This will require re-downloading everything.')) {
                window.darkdexApp.clearCache('all');
            }
        }
    }

    // Ctrl/Cmd + Shift + S to show cache stats
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (window.darkdexApp && window.darkdexApp.isInitialized) {
            window.darkdexApp.getCacheStats().then(stats => {
                if (stats) {
                    const totalSize = window.pokemonAPI.formatBytes(stats.total.size);
                    const message = `Cache Statistics:
Data: ${stats.data.files} files (${window.pokemonAPI.formatBytes(stats.data.size)})
Sprites: ${stats.sprites.files} files (${window.pokemonAPI.formatBytes(stats.sprites.size)})
Audio: ${stats.audio.files} files (${window.pokemonAPI.formatBytes(stats.audio.size)})
Total: ${stats.total.files} files (${totalSize})

Performance:
Cache Hits: ${stats.performance.hits}
Cache Misses: ${stats.performance.misses}
Errors: ${stats.performance.errors}`;
                    alert(message);
                }
            });
        }
    }
});

// Handle connection status changes
window.addEventListener('online', () => {
    console.log('Connection restored');
    if (window.darkdexApp && window.darkdexApp.isInitialized) {
        window.darkdexApp.refreshData();
    }
});

window.addEventListener('offline', () => {
    console.log('Connection lost - switching to offline mode');
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.darkdexApp = new DarkDexApp();
});

// Prevent context menu on production
document.addEventListener('contextmenu', (e) => {
    if (!process?.env?.NODE_ENV || process.env.NODE_ENV === 'production') {
        e.preventDefault();
    }
});

// Handle drag and drop (prevent default behavior)
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());

// Export for global access
window.DarkDexApp = DarkDexApp;