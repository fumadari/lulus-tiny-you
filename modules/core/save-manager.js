// ============================================
// Save Manager Module
// ============================================

export const SAVE_KEY = 'lulu-tiny-you-v5';

export class SaveManager {
    static createDefaultSave() {
        return {
            version: 5,
            lastSeenISO: new Date().toISOString(),
            lastUpdateTime: Date.now(),
            stats: { 
                hunger: 80, 
                energy: 80, 
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
            experience: 0
        };
    }

    static loadSave() {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (!saved) return this.createDefaultSave();
            const data = JSON.parse(saved);
            if (data.version !== 5) return this.createDefaultSave();
            return data;
        } catch (e) {
            return this.createDefaultSave();
        }
    }

    static saveNow(gameState) {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
        } catch (e) {
            console.error('Save error:', e);
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