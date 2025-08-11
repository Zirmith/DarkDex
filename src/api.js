class PokemonAPI {
    constructor() {
        this.baseUrl = 'https://pokeapi.co/api/v2';
        this.cache = new Map();
        this.isOnline = navigator.onLine;
        this.cacheStats = { hits: 0, misses: 0, errors: 0 };
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
            if (typeof window !== 'undefined' && window.electronAPI) {
                const result = await window.electronAPI.invoke('check-internet');
                this.isOnline = result.online;
                this.updateConnectionStatus(result.online);
            } else {
                // Fallback for non-Electron environments
                this.isOnline = navigator.onLine;
                this.updateConnectionStatus(this.isOnline);
            }
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
            this.cacheStats.hits++;
            return this.cache.get(key);
        }

        // Try local cache
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                const cachedResult = await window.electronAPI.invoke('get-cached-data', this.sanitizeKey(key));
                if (cachedResult.success) {
                    this.cache.set(key, cachedResult.data);
                    this.cacheStats.hits++;
                    return cachedResult.data;
                }
            }
        } catch (error) {
            console.warn('Cache read error:', error);
            this.cacheStats.errors++;
        }

        // If offline and no cache, return error
        if (!this.isOnline) {
            this.cacheStats.misses++;
            console.warn(`No cached data for ${key} and offline`);
            return null; // Return null instead of throwing error
        }

        // Fetch from API
        try {
            let result;
            if (typeof window !== 'undefined' && window.electronAPI) {
                result = await window.electronAPI.invoke('fetch-pokemon-data', url);
                if (result.success) {
                    // Cache the data
                    this.cache.set(key, result.data);
                    await this.cacheData(key, result.data);
                    this.cacheStats.misses++;
                    return result.data;
                } else {
                    throw new Error(result.error);
                }
            } else {
                // Fallback for non-Electron environments
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                this.cache.set(key, data);
                // Also cache locally if possible
                await this.cacheData(key, data);
                this.cacheStats.misses++;
                return data;
            }
        } catch (error) {
            this.cacheStats.errors++;
            throw new Error(`API request failed: ${error.message}`);
        }
    }

    async cacheData(key, data) {
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                await window.electronAPI.invoke('cache-data', this.sanitizeKey(key), data);
            }
        } catch (error) {
            console.warn('Cache write error:', error);
        }
    }

    sanitizeKey(key) {
        return key.replace(/[^a-zA-Z0-9-_]/g, '_');
    }

    async getPokemonList(limitc = 1302, offset = 0) {
        // Get all Pokemon without limit
        const url = `${this.baseUrl}/pokemon?limit=${limitc}`;
        console.log(url)
        return await this.fetchData(url, `pokemon_list_${limitc}_${offset}`);
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

    async getAllPokemon(maxPokemon = 1302) {
        try {
            // Try to get cached complete Pokemon data first
            const cachedAllPokemon = await this.getCachedAllPokemon();
            if (cachedAllPokemon && cachedAllPokemon.length > 0) {
                console.log(`Loaded ${cachedAllPokemon.length} Pokemon from cache`);
                return cachedAllPokemon;
            }

            // Get Pokemon list with reasonable limit
            const pokemonList = await this.getPokemonList(maxPokemon, 0);
            if (!pokemonList) {
                throw new Error('Could not fetch Pokemon list');
            }
            
            console.log(`Found ${pokemonList.results.length} total Pokemon available`);
            const detailedPokemon = [];

            // Process in smaller batches to avoid overwhelming the API
            const batchSize = 5;
            const maxToProcess = Math.min(pokemonList.results.length, maxPokemon);
            
            for (let i = 0; i < maxToProcess; i += batchSize) {
                const batch = pokemonList.results.slice(i, Math.min(i + batchSize, maxToProcess));
                const batchPromises = batch.map(async (pokemon) => {
                    try {
                        // Cache individual Pokemon data
                        const details = await this.getPokemon(pokemon.name);
                        if (!details) return null;
                        
                        const species = await this.getPokemonSpecies(pokemon.name);
                        
                        // Get additional data
                        let encounters = [];
                        try {
                            encounters = await this.getPokemonEncounters(details.id);
                        } catch (error) {
                            console.warn(`Could not fetch encounters for ${pokemon.name}:`, error);
                        }
                        
                        // Get evolution chain if available
                        let evolutionChain = null;
                        if (species && species.evolution_chain?.url) {
                            const evolutionId = species.evolution_chain.url.split('/').slice(-2, -1)[0];
                            try {
                                evolutionChain = await this.getEvolutionChain(evolutionId);
                            } catch (error) {
                                console.warn(`Could not fetch evolution chain for ${pokemon.name}:`, error);
                            }
                        }
                        
                        const completeData = { 
                            ...details, 
                            species: species || null,
                            encounters: encounters || [],
                            evolutionChain: evolutionChain || null
                        };
                        
                        // Cache individual complete Pokemon data
                        await this.cacheData(`complete_pokemon_${pokemon.name}`, completeData);
                        await this.cacheData(`complete_pokemon_${details.id}`, completeData);
                        
                        return completeData;
                    } catch (error) {
                        console.error(`Error fetching ${pokemon.name}:`, error);
                        return null;
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                detailedPokemon.push(...batchResults.filter(p => p !== null));

                // Log progress
                console.log(`Loaded ${detailedPokemon.length}/${maxToProcess} Pokemon...`);

                // Small delay between batches to be respectful to the API
                if (i + batchSize < maxToProcess) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Cache the complete Pokemon data
            await this.cacheAllPokemon(detailedPokemon);
            
            console.log(`Successfully loaded and cached ${detailedPokemon.length} Pokemon`);
            return detailedPokemon;
        } catch (error) {
            console.error('Error fetching all Pokemon:', error);
            
            // Try to load any partial cached data as fallback
            console.log('Attempting to load partial cached data...');
            const partialCache = await this.loadPartialCachedData();
            
            if (partialCache && partialCache.length > 0) {
                console.log(`Loaded ${partialCache.length} Pokemon from partial cache`);
                return partialCache;
            } else {
                throw new Error('No internet connection and no cached data available');
            }
        }
    }

    async getCachedAllPokemon() {
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                const cachedResult = await window.electronAPI.invoke('get-cached-data', 'all_pokemon_complete');
                if (cachedResult.success && cachedResult.data && Array.isArray(cachedResult.data)) {
                    return cachedResult.data;
                }
            }
        } catch (error) {
            console.warn('Error getting cached all Pokemon:', error);
        }
        return null;
    }

    async cacheAllPokemon(pokemonData) {
        try {
            if (typeof window !== 'undefined' && window.electronAPI) {
                await window.electronAPI.invoke('cache-data', 'all_pokemon_complete', pokemonData);
                console.log(`Cached ${pokemonData.length} complete Pokemon records`);
            }
        } catch (error) {
            console.warn('Error caching all Pokemon:', error);
        }
    }

    async loadPartialCachedData() {
        try {
            const cachedPokemon = [];
            
            // Try to load individual cached Pokemon
            for (let i = 1; i <= 1302; i++) {
                try {
                    if (typeof window !== 'undefined' && window.electronAPI) {
                        const cachedResult = await window.electronAPI.invoke('get-cached-data', this.sanitizeKey(`complete_pokemon_${i}`));
                        if (cachedResult.success) {
                            cachedPokemon.push(cachedResult.data);
                        }
                    }
                } catch (error) {
                    // Skip missing cache entries
                    continue;
                }
                
                // Update loading status periodically
                if (i % 100 === 0) {
                    console.log(`Checking cache... found ${cachedPokemon.length} Pokemon so far`);
                }
            }
            
            // Also try to load by name for common Pokemon
            const commonPokemon = ['pikachu', 'charizard', 'blastoise', 'venusaur', 'mewtwo', 'mew'];
            for (const name of commonPokemon) {
                try {
                    if (typeof window !== 'undefined' && window.electronAPI) {
                        const cachedResult = await window.electronAPI.invoke('get-cached-data', this.sanitizeKey(`complete_pokemon_${name}`));
                        if (cachedResult.success && !cachedPokemon.find(p => p.name === name)) {
                            cachedPokemon.push(cachedResult.data);
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
            
            console.log(`Loaded ${cachedPokemon.length} Pokemon from partial cache`);
            return cachedPokemon.sort((a, b) => a.id - b.id);
        } catch (error) {
            console.error('Error loading partial cached data:', error);
            return [];
        }
    }

    async loadPartialCachedDataOld() {
        try {
            const cachedPokemon = [];
            
            // Try to load individual cached Pokemon - more comprehensive search
            for (let i = 1; i <= 1302; i++) {
                try {
                    const cached = await this.fetchData(null, `complete_pokemon_${i}`);
                    if (cached && cached.id) {
                        cachedPokemon.push(cached);
                    }
                } catch (error) {
                    // Skip missing cache entries
                    continue;
                }
                
                // Break if we haven't found any Pokemon in the last 200 IDs
                if (i > 300 && cachedPokemon.length === 0) {
                    break;
                }
            }
            
            console.log(`Found ${cachedPokemon.length} cached Pokemon as fallback`);
            return cachedPokemon;
        } catch (error) {
            console.error('Error loading partial cached data:', error);
            return [];
        }
    }

    async getPokemonDescription(species) {
        try {
            if (!species || !species.flavor_text_entries) {
                return 'No description available.';
            }
            
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
        return species && species.is_legendary || false;
    }

    isMythical(species) {
        return species && species.is_mythical || false;
    }

    async getCompletePokemonData(idOrName) {
        try {
            // Check if we have complete cached data
            const cacheKey = `complete_pokemon_${idOrName}`;
            const cached = await this.fetchData(null, cacheKey);
            if (cached) return cached;
            
            // Fetch all data
            const pokemon = await this.getPokemon(idOrName);
            if (!pokemon) return null;
            
            const species = await this.getPokemonSpecies(idOrName);
            const encounters = await this.getPokemonEncounters(pokemon.id).catch(() => []);
            
            let evolutionChain = null;
            if (species && species.evolution_chain?.url) {
                const evolutionId = species.evolution_chain.url.split('/').slice(-2, -1)[0];
                evolutionChain = await this.getEvolutionChain(evolutionId).catch(() => null);
            }
            
            const completeData = {
                ...pokemon,
                species,
                encounters: encounters || [],
                evolutionChain,
                description: await this.getPokemonDescription(species)
            };
            
            // Cache the complete data
            await this.cacheData(cacheKey, completeData);
            
            return completeData;
        } catch (error) {
            console.error(`Error getting complete Pokemon data for ${idOrName}:`, error);
            return null;
        }
    }

    async clearDataCache() {
        if (typeof window !== 'undefined' && window.electronAPI) {
            try {
                await window.electronAPI.invoke('clear-cache', 'data');
                this.cache.clear();
                this.cacheStats = { hits: 0, misses: 0, errors: 0 };
                console.log('Data cache cleared');
            } catch (error) {
                console.error('Error clearing data cache:', error);
            }
        }
    }

    async clearAllCache() {
        if (typeof window !== 'undefined' && window.electronAPI) {
            try {
                await window.electronAPI.invoke('clear-cache', 'all');
                this.cache.clear();
                this.cacheStats = { hits: 0, misses: 0, errors: 0 };
                console.log('All cache cleared');
            } catch (error) {
                console.error('Error clearing all cache:', error);
            }
        }
    }

    async getCacheStats() {
        if (typeof window !== 'undefined' && window.electronAPI) {
            try {
                const result = await window.electronAPI.invoke('get-cache-stats');
                if (result.success) {
                    return {
                        ...result.stats,
                        performance: this.cacheStats
                    };
                }
            } catch (error) {
                console.error('Error getting cache stats:', error);
            }
        }
        return {
            data: { size: 0, files: 0 },
            sprites: { size: 0, files: 0 },
            audio: { size: 0, files: 0 },
            total: { size: 0, files: 0 },
            performance: this.cacheStats
        };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Setup electron API bridge
if (typeof require !== 'undefined') {
    const { ipcRenderer } = require('electron');
    
    window.electronAPI = {
        invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
    };
}

// Initialize API
window.pokemonAPI = new PokemonAPI();