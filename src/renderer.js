// Main application logic
class DarkDexApp {
    constructor() {
        this.isInitialized = false;
        this.splashShown = false;
        this.loadingProgress = 0;
        this.totalSteps = 4;
        this.pokemonLoadProgress = 0;
        this.totalPokemon = 1302;
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
            
            // Setup cache management modal
            this.setupCacheManagement();
            
            // Setup search functionality
            this.setupSearch();
            
            // Setup filters
            this.setupFilters();
            
            // Setup sprite controls
            this.setupSpriteControls();
            
            // Setup modal controls
            this.setupModalControls();
            
            // Setup failed downloads management
            this.setupFailedDownloadsManagement();
            
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

    setupModalControls() {
        // Setup Pokemon detail modal
        const modal = document.getElementById('pokemon-modal');
        const closeModalBtn = document.getElementById('close-modal');
        const cacheModal = document.getElementById('cache-modal');
        const closeCacheModalBtn = document.getElementById('close-cache-modal');
        const cacheManagementBtn = document.getElementById('cache-management');

        // Pokemon modal controls
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                if (modal) modal.style.display = 'none';
            });
        }

        // Cache modal controls
        if (closeCacheModalBtn) {
            closeCacheModalBtn.addEventListener('click', () => {
                if (cacheModal) cacheModal.style.display = 'none';
            });
        }

        if (cacheManagementBtn) {
            cacheManagementBtn.addEventListener('click', () => {
                this.showCacheManagement();
            });
        }

        // Setup tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Setup modal sprite controls
        const toggleSpriteType = document.getElementById('toggle-sprite-type');
        const toggleSpriteStyle = document.getElementById('toggle-sprite-style');
        const playCryBtn = document.getElementById('play-pokemon-cry');

        if (toggleSpriteType) {
            toggleSpriteType.addEventListener('click', () => {
                this.toggleModalSpriteType();
            });
        }

        if (toggleSpriteStyle) {
            toggleSpriteStyle.addEventListener('click', () => {
                this.toggleModalSpriteStyle();
            });
        }

        if (playCryBtn) {
            playCryBtn.addEventListener('click', () => {
                if (modal.currentPokemon) {
                    window.audioManager.playPokemonCry(modal.currentPokemon.id);
                }
            });
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        if (cacheModal) {
            cacheModal.addEventListener('click', (e) => {
                if (e.target === cacheModal) {
                    cacheModal.style.display = 'none';
                }
            });
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        const clearSearchBtn = document.getElementById('clear-search');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (window.searchManager) {
                    window.searchManager.search(e.target.value);
                }
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchInput.blur();
                }
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    if (window.searchManager) {
                        window.searchManager.search('');
                    }
                }
            });
        }
    }

    setupFilters() {
        const generationFilter = document.getElementById('generation-filter');
        const sortFilter = document.getElementById('sort-filter');
        const typeFilters = document.querySelectorAll('.type-filter');
        const clearFiltersBtn = document.getElementById('clear-filters');

        if (generationFilter) {
            generationFilter.addEventListener('change', (e) => {
                if (window.searchManager) {
                    window.searchManager.setGenerationFilter(e.target.value);
                }
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                if (window.searchManager) {
                    window.searchManager.setSortBy(e.target.value);
                }
            });
        }

        typeFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                filter.classList.toggle('active');
                const activeTypes = Array.from(document.querySelectorAll('.type-filter.active'))
                    .map(f => f.getAttribute('data-type'));
                
                if (window.searchManager) {
                    window.searchManager.setTypeFilter(activeTypes);
                }
            });
        });

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                // Clear generation filter
                if (generationFilter) generationFilter.value = '';
                
                // Clear sort filter
                if (sortFilter) sortFilter.value = 'id';
                
                // Clear type filters
                typeFilters.forEach(filter => filter.classList.remove('active'));
                
                // Clear search
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
                
                // Reset search manager
                if (window.searchManager) {
                    window.searchManager.clearAllFilters();
                }
            });
        }
    }

    setupSpriteControls() {
        // Sprite controls are already handled in sprites.js
        // This method exists for consistency and future enhancements
        console.log('Sprite controls initialized');
    }

    switchTab(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.style.display = 'none';
        });

        // Remove active class from all tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });

        // Show selected tab content
        const selectedTab = document.getElementById(`tab-${tabName}`);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }

        // Add active class to selected tab button
        const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
    }

    toggleModalSpriteType() {
        const modal = document.getElementById('pokemon-modal');
        const toggleBtn = document.getElementById('toggle-sprite-type');
        const modalSprite = document.getElementById('modal-pokemon-sprite');
        
        if (!modal.currentPokemon || !window.spriteManager) return;
        
        const isShiny = toggleBtn.textContent === 'Regular';
        toggleBtn.textContent = isShiny ? 'Shiny' : 'Regular';
        
        window.spriteManager.updateSpriteElement(modalSprite, modal.currentPokemon, {
            shiny: !isShiny,
            useShowdown: true
        });
    }

    toggleModalSpriteStyle() {
        const modal = document.getElementById('pokemon-modal');
        const toggleBtn = document.getElementById('toggle-sprite-style');
        const modalSprite = document.getElementById('modal-pokemon-sprite');
        
        if (!modal.currentPokemon || !window.spriteManager) return;
        
        const isStatic = toggleBtn.textContent === 'Static';
        toggleBtn.textContent = isStatic ? 'Animated' : 'Static';
        
        const isShiny = document.getElementById('toggle-sprite-type').textContent === 'Shiny';
        
        window.spriteManager.updateSpriteElement(modalSprite, modal.currentPokemon, {
            animated: !isStatic,
            shiny: isShiny,
            useShowdown: true
        });
    }

    setupCacheManagement() {
        const cacheBtn = document.getElementById('cache-btn');
        if (cacheBtn) {
            cacheBtn.addEventListener('click', () => {
                this.showCacheManagement();
            });
        }

        // Setup cache action buttons
        const clearDataCacheBtn = document.getElementById('clear-data-cache');
        const clearSpriteCacheBtn = document.getElementById('clear-sprite-cache');
        const clearAudioCacheBtn = document.getElementById('clear-audio-cache');
        const clearAllCacheBtn = document.getElementById('clear-all-cache');

        if (clearDataCacheBtn) {
            clearDataCacheBtn.addEventListener('click', async () => {
                if (confirm('Clear all Pokemon data cache? This will require re-downloading Pokemon data.')) {
                    await this.clearCache('data');
                    this.showCacheManagement(); // Refresh the modal
                }
            });
        }

        if (clearSpriteCacheBtn) {
            clearSpriteCacheBtn.addEventListener('click', async () => {
                if (confirm('Clear all sprite cache? This will require re-downloading sprites.')) {
                    await this.clearCache('sprites');
                    this.showCacheManagement(); // Refresh the modal
                }
            });
        }

        if (clearAudioCacheBtn) {
            clearAudioCacheBtn.addEventListener('click', async () => {
                if (confirm('Clear all audio cache? This will require re-downloading audio files.')) {
                    await this.clearCache('audio');
                    this.showCacheManagement(); // Refresh the modal
                }
            });
        }

        if (clearAllCacheBtn) {
            clearAllCacheBtn.addEventListener('click', async () => {
                if (confirm('Clear ALL cache? This will require re-downloading everything and may take a while to reload.')) {
                    await this.clearCache('all');
                    this.showCacheManagement(); // Refresh the modal
                }
            });
        }
    }

    async showCacheManagement() {
        const modal = document.getElementById('cache-modal');
        const statsContainer = document.getElementById('cache-stats');
        const actionsContainer = document.getElementById('cache-actions');
        const failedSection = document.getElementById('failed-downloads-section');
        
        if (!modal || !statsContainer) return;
        
        modal.style.display = 'flex';
        
        try {
            // Show loading
            statsContainer.innerHTML = `
                <div class="loading-spinner">
                    <i class="ri-loader-4-line"></i>
                </div>
                <p>Loading cache statistics...</p>
            `;
            
            // Get cache stats
            const stats = await window.pokemonAPI.getCacheStats();
            const failedDownloads = window.pokemonAPI.getAllFailedDownloads();
            
            if (stats) {
                // Display cache stats
                statsContainer.innerHTML = `
                    <div class="cache-overview">
                        <div class="cache-stat-card">
                            <div class="cache-stat-header">
                                <i class="ri-database-2-line"></i>
                                <h3>Total Cache</h3>
                            </div>
                            <div class="cache-stat-value">
                                <div class="size">${this.formatBytes(stats.total.size)}</div>
                                <div class="files">${stats.total.files} files</div>
                            </div>
                        </div>
                        
                        <div class="cache-breakdown">
                            <div class="cache-item">
                                <div class="cache-item-info">
                                    <i class="ri-database-line"></i>
                                    <span>Pokémon Data</span>
                                </div>
                                <div class="cache-item-stats">
                                    <div class="size">${this.formatBytes(stats.data.size)}</div>
                                    <div class="files">${stats.data.files} files</div>
                                </div>
                            </div>
                            <div class="cache-item">
                                <div class="cache-item-info">
                                    <i class="ri-image-line"></i>
                                    <span>Sprites</span>
                                </div>
                                <div class="cache-item-stats">
                                    <div class="size">${this.formatBytes(stats.sprites.size)}</div>
                                    <div class="files">${stats.sprites.files} files</div>
                                </div>
                            </div>
                            <div class="cache-item">
                                <div class="cache-item-info">
                                    <i class="ri-volume-up-line"></i>
                                    <span>Audio</span>
                                </div>
                                <div class="cache-item-stats">
                                    <div class="size">${this.formatBytes(stats.audio.size)}</div>
                                    <div class="files">${stats.audio.files} files</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="cache-performance">
                            <h4>Performance Statistics</h4>
                            <div class="performance-stats">
                                <div class="perf-stat">
                                    <span class="label">Cache Hits</span>
                                    <span class="value success">${stats.performance.hits}</span>
                                </div>
                                <div class="perf-stat">
                                    <span class="label">Cache Misses</span>
                                    <span class="value warning">${stats.performance.misses}</span>
                                </div>
                                <div class="perf-stat">
                                    <span class="label">Errors</span>
                                    <span class="value error">${stats.performance.errors}</span>
                                </div>
                                <div class="perf-stat">
                                    <span class="label">Hit Rate</span>
                                    <span class="value">${this.calculateHitRate(stats.performance)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Show actions
                if (actionsContainer) {
                    actionsContainer.style.display = 'block';
                }
                
                // Show failed downloads section if there are any
                if (failedSection && failedDownloads.total > 0) {
                    failedSection.style.display = 'block';
                    this.updateFailedDownloadsDisplay(failedDownloads);
                } else if (failedSection) {
                    failedSection.style.display = 'none';
                }
            } else {
                statsContainer.innerHTML = `
                    <div class="cache-error">
                        <i class="ri-error-warning-line"></i>
                        <p>Unable to load cache statistics</p>
                        <small>Please try again later</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading cache stats:', error);
            statsContainer.innerHTML = `
                <div class="cache-error">
                    <i class="ri-error-warning-line"></i>
                    <p>Error loading cache statistics</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }
    
    setupFailedDownloadsManagement() {
        // Retry all failed downloads
        const retryAllBtn = document.getElementById('retry-all-failed');
        if (retryAllBtn) {
            retryAllBtn.addEventListener('click', async () => {
                await this.retryAllFailedDownloads();
            });
        }
        
        // Clear failed downloads list
        const clearFailedBtn = document.getElementById('clear-failed-list');
        if (clearFailedBtn) {
            clearFailedBtn.addEventListener('click', () => {
                this.clearFailedDownloadsList();
            });
        }
    }
    
    updateFailedDownloadsDisplay(failedDownloads) {
        // Update stats
        const pokemonCount = document.getElementById('failed-pokemon-count');
        const spritesCount = document.getElementById('failed-sprites-count');
        const audioCount = document.getElementById('failed-audio-count');
        
        if (pokemonCount) pokemonCount.textContent = failedDownloads.pokemon.length;
        if (spritesCount) spritesCount.textContent = failedDownloads.sprites.length;
        if (audioCount) audioCount.textContent = failedDownloads.audio.length;
        
        // Update list
        const listContainer = document.getElementById('failed-downloads-list');
        if (!listContainer) return;
        
        const allFailed = [
            ...failedDownloads.pokemon,
            ...failedDownloads.sprites,
            ...failedDownloads.audio
        ];
        
        if (allFailed.length === 0) {
            listContainer.innerHTML = `
                <div class="no-failed-downloads">
                    <i class="ri-checkbox-circle-line"></i>
                    <h5>No Failed Downloads</h5>
                    <p>All downloads completed successfully!</p>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = allFailed.map(item => `
            <div class="failed-download-item" data-id="${item.id}" data-type="${item.type}">
                <div class="failed-download-icon ${item.type}">
                    <i class="${this.getFailedDownloadIcon(item.type)}"></i>
                </div>
                <div class="failed-download-info">
                    <div class="failed-download-name">${item.name}</div>
                    <div class="failed-download-type">${item.type}</div>
                    <div class="failed-download-error" title="${item.error}">${item.error}</div>
                    <div class="failed-download-timestamp">${this.formatTimestamp(item.timestamp)}</div>
                </div>
                <div class="failed-download-actions">
                    <button class="retry-single-btn" onclick="window.darkdexApp.retrySingleFailedDownload('${item.id}', '${item.type}')">
                        <i class="ri-refresh-line"></i> Retry
                    </button>
                    <button class="remove-single-btn" onclick="window.darkdexApp.removeSingleFailedDownload('${item.id}', '${item.type}')">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    getFailedDownloadIcon(type) {
        switch (type) {
            case 'pokemon': return 'ri-ghost-2-line';
            case 'sprite': return 'ri-image-line';
            case 'audio': return 'ri-volume-up-line';
            default: return 'ri-error-warning-line';
        }
    }
    
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }
    
    async retrySingleFailedDownload(id, type) {
        const button = document.querySelector(`[data-id="${id}"][data-type="${type}"] .retry-single-btn`);
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="ri-loader-4-line"></i> Retrying...';
        }
        
        try {
            const failedItem = { id, type, name: id };
            const result = await window.pokemonAPI.retryFailedDownload(failedItem);
            
            if (result.success) {
                // Remove from display
                const item = document.querySelector(`[data-id="${id}"][data-type="${type}"]`);
                if (item) {
                    item.style.opacity = '0.5';
                    item.style.transform = 'translateX(20px)';
                    setTimeout(() => item.remove(), 300);
                }
                
                // Update stats
                const failedDownloads = window.pokemonAPI.getAllFailedDownloads();
                this.updateFailedDownloadsStats(failedDownloads);
                
                console.log(`Successfully retried ${type} for ${id}`);
            } else {
                throw new Error(result.error || 'Retry failed');
            }
        } catch (error) {
            console.error(`Error retrying ${type} for ${id}:`, error);
            if (button) {
                button.innerHTML = '<i class="ri-error-warning-line"></i> Failed';
                setTimeout(() => {
                    button.disabled = false;
                    button.innerHTML = '<i class="ri-refresh-line"></i> Retry';
                }, 2000);
            }
        }
    }
    
    removeSingleFailedDownload(id, type) {
        // Remove from failed list
        const failedDownloads = window.pokemonAPI.getAllFailedDownloads();
        
        switch (type) {
            case 'pokemon':
                window.pokemonAPI.failedPokemon = window.pokemonAPI.failedPokemon.filter(p => p.id !== id);
                break;
            case 'sprite':
                window.pokemonAPI.failedSprites = window.pokemonAPI.failedSprites.filter(p => p.id !== id);
                break;
            case 'audio':
                window.pokemonAPI.failedAudio = window.pokemonAPI.failedAudio.filter(p => p.id !== id);
                break;
        }
        
        // Remove from display
        const item = document.querySelector(`[data-id="${id}"][data-type="${type}"]`);
        if (item) {
            item.style.opacity = '0.5';
            item.style.transform = 'translateX(-20px)';
            setTimeout(() => item.remove(), 300);
        }
        
        // Update stats
        const updatedFailedDownloads = window.pokemonAPI.getAllFailedDownloads();
        this.updateFailedDownloadsStats(updatedFailedDownloads);
    }
    
    async retryAllFailedDownloads() {
        const retryBtn = document.getElementById('retry-all-failed');
        if (retryBtn) {
            retryBtn.disabled = true;
            retryBtn.innerHTML = '<i class="ri-loader-4-line"></i> Retrying All...';
        }
        
        try {
            const failedDownloads = window.pokemonAPI.getAllFailedDownloads();
            const allFailed = [
                ...failedDownloads.pokemon,
                ...failedDownloads.sprites,
                ...failedDownloads.audio
            ];
            
            let successCount = 0;
            let failCount = 0;
            
            for (const item of allFailed) {
                try {
                    const result = await window.pokemonAPI.retryFailedDownload(item);
                    if (result.success) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (error) {
                    failCount++;
                }
                
                // Small delay between retries
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Update display
            const updatedFailedDownloads = window.pokemonAPI.getAllFailedDownloads();
            this.updateFailedDownloadsDisplay(updatedFailedDownloads);
            
            // Show result
            alert(`Retry completed!\nSuccessful: ${successCount}\nFailed: ${failCount}`);
            
        } catch (error) {
            console.error('Error retrying all failed downloads:', error);
            alert('Error occurred while retrying downloads.');
        } finally {
            if (retryBtn) {
                retryBtn.disabled = false;
                retryBtn.innerHTML = '<i class="ri-refresh-line"></i> Retry All Failed';
            }
        }
    }
    
    clearFailedDownloadsList() {
        if (confirm('Clear all failed downloads from the list? This will not retry them.')) {
            window.pokemonAPI.clearFailedDownloads('all');
            
            // Update display
            const failedDownloads = window.pokemonAPI.getAllFailedDownloads();
            this.updateFailedDownloadsDisplay(failedDownloads);
            
            // Hide section if no failed downloads
            const failedSection = document.getElementById('failed-downloads-section');
            if (failedSection && failedDownloads.total === 0) {
                failedSection.style.display = 'none';
            }
        }
    }
    
    updateFailedDownloadsStats(failedDownloads) {
        const pokemonCount = document.getElementById('failed-pokemon-count');
        const spritesCount = document.getElementById('failed-sprites-count');
        const audioCount = document.getElementById('failed-audio-count');
        
        if (pokemonCount) pokemonCount.textContent = failedDownloads.pokemon.length;
        if (spritesCount) spritesCount.textContent = failedDownloads.sprites.length;
        if (audioCount) audioCount.textContent = failedDownloads.audio.length;
    }

    calculateHitRate(performance) {
        const total = performance.hits + performance.misses;
        if (total === 0) return 0;
        return Math.round((performance.hits / total) * 100);
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                // Use the getAllPokemon method which handles batching and error recovery
                this.updateLoadingStatus('Fetching Pokémon data...');
                this.updateProgress(10);
                
                const allPokemon = await window.pokemonAPI.getAllPokemon(this.totalPokemon);
                
                if (allPokemon && allPokemon.length > 0) {
                    this.allPokemonData = allPokemon;
                    window.searchManager.setPokemonData(allPokemon);
                    this.updateLoadingStatus(`Loaded ${allPokemon.length} Pokémon successfully!`);
                } else {
                    throw new Error('No Pokemon data received');
                }
                
            } catch (error) {
                console.error('Error loading Pokemon data from API:', error);
                
                // Try to load any partial cached data as fallback
                this.updateLoadingStatus('API failed, checking for partial cache...');
                const partialCache = await window.pokemonAPI.loadPartialCachedData();
                
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

    async showRetryModal() {
        const failedPokemon = window.pokemonAPI.getFailedPokemon();
        if (failedPokemon.length === 0) {
            alert('No failed Pokémon to retry!');
            return;
        }

        const retryModal = document.createElement('div');
        retryModal.className = 'modal';
        retryModal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Retry Failed Downloads</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Found ${failedPokemon.length} failed Pokémon downloads. Would you like to retry them?</p>
                    <div class="failed-pokemon-list" style="max-height: 200px; overflow-y: auto; margin: 16px 0;">
                        ${failedPokemon.map(p => `
                            <div style="padding: 8px; background: var(--bg-tertiary); margin: 4px 0; border-radius: 6px;">
                                ${p.name || p.id}
                            </div>
                        `).join('')}
                    </div>
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button class="btn-secondary" onclick="window.darkdexApp.retryFailedPokemon()" style="background: var(--primary-color); color: white;">
                            Retry All
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(retryModal);
        retryModal.style.display = 'flex';
    }

    async retryFailedPokemon() {
        // Close the retry modal
        const retryModal = document.querySelector('.modal');
        if (retryModal) retryModal.remove();

        this.updateLoadingStatus('Retrying failed Pokémon downloads...');
        
        try {
            const retryResults = await window.pokemonAPI.retryFailedPokemon();
            
            if (retryResults.length > 0) {
                // Add successful retries to the main data
                this.allPokemonData.push(...retryResults);
                this.allPokemonData.sort((a, b) => a.id - b.id);
                
                if (window.searchManager) {
                    window.searchManager.setPokemonData(this.allPokemonData);
                }
                
                alert(`Successfully downloaded ${retryResults.length} Pokémon!`);
            } else {
                alert('No additional Pokémon could be downloaded at this time.');
            }
        } catch (error) {
            console.error('Error retrying failed Pokemon:', error);
            alert('Error occurred while retrying downloads.');
        }
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