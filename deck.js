(function () {
    let GG_ALL_GAME_CONFIG = {
        attributeAbbreviations: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
        notificationDuration: 3000,
        skillList: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'],
        attributeFullNames: {
            'STR': 'strength',
            'DEX': 'dexterity',
            'CON': 'constitution',
            'INT': 'intelligence',
            'WIS': 'wisdom',
            'CHA': 'charisma'
        },
        skillToAttributeMap: {
            'Acrobatics': 'DEX',
            'Animal Handling': 'WIS',
            'Arcana': 'INT',
            'Athletics': 'STR',
            'Deception': 'CHA',
            'History': 'INT',
            'Insight': 'WIS',
            'Intimidation': 'CHA',
            'Investigation': 'INT',
            'Medicine': 'WIS',
            'Nature': 'INT',
            'Perception': 'WIS',
            'Performance': 'CHA',
            'Persuasion': 'CHA',
            'Religion': 'INT',
            'Sleight of Hand': 'DEX',
            'Stealth': 'DEX',
            'Survival': 'WIS'
        },
        cardSpacing: 70,
        spellcastingClasses: ['Artificer','Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'],
    };
    const SPELLCASTING_CLASSES = [
        'Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard',
        'Artificer', 'Blood Hunter' // Including some additional classes that might be in use
    ];
    let characterCards = [];
    let spellsData = [];
    let itemsData = [];
    let weaponsData = [];
    let armorData = [];
    let premadeCharactersLoaded = false;
    let racesData = {};

    async function loadSpellsData() {
        try {
            const response = await fetch('spells.json');
            spellsData = await response.json();
        } catch (error) {
            console.error('Error loading spells data:', error);
        }
    }

    // document.getElementById('openFileButton').addEventListener('click', () => {
    //     document.getElementById('fileInput').click();
    // });

    // document.getElementById('fileInput').addEventListener('change', (event) => {
    //     const file = event.target.files[0];
    //     if (file) {
    //         const reader = new FileReader();
    //         reader.onload = (e) => {
    //             try {
    //                 const character = JSON.parse(e.target.result);
    //                 character = recalculateCharacterAC(character);
    //                 saveCharacterToLocalStorage(character);
    //                 renderCharacterCard(character);
    //             } catch (error) {
    //                 showNotification('Error parsing JSON file');
    //             }
    //         };
    //         reader.readAsText(file);
    //     }
    // });

    document.getElementById('openFileButton').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    
    document.getElementById('fileInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    let character = processCharacterData(e.target.result);
                    if (character) {
                        character = recalculateCharacterAC(character);
                        saveCharacterToLocalStorage(character);
                        renderCharacterCard(character);
                        showNotification('Character loaded successfully');
                    }
                } catch (error) {
                    console.error('Error processing character data:', error);
                    showNotification('Error loading character file');
                }
            };
            reader.readAsText(file);
        }
    });
    
 
    function processCharacterData(data) {
        let characterData;
        
        // Parse JSON if necessary
        if (typeof data === 'string') {
            try {
                characterData = JSON.parse(data);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                throw new Error('Invalid JSON format');
            }
        } else {
            characterData = data;
        }
    
        // Detect version
        const version = characterData.version || 2;  // Default to version 2 if not specified
    
        if (version >= 3) {
            // Process version 3+ format
            characterData.skills = normalizeSkills(characterData.skills);
            characterData.languages = characterData.languages || [];
            characterData.racialAbilities = characterData.racialAbilities || [];
        } else {
            // Process old version format
            characterData.skills = convertOldSkillFormat(characterData.skills);
            characterData.languages = [];  // Initialize languages array
            characterData.racialAbilities = [];  // Initialize racial abilities array
        }
    
        // Ensure all skills are present
        characterData.skills = ensureAllSkills(characterData.skills);
    
        // Common processing for both versions
        if (!characterData.spellcasting) {
            characterData.spellcasting = createDefaultSpellcasting(characterData);
        }
    
        if (!characterData.feats) {
            characterData.feats = [];
        }
    
        // Add proficiency bonus if not present
        if (!characterData.proficiencyBonus) {
            characterData.proficiencyBonus = Math.ceil(characterData.level / 4) + 1;
        }
    
        return characterData;
    }
    
    function normalizeSkills(skills) {
        const normalizedSkills = {};
        for (let [key, value] of Object.entries(skills)) {
            let normalizedKey = key.toLowerCase().replace(/\s+/g, '');
            normalizedSkills[normalizedKey] = {
                proficient: value.proficient || false,
                expertise: value.expertise || false,
                bonus: value.bonus || 0
            };
        }
        return normalizedSkills;
    }
    
    function convertOldSkillFormat(oldSkills) {
        const newSkills = {};
        for (let [key, value] of Object.entries(oldSkills)) {
            let newKey = key.toLowerCase().replace(/\s+/g, '');
            newSkills[newKey] = {
                proficient: value.proficient || false,
                expertise: value.expertise || false,
                bonus: value.bonus || 0
            };
        }
        return newSkills;
    }
    
    function ensureAllSkills(skills) {
        GG_ALL_GAME_CONFIG.skillList.forEach(skill => {
            const skillKey = skill.toLowerCase().replace(/\s+/g, '');
            if (!skills[skillKey]) {
                skills[skillKey] = { proficient: false, expertise: false, bonus: 0 };
            }
        });
        return skills;
    }
    
    function createDefaultSpellcasting(character) {
        return {
            class: character.class,
            ability: "",
            spellSaveDC: 0,
            spellAttackBonus: 0,
            spells: [],
            spellSlots: {},
            currentSpellSlots: {}
        };
    }

    document.getElementById('deleteButton').addEventListener('click', () => {
        const activeCard = document.querySelector('.character-card.active');
        if (activeCard) {
            const characterName = activeCard.querySelector('h2').textContent;
            deleteCharacterFromLocalStorage(characterName);
            activeCard.remove();
            characterCards = characterCards.filter(card => card !== activeCard);
            updateCardPositions();
            showNotification(`Deleted character: ${characterName}`);
        } else {
            showNotification('No character selected for deletion');
        }
    });

    function saveCharacterToLocalStorage(character) {
        let characters = JSON.parse(localStorage.getItem('characters') || '[]');
        const index = characters.findIndex(c => c.name === character.name);
        if (index !== -1) {
            characters[index] = {
                ...characters[index],
                ...character,
                version: 3,  // Update version number
                languages: character.languages || [],
                racialAbilities: character.racialAbilities || [],
                proficiencyBonus: character.proficiencyBonus || Math.ceil(character.level / 4) + 1
            };
        } else {
            characters.push({
                ...character,
                version: 3,  // Set version number for new characters
                languages: character.languages || [],
                racialAbilities: character.racialAbilities || [],
                proficiencyBonus: character.proficiencyBonus || Math.ceil(character.level / 4) + 1
            });
        }
        localStorage.setItem('characters', JSON.stringify(characters));
        console.log(`Saved updated character data for ${character.name}`);
    }

    function deleteCharacterFromLocalStorage(characterName) {
        let characters = JSON.parse(localStorage.getItem('characters') || '[]');
        characters = characters.filter(char => char.name !== characterName);
        localStorage.setItem('characters', JSON.stringify(characters));
    }

    function loadCharactersFromLocalStorage() {
        const characters = JSON.parse(localStorage.getItem('characters') || '[]');
        characters.forEach(character => {
            if (!document.querySelector(`.character-card[data-name="${character.name}"]`)) {
                character = assignRandomFeats(character);
                character = recalculateCharacterAC(character); // Add this line
                saveCharacterToLocalStorage(character); // Save the updated character
                renderCharacterCard(character);
            }
        });
    }

    function getBackgroundImage(character) {
        const defaultImage = 'artwork.png';
        
        console.log('Character data received:', JSON.stringify(character, null, 2));
    
        if (!character) {
            console.warn('Character object is null or undefined');
            return defaultImage;
        }
    
        let race, characterClass;
    
        // Handle potential new JSON format
        if (character.race && typeof character.race === 'object') {
            race = character.race.name || character.race.fullName;
        } else {
            race = character.race;
        }
    
        if (character.class && typeof character.class === 'object') {
            characterClass = character.class.name;
        } else {
            characterClass = character.class;
        }
    
        console.log('Extracted race:', race);
        console.log('Extracted class:', characterClass);
    
        if (!race || !characterClass) {
            console.warn('Unable to extract race or class from character data');
            return defaultImage;
        }
    
        race = race.toLowerCase();
        characterClass = characterClass.toLowerCase();
    
        let raceInitial = race === 'dragonborn' ? 'db' : 
                          race === 'tabaxi' ? 'tb' : 
                          race === 'goliath' ? 'go' : 
                          race[0];
        const specificImage = `${raceInitial}-${characterClass}.jpg`;
    
        console.log(`Attempting to load background image: ${specificImage}`);
    
        // Check if the specific image exists
        const img = new Image();
        img.onerror = function() {
            console.log(`Image ${specificImage} not found, using default.`);
            character.backgroundImage = defaultImage;
        };
        img.onload = function() {
            console.log(`Image ${specificImage} loaded successfully.`);
            character.backgroundImage = specificImage;
        };
        img.src = specificImage;
    
        // Return the default image initially, it will be updated if the specific image loads
        return defaultImage;
    }




    // function renderCharacterCard(character) {
    //     character = assignRandomFeats(character);
    //     saveCharacterToLocalStorage(character);
    
    //     console.log("Character feats after assignment:", character.feats);
    
    //     const card = document.createElement('div');
    //     card.className = 'character-card stacked';
    //     card.dataset.character = JSON.stringify(character);
    //     card.dataset.name = character.name;
    
    //     const initialBackgroundImage = getBackgroundImage(character);
    //     card.style.backgroundImage = `url(${initialBackgroundImage})`;
    
    //     const skillsHtml = GG_ALL_GAME_CONFIG.skillList.map(skill => {
    //         const skillKey = skill.toLowerCase().replace(/\s+/g, '');
    //         const skillData = character.skills[skillKey] || { proficient: false, expertise: false, bonus: 0 };
            
    //         const attributeAbbr = GG_ALL_GAME_CONFIG.skillToAttributeMap[skill];
    //         const attributeScore = character.abilityScores[GG_ALL_GAME_CONFIG.attributeFullNames[attributeAbbr]];
    //         const proficiencyBonus = skillData.proficient ? character.proficiencyBonus : 0;
    //         const expertiseBonus = skillData.expertise ? character.proficiencyBonus : 0;
    //         const totalBonus = getModifier(attributeScore) + proficiencyBonus + expertiseBonus + skillData.bonus;
    
    //         const proficiencyMarker = skillData.proficient ? '•' : '';
    //         const expertiseMarker = skillData.expertise ? '••' : '';
    
    //         return `
    //             <div class="skill">
    //                 <div class="skill-header">
    //                     <span class="skill-name">${skill}${proficiencyMarker}${expertiseMarker}</span>
    //                     <span class="skill-attribute">(${attributeAbbr})</span>
    //                 </div>
    //                 <button onclick="rollSkill('${skill}', ${totalBonus}, ${skillData.proficient}, '${attributeAbbr}')">
    //                     Roll (${totalBonus >= 0 ? '+' : ''}${totalBonus})
    //                 </button>
    //             </div>
    //         `;
    //     }).join('');
    
    //     const featEffectsHtml = generateFeatEffectsHtml(character);
    //     console.log("Generated feats HTML:", featEffectsHtml);
    
    //     const otherInfoHtml = `
    //         <div class="other-info">
    //             <h3>Languages</h3>
    //             <ul>${character.languages.map(lang => `<li>${lang}</li>`).join('')}</ul>
    //             <h3>Racial Abilities</h3>
    //             <ul>${character.racialAbilities.map(ability => `<li>${ability}</li>`).join('')}</ul>
    //         </div>
    //     `;
    
    //     card.innerHTML = `
    //         <button class="close-button" onclick="returnCardToDeck(this)">
    //             <span class="material-icons">close</span>
    //         </button>
    //         <h2>${character.name}</h2>
    //         <p>${character.race} Lvl:${character.level} ${character.class} (${character.subclass})</p>
    //         <div class="character-actions">
    //             <button class="action-button initiative-button" onclick="rollInitiative(this, ${getModifier(character.abilityScores.dexterity)})">
    //                 <span class="material-icons">casino</span> Initiative
    //             </button>
    //             <button class="action-button long-rest-button" onclick="performLongRest(this)">
    //                 <span class="material-icons">hotel</span> Long Rest
    //             </button>
    //             <button class="action-button short-rest-button" onclick="performShortRest(this)">
    //                 <span class="material-icons">coffee</span> Short Rest
    //             </button>
    //         </div>
    //         <p>HP: <span class="hp-value">${character.hp}</span>/<span class="max-hp-value">${character.maxHp}</span> | AC: <span class="ac-value">${character.ac}</span>
    //         <span class="hp-controls">
    //             <button onclick="changeHP(this, -1)"><span class="material-icons">remove</span></button>
    //             <input type="number" value="1" min="1" max="100" onchange="updateHPChange(this)">
    //             <button onclick="changeHP(this, 1)"><span class="material-icons">add</span></button>
    //         </span>
    //         <button class="add-item-button" onclick="showAddItemModal(this)">
    //             <span class="material-icons">add_box</span> Add Item
    //         </button>
    //         </p>
    //         <div class="view-buttons">
    //             <button class="active" onclick="changeView(this, 'attributes')">Attributes</button>
    //             <button onclick="changeView(this, 'skills')">Skills</button>
    //             <button onclick="changeView(this, 'inventory')">Inventory</button>
    //             <button onclick="changeView(this, 'spells')">Spells</button>
    //             <button onclick="changeView(this, 'feats')">Feats</button>
    //             <button onclick="changeView(this, 'other')">Other</button>
    //         </div>
    //         <div class="attributes">
    //             ${GG_ALL_GAME_CONFIG.attributeAbbreviations.map(attr => `
    //                 <div class="attribute">
    //                     <strong>${attr}</strong><br>
    //                     <button onclick="rollAttribute('${attr}', ${character.abilityScores[GG_ALL_GAME_CONFIG.attributeFullNames[attr]]})">
    //                         ${character.abilityScores[GG_ALL_GAME_CONFIG.attributeFullNames[attr]]}
    //                     </button><br>
    //                     ${getModifierString(character.abilityScores[GG_ALL_GAME_CONFIG.attributeFullNames[attr]])}
    //                 </div>
    //             `).join('')}
    //         </div>
    //         <div class="skills" style="display: none;">
    //             <div class="skills-container">
    //                 ${skillsHtml}
    //             </div>
    //         </div>
    //         <div class="inventory" style="display: none;">
    //             <h3>Weapons</h3>
    //             <div class="weapons-list inventory-grid"></div>
    //             <h3>Armor</h3>
    //             <div class="armor-list inventory-grid"></div>
    //             <h3>Other Items</h3>
    //             <div class="items-list inventory-grid"></div>
    //         </div>
    //         <div class="spells" style="display: none;">
    //             ${renderSpellsSection(character)}
    //         </div>
    //         <div class="feats" style="display: none;">
    //             ${featEffectsHtml}
    //             <h3>Feats List</h3>
    //             <div class="feats-list">
    //                 ${character.feats.map(featName => {
    //                     const feat = window.featsData.find(f => f.name === featName);
    //                     if (!feat) return '';
    //                     return `
    //                         <div class="feat-item">
    //                             <div class="feat-header" onclick="toggleFeatDetails(this)">
    //                                 <span>${feat.name}</span>
    //                                 <span class="material-icons chevron">expand_more</span>
    //                             </div>
    //                             <div class="feat-content">
    //                                 <p><strong>Applies to:</strong> ${feat.appliesTo}</p>
    //                                 <p><strong>Level:</strong> ${feat.level}</p>
    //                                 <p>${feat.description}</p>
    //                             </div>
    //                         </div>
    //                     `;
    //                 }).join('')}
    //             </div>
    //         </div>
    //         <div class="other" style="display: none;">
    //             ${otherInfoHtml}
    //         </div>
    //     `;
    
    //     const logBox = document.createElement('div');
    //     logBox.className = 'log-box';
    //     card.appendChild(logBox);
    
    //     document.getElementById('characterStack').appendChild(card);
    //     characterCards.push(card);
    //     updateCardPositions();
    //     updateInventoryDisplay(card, character);
    
    //     card.addEventListener('click', (event) => {
    //         if (!event.target.closest('.close-button')) {
    //             activateCard(card);
    //         }
    //     });
    
    //     console.log("Character feats:", character.feats);
    //     console.log("Feats data:", window.featsData);
    
    //     setTimeout(() => {
    //         if (character.backgroundImage && character.backgroundImage !== initialBackgroundImage) {
    //             card.style.backgroundImage = `url(${character.backgroundImage})`;
    //         }
    //     }, 100);
    
    //     return card;
    // }
    function renderCharacterCard(character) {
        character = assignRandomFeats(character);
        saveCharacterToLocalStorage(character);
    
        console.log("Rendering character card for:", character.name);
    
        const card = document.createElement('div');
        card.className = 'character-card stacked';
        card.dataset.character = JSON.stringify(character);
        card.dataset.name = character.name;
    
        const initialBackgroundImage = getBackgroundImage(character);
        card.style.backgroundImage = `url(${initialBackgroundImage})`;
    
    
        const skillsHtml = GG_ALL_GAME_CONFIG.skillList.map(skill => {
            const skillKey = skill.toLowerCase().replace(/\s+/g, '');
            const skillData = character.skills[skillKey] || { proficient: false, expertise: false, bonus: 0 };
            
            const attributeAbbr = GG_ALL_GAME_CONFIG.skillToAttributeMap[skill];
            const attributeScore = character.abilityScores[GG_ALL_GAME_CONFIG.attributeFullNames[attributeAbbr]];
            const proficiencyBonus = skillData.proficient ? character.proficiencyBonus : 0;
            const expertiseBonus = skillData.expertise ? character.proficiencyBonus : 0;
            const totalBonus = getModifier(attributeScore) + proficiencyBonus + expertiseBonus + skillData.bonus;
    
            const proficiencyMarker = skillData.proficient ? '•' : '';
            const expertiseMarker = skillData.expertise ? '••' : '';
    
            return `
                <div class="skill">
                    <div class="skill-header">
                        <span class="skill-name">${skill}${proficiencyMarker}${expertiseMarker}</span>
                        <span class="skill-attribute">(${attributeAbbr})</span>
                    </div>
                    <button onclick="rollSkill('${skill}', ${totalBonus}, ${skillData.proficient}, '${attributeAbbr}')">
                        Roll (${totalBonus >= 0 ? '+' : ''}${totalBonus})
                    </button>
                </div>
            `;
        }).join('');
    
        const featEffectsHtml = generateFeatEffectsHtml(character);
        console.log("Generated feats HTML:", featEffectsHtml);
    
        // Use races data for missing information
        const raceInfo = racesData[character.race] || {};
        const racialTraits = raceInfo.traits || {};
    
        const languagesHtml = `
            <h3>Languages</h3>
            <ul>
                ${(character.languages || racialTraits.languages || []).map(lang => `<li>${lang}</li>`).join('')}
            </ul>
        `;
    
        const racialAbilitiesHtml = `
            <h3>Racial Traits</h3>
            <ul>
                ${Object.entries(racialTraits)
                    .filter(([key, _]) => key !== 'abilityScoreIncrease' && key !== 'languages')
                    .map(([key, value]) => `<li><strong>${key}:</strong> ${stringifyTraitValue(value)}</li>`)
                    .join('')}
            </ul>
        `;
    
        const otherInfoHtml = `
            <div class="other-info">
                ${languagesHtml}
                ${racialAbilitiesHtml}
            </div>
        `;
    
        card.innerHTML = `
            <button class="close-button" onclick="returnCardToDeck(this)">
                <span class="material-icons">close</span>
            </button>
            <h2>${character.name}</h2>
            <p>${character.race} Lvl:${character.level} ${character.class} (${character.subclass || ''})</p>
            <div class="character-actions">
        <button class="action-button initiative-button" onclick="rollInitiative(this, ${getModifier(character.abilityScores.dexterity)})">
            <i class="fas fa-dice-d20"></i> Initiative
        </button>
        <button class="action-button long-rest-button" onclick="performLongRest(this)">
            <i class="fas fa-bed"></i> Long Rest
        </button>
        <button class="action-button short-rest-button" onclick="performShortRest(this)">
            <i class="fas fa-coffee"></i> Short Rest
        </button>
    </div>
            <p>HP: <span class="hp-value">${character.hp}</span>/<span class="max-hp-value">${character.maxHp}</span> | AC: <span class="ac-value">${character.ac}</span>
            <span class="hp-controls">
                <button onclick="changeHP(this, -1)"><span class="material-icons">remove</span></button>
                <input type="number" value="1" min="1" max="100" onchange="updateHPChange(this)">
                <button onclick="changeHP(this, 1)"><span class="material-icons">add</span></button>
            </span>
            <button class="add-item-button" onclick="showAddItemModal(this)">
                <span class="material-icons">add_box</span> Add Item
            </button>
            </p>
            <div class="view-buttons">
        <button class="active" onclick="changeView(this, 'attributes')" title="Attributes"><i class="fas fa-user"></i></button>
        <button onclick="changeView(this, 'skills')" title="Skills"><i class="fas fa-tools"></i></button>
        <button onclick="changeView(this, 'inventory')" title="Inventory"><i class="fas fa-suitcase"></i></button>
        <button onclick="changeView(this, 'spells')" title="Spells"><i class="fas fa-magic"></i></button>
        <button onclick="changeView(this, 'feats')" title="Feats"><i class="fas fa-award"></i></button>
        <button onclick="changeView(this, 'other')" title="Other"><i class="fas fa-ellipsis-h"></i></button>
    </div>
            <div class="attributes">
                ${GG_ALL_GAME_CONFIG.attributeAbbreviations.map(attr => `
                    <div class="attribute">
                        <strong>${attr}</strong><br>
                        <button onclick="rollAttribute('${attr}', ${character.abilityScores[GG_ALL_GAME_CONFIG.attributeFullNames[attr]]})">
                            ${character.abilityScores[GG_ALL_GAME_CONFIG.attributeFullNames[attr]]}
                        </button><br>
                        ${getModifierString(character.abilityScores[GG_ALL_GAME_CONFIG.attributeFullNames[attr]])}
                    </div>
                `).join('')}
            </div>
            <div class="skills" style="display: none;">
                <div class="skills-container">
                    ${skillsHtml}
                </div>
            </div>
            <div class="inventory" style="display: none;">
                <h3>Weapons</h3>
                <div class="weapons-list inventory-grid"></div>
                <h3>Armor</h3>
                <div class="armor-list inventory-grid"></div>
                <h3>Other Items</h3>
                <div class="items-list inventory-grid"></div>
            </div>
            <div class="spells" style="display: none;">
                ${renderSpellsSection(character)}
            </div>
            <div class="feats" style="display: none;">
                ${featEffectsHtml}
                <h3>Feats List</h3>
                <div class="feats-list">
                    ${(character.feats || []).map(featName => {
                        const feat = window.featsData.find(f => f.name === featName);
                        if (!feat) return '';
                        return `
                            <div class="feat-item">
                                <div class="feat-header" onclick="toggleFeatDetails(this)">
                                    <span>${feat.name}</span>
                                    <span class="material-icons chevron">expand_more</span>
                                </div>
                                <div class="feat-content">
                                    <p><strong>Applies to:</strong> ${feat.appliesTo}</p>
                                    <p><strong>Level:</strong> ${feat.level}</p>
                                    <p>${feat.description}</p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="other" style="display: none;">
                ${otherInfoHtml}
            </div>
        `;
    
        const logBox = document.createElement('div');
        logBox.className = 'log-box';
        card.appendChild(logBox);
    
        document.getElementById('characterStack').appendChild(card);
        characterCards.push(card);
        updateCardPositions();
        updateInventoryDisplay(card, character);
    
        card.addEventListener('click', (event) => {
            if (!event.target.closest('.close-button')) {
                activateCard(card);
            }
        });
    
        console.log("Character feats:", character.feats);
        console.log("Feats data:", window.featsData);
    
        setTimeout(() => {
            if (character.backgroundImage && character.backgroundImage !== initialBackgroundImage) {
                console.log(`Updating background image to: ${character.backgroundImage}`);
                card.style.backgroundImage = `url(${character.backgroundImage})`;
            } else {
                console.log('No update to background image necessary');
            }
        }, 100);
    
        return card;
    }
    
    function stringifyTraitValue(value) {
        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                return value.map(stringifyTraitValue).join(', ');
            } else {
                return Object.entries(value).map(([key, val]) => {
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
                    return `${formattedKey}: ${stringifyTraitValue(val)}`;
                }).join(', ');
            }
        }
        return value.toString();
    }

    // 4. Keep the toggleFeatDetails function as is
    function toggleFeatDetails(header) {
        const content = header.nextElementSibling;
        const chevron = header.querySelector('.chevron');
        if (content.style.display === 'block') {
            content.style.display = 'none';
            chevron.textContent = 'expand_more';
        } else {
            content.style.display = 'block';
            chevron.textContent = 'expand_less';
        }
    }

    function showAddItemModal(button) {
        const existingModal = document.querySelector('.add-item-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'add-item-modal';
        modal.innerHTML = `
    <div class="modal-content">
      <h3>Add Item</h3>
      <select id="item-type" onchange="updateItemSelect()">
        <option value="weapon">Weapon</option>
        <option value="armor">Armor</option>
        <option value="item">Other Item</option>
      </select>
      <select id="item-select"></select>
      <button onclick="addSelectedItem(this)">Add</button>
      <button onclick="closeModal(this)">Cancel</button>
    </div>
  `;
        document.body.appendChild(modal);
        updateItemSelect();
    }

    // Function to update the item select dropdown based on the chosen type
    function updateItemSelect() {
        const typeSelect = document.getElementById('item-type');
        const itemSelect = document.getElementById('item-select');
        const selectedType = typeSelect.value;
        let items;
        switch (selectedType) {
            case 'weapon':
                items = weaponsData;
                break;
            case 'armor':
                items = armorData;
                break;
            case 'item':
                items = itemsData;
                break;
        }
        itemSelect.innerHTML = items.map(item => `<option value="${item.name}">${item.name}</option>`).join('');
    }


    // function addSelectedItem(button) {
    //     const modal = button.closest('.add-item-modal');
    //     const card = document.querySelector('.character-card.active');
    //     if (!card) {
    //         showNotification("No active character card found.");
    //         return;
    //     }
    
    //     const character = JSON.parse(card.dataset.character);
    //     const typeSelect = modal.querySelector('#item-type');
    //     const itemSelect = modal.querySelector('#item-select');
    //     const selectedType = typeSelect.value;
    //     const selectedItemName = itemSelect.value;
    
    //     let selectedItem;
    //     switch (selectedType) {
    //         case 'weapon':
    //             selectedItem = weaponsData.find(item => item.name === selectedItemName);
    //             break;
    //         case 'armor':
    //             selectedItem = armorData.find(item => item.name === selectedItemName);
    //             break;
    //         case 'item':
    //             selectedItem = itemsData.find(item => item.name === selectedItemName);
    //             break;
    //     }
    
    //     if (selectedItem) {
    //         if (!character.inventory) character.inventory = [];
    //         character.inventory.push(selectedItem);
    
    //         if (selectedType === 'armor') {
    //             if (selectedItem.armorType === "Shield") {
    //                 updateCharacterAC(character, null, selectedItem);
    //             } else {
    //                 updateCharacterAC(character, selectedItem, null);
    //             }
    //         }
    
    //         card.dataset.character = JSON.stringify(character);
    //         updateInventoryDisplay(card, character);
    //         showNotification(`Added ${selectedItemName} to inventory.`);
    //     } else {
    //         showNotification(`Item ${selectedItemName} not found.`);
    //     }
    
    //     closeModal(button);
    // }

    function addSelectedItem(button) {
        const modal = button.closest('.add-item-modal');
        const card = document.querySelector('.character-card.active');
        if (!card) {
            showNotification("No active character card found.");
            return;
        }
    
        let character = JSON.parse(card.dataset.character);  // Changed from const to let
        const typeSelect = modal.querySelector('#item-type');
        const itemSelect = modal.querySelector('#item-select');
        const selectedType = typeSelect.value;
        const selectedItemName = itemSelect.value;
    
        let selectedItem;
        switch (selectedType) {
            case 'weapon':
                selectedItem = weaponsData.find(item => item.name === selectedItemName);
                break;
            case 'armor':
                selectedItem = armorData.find(item => item.name === selectedItemName);
                break;
            case 'item':
                selectedItem = itemsData.find(item => item.name === selectedItemName);
                break;
        }
    
        if (selectedItem) {
            if (!character.inventory) character.inventory = [];
            character.inventory.push(selectedItem);
    
            if (selectedType === 'armor') {
                if (selectedItem.armorType === "Shield") {
                    updateCharacterAC(character, null, selectedItem);
                } else {
                    updateCharacterAC(character, selectedItem, null);
                }
            }
    
            // Recalculate AC after adding item
            character = recalculateCharacterAC(character);
    
            card.dataset.character = JSON.stringify(character);
            updateInventoryDisplay(card, character);
            saveCharacterToLocalStorage(character);
            showNotification(`Added ${selectedItemName} to inventory.`);
        } else {
            showNotification(`Item ${selectedItemName} not found.`);
        }
    
        closeModal(button);
    }


    function updateCharacterAC(character, armor, shield) {
        let baseAC = 10;
        const dexModifier = Math.floor((character.abilityScores.dexterity - 10) / 2);
    
        if (armor) {
            baseAC = armor.ac;
            if (armor.addDex) {
                baseAC += Math.min(dexModifier, armor.maxDex || Infinity);
            }
        } else {
            baseAC += dexModifier;
        }
    
        // Special cases for Barbarian and Monk
        if (character.class === 'Barbarian' && !armor) {
            const conModifier = Math.floor((character.abilityScores.constitution - 10) / 2);
            baseAC += conModifier;
        } else if (character.class === 'Monk' && !armor) {
            const wisModifier = Math.floor((character.abilityScores.wisdom - 10) / 2);
            baseAC += wisModifier;
        }
    
        // Add shield bonus if a shield is equipped
        if (shield && shield.type === "armor" && shield.armorType === "Shield") {
            baseAC += shield.ac;
        }
    
        character.ac = baseAC;
        return character;
    }

    function recalculateCharacterAC(character) {
        let equippedArmor = null;
        let equippedShield = null;
    
        // Find equipped armor and shield
        character.inventory.forEach(item => {
            if (item.type === 'armor') {
                if (item.armorType === 'Shield') {
                    equippedShield = item;
                } else {
                    equippedArmor = item;
                }
            }
        });
    
        // Use the existing updateCharacterAC function
        character = updateCharacterAC(character, equippedArmor, equippedShield);
    
        return character;
    }

    // Function to remove an item from the character's inventory
    // function removeItem(button, itemName) {
    //     const card = button.closest('.character-card');
    //     const character = JSON.parse(card.dataset.character);
    //     const itemIndex = character.inventory.findIndex(item => item.name === itemName);
    //     if (itemIndex > -1) {
    //         const removedItem = character.inventory.splice(itemIndex, 1)[0];
    //         if (removedItem.type === 'armor') {
    //             // If we're removing armor, recalculate AC
    //             character.ac = 10 + Math.floor((character.abilityScores.dexterity - 10) / 2);
    //         }
    //     }
    //     card.dataset.character = JSON.stringify(character);
    //     updateInventoryDisplay(card, character);
    // }

    function removeItem(button, itemName) {
        const card = button.closest('.character-card');
        let character = JSON.parse(card.dataset.character);  // Changed from const to let
        const itemIndex = character.inventory.findIndex(item => item.name === itemName);
        if (itemIndex > -1) {
            const removedItem = character.inventory.splice(itemIndex, 1)[0];
            if (removedItem.type === 'armor') {
                // Recalculate AC after removing armor
                character = recalculateCharacterAC(character);
            }
        }
        card.dataset.character = JSON.stringify(character);
        updateInventoryDisplay(card, character);
        saveCharacterToLocalStorage(character);
        showNotification(`Removed ${itemName} from inventory.`);
    }

    function createItemHtml(item, character) {
        let itemContent = '';
        if (item.type === 'weapon') {
            const isFinesse = item.properties.includes('Finesse');
            const strMod = getModifier(character.abilityScores.strength);
            const dexMod = getModifier(character.abilityScores.dexterity);
            const toHitMod = isFinesse ? Math.max(strMod, dexMod) : strMod;
            const totalToHit = toHitMod + character.proficiencyBonus;
    
            const versatileProperty = item.properties.find(prop => prop.startsWith('Versatile'));
            const versatileDamage = versatileProperty ? versatileProperty.match(/\((.+?)\)/)[1] : null;
    
            itemContent = `
                <div class="item-actions">
                    <button onclick="rollToHit('${item.name}', ${totalToHit})">Roll to Hit (+${totalToHit})</button>
                    <button onclick="rollWeaponDamage('${item.name}', '${item.damage}', '${item.damageType}')">Damage (${item.damage})</button>
                    ${versatileDamage ? `<button onclick="rollWeaponDamage('${item.name}', '${versatileDamage}', '${item.damageType}', true)">Versatile (${versatileDamage})</button>` : ''}
                </div>
                <p>Damage Type: ${item.damageType}</p>
                <p>Properties: ${item.properties.join(', ')}</p>
            `;
        } else if (item.type === 'armor') {
            itemContent = `
                <p>AC: ${item.ac}</p>
                <p>Type: ${item.armorType}</p>
                ${item.stealthDisadvantage ? '<p>Disadvantage on Stealth checks</p>' : ''}
            `;
        }
    
        return `
            <div class="inventory-item ${item.type}-item">
                <div class="item-header" onclick="toggleItemDetails(this)">
                    <strong>${item.name}</strong>
                    <span class="material-icons chevron">expand_more</span>
                </div>
                <div class="item-content" style="display: none;">
                    ${itemContent}
                    <p>Weight: ${item.weight}</p>
                    <button class="remove-item" onclick="removeItem(this, '${item.name}')">Remove</button>
                </div>
            </div>
        `;
    }
    
    function updateInventoryDisplay(card, character) {
        const inventoryDiv = card.querySelector('.inventory');
        let totalWeight = 0;
    
        const createItemHtmlWithWeight = (item) => {
            totalWeight += parseFloat(item.weight);
            return createItemHtml(item, character);
        };
    
        const weaponsHtml = character.inventory
            .filter(item => item.type === 'weapon')
            .map(createItemHtmlWithWeight)
            .join('');
    
        const armorHtml = character.inventory
            .filter(item => item.type === 'armor')
            .map(createItemHtmlWithWeight)
            .join('');
    
        const itemsHtml = character.inventory
            .filter(item => item.type === 'gear')
            .map(createItemHtmlWithWeight)
            .join('');
    
        inventoryDiv.innerHTML = `
            <h3>Weapons</h3>
            <div class="inventory-grid weapons-list">${weaponsHtml || 'No weapons'}</div>
            <h3>Armor</h3>
            <div class="inventory-grid armor-list">${armorHtml || 'No armor'}</div>
            <h3>Other Items</h3>
            <div class="inventory-grid items-list">${itemsHtml || 'No other items'}</div>
            <div class="total-weight">Total Weight: ${totalWeight.toFixed(2)} lb</div>
        `;
    
        // Update AC display
        card.querySelector('.ac-value').textContent = character.ac;
    }
    
    function toggleItemDetails(header) {
        const content = header.nextElementSibling;
        const chevron = header.querySelector('.chevron');
        if (content.style.display === 'block') {
            content.style.display = 'none';
            chevron.textContent = 'expand_more';
        } else {
            content.style.display = 'block';
            chevron.textContent = 'expand_less';
        }
    }
    
    function rollToHit(itemName, modifier) {
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + modifier;
        showNotification(`Roll to Hit (${itemName}): ${roll} + ${modifier} = ${total}`);
    }
    
    function rollWeaponDamage(itemName, damage, damageType, isVersatile = false) {
        const [diceCount, diceFaces] = damage.split('d').map(Number);
        let damageRoll = 0;
        for (let i = 0; i < diceCount; i++) {
            damageRoll += Math.floor(Math.random() * diceFaces) + 1;
        }
        const versatileText = isVersatile ? ' (Versatile)' : '';
        showNotification(`${itemName}${versatileText} Damage: ${damageRoll} ${damageType}`);
    }

    // Function to close the modal
    function closeModal(button) {
        const modal = button.closest('.add-item-modal');
        modal.remove();
    }

    function getMaxSpellSlotLevel(character) {
        const spellcasterLevel = character.level;
        const characterClass = character.class.toLowerCase();
    
        if (characterClass === 'warlock') {
            // Warlocks have a unique spell slot progression
            if (spellcasterLevel >= 17) return 5;
            if (spellcasterLevel >= 11) return 5;
            if (spellcasterLevel >= 9) return 5;
            if (spellcasterLevel >= 7) return 4;
            if (spellcasterLevel >= 5) return 3;
            if (spellcasterLevel >= 3) return 2;
            return 1;
        } else {
            // Standard spell slot progression for other classes
            if (spellcasterLevel >= 17) return 9;
            if (spellcasterLevel >= 13) return 7;
            if (spellcasterLevel >= 9) return 5;
            if (spellcasterLevel >= 5) return 3;
            if (spellcasterLevel >= 3) return 2;
            return 1;
        }
    }

//     function renderSpellsSection(character) {
//         if (!isCharacterSpellcaster(character)) {
//             return '<p>This character cannot use magic.</p>';
//         }

//         const spellSlots = character.spellcasting?.spellSlots || {};
//         const currentSpellSlots = character.spellcasting?.currentSpellSlots || {};

//         return `
//     <div class="spell-slots">
//       ${Object.entries(spellSlots).map(([level, slots]) => `
//         <span class="spell-slot">Level ${level}: <span class="current-slots">${currentSpellSlots[level] || 0}</span>/${slots}</span>
//       `).join('')}
//     </div>
//     ${renderSpellList(character.spellcasting?.spells || [])}
//   `;
//     }


function renderSpellsSection(character) {
    if (!isCharacterSpellcaster(character)) {
        return '<p>This character cannot use magic.</p>';
    }

    const spellSlots = character.spellcasting?.spellSlots || {};
    const currentSpellSlots = character.spellcasting?.currentSpellSlots || {};
    const maxSpellSlotLevel = getMaxSpellSlotLevel(character);

    return `
    <div class="spell-slots">
      ${Object.entries(spellSlots)
        .filter(([level, _]) => parseInt(level) <= maxSpellSlotLevel)
        .map(([level, slots]) => `
          <span class="spell-slot">Level ${level}: <span class="current-slots">${currentSpellSlots[level] || 0}</span>/${slots}</span>
        `).join('')}
    </div>
    ${renderSpellList(character.spellcasting?.spells || [])}
  `;
}

    // Add a new function to check if a character is a spellcaster
    function isCharacterSpellcaster(character) {
        return SPELLCASTING_CLASSES.includes(character.class);
    }


    function renderSpellList(characterSpells) {
        if (!characterSpells || characterSpells.length === 0) {
            return '<p>This character has no spells.</p>';
        }
    
        const spellsByLevel = characterSpells.reduce((acc, spellName) => {
            const spell = spellsData.find(s => s.name === spellName);
            if (spell) {
                if (!acc[spell.level]) acc[spell.level] = [];
                acc[spell.level].push(spell);
            }
            return acc;
        }, {});
    
        return Object.entries(spellsByLevel)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([level, spells]) => `
          <div class="spell-level">
            <h3>Level ${level === '0' ? 'Cantrips' : level}</h3>
            ${spells.sort((a, b) => a.name.localeCompare(b.name)).map(spell => `
              <div class="spell-item">
                <div class="spell-header" onclick="toggleSpellDetails(this)">
                  <span>${spell.name}</span>
                  <span class="material-icons chevron">expand_more</span>
                </div>
                <div class="spell-content">
                  <p><strong>Level:</strong> ${spell.level}</p>
                  <p><strong>Classes:</strong> ${spell.classes.join(', ')}</p>
                  <p>${parseDiceNotation(spell.description, spell.level, spell.name)}</p>
                  <button class="cast-button" onclick="castSpell('${spell.name}', ${spell.level}, this)">Cast Spell</button>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('');
    }

    // function castSpell(name, level, button) {
    //     const card = button.closest('.character-card');
    //     const character = JSON.parse(card.dataset.character);
    //     if (isCharacterSpellcaster(character)) {
    //         if (level === 0) {
    //             showNotification(`Casting ${name} (Cantrip)...`);
    //         } else {
    //             const currentSlots = character.spellcasting?.currentSpellSlots?.[level] || 0;
    //             if (currentSlots > 0) {
    //                 character.spellcasting.currentSpellSlots[level]--;
    //                 card.dataset.character = JSON.stringify(character);
    //                 updateSpellSlots(card, character);
    //                 showNotification(`Casting ${name} (Level ${level})...`);
    //             } else {
    //                 showNotification(`No spell slots left for level ${level}!`);
    //             }
    //         }
    //     } else {
    //         showNotification("This character cannot cast spells.");
    //     }
    // }

    function castSpell(name, level, button) {
        let card;
        if (button) {
            card = button.closest('.character-card');
        } else {
            card = document.querySelector('.character-card.active');
        }
    
        if (!card) {
            showNotification("No active character card found.");
            return;
        }
    
        const character = JSON.parse(card.dataset.character);
        if (isCharacterSpellcaster(character)) {
            if (level === 0) {
                showNotification(`Casting ${name} (Cantrip)...`);
            } else {
                const currentSlots = character.spellcasting?.currentSpellSlots?.[level] || 0;
                if (currentSlots > 0) {
                    character.spellcasting.currentSpellSlots[level]--;
                    card.dataset.character = JSON.stringify(character);
                    updateSpellSlots(card, character);
                    showNotification(`Casting ${name} (Level ${level})...`);
                } else {
                    showNotification(`No spell slots left for level ${level}!`);
                }
            }
        } else {
            showNotification("This character cannot cast spells.");
        }
    }

    // Update the updateSpellSlots function
    function updateSpellSlots(card, character) {
        const spellSlotsDiv = card.querySelector('.spell-slots');
        if (spellSlotsDiv && character.spellcasting) {
            Object.entries(character.spellcasting.spellSlots).forEach(([level, slots]) => {
                const slotSpan = spellSlotsDiv.querySelector(`.spell-slot:nth-child(${level}) .current-slots`);
                if (slotSpan) {
                    slotSpan.textContent = character.spellcasting.currentSpellSlots[level];
                }
            });
        }
    }

    function updateCardPositions() {
        characterCards.forEach((card, index) => {
            card.style.top = `${index * GG_ALL_GAME_CONFIG.cardSpacing}px`;
            card.style.zIndex = index;
        });
    }

    function updateCardDisplay(card, character) {
        // Update AC
        const acElement = card.querySelector('.ac-value');
        if (acElement) {
            acElement.textContent = character.ac;
            if (character.acEnhancedByFeat) {
                acElement.innerHTML += ' <span class="feat-enhanced" title="Enhanced by feat">•</span>';
            }
        }

        // Update Initiative
        const initiativeButton = card.querySelector('.initiative-button');
        if (initiativeButton) {
            const initiativeBonus = getModifier(character.abilityScores.dexterity) + (character.initiativeBonus || 0);
            initiativeButton.textContent = `Initiative (${initiativeBonus >= 0 ? '+' : ''}${initiativeBonus})`;
            if (character.initiativeEnhancedByFeat) {
                initiativeButton.innerHTML += ' <span class="feat-enhanced" title="Enhanced by feat">•</span>';
            }
        }

        // Update the character data stored in the card
        card.dataset.character = JSON.stringify(character);
    }

    // Modify the activateCard function to use the new system
    function activateCard(card) {
        characterCards.forEach(c => c.classList.add('stacked'));
        card.classList.remove('stacked');
        card.classList.add('active');
        card.style.top = '0';
        card.style.zIndex = '100';

        let character = JSON.parse(card.dataset.character);
        character = handleInteractiveFeatEffects(character);
        applyFeatEffects(character);
        updateCardDisplay(card, character);
        saveCharacterToLocalStorage(character);
    }


    function returnCardToDeck(closeButton) {
        const card = closeButton.closest('.character-card');
        card.classList.add('stacked');
        card.classList.remove('active');
        updateCardPositions();
    }

    function getModifier(score) {
        return Math.floor((score - 10) / 2);
    }

    function getModifierString(score) {
        const modifier = getModifier(score);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    function rollAttribute(attr, score) {
        const roll = Math.floor(Math.random() * 20) + 1;
        const modifier = getModifier(score);
        const total = roll + modifier;
        showNotification(`${attr} Roll: ${roll} ${getModifierString(score)} = ${total}`);
    }

    function rollSkill(skill, bonus, proficient, attributeAbbr) {
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + bonus;
        const message = `${skill} (${attributeAbbr}) Roll: ${roll} ${bonus >= 0 ? '+' : ''}${bonus} = ${total} ${proficient ? '(Proficient)' : ''}`;
        showNotification(message);
    }

    function rollWeapon(name, damage, damageType) {
        const [diceCount, diceFaces] = damage.split('d').map(Number);
        let damageRoll = 0;
        for (let i = 0; i < diceCount; i++) {
            damageRoll += Math.floor(Math.random() * diceFaces) + 1;
        }
        showNotification(`${name} Attack: ${damageRoll} ${damageType} damage`);
    }



    function toggleSpellDetails(header) {
        const content = header.nextElementSibling;
        const chevron = header.querySelector('.chevron');
        if (content.style.display === 'block') {
            content.style.display = 'none';
            // chevron.textContent = 'expand_more';
        } else {
            content.style.display = 'block';
            // chevron.textContent = 'expand_less';
        }
    }


    function changeView(button, view) {
        const card = button.closest('.character-card');
        card.querySelectorAll('.view-buttons button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    
        const sections = card.querySelectorAll('.attributes, .skills, .inventory, .spells, .feats, .other');
        sections.forEach(section => {
            if (section.classList.contains(view)) {
                section.style.display = view === 'attributes' || view === 'skills' ? 'flex' : 'block';
            } else {
                section.style.display = 'none';
            }
        });
    }

    function showNotification(message) {
        const notification = document.getElementById('notificationArea');
        notification.textContent = message;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, GG_ALL_GAME_CONFIG.notificationDuration);
        const activeCard = document.querySelector('.character-card.active');
        if (activeCard) {
            const logBox = activeCard.querySelector('.log-box');
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = message;
            logBox.insertBefore(logEntry, logBox.firstChild);
        }
    }

    function changeHP(button, change) {
        const card = button.closest('.character-card');
        const hpSpan = card.querySelector('.hp-value');
        const maxHpSpan = card.querySelector('.max-hp-value');
        const input = card.querySelector('.hp-controls input');
        const currentHP = parseInt(hpSpan.textContent);
        const maxHP = parseInt(maxHpSpan.textContent);
        const changeAmount = parseInt(input.value) * change;
        const newHP = Math.min(maxHP, Math.max(0, currentHP + changeAmount));
        hpSpan.textContent = newHP;
        showNotification(`HP ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(newHP - currentHP)}`);
    }

    function updateHPChange(input) {
        input.value = Math.max(1, Math.min(100, input.value));
    }

    function rollInitiative(button, dexModifier) {
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + dexModifier;
        showNotification(`Initiative Roll: ${roll} ${dexModifier >= 0 ? '+' : ''}${dexModifier} = ${total}`);
    }


    function parseDiceNotation(description, spellLevel, spellName) {
        const diceRegex = /{@(?:dice|damage) ([^}]+)}/g;
        return description.replace(diceRegex, (match, diceNotation) => {
            return `<button class="dice-roll-button" onclick="rollDice('${diceNotation}', ${spellLevel}, '${spellName}')">${diceNotation}</button>`;
        });
    }

    // Add short rest function
    function shortRest(character) {
        const hitDiceToUse = prompt(`How many hit dice would you like to use? (Available: ${character.currentHitDice})`);
        let hpRecovered = 0;
        for (let i = 0; i < hitDiceToUse; i++) {
            const hitDieRoll = Math.floor(Math.random() * character.hitDie.faces) + 1;
            hpRecovered += hitDieRoll + Math.floor((character.abilityScores.constitution - 10) / 2);
        }
        character.hp = Math.min(character.maxHp, character.hp + hpRecovered);
        character.currentHitDice -= hitDiceToUse;

        if (character.class === 'Warlock' && character.spellcasting) {
            Object.keys(character.spellcasting.spellSlots).forEach(level => {
                character.spellcasting.currentSpellSlots[level] = character.spellcasting.spellSlots[level];
            });
            showNotification(`Short rest completed. Recovered ${hpRecovered} HP. Warlock spell slots restored.`);
        } else {
            showNotification(`Short rest completed. Recovered ${hpRecovered} HP.`);
        }
        return character;
    }

    function rollDice(diceNotation, spellLevel, spellName) {
        const [count, sides] = diceNotation.split('d').map(Number);
        let total = 0;
        const rolls = [];
        for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            total += roll;
            rolls.push(roll);
        }
        const result = `Cast ${spellName} (Level ${spellLevel}): Rolled ${diceNotation}: ${rolls.join(' + ')} = ${total}`;
        showNotification(result);
        logRoll(result);

        // Update spell slots if it's not a cantrip
        if (spellLevel > 0) {
            const activeCard = document.querySelector('.character-card.active');
            if (activeCard) {
                const character = JSON.parse(activeCard.dataset.character);
                if (character.spellcasting && character.spellcasting.currentSpellSlots[spellLevel] > 0) {
                    character.spellcasting.currentSpellSlots[spellLevel]--;
                    activeCard.dataset.character = JSON.stringify(character);
                    updateSpellSlots(activeCard, character);
                }
            }
        }
    }

    function logRoll(result) {
        const activeCard = document.querySelector('.character-card.active');
        if (activeCard) {
            const logBox = activeCard.querySelector('.log-box');
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = result;
            logBox.insertBefore(logEntry, logBox.firstChild);
        }
    }

    document.getElementById('loadPremadeButton').addEventListener('click', loadPremadeCharacters);

    // async function loadPremadeCharacters() {
    //     if (premadeCharactersLoaded) {
    //         showNotification("Premade characters have already been loaded.");
    //         return;
    //     }

    //     const button = document.getElementById('loadPremadeButton');
    //     button.disabled = true;
    //     button.textContent = 'Loading...';

    //     try {
    //         const premadeCharacters = [
    //             'Bree.json',
    //             'Cade.json',
    //             'Deva.json',
    //             'Jasper.json',
    //             'Jovah.json',
    //             'Lark.json',
    //             'Gregory.json'
    //         ];

    //         const characters = await Promise.all(premadeCharacters.map(async (file) => {
    //             const response = await fetch(`premade/${file}`);
    //             return response.json();
    //         }));

    //         let loadedCount = 0;
    //         characters.forEach(character => {
    //             if (!characterExistsInLocalStorage(character.name)) {
    //                 character = recalculateCharacterAC(character); // Add this line
    //                 saveCharacterToLocalStorage(character);
    //                 renderCharacterCard(character);
    //                 loadedCount++;
    //             }
    //         });

    //         showNotification(`Loaded ${loadedCount} new premade characters.`);
    //         premadeCharactersLoaded = true;
    //         button.textContent = 'Premade Characters Loaded';
    //     } catch (error) {
    //         console.error('Error loading premade characters:', error);
    //         showNotification('Failed to load premade characters.');
    //         button.disabled = false;
    //         button.textContent = 'Load Premade Characters';
    //     }
    // }

    async function loadPremadeCharacters() {
        if (premadeCharactersLoaded) {
            showNotification("Premade characters have already been loaded.");
            return;
        }
    
        const button = document.getElementById('loadPremadeButton');
        button.disabled = true;
        button.textContent = 'Loading...';
    
        try {
            const premadeCharacters = [
                'Bree.json', 'Cade.json', 'Deva.json', 'Jasper.json', 'Jovah.json', 'Lark.json', 'Gregory.json', 'Luna.json'
            ];
    
            const characters = await Promise.all(premadeCharacters.map(async (file) => {
                const response = await fetch(`premade/${file}`);
                return response.json();
            }));
    
            let loadedCount = 0;
            characters.forEach(character => {
                if (!characterExistsInLocalStorage(character.name)) {
                    // Handle potential version differences
                    character.languages = character.languages || [];
                    character.racialAbilities = character.racialAbilities || [];
                    character.feats = character.feats || [];
                    character.subclass = character.subclass || '';
    
                    character = recalculateCharacterAC(character);
                    saveCharacterToLocalStorage(character);
                    renderCharacterCard(character);
                    loadedCount++;
                }
            });
    
            showNotification(`Loaded ${loadedCount} new premade characters.`);
            premadeCharactersLoaded = true;
            button.textContent = 'Premade Characters Loaded';
        } catch (error) {
            console.error('Error loading premade characters:', error);
            showNotification('Failed to load premade characters.');
            button.disabled = false;
            button.textContent = 'Load Premade Characters';
        }
    }

    function characterExistsInLocalStorage(characterName) {
        const characters = JSON.parse(localStorage.getItem('characters') || '[]');
        return characters.some(char => char.name === characterName);
    }

    // Don't forget to update the character data in localStorage after assigning feats
    function updateCharacterInLocalStorage(character) {
        let characters = JSON.parse(localStorage.getItem('characters') || '[]');
        const index = characters.findIndex(c => c.name === character.name);
        if (index !== -1) {
            characters[index] = character;
            localStorage.setItem('characters', JSON.stringify(characters));
        }
    }

    // the feats system...


    // Update the assignRandomFeats function
    function assignRandomFeats(character) {
        if (!character.feats || character.feats.length === 0) {
            character.feats = [];
            const featCount = Math.floor(character.level / 4) + 1; // 1 feat at level 1, then every 4 levels

            for (let i = 0; i < featCount; i++) {
                const availableFeats = window.featsData.filter(feat =>
                    feat.appliesTo === "All classes" || feat.appliesTo.includes(character.class)
                );
                if (availableFeats.length > 0) {
                    const randomFeat = availableFeats[Math.floor(Math.random() * availableFeats.length)];
                    if (!character.feats.includes(randomFeat.name)) {
                        character.feats.push(randomFeat.name);
                    }
                }
            }
            console.log(`Assigned ${character.feats.length} random feats to ${character.name}`);
        }
        return character;
    }


    // Add this function to handle interactive feat effects
    function handleInteractiveFeatEffects(character) {
        character.feats.forEach(featName => {
            const feat = window.featsData.find(f => f.name === featName);
            if (!feat) return;

            switch (feat.name) {
                case "Athlete":
                    if (!getFeatInteraction(character.name, "Athlete")) {
                        const chosenAbility = prompt("Athlete feat: Choose which ability to increase by 1: STR or DEX").toUpperCase();
                        if (chosenAbility === "STR" || chosenAbility === "DEX") {
                            character.abilityScores[chosenAbility.toLowerCase()] += 1;
                            saveFeatInteraction(character.name, "Athlete", chosenAbility);
                        }
                    }
                    break;

                case "Actor":
                    if (!getFeatInteraction(character.name, "Actor")) {
                        character.abilityScores.charisma += 1;
                        saveFeatInteraction(character.name, "Actor", true);
                    }
                    break;

                case "Durable":
                    if (!getFeatInteraction(character.name, "Durable")) {
                        character.abilityScores.constitution += 1;
                        saveFeatInteraction(character.name, "Durable", true);
                    }
                    break;

                case "Elemental Adept":
                    if (!getFeatInteraction(character.name, "Elemental Adept")) {
                        const element = prompt("Elemental Adept feat: Choose an element (acid, cold, fire, lightning, or thunder):").toLowerCase();
                        if (["acid", "cold", "fire", "lightning", "thunder"].includes(element)) {
                            saveFeatInteraction(character.name, "Elemental Adept", element);
                        }
                    }
                    break;

                case "Heavily Armored":
                    if (!getFeatInteraction(character.name, "Heavily Armored")) {
                        character.abilityScores.strength += 1;
                        character.armorProficiencies = character.armorProficiencies || [];
                        if (!character.armorProficiencies.includes("Heavy")) {
                            character.armorProficiencies.push("Heavy");
                        }
                        saveFeatInteraction(character.name, "Heavily Armored", true);
                    }
                    break;

                case "Heavy Armor Master":
                    if (!getFeatInteraction(character.name, "Heavy Armor Master")) {
                        character.abilityScores.strength += 1;
                        saveFeatInteraction(character.name, "Heavy Armor Master", true);
                    }
                    break;

                case "Keen Mind":
                    if (!getFeatInteraction(character.name, "Keen Mind")) {
                        character.abilityScores.intelligence += 1;
                        saveFeatInteraction(character.name, "Keen Mind", true);
                    }
                    break;

                case "Lightly Armored":
                    console.log("Checking Lightly Armored feat for", character.name);
                    const existingInteraction = getFeatInteraction(character.name, "Lightly Armored");
                    console.log("Existing interaction:", existingInteraction);

                    if (!existingInteraction) {
                        console.log("No existing interaction found, prompting for choice");
                        const chosenAbility = prompt("Lightly Armored feat: Choose which ability to increase by 1: STR or DEX").toUpperCase();
                        if (chosenAbility === "STR" || chosenAbility === "DEX") {
                            console.log("Chosen ability:", chosenAbility);
                            character.abilityScores[chosenAbility.toLowerCase()] += 1;
                            character.armorProficiencies = character.armorProficiencies || [];
                            if (!character.armorProficiencies.includes("Light")) {
                                character.armorProficiencies.push("Light");
                            }
                            saveFeatInteraction(character.name, "Lightly Armored", chosenAbility);
                            console.log("Interaction saved");
                        }
                    } else {
                        console.log("Existing interaction found, applying saved choice");
                        character.armorProficiencies = character.armorProficiencies || [];
                        if (!character.armorProficiencies.includes("Light")) {
                            character.armorProficiencies.push("Light");
                        }
                    }
                    break;

                case "Linguist":
                    if (!getFeatInteraction(character.name, "Linguist")) {
                        character.abilityScores.intelligence += 1;
                        character.languagesKnown = (character.languagesKnown || 0) + 3;
                        saveFeatInteraction(character.name, "Linguist", true);
                    }
                    break;

                case "Magic Initiate":
                    if (!getFeatInteraction(character.name, "Magic Initiate")) {
                        const chosenClass = prompt("Magic Initiate feat: Choose a class for your spells (e.g., Bard, Cleric, Druid, Sorcerer, Warlock, Wizard):");
                        if (chosenClass) {
                            alert(`You can choose 2 cantrips and 1 1st-level spell from the ${chosenClass} spell list. Consult with your DM to make these choices.`);
                            saveFeatInteraction(character.name, "Magic Initiate", chosenClass);
                        }
                    }
                    break;

                case "Martial Adept":
                    if (!getFeatInteraction(character.name, "Martial Adept")) {
                        alert("Martial Adept feat: You can choose two maneuvers from the Battle Master archetype. Consult with your DM to make these choices.");
                        saveFeatInteraction(character.name, "Martial Adept", true);
                    }
                    break;

                case "Moderately Armored":
                    if (!getFeatInteraction(character.name, "Moderately Armored")) {
                        const chosenAbility = prompt("Moderately Armored feat: Choose which ability to increase by 1: STR or DEX").toUpperCase();
                        if (chosenAbility === "STR" || chosenAbility === "DEX") {
                            character.abilityScores[chosenAbility.toLowerCase()] += 1;
                            character.armorProficiencies = character.armorProficiencies || [];
                            if (!character.armorProficiencies.includes("Medium")) {
                                character.armorProficiencies.push("Medium");
                            }
                            if (!character.armorProficiencies.includes("Shield")) {
                                character.armorProficiencies.push("Shield");
                            }
                            saveFeatInteraction(character.name, "Moderately Armored", chosenAbility);
                        }
                    }
                    break;

                case "Observant":
                    if (!getFeatInteraction(character.name, "Observant")) {
                        const chosenAbility = prompt("Observant feat: Choose which ability to increase by 1: INT or WIS").toUpperCase();
                        if (chosenAbility === "INT" || chosenAbility === "WIS") {
                            character.abilityScores[chosenAbility.toLowerCase()] += 1;
                            saveFeatInteraction(character.name, "Observant", chosenAbility);
                        }
                    }
                    break;

                case "Resilient":
                    if (!getFeatInteraction(character.name, "Resilient")) {
                        const abilities = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
                        const chosenAbility = prompt(`Resilient feat: Choose an ability to increase by 1 and gain saving throw proficiency (${abilities.join(", ")})`).toUpperCase();
                        if (abilities.includes(chosenAbility)) {
                            character.abilityScores[chosenAbility.toLowerCase()] += 1;
                            character.savingThrowProficiencies = character.savingThrowProficiencies || [];
                            if (!character.savingThrowProficiencies.includes(chosenAbility)) {
                                character.savingThrowProficiencies.push(chosenAbility);
                            }
                            saveFeatInteraction(character.name, "Resilient", chosenAbility);
                        }
                    }
                    break;

                case "Ritual Caster":
                    if (!getFeatInteraction(character.name, "Ritual Caster")) {
                        const chosenClass = prompt("Ritual Caster feat: Choose a class for your ritual spells (e.g., Bard, Cleric, Druid, Wizard):");
                        if (chosenClass) {
                            alert(`You can choose 2 1st-level ritual spells from the ${chosenClass} spell list. Consult with your DM to make these choices.`);
                            saveFeatInteraction(character.name, "Ritual Caster", chosenClass);
                        }
                    }
                    break;

                case "Skilled":
                    if (!getFeatInteraction(character.name, "Skilled")) {
                        alert("Skilled feat: You gain proficiency in any combination of three skills or tools. Consult with your DM to make these choices.");
                        saveFeatInteraction(character.name, "Skilled", true);
                    }
                    break;

                case "Tavern Brawler":
                    if (!getFeatInteraction(character.name, "Tavern Brawler")) {
                        const chosenAbility = prompt("Tavern Brawler feat: Choose which ability to increase by 1: STR or CON").toUpperCase();
                        if (chosenAbility === "STR" || chosenAbility === "CON") {
                            character.abilityScores[chosenAbility.toLowerCase()] += 1;
                            saveFeatInteraction(character.name, "Tavern Brawler", chosenAbility);
                        }
                    }
                    break;

                case "Weapon Master":
                    if (!getFeatInteraction(character.name, "Weapon Master")) {
                        const chosenAbility = prompt("Weapon Master feat: Choose which ability to increase by 1: STR or DEX").toUpperCase();
                        if (chosenAbility === "STR" || chosenAbility === "DEX") {
                            character.abilityScores[chosenAbility.toLowerCase()] += 1;
                            alert("You gain proficiency with four weapons of your choice. Consult with your DM to make these choices.");
                            saveFeatInteraction(character.name, "Weapon Master", chosenAbility);
                        }
                    }
                    break;

                case "Alert":
                    if (!getFeatInteraction(character.name, "Alert")) {
                        character.initiativeBonus = (character.initiativeBonus || 0) + 5;
                        character.cannotBeSurprised = true;
                        character.noHiddenAttackerAdvantage = true;
                        saveFeatInteraction(character.name, "Alert", true);
                    }
                    break;

                case "Charger":
                    if (!getFeatInteraction(character.name, "Charger")) {
                        // No direct stat changes, but track it for gameplay effects
                        saveFeatInteraction(character.name, "Charger", true);
                    }
                    break;

                case "Crossbow Expert":
                    if (!getFeatInteraction(character.name, "Crossbow Expert")) {
                        // No direct stat changes, but track it for gameplay effects
                        saveFeatInteraction(character.name, "Crossbow Expert", true);
                    }
                    break;

                case "Defensive Duelist":
                    if (!getFeatInteraction(character.name, "Defensive Duelist")) {
                        // No direct stat changes, but track it for AC calculations in combat
                        saveFeatInteraction(character.name, "Defensive Duelist", true);
                    }
                    break;

                case "Dual Wielder":
                    if (!getFeatInteraction(character.name, "Dual Wielder")) {
                        character.ac += 1; // +1 to AC when wielding separate melee weapon in each hand
                        saveFeatInteraction(character.name, "Dual Wielder", true);
                    }
                    break;

                case "Dungeon Delver":
                    if (!getFeatInteraction(character.name, "Dungeon Delver")) {
                        // No direct stat changes, but track it for gameplay effects
                        saveFeatInteraction(character.name, "Dungeon Delver", true);
                    }
                    break;

                case "Grappler":
                    if (!getFeatInteraction(character.name, "Grappler")) {
                        // No direct stat changes, but track it for gameplay effects
                        saveFeatInteraction(character.name, "Grappler", true);
                    }
                    break;

                case "Great Weapon Master":
                    if (!getFeatInteraction(character.name, "Great Weapon Master")) {
                        // No direct stat changes, but track it for damage calculations
                        saveFeatInteraction(character.name, "Great Weapon Master", true);
                    }
                    break;

                case "Healer":
                    if (!getFeatInteraction(character.name, "Healer")) {
                        // No direct stat changes, but track it for healing effects
                        saveFeatInteraction(character.name, "Healer", true);
                    }
                    break;

                case "Inspiring Leader":
                    if (!getFeatInteraction(character.name, "Inspiring Leader")) {
                        // No direct stat changes, but track it for temporary HP calculations
                        saveFeatInteraction(character.name, "Inspiring Leader", true);
                    }
                    break;

                case "Lucky":
                    if (!getFeatInteraction(character.name, "Lucky")) {
                        character.luckyPoints = 3; // Reset to 3 every long rest
                        saveFeatInteraction(character.name, "Lucky", true);
                    }
                    break;

                case "Mage Slayer":
                    if (!getFeatInteraction(character.name, "Mage Slayer")) {
                        // No direct stat changes, but track it for gameplay effects
                        saveFeatInteraction(character.name, "Mage Slayer", true);
                    }
                    break;

                case "Medium Armor Master":
                    if (!getFeatInteraction(character.name, "Medium Armor Master")) {
                        // This might affect AC calculation, but depends on the armor worn
                        saveFeatInteraction(character.name, "Medium Armor Master", true);
                    }
                    break;

                case "Mobile":
                    if (!getFeatInteraction(character.name, "Mobile")) {
                        character.speed += 10; // Increase speed by 10 feet
                        saveFeatInteraction(character.name, "Mobile", true);
                    }
                    break;

                case "Mounted Combatant":
                    if (!getFeatInteraction(character.name, "Mounted Combatant")) {
                        // No direct stat changes, but track it for gameplay effects
                        saveFeatInteraction(character.name, "Mounted Combatant", true);
                    }
                    break;

                case "Polearm Master":
                    if (!getFeatInteraction(character.name, "Polearm Master")) {
                        // No direct stat changes, but track it for attack opportunities
                        saveFeatInteraction(character.name, "Polearm Master", true);
                    }
                    break;

                case "Savage Attacker":
                    if (!getFeatInteraction(character.name, "Savage Attacker")) {
                        // No direct stat changes, but track it for damage rerolls
                        saveFeatInteraction(character.name, "Savage Attacker", true);
                    }
                    break;

                case "Sentinel":
                    if (!getFeatInteraction(character.name, "Sentinel")) {
                        // No direct stat changes, but track it for attack opportunities
                        saveFeatInteraction(character.name, "Sentinel", true);
                    }
                    break;

                case "Sharpshooter":
                    if (!getFeatInteraction(character.name, "Sharpshooter")) {
                        // No direct stat changes, but track it for ranged attack calculations
                        saveFeatInteraction(character.name, "Sharpshooter", true);
                    }
                    break;

                case "Shield Master":
                    if (!getFeatInteraction(character.name, "Shield Master")) {
                        // This affects Dexterity saving throws, but implementation depends on when the shield is equipped
                        saveFeatInteraction(character.name, "Shield Master", true);
                    }
                    break;

                case "Skulker":
                    if (!getFeatInteraction(character.name, "Skulker")) {
                        // No direct stat changes, but track it for hiding and stealth effects
                        saveFeatInteraction(character.name, "Skulker", true);
                    }
                    break;

                case "Spell Sniper":
                    if (!getFeatInteraction(character.name, "Spell Sniper")) {
                        // No direct stat changes, but track it for spell range calculations
                        saveFeatInteraction(character.name, "Spell Sniper", true);
                    }
                    break;

                case "Tough":
                    if (!getFeatInteraction(character.name, "Tough")) {
                        const hpIncrease = character.level * 2;
                        character.maxHp += hpIncrease;
                        character.hp += hpIncrease;
                        saveFeatInteraction(character.name, "Tough", true);
                    }
                    break;

                case "War Caster":
                    if (!getFeatInteraction(character.name, "War Caster")) {
                        // No direct stat changes, but track it for concentration checks and spell casting
                        saveFeatInteraction(character.name, "War Caster", true);
                    }
                    break;
            }
        });

        return character;
    }


    function applyFeatEffects(character) {
        if (!character.feats || character.feats.length === 0) return character;

        character.feats.forEach(featName => {
            const feat = window.featsData.find(f => f.name === featName);
            if (!feat) return;

            switch (feat.name) {
                case "Alert":
                    handleFeatInteraction(character, "Alert", (char) => {
                        char.initiativeBonus = (char.initiativeBonus || 0) + 5;
                        char.cannotBeSurprised = true;
                        char.noHiddenAttackerAdvantage = true;
                        return true;
                    });
                    break;

                case "Athlete":
                    handleFeatInteraction(character, "Athlete", (char, existingChoice) => {
                        if (!existingChoice) {
                            const chosenAbility = prompt("Athlete feat: Choose which ability to increase by 1: STR or DEX");
                            if (chosenAbility === null) return null;
                            const upperChoice = chosenAbility.toUpperCase();
                            if (upperChoice === "STR" || upperChoice === "DEX") {
                                char.abilityScores[upperChoice.toLowerCase()] += 1;
                                return upperChoice;
                            }
                        } else {
                            char.abilityScores[existingChoice.toLowerCase()] += 1;
                        }
                        char.athleteFeatBenefits = true;
                    });
                    break;

                case "Actor":
                    handleFeatInteraction(character, "Actor", (char) => {
                        char.abilityScores.charisma += 1;
                        char.actorFeatBenefits = true;
                        return true;
                    });
                    break;

                case "Charger":
                    handleFeatInteraction(character, "Charger", (char) => {
                        char.chargerFeatBenefits = true;
                        return true;
                    });
                    break;

                case "Crossbow Expert":
                    handleFeatInteraction(character, "Crossbow Expert", (char) => {
                        char.crossbowExpertBenefits = true;
                        return true;
                    });
                    break;

                case "Defensive Duelist":
                    handleFeatInteraction(character, "Defensive Duelist", (char) => {
                        char.defensiveDuelistBenefits = true;
                        return true;
                    });
                    break;

                case "Dual Wielder":
                    handleFeatInteraction(character, "Dual Wielder", (char) => {
                        char.ac += 1;
                        char.dualWielderBenefits = true;
                        return true;
                    });
                    break;

                case "Dungeon Delver":
                    handleFeatInteraction(character, "Dungeon Delver", (char) => {
                        char.dungeonDelverBenefits = true;
                        return true;
                    });
                    break;

                case "Durable":
                    handleFeatInteraction(character, "Durable", (char) => {
                        char.abilityScores.constitution += 1;
                        char.durableFeatBenefits = true;
                        return true;
                    });
                    break;

                case "Elemental Adept":
                    handleFeatInteraction(character, "Elemental Adept", (char, existingChoice) => {
                        if (!existingChoice) {
                            const element = prompt("Elemental Adept feat: Choose an element (acid, cold, fire, lightning, or thunder):");
                            if (element === null) return null;
                            const lowerElement = element.toLowerCase();
                            if (["acid", "cold", "fire", "lightning", "thunder"].includes(lowerElement)) {
                                char.elementalAdept = lowerElement;
                                return lowerElement;
                            }
                        } else {
                            char.elementalAdept = existingChoice;
                        }
                    });
                    break;

                case "Grappler":
                    handleFeatInteraction(character, "Grappler", (char) => {
                        char.grapplerBenefits = true;
                        return true;
                    });
                    break;

                case "Great Weapon Master":
                    handleFeatInteraction(character, "Great Weapon Master", (char) => {
                        char.greatWeaponMasterBenefits = true;
                        return true;
                    });
                    break;

                case "Healer":
                    handleFeatInteraction(character, "Healer", (char) => {
                        char.healerFeatBenefits = true;
                        return true;
                    });
                    break;

                case "Heavily Armored":
                    handleFeatInteraction(character, "Heavily Armored", (char) => {
                        char.abilityScores.strength += 1;
                        char.armorProficiencies = char.armorProficiencies || [];
                        if (!char.armorProficiencies.includes("Heavy")) {
                            char.armorProficiencies.push("Heavy");
                        }
                        return true;
                    });
                    break;

                case "Heavy Armor Master":
                    handleFeatInteraction(character, "Heavy Armor Master", (char) => {
                        char.abilityScores.strength += 1;
                        char.heavyArmorMasterBenefits = true;
                        return true;
                    });
                    break;

                case "Inspiring Leader":
                    handleFeatInteraction(character, "Inspiring Leader", (char) => {
                        char.inspiringLeaderBenefits = true;
                        return true;
                    });
                    break;

                case "Keen Mind":
                    handleFeatInteraction(character, "Keen Mind", (char) => {
                        char.abilityScores.intelligence += 1;
                        char.keenMindBenefits = true;
                        return true;
                    });
                    break;

                case "Lightly Armored":
                    handleFeatInteraction(character, "Lightly Armored", (char, existingChoice) => {
                        if (!existingChoice) {
                            const chosenAbility = prompt("Lightly Armored feat: Choose which ability to increase by 1: STR or DEX");
                            if (chosenAbility === null) return null;
                            const upperChoice = chosenAbility.toUpperCase();
                            if (upperChoice === "STR" || upperChoice === "DEX") {
                                char.abilityScores[upperChoice.toLowerCase()] += 1;
                                char.armorProficiencies = char.armorProficiencies || [];
                                if (!char.armorProficiencies.includes("Light")) {
                                    char.armorProficiencies.push("Light");
                                }
                                return upperChoice;
                            }
                        } else {
                            char.armorProficiencies = char.armorProficiencies || [];
                            if (!char.armorProficiencies.includes("Light")) {
                                char.armorProficiencies.push("Light");
                            }
                        }
                    });
                    break;

                case "Linguist":
                    handleFeatInteraction(character, "Linguist", (char) => {
                        char.abilityScores.intelligence += 1;
                        char.languagesKnown = (char.languagesKnown || 0) + 3;
                        char.linguistBenefits = true;
                        return true;
                    });
                    break;

                case "Lucky":
                    handleFeatInteraction(character, "Lucky", (char) => {
                        char.luckyPoints = 3;
                        return true;
                    });
                    break;

                case "Mage Slayer":
                    handleFeatInteraction(character, "Mage Slayer", (char) => {
                        char.mageSlayerBenefits = true;
                        return true;
                    });
                    break;

                case "Magic Initiate":
                    handleFeatInteraction(character, "Magic Initiate", (char, existingChoice) => {
                        if (!existingChoice) {
                            const chosenClass = prompt("Magic Initiate feat: Choose a class for your spells (e.g., Bard, Cleric, Druid, Sorcerer, Warlock, Wizard):");
                            if (chosenClass === null) return null;
                            char.magicInitiateBenefits = true;
                            return chosenClass;
                        } else {
                            char.magicInitiateBenefits = true;
                        }
                    });
                    break;

                case "Martial Adept":
                    handleFeatInteraction(character, "Martial Adept", (char) => {
                        char.martialAdeptBenefits = true;
                        return true;
                    });
                    break;

                case "Medium Armor Master":
                    handleFeatInteraction(character, "Medium Armor Master", (char) => {
                        char.mediumArmorMasterBenefits = true;
                        return true;
                    });
                    break;

                case "Mobile":
                    handleFeatInteraction(character, "Mobile", (char) => {
                        char.speed += 10;
                        char.mobileFeatBenefits = true;
                        return true;
                    });
                    break;

                case "Moderately Armored":
                    handleFeatInteraction(character, "Moderately Armored", (char, existingChoice) => {
                        if (!existingChoice) {
                            const chosenAbility = prompt("Moderately Armored feat: Choose which ability to increase by 1: STR or DEX");
                            if (chosenAbility === null) return null;
                            const upperChoice = chosenAbility.toUpperCase();
                            if (upperChoice === "STR" || upperChoice === "DEX") {
                                char.abilityScores[upperChoice.toLowerCase()] += 1;
                                char.armorProficiencies = char.armorProficiencies || [];
                                if (!char.armorProficiencies.includes("Medium")) {
                                    char.armorProficiencies.push("Medium");
                                }
                                if (!char.armorProficiencies.includes("Shield")) {
                                    char.armorProficiencies.push("Shield");
                                }
                                return upperChoice;
                            }
                        } else {
                            char.armorProficiencies = char.armorProficiencies || [];
                            if (!char.armorProficiencies.includes("Medium")) {
                                char.armorProficiencies.push("Medium");
                            }
                            if (!char.armorProficiencies.includes("Shield")) {
                                char.armorProficiencies.push("Shield");
                            }
                        }
                    });
                    break;

                case "Mounted Combatant":
                    handleFeatInteraction(character, "Mounted Combatant", (char) => {
                        char.mountedCombatantBenefits = true;
                        return true;
                    });
                    break;

                case "Observant":
                    handleFeatInteraction(character, "Observant", (char, existingChoice) => {
                        if (!existingChoice) {
                            const chosenAbility = prompt("Observant feat: Choose which ability to increase by 1: INT or WIS");
                            if (chosenAbility === null) return null;
                            const upperChoice = chosenAbility.toUpperCase();
                            if (upperChoice === "INT" || upperChoice === "WIS") {
                                char.abilityScores[upperChoice.toLowerCase()] += 1;
                                char.passivePerception += 5;
                                char.passiveInvestigation += 5;
                                char.observantBenefits = true;
                                return upperChoice;
                            }
                        } else {
                            char.passivePerception += 5;
                            char.passiveInvestigation += 5;
                            char.observantBenefits = true;
                        }
                    });
                    break;

                case "Polearm Master":
                    handleFeatInteraction(character, "Polearm Master", (char) => {
                        char.polearmMasterBenefits = true;
                        return true;
                    });
                    break;

                case "Resilient":
                    handleFeatInteraction(character, "Resilient", (char, existingChoice) => {
                        if (!existingChoice) {
                            const abilities = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
                            const chosenAbility = prompt(`Resilient feat: Choose an ability to increase by 1 and gain saving throw proficiency (${abilities.join(", ")})`);
                            if (chosenAbility === null) return null;
                            const upperChoice = chosenAbility.toUpperCase();
                            if (abilities.includes(upperChoice)) {
                                char.abilityScores[upperChoice.toLowerCase()] += 1;
                                char.savingThrowProficiencies = char.savingThrowProficiencies || [];
                                if (!char.savingThrowProficiencies.includes(upperChoice)) {
                                    char.savingThrowProficiencies.push(upperChoice);
                                }
                                return upperChoice;
                            }
                        } else {
                            char.savingThrowProficiencies = char.savingThrowProficiencies || [];
                            if (!char.savingThrowProficiencies.includes(existingChoice)) {
                                char.savingThrowProficiencies.push(existingChoice);
                            }
                        }
                    });
                    break;

                case "Ritual Caster":
                    handleFeatInteraction(character, "Ritual Caster", (char, existingChoice) => {
                        if (!existingChoice) {
                            const chosenClass = prompt("Ritual Caster feat: Choose a class for your ritual spells (e.g., Bard, Cleric, Druid, Wizard):");
                            if (chosenClass === null) return null;
                            char.ritualCasterBenefits = true;
                            return chosenClass;
                        } else {
                            char.ritualCasterBenefits = true;
                        }
                    });
                    break;

                case "Savage Attacker":
                    handleFeatInteraction(character, "Savage Attacker", (char) => {
                        char.savageAttackerBenefits = true;
                        return true;
                    });
                    break;

                case "Sentinel":
                    handleFeatInteraction(character, "Sentinel", (char) => {
                        char.sentinelBenefits = true;
                        return true;
                    });
                    break;

                case "Sharpshooter":
                    handleFeatInteraction(character, "Sharpshooter", (char) => {
                        char.sharpshooterBenefits = true;
                        return true;
                    });
                    break;

                case "Shield Master":
                    handleFeatInteraction(character, "Shield Master", (char) => {
                        char.shieldMasterBenefits = true;
                        return true;
                    });
                    break;

                case "Skilled":
                    handleFeatInteraction(character, "Skilled", (char) => {
                        char.additionalProficiencies = (char.additionalProficiencies || 0) + 3;
                        return true;
                    });
                    break;

                case "Skulker":
                    handleFeatInteraction(character, "Skulker", (char) => {
                        char.skulkerBenefits = true;
                        return true;
                    });
                    break;

                case "Spell Sniper":
                    handleFeatInteraction(character, "Spell Sniper", (char) => {
                        char.spellSniperBenefits = true;
                        return true;
                    });
                    break;

                case "Tavern Brawler":
                    handleFeatInteraction(character, "Tavern Brawler", (char, existingChoice) => {
                        if (!existingChoice) {
                            const chosenAbility = prompt("Tavern Brawler feat: Choose which ability to increase by 1: STR or CON");
                            if (chosenAbility === null) return null;
                            const upperChoice = chosenAbility.toUpperCase();
                            if (upperChoice === "STR" || upperChoice === "CON") {
                                char.abilityScores[upperChoice.toLowerCase()] += 1;
                                char.tavernBrawlerBenefits = true;
                                return upperChoice;
                            }
                        } else {
                            char.tavernBrawlerBenefits = true;
                        }
                    });
                    break;

                case "Tough":
                    handleFeatInteraction(character, "Tough", (char) => {
                        const hpIncrease = char.level * 2;
                        char.maxHp += hpIncrease;
                        char.hp += hpIncrease;
                        return true;
                    });
                    break;

                case "War Caster":
                    handleFeatInteraction(character, "War Caster", (char) => {
                        char.warCasterBenefits = true;
                        return true;
                    });
                    break;

                case "Weapon Master":
                    handleFeatInteraction(character, "Weapon Master", (char, existingChoice) => {
                        if (!existingChoice) {
                            const chosenAbility = prompt("Weapon Master feat: Choose which ability to increase by 1: STR or DEX");
                            if (chosenAbility === null) return null;
                            const upperChoice = chosenAbility.toUpperCase();
                            if (upperChoice === "STR" || upperChoice === "DEX") {
                                char.abilityScores[upperChoice.toLowerCase()] += 1;
                                char.additionalWeaponProficiencies = (char.additionalWeaponProficiencies || 0) + 4;
                                return upperChoice;
                            }
                        } else {
                            char.additionalWeaponProficiencies = (char.additionalWeaponProficiencies || 0) + 4;
                        }
                    });
                    break;

                default:
                    console.log(`Feat ${feat.name} not implemented yet.`);
                    break;
            }
        });

        return character;
    }

    function getFeatInteraction(characterName, featName) {
        let featInteractions = JSON.parse(localStorage.getItem('featInteractions') || '{}');
        console.log("All feat interactions:", featInteractions);
        console.log(`Getting interaction for ${characterName}, ${featName}`);
        return featInteractions[characterName] && featInteractions[characterName][featName];
    }

    function saveFeatInteraction(characterName, featName, interaction) {
        let featInteractions = JSON.parse(localStorage.getItem('featInteractions') || '{}');
        if (!featInteractions[characterName]) {
            featInteractions[characterName] = {};
        }
        featInteractions[characterName][featName] = interaction;
        localStorage.setItem('featInteractions', JSON.stringify(featInteractions));
        console.log(`Saved interaction for ${characterName}, ${featName}:`, interaction);
    }

    function handleFeatInteraction(character, featName, interactionHandler) {
        console.log(`Handling feat interaction for ${character.name}, feat: ${featName}`);
        const existingInteraction = getFeatInteraction(character.name, featName);

        if (!existingInteraction || existingInteraction.applied === false) {
            console.log("No existing interaction found or not applied, handling new interaction");
            const result = interactionHandler(character);
            if (result !== null && result !== undefined) {
                saveFeatInteraction(character.name, featName, { result, applied: true });
                console.log(`Interaction saved and applied for ${featName}:`, result);
            }
        } else {
            console.log(`Existing interaction found for ${featName}, already applied:`, existingInteraction);
        }
    }

    // New function to generate feat effects HTML
    function generateFeatEffectsHtml(character) {
        if (!character.feats || character.feats.length === 0) {
            return '<p>No feat effects to display.</p>';
        };

        const effects = [
            character.initiativeBonus ? `Initiative Bonus: +${character.initiativeBonus}` : null,
            character.cannotBeSurprised ? 'Cannot be surprised' : null,
            character.noHiddenAttackerAdvantage ? 'No advantage for hidden attackers' : null,
            character.athleteFeatBenefits ? 'Athlete feat benefits' : null,
            character.actorFeatBenefits ? 'Actor feat benefits' : null,
            character.chargerFeatBenefits ? 'Charger feat benefits' : null,
            character.crossbowExpertBenefits ? 'Crossbow Expert benefits' : null,
            character.defensiveDuelistBenefits ? 'Defensive Duelist benefits' : null,
            character.dualWielderBenefits ? 'Dual Wielder benefits' : null,
            character.dungeonDelverBenefits ? 'Dungeon Delver benefits' : null,
            character.durableFeatBenefits ? 'Durable feat benefits' : null,
            character.elementalAdept ? `Elemental Adept: ${character.elementalAdept}` : null,
            character.grapplerBenefits ? 'Grappler benefits' : null,
            character.greatWeaponMasterBenefits ? 'Great Weapon Master benefits' : null,
            character.healerFeatBenefits ? 'Healer feat benefits' : null,
            character.heavyArmorMasterBenefits ? 'Heavy Armor Master benefits' : null,
            character.inspiringLeaderBenefits ? 'Inspiring Leader benefits' : null,
            character.keenMindBenefits ? 'Keen Mind benefits' : null,
            character.linguistBenefits ? 'Linguist benefits' : null,
            character.luckyPoints ? `Lucky points: ${character.luckyPoints}` : null,
            character.mageSlayerBenefits ? 'Mage Slayer benefits' : null,
            character.magicInitiateBenefits ? 'Magic Initiate benefits' : null,
            character.martialAdeptBenefits ? 'Martial Adept benefits' : null,
            character.mediumArmorMasterBenefits ? 'Medium Armor Master benefits' : null,
            character.mobileFeatBenefits ? 'Mobile feat benefits' : null,
            character.mountedCombatantBenefits ? 'Mounted Combatant benefits' : null,
            character.observantBenefits ? 'Observant benefits' : null,
            character.polearmMasterBenefits ? 'Polearm Master benefits' : null,
            character.ritualCasterBenefits ? 'Ritual Caster benefits' : null,
            character.savageAttackerBenefits ? 'Savage Attacker benefits' : null,
            character.sentinelBenefits ? 'Sentinel benefits' : null,
            character.sharpshooterBenefits ? 'Sharpshooter benefits' : null,
            character.shieldMasterBenefits ? 'Shield Master benefits' : null,
            character.additionalProficiencies ? `Additional proficiencies: ${character.additionalProficiencies}` : null,
            character.skulkerBenefits ? 'Skulker benefits' : null,
            character.spellSniperBenefits ? 'Spell Sniper benefits' : null,
            character.tavernBrawlerBenefits ? 'Tavern Brawler benefits' : null,
            character.warCasterBenefits ? 'War Caster benefits' : null,
            character.additionalWeaponProficiencies ? `Additional weapon proficiencies: ${character.additionalWeaponProficiencies}` : null
        ].filter(effect => effect !== null);

        if (effects.length === 0) {
            return '';
        }

        return `
    <div class="feat-effects">
      <h4>Feat Effects</h4>
      <ul>
        ${effects.map(effect => `<li>${effect}</li>`).join('')}
      </ul>
    </div>
  `;
    }

    // async function loadItemData() {
    //     try {
    //         const [items, weapons, armor, feats] = await Promise.all([
    //             fetch('items.json').then(response => response.json()),
    //             fetch('weapons.json').then(response => response.json()),
    //             fetch('armor.json').then(response => response.json()),
    //             fetch('feats.json').then(response => response.json())
    //         ]);
    //         itemsData = items;
    //         weaponsData = weapons;
    //         armorData = armor;
    //         window.featsData = feats;
    //     } catch (error) {
    //         console.error('Error loading item data:', error);
    //     }
    // }

    // // Load characters from local storage and spells data when the page loads
    // window.addEventListener('load', async () => {
    //     await loadItemData();
    //     await loadSpellsData();
    //     loadCharactersFromLocalStorage();
    // });
    async function loadItemData() {
        try {
            const [items, weapons, armor, feats, races, spells] = await Promise.all([
                fetch('items.json').then(response => response.json()),
                fetch('weapons.json').then(response => response.json()),
                fetch('armor.json').then(response => response.json()),
                fetch('feats.json').then(response => response.json()),
                fetch('races2.json').then(response => response.json()),
                fetch('spells.json').then(response => response.json())
            ]);
            itemsData = items;
            weaponsData = weapons;
            armorData = armor;
            window.featsData = feats;
            racesData = races; // Store the races data
            spellsData = spells;
            
            console.log('All data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }
    
    // Load characters from local storage and all other data when the page loads
    window.addEventListener('load', async () => {
        await loadItemData(); // This now includes loading races and spells data
        loadCharactersFromLocalStorage();
    });

    window.rollDice = function (diceNotation, spellLevel, spellName) {
        const [count, sides] = diceNotation.split('d').map(Number);
        let total = 0;
        const rolls = [];
        for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            total += roll;
            rolls.push(roll);
        }
        const result = `Cast ${spellName} (Level ${spellLevel}): Rolled ${diceNotation}: ${rolls.join(' + ')} = ${total}`;
        showNotification(result);
        logRoll(result);
        updateSpellSlot(spellLevel);
    };

    window.performLongRest = function (button) {
        const card = button.closest('.character-card');
        let character = JSON.parse(card.dataset.character);
        character = longRest(character);
        card.dataset.character = JSON.stringify(character);
        updateCharacterDisplay(card, character);
    };

    window.performShortRest = function (button) {
        const card = button.closest('.character-card');
        let character = JSON.parse(card.dataset.character);
        character = shortRest(character);
        card.dataset.character = JSON.stringify(character);
        updateCharacterDisplay(card, character);
    };

    function longRest(character) {
        // Restore HP to maximum
        character.hp = character.maxHp;
    
        // Restore all spell slots
        if (character.spellcasting && character.spellcasting.spellSlots) {
            for (let level in character.spellcasting.spellSlots) {
                character.spellcasting.currentSpellSlots[level] = character.spellcasting.spellSlots[level];
            }
        }
    
        // Restore class features and other long rest resources
        // ... (implement class-specific resource restoration here)
    
        // Reset any daily use abilities
        // ... (implement resetting of daily use abilities here)
    
        return character;
    }

    // Function to update character display after rest
    function updateCharacterDisplay(card, character) {
        card.querySelector('.hp-value').textContent = character.hp;
        updateSpellSlots(card, character);
        // Update other relevant parts of the display as needed
    }

    // Function to reset a specific feat interaction for a character

    // Expose necessary functions to global scope
    window.rollAttribute = rollAttribute;
    window.rollSkill = rollSkill;
    window.rollWeapon = rollWeapon;
    window.castSpell = castSpell;
    window.changeView = changeView;
    window.returnCardToDeck = returnCardToDeck;
    window.changeHP = changeHP;
    window.updateHPChange = updateHPChange;
    window.rollInitiative = rollInitiative;
    window.toggleSpellDetails = toggleSpellDetails;
    window.parseDiceNotation = parseDiceNotation;
    window.logRoll = logRoll;
    window.showNotification = showNotification;
    window.rollDice = rollDice;
    window.showAddItemModal = showAddItemModal;
    window.addSelectedItem = addSelectedItem;
    window.removeItem = removeItem;
    window.closeModal = closeModal;
    window.updateItemSelect = updateItemSelect;
    window.loadPremadeCharacters = loadPremadeCharacters;
    window.toggleFeatDetails = toggleFeatDetails;
    window.toggleItemDetails = toggleItemDetails;
    window.rollToHit = rollToHit;
    window.rollWeaponDamage = rollWeaponDamage;
    window.changeView = changeView;
    window.rollSkill = rollSkill;


    function resetFeatInteraction(characterName, featName) {
        let featInteractions = JSON.parse(localStorage.getItem('featInteractions') || '{}');
        if (featInteractions[characterName] && featInteractions[characterName][featName]) {
            delete featInteractions[characterName][featName];
            localStorage.setItem('featInteractions', JSON.stringify(featInteractions));
            console.log(`Reset feat interaction for ${characterName}: ${featName}`);
        }
    }

    // Function to clear all feat interactions
    function clearAllFeatInteractions() {
        localStorage.removeItem('featInteractions');
        console.log("Cleared all feat interactions from localStorage");
    }

    // Function to remove a feat from a character
    function removeFeatFromCharacter(character, featName) {
        character.feats = character.feats.filter(f => f !== featName);
        resetFeatInteraction(character.name, featName);
        // Reset any specific effects of the feat
        if (character.featEffects && character.featEffects[featName]) {
            delete character.featEffects[featName];
        }
        // You might need to add specific logic here to undo certain feat effects
        console.log(`Removed feat ${featName} from ${character.name}`);
    }

    // Console command for DMs to clear feats localStorage
    console.log("DM Commands:");
    console.log("- clearAllFeatInteractions(): Clears all feat interactions");
    console.log("- resetFeatInteraction(characterName, featName): Resets a specific feat interaction");
    console.log("- removeFeatFromCharacter(character, featName): Removes a feat from a character");


})();