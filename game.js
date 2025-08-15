// ============================================
// LULU'S TINY YOU - Complete Tamagotchi Game
// ============================================

const SAVE_KEY = 'lulu-tiny-you-v3';
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 420;

// Pixel Art Sprites (16x16 base, drawn at 2x scale)
const SPRITES = {
    dario: {
        idle: [
            // Frame 1
            [
                "    ####    ",
                "   ######   ",
                "  ########  ",
                "  ###  ###  ",
                "  ########  ",
                "  ## ## ##  ",
                "  ########  ",
                "   ######   ",
                "    ####    ",
                "   ######   ",
                "  ########  ",
                " ##########",
                " #### ##### ",
                " ###   ###  ",
                "  ##   ##   ",
                "  ##   ##   "
            ],
            // Frame 2
            [
                "    ####    ",
                "   ######   ",
                "  ########  ",
                "  ###  ###  ",
                "  ########  ",
                "  ## ## ##  ",
                "  ########  ",
                "   ######   ",
                "    ####    ",
                "   ######   ",
                "  ########  ",
                " ##########",
                " ##### #### ",
                "  ###   ### ",
                "   ##   ##  ",
                "   ##   ##  "
            ]
        ],
        happy: [
            [
                "    ####    ",
                "   ######   ",
                "  ########  ",
                "  # ## # #  ",
                "  ########  ",
                "  ########  ",
                "  # #### #  ",
                "   ######   ",
                "    ####    ",
                "   ######   ",
                "  ########  ",
                " ##########",
                " #### ##### ",
                " ###   ###  ",
                "  ##   ##   ",
                "  ##   ##   "
            ]
        ],
        sleep: [
            [
                "    ####    ",
                "   ######   ",
                "  ########  ",
                "  ########  ",
                "  ########  ",
                "  ########  ",
                "  ########  ",
                "   ######   ",
                "  zZ####    ",
                " zZ######   ",
                "  ########  ",
                " ##########",
                " ##########",
                " ###   ###  ",
                "  ##   ##   ",
                "  ##   ##   "
            ]
        ],
        eat: [
            [
                "    ####    ",
                "   ######   ",
                "  ########  ",
                "  ###  ###  ",
                "  ########  ",
                "  ## ## ##  ",
                "  ###OO###  ",
                "   ##OO##   ",
                "    ####    ",
                "   ######   ",
                "  ########  ",
                " ##########",
                " #### ##### ",
                " ###   ###  ",
                "  ##   ##   ",
                "  ##   ##   "
            ]
        ]
    }
};

// NYC Map POIs
const NYC_POIS = [
    { name: "Central Park", x: 180, y: 100, emoji: "🌳", visited: false },
    { name: "Times Square", x: 160, y: 180, emoji: "🎭", visited: false },
    { name: "Brooklyn Bridge", x: 200, y: 260, emoji: "🌉", visited: false },
    { name: "Statue of Liberty", x: 100, y: 300, emoji: "🗽", visited: false },
    { name: "Empire State", x: 140, y: 140, emoji: "🏢", visited: false },
    { name: "Museum", x: 220, y: 120, emoji: "🏛️", visited: false }
];

// Trivia Questions
const TRIVIA_QUESTIONS = [
    {
        question: "What's Dario's favorite food?",
        options: ["Pizza", "Pasta", "Sushi", "Tacos"],
        correct: 1
    },
    {
        question: "Dario's dream vacation spot?",
        options: ["Paris", "Tokyo", "Anywhere with Lulu", "Beach"],
        correct: 2
    },
    {
        question: "What makes Dario happiest?",
        options: ["Games", "Movies", "Lulu's smile", "Coffee"],
        correct: 2
    },
    {
        question: "Dario's biggest fear?",
        options: ["Spiders", "Heights", "Losing Lulu", "Dark"],
        correct: 2
    },
    {
        question: "Dario's favorite season?",
        options: ["Spring", "Summer", "Fall", "Winter"],
        correct: 1
    },
    {
        question: "What superpower would Dario want?",
        options: ["Flying", "Time travel", "Mind reading", "Teleportation"],
        correct: 3
    },
    {
        question: "Dario's favorite way to relax?",
        options: ["Reading", "Gaming", "Cuddling with Lulu", "Music"],
        correct: 2
    },
    {
        question: "What time does Dario prefer?",
        options: ["Early morning", "Afternoon", "Evening", "Late night"],
        correct: 3
    },
    {
        question: "Dario's love language?",
        options: ["Words", "Touch", "Gifts", "All of them"],
        correct: 3
    },
    {
        question: "What emoji represents Dario?",
        options: ["😎", "🤓", "😍", "🥰"],
        correct: 3
    }
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
            if (data.version !== 3) {
                return this.migrateSave(data);
            }
            
            return data;
        } catch (e) {
            console.error('Save load error:', e);
            return this.createDefaultSave();
        }
    }

    static migrateSave(oldData) {
        const newSave = this.createDefaultSave();
        if (oldData.stats) newSave.stats = oldData.stats;
        if (oldData.currency) newSave.currency = oldData.currency;
        if (oldData.tokens) newSave.tokens = oldData.tokens;
        return newSave;
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

    static async importSave(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (data.version === 3) {
                SaveManager.saveNow(data);
                return data;
            }
        } catch (e) {
            console.error('Import error:', e);
        }
        return null;
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
        
        // Sprite state
        this.sprite = {
            x: 180,
            y: 250,
            frame: 0,
            animation: 'idle',
            facingRight: true
        };
        
        // Particles
        this.particles = [];
        
        // Cooldowns
        this.talkCooldown = 0;
        
        // Map state
        this.mapOpen = false;
        this.mapTargetPOI = null;
        
        // Minigame state
        this.currentMinigame = null;
        this.minigameState = {};
        
        this.init();
    }

    async init() {
        // Show loading screen
        await this.showLoadingScreen();
        
        // Apply time decay
        this.applyTimeDecay();
        
        // Check daily streak
        this.checkDailyStreak();
        
        // Start game loop
        this.gameLoop();
        
        // Update UI
        this.updateUI();
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            this.showNotification("Welcome back, Lulu! 💕");
        }, 2000);
        
        // Set up auto-save
        setInterval(() => this.autoSave(), 30000);
        
        // Set up event listeners
        this.setupEventListeners();
    }

    async showLoadingScreen() {
        const loadingFill = document.getElementById('loadingFill');
        const loadingText = document.getElementById('loadingText');
        const messages = [
            "Waking up Dario...",
            "Preparing activities...",
            "Loading NYC map...",
            "Getting ready for Lulu..."
        ];
        
        for (let i = 0; i <= 100; i += 25) {
            loadingFill.style.width = i + '%';
            loadingText.textContent = messages[Math.floor(i / 25)];
            await new Promise(resolve => setTimeout(resolve, 400));
        }
    }

    setupEventListeners() {
        // Canvas click handler
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.handleCanvasClick({ offsetX: x, offsetY: y });
        });
        
        // Keyboard support for minigames
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    handleCanvasClick(e) {
        const x = e.offsetX * (CANVAS_WIDTH / this.canvas.offsetWidth);
        const y = e.offsetY * (CANVAS_HEIGHT / this.canvas.offsetHeight);
        
        if (this.currentScreen === 'map') {
            this.handleMapClick(x, y);
        } else if (this.currentMinigame) {
            this.handleMinigameClick(x, y);
        }
    }

    handleKeyPress(e) {
        if (this.currentMinigame === 'petRhythm') {
            if (e.key === ' ' || e.key === 'Enter') {
                this.minigameState.tapBeat();
            }
        }
    }

    applyTimeDecay() {
        const now = new Date();
        const lastSeen = new Date(this.save.lastSeenISO);
        const minutesAway = Math.floor((now - lastSeen) / (1000 * 60));
        
        if (minutesAway > 0) {
            const hungerDecay = Math.floor(minutesAway / 10);
            const energyDecay = Math.floor(minutesAway / 10);
            const happinessDecay = Math.floor(minutesAway / 20);
            
            this.save.stats.hunger = Math.max(0, this.save.stats.hunger - hungerDecay);
            this.save.stats.energy = Math.max(0, this.save.stats.energy - energyDecay);
            this.save.stats.happiness = Math.max(0, this.save.stats.happiness - happinessDecay);
            
            if (minutesAway > 60) {
                this.showNotification("I missed you so much! 🥺");
            }
        }
        
        this.save.lastSeenISO = now.toISOString();
    }

    checkDailyStreak() {
        const today = new Date().toISOString().split('T')[0];
        const lastDay = this.save.streak.lastDayISO;
        
        if (lastDay !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayISO = yesterday.toISOString().split('T')[0];
            
            if (lastDay === yesterdayISO) {
                this.save.streak.current++;
                if (this.save.streak.current === 3 && !this.save.unlockedTokenSources.includes('streak3')) {
                    this.save.tokens++;
                    this.save.unlockedTokenSources.push('streak3');
                    this.showNotification("🏆 3-day streak! Golden Token earned!");
                }
            } else {
                this.save.streak.current = 1;
            }
            
            this.save.streak.lastDayISO = today;
            this.save.currency.hearts += 5;
            this.showNotification(`Daily login! +5 💖 (Streak: ${this.save.streak.current})`);
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
            particle.y -= particle.vy * deltaTime * 0.001;
            particle.x += particle.vx * deltaTime * 0.001;
            particle.life -= deltaTime;
            particle.vy -= 0.1; // gravity
            return particle.life > 0;
        });
        
        // Update minigame if active
        if (this.currentMinigame) {
            this.updateMinigame(deltaTime);
        }
        
        // Auto-decay stats (very slow)
        if (this.frameCount % 600 === 0) { // Every ~10 seconds
            this.save.stats.hunger = Math.max(0, this.save.stats.hunger - 0.5);
            this.save.stats.energy = Math.max(0, this.save.stats.energy - 0.3);
            this.save.stats.happiness = Math.max(0, this.save.stats.happiness - 0.2);
            this.updateUI();
        }
        
        // Check for ring event
        if (this.save.tokens >= 5 && !this.save.inventory.includes('Ring')) {
            this.triggerRingEvent();
        }
        
        // Update sprite state based on stats
        if (this.save.stats.energy < 20) {
            this.sprite.animation = 'sleep';
        } else if (this.save.stats.happiness > 80) {
            this.sprite.animation = 'happy';
        } else {
            this.sprite.animation = 'idle';
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = this.getBackgroundColor();
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if (this.currentScreen === 'main') {
            this.renderMain();
        } else if (this.currentScreen === 'map') {
            this.renderMap();
        } else if (this.currentMinigame) {
            this.renderMinigame();
        }
        
        // Always render particles on top
        this.renderParticles();
    }

    renderMain() {
        // Draw background
        this.drawBackground();
        
        // Draw ground
        this.ctx.fillStyle = '#8FBC8F';
        this.ctx.fillRect(0, 320, CANVAS_WIDTH, 100);
        
        // Draw some grass details
        this.ctx.fillStyle = '#228B22';
        for (let i = 0; i < 20; i++) {
            const x = Math.sin(i * 0.5) * 50 + i * 20;
            const y = 325 + Math.sin(i) * 5;
            this.ctx.fillRect(x, y, 3, 8);
        }
        
        // Draw sprite
        this.drawSprite();
        
        // Draw status indicators
        if (this.save.stats.hunger < 30) {
            this.drawTextBubble(this.sprite.x, this.sprite.y - 40, "Hungry! 🍎");
        } else if (this.save.stats.energy < 30) {
            this.drawTextBubble(this.sprite.x, this.sprite.y - 40, "Tired! 😴");
        } else if (this.save.stats.happiness < 30) {
            this.drawTextBubble(this.sprite.x, this.sprite.y - 40, "Sad! 😢");
        }
    }

    drawBackground() {
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour >= 20;
        
        if (isNight) {
            // Night sky with stars
            this.ctx.fillStyle = '#0a0a2e';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, 320);
            
            // Stars
            this.ctx.fillStyle = '#fff';
            for (let i = 0; i < 30; i++) {
                const x = (Math.sin(i * 12.34) + 1) * CANVAS_WIDTH / 2;
                const y = (Math.sin(i * 45.67) + 1) * 160;
                const size = Math.sin(i) > 0 ? 2 : 1;
                this.ctx.fillRect(x, y, size, size);
            }
            
            // Moon
            this.ctx.fillStyle = '#fffacd';
            this.ctx.beginPath();
            this.ctx.arc(300, 60, 20, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Day sky
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, 320);
            
            // Clouds
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            for (let i = 0; i < 3; i++) {
                const x = 50 + i * 120 + Math.sin(this.frameCount * 0.001 + i) * 20;
                const y = 40 + i * 30;
                this.drawCloud(x, y);
            }
            
            // Sun
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(60, 60, 25, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // NYC Skyline
        this.ctx.fillStyle = '#2F4F4F';
        const buildings = [
            { x: 20, w: 40, h: 100 },
            { x: 65, w: 35, h: 120 },
            { x: 105, w: 45, h: 90 },
            { x: 155, w: 30, h: 140 },
            { x: 190, w: 40, h: 110 },
            { x: 235, w: 35, h: 130 },
            { x: 275, w: 45, h: 95 },
            { x: 325, w: 30, h: 115 }
        ];
        
        buildings.forEach(b => {
            this.ctx.fillRect(b.x, 320 - b.h, b.w, b.h);
            
            // Windows
            this.ctx.fillStyle = '#FFD700';
            for (let y = 0; y < b.h - 10; y += 15) {
                for (let x = 5; x < b.w - 5; x += 10) {
                    if (Math.random() > 0.3) {
                        this.ctx.fillRect(b.x + x, 320 - b.h + y + 5, 6, 8);
                    }
                }
            }
            this.ctx.fillStyle = '#2F4F4F';
        });
    }

    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 15, 0, Math.PI * 2);
        this.ctx.arc(x + 15, y, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 30, y, 15, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSprite() {
        const animation = SPRITES.dario[this.sprite.animation] || SPRITES.dario.idle;
        const frame = animation[Math.floor(this.sprite.frame) % animation.length];
        
        const scale = 3;
        const offsetX = this.sprite.x - (frame[0].length * scale) / 2;
        const offsetY = this.sprite.y - (frame.length * scale) / 2;
        
        frame.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                const char = row[x];
                if (char === '#') {
                    this.ctx.fillStyle = '#FDBCB4'; // Skin
                } else if (char === 'z' || char === 'Z') {
                    this.ctx.fillStyle = '#4169E1'; // Sleep Z's
                } else if (char === 'O') {
                    this.ctx.fillStyle = '#FF6B6B'; // Food
                } else {
                    continue;
                }
                
                const pixelX = offsetX + x * scale;
                const pixelY = offsetY + y * scale;
                
                if (this.sprite.facingRight) {
                    this.ctx.fillRect(pixelX, pixelY, scale, scale);
                } else {
                    // Mirror horizontally
                    this.ctx.fillRect(offsetX + (row.length - x - 1) * scale, pixelY, scale, scale);
                }
            }
        }
        
        // Draw hair
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(offsetX + 3 * scale, offsetY, 6 * scale, 3 * scale);
        
        // Draw eyes
        this.ctx.fillStyle = '#000';
        if (this.sprite.animation !== 'sleep') {
            this.ctx.fillRect(offsetX + 4 * scale, offsetY + 4 * scale, scale, scale);
            this.ctx.fillRect(offsetX + 7 * scale, offsetY + 4 * scale, scale, scale);
        }
        
        // Draw clothes (simple t-shirt)
        this.ctx.fillStyle = '#4169E1';
        this.ctx.fillRect(offsetX + 3 * scale, offsetY + 9 * scale, 6 * scale, 5 * scale);
    }

    drawTextBubble(x, y, text) {
        const padding = 8;
        const width = text.length * 6 + padding * 2;
        const height = 20;
        
        // Bubble
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.roundRect(x - width / 2, y - height / 2, width, height, 5);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Tail
        this.ctx.beginPath();
        this.ctx.moveTo(x - 5, y + height / 2);
        this.ctx.lineTo(x, y + height / 2 + 8);
        this.ctx.lineTo(x + 5, y + height / 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Text
        this.ctx.fillStyle = '#333';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
    }

    renderMap() {
        // NYC Map Background
        this.ctx.fillStyle = '#e8dcc6';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Water (rivers)
        this.ctx.fillStyle = '#4682B4';
        this.ctx.fillRect(0, 350, CANVAS_WIDTH, 70);
        this.ctx.fillRect(280, 0, 80, CANVAS_HEIGHT);
        
        // Parks
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(150, 80, 80, 60); // Central Park
        
        // Roads
        this.ctx.strokeStyle = '#696969';
        this.ctx.lineWidth = 3;
        // Vertical roads
        for (let x = 40; x < CANVAS_WIDTH; x += 60) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, CANVAS_HEIGHT);
            this.ctx.stroke();
        }
        // Horizontal roads
        for (let y = 40; y < CANVAS_HEIGHT; y += 60) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(CANVAS_WIDTH, y);
            this.ctx.stroke();
        }
        
        // POIs
        NYC_POIS.forEach((poi, index) => {
            const isVisited = this.save.map.visitedPOIs.includes(index);
            
            // POI circle
            this.ctx.fillStyle = isVisited ? '#90EE90' : '#FFD700';
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(poi.x, poi.y, 25, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // POI emoji
            this.ctx.font = '20px serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(poi.emoji, poi.x, poi.y);
            
            // POI name
            this.ctx.fillStyle = '#333';
            this.ctx.font = '8px monospace';
            this.ctx.fillText(poi.name, poi.x, poi.y + 35);
        });
        
        // Player marker
        const currentPOI = NYC_POIS[this.save.map.currentPOI];
        this.ctx.fillStyle = '#FF1493';
        this.ctx.beginPath();
        this.ctx.arc(currentPOI.x, currentPOI.y - 30, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillText("YOU", currentPOI.x, currentPOI.y - 45);
        
        // Instructions
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 200, 30);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText("Tap a location to visit!", 20, 28);
    }

    handleMapClick(x, y) {
        NYC_POIS.forEach((poi, index) => {
            const dist = Math.sqrt((x - poi.x) ** 2 + (y - poi.y) ** 2);
            if (dist < 30) {
                this.visitPOI(index);
            }
        });
    }

    visitPOI(poiIndex) {
        const poi = NYC_POIS[poiIndex];
        this.save.map.currentPOI = poiIndex;
        
        if (!this.save.map.visitedPOIs.includes(poiIndex)) {
            this.save.map.visitedPOIs.push(poiIndex);
            this.save.currency.hearts += 10;
            this.showNotification(`Visited ${poi.name}! +10 💖`);
            
            // Random stat boost
            this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 10);
            this.save.stats.energy = Math.max(0, this.save.stats.energy - 5);
        } else {
            this.showNotification(`Back at ${poi.name}!`);
        }
        
        this.currentScreen = 'main';
        this.sprite.x = 180;
        this.sprite.y = 250;
        this.updateUI();
        this.autoSave();
    }

    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            
            if (particle.type === 'heart') {
                this.ctx.font = `${particle.size}px serif`;
                this.ctx.fillText('💖', particle.x, particle.y);
            } else if (particle.type === 'star') {
                this.ctx.font = `${particle.size}px serif`;
                this.ctx.fillText('⭐', particle.x, particle.y);
            } else {
                this.ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
            }
            
            this.ctx.globalAlpha = 1;
        });
    }

    getBackgroundColor() {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) return '#87CEEB'; // Morning
        if (hour >= 12 && hour < 18) return '#87CEEB'; // Afternoon
        if (hour >= 18 && hour < 20) return '#FFA500'; // Sunset
        return '#0a0a2e'; // Night
    }

    // === GAME ACTIONS ===
    
    feed() {
        if (this.save.stats.hunger < 100) {
            this.save.stats.hunger = Math.min(100, this.save.stats.hunger + 15);
            this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 5);
            this.sprite.animation = 'eat';
            setTimeout(() => this.sprite.animation = 'idle', 1000);
            
            this.addParticles(this.sprite.x, this.sprite.y - 20, '#FF6B6B', 5);
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
        this.sprite.animation = 'happy';
        setTimeout(() => this.sprite.animation = 'idle', 1500);
        
        // Heart particles
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: this.sprite.x + (Math.random() - 0.5) * 30,
                y: this.sprite.y - 20,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 2,
                color: '#FF69B4',
                size: 16,
                life: 2000,
                maxLife: 2000,
                type: 'heart'
            });
        }
        
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
                "You make me happy! 😊",
                "Want to play? 🎮",
                "Pet me more? 🤗",
                "I wrote you a poem! 📝",
                "You're beautiful! 😍",
                "Forever yours! 💖"
            ];
            
            const message = messages[Math.floor(Math.random() * messages.length)];
            this.showNotification(message);
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

    // === MINIGAMES ===

    startMinigame(gameType) {
        this.toggleMenu();
        this.currentMinigame = gameType;
        this.currentScreen = 'minigame';
        
        if (gameType === 'feedFrenzy') {
            this.initFeedFrenzy();
        } else if (gameType === 'petRhythm') {
            this.initPetRhythm();
        } else if (gameType === 'memory') {
            this.initMemory();
        } else if (gameType === 'trivia') {
            this.initTrivia();
        }
    }

    // Feed Frenzy Minigame
    initFeedFrenzy() {
        this.minigameState = {
            score: 0,
            time: 60,
            items: [],
            playerX: 180,
            speed: 1
        };
        
        this.showNotification("Catch the treats! Avoid broccoli! 🍎");
    }

    updateFeedFrenzy(deltaTime) {
        const state = this.minigameState;
        
        // Update time
        state.time -= deltaTime / 1000;
        if (state.time <= 0) {
            this.endFeedFrenzy();
            return;
        }
        
        // Spawn items
        if (Math.random() < 0.02 * state.speed) {
            const isGood = Math.random() > 0.2;
            state.items.push({
                x: Math.random() * (CANVAS_WIDTH - 40) + 20,
                y: 0,
                speed: 2 + Math.random() * 2 * state.speed,
                emoji: isGood ? ['🍎', '🍕', '🍰', '🍪'][Math.floor(Math.random() * 4)] : '🥦',
                isGood: isGood
            });
        }
        
        // Update items
        state.items = state.items.filter(item => {
            item.y += item.speed;
            
            // Check collision with player
            if (Math.abs(item.x - state.playerX) < 30 && item.y > 350 && item.y < 380) {
                if (item.isGood) {
                    state.score += 10;
                    this.addParticles(item.x, item.y, '#FFD700', 3);
                } else {
                    state.score = Math.max(0, state.score - 5);
                    this.addParticles(item.x, item.y, '#FF0000', 3);
                }
                return false;
            }
            
            return item.y < CANVAS_HEIGHT;
        });
        
        // Increase difficulty
        state.speed = 1 + state.score / 100;
    }

    renderFeedFrenzy() {
        const state = this.minigameState;
        
        // Background
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Ground
        this.ctx.fillStyle = '#8FBC8F';
        this.ctx.fillRect(0, 380, CANVAS_WIDTH, 40);
        
        // Player basket
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(state.playerX - 25, 360, 50, 30);
        this.ctx.fillRect(state.playerX - 30, 355, 60, 10);
        
        // Items
        this.ctx.font = '24px serif';
        this.ctx.textAlign = 'center';
        state.items.forEach(item => {
            this.ctx.fillText(item.emoji, item.x, item.y);
        });
        
        // UI
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 150, 60);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${state.score}`, 20, 30);
        this.ctx.fillText(`Time: ${Math.ceil(state.time)}s`, 20, 50);
    }

    handleFeedFrenzyClick(x, y) {
        this.minigameState.playerX = Math.max(30, Math.min(CANVAS_WIDTH - 30, x));
    }

    endFeedFrenzy() {
        const score = this.minigameState.score;
        const hearts = Math.floor(score / 20);
        this.save.currency.hearts += hearts;
        
        let stars = 0;
        if (score >= 30) stars = 1;
        if (score >= 60) stars = 2;
        if (score >= 90) stars = 3;
        
        if (stars > this.save.minigames.feedFrenzy.stars) {
            this.save.minigames.feedFrenzy.stars = stars;
            this.save.minigames.feedFrenzy.bestScore = score;
            
            if (stars === 3 && !this.save.unlockedTokenSources.includes('feedFrenzy')) {
                this.save.tokens++;
                this.save.unlockedTokenSources.push('feedFrenzy');
                this.showNotification(`🏆 Perfect! Token earned!\nScore: ${score} | Hearts: +${hearts}`);
            } else {
                this.showNotification(`Score: ${score} | Stars: ${'⭐'.repeat(stars)}\nHearts: +${hearts}`);
            }
        } else {
            this.showNotification(`Score: ${score} | Hearts: +${hearts}`);
        }
        
        this.currentMinigame = null;
        this.currentScreen = 'main';
        this.updateUI();
        this.autoSave();
    }

    // Pet Rhythm Minigame
    initPetRhythm() {
        this.minigameState = {
            score: 0,
            combo: 0,
            maxCombo: 0,
            time: 45,
            beats: [],
            hitWindow: 100,
            nextBeatTime: 500,
            bpm: 120,
            perfect: 0,
            good: 0,
            miss: 0,
            tapBeat: () => this.handleRhythmTap()
        };
        
        this.showNotification("Tap to the beat! 🎵");
    }

    updatePetRhythm(deltaTime) {
        const state = this.minigameState;
        
        state.time -= deltaTime / 1000;
        if (state.time <= 0) {
            this.endPetRhythm();
            return;
        }
        
        // Generate beats
        state.nextBeatTime -= deltaTime;
        if (state.nextBeatTime <= 0) {
            state.beats.push({
                x: CANVAS_WIDTH,
                targetTime: Date.now() + 2000,
                hit: false
            });
            state.nextBeatTime = 60000 / state.bpm;
        }
        
        // Update beats
        state.beats = state.beats.filter(beat => {
            beat.x -= deltaTime * 0.18;
            
            // Check if missed
            if (beat.x < 50 && !beat.hit) {
                state.combo = 0;
                state.miss++;
                this.addParticles(60, 200, '#FF0000', 3);
                return false;
            }
            
            return beat.x > -20;
        });
    }

    renderPetRhythm() {
        const state = this.minigameState;
        
        // Background
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Beat line
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 200);
        this.ctx.lineTo(CANVAS_WIDTH, 200);
        this.ctx.stroke();
        
        // Target zone
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        this.ctx.fillRect(50, 180, 40, 40);
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.strokeRect(50, 180, 40, 40);
        
        // Beats
        state.beats.forEach(beat => {
            this.ctx.fillStyle = beat.hit ? '#00FF00' : '#FF69B4';
            this.ctx.beginPath();
            this.ctx.arc(beat.x, 200, 15, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // UI
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Combo: ${state.combo}`, 20, 30);
        this.ctx.fillText(`Score: ${state.score}`, 20, 50);
        this.ctx.fillText(`Time: ${Math.ceil(state.time)}s`, 20, 70);
        
        // Instructions
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("TAP when notes reach the box!", CANVAS_WIDTH/2, 250);
    }

    handleRhythmTap() {
        const state = this.minigameState;
        
        // Find closest beat
        let closestBeat = null;
        let closestDist = Infinity;
        
        state.beats.forEach(beat => {
            if (!beat.hit) {
                const dist = Math.abs(beat.x - 70);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestBeat = beat;
                }
            }
        });
        
        if (closestBeat && closestDist < 40) {
            closestBeat.hit = true;
            
            if (closestDist < 10) {
                // Perfect
                state.perfect++;
                state.score += 100;
                state.combo++;
                this.addParticles(70, 200, '#FFD700', 5);
                this.showNotification("PERFECT! 🌟");
            } else if (closestDist < 25) {
                // Good
                state.good++;
                state.score += 50;
                state.combo++;
                this.addParticles(70, 200, '#00FF00', 3);
            } else {
                // OK
                state.score += 25;
                state.combo++;
            }
            
            state.maxCombo = Math.max(state.maxCombo, state.combo);
        }
    }

    handleMinigameClick(x, y) {
        if (this.currentMinigame === 'feedFrenzy') {
            this.handleFeedFrenzyClick(x, y);
        } else if (this.currentMinigame === 'petRhythm') {
            this.handleRhythmTap();
        } else if (this.currentMinigame === 'memory') {
            this.handleMemoryClick(x, y);
        } else if (this.currentMinigame === 'trivia') {
            this.handleTriviaClick(x, y);
        }
    }

    endPetRhythm() {
        const state = this.minigameState;
        const total = state.perfect + state.good + state.miss;
        const accuracy = total > 0 ? (state.perfect + state.good) / total : 0;
        const hearts = Math.floor(state.score / 100);
        
        this.save.currency.hearts += hearts;
        
        let stars = 0;
        if (accuracy >= 0.7) stars = 1;
        if (accuracy >= 0.85) stars = 2;
        if (accuracy >= 0.95) stars = 3;
        
        if (stars > this.save.minigames.petRhythm.stars) {
            this.save.minigames.petRhythm.stars = stars;
            this.save.minigames.petRhythm.bestCombo = state.maxCombo;
            
            if (stars === 3 && !this.save.unlockedTokenSources.includes('petRhythm')) {
                this.save.tokens++;
                this.save.unlockedTokenSources.push('petRhythm');
                this.showNotification(`🏆 Perfect rhythm! Token earned!\nAccuracy: ${Math.round(accuracy*100)}%`);
            } else {
                this.showNotification(`Accuracy: ${Math.round(accuracy*100)}%\nMax Combo: ${state.maxCombo}`);
            }
        }
        
        this.currentMinigame = null;
        this.currentScreen = 'main';
        this.updateUI();
        this.autoSave();
    }

    // Memory Minigame
    initMemory() {
        const icons = ['💖', '🌟', '🎵', '🍎', '🎮', '🗽'];
        const cards = [];
        icons.forEach(icon => {
            cards.push({ icon, flipped: false, matched: false });
            cards.push({ icon, flipped: false, matched: false });
        });
        
        // Shuffle
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        
        this.minigameState = {
            cards: cards,
            flipped: [],
            moves: 0,
            startTime: Date.now(),
            completed: false
        };
        
        this.showNotification("Match the pairs! 🧠");
    }

    renderMemory() {
        const state = this.minigameState;
        
        // Background
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Cards (4x3 grid)
        const cardWidth = 70;
        const cardHeight = 90;
        const spacing = 10;
        const startX = 30;
        const startY = 80;
        
        state.cards.forEach((card, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            const x = startX + col * (cardWidth + spacing);
            const y = startY + row * (cardHeight + spacing);
            
            // Card background
            if (card.matched) {
                this.ctx.fillStyle = '#90EE90';
            } else if (card.flipped) {
                this.ctx.fillStyle = '#FFD700';
            } else {
                this.ctx.fillStyle = '#34495e';
            }
            
            this.ctx.fillRect(x, y, cardWidth, cardHeight);
            this.ctx.strokeStyle = '#fff';
            this.ctx.strokeRect(x, y, cardWidth, cardHeight);
            
            // Card content
            if (card.flipped || card.matched) {
                this.ctx.font = '24px serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(card.icon, x + cardWidth/2, y + cardHeight/2);
            } else {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '20px serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('?', x + cardWidth/2, y + cardHeight/2);
            }
        });
        
        // UI
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 60);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Moves: ${state.moves}`, 20, 30);
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        this.ctx.fillText(`Time: ${elapsed}s`, 20, 50);
    }

    handleMemoryClick(x, y) {
        const state = this.minigameState;
        if (state.completed || state.flipped.length >= 2) return;
        
        const cardWidth = 70;
        const cardHeight = 90;
        const spacing = 10;
        const startX = 30;
        const startY = 80;
        
        state.cards.forEach((card, index) => {
            if (card.matched || card.flipped) return;
            
            const row = Math.floor(index / 4);
            const col = index % 4;
            const cardX = startX + col * (cardWidth + spacing);
            const cardY = startY + row * (cardHeight + spacing);
            
            if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
                card.flipped = true;
                state.flipped.push(index);
                
                if (state.flipped.length === 2) {
                    state.moves++;
                    const card1 = state.cards[state.flipped[0]];
                    const card2 = state.cards[state.flipped[1]];
                    
                    if (card1.icon === card2.icon) {
                        // Match!
                        setTimeout(() => {
                            card1.matched = true;
                            card2.matched = true;
                            state.flipped = [];
                            
                            // Check if all matched
                            if (state.cards.every(c => c.matched)) {
                                this.endMemory();
                            }
                        }, 500);
                    } else {
                        // No match
                        setTimeout(() => {
                            card1.flipped = false;
                            card2.flipped = false;
                            state.flipped = [];
                        }, 1000);
                    }
                }
            }
        });
    }

    endMemory() {
        const state = this.minigameState;
        state.completed = true;
        
        const timeMs = Date.now() - state.startTime;
        const timeSec = Math.floor(timeMs / 1000);
        const hearts = Math.max(1, Math.floor(100 / state.moves));
        
        this.save.currency.hearts += hearts;
        
        let stars = 0;
        if (timeSec <= 90) stars = 1;
        if (timeSec <= 60) stars = 2;
        if (timeSec <= 40) stars = 3;
        
        if (stars > this.save.minigames.memory.stars) {
            this.save.minigames.memory.stars = stars;
            this.save.minigames.memory.bestTimeMs = timeMs;
            
            if (stars === 3 && !this.save.unlockedTokenSources.includes('memory')) {
                this.save.tokens++;
                this.save.unlockedTokenSources.push('memory');
                this.showNotification(`🏆 Amazing memory! Token earned!\nTime: ${timeSec}s | Moves: ${state.moves}`);
            } else {
                this.showNotification(`Complete! Time: ${timeSec}s\nMoves: ${state.moves} | Hearts: +${hearts}`);
            }
        } else {
            this.showNotification(`Time: ${timeSec}s | Moves: ${state.moves}`);
        }
        
        setTimeout(() => {
            this.currentMinigame = null;
            this.currentScreen = 'main';
            this.updateUI();
            this.autoSave();
        }, 2000);
    }

    // Trivia Minigame
    initTrivia() {
        const questions = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
        
        this.minigameState = {
            questions: questions,
            currentQuestion: 0,
            correct: 0,
            answered: false
        };
        
        this.showNotification("How well do you know Dario? ❓");
    }

    renderTrivia() {
        const state = this.minigameState;
        
        // Background
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if (state.currentQuestion >= state.questions.length) {
            this.endTrivia();
            return;
        }
        
        const question = state.questions[state.currentQuestion];
        
        // Question box
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(20, 40, CANVAS_WIDTH - 40, 80);
        this.ctx.strokeStyle = '#ff70a6';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(20, 40, CANVAS_WIDTH - 40, 80);
        
        // Question text
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(question.question, CANVAS_WIDTH/2, 75);
        this.ctx.fillText(`Question ${state.currentQuestion + 1}/5`, CANVAS_WIDTH/2, 100);
        
        // Options
        question.options.forEach((option, index) => {
            const y = 150 + index * 60;
            
            this.ctx.fillStyle = state.answered && index === question.correct ? '#90EE90' : '#34495e';
            this.ctx.fillRect(40, y, CANVAS_WIDTH - 80, 45);
            this.ctx.strokeStyle = '#fff';
            this.ctx.strokeRect(40, y, CANVAS_WIDTH - 80, 45);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '11px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(option, CANVAS_WIDTH/2, y + 25);
        });
        
        // Score
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '14px monospace';
        this.ctx.fillText(`Score: ${state.correct}/${state.currentQuestion}`, CANVAS_WIDTH/2, 400);
    }

    handleTriviaClick(x, y) {
        const state = this.minigameState;
        if (state.answered) return;
        
        const question = state.questions[state.currentQuestion];
        
        question.options.forEach((option, index) => {
            const optY = 150 + index * 60;
            
            if (x >= 40 && x <= CANVAS_WIDTH - 40 && y >= optY && y <= optY + 45) {
                state.answered = true;
                
                if (index === question.correct) {
                    state.correct++;
                    this.showNotification("Correct! 💖");
                    this.addParticles(CANVAS_WIDTH/2, optY + 22, '#FFD700', 5);
                } else {
                    this.showNotification("Not quite! 💔");
                }
                
                setTimeout(() => {
                    state.currentQuestion++;
                    state.answered = false;
                }, 1500);
            }
        });
    }

    endTrivia() {
        const state = this.minigameState;
        const hearts = state.correct * 5;
        
        this.save.currency.hearts += hearts;
        
        let stars = 0;
        if (state.correct >= 3) stars = 1;
        if (state.correct >= 4) stars = 2;
        if (state.correct === 5) stars = 3;
        
        if (stars > this.save.minigames.trivia.stars) {
            this.save.minigames.trivia.stars = stars;
            this.save.minigames.trivia.bestStreak = state.correct;
            
            if (stars === 3 && !this.save.unlockedTokenSources.includes('trivia')) {
                this.save.tokens++;
                this.save.unlockedTokenSources.push('trivia');
                this.showNotification(`🏆 You know Dario perfectly! Token earned!\nScore: ${state.correct}/5`);
            } else {
                this.showNotification(`Score: ${state.correct}/5\nHearts: +${hearts}`);
            }
        } else {
            this.showNotification(`Score: ${state.correct}/5\nHearts: +${hearts}`);
        }
        
        this.currentMinigame = null;
        this.currentScreen = 'main';
        this.updateUI();
        this.autoSave();
    }

    updateMinigame(deltaTime) {
        if (this.currentMinigame === 'feedFrenzy') {
            this.updateFeedFrenzy(deltaTime);
        } else if (this.currentMinigame === 'petRhythm') {
            this.updatePetRhythm(deltaTime);
        }
    }

    renderMinigame() {
        if (this.currentMinigame === 'feedFrenzy') {
            this.renderFeedFrenzy();
        } else if (this.currentMinigame === 'petRhythm') {
            this.renderPetRhythm();
        } else if (this.currentMinigame === 'memory') {
            this.renderMemory();
        } else if (this.currentMinigame === 'trivia') {
            this.renderTrivia();
        }
    }

    // Photo Booth
    photoBooth() {
        this.toggleMenu();
        
        // Create a temporary canvas for the photo
        const photoCanvas = document.createElement('canvas');
        photoCanvas.width = 320;
        photoCanvas.height = 320;
        const photoCtx = photoCanvas.getContext('2d');
        
        // Background
        const gradient = photoCtx.createLinearGradient(0, 0, 320, 320);
        gradient.addColorStop(0, '#ff70a6');
        gradient.addColorStop(1, '#ffd700');
        photoCtx.fillStyle = gradient;
        photoCtx.fillRect(0, 0, 320, 320);
        
        // Draw sprite
        photoCtx.save();
        photoCtx.translate(160, 160);
        photoCtx.scale(4, 4);
        
        const frame = SPRITES.dario.happy[0];
        frame.forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                if (row[x] === '#') {
                    photoCtx.fillStyle = '#FDBCB4';
                    photoCtx.fillRect(x - 6, y - 8, 1, 1);
                }
            }
        });
        
        photoCtx.restore();
        
        // Add text
        photoCtx.fillStyle = '#fff';
        photoCtx.font = 'bold 20px monospace';
        photoCtx.textAlign = 'center';
        photoCtx.fillText("Lulu's Tiny You", 160, 40);
        
        const date = new Date().toLocaleDateString();
        photoCtx.font = '14px monospace';
        photoCtx.fillText(date, 160, 290);
        
        // Add hearts
        photoCtx.font = '24px serif';
        photoCtx.fillText('💖', 40, 60);
        photoCtx.fillText('💖', 280, 60);
        photoCtx.fillText('💖', 40, 280);
        photoCtx.fillText('💖', 280, 280);
        
        // If has ring, add it
        if (this.save.inventory.includes('Ring')) {
            photoCtx.font = '32px serif';
            photoCtx.fillText('💍', 160, 250);
        }
        
        // Download
        photoCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lulu-tiny-you-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
        
        this.showNotification("Photo saved! 📸💖");
    }

    // Save Management
    manageSave() {
        this.toggleMenu();
        
        const modal = document.getElementById('gameModal');
        const title = document.getElementById('modalTitle');
        const text = document.getElementById('modalText');
        const buttons = document.getElementById('modalButtons');
        
        title.textContent = "Save Data Management";
        text.innerHTML = `
            Current Progress:<br>
            💖 Hearts: ${this.save.currency.hearts}<br>
            🏆 Tokens: ${this.save.tokens}/5<br>
            📅 Streak: ${this.save.streak.current} days<br><br>
            What would you like to do?
        `;
        
        buttons.innerHTML = `
            <button class="modal-button" onclick="game.exportSaveData()">📤 Export Save</button>
            <button class="modal-button" onclick="game.importSaveData()">📥 Import Save</button>
            <button class="modal-button" onclick="game.closeModal()">Cancel</button>
        `;
        
        modal.classList.add('show');
    }

    exportSaveData() {
        SaveManager.exportSave(this.save);
        this.closeModal();
        this.showNotification("Save exported! 💾");
    }

    importSaveData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const newSave = await SaveManager.importSave(file);
                if (newSave) {
                    this.save = newSave;
                    this.updateUI();
                    this.showNotification("Save imported! ✅");
                    location.reload();
                } else {
                    this.showNotification("Invalid save file! ❌");
                }
            }
        };
        input.click();
        this.closeModal();
    }

    // Ring Event
    triggerRingEvent() {
        this.save.inventory.push('Ring');
        
        const ringDiv = document.getElementById('ringEvent');
        ringDiv.innerHTML = `
            <div style="text-align: center; color: white; padding: 40px;">
                <div style="font-size: 20px; margin-bottom: 20px;">💎 CONGRATULATIONS! 💎</div>
                <div style="font-size: 60px; margin: 30px 0;">💍</div>
                <div style="font-size: 14px; line-height: 1.6;">
                    You've collected all Golden Tokens!<br><br>
                    Dario has something special for you...<br><br>
                    "Lulu, you make every day magical.<br>
                    This ring represents my promise<br>
                    to always be your tiny companion,<br>
                    to make you smile every day,<br>
                    and to love you forever.<br><br>
                    You're my everything! 💖"
                </div>
                <button class="modal-button" style="margin-top: 30px;" onclick="game.closeRingEvent()">
                    💕 I LOVE YOU TOO! 💕
                </button>
            </div>
        `;
        
        ringDiv.classList.add('show');
        
        // Create confetti
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.background = ['#ff70a6', '#ffd700', '#ff69b4', '#fff'][Math.floor(Math.random() * 4)];
                confetti.style.animationDelay = Math.random() * 3 + 's';
                ringDiv.appendChild(confetti);
            }, i * 50);
        }
        
        this.autoSave();
    }

    closeRingEvent() {
        document.getElementById('ringEvent').classList.remove('show');
        this.showNotification("Ring added to inventory! 💍✨");
        
        // Unlock special features
        this.save.stats.happiness = 100;
        this.save.currency.hearts += 100;
        this.updateUI();
    }

    // UI Updates
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
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    closeModal() {
        document.getElementById('gameModal').classList.remove('show');
    }

    addParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                color: color,
                size: 3 + Math.random() * 3,
                life: 2000,
                maxLife: 2000,
                type: 'pixel'
            });
        }
    }

    autoSave() {
        this.save.lastSeenISO = new Date().toISOString();
        SaveManager.saveNow(this.save);
    }
}

// Initialize game when DOM is ready
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new TamagotchiGame();
    
    // Request persistent storage
    if ('storage' in navigator && 'persist' in navigator.storage) {
        navigator.storage.persist().then(granted => {
            if (granted) {
                console.log('Persistent storage granted');
            }
        });
    }
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.log('Service worker registration failed:', err);
        });
    }
});