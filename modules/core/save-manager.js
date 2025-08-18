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
            
            // If all storage methods failed, try iPhone emergency backups
            if (!saved) {
                const emergencyBackup = this.loadFromiPhoneEmergencyBackup();
                if (emergencyBackup) {
                    console.log('Restored from iPhone emergency backup!');
                    this.saveToAllStorages(emergencyBackup);
                    return emergencyBackup;
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
            
            // For iPhone: try to persist in a special way
            this.createiPhonePersistentBackup(gameState);
        } catch (e) {
            console.error('URL backup error:', e);
        }
    }
    
    static createiPhonePersistentBackup(gameState) {
        try {
            // Create a special localStorage key that might persist longer on iOS
            const persistentBackup = {
                saveCode: this.generateSaveCode(gameState),
                timestamp: Date.now(),
                stats: gameState.stats,
                currency: gameState.currency
            };
            
            // Use multiple storage strategies for iPhone
            const keys = [
                'dario-game-backup-emergency',
                'tamagotchi-dario-safe-backup',
                'lulu-game-persistent-save'
            ];
            
            keys.forEach(key => {
                try {
                    localStorage.setItem(key, JSON.stringify(persistentBackup));
                } catch (e) {
                    // Silent fail for quota exceeded
                }
            });
            
            // Also try sessionStorage with different keys
            try {
                sessionStorage.setItem('dario-emergency-backup', JSON.stringify(persistentBackup));
            } catch (e) {
                // Silent fail
            }
        } catch (e) {
            console.error('iPhone persistent backup failed:', e);
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
    
    static loadFromiPhoneEmergencyBackup() {
        const emergencyKeys = [
            'dario-game-backup-emergency',
            'tamagotchi-dario-safe-backup', 
            'lulu-game-persistent-save',
            'dario-emergency-backup' // sessionStorage key
        ];
        
        for (const key of emergencyKeys) {
            try {
                // Try localStorage first
                let backup = localStorage.getItem(key);
                if (!backup) {
                    // Try sessionStorage
                    backup = sessionStorage.getItem(key);
                }
                
                if (backup) {
                    const data = JSON.parse(backup);
                    if (data.timestamp && Date.now() - data.timestamp < 604800000) { // 7 days
                        // If we have a save code, use it
                        if (data.saveCode) {
                            return this.importSaveCode(data.saveCode);
                        }
                        // Otherwise reconstruct from partial data
                        const fullSave = this.createDefaultSave();
                        if (data.stats) fullSave.stats = { ...fullSave.stats, ...data.stats };
                        if (data.currency) fullSave.currency = { ...fullSave.currency, ...data.currency };
                        return fullSave;
                    }
                }
            } catch (e) {
                // Continue trying other keys
                continue;
            }
        }
        return null;
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
    
    static createiPhonePhotoBackup(gameState) {
        // Create a visual backup image that can be saved to iPhone Photos
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, 1200);
        gradient.addColorStop(0, '#ff70a6');
        gradient.addColorStop(0.5, '#ff9a9e');
        gradient.addColorStop(1, '#fecfef');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 1200);
        
        // Add title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎮 TAMAGOTCHI DARIO', 400, 80);
        ctx.fillText('Save Backup', 400, 140);
        
        // Add current date
        const date = new Date().toLocaleDateString();
        ctx.font = '24px Arial';
        ctx.fillText(`Saved: ${date}`, 400, 180);
        
        // Display stats visually
        const stats = gameState.stats;
        const currency = gameState.currency;
        
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'left';
        
        // Stats section
        ctx.fillText('📊 STATS:', 50, 250);
        ctx.font = '28px Arial';
        ctx.fillText(`🍎 Hunger: ${stats.hunger}/100`, 50, 300);
        ctx.fillText(`⚡ Energy: ${stats.energy}/100`, 50, 340);
        ctx.fillText(`😊 Happiness: ${stats.happiness}/100`, 50, 380);
        ctx.fillText(`💖 Hearts: ${currency.hearts}`, 50, 420);
        ctx.fillText(`🏆 Tokens: ${gameState.tokens}`, 50, 460);
        ctx.fillText(`📈 Level: ${gameState.level}`, 50, 500);
        ctx.fillText(`👅 Licks: ${gameState.licks}`, 50, 540);
        
        // Create save code section
        const saveCode = this.generateSaveCode(gameState);
        ctx.font = 'bold 24px Arial';
        ctx.fillText('💾 SAVE CODE:', 50, 620);
        
        // Split save code into multiple lines for readability
        ctx.font = '16px monospace';
        const lineLength = 50;
        for (let i = 0; i < saveCode.length; i += lineLength) {
            const line = saveCode.substring(i, i + lineLength);
            ctx.fillText(line, 50, 660 + (i / lineLength) * 25);
        }
        
        // Instructions
        ctx.font = 'bold 20px Arial';
        ctx.fillText('📱 INSTRUCTIONS:', 50, 900);
        ctx.font = '18px Arial';
        ctx.fillText('1. Save this image to Photos', 50, 940);
        ctx.fillText('2. To restore: copy the save code above', 50, 970);
        ctx.fillText('3. In game: Games → Save Data → Load Code', 50, 1000);
        ctx.fillText('4. Paste the code to restore your progress', 50, 1030);
        
        // Add cute Dario emoji
        ctx.font = '120px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🥺', 400, 1150);
        
        return canvas;
    }
    
    static async downloadiPhoneBackup(gameState) {
        try {
            const canvas = this.createiPhonePhotoBackup(gameState);
            
            // Convert to blob and download
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `dario-save-${Date.now()}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                    resolve();
                }, 'image/png');
            });
        } catch (e) {
            console.error('iPhone backup creation failed:', e);
            throw e;
        }
    }
    
    static createiPhoneFileBackup(gameState) {
        // Create a text file that can be saved to iPhone Files app
        const saveData = {
            version: 5,
            created: new Date().toISOString(),
            gameData: gameState,
            saveCode: this.generateSaveCode(gameState),
            instructions: [
                "This is your Tamagotchi Dario save backup!",
                "To restore:",
                "1. Open the game in Safari",
                "2. Go to Games → Save Data → Load Code", 
                "3. Copy and paste the saveCode from this file"
            ]
        };
        
        const content = JSON.stringify(saveData, null, 2);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tamagotchi-dario-backup-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    static async shareTonotes(gameState) {
        // Create shareable content for iPhone Notes
        const saveCode = this.generateSaveCode(gameState);
        const shareText = `🎮 TAMAGOTCHI DARIO SAVE BACKUP
Created: ${new Date().toLocaleDateString()}

📊 Current Stats:
🍎 Hunger: ${gameState.stats.hunger}/100
⚡ Energy: ${gameState.stats.energy}/100  
😊 Happiness: ${gameState.stats.happiness}/100
💖 Hearts: ${gameState.currency.hearts}
🏆 Tokens: ${gameState.tokens}
📈 Level: ${gameState.level}
👅 Licks: ${gameState.licks}

💾 SAVE CODE:
${saveCode}

📱 To restore your game:
1. Open Tamagotchi Dario in Safari
2. Go to Games → Save Data → Load Code
3. Copy and paste the save code above
4. Your progress will be restored! 🎉`;

        if (navigator.share) {
            // Use native share sheet on iOS
            try {
                await navigator.share({
                    title: 'Tamagotchi Dario Save Backup',
                    text: shareText
                });
                return true;
            } catch (e) {
                console.log('Share cancelled or failed');
                return false;
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(shareText);
                return true;
            } catch (e) {
                // Manual copy fallback
                const textArea = document.createElement('textarea');
                textArea.value = shareText;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            }
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