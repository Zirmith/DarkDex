class SearchManager {
    constructor() {
        this.allPokemon = [];
        this.filteredPokemon = [];
        this.currentFilters = {
            search: '',
            generation: '',
            types: [],
            sort: 'id'
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('search-input');
        const clearSearchBtn = document.getElementById('clear-search');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value.toLowerCase().trim();
                this.applyFilters();
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.currentFilters.search = '';
                this.applyFilters();
            });
        }

        // Generation filter
        const generationFilter = document.getElementById('generation-filter');
        if (generationFilter) {
            generationFilter.addEventListener('change', (e) => {
                this.currentFilters.generation = e.target.value;
                this.applyFilters();
            });
        }

        // Type filters
        const typeFilters = document.getElementById('type-filters');
        if (typeFilters) {
            typeFilters.addEventListener('click', (e) => {
                if (e.target.classList.contains('type-filter')) {
                    const type = e.target.dataset.type;
                    this.toggleTypeFilter(type);
                    e.target.classList.toggle('active');
                    this.applyFilters();
                }
            });
        }

        // Sort filter
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.applyFilters();
            });
        }

        // Clear filters
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    setPokemonData(pokemonList) {
        this.allPokemon = pokemonList;
        this.filteredPokemon = [...pokemonList];
        this.applyFilters();
    }

    toggleTypeFilter(type) {
        const index = this.currentFilters.types.indexOf(type);
        if (index > -1) {
            this.currentFilters.types.splice(index, 1);
        } else {
            this.currentFilters.types.push(type);
        }
    }

    applyFilters() {
        let filtered = [...this.allPokemon];

        // Apply search filter
        if (this.currentFilters.search) {
            filtered = filtered.filter(pokemon => {
                const searchTerm = this.currentFilters.search;
                return (
                    pokemon.name.toLowerCase().includes(searchTerm) ||
                    pokemon.id.toString() === searchTerm
                );
            });
        }

        // Apply generation filter
        if (this.currentFilters.generation) {
            const generation = parseInt(this.currentFilters.generation);
            filtered = filtered.filter(pokemon => {
                return window.pokemonAPI.getGeneration(pokemon.id) === generation;
            });
        }

        // Apply type filters
        if (this.currentFilters.types.length > 0) {
            filtered = filtered.filter(pokemon => {
                return pokemon.types.some(typeInfo => 
                    this.currentFilters.types.includes(typeInfo.type.name)
                );
            });
        }

        // Apply sorting
        filtered = this.sortPokemon(filtered, this.currentFilters.sort);

        this.filteredPokemon = filtered;
        this.renderResults();
    }

    sortPokemon(pokemon, sortBy) {
        const sortedPokemon = [...pokemon];

        switch (sortBy) {
            case 'id':
                return sortedPokemon.sort((a, b) => a.id - b.id);
            
            case 'name':
                return sortedPokemon.sort((a, b) => a.name.localeCompare(b.name));
            
            case 'base-stat-total':
                return sortedPokemon.sort((a, b) => {
                    const totalA = a.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
                    const totalB = b.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
                    return totalB - totalA;
                });
            
            case 'height':
                return sortedPokemon.sort((a, b) => b.height - a.height);
            
            case 'weight':
                return sortedPokemon.sort((a, b) => b.weight - a.weight);
            
            default:
                return sortedPokemon;
        }
    }

    renderResults() {
        const grid = document.getElementById('pokemon-grid');
        if (!grid) return;

        // Clear existing results
        grid.innerHTML = '';

        // Show loading if no results
        if (this.filteredPokemon.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <i class="ri-search-line"></i>
                    <p>No Pokémon found matching your criteria</p>
                    <button onclick="searchManager.clearAllFilters()" class="btn-secondary">
                        Clear Filters
                    </button>
                </div>
            `;
            return;
        }

        // Render Pokemon cards
        this.filteredPokemon.forEach(pokemon => {
            const card = this.createPokemonCard(pokemon);
            grid.appendChild(card);
        });

        // Update sprite elements
        window.spriteManager.refreshAllSprites();
    }

    createPokemonCard(pokemon) {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        card.pokemonData = pokemon; // Store reference for sprite updates

        // Calculate stats for preview
        const stats = pokemon.stats;
        const hp = stats.find(s => s.stat.name === 'hp')?.base_stat || 0;
        const attack = stats.find(s => s.stat.name === 'attack')?.base_stat || 0;
        const defense = stats.find(s => s.stat.name === 'defense')?.base_stat || 0;

        // Get types
        const typeElements = pokemon.types.map(typeInfo => 
            `<span class="type-badge ${typeInfo.type.name}">${typeInfo.type.name}</span>`
        ).join('');

        card.innerHTML = `
            <div class="pokemon-card-header">
                <div>
                    <div class="pokemon-id">#${pokemon.id.toString().padStart(3, '0')}</div>
                    <h3 class="pokemon-name">${pokemon.name}</h3>
                </div>
            </div>
            <img class="pokemon-sprite" src="${pokemon.sprites.front_default || ''}" alt="${pokemon.name}">
            <div class="pokemon-types">
                ${typeElements}
            </div>
            <div class="pokemon-stats-preview">
                <div class="stat-item">
                    <div class="stat-label">HP</div>
                    <div class="stat-value">${hp}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">ATK</div>
                    <div class="stat-value">${attack}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">DEF</div>
                    <div class="stat-value">${defense}</div>
                </div>
            </div>
        `;

        // Add click event to open modal
        card.addEventListener('click', () => {
            this.openPokemonModal(pokemon);
        });

        // Update sprite using sprite manager
        const spriteElement = card.querySelector('.pokemon-sprite');
        if (window.spriteManager && spriteElement) {
            window.spriteManager.updateSpriteElement(spriteElement, pokemon, { useShowdown: true });
        }

        return card;
    }

    async openPokemonModal(pokemon) {
        const modal = document.getElementById('pokemon-modal');
        const modalContent = modal.querySelector('.modal-content');
        
        modal.currentPokemon = pokemon;
        modal.style.display = 'block';

        // Update modal content
        await this.populateModal(pokemon);
        
        // Setup modal controls
        this.setupModalControls(pokemon);
    }

    async populateModal(pokemon) {
        // Update header
        document.getElementById('modal-pokemon-name').textContent = pokemon.name;
        document.getElementById('modal-pokemon-id').textContent = `#${pokemon.id.toString().padStart(3, '0')}`;

        // Update overview tab
        await this.populateOverviewTab(pokemon);
        
        // Update stats tab
        this.populateStatsTab(pokemon);
        
        // Update moves tab (lazy load)
        this.populateMovesTab(pokemon);
        
        // Update evolution tab (lazy load)
        this.populateEvolutionTab(pokemon);
        
        // Update forms tab (lazy load)
        this.populateFormsTab(pokemon);
        
        // Update locations tab (lazy load)
        this.populateLocationsTab(pokemon);
    }

    async populateOverviewTab(pokemon) {
        // Update sprite
        const spriteElement = document.getElementById('modal-pokemon-sprite');
        await window.spriteManager.updateSpriteElement(spriteElement, pokemon);

        // Update basic info
        document.getElementById('modal-pokemon-height').textContent = `${pokemon.height / 10} m`;
        document.getElementById('modal-pokemon-weight').textContent = `${pokemon.weight / 10} kg`;
        document.getElementById('modal-pokemon-experience').textContent = pokemon.base_experience || 'Unknown';

        // Update types
        const typesContainer = document.getElementById('modal-pokemon-types');
        typesContainer.innerHTML = pokemon.types.map(typeInfo => 
            `<span class="type-badge ${typeInfo.type.name}">${typeInfo.type.name}</span>`
        ).join('');

        // Update abilities
        const abilitiesContainer = document.getElementById('modal-pokemon-abilities');
        abilitiesContainer.innerHTML = pokemon.abilities.map(abilityInfo => 
            `<span class="ability-item ${abilityInfo.is_hidden ? 'hidden' : ''}" title="${abilityInfo.is_hidden ? 'Hidden Ability' : 'Normal Ability'}">
                ${abilityInfo.ability.name.replace('-', ' ')}
            </span>`
        ).join('');

        // Update description
        try {
            const species = await window.pokemonAPI.getPokemonSpecies(pokemon.id);
            const description = await window.pokemonAPI.getPokemonDescription(species);
            document.getElementById('modal-pokemon-description').textContent = description;
        } catch (error) {
            document.getElementById('modal-pokemon-description').textContent = 'Description unavailable.';
        }
    }

    populateStatsTab(pokemon) {
        const statsContainer = document.getElementById('modal-pokemon-stats');
        const statNames = {
            'hp': 'HP',
            'attack': 'Attack',
            'defense': 'Defense',
            'special-attack': 'Sp. Attack',
            'special-defense': 'Sp. Defense',
            'speed': 'Speed'
        };

        const totalStats = pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);

        let statsHTML = pokemon.stats.map(stat => {
            const percentage = (stat.base_stat / 255) * 100; // 255 is roughly max base stat
            const statKey = stat.stat.name;
            return `
                <div class="stat-row">
                    <div class="stat-name">${statNames[statKey] || statKey}</div>
                    <div class="stat-value-display">${stat.base_stat}</div>
                    <div class="stat-bar">
                        <div class="stat-bar-fill ${statKey}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        // Add total stats
        statsHTML += `
            <div class="stat-row" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                <div class="stat-name" style="font-weight: 600;">Total</div>
                <div class="stat-value-display" style="font-weight: 600;">${totalStats}</div>
                <div class="stat-bar">
                    <div class="stat-bar-fill" style="width: ${(totalStats / 720) * 100}%; background: var(--primary-color);"></div>
                </div>
            </div>
        `;

        statsContainer.innerHTML = statsHTML;
    }

    async populateMovesTab(pokemon) {
        const movesContainer = document.getElementById('modal-pokemon-moves');
        
        if (pokemon.moves.length === 0) {
            movesContainer.innerHTML = '<p>No moves data available.</p>';
            return;
        }

        // Group moves by learn method
        const moveGroups = {
            'level-up': { title: 'Level Up', moves: [] },
            'machine': { title: 'TM/TR', moves: [] },
            'egg': { title: 'Egg Moves', moves: [] },
            'tutor': { title: 'Move Tutor', moves: [] }
        };

        pokemon.moves.forEach(moveInfo => {
            moveInfo.version_group_details.forEach(detail => {
                const method = detail.move_learn_method.name;
                if (moveGroups[method]) {
                    const level = detail.level_learned_at || 0;
                    moveGroups[method].moves.push({
                        name: moveInfo.move.name,
                        level: level
                    });
                }
            });
        });

        // Sort and render moves
        let movesHTML = '';
        Object.values(moveGroups).forEach(group => {
            if (group.moves.length > 0) {
                // Remove duplicates and sort
                const uniqueMoves = [...new Map(group.moves.map(m => [m.name, m])).values()];
                
                if (group.title === 'Level Up') {
                    uniqueMoves.sort((a, b) => a.level - b.level);
                } else {
                    uniqueMoves.sort((a, b) => a.name.localeCompare(b.name));
                }

                movesHTML += `
                    <div class="moves-section">
                        <h4>${group.title}</h4>
                        <div class="moves-grid">
                            ${uniqueMoves.map(move => `
                                <div class="move-item">
                                    ${group.title === 'Level Up' && move.level > 0 ? `Lv.${move.level} - ` : ''}
                                    ${move.name.replace('-', ' ')}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });

        movesContainer.innerHTML = movesHTML || '<p>No moves data available.</p>';
    }

    async populateEvolutionTab(pokemon) {
        const evolutionContainer = document.getElementById('modal-pokemon-evolution');
        
        try {
            const species = await window.pokemonAPI.getPokemonSpecies(pokemon.id);
            const evolutionChainUrl = species.evolution_chain.url;
            const evolutionId = evolutionChainUrl.split('/').slice(-2, -1)[0];
            
            const evolutionChain = await window.pokemonAPI.getEvolutionChain(evolutionId);
            
            const evolutionHTML = await this.buildEvolutionChain(evolutionChain.chain);
            evolutionContainer.innerHTML = evolutionHTML;
            
            // Add click events to evolution Pokemon
            evolutionContainer.querySelectorAll('.evolution-pokemon').forEach(el => {
                el.addEventListener('click', async () => {
                    const pokemonName = el.dataset.pokemon;
                    if (pokemonName) {
                        try {
                            const evolutionPokemon = await window.pokemonAPI.getPokemon(pokemonName);
                            this.openPokemonModal(evolutionPokemon);
                        } catch (error) {
                            console.error('Error loading evolution Pokemon:', error);
                        }
                    }
                });
            });
            
        } catch (error) {
            console.error('Error loading evolution chain:', error);
            evolutionContainer.innerHTML = '<p>Evolution data unavailable.</p>';
        }
    }

    async buildEvolutionChain(chain) {
        let html = '<div class="evolution-chain">';
        let currentStage = chain;

        while (currentStage) {
            // Get evolution details
            const evolutionDetails = currentStage.evolution_details[0];
            let levelRequirement = '';
            
            if (evolutionDetails) {
                if (evolutionDetails.min_level) {
                    levelRequirement = `Level ${evolutionDetails.min_level}`;
                } else if (evolutionDetails.item) {
                    levelRequirement = evolutionDetails.item.name.replace('-', ' ');
                } else if (evolutionDetails.trigger) {
                    levelRequirement = evolutionDetails.trigger.name.replace('-', ' ');
                }
            }

            // Get Pokemon data for sprite
            try {
                const pokemon = await window.pokemonAPI.getPokemon(currentStage.species.name);
                html += `
                    <div class="evolution-pokemon" data-pokemon="${currentStage.species.name}">
                        <img src="${pokemon.sprites.front_default}" alt="${currentStage.species.name}">
                        <div class="name">${currentStage.species.name}</div>
                        ${levelRequirement ? `<div class="level">${levelRequirement}</div>` : ''}
                    </div>
                `;
            } catch (error) {
                html += `
                    <div class="evolution-pokemon" data-pokemon="${currentStage.species.name}">
                        <div class="name">${currentStage.species.name}</div>
                        ${levelRequirement ? `<div class="level">${levelRequirement}</div>` : ''}
                    </div>
                `;
            }

            if (currentStage.evolves_to.length > 0) {
                const nextEvolution = currentStage.evolves_to[0];
                const nextEvolutionDetails = nextEvolution.evolution_details[0];
                let nextRequirement = '';
                
                if (nextEvolutionDetails) {
                    if (nextEvolutionDetails.min_level) {
                        nextRequirement = `Lv. ${nextEvolutionDetails.min_level}`;
                    } else if (nextEvolutionDetails.item) {
                        nextRequirement = nextEvolutionDetails.item.name.replace('-', ' ');
                    } else if (nextEvolutionDetails.trigger && nextEvolutionDetails.trigger.name !== 'level-up') {
                        nextRequirement = nextEvolutionDetails.trigger.name.replace('-', ' ');
                    }
                }
                
                html += `
                    <div class="evolution-arrow">
                        <i class="ri-arrow-right-line"></i>
                        ${nextRequirement ? `<div class="evolution-requirement">${nextRequirement}</div>` : ''}
                    </div>
                `;
                currentStage = currentStage.evolves_to[0]; // Take first evolution path
            } else {
                break;
            }
        }

        html += '</div>';
        return html || '<div class="evolution-chain"><p>No evolution data available.</p></div>';
    }

    async populateFormsTab(pokemon) {
        const formsContainer = document.getElementById('modal-pokemon-forms');
        
        try {
            const species = await window.pokemonAPI.getPokemonSpecies(pokemon.id);
            const varieties = species.varieties || [];
            
            if (varieties.length <= 1) {
                formsContainer.innerHTML = `
                    <div class="no-forms">
                        <i class="ri-ghost-line"></i>
                        <p>This Pokémon has no alternate forms.</p>
                    </div>
                `;
                return;
            }

            let formsHTML = '<div class="forms-grid">';
            
            for (const variety of varieties) {
                try {
                    const formPokemon = await window.pokemonAPI.getPokemon(variety.pokemon.name);
                    
                    // Better form name parsing
                    let formName = variety.pokemon.name;
                    let displayName = 'Default Form';
                    let formMethod = 'Standard';
                    
                    if (!variety.is_default) {
                        // Remove base pokemon name and clean up
                        formName = formName.replace(pokemon.name + '-', '').replace(pokemon.name, '');
                        if (formName.startsWith('-')) formName = formName.substring(1);
                        
                        // Convert to display name
                        displayName = formName.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ') || 'Alternate Form';
                        
                        // Determine form method
                        const lowerFormName = formName.toLowerCase();
                        if (lowerFormName.includes('mega')) {
                            formMethod = 'Mega Evolution';
                        } else if (lowerFormName.includes('alolan')) {
                            formMethod = 'Regional Variant (Alola)';
                        } else if (lowerFormName.includes('galarian')) {
                            formMethod = 'Regional Variant (Galar)';
                        } else if (lowerFormName.includes('hisuian')) {
                            formMethod = 'Regional Variant (Hisui)';
                        } else if (lowerFormName.includes('paldean')) {
                            formMethod = 'Regional Variant (Paldea)';
                        } else if (lowerFormName.includes('gigantamax')) {
                            formMethod = 'Gigantamax';
                        } else if (lowerFormName.includes('primal')) {
                            formMethod = 'Primal Reversion';
                        } else if (lowerFormName.includes('origin')) {
                            formMethod = 'Origin Form';
                        } else if (lowerFormName.includes('sky')) {
                            formMethod = 'Sky Form';
                        } else if (lowerFormName.includes('heat') || lowerFormName.includes('wash') || 
                                 lowerFormName.includes('frost') || lowerFormName.includes('fan') || 
                                 lowerFormName.includes('mow')) {
                            formMethod = 'Rotom Form';
                        } else {
                            formMethod = 'Alternate Form';
                        }
                    }
                    
                    // Get type differences for forms
                    const typeElements = formPokemon.types.map(typeInfo => 
                        `<span class="type-badge ${typeInfo.type.name}">${typeInfo.type.name}</span>`
                    ).join('');
                    
                    // Calculate stat differences
                    const baseStats = pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
                    const formStats = formPokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
                    const statDiff = formStats - baseStats;
                    const statDiffText = statDiff > 0 ? `+${statDiff}` : statDiff < 0 ? `${statDiff}` : '±0';
                    
                    formsHTML += `
                        <div class="form-item" data-pokemon="${variety.pokemon.name}">
                            <div class="form-sprite-container">
                                <img src="${formPokemon.sprites.front_default || pokemon.sprites.front_default}" alt="${displayName}">
                            </div>
                            <div class="form-info">
                                <div class="form-name">${displayName}</div>
                                <div class="form-method">${formMethod}</div>
                                <div class="form-types">${typeElements}</div>
                                <div class="form-stats">BST: ${formStats} (${statDiffText})</div>
                            </div>
                        </div>
                    `;
                } catch (error) {
                    console.error(`Error loading form ${variety.pokemon.name}:`, error);
                }
            }
            
            formsHTML += '</div>';
            formsContainer.innerHTML = formsHTML;
            
            // Add click events to form items
            formsContainer.querySelectorAll('.form-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const pokemonName = item.dataset.pokemon;
                    if (pokemonName && pokemonName !== pokemon.name) {
                        try {
                            const formPokemon = await window.pokemonAPI.getPokemon(pokemonName);
                            this.openPokemonModal(formPokemon);
                        } catch (error) {
                            console.error('Error loading form Pokemon:', error);
                        }
                    }
                });
            });
            
        } catch (error) {
            console.error('Error loading Pokemon forms:', error);
            formsContainer.innerHTML = `
                <div class="no-forms">
                    <i class="ri-error-warning-line"></i>
                    <p>Unable to load form data.</p>
                </div>
            `;
        }
    }

    async populateLocationsTab(pokemon) {
        const locationsContainer = document.getElementById('modal-pokemon-locations');
        
        // Create tabs for different location views
        locationsContainer.innerHTML = `
            <div class="location-tabs">
                <button class="location-tab-btn active" data-tab="encounters">Encounters</button>
                <button class="location-tab-btn" data-tab="regions">All Regions</button>
            </div>
            <div class="location-tab-content" id="location-encounters">
                <div class="locations-loading">Loading encounter data...</div>
            </div>
            <div class="location-tab-content" id="location-regions" style="display: none;">
                <div class="locations-loading">Loading region data...</div>
            </div>
        `;
        
        // Setup location tab switching
        const locationTabs = locationsContainer.querySelectorAll('.location-tab-btn');
        const locationTabContents = locationsContainer.querySelectorAll('.location-tab-content');
        
        locationTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                locationTabs.forEach(t => t.classList.remove('active'));
                locationTabContents.forEach(c => c.style.display = 'none');
                
                tab.classList.add('active');
                const tabName = tab.dataset.tab;
                document.getElementById(`location-${tabName}`).style.display = 'block';
                
                // Load content if not already loaded
                if (tabName === 'regions' && !tab.dataset.loaded) {
                    this.loadAllRegionsData();
                    tab.dataset.loaded = 'true';
                }
            });
        });
        
        // Load encounter data first
        await this.loadPokemonEncounters(pokemon);
    }
    
    async loadPokemonEncounters(pokemon) {
        const encountersContainer = document.getElementById('location-encounters');
        
        try {
            const encounters = await window.pokemonAPI.getPokemonEncounters(pokemon.id);
            
            if (!encounters || encounters.length === 0) {
                encountersContainer.innerHTML = `
                    <div class="no-locations">
                        <i class="ri-map-pin-line"></i>
                        <p>No location data available for this Pokémon.</p>
                        <small>This Pokémon might be obtained through evolution, trading, or special events.</small>
                    </div>
                `;
                return;
            }

            // Group encounters by location
            const locationGroups = {};
            
            encounters.forEach(encounter => {
                const locationName = encounter.location_area.name.replace('-', ' ');
                const baseName = locationName.split(' area')[0].split(' zone')[0];
                
                if (!locationGroups[baseName]) {
                    locationGroups[baseName] = [];
                }
                
                locationGroups[baseName].push({
                    area: locationName,
                    fullData: encounter,
                    methods: encounter.version_details.map(detail => ({
                        version: detail.version.name,
                        encounters: detail.encounter_details.map(enc => ({
                            method: enc.method.name.replace('-', ' '),
                            chance: enc.chance,
                            minLevel: enc.min_level,
                            maxLevel: enc.max_level
                        }))
                    }))
                });
            });

            let locationsHTML = '';
            
            Object.entries(locationGroups).forEach(([location, areas]) => {
                locationsHTML += `
                    <div class="location-section">
                        <div class="location-header">${location}</div>
                        <div class="location-areas">
                `;
                
                areas.forEach(area => {
                    // Get encounter details
                    const encounterDetails = [];
                    area.methods.forEach(method => {
                        method.encounters.forEach(enc => {
                            encounterDetails.push({
                                method: enc.method,
                                chance: enc.chance,
                                minLevel: enc.minLevel,
                                maxLevel: enc.maxLevel,
                                version: method.version
                            });
                        });
                    });
                    
                    // Group by method
                    const methodGroups = {};
                    encounterDetails.forEach(detail => {
                        if (!methodGroups[detail.method]) {
                            methodGroups[detail.method] = [];
                        }
                        methodGroups[detail.method].push(detail);
                    });
                    
                    locationsHTML += `
                        <div class="area-item">
                            <div class="area-name">
                                <i class="ri-map-2-line"></i>
                                ${area.area.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </div>
                            <div class="encounter-methods">
                                ${Object.entries(methodGroups).map(([method, details]) => {
                                    const levels = details.map(d => d.minLevel === d.maxLevel ? `Lv.${d.minLevel}` : `Lv.${d.minLevel}-${d.maxLevel}`);
                                    const chances = details.map(d => `${d.chance}%`);
                                    const uniqueLevels = [...new Set(levels)];
                                    const uniqueChances = [...new Set(chances)];
                                    
                                    return `
                                        <div class="encounter-method">
                                            <span class="method-name">${method.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                                            <span class="method-details">
                                                ${uniqueLevels.join(', ')} 
                                                <span class="chance">(${uniqueChances.join(', ')})</span>
                                            </span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                });
                
                locationsHTML += `
                        </div>
                    </div>
                `;
            });
            
            encountersContainer.innerHTML = locationsHTML || `
                <div class="no-locations">
                    <i class="ri-map-pin-line"></i>
                    <p>No location data available.</p>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading Pokemon locations:', error);
            encountersContainer.innerHTML = `
                <div class="no-locations">
                    <i class="ri-error-warning-line"></i>
                    <p>Unable to load location data.</p>
                </div>
            `;
        }
    }
    
    async loadAllRegionsData() {
        const regionsContainer = document.getElementById('location-regions');
        
        try {
            regionsContainer.innerHTML = '<div class="locations-loading">Loading all regions...</div>';
            
            // Get all locations from API
            const locationsResponse = await window.pokemonAPI.fetchData('https://pokeapi.co/api/v2/location?limit=1000');
            
            // Group locations by region (this is a simplified approach)
            const regionGroups = {
                'Kanto': [],
                'Johto': [],
                'Hoenn': [],
                'Sinnoh': [],
                'Unova': [],
                'Kalos': [],
                'Alola': [],
                'Galar': [],
                'Paldea': [],
                'Other': []
            };
            
            // Process locations and group them
            for (const location of locationsResponse.results.slice(0, 100)) { // Limit for performance
                try {
                    const locationData = await window.pokemonAPI.fetchData(location.url);
                    const locationName = locationData.name.replace('-', ' ');
                    
                    // Simple region detection based on location names
                    let region = 'Other';
                    if (locationName.includes('kanto') || ['cerulean', 'vermilion', 'celadon', 'fuchsia', 'saffron', 'cinnabar', 'viridian', 'pewter'].some(city => locationName.includes(city))) {
                        region = 'Kanto';
                    } else if (locationName.includes('johto') || ['violet', 'azalea', 'goldenrod', 'ecruteak', 'cianwood', 'olivine', 'mahogany', 'blackthorn'].some(city => locationName.includes(city))) {
                        region = 'Johto';
                    } else if (locationName.includes('hoenn') || ['petalburg', 'rustboro', 'dewford', 'slateport', 'mauville', 'verdanturf', 'fallarbor', 'lavaridge', 'fortree', 'lilycove', 'mossdeep', 'sootopolis', 'pacifidlog', 'ever-grande'].some(city => locationName.includes(city))) {
                        region = 'Hoenn';
                    } else if (locationName.includes('sinnoh') || ['twinleaf', 'sandgem', 'jubilife', 'oreburgh', 'floaroma', 'eterna', 'hearthome', 'solaceon', 'veilstone', 'pastoria', 'celestic', 'canalave', 'snowpoint', 'sunyshore'].some(city => locationName.includes(city))) {
                        region = 'Sinnoh';
                    } else if (locationName.includes('unova') || ['nuvema', 'accumula', 'striaton', 'nacrene', 'castelia', 'nimbasa', 'driftveil', 'mistralton', 'icirrus', 'opelucid', 'lacunosa', 'undella', 'black-city', 'white-forest'].some(city => locationName.includes(city))) {
                        region = 'Unova';
                    } else if (locationName.includes('kalos') || ['vaniville', 'aquacorde', 'santalune', 'lumiose', 'camphrier', 'cyllage', 'ambrette', 'shalour', 'coumarine', 'laverre', 'dendemille', 'anistar', 'couriway', 'snowbelle'].some(city => locationName.includes(city))) {
                        region = 'Kalos';
                    } else if (locationName.includes('alola') || ['iki', 'hau-oli', 'heahea', 'paniola', 'royal-avenue', 'konikoni', 'malie', 'tapu', 'po-town', 'seafolk'].some(city => locationName.includes(city))) {
                        region = 'Alola';
                    } else if (locationName.includes('galar') || ['postwick', 'wedgehurst', 'motostoke', 'turffield', 'hulbury', 'hammerlocke', 'stow-on-side', 'ballonlea', 'circhester', 'spikemuth', 'wyndon'].some(city => locationName.includes(city))) {
                        region = 'Galar';
                    } else if (locationName.includes('paldea') || ['cabo-poco', 'mesagoza', 'artazon', 'levincia', 'cascarrafa', 'medali', 'glaseado', 'montenevera', 'alfornada'].some(city => locationName.includes(city))) {
                        region = 'Paldea';
                    }
                    
                    regionGroups[region].push({
                        name: locationName,
                        areas: locationData.areas || [],
                        id: locationData.id
                    });
                    
                } catch (error) {
                    console.error(`Error loading location ${location.name}:`, error);
                }
            }
            
            // Render regions
            let regionsHTML = '<div class="regions-grid">';
            
            Object.entries(regionGroups).forEach(([regionName, locations]) => {
                if (locations.length > 0) {
                    regionsHTML += `
                        <div class="region-section">
                            <div class="region-header">
                                <i class="ri-earth-line"></i>
                                <h3>${regionName}</h3>
                                <span class="location-count">${locations.length} locations</span>
                            </div>
                            <div class="region-locations">
                                ${locations.slice(0, 10).map(location => `
                                    <div class="region-location-item">
                                        <div class="location-name">
                                            <i class="ri-map-pin-line"></i>
                                            ${location.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </div>
                                        <div class="location-areas-count">
                                            ${location.areas.length} areas
                                        </div>
                                    </div>
                                `).join('')}
                                ${locations.length > 10 ? `<div class="more-locations">+${locations.length - 10} more locations</div>` : ''}
                            </div>
                        </div>
                    `;
                }
            });
            
            regionsHTML += '</div>';
            
            regionsContainer.innerHTML = regionsHTML || `
                <div class="no-locations">
                    <i class="ri-map-line"></i>
                    <p>Unable to load region data.</p>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading regions data:', error);
            regionsContainer.innerHTML = `
                <div class="no-locations">
                    <i class="ri-error-warning-line"></i>
                    <p>Unable to load region data.</p>
                </div>
            `;
        }
    }

    setupModalControls(pokemon) {
        // Modal close functionality
        const closeModal = document.getElementById('close-modal');
        const modal = document.getElementById('pokemon-modal');

        const closeModalHandler = () => {
            modal.style.display = 'none';
        };

        closeModal.onclick = closeModalHandler;
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModalHandler();
            }
        };

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(btn => {
            btn.onclick = () => {
                // Remove active class from all tabs
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.style.display = 'none');

                // Activate clicked tab
                btn.classList.add('active');
                const tabName = btn.dataset.tab;
                document.getElementById(`tab-${tabName}`).style.display = 'block';
            };
        });

        // Sprite toggle controls
        const toggleSpriteType = document.getElementById('toggle-sprite-type');
        const toggleSpriteStyle = document.getElementById('toggle-sprite-style');

        let isShiny = false;
        let isAnimated = false;

        if (toggleSpriteType) {
            toggleSpriteType.onclick = async () => {
                isShiny = !isShiny;
                toggleSpriteType.textContent = isShiny ? 'Shiny' : 'Regular';
                
                const spriteElement = document.getElementById('modal-pokemon-sprite');
                await window.spriteManager.updateSpriteElement(spriteElement, pokemon, { shiny: isShiny, animated: isAnimated });
            };
        }

        if (toggleSpriteStyle) {
            toggleSpriteStyle.onclick = async () => {
                isAnimated = !isAnimated;
                toggleSpriteStyle.textContent = isAnimated ? 'Animated' : 'Static';
                
                const spriteElement = document.getElementById('modal-pokemon-sprite');
                await window.spriteManager.updateSpriteElement(spriteElement, pokemon, { shiny: isShiny, animated: isAnimated });
            };
        }

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                closeModalHandler();
            }
        });
    }

    clearAllFilters() {
        // Reset filters
        this.currentFilters = {
            search: '',
            generation: '',
            types: [],
            sort: 'id'
        };

        // Reset UI elements
        const searchInput = document.getElementById('search-input');
        const generationFilter = document.getElementById('generation-filter');
        const sortFilter = document.getElementById('sort-filter');
        const typeFilters = document.querySelectorAll('.type-filter');

        if (searchInput) searchInput.value = '';
        if (generationFilter) generationFilter.value = '';
        if (sortFilter) sortFilter.value = 'id';
        
        typeFilters.forEach(filter => {
            filter.classList.remove('active');
        });

        // Apply filters
        this.applyFilters();
    }

    getResultsCount() {
        return this.filteredPokemon.length;
    }
}

// Initialize search manager
window.searchManager = new SearchManager();