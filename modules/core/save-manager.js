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
            
            // If all storage methods failed, try URL hash backup (for bookmark deletion recovery)
            if (!saved) {
                const urlBackup = this.loadFromURLHash();
                if (urlBackup) {
                    console.log('Restored from URL hash backup! Save data recovered from bookmark deletion.');
                    this.saveToAllStorages(urlBackup);
                    return urlBackup;
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
            // Last resort: try URL backup even after errors
            try {
                const urlBackup = this.loadFromURLHash();
                if (urlBackup) {
                    console.log('Emergency recovery from URL backup successful!');
                    this.saveToAllStorages(urlBackup);
                    return urlBackup;
                }
            } catch (urlError) {
                console.error('URL backup recovery failed:', urlError);
            }
            
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
            // Store comprehensive data in URL hash for bookmark deletion recovery
            const backup = {
                stats: gameState.stats,
                currency: gameState.currency,
                tokens: gameState.tokens,
                level: gameState.level,
                shop: gameState.shop,
                player: gameState.player,
                licks: gameState.licks,
                isAngry: gameState.isAngry,
                overfed: gameState.overfed,
                overfedTime: gameState.overfedTime,
                lastSave: Date.now()
            };
            const compressed = btoa(JSON.stringify(backup));
            
            // Always update URL hash for most recent backup
            window.history.replaceState(null, '', `#backup=${compressed}`);
            
            // Also try to store in clipboard as additional backup
            this.createClipboardBackup(backup);
        } catch (e) {
            console.error('URL backup error:', e);
        }
    }
    
    static createClipboardBackup(backup) {
        try {
            // Create a text backup that can be copied
            const backupText = `DARIO-SAVE:${btoa(JSON.stringify(backup))}`;
            
            // Store in a hidden element for manual copying
            let backupElement = document.getElementById('hiddenBackup');
            if (!backupElement) {
                backupElement = document.createElement('textarea');
                backupElement.id = 'hiddenBackup';
                backupElement.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;';
                document.body.appendChild(backupElement);
            }
            backupElement.value = backupText;
        } catch (e) {
            console.error('Clipboard backup error:', e);
        }
    }
    
    static loadFromURLHash() {
        try {
            const hash = window.location.hash;
            
            // Try new backup format first
            if (hash.includes('backup=')) {
                const saveData = hash.split('backup=')[1];
                const decompressed = JSON.parse(atob(saveData));
                if (decompressed.lastSave && Date.now() - decompressed.lastSave < 604800000) { // 7 days
                    console.log('Restored from URL backup!');
                    return this.expandBackupToFullSave(decompressed);
                }
            }
            
            // Fallback to old save format
            if (hash.includes('save=')) {
                const saveData = hash.split('save=')[1];
                const decompressed = JSON.parse(atob(saveData));
                if (decompressed.lastSave && Date.now() - decompressed.lastSave < 86400000) { // 24 hours
                    console.log('Restored from URL save!');
                    return this.expandBackupToFullSave(decompressed);
                }
            }
        } catch (e) {
            console.error('URL hash restore error:', e);
        }
        return null;
    }
    
    static expandBackupToFullSave(backup) {
        // Expand the backup into a full save structure
        const fullSave = this.createDefaultSave();
        
        // Restore backed up data
        if (backup.stats) fullSave.stats = { ...fullSave.stats, ...backup.stats };
        if (backup.currency) fullSave.currency = { ...fullSave.currency, ...backup.currency };
        if (backup.tokens !== undefined) fullSave.tokens = backup.tokens;
        if (backup.level !== undefined) fullSave.level = backup.level;
        if (backup.shop) fullSave.shop = { ...fullSave.shop, ...backup.shop };
        if (backup.player) fullSave.player = { ...fullSave.player, ...backup.player };
        if (backup.licks !== undefined) fullSave.licks = backup.licks;
        if (backup.isAngry !== undefined) fullSave.isAngry = backup.isAngry;
        if (backup.overfed !== undefined) fullSave.overfed = backup.overfed;
        if (backup.overfedTime !== undefined) fullSave.overfedTime = backup.overfedTime;
        
        fullSave.lastUpdateTime = backup.lastSave || Date.now();
        
        return fullSave;
    }
    
    static generateSaveCode(gameState) {
        // Create a compact save code for easy sharing/backup
        const saveData = {
            v: 5, // version
            s: gameState.stats,
            c: gameState.currency,
            t: gameState.tokens,
            l: gameState.level,
            sh: gameState.shop,
            p: gameState.player,
            lk: gameState.licks,
            a: gameState.isAngry,
            o: gameState.overfed,
            ot: gameState.overfedTime,
            ts: Date.now()
        };
        return btoa(JSON.stringify(saveData));
    }
    
    static importSaveCode(saveCode) {
        try {
            const data = JSON.parse(atob(saveCode));
            if (data.v !== 5) {
                throw new Error('Invalid save code version');
            }
            
            // Convert compact format back to full save
            const fullSave = this.createDefaultSave();
            if (data.s) fullSave.stats = { ...fullSave.stats, ...data.s };
            if (data.c) fullSave.currency = { ...fullSave.currency, ...data.c };
            if (data.t !== undefined) fullSave.tokens = data.t;
            if (data.l !== undefined) fullSave.level = data.l;
            if (data.sh) fullSave.shop = { ...fullSave.shop, ...data.sh };
            if (data.p) fullSave.player = { ...fullSave.player, ...data.p };
            if (data.lk !== undefined) fullSave.licks = data.lk;
            if (data.a !== undefined) fullSave.isAngry = data.a;
            if (data.o !== undefined) fullSave.overfed = data.o;
            if (data.ot !== undefined) fullSave.overfedTime = data.ot;
            
            fullSave.lastUpdateTime = data.ts || Date.now();
            
            return fullSave;
        } catch (e) {
            throw new Error('Invalid save code format');
        }
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