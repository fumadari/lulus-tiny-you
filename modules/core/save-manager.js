// ============================================
// Save Manager Module
// ============================================

export const SAVE_KEY = 'lulu-tiny-you-v5';
const BACKUP_KEY = 'lulu-tiny-you-backup-v5';
const SESSION_KEY = 'lulu-tiny-you-session-v5';

export class SaveManager {
    static createDefaultSave() {
        return {
            version: 5,
            lastSeenISO: new Date().toISOString(),
            lastUpdateTime: Date.now(),
            stats: { 
                hunger: 80, 
                energy: 100, 
                happiness: 80,
                maxHunger: 100,
                maxEnergy: 100,
                maxHappiness: 100
            },
            currency: { hearts: 0, coins: 0 },
            inventory: [],
            player: { x: 24, y: 15, facing: 'down' }, // Start at UES intersection
            map: { 
                visitedPOIs: [],
                currentMap: 'nyc'
            },
            minigames: {
                feedFrenzy: { bestScore: 0, stars: 0, played: 0 },
                petRhythm: { bestCombo: 0, stars: 0, played: 0 },
                memory: { bestTime: 999, stars: 0, played: 0 },
                trivia: { bestStreak: 0, stars: 0, played: 0 }
            },
            tokens: 0,
            streak: { 
                current: 0, 
                lastDayISO: new Date().toISOString().split('T')[0] 
            },
            unlockedTokenSources: [],
            petName: "Tiny Dario",
            level: 1,
            experience: 0,
            licks: 0,
            lastLickTime: 0,
            isAngry: false,
            overfed: false,
            overfedTime: 0,
            lastCriticalWarning: 0,
            shop: {
                purchases: [],
                availableItems: [
                    {
                        id: 'apartment_cat',
                        name: 'Lulu\'s Cat',
                        description: 'A cute cat that lives in Lulu\'s apartment',
                        price: 50,
                        emoji: '🐱',
                        available: true
                    },
                    {
                        id: 'food_premium',
                        name: 'Premium Food',
                        description: 'Special food that fills hunger more',
                        price: 30,
                        emoji: '🥘',
                        available: false
                    },
                    {
                        id: 'energy_drink',
                        name: 'Energy Boost',
                        description: 'Instant energy restoration',
                        price: 25,
                        emoji: '⚡',
                        available: false
                    },
                    {
                        id: 'happiness_toy',
                        name: 'Fun Toy',
                        description: 'A toy that makes Dario happy',
                        price: 40,
                        emoji: '🧸',
                        available: false
                    },
                    {
                        id: 'outfit_cool',
                        name: 'Cool Outfit',
                        description: 'Stylish clothes for Dario',
                        price: 60,
                        emoji: '👕',
                        available: false
                    },
                    {
                        id: 'decoration_plants',
                        name: 'Plants',
                        description: 'Beautiful plants for the apartment',
                        price: 35,
                        emoji: '🪴',
                        available: false
                    }
                ]
            }
        };
    }

    static loadSave() {
        try {
            // Try loading from primary localStorage first
            let saved = localStorage.getItem(SAVE_KEY);
            
            // If not found, try backup localStorage
            if (!saved) {
                saved = localStorage.getItem(BACKUP_KEY);
                if (saved) {
                    console.log('Restored from backup save');
                }
            }
            
            // If still not found, try sessionStorage
            if (!saved) {
                saved = sessionStorage.getItem(SESSION_KEY);
                if (saved) {
                    console.log('Restored from session save');
                }
            }
            
            if (!saved) {
                const newSave = this.createDefaultSave();
                // Immediately save to all storage methods
                this.saveToAllStorages(newSave);
                return newSave;
            }
            
            const data = JSON.parse(saved);
            if (data.version !== 5) {
                const newSave = this.createDefaultSave();
                this.saveToAllStorages(newSave);
                return newSave;
            }
            
            // Restore to all storage methods
            this.saveToAllStorages(data);
            return data;
        } catch (e) {
            console.error('Load save error:', e);
            const newSave = this.createDefaultSave();
            this.saveToAllStorages(newSave);
            return newSave;
        }
    }

    static saveNow(gameState) {
        gameState.lastUpdateTime = Date.now();
        this.saveToAllStorages(gameState);
    }
    
    static saveToAllStorages(gameState) {
        const dataString = JSON.stringify(gameState);
        
        try {
            // Primary localStorage
            localStorage.setItem(SAVE_KEY, dataString);
        } catch (e) {
            console.error('Primary localStorage save error:', e);
        }
        
        try {
            // Backup localStorage with different key
            localStorage.setItem(BACKUP_KEY, dataString);
        } catch (e) {
            console.error('Backup localStorage save error:', e);
        }
        
        try {
            // Session storage for additional backup
            sessionStorage.setItem(SESSION_KEY, dataString);
        } catch (e) {
            console.error('Session storage save error:', e);
        }
        
        // Also create a URL-based backup for extreme cases
        this.updateURLHash(gameState);
    }
    
    static updateURLHash(gameState) {
        try {
            // Store minimal essential data in URL hash for emergency recovery
            const essential = {
                stats: gameState.stats,
                currency: gameState.currency,
                tokens: gameState.tokens,
                level: gameState.level,
                lastSave: Date.now()
            };
            const compressed = btoa(JSON.stringify(essential));
            // Only update if hash is empty or old
            if (!window.location.hash || window.location.hash.includes('oldSave')) {
                window.history.replaceState(null, '', `#save=${compressed}`);
            }
        } catch (e) {
            console.error('URL backup error:', e);
        }
    }
    
    static loadFromURLHash() {
        try {
            const hash = window.location.hash;
            if (hash.includes('save=')) {
                const saveData = hash.split('save=')[1];
                const decompressed = JSON.parse(atob(saveData));
                if (decompressed.lastSave && Date.now() - decompressed.lastSave < 86400000) { // 24 hours
                    return decompressed;
                }
            }
        } catch (e) {
            console.error('URL hash restore error:', e);
        }
        return null;
    }
    
    static exportSave(gameState) {
        const data = JSON.stringify(gameState, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lulu-tiny-you-save-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    static async importSave(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.version !== 5) {
                        reject(new Error('Invalid save version'));
                        return;
                    }
                    resolve(data);
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    }
}