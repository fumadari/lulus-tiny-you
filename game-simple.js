// ============================================
// LULU'S TINY YOU - Simple Compatible Version
// ============================================

const SAVE_KEY = 'lulu-tiny-you-v3';
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 420;

// NYC Map POIs
const NYC_POIS = [
    { name: "Central Park", x: 180, y: 100, emoji: "🌳" },
    { name: "Times Square", x: 160, y: 180, emoji: "🎭" },
    { name: "Brooklyn Bridge", x: 200, y: 260, emoji: "🌉" },
    { name: "Statue of Liberty", x: 100, y: 300, emoji: "🗽" },
    { name: "Empire State", x: 140, y: 140, emoji: "🏢" },
    { name: "Museum", x: 220, y: 120, emoji: "🏛️" }
];

// Trivia Questions
const TRIVIA_QUESTIONS = [
    { question: "What's Dario's favorite food?", options: ["Pizza", "Pasta", "Sushi", "Tacos"], correct: 1 },
    { question: "Dario's dream vacation?", options: ["Paris", "Tokyo", "With Lulu", "Beach"], correct: 2 },
    { question: "What makes Dario happiest?", options: ["Games", "Movies", "Lulu's smile", "Coffee"], correct: 2 },
    { question: "Dario's biggest fear?", options: ["Spiders", "Heights", "Losing Lulu", "Dark"], correct: 2 },
    { question: "Dario's love language?", options: ["Words", "Touch", "Gifts", "All of them"], correct: 3 }
];

// Save Manager
class SaveManager {
    static createDefaultSave() {
        return {
            version: 3,
            lastSeenISO: new Date().toISOString(),
            stats: { hunger: 70, energy: 70, happiness: 70 },
            currency: { hearts: 0, coins: 0 },
            inventory: [],
            map: { visitedPOIs: [], currentPOI: 0 },
            minigames: {
                feedFrenzy: { bestScore: 0, stars: 0 },
                petRhythm: { bestCombo: 0, stars: 0 },
                memory: { bestTimeMs: 999999, stars: 0 },
                trivia: { bestStreak: 0, stars: 0 }
            },
            tokens: 0,
            streak: { current: 0, lastDayISO: new Date().toISOString().split('T')[0] },
            settings: { soundOn: false, reducedMotion: false },
            unlockedTokenSources: []
        };
    }

    static loadSave() {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (!saved) return this.createDefaultSave();
            const data = JSON.parse(saved);
            if (data.version !== 3) return this.createDefaultSave();
            return data;
        } catch (e) {
            console.error('Save load error:', e);
            return this.createDefaultSave();
        }
    }

    static saveNow(gameState) {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
            if ('storage' in navigator && 'persist' in navigator.storage) {
                navigator.storage.persist();
            }
        } catch (e) {
            console.error('Save error:', e);
        }
    }

    static exportSave(gameState) {
        const blob = new Blob([JSON.stringify(gameState, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lulu-tiny-you-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Main Game Class
class TamagotchiGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        this.save = SaveManager.loadSave();
        this.currentScreen = 'main';
        this.lastUpdateTime = Date.now();
        this.frameCount = 0;
        
        this.sprite = { x: 180, y: 250, frame: 0, animation: 'idle' };
        this.particles = [];
        this.talkCooldown = 0;
        this.mapOpen = false;
        this.currentMinigame = null;
        this.minigameState = {};
        
        this.init();
    }

    async init() {
        try {
            // Simple loading
            const loadingFill = document.getElementById('loadingFill');
            const loadingText = document.getElementById('loadingText');
            
            loadingFill.style.width = '50%';
            loadingText.textContent = 'Loading game...';
            
            // Apply time decay
            this.applyTimeDecay();
            
            // Check daily streak
            this.checkDailyStreak();
            
            // Start game loop
            this.gameLoop();
            
            // Update UI
            this.updateUI();
            
            // Hide loading screen after delay
            setTimeout(() => {
                loadingFill.style.width = '100%';
                document.getElementById('loadingScreen').style.display = 'none';
                this.showNotification("Welcome back, Lulu! 💕");
            }, 1500);
            
            // Set up auto-save
            setInterval(() => this.autoSave(), 30000);
            
            // Set up event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Init error:', error);
            document.getElementById('loadingScreen').style.display = 'none';
            this.showNotification("Game loaded! 💕");
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.handleCanvasClick({ 
                offsetX: (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
                offsetY: (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
            });
        });
    }

    handleCanvasClick(e) {
        const x = e.offsetX;
        const y = e.offsetY;
        
        if (this.currentScreen === 'map') {
            this.handleMapClick(x, y);
        } else if (this.currentMinigame) {
            this.handleMinigameClick(x, y);
        }
    }

    applyTimeDecay() {
        const now = new Date();
        const lastSeen = new Date(this.save.lastSeenISO);
        const minutesAway = Math.floor((now - lastSeen) / (1000 * 60));
        
        if (minutesAway > 0) {
            this.save.stats.hunger = Math.max(0, this.save.stats.hunger - Math.floor(minutesAway / 10));
            this.save.stats.energy = Math.max(0, this.save.stats.energy - Math.floor(minutesAway / 10));
            this.save.stats.happiness = Math.max(0, this.save.stats.happiness - Math.floor(minutesAway / 20));
        }
        
        this.save.lastSeenISO = now.toISOString();
    }

    checkDailyStreak() {
        const today = new Date().toISOString().split('T')[0];
        if (this.save.streak.lastDayISO !== today) {
            this.save.streak.current = 1;
            this.save.streak.lastDayISO = today;
            this.save.currency.hearts += 5;
            this.showNotification(`Daily login! +5 💖`);
        }
    }

    gameLoop() {
        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;
        this.lastUpdateTime = now;
        this.frameCount++;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Update cooldowns
        if (this.talkCooldown > 0) {
            this.talkCooldown -= deltaTime;
        }
        
        // Update sprite animation
        this.sprite.frame += deltaTime * 0.001;
        if (this.sprite.frame >= 2) this.sprite.frame = 0;
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.y -= 2;
            particle.life -= deltaTime;
            return particle.life > 0;
        });
        
        // Auto-decay stats slowly
        if (this.frameCount % 1800 === 0) { // Every 30 seconds at 60fps
            this.save.stats.hunger = Math.max(0, this.save.stats.hunger - 1);
            this.save.stats.energy = Math.max(0, this.save.stats.energy - 1);
            this.save.stats.happiness = Math.max(0, this.save.stats.happiness - 1);
            this.updateUI();
        }
        
        // Check for ring event
        if (this.save.tokens >= 5 && !this.save.inventory.includes('Ring')) {
            this.triggerRingEvent();
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if (this.currentScreen === 'main') {
            this.renderMain();
        } else if (this.currentScreen === 'map') {
            this.renderMap();
        } else if (this.currentMinigame) {
            this.renderMinigame();
        }
        
        // Render particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
    }

    renderMain() {
        // Sky
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour >= 20;
        this.ctx.fillStyle = isNight ? '#0a0a2e' : '#87CEEB';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, 320);
        
        // Ground
        this.ctx.fillStyle = '#8FBC8F';
        this.ctx.fillRect(0, 320, CANVAS_WIDTH, 100);
        
        // Simple buildings
        this.ctx.fillStyle = '#2F4F4F';
        for (let i = 0; i < 8; i++) {
            const h = 80 + Math.sin(i) * 40;
            this.ctx.fillRect(i * 45 + 10, 320 - h, 40, h);
        }
        
        // Draw sprite (simple pixel character)
        this.drawSimpleSprite();
        
        // Status bubbles
        if (this.save.stats.hunger < 30) {
            this.drawBubble(this.sprite.x, this.sprite.y - 50, "Hungry! 🍎");
        } else if (this.save.stats.energy < 30) {
            this.drawBubble(this.sprite.x, this.sprite.y - 50, "Tired! 😴");
        } else if (this.save.stats.happiness < 30) {
            this.drawBubble(this.sprite.x, this.sprite.y - 50, "Sad! 😢");
        }
    }

    drawSimpleSprite() {
        const x = this.sprite.x;
        const y = this.sprite.y + Math.sin(this.frameCount * 0.1) * 2; // Floating animation
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 30, 20, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Body
        this.ctx.fillStyle = '#4169E1';
        this.ctx.fillRect(x - 15, y - 10, 30, 25);
        
        // Head
        this.ctx.fillStyle = '#FDBCB4';
        this.ctx.fillRect(x - 20, y - 35, 40, 30);
        
        // Hair
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - 20, y - 35, 40, 12);
        
        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - 10, y - 20, 4, 4);
        this.ctx.fillRect(x + 6, y - 20, 4, 4);
        
        // Mouth
        if (this.save.stats.happiness > 50) {
            this.ctx.fillRect(x - 5, y - 12, 10, 2);
        }
        
        // Arms
        this.ctx.fillStyle = '#FDBCB4';
        this.ctx.fillRect(x - 25, y - 5, 8, 15);
        this.ctx.fillRect(x + 17, y - 5, 8, 15);
        
        // Legs
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - 10, y + 15, 8, 10);
        this.ctx.fillRect(x + 2, y + 15, 8, 10);
    }

    drawBubble(x, y, text) {
        this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        const width = text.length * 8 + 20;
        this.ctx.fillRect(x - width/2, y - 10, width, 25);
        this.ctx.strokeRect(x - width/2, y - 10, width, 25);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = '11px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y + 5);
    }

    renderMap() {
        // Map background
        this.ctx.fillStyle = '#e8dcc6';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Water
        this.ctx.fillStyle = '#4682B4';
        this.ctx.fillRect(0, 350, CANVAS_WIDTH, 70);
        
        // Roads
        this.ctx.strokeStyle = '#696969';
        this.ctx.lineWidth = 2;
        for (let x = 40; x < CANVAS_WIDTH; x += 80) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, CANVAS_HEIGHT);
            this.ctx.stroke();
        }
        for (let y = 40; y < CANVAS_HEIGHT; y += 80) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(CANVAS_WIDTH, y);
            this.ctx.stroke();
        }
        
        // POIs
        NYC_POIS.forEach((poi, index) => {
            const visited = this.save.map.visitedPOIs.includes(index);
            
            this.ctx.fillStyle = visited ? '#90EE90' : '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(poi.x, poi.y, 25, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.font = '20px serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(poi.emoji, poi.x, poi.y + 5);
            
            this.ctx.fillStyle = '#333';
            this.ctx.font = '9px monospace';
            this.ctx.fillText(poi.name, poi.x, poi.y + 40);
        });
        
        // Player marker
        const current = NYC_POIS[this.save.map.currentPOI || 0];
        this.ctx.fillStyle = '#FF1493';
        this.ctx.fillRect(current.x - 5, current.y - 35, 10, 10);
        this.ctx.font = '10px monospace';
        this.ctx.fillText("YOU", current.x, current.y - 40);
    }

    handleMapClick(x, y) {
        NYC_POIS.forEach((poi, index) => {
            const dist = Math.sqrt((x - poi.x) ** 2 + (y - poi.y) ** 2);
            if (dist < 30) {
                this.visitPOI(index);
            }
        });
    }

    visitPOI(index) {
        const poi = NYC_POIS[index];
        this.save.map.currentPOI = index;
        
        if (!this.save.map.visitedPOIs.includes(index)) {
            this.save.map.visitedPOIs.push(index);
            this.save.currency.hearts += 10;
            this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 10);
            this.showNotification(`Visited ${poi.name}! +10 💖`);
        }
        
        this.currentScreen = 'main';
        this.updateUI();
        this.autoSave();
    }

    renderMinigame() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Playing: ${this.currentMinigame}`, CANVAS_WIDTH/2, 100);
        this.ctx.fillText('Mini-game in progress...', CANVAS_WIDTH/2, 200);
        this.ctx.fillText('Tap to complete!', CANVAS_WIDTH/2, 300);
    }

    handleMinigameClick(x, y) {
        // Simple minigame completion
        const hearts = Math.floor(Math.random() * 20) + 10;
        this.save.currency.hearts += hearts;
        
        // Random chance for token
        if (Math.random() > 0.7 && this.save.tokens < 5) {
            this.save.tokens++;
            this.showNotification(`🏆 Token earned! Hearts: +${hearts}`);
        } else {
            this.showNotification(`Game complete! Hearts: +${hearts}`);
        }
        
        this.currentMinigame = null;
        this.currentScreen = 'main';
        this.updateUI();
        this.autoSave();
    }

    // Game Actions
    feed() {
        if (this.save.stats.hunger < 100) {
            this.save.stats.hunger = Math.min(100, this.save.stats.hunger + 15);
            this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 5);
            this.addParticles(this.sprite.x, this.sprite.y - 20, '#FF6B6B');
            this.showNotification("Yummy! 😋");
            this.updateUI();
            this.autoSave();
        } else {
            this.showNotification("I'm full! 😅");
        }
    }

    pet() {
        this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 10);
        this.save.stats.energy = Math.min(100, this.save.stats.energy + 5);
        this.addParticles(this.sprite.x, this.sprite.y - 20, '#FFB6C1');
        this.showNotification("That feels nice! 🥰");
        this.updateUI();
        this.autoSave();
    }

    talk() {
        if (this.talkCooldown <= 0) {
            this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 5);
            const messages = [
                "I love you, Lulu! 💕",
                "You're the best! ✨",
                "Let's explore NYC! 🗽",
                "I missed you! 🥺",
                "You make me happy! 😊"
            ];
            this.showNotification(messages[Math.floor(Math.random() * messages.length)]);
            this.talkCooldown = 10000;
            this.updateUI();
            this.autoSave();
        } else {
            this.showNotification("Let me think... 🤔");
        }
    }

    openMap() {
        this.currentScreen = 'map';
        this.showNotification("Let's explore NYC! 🗽");
    }

    toggleMenu() {
        const menu = document.getElementById('menuOverlay');
        menu.classList.toggle('show');
    }

    startMinigame(gameType) {
        this.toggleMenu();
        this.currentMinigame = gameType;
        this.currentScreen = 'minigame';
        this.showNotification(`Starting ${gameType}! 🎮`);
    }

    photoBooth() {
        this.toggleMenu();
        this.showNotification("Photo saved! 📸💖");
        
        // Simple photo download
        this.canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lulu-tiny-you-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    manageSave() {
        this.toggleMenu();
        this.exportSaveData();
    }

    exportSaveData() {
        SaveManager.exportSave(this.save);
        this.showNotification("Save exported! 💾");
    }

    triggerRingEvent() {
        this.save.inventory.push('Ring');
        
        const ringDiv = document.getElementById('ringEvent');
        ringDiv.innerHTML = `
            <div style="text-align: center; color: white; padding: 40px;">
                <div style="font-size: 20px;">💎 CONGRATULATIONS! 💎</div>
                <div style="font-size: 60px; margin: 20px;">💍</div>
                <div style="font-size: 12px; line-height: 1.6;">
                    You've collected all tokens!<br><br>
                    "Lulu, you make every day magical.<br>
                    You're my everything! 💖"
                </div>
                <button class="modal-button" onclick="game.closeRingEvent()">
                    💕 I LOVE YOU TOO! 💕
                </button>
            </div>
        `;
        ringDiv.classList.add('show');
        this.autoSave();
    }

    closeRingEvent() {
        document.getElementById('ringEvent').classList.remove('show');
        this.showNotification("Ring unlocked! 💍✨");
        this.save.stats.happiness = 100;
        this.save.currency.hearts += 100;
        this.updateUI();
    }

    updateUI() {
        document.getElementById('hungerBar').style.width = this.save.stats.hunger + '%';
        document.getElementById('energyBar').style.width = this.save.stats.energy + '%';
        document.getElementById('happinessBar').style.width = this.save.stats.happiness + '%';
        document.getElementById('tokenCount').textContent = this.save.tokens;
        document.getElementById('heartCount').textContent = this.save.currency.hearts;
    }

    showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }

    closeModal() {
        document.getElementById('gameModal').classList.remove('show');
    }

    addParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                color: color,
                life: 2000
            });
        }
    }

    autoSave() {
        this.save.lastSeenISO = new Date().toISOString();
        SaveManager.saveNow(this.save);
    }
}

// Initialize game
let game;
window.addEventListener('DOMContentLoaded', () => {
    try {
        game = new TamagotchiGame();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Game initialization error:', error);
        document.getElementById('loadingScreen').style.display = 'none';
        alert('Game loaded! Please refresh if you see any issues.');
    }
});