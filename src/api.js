class PokemonAPI {
    constructor() {
        this.baseUrl = 'https://pokeapi.co/api/v2';
        this.cache = new Map();
        this.isOnline = navigator.onLine;
        this.setupOfflineDetection();
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus(true);
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus(false);
        });

        // Initial status check
        this.checkConnection();
    }

    async checkConnection() {
        try {
            const result = await window.electronAPI.invoke('check-internet');
            this.isOnline = result.online;
            this.updateConnectionStatus(result.online);
        } catch (error) {
            this.isOnline = false;
            this.updateConnectionStatus(false);
        }
    }

    updateConnectionStatus(isOnline) {
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
            statusEl.className = isOnline ? 'connection-status' : 'connection-status offline';
            statusEl.innerHTML = isOnline ? 
                '<i class="ri-wifi-line" title="Online"></i>' : 
                '<i class="ri-wifi-off-line" title="Offline"></i>';
        }
    }

    async fetchData(url, cacheKey = null) {
        const key = cacheKey || url;
        
        // Try cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        // Try local cache
        try {
            const cachedResult = await window.electronAPI.invoke('get-cached-data', this.sanitizeKey(key));
            if (cachedResult.success) {
                this.cache.set(key, cachedResult.data);
                return cachedResult.data;
            }
        } catch (error) {
            console.warn('Cache read error:', error);
        }

        // If offline and no cache, return error
        if (!this.isOnline) {
            throw new Error('No internet connection and no cached data available');
        }

        // Fetch from API
        try {
            const result = await window.electronAPI.invoke('fetch-pokemon-data', url);
            if (result.success) {
                // Cache the data
                this.cache.set(key, result.data);
                await this.cacheData(key, result.data);
                return result.data;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            throw new Error(`API request failed: ${error.message}`);
        }
    }

    async cacheData(key, data) {
        try {
            await window.electronAPI.invoke('cache-data', this.sanitizeKey(key), data);
        } catch (error) {
            console.warn('Cache write error:', error);
        }
    }

    sanitizeKey(key) {
        return key.replace(/[^a-zA-Z0-9-_]/g, '_');
    }

    async getPokemonList(limit = 1010, offset = 0) {
        const url = `${this.baseUrl}/pokemon?limit=${limit}&offset=${offset}`;
        return await this.fetchData(url, `pokemon_list_${limit}_${offset}`);
    }

    async getPokemon(idOrName) {
        const url = `${this.baseUrl}/pokemon/${idOrName}`;
        return await this.fetchData(url, `pokemon_${idOrName}`);
    }

    async getPokemonSpecies(idOrName) {
        const url = `${this.baseUrl}/pokemon-species/${idOrName}`;
        return await this.fetchData(url, `species_${idOrName}`);
    }

    async getEvolutionChain(id) {
        const url = `${this.baseUrl}/evolution-chain/${id}`;
        return await this.fetchData(url, `evolution_${id}`);
    }

    async getMove(idOrName) {
        const url = `${this.baseUrl}/move/${idOrName}`;
        return await this.fetchData(url, `move_${idOrName}`);
    }

    async getType(idOrName) {
        const url = `${this.baseUrl}/type/${idOrName}`;
        return await this.fetchData(url, `type_${idOrName}`);
    }

    async getLocation(idOrName) {
        const url = `${this.baseUrl}/location/${idOrName}`;
        return await this.fetchData(url, `location_${idOrName}`);
    }

    async getLocationArea(idOrName) {
        const url = `${this.baseUrl}/location-area/${idOrName}`;
        return await this.fetchData(url, `location_area_${idOrName}`);
    }

    async getPokemonEncounters(pokemonId) {
        const url = `${this.baseUrl}/pokemon/${pokemonId}/encounters`;
        return await this.fetchData(url, `encounters_${pokemonId}`);
    }

    async getAllPokemon(maxPokemon = 1010) {
        try {
            const pokemonList = await this.getPokemonList(maxPokemon, 0);
            const detailedPokemon = [];

            // Process in batches to avoid overwhelming the API
            const batchSize = 20;
            for (let i = 0; i < pokemonList.results.length; i += batchSize) {
                const batch = pokemonList.results.slice(i, i + batchSize);
                const batchPromises = batch.map(async (pokemon) => {
                    try {
                        const details = await this.getPokemon(pokemon.name);
                        const species = await this.getPokemonSpecies(pokemon.name);
                        return { ...details, species };
                    } catch (error) {
                        console.error(`Error fetching ${pokemon.name}:`, error);
                        return null;
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                detailedPokemon.push(...batchResults.filter(p => p !== null));

                // Small delay between batches to be respectful to the API
                if (i + batchSize < pokemonList.results.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            return detailedPokemon;
        } catch (error) {
            console.error('Error fetching all Pokemon:', error);
            throw error;
        }
    }

    async getPokemonDescription(species) {
        try {
            const flavorTexts = species.flavor_text_entries;
            const englishTexts = flavorTexts.filter(text => text.language.name === 'en');
            
            if (englishTexts.length > 0) {
                // Get the most recent English description
                return englishTexts[englishTexts.length - 1].flavor_text
                    .replace(/\f/g, ' ')
                    .replace(/\n/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            }
            
            return 'No description available.';
        } catch (error) {
            console.error('Error getting Pokemon description:', error);
            return 'Description unavailable.';
        }
    }

    getGeneration(id) {
        if (id <= 151) return 1;
        if (id <= 251) return 2;
        if (id <= 386) return 3;
        if (id <= 493) return 4;
        if (id <= 649) return 5;
        if (id <= 721) return 6;
        if (id <= 809) return 7;
        if (id <= 905) return 8;
        return 9;
    }

    isLegendary(species) {
        return species.is_legendary || false;
    }

    isMythical(species) {
        return species.is_mythical || false;
    }
}

// Initialize API
window.pokemonAPI = new PokemonAPI();

// Setup electron API bridge
if (typeof require !== 'undefined') {
    const { ipcRenderer } = require('electron');
    
    window.electronAPI = {
        invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
    };
}