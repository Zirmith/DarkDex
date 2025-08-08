class SpriteManager {
    constructor() {
        this.spriteCache = new Map();
        this.config = {
            animated: false,
            shiny: false,
            showdown: false
        };
        this.setupControls();
    }

    setupControls() {
        // Main sprite toggle controls
        const animatedToggle = document.getElementById('animated-sprites');
        const shinyToggle = document.getElementById('shiny-sprites');
        const showdownToggle = document.getElementById('showdown-sprites');

        if (animatedToggle) {
            animatedToggle.addEventListener('change', (e) => {
                this.config.animated = e.target.checked;
                this.refreshAllSprites();
            });
        }

        if (shinyToggle) {
            shinyToggle.addEventListener('change', (e) => {
                this.config.shiny = e.target.checked;
                this.refreshAllSprites();
            });
        }

        if (showdownToggle) {
            showdownToggle.addEventListener('change', (e) => {
                this.config.showdown = e.target.checked;
                this.refreshAllSprites();
            });
        }
    }

    getSpriteUrl(pokemon, options = {}) {
        const config = { ...this.config, ...options };
        const pokemonId = pokemon.id;
        const pokemonName = pokemon.name.toLowerCase();

        // Use Showdown sprites by default for cards, unless explicitly overridden
        const useShowdown = options.forceOfficial ? false : (config.showdown || options.useShowdown !== false);
        
        if (useShowdown) {
            // GitHub PokeAPI Showdown sprites (higher quality)
            const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown';
            
            if (config.animated) {
                if (config.shiny) {
                    return `${baseUrl}/shiny/${pokemonId}.gif`;
                } else {
                    return `${baseUrl}/${pokemonId}.gif`;
                }
            } else {
                // For static, we'll still use the animated GIFs as they're high quality
                if (config.shiny) {
                    return `${baseUrl}/shiny/${pokemonId}.gif`;
                } else {
                    return `${baseUrl}/${pokemonId}.gif`;
                }
            }
        } else {
            // PokéAPI official sprites
            if (config.shiny) {
                if (config.animated && pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_shiny) {
                    return pokemon.sprites.versions['generation-v']['black-white'].animated.front_shiny;
                } else {
                    return pokemon.sprites.front_shiny || pokemon.sprites.front_default;
                }
            } else {
                if (config.animated && pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default) {
                    return pokemon.sprites.versions['generation-v']['black-white'].animated.front_default;
                } else {
                    return pokemon.sprites.front_default;
                }
            }
        }
    }

    async loadSprite(pokemon, options = {}) {
        const spriteUrl = this.getSpriteUrl(pokemon, options);
        if (!spriteUrl) return null;

        const cacheKey = `${pokemon.id}_${JSON.stringify({ ...this.config, ...options })}`;
        
        // Check memory cache
        if (this.spriteCache.has(cacheKey)) {
            return this.spriteCache.get(cacheKey);
        }

        try {
            // Generate filename for local cache
            const filename = this.generateFilename(pokemon, { ...this.config, ...options });
            
            // Check local cache first
            const cachedSprite = await window.electronAPI.invoke('get-sprite-path', filename);
            if (cachedSprite.success) {
                this.spriteCache.set(cacheKey, cachedSprite.path);
                return cachedSprite.path;
            }

            // Download and cache sprite
            const downloadResult = await window.electronAPI.invoke('download-sprite', spriteUrl, filename);
            if (downloadResult.success) {
                const localPath = `file://${downloadResult.path}`;
                this.spriteCache.set(cacheKey, localPath);
                return localPath;
            } else {
                // Fallback to direct URL if caching fails
                this.spriteCache.set(cacheKey, spriteUrl);
                return spriteUrl;
            }
        } catch (error) {
            console.error('Error loading sprite:', error);
            // Return direct URL as fallback
            this.spriteCache.set(cacheKey, spriteUrl);
            return spriteUrl;
        }
    }

    generateFilename(pokemon, config) {
        const parts = [
            pokemon.id.toString().padStart(3, '0'),
            pokemon.name.toLowerCase()
        ];

        // Always include showdown in filename for cards since we use it by default
        const useShowdown = config.forceOfficial ? false : (config.showdown || config.useShowdown !== false);
        
        if (config.shiny) parts.push('shiny');
        if (config.animated) parts.push('animated');
        if (useShowdown) parts.push('showdown');

        const extension = useShowdown ? 'gif' : 'png';
        return `${parts.join('_')}.${extension}`;
    }

    async updateSpriteElement(element, pokemon, options = {}) {
        if (!element || !pokemon) return;

        try {
            const spriteUrl = await this.loadSprite(pokemon, options);
            if (spriteUrl) {
                element.src = spriteUrl;
                element.onerror = () => {
                    // Fallback to default sprite on error
                    element.src = pokemon.sprites.front_default || '';
                };
            }
        } catch (error) {
            console.error('Error updating sprite element:', error);
            element.src = pokemon.sprites.front_default || '';
        }
    }

    refreshAllSprites() {
        // Refresh all Pokemon card sprites
        const pokemonCards = document.querySelectorAll('.pokemon-card');
        pokemonCards.forEach(card => {
            const sprite = card.querySelector('.pokemon-sprite');
            const pokemonData = card.pokemonData;
            if (sprite && pokemonData) {
                this.updateSpriteElement(sprite, pokemonData, { useShowdown: true });
            }
        });

        // Refresh modal sprite if open
        const modalSprite = document.getElementById('modal-pokemon-sprite');
        const modal = document.getElementById('pokemon-modal');
        if (modalSprite && modal.style.display !== 'none' && modal.currentPokemon) {
            this.updateSpriteElement(modalSprite, modal.currentPokemon);
        }
    }

    async preloadSprites(pokemonList) {
        // Preload sprites for better performance
        const preloadPromises = pokemonList.slice(0, 20).map(async (pokemon) => {
            try {
                await this.loadSprite(pokemon);
                // Also preload shiny variant
                await this.loadSprite(pokemon, { shiny: true });
            } catch (error) {
                console.error(`Error preloading sprites for ${pokemon.name}:`, error);
            }
        });

        await Promise.all(preloadPromises).catch(console.error);
    }

    getAlternativeSprites(pokemon) {
        const alternatives = [];
        
        // Add different sprite variations
        const sprites = pokemon.sprites;
        
        if (sprites.front_default) {
            alternatives.push({
                name: 'Default',
                url: sprites.front_default,
                type: 'default'
            });
        }
        
        if (sprites.front_shiny) {
            alternatives.push({
                name: 'Shiny',
                url: sprites.front_shiny,
                type: 'shiny'
            });
        }

        // Generation-specific sprites
        if (sprites.versions) {
            Object.entries(sprites.versions).forEach(([generation, genSprites]) => {
                Object.entries(genSprites).forEach(([game, gameSprites]) => {
                    if (gameSprites.front_default) {
                        alternatives.push({
                            name: `${game.replace('-', ' ')} (${generation})`,
                            url: gameSprites.front_default,
                            type: 'generation'
                        });
                    }
                });
            });
        }

        return alternatives;
    }

    clearCache() {
        this.spriteCache.clear();
    }
}

// Initialize sprite manager
window.spriteManager = new SpriteManager();