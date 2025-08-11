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

    setPokemonData(pokemonData) {
        this.allPokemon = pokemonData || [];
        this.applyFilters();
        this.renderPokemonGrid();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('search-input');
        const clearSearch = document.getElementById('clear-search');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value.toLowerCase().trim();
                this.applyFilters();
                this.renderPokemonGrid();
            });
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.currentFilters.search = '';
                    this.applyFilters();
                    this.renderPokemonGrid();
                }
            });
        }

        // Generation filter
        const generationFilter = document.getElementById('generation-filter');
        if (generationFilter) {
            generationFilter.addEventListener('change', (e) => {
                this.currentFilters.generation = e.target.value;
                this.applyFilters();
                this.renderPokemonGrid();
            });
        }

        // Type filters
        const typeFilters = document.querySelectorAll('.type-filter');
        typeFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const isActive = e.target.classList.contains('active');
                
                if (isActive) {
                    e.target.classList.remove('active');
                    this.currentFilters.types = this.currentFilters.types.filter(t => t !== type);
                } else {
                    e.target.classList.add('active');
                    this.currentFilters.types.push(type);
                }
                
                this.applyFilters();
                this.renderPokemonGrid();
            });
        });

        // Sort filter
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.currentFilters.sort = e.target.value;
                this.applyFilters();
                this.renderPokemonGrid();
            });
        }

        // Clear filters
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Cache management
        const cacheManagement = document.getElementById('cache-management');
        if (cacheManagement) {
            cacheManagement.addEventListener('click', () => {
                this.showCacheManagement();
            });
        }
    }

    applyFilters() {
        let filtered = [...this.allPokemon];

        // Search filter
        if (this.currentFilters.search) {
            filtered = filtered.filter(pokemon => {
                const searchTerm = this.currentFilters.search;
                return (
                    pokemon.name.toLowerCase().includes(searchTerm) ||
                    pokemon.id.toString().includes(searchTerm) ||
                    (pokemon.species && pokemon.species.names && 
                     pokemon.species.names.some(name => 
                         name.language.name === 'en' && 
                         name.name.toLowerCase().includes(searchTerm)
                     ))
                );
            });
        }

        // Generation filter
        if (this.currentFilters.generation) {
            const gen = parseInt(this.currentFilters.generation);
            filtered = filtered.filter(pokemon => {
                return window.pokemonAPI.getGeneration(pokemon.id) === gen;
            });
        }

        // Type filters
        if (this.currentFilters.types.length > 0) {
            filtered = filtered.filter(pokemon => {
                return pokemon.types.some(type => 
                    this.currentFilters.types.includes(type.type.name)
                );
            });
        }

        // Sort
        filtered.sort((a, b) => {
            switch (this.currentFilters.sort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'base-stat-total':
                    const totalA = a.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
                    const totalB = b.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
                    return totalB - totalA;
                case 'height':
                    return b.height - a.height;
                case 'weight':
                    return b.weight - a.weight;
                case 'id':
                default:
                    return a.id - b.id;
            }
        });

        this.filteredPokemon = filtered;
    }

    clearAllFilters() {
        // Clear search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }

        // Clear generation
        const generationFilter = document.getElementById('generation-filter');
        if (generationFilter) {
            generationFilter.value = '';
        }

        // Clear type filters
        const typeFilters = document.querySelectorAll('.type-filter.active');
        typeFilters.forEach(filter => {
            filter.classList.remove('active');
        });

        // Reset sort
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.value = 'id';
        }

        // Reset filters object
        this.currentFilters = {
            search: '',
            generation: '',
            types: [],
            sort: 'id'
        };

        this.applyFilters();
        this.renderPokemonGrid();
    }

    renderPokemonGrid() {
        const pokemonGrid = document.getElementById('pokemon-grid');
        if (!pokemonGrid) return;

        if (this.filteredPokemon.length === 0) {
            pokemonGrid.innerHTML = `
                <div class="no-results">
                    <i class="ri-ghost-2-line"></i>
                    <p>No Shadow Pokémon Found</p>
                    <small>Try adjusting your search or filters</small>
                </div>
            `;
            return;
        }

        pokemonGrid.innerHTML = '';

        this.filteredPokemon.forEach(pokemon => {
            const card = this.createPokemonCard(pokemon);
            pokemonGrid.appendChild(card);
        });
    }

    createPokemonCard(pokemon) {
        const card = document.createElement('div');
        card.className = 'pokemon-card fade-in';
        card.pokemonData = pokemon;

        // Calculate base stat total
        const baseStatTotal = pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);

        card.innerHTML = `
            <div class="pokemon-card-header">
                <div class="pokemon-id">#${pokemon.id.toString().padStart(3, '0')}</div>
            </div>
            <div class="pokemon-name">${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</div>
            <img class="pokemon-sprite" src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <div class="pokemon-types">
                ${pokemon.types.map(type => 
                    `<span class="type-badge ${type.type.name}">${type.type.name}</span>`
                ).join('')}
            </div>
            <div class="pokemon-stats-preview">
                <div class="stat-item">
                    <div class="stat-label">BST</div>
                    <div class="stat-value">${baseStatTotal}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Height</div>
                    <div class="stat-value">${(pokemon.height / 10).toFixed(1)}m</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Weight</div>
                    <div class="stat-value">${(pokemon.weight / 10).toFixed(1)}kg</div>
                </div>
            </div>
        `;

        // Load sprite using sprite manager
        const sprite = card.querySelector('.pokemon-sprite');
        if (window.spriteManager && sprite) {
            window.spriteManager.updateSpriteElement(sprite, pokemon, { useShowdown: true });
        }

        // Add click event to open modal
        card.addEventListener('click', () => {
            this.showPokemonModal(pokemon);
        });

        return card;
    }

    showPokemonModal(pokemon) {
        const modal = document.getElementById('pokemon-modal');
        if (!modal) return;

        modal.currentPokemon = pokemon;
        modal.style.display = 'block';

        // Update modal content
        this.updateModalContent(pokemon);

        // Setup modal event listeners
        this.setupModalEventListeners();
    }

    updateModalContent(pokemon) {
        // Update header
        const modalName = document.getElementById('modal-pokemon-name');
        if (modalName) {
            modalName.textContent = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
        }

        // Update overview tab
        this.updateOverviewTab(pokemon);
        this.updateStatsTab(pokemon);
        this.updateMovesTab(pokemon);
        this.updateEvolutionTab(pokemon);
        this.updateFormsTab(pokemon);
        this.updateLocationsTab(pokemon);
    }

    updateOverviewTab(pokemon) {
        // Update sprite
        const modalSprite = document.getElementById('modal-pokemon-sprite');
        if (modalSprite && window.spriteManager) {
            window.spriteManager.updateSpriteElement(modalSprite, pokemon);
        }

        // Update basic info
        const idElement = document.getElementById('modal-pokemon-id');
        const heightElement = document.getElementById('modal-pokemon-height');
        const weightElement = document.getElementById('modal-pokemon-weight');
        const experienceElement = document.getElementById('modal-pokemon-experience');
        
        if (idElement) idElement.textContent = `#${pokemon.id.toString().padStart(3, '0')}`;
        if (heightElement) heightElement.textContent = `${(pokemon.height / 10).toFixed(1)} m`;
        if (weightElement) weightElement.textContent = `${(pokemon.weight / 10).toFixed(1)} kg`;
        if (experienceElement) experienceElement.textContent = pokemon.base_experience || 'Unknown';

        // Update types
        const typesContainer = document.getElementById('modal-pokemon-types');
        if (typesContainer) {
            typesContainer.innerHTML = pokemon.types.map(type => 
                `<span class="type-badge ${type.type.name}">${type.type.name}</span>`
            ).join('');
        }

        // Update abilities
        const abilitiesContainer = document.getElementById('modal-pokemon-abilities');
        if (abilitiesContainer) {
            // Load detailed abilities
            this.updateAbilitiesWithDetails(pokemon);
        }

        // Update description
        const descriptionElement = document.getElementById('modal-pokemon-description');
        if (descriptionElement) {
            if (pokemon.description) {
                descriptionElement.textContent = pokemon.description;
            } else if (pokemon.species) {
                window.pokemonAPI.getPokemonDescription(pokemon.species).then(description => {
                    descriptionElement.textContent = description;
                }).catch(error => {
                    console.error('Error getting description:', error);
                    descriptionElement.textContent = 'Description unavailable.';
                });
            } else {
                descriptionElement.textContent = 'Loading description...';
            }
        }
    }

    updateStatsTab(pokemon) {
        const statsContainer = document.getElementById('modal-pokemon-stats');
        if (!statsContainer) return;

        const statNames = {
            'hp': 'HP',
            'attack': 'Attack',
            'defense': 'Defense',
            'special-attack': 'Sp. Attack',
            'special-defense': 'Sp. Defense',
            'speed': 'Speed'
        };

        statsContainer.innerHTML = pokemon.stats.map(stat => {
            const percentage = Math.min((stat.base_stat / 255) * 100, 100);
            return `
                <div class="stat-row">
                    <div class="stat-name">${statNames[stat.stat.name] || stat.stat.name}</div>
                    <div class="stat-value-display">${stat.base_stat}</div>
                    <div class="stat-bar">
                        <div class="stat-bar-fill ${stat.stat.name}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async updateAbilitiesWithDetails(pokemon) {
        const abilitiesContainer = document.getElementById('modal-pokemon-abilities');
        if (!abilitiesContainer || !pokemon.abilities) return;

        let abilitiesHTML = '<div class="abilities-detailed">';
        
        for (const abilityData of pokemon.abilities) {
            try {
                const abilityDetails = await window.pokemonAPI.getAbility(abilityData.ability.name);
                const description = this.getAbilityDescription(abilityDetails);
                const generation = abilityDetails.generation ? abilityDetails.generation.name.replace('-', ' ').toUpperCase() : 'Unknown';
                
                abilitiesHTML += `
                    <div class="ability-detailed ${abilityData.is_hidden ? 'hidden' : ''}">
                        <div class="ability-header">
                            <span class="ability-name">${abilityData.ability.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            ${abilityData.is_hidden ? '<span class="hidden-badge">Hidden</span>' : ''}
                            <span class="ability-generation">${generation}</span>
                        </div>
                        <div class="ability-description">${description}</div>
                    </div>
                `;
            } catch (error) {
                console.error(`Error loading ability ${abilityData.ability.name}:`, error);
                abilitiesHTML += `
                    <div class="ability-detailed ${abilityData.is_hidden ? 'hidden' : ''}">
                        <div class="ability-header">
                            <span class="ability-name">${abilityData.ability.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            ${abilityData.is_hidden ? '<span class="hidden-badge">Hidden</span>' : ''}
                        </div>
                        <div class="ability-description">Description unavailable</div>
                    </div>
                `;
            }
        }
        
        abilitiesHTML += '</div>';
        abilitiesContainer.innerHTML = abilitiesHTML;
    }

    getAbilityDescription(abilityDetails) {
        if (!abilityDetails || !abilityDetails.effect_entries) {
            return 'No description available.';
        }
        
        const englishEffect = abilityDetails.effect_entries.find(entry => entry.language.name === 'en');
        if (englishEffect) {
            return englishEffect.effect || englishEffect.short_effect || 'No description available.';
        }
        
        return 'No description available.';
    }

    updateMovesTab(pokemon) {
        const movesContainer = document.getElementById('modal-pokemon-moves');
        if (!movesContainer) return;

        // Group moves by learn method
        const movesByMethod = {
            'level-up': [],
            'machine': [],
            'egg': [],
            'tutor': []
        };

        pokemon.moves.forEach(moveData => {
            moveData.version_group_details.forEach(detail => {
                const method = detail.move_learn_method.name;
                if (movesByMethod[method]) {
                    movesByMethod[method].push({
                        name: moveData.move.name,
                        level: detail.level_learned_at,
                        url: moveData.move.url
                    });
                }
            });
        });

        let movesHTML = '';
        Object.entries(movesByMethod).forEach(([method, moves]) => {
            if (moves.length > 0) {
                const methodName = method.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                // Sort moves appropriately
                if (method === 'level-up') {
                    moves.sort((a, b) => a.level - b.level);
                } else {
                    moves.sort((a, b) => a.name.localeCompare(b.name));
                }

                movesHTML += `
                    <div class="moves-section">
                        <h4>${methodName} (${moves.length})</h4>
                        <div class="moves-grid">
                            ${moves.map(move => 
                                `<div class="move-item" data-move-url="${move.url}" data-move-name="${move.name}">
                                    <div class="move-name">${move.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                                    ${method === 'level-up' && move.level > 0 ? `<div class="move-level">Lv.${move.level}</div>` : ''}
                                    <div class="move-details-btn">
                                        <i class="ri-information-line"></i>
                                    </div>
                                </div>`
                            ).join('')}
                        </div>
                    </div>
                `;
            }
        });

        movesContainer.innerHTML = movesHTML || '<div class="moves-loading">No moves data available</div>';
        
        // Add click events to move items for details
        movesContainer.querySelectorAll('.move-item').forEach(moveElement => {
            moveElement.addEventListener('click', async () => {
                const moveUrl = moveElement.dataset.moveUrl;
                const moveName = moveElement.dataset.moveName;
                
                if (moveUrl) {
                    await this.showMoveDetails(moveName, moveUrl, moveElement);
                }
            });
        });
    }

    async showMoveDetails(moveName, moveUrl, moveElement) {
        try {
            // Show loading state
            const originalContent = moveElement.innerHTML;
            moveElement.innerHTML = `
                <div class="move-loading">
                    <i class="ri-loader-4-line"></i>
                    Loading...
                </div>
            `;
            
            const moveDetails = await window.pokemonAPI.getMoveDetails(moveName);
            
            if (moveDetails) {
                const description = this.getMoveDescription(moveDetails);
                const type = moveDetails.type ? moveDetails.type.name : 'unknown';
                const power = moveDetails.power || '--';
                const accuracy = moveDetails.accuracy || '--';
                const pp = moveDetails.pp || '--';
                const damageClass = moveDetails.damage_class ? moveDetails.damage_class.name : 'unknown';
                const generation = moveDetails.generation ? moveDetails.generation.name.replace('-', ' ').toUpperCase() : 'Unknown';
                
                // Create modal for move details
                const moveModal = document.createElement('div');
                moveModal.className = 'move-details-modal';
                moveModal.innerHTML = `
                    <div class="move-details-content">
                        <div class="move-details-header">
                            <h3>${moveName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                            <button class="close-move-details">
                                <i class="ri-close-line"></i>
                            </button>
                        </div>
                        <div class="move-details-body">
                            <div class="move-stats">
                                <div class="move-stat">
                                    <span class="stat-label">Type</span>
                                    <span class="type-badge ${type}">${type}</span>
                                </div>
                                <div class="move-stat">
                                    <span class="stat-label">Category</span>
                                    <span class="stat-value">${damageClass.replace(/\b\w/g, l => l.toUpperCase())}</span>
                                </div>
                                <div class="move-stat">
                                    <span class="stat-label">Power</span>
                                    <span class="stat-value">${power}</span>
                                </div>
                                <div class="move-stat">
                                    <span class="stat-label">Accuracy</span>
                                    <span class="stat-value">${accuracy}${accuracy !== '--' ? '%' : ''}</span>
                                </div>
                                <div class="move-stat">
                                    <span class="stat-label">PP</span>
                                    <span class="stat-value">${pp}</span>
                                </div>
                                <div class="move-stat">
                                    <span class="stat-label">Generation</span>
                                    <span class="stat-value">${generation}</span>
                                </div>
                            </div>
                            <div class="move-description">
                                <h4>Description</h4>
                                <p>${description}</p>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(moveModal);
                
                // Add close event
                const closeBtn = moveModal.querySelector('.close-move-details');
                const closeModal = () => {
                    document.body.removeChild(moveModal);
                };
                
                closeBtn.addEventListener('click', closeModal);
                moveModal.addEventListener('click', (e) => {
                    if (e.target === moveModal) closeModal();
                });
                
                // Restore original content
                moveElement.innerHTML = originalContent;
            } else {
                moveElement.innerHTML = originalContent;
            }
        } catch (error) {
            console.error(`Error loading move details for ${moveName}:`, error);
            moveElement.innerHTML = originalContent;
        }
    }

    getMoveDescription(moveDetails) {
        if (!moveDetails || !moveDetails.effect_entries) {
            return 'No description available.';
        }
        
        const englishEffect = moveDetails.effect_entries.find(entry => entry.language.name === 'en');
        if (englishEffect) {
            return englishEffect.effect || englishEffect.short_effect || 'No description available.';
        }
        
        // Try flavor text as fallback
        if (moveDetails.flavor_text_entries) {
            const englishFlavor = moveDetails.flavor_text_entries.find(entry => entry.language.name === 'en');
            if (englishFlavor) {
                return englishFlavor.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            }
        }
        
        return 'No description available.';
    }

    updateEvolutionTab(pokemon) {
        const evolutionContainer = document.getElementById('modal-pokemon-evolution');
        if (!evolutionContainer) return;

        if (pokemon.evolutionChain) {
            this.renderEvolutionChain(pokemon.evolutionChain, evolutionContainer);
        } else {
            evolutionContainer.innerHTML = '<div class="evolution-loading">No evolution data available</div>';
        }
    }

    renderEvolutionChain(evolutionChain, container) {
        if (!evolutionChain || !evolutionChain.chain) {
            container.innerHTML = '<div class="evolution-loading">No evolution chain available</div>';
            return;
        }

        const chain = [];
        let current = evolutionChain.chain;

        // Build linear chain
        while (current) {
            chain.push({
                name: current.species.name,
                id: current.species.url.split('/').slice(-2, -1)[0],
                evolution_details: current.evolution_details[0] || null
            });

            current = current.evolves_to[0] || null;
        }

        if (chain.length <= 1) {
            container.innerHTML = '<div class="evolution-loading">This Pokémon does not evolve</div>';
            return;
        }

        let chainHTML = '<div class="evolution-chain">';
        
        chain.forEach((pokemon, index) => {
            // Pokemon card
            chainHTML += `
                <div class="evolution-pokemon" data-pokemon="${pokemon.name}">
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png" alt="${pokemon.name}">
                    <div class="name">${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</div>
                </div>
            `;

            // Arrow and requirement (except for last pokemon)
            if (index < chain.length - 1) {
                const nextPokemon = chain[index + 1];
                let requirement = 'Unknown';
                
                if (nextPokemon.evolution_details) {
                    const details = nextPokemon.evolution_details;
                    if (details.min_level) {
                        requirement = `Level ${details.min_level}`;
                    } else if (details.item) {
                        requirement = details.item.name.replace('-', ' ');
                    } else if (details.trigger) {
                        requirement = details.trigger.name.replace('-', ' ');
                    }
                }

                chainHTML += `
                    <div class="evolution-arrow">
                        <i class="ri-arrow-right-line"></i>
                        <div class="evolution-requirement">${requirement}</div>
                    </div>
                `;
            }
        });

        chainHTML += '</div>';
        container.innerHTML = chainHTML;

        // Add click events to evolution pokemon
        container.querySelectorAll('.evolution-pokemon').forEach(element => {
            element.addEventListener('click', async () => {
                const pokemonName = element.dataset.pokemon;
                try {
                    const evolutionPokemon = await window.pokemonAPI.getCompletePokemonData(pokemonName);
                    if (evolutionPokemon) {
                        this.updateModalContent(evolutionPokemon);
                    }
                } catch (error) {
                    console.error('Error loading evolution pokemon:', error);
                }
            });
        });
    }

    updateFormsTab(pokemon) {
        const formsContainer = document.getElementById('modal-pokemon-forms');
        if (!formsContainer) return;

        // Check if Pokemon has multiple forms or special forms
        const hasMultipleForms = pokemon.forms && pokemon.forms.length > 1;
        const hasSpecialForms = this.hasSpecialForms(pokemon);
        
        if (!hasMultipleForms && !hasSpecialForms) {
            formsContainer.innerHTML = `
                <div class="no-forms">
                    <i class="ri-shape-line"></i>
                    <p>No alternate forms available</p>
                    <small>This Pokémon only has its base form</small>
                </div>
            `;
            return;
        }

        // Get all available forms including special ones
        const allForms = this.getAllPokemonForms(pokemon);
        
        let formsHTML = '<div class="forms-grid">';
        
        allForms.forEach(form => {
            const formName = this.getFormDisplayName(form, pokemon);
            const formType = this.getFormType(form, pokemon);
            const isDefault = form.is_default || form.name === pokemon.name;
            const spriteUrl = this.getFormSpriteUrl(form, pokemon);
            const formTypes = this.getFormTypes(form, pokemon);
            const formStats = this.getFormStats(form, pokemon);
            
            formsHTML += `
                <div class="form-item ${isDefault ? 'default-form' : ''}" data-form="${form.name}">
                    <div class="form-sprite-container">
                        <img src="${spriteUrl}" alt="${formName}" 
                             onerror="this.src='${pokemon.sprites.front_default}'"
                             loading="lazy">
                    </div>
                    <div class="form-info">
                        <div class="form-name">${formName}</div>
                        <div class="form-method">${formType}</div>
                        <div class="form-types">${formTypes}</div>
                        ${formStats ? `<div class="form-stats">${formStats}</div>` : ''}
                        ${form.version_group ? `<div class="form-version">Since: ${form.version_group.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>` : ''}
                        ${form.form_description ? `<div class="form-description">${form.form_description}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        formsHTML += '</div>';
        formsContainer.innerHTML = formsHTML;
        
        // Add click events to form items
        formsContainer.querySelectorAll('.form-item').forEach(element => {
            element.addEventListener('click', () => {
                const formName = element.dataset.form;
                const form = allForms.find(f => f.name === formName);
                if (form) {
                    // Update modal sprite to show this form
                    const modalSprite = document.getElementById('modal-pokemon-sprite');
                    const newSpriteUrl = this.getFormSpriteUrl(form, pokemon);
                    if (modalSprite && newSpriteUrl) {
                        modalSprite.src = newSpriteUrl;
                    }
                    
                    // Highlight selected form
                    formsContainer.querySelectorAll('.form-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    element.classList.add('selected');
                }
            });
        });
    }

    updateLocationsTab(pokemon) {
        const locationsContainer = document.getElementById('modal-pokemon-locations');
        if (!locationsContainer) return;

        if (pokemon.encounters && pokemon.encounters.length > 0) {
            this.renderLocations(pokemon.encounters, locationsContainer);
        } else {
            locationsContainer.innerHTML = `
                <div class="no-locations">
                    <i class="ri-map-pin-line"></i>
                    <p>No location data available</p>
                    <small>This Pokémon may not be found in the wild</small>
                </div>
            `;
        }
    }

    renderLocations(encounters, container) {
        if (!encounters || encounters.length === 0) {
            container.innerHTML = `
                <div class="no-locations">
                    <i class="ri-map-pin-line"></i>
                    <p>No encounters found</p>
                    <small>This Pokémon may not appear in the wild</small>
                </div>
            `;
            return;
        }

        // Group encounters by location
        const locationGroups = {};
        encounters.forEach(encounter => {
            const locationName = encounter.location_area.name;
            if (!locationGroups[locationName]) {
                locationGroups[locationName] = [];
            }
            locationGroups[locationName].push(encounter);
        });

        let locationsHTML = '<div class="regions-grid">';
        
        Object.entries(locationGroups).forEach(([locationName, locationEncounters]) => {
            // Group version details by method and version
            const methodGroups = {};
            locationEncounters.forEach(encounter => {
                encounter.version_details.forEach(versionDetail => {
                    const method = versionDetail.encounter_details[0]?.method?.name || 'unknown';
                    const version = versionDetail.version.name;
                    
                    if (!methodGroups[method]) {
                        methodGroups[method] = {};
                    }
                    if (!methodGroups[method][version]) {
                        methodGroups[method][version] = [];
                    }
                    methodGroups[method][version].push(...versionDetail.encounter_details);
                });
            });
            
            locationsHTML += `
                <div class="region-section">
                    <div class="region-header">
                        <i class="ri-map-pin-line"></i>
                        <h3>${locationName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                        <div class="location-count">${locationEncounters.length} encounters</div>
                    </div>
                    <div class="region-locations">
                        ${Object.entries(methodGroups).map(([method, versions]) => `
                            <div class="encounter-method-group">
                                <div class="method-header">
                                    <i class="ri-search-line"></i>
                                    <span class="method-name">${method.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                </div>
                                <div class="version-details">
                                    ${Object.entries(versions).map(([version, details]) => {
                                        const minLevel = Math.min(...details.map(d => d.min_level || 0));
                                        const maxLevel = Math.max(...details.map(d => d.max_level || 0));
                                        const chance = Math.max(...details.map(d => d.chance || 0));
                                        
                                        return `
                                            <div class="version-encounter">
                                                <div class="version-info">
                                                    <span class="version-name">${version.replace('-', ' ').toUpperCase()}</span>
                                                    ${minLevel > 0 ? `<span class="level-range">Lv. ${minLevel}${maxLevel !== minLevel ? `-${maxLevel}` : ''}</span>` : ''}
                                                </div>
                                                ${chance > 0 ? `<div class="encounter-chance">${chance}%</div>` : ''}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        locationsHTML += '</div>';
        container.innerHTML = locationsHTML;
    }

    setupModalEventListeners() {
        // Close modal
        const closeModal = document.getElementById('close-modal');
        const modal = document.getElementById('pokemon-modal');
        
        if (closeModal) {
            closeModal.onclick = () => {
                modal.style.display = 'none';
            };
        }

        // Click outside to close
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };

        // Tab switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.onclick = () => {
                const targetTab = btn.dataset.tab;
                
                // Update active tab button
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show target tab content
                tabContents.forEach(content => {
                    content.style.display = content.id === `tab-${targetTab}` ? 'block' : 'none';
                });
            };
        });

        // Sprite controls in modal
        const toggleSpriteType = document.getElementById('toggle-sprite-type');
        const toggleSpriteStyle = document.getElementById('toggle-sprite-style');
        
        if (toggleSpriteType) {
            toggleSpriteType.onclick = () => {
                const isShiny = toggleSpriteType.textContent === 'Regular';
                toggleSpriteType.textContent = isShiny ? 'Shiny' : 'Regular';
                
                const modalSprite = document.getElementById('modal-pokemon-sprite');
                if (modalSprite && window.spriteManager && modal.currentPokemon) {
                    window.spriteManager.updateSpriteElement(modalSprite, modal.currentPokemon, { shiny: isShiny });
                }
            };
        }

        if (toggleSpriteStyle) {
            toggleSpriteStyle.onclick = () => {
                const isAnimated = toggleSpriteStyle.textContent === 'Static';
                toggleSpriteStyle.textContent = isAnimated ? 'Animated' : 'Static';
                
                const modalSprite = document.getElementById('modal-pokemon-sprite');
                if (modalSprite && window.spriteManager && modal.currentPokemon) {
                    window.spriteManager.updateSpriteElement(modalSprite, modal.currentPokemon, { animated: isAnimated });
                }
            };
        }
    }

    async showCacheManagement() {
        const cacheModal = document.getElementById('cache-modal');
        if (!cacheModal) return;

        cacheModal.style.display = 'block';

        // Load cache stats
        const cacheStats = document.getElementById('cache-stats');
        const cacheActions = document.getElementById('cache-actions');

        try {
            const stats = await window.pokemonAPI.getCacheStats();
            
            if (stats) {
                cacheStats.innerHTML = this.renderCacheStats(stats);
                cacheActions.style.display = 'block';
                this.setupCacheActions();
            } else {
                cacheStats.innerHTML = `
                    <div class="cache-error">
                        <i class="ri-error-warning-line"></i>
                        <p>Unable to load cache statistics</p>
                        <small>Cache management may not be available</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading cache stats:', error);
            cacheStats.innerHTML = `
                <div class="cache-error">
                    <i class="ri-error-warning-line"></i>
                    <p>Error loading cache data</p>
                    <small>${error.message}</small>
                </div>
            `;
        }

        // Setup close button
        const closeCacheModal = document.getElementById('close-cache-modal');
        if (closeCacheModal) {
            closeCacheModal.onclick = () => {
                cacheModal.style.display = 'none';
            };
        }

        // Click outside to close
        cacheModal.onclick = (e) => {
            if (e.target === cacheModal) {
                cacheModal.style.display = 'none';
            }
        };
    }

    renderCacheStats(stats) {
        const formatBytes = window.pokemonAPI.formatBytes.bind(window.pokemonAPI);
        
        return `
            <div class="cache-overview">
                <div class="cache-stat-card">
                    <div class="cache-stat-header">
                        <i class="ri-database-2-line"></i>
                        <h3>Total Cache</h3>
                    </div>
                    <div class="cache-stat-value">
                        <div class="size">${formatBytes(stats.total.size)}</div>
                        <div class="files">${stats.total.files} files</div>
                    </div>
                </div>
                
                <div class="cache-breakdown">
                    <div class="cache-item">
                        <div class="cache-item-info">
                            <i class="ri-database-line"></i>
                            <span>Pokemon Data</span>
                        </div>
                        <div class="cache-item-stats">
                            <div class="size">${formatBytes(stats.data.size)}</div>
                            <div class="files">${stats.data.files} files</div>
                        </div>
                    </div>
                    
                    <div class="cache-item">
                        <div class="cache-item-info">
                            <i class="ri-image-line"></i>
                            <span>Sprites</span>
                        </div>
                        <div class="cache-item-stats">
                            <div class="size">${formatBytes(stats.sprites.size)}</div>
                            <div class="files">${stats.sprites.files} files</div>
                        </div>
                    </div>
                    
                    <div class="cache-item">
                        <div class="cache-item-info">
                            <i class="ri-volume-up-line"></i>
                            <span>Audio</span>
                        </div>
                        <div class="cache-item-stats">
                            <div class="size">${formatBytes(stats.audio.size)}</div>
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
                            <span class="value">${((stats.performance.hits / (stats.performance.hits + stats.performance.misses)) * 100 || 0).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupCacheActions() {
        const clearDataCache = document.getElementById('clear-data-cache');
        const clearSpriteCache = document.getElementById('clear-sprite-cache');
        const clearAudioCache = document.getElementById('clear-audio-cache');
        const clearAllCache = document.getElementById('clear-all-cache');

        if (clearDataCache) {
            clearDataCache.onclick = async () => {
                if (confirm('Clear Pokemon data cache? You will need to re-download Pokemon information.')) {
                    await window.darkdexApp.clearCache('data');
                    location.reload();
                }
            };
        }

        if (clearSpriteCache) {
            clearSpriteCache.onclick = async () => {
                if (confirm('Clear sprite cache? You will need to re-download Pokemon images.')) {
                    await window.darkdexApp.clearCache('sprites');
                    location.reload();
                }
            };
        }

        if (clearAudioCache) {
            clearAudioCache.onclick = async () => {
                if (confirm('Clear audio cache? You will need to re-download sound files.')) {
                    await window.darkdexApp.clearCache('audio');
                }
            };
        }

        if (clearAllCache) {
            clearAllCache.onclick = async () => {
                if (confirm('Clear ALL cache? This will remove all downloaded data and require a complete re-download.')) {
                    await window.darkdexApp.clearCache('all');
                    location.reload();
                }
            };
        }
    }
}

// Initialize search manager
window.searchManager = new SearchManager();