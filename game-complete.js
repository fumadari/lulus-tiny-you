// ============================================
// LULU'S TINY YOU - Complete Game with All Features
// ============================================

const SAVE_KEY = 'lulu-tiny-you-v5'; // New version for larger map
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 420;
const TILE_SIZE = 24;
// MAP_WIDTH and MAP_HEIGHT are now defined in nyc-map-data.js

// Use the larger NYC map and POIs from nyc-map-data.js
const NYC_MAP = window.NYC_MAP_LARGE;
const MAP_POIS = window.MAP_POIS_LARGE;

// Save Manager
class SaveManager {
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
            player: { x: 26, y: 15, facing: 'down' }, // Start at your UES apartment
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
        
        // Initialize sound system
        this.sound = new SoundSystem();
        
        // Initialize map renderer
        this.mapRenderer = new MapRenderer(this);
        
        // Initialize camera system
        this.camera = new CameraSystem(this);
        this.camera.jumpTo(this.save.player.x, this.save.player.y);
        
        // Initialize fast travel
        this.fastTravel = new FastTravelSystem(this);
        
        // Initialize NPCs
        this.npcs = [
            // Lulu in Williamsburg
            {
                x: 17,
                y: 26,
                name: 'Lulu',
                emoji: '👩‍🦰',
                dialogue: [
                    "Hey there, Tiny Dario! 💕",
                    "I love exploring Williamsburg with you!",
                    "Want to grab some coffee? ☕",
                    "This neighborhood has the best vibes!"
                ],
                movePattern: 'wander',
                moveRadius: 2
            },
            // Cat in Central Park
            {
                x: 24,
                y: 10,
                name: 'Mittens',
                emoji: '🐱',
                dialogue: [
                    "*purrs happily*",
                    "Meow! 😸",
                    "*rubs against your leg*",
                    "*stretches and yawns*"
                ],
                movePattern: 'lazy',
                moveRadius: 1
            },
            // Girl 1 near Times Square
            {
                x: 22,
                y: 14,
                name: 'Sarah',
                emoji: '👱‍♀️',
                dialogue: [
                    "Oh wow, is that Dario? So cute! 😊",
                    "I heard you're really smart!",
                    "Can I take a selfie with you?",
                    "You're adorable! 💖"
                ],
                movePattern: 'stationary'
            },
            // Girl 2 in East Village
            {
                x: 28,
                y: 18,
                name: 'Emma',
                emoji: '👩',
                dialogue: [
                    "Hey Dario! You're looking great today!",
                    "I love your pixel art style! 🎨",
                    "Want to hang out sometime?",
                    "You always make me smile! 😄"
                ],
                movePattern: 'pace',
                moveRadius: 3
            },
            // Girl 3 near Brooklyn Bridge
            {
                x: 25,
                y: 22,
                name: 'Sophia',
                emoji: '👩‍🦱',
                dialogue: [
                    "Dario! I was hoping to see you!",
                    "You're the talk of the town! 🌟",
                    "Everyone thinks you're amazing!",
                    "Can I get your number? 📱"
                ],
                movePattern: 'wander',
                moveRadius: 2
            }
        ];
        
        // Initialize NPC positions and states
        this.npcs.forEach(npc => {
            npc.currentX = npc.x;
            npc.currentY = npc.y;
            npc.moveTimer = 0;
            npc.dialogueIndex = 0;
            npc.facing = 'down';
        });
        
        // Initialize Lulu interaction system
        this.luluInteraction = new LuluInteraction(this);
        
        // Sprite state
        this.sprite = {
            x: 180,
            y: 250,
            frame: 0,
            animation: 'idle',
            walkFrame: 0
        };
        
        // Particles
        this.particles = [];
        
        // Cooldowns and timers
        this.talkCooldown = 0;
        this.statDecayTimer = 0;
        this.autoSaveTimer = 0;
        
        // Movement for map
        this.isMoving = false;
        this.moveQueue = [];
        
        // Mini-game states
        this.currentMinigame = null;
        this.minigameState = null;
        
        // Keys pressed
        this.keys = {};
        
        this.init();
    }

    async init() {
        try {
            // Show loading
            document.getElementById('loadingFill').style.width = '100%';
            
            // Apply offline time effects
            this.applyOfflineDecay();
            
            // Check daily login
            this.checkDailyStreak();
            
            // Setup controls
            this.setupEventListeners();
            
            // Start game loop
            this.gameLoop();
            
            // Hide loading
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
                this.showNotification("Welcome back, Lulu! 💕");
                this.updateUI();
                // Start background music after user interaction
                this.sound.play('backgroundMusic');
            }, 1000);
            
        } catch (error) {
            console.error('Init error:', error);
            document.getElementById('loadingScreen').style.display = 'none';
        }
    }

    setupEventListeners() {
        // Touch/Click
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.handleClick({
                offsetX: (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
                offsetY: (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
            });
        });
        
        // Keyboard for map movement
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Handle fast travel menu first
            if (this.fastTravel && this.fastTravel.isOpen) {
                if (this.fastTravel.handleKey(e.key)) {
                    return;
                }
            }
            
            if (this.currentScreen === 'map') {
                // Movement keys
                if (!this.fastTravel.isOpen) {
                    if (e.key === 'ArrowUp' || e.key === 'w') this.movePlayer(0, -1);
                    if (e.key === 'ArrowDown' || e.key === 's') this.movePlayer(0, 1);
                    if (e.key === 'ArrowLeft' || e.key === 'a') this.movePlayer(-1, 0);
                    if (e.key === 'ArrowRight' || e.key === 'd') this.movePlayer(1, 0);
                    if (e.key === ' ' || e.key === 'Enter') this.interactWithPOI();
                }
                
                // Fast travel toggle
                if (e.key === 't' || e.key === 'T') {
                    if (this.fastTravel.isOpen) {
                        this.fastTravel.close();
                    } else {
                        this.fastTravel.open();
                    }
                }
                
                // Menu toggle
                if (e.key === 'm' || e.key === 'M') {
                    this.toggleMenu();
                }
                
                // Photo booth
                if (e.key === 'p' || e.key === 'P') {
                    this.photoBooth();
                }
            } else if (this.currentMinigame === 'danceBattle' && this.danceBattle) {
                this.danceBattle.handleKey(e.key);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    handleClick(e) {
        const x = e.offsetX;
        const y = e.offsetY;
        
        // Handle fast travel menu clicks first
        if (this.fastTravel && this.fastTravel.isOpen) {
            if (this.fastTravel.handleClick(x, y)) {
                return;
            }
        }
        
        if (this.currentScreen === 'map') {
            // Convert click to world position using camera
            if (this.camera) {
                const worldPos = this.camera.screenToWorld(x, y - 40);
                const tileX = Math.floor(worldPos.x / TILE_SIZE);
                const tileY = Math.floor(worldPos.y / TILE_SIZE);
                this.movePlayerTo(tileX, tileY);
            }
        } else if (this.currentMinigame) {
            this.handleMinigameClick(x, y);
        }
    }

    // ===== OFFLINE & TIME MANAGEMENT =====
    
    applyOfflineDecay() {
        const now = Date.now();
        const lastUpdate = this.save.lastUpdateTime || now;
        const minutesAway = Math.floor((now - lastUpdate) / 60000);
        
        if (minutesAway > 0) {
            // Stats decay while away (capped to not be too harsh)
            const hungerDecay = Math.min(50, minutesAway * 0.5); // 0.5 per minute
            const energyDecay = Math.min(40, minutesAway * 0.3); // 0.3 per minute  
            const happyDecay = Math.min(30, minutesAway * 0.2);  // 0.2 per minute
            
            this.save.stats.hunger = Math.max(0, this.save.stats.hunger - hungerDecay);
            this.save.stats.energy = Math.max(0, this.save.stats.energy - energyDecay);
            this.save.stats.happiness = Math.max(0, this.save.stats.happiness - happyDecay);
            
            if (minutesAway > 60) {
                this.showNotification("I missed you so much! 🥺");
            } else if (minutesAway > 30) {
                this.showNotification("You're back! I was getting lonely! 💕");
            }
        }
        
        this.save.lastUpdateTime = now;
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
            } else {
                this.save.streak.current = 1;
            }
            
            this.save.streak.lastDayISO = today;
            this.save.currency.hearts += 5 * this.save.streak.current;
            this.showNotification(`Day ${this.save.streak.current} streak! +${5 * this.save.streak.current} 💖`);
            
            // 3-day streak token
            if (this.save.streak.current === 3 && !this.save.unlockedTokenSources.includes('streak3')) {
                this.save.tokens++;
                this.save.unlockedTokenSources.push('streak3');
                this.showNotification("🏆 3-Day Streak Token earned!");
                this.sound.play('tokenCollect');
            }
        }
    }

    // ===== GAME LOOP =====
    
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
        // Update animations
        this.sprite.frame += deltaTime * 0.002;
        if (this.sprite.frame >= 2) this.sprite.frame = 0;
        
        // Update walk animation
        if (this.isMoving) {
            this.sprite.walkFrame += deltaTime * 0.01;
            if (this.sprite.walkFrame >= 4) this.sprite.walkFrame = 0;
        }
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.y -= p.vy * deltaTime * 0.1;
            p.x += p.vx * deltaTime * 0.1;
            p.life -= deltaTime;
            p.vy += 0.02; // gravity
            return p.life > 0;
        });
        
        // Update cooldowns
        if (this.talkCooldown > 0) {
            this.talkCooldown -= deltaTime;
        }
        
        // REAL-TIME STAT DECAY (very important!)
        this.statDecayTimer += deltaTime;
        if (this.statDecayTimer >= 10000) { // Every 10 seconds
            this.statDecayTimer = 0;
            
            // Decay stats
            this.save.stats.hunger = Math.max(0, this.save.stats.hunger - 1);
            this.save.stats.energy = Math.max(0, this.save.stats.energy - 0.8);
            this.save.stats.happiness = Math.max(0, this.save.stats.happiness - 0.5);
            
            // Check for critical states
            if (this.save.stats.hunger < 20 && this.frameCount % 120 === 0) {
                this.showNotification("I'm really hungry! 🍎");
            }
            if (this.save.stats.energy < 20 && this.frameCount % 180 === 0) {
                this.showNotification("So tired... 😴");
            }
            if (this.save.stats.happiness < 20 && this.frameCount % 150 === 0) {
                this.showNotification("I'm sad... 😢");
            }
            
            // Consequences of neglect
            if (this.save.stats.hunger === 0) {
                this.save.stats.happiness = Math.max(0, this.save.stats.happiness - 5);
            }
            if (this.save.stats.energy === 0) {
                this.sprite.animation = 'sleep';
            }
            
            this.updateUI();
        }
        
        // Auto-save every 30 seconds
        this.autoSaveTimer += deltaTime;
        if (this.autoSaveTimer >= 30000) {
            this.autoSaveTimer = 0;
            this.autoSave();
        }
        
        // Update minigame if active
        if (this.currentMinigame && this.minigameState) {
            this.updateMinigame(deltaTime);
        }
        
        // Update map renderer and camera
        if (this.currentScreen === 'map') {
            if (this.mapRenderer) {
                this.mapRenderer.update(deltaTime);
            }
            if (this.camera) {
                this.camera.update(this.save.player.x, this.save.player.y, deltaTime);
            }
        }
        
        // Check for ring event
        if (this.save.tokens >= 5 && !this.save.inventory.includes('Ring')) {
            this.triggerRingEvent();
        }
        
        // Update sprite based on stats
        if (this.save.stats.energy < 10) {
            this.sprite.animation = 'sleep';
        } else if (this.save.stats.hunger < 10) {
            this.sprite.animation = 'hungry';
        } else if (this.save.stats.happiness > 80) {
            this.sprite.animation = 'happy';
        } else {
            this.sprite.animation = 'idle';
        }
    }

    render() {
        // Clear
        this.ctx.fillStyle = '#87CEEB';
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

    // ===== MAIN SCREEN =====
    
    renderMain() {
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour >= 20;
        
        // Sky gradient
        if (isNight) {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, 320);
            gradient.addColorStop(0, '#0a0a2e');
            gradient.addColorStop(1, '#1a1a3e');
            this.ctx.fillStyle = gradient;
        } else {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, 320);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#98D8E8');
            this.ctx.fillStyle = gradient;
        }
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, 320);
        
        // Stars at night
        if (isNight) {
            this.ctx.fillStyle = '#fff';
            for (let i = 0; i < 20; i++) {
                const x = (Math.sin(i * 12.34) + 1) * 180;
                const y = (Math.sin(i * 56.78) + 1) * 150;
                const size = Math.sin(i * 2) > 0 ? 2 : 1;
                this.ctx.fillRect(x, y, size, size);
            }
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
            this.ctx.fillStyle = isNight ? '#FFD700' : '#4A4A4A';
            for (let y = 10; y < b.h - 10; y += 15) {
                for (let x = 5; x < b.w - 5; x += 10) {
                    if (isNight && Math.random() > 0.3 || !isNight && Math.random() > 0.7) {
                        this.ctx.fillRect(b.x + x, 320 - b.h + y, 6, 8);
                    }
                }
            }
            this.ctx.fillStyle = '#2F4F4F';
        });
        
        // Ground
        this.ctx.fillStyle = '#8FBC8F';
        this.ctx.fillRect(0, 320, CANVAS_WIDTH, 100);
        
        // Grass detail
        this.ctx.fillStyle = '#228B22';
        for (let x = 0; x < CANVAS_WIDTH; x += 20) {
            for (let i = 0; i < 5; i++) {
                const grassX = x + Math.random() * 20;
                const grassY = 325 + Math.random() * 10;
                this.ctx.fillRect(grassX, grassY, 2, 6);
            }
        }
        
        // Draw character
        this.drawCharacter(this.sprite.x, this.sprite.y);
        
        // Status bubbles
        if (this.save.stats.hunger < 30) {
            this.drawSpeechBubble(this.sprite.x, this.sprite.y - 60, "I'm hungry! 🍎");
        } else if (this.save.stats.energy < 30) {
            this.drawSpeechBubble(this.sprite.x, this.sprite.y - 60, "So tired... 😴");
        } else if (this.save.stats.happiness < 30) {
            this.drawSpeechBubble(this.sprite.x, this.sprite.y - 60, "I'm sad... 😢");
        }
    }

    drawCharacter(x, y, scale = 2) {
        const bobY = y + Math.sin(this.frameCount * 0.05) * 3;
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 30, 15 * scale/2, 5 * scale/2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Determine mood
        const mood = this.save.stats.happiness > 70 ? 'happy' : 
                     this.save.stats.happiness < 30 ? 'sad' : 'normal';
        
        // Body
        this.ctx.fillStyle = '#4169E1';
        this.ctx.fillRect(x - 8*scale, bobY - 5*scale, 16*scale, 15*scale);
        
        // Arms
        this.ctx.fillStyle = '#FDBCB4';
        const armOffset = Math.sin(this.sprite.frame) * 2;
        this.ctx.fillRect(x - 12*scale, bobY - 3*scale + armOffset, 4*scale, 10*scale);
        this.ctx.fillRect(x + 8*scale, bobY - 3*scale - armOffset, 4*scale, 10*scale);
        
        // Head
        this.ctx.fillRect(x - 10*scale, bobY - 20*scale, 20*scale, 18*scale);
        
        // Hair
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - 10*scale, bobY - 20*scale, 20*scale, 8*scale);
        
        // Eyes
        this.ctx.fillStyle = '#000';
        if (this.sprite.animation !== 'sleep') {
            // Blinking
            const blink = this.frameCount % 120 < 5;
            if (!blink) {
                this.ctx.fillRect(x - 6*scale, bobY - 12*scale, 3*scale, 3*scale);
                this.ctx.fillRect(x + 3*scale, bobY - 12*scale, 3*scale, 3*scale);
            } else {
                this.ctx.fillRect(x - 6*scale, bobY - 10*scale, 3*scale, 1*scale);
                this.ctx.fillRect(x + 3*scale, bobY - 10*scale, 3*scale, 1*scale);
            }
        } else {
            // Sleeping Z's
            this.ctx.font = '12px monospace';
            this.ctx.fillText('Z', x + 12*scale, bobY - 15*scale);
            this.ctx.font = '10px monospace';
            this.ctx.fillText('z', x + 18*scale, bobY - 20*scale);
        }
        
        // Mouth based on mood
        if (mood === 'happy') {
            this.ctx.fillRect(x - 4*scale, bobY - 6*scale, 8*scale, 1*scale);
            this.ctx.fillRect(x - 5*scale, bobY - 5*scale, 2*scale, 1*scale);
            this.ctx.fillRect(x + 3*scale, bobY - 5*scale, 2*scale, 1*scale);
        } else if (mood === 'sad') {
            this.ctx.fillRect(x - 4*scale, bobY - 4*scale, 8*scale, 1*scale);
            this.ctx.fillRect(x - 5*scale, bobY - 5*scale, 2*scale, 1*scale);
            this.ctx.fillRect(x + 3*scale, bobY - 5*scale, 2*scale, 1*scale);
        } else {
            this.ctx.fillRect(x - 3*scale, bobY - 6*scale, 6*scale, 1*scale);
        }
        
        // Legs
        this.ctx.fillStyle = '#333';
        const legOffset = this.isMoving ? Math.sin(this.sprite.walkFrame * 2) * 2 : 0;
        this.ctx.fillRect(x - 6*scale, bobY + 10*scale, 5*scale, 8*scale + legOffset);
        this.ctx.fillRect(x + 1*scale, bobY + 10*scale, 5*scale, 8*scale - legOffset);
        
        // Status indicators
        if (this.save.stats.hunger < 20) {
            this.ctx.font = '16px serif';
            this.ctx.fillText('💧', x - 15*scale, bobY - 25*scale);
        }
    }

    drawSpeechBubble(x, y, text) {
        const width = text.length * 7 + 20;
        const height = 30;
        
        // Bubble
        this.ctx.fillStyle = 'rgba(255,255,255,0.95)';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x - width/2 + 10, y);
        this.ctx.lineTo(x + width/2 - 10, y);
        this.ctx.quadraticCurveTo(x + width/2, y, x + width/2, y + 10);
        this.ctx.lineTo(x + width/2, y + height - 10);
        this.ctx.quadraticCurveTo(x + width/2, y + height, x + width/2 - 10, y + height);
        this.ctx.lineTo(x - width/2 + 10, y + height);
        this.ctx.quadraticCurveTo(x - width/2, y + height, x - width/2, y + height - 10);
        this.ctx.lineTo(x - width/2, y + 10);
        this.ctx.quadraticCurveTo(x - width/2, y, x - width/2 + 10, y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Tail
        this.ctx.beginPath();
        this.ctx.moveTo(x - 5, y + height);
        this.ctx.lineTo(x, y + height + 10);
        this.ctx.lineTo(x + 5, y + height);
        this.ctx.fill();
        
        // Text
        this.ctx.fillStyle = '#333';
        this.ctx.font = '11px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y + height/2);
    }

    // ===== MAP SCREEN =====
    
    renderMap() {
        // Use enhanced map renderer with camera
        if (this.mapRenderer && this.camera) {
            this.mapRenderer.render(this.ctx, this.save.player.x, this.save.player.y, this.camera, NYC_MAP);
            
            // Render fast travel menu if open
            if (this.fastTravel) {
                this.fastTravel.render(this.ctx);
            }
            
            // Map HUD overlay
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '10px monospace';
            this.ctx.textAlign = 'left';
            
            // Show current neighborhood
            const neighborhood = this.getCurrentNeighborhood();
            this.ctx.fillText(`📍 ${neighborhood}`, 10, 15);
            this.ctx.fillText(`Coords: (${this.save.player.x}, ${this.save.player.y})`, 10, 28);
            
            this.ctx.textAlign = 'right';
            this.ctx.fillText('T: Fast Travel | SPACE: Interact', CANVAS_WIDTH - 10, 15);
            this.ctx.fillText('M: Menu | P: Photo', CANVAS_WIDTH - 10, 28);
        }
    }
    
    getCurrentNeighborhood() {
        // Find closest neighborhood
        let closestDist = Infinity;
        let closestName = "NYC";
        
        for (const key in NEIGHBORHOODS) {
            const [nx, ny] = key.split(',').map(n => parseInt(n));
            const dist = Math.abs(this.save.player.x - nx) + Math.abs(this.save.player.y - ny);
            if (dist < closestDist) {
                closestDist = dist;
                closestName = NEIGHBORHOODS[key];
            }
        }
        
        return closestName;
    }

    movePlayer(dx, dy) {
        const newX = this.save.player.x + dx;
        const newY = this.save.player.y + dy;
        
        // Check bounds
        if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) {
            return;
        }
        
        // Check collision silently
        const tile = NYC_MAP[newY][newX];
        if (tile === 3 || tile === 2 || tile === 8 || tile === 9) { // Water or buildings - block silently
            return;
        }
        
        // Check NPC collision
        for (const npc of this.npcs) {
            if (npc.currentX === newX && npc.currentY === newY) {
                this.interactWithNPC(npc);
                return;
            }
        }
        
        // Move player
        this.save.player.x = newX;
        this.save.player.y = newY;
        this.isMoving = true;
        
        // Play footstep sound
        this.sound.play('step');
        
        // Update facing direction
        if (dx > 0) this.save.player.facing = 'right';
        if (dx < 0) this.save.player.facing = 'left';
        if (dy > 0) this.save.player.facing = 'down';
        if (dy < 0) this.save.player.facing = 'up';
        
        setTimeout(() => this.isMoving = false, 200);
        
        // Update NPCs
        this.updateNPCs();
        
        // Random encounters
        if (Math.random() < 0.05) {
            this.save.currency.hearts++;
            this.showNotification("Found a heart! 💖");
        }
    }

    movePlayerTo(targetX, targetY) {
        // Simple pathfinding - just move towards target
        const dx = targetX - this.save.player.x;
        const dy = targetY - this.save.player.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            this.movePlayer(Math.sign(dx), 0);
        } else if (dy !== 0) {
            this.movePlayer(0, Math.sign(dy));
        }
    }

    updateNPCs() {
        this.npcs.forEach(npc => {
            npc.moveTimer--;
            
            if (npc.moveTimer <= 0) {
                // Reset timer
                npc.moveTimer = 60 + Math.random() * 120; // Move every 1-3 seconds
                
                // Move based on pattern
                if (npc.movePattern === 'wander' && npc.moveRadius) {
                    const directions = [
                        {dx: 0, dy: -1, facing: 'up'},
                        {dx: 0, dy: 1, facing: 'down'},
                        {dx: -1, dy: 0, facing: 'left'},
                        {dx: 1, dy: 0, facing: 'right'}
                    ];
                    const dir = directions[Math.floor(Math.random() * directions.length)];
                    const newX = npc.currentX + dir.dx;
                    const newY = npc.currentY + dir.dy;
                    
                    // Check if within radius and not colliding
                    const distFromHome = Math.abs(newX - npc.x) + Math.abs(newY - npc.y);
                    if (distFromHome <= npc.moveRadius && 
                        newX >= 0 && newX < MAP_WIDTH && 
                        newY >= 0 && newY < MAP_HEIGHT) {
                        const tile = NYC_MAP[newY][newX];
                        if (tile !== 3 && tile !== 2 && tile !== 8 && tile !== 9) {
                            // Check player collision
                            if (newX !== this.save.player.x || newY !== this.save.player.y) {
                                npc.currentX = newX;
                                npc.currentY = newY;
                                npc.facing = dir.facing;
                            }
                        }
                    }
                } else if (npc.movePattern === 'pace' && npc.moveRadius) {
                    // Pace back and forth
                    if (!npc.paceDirection) npc.paceDirection = 1;
                    const newX = npc.currentX + npc.paceDirection;
                    
                    if (Math.abs(newX - npc.x) > npc.moveRadius || 
                        newX < 0 || newX >= MAP_WIDTH ||
                        NYC_MAP[npc.currentY][newX] === 3 || NYC_MAP[npc.currentY][newX] === 2) {
                        npc.paceDirection *= -1;
                    } else if (newX !== this.save.player.x || npc.currentY !== this.save.player.y) {
                        npc.currentX = newX;
                        npc.facing = npc.paceDirection > 0 ? 'right' : 'left';
                    }
                } else if (npc.movePattern === 'lazy') {
                    // Rarely move
                    if (Math.random() < 0.1) {
                        const directions = [{dx: 0, dy: -1}, {dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}];
                        const dir = directions[Math.floor(Math.random() * directions.length)];
                        const newX = npc.currentX + dir.dx;
                        const newY = npc.currentY + dir.dy;
                        
                        if (Math.abs(newX - npc.x) <= 1 && Math.abs(newY - npc.y) <= 1 &&
                            newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
                            const tile = NYC_MAP[newY][newX];
                            if (tile !== 3 && tile !== 2 && tile !== 8 && tile !== 9) {
                                if (newX !== this.save.player.x || newY !== this.save.player.y) {
                                    npc.currentX = newX;
                                    npc.currentY = newY;
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    
    interactWithNPC(npc) {
        // Show dialogue
        const dialogue = npc.dialogue[npc.dialogueIndex];
        this.showNotification(`${npc.name}: ${dialogue}`);
        
        // Cycle through dialogue
        npc.dialogueIndex = (npc.dialogueIndex + 1) % npc.dialogue.length;
        
        // Give hearts for interacting with Lulu
        if (npc.name === 'Lulu') {
            this.save.currency.hearts += 5;
            this.showNotification('+5 💖');
        }
        
        // Pet the cat
        if (npc.name === 'Mittens') {
            this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 10);
        }
        
        this.sound.play('success');
    }
    
    interactWithPOI() {
        const poi = MAP_POIS.find(p => 
            Math.abs(p.x - this.save.player.x) <= 1 && 
            Math.abs(p.y - this.save.player.y) <= 1
        );
        
        if (poi) {
            // Special interaction for Lulu's place
            if (poi.id === 'lulu_home') {
                this.luluInteraction.startVisit();
                return;
            }
            
            if (!this.save.map.visitedPOIs.includes(poi.id)) {
                this.save.map.visitedPOIs.push(poi.id);
                this.save.currency.hearts += 20;
                this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 15);
                this.showNotification(`Discovered ${poi.name}! +20 💖`);
                this.sound.play('achievement');
                
                // Unlock fast travel location
                const unlockedLocation = this.fastTravel.unlockLocation(poi.id);
                if (unlockedLocation) {
                    this.showNotification(`Fast travel unlocked: ${unlockedLocation}! 🚇`);
                }
                
                // Check if all POIs visited
                if (this.save.map.visitedPOIs.length === MAP_POIS.length && 
                    !this.save.unlockedTokenSources.includes('explorer')) {
                    this.save.tokens++;
                    this.save.unlockedTokenSources.push('explorer');
                    this.showNotification("🏆 Explorer Token earned!");
                    this.sound.play('tokenCollect');
                }
            } else {
                this.showNotification(`${poi.name} - ${poi.emoji}`);
            }
            
            this.updateUI();
            this.autoSave();
        }
    }

    // ===== MINI-GAMES =====
    
    startMinigame(gameType) {
        this.toggleMenu();
        this.currentMinigame = gameType;
        this.currentScreen = 'minigame';
        this.sound.play('gameStart');
        
        switch(gameType) {
            case 'feedFrenzy':
                this.initFeedFrenzy();
                break;
            case 'petRhythm':
                this.initPetRhythm();
                break;
            case 'memory':
                this.initMemory();
                break;
            case 'trivia':
                this.initTrivia();
                break;
            case 'danceBattle':
                this.initDanceBattle();
                break;
        }
    }
    
    // Initialize Dance Battle
    initDanceBattle() {
        if (!this.danceBattle) {
            this.danceBattle = new DanceBattle(this);
        }
        this.danceBattle.init();
        this.minigameState = this.danceBattle.state;
    }

    // Feed Frenzy - Catch falling food
    initFeedFrenzy() {
        this.minigameState = {
            score: 0,
            time: 60,
            basketX: CANVAS_WIDTH / 2,
            items: [],
            speed: 1,
            combo: 0
        };
        this.showNotification("Catch good food! Avoid bad! 🍎");
    }

    updateFeedFrenzy(deltaTime) {
        const state = this.minigameState;
        
        // Update timer
        state.time -= deltaTime / 1000;
        if (state.time <= 0) {
            this.endFeedFrenzy();
            return;
        }
        
        // Spawn items
        if (Math.random() < 0.02 + state.speed * 0.01) {
            const goodItems = ['🍎', '🍕', '🍰', '🍪', '🍔', '🌮', '🍜'];
            const badItems = ['🥦', '💀', '🗑️', '🦠'];
            const isGood = Math.random() > 0.25;
            
            state.items.push({
                x: Math.random() * (CANVAS_WIDTH - 40) + 20,
                y: 0,
                emoji: isGood ? 
                    goodItems[Math.floor(Math.random() * goodItems.length)] :
                    badItems[Math.floor(Math.random() * badItems.length)],
                isGood: isGood,
                speed: 2 + Math.random() * state.speed
            });
        }
        
        // Update items
        state.items = state.items.filter(item => {
            item.y += item.speed;
            
            // Check catch
            if (item.y > 340 && item.y < 380 && 
                Math.abs(item.x - state.basketX) < 35) {
                if (item.isGood) {
                    state.score += 10 + state.combo;
                    state.combo++;
                    this.addParticles(item.x, item.y, '#FFD700', 5);
                } else {
                    state.score = Math.max(0, state.score - 20);
                    state.combo = 0;
                    this.addParticles(item.x, item.y, '#FF0000', 5);
                    this.showNotification("Ouch! 🤢");
                }
                return false;
            }
            
            // Missed good item
            if (item.y > CANVAS_HEIGHT && item.isGood) {
                state.combo = 0;
            }
            
            return item.y < CANVAS_HEIGHT;
        });
        
        // Increase difficulty
        state.speed = 1 + state.score / 200;
    }

    renderFeedFrenzy() {
        const state = this.minigameState;
        
        // Background
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, 380, CANVAS_WIDTH, 40);
        
        // Basket
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(state.basketX - 30, 350, 60, 35);
        this.ctx.fillRect(state.basketX - 35, 345, 70, 10);
        this.ctx.strokeStyle = '#4A3C28';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(state.basketX - 30, 350, 60, 35);
        
        // Items
        this.ctx.font = '24px serif';
        this.ctx.textAlign = 'center';
        state.items.forEach(item => {
            this.ctx.fillText(item.emoji, item.x, item.y);
        });
        
        // UI
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(10, 10, 200, 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${state.score}`, 20, 30);
        this.ctx.fillText(`Time: ${Math.ceil(state.time)}s`, 20, 50);
        this.ctx.fillText(`Combo: x${state.combo}`, 20, 70);
        
        // Instructions
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Click/Tap to move basket!', CANVAS_WIDTH/2, 410);
    }

    handleFeedFrenzyClick(x) {
        this.minigameState.basketX = Math.max(35, Math.min(CANVAS_WIDTH - 35, x));
    }

    endFeedFrenzy() {
        const score = this.minigameState.score;
        const hearts = Math.floor(score / 30);
        this.save.currency.hearts += hearts;
        
        // Stars based on score
        let stars = 0;
        if (score >= 100) stars = 1;
        if (score >= 200) stars = 2;
        if (score >= 300) stars = 3;
        
        // Play appropriate sound
        if (stars >= 2) {
            this.sound.play('gameWin');
        } else {
            this.sound.play('gameLose');
        }
        
        // Update best
        if (score > this.save.minigames.feedFrenzy.bestScore) {
            this.save.minigames.feedFrenzy.bestScore = score;
        }
        
        if (stars > this.save.minigames.feedFrenzy.stars) {
            this.save.minigames.feedFrenzy.stars = stars;
            
            // Token for perfect score
            if (stars === 3 && !this.save.unlockedTokenSources.includes('feedMaster')) {
                this.save.tokens++;
                this.save.unlockedTokenSources.push('feedMaster');
                this.showNotification(`🏆 Feed Master Token! Score: ${score}`);
                this.sound.play('tokenCollect');
            }
        }
        
        this.showNotification(`Score: ${score} | ${'⭐'.repeat(stars)} | +${hearts} 💖`);
        this.save.minigames.feedFrenzy.played++;
        this.endMinigame();
    }

    // Pet Rhythm - Tap to the beat
    initPetRhythm() {
        this.minigameState = {
            score: 0,
            combo: 0,
            maxCombo: 0,
            time: 45,
            notes: [],
            nextNoteTime: 500,
            bpm: 120,
            hitZoneX: 80,
            perfect: 0,
            good: 0,
            miss: 0
        };
        this.showNotification("Tap when notes reach the zone! 🎵");
    }

    updatePetRhythm(deltaTime) {
        const state = this.minigameState;
        
        state.time -= deltaTime / 1000;
        if (state.time <= 0) {
            this.endPetRhythm();
            return;
        }
        
        // Generate notes
        state.nextNoteTime -= deltaTime;
        if (state.nextNoteTime <= 0) {
            state.notes.push({
                x: CANVAS_WIDTH,
                lane: Math.floor(Math.random() * 3), // 3 lanes
                hit: false
            });
            state.nextNoteTime = 60000 / state.bpm / 2; // Based on BPM
        }
        
        // Move notes
        state.notes = state.notes.filter(note => {
            note.x -= deltaTime * 0.3; // Note speed
            
            // Check if missed
            if (note.x < state.hitZoneX - 40 && !note.hit) {
                state.combo = 0;
                state.miss++;
                return false;
            }
            
            return note.x > -20;
        });
    }

    renderPetRhythm() {
        const state = this.minigameState;
        
        // Background
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Lanes
        for (let i = 0; i < 3; i++) {
            const y = 150 + i * 80;
            
            // Lane line
            this.ctx.strokeStyle = '#444';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(CANVAS_WIDTH, y);
            this.ctx.stroke();
            
            // Hit zone
            this.ctx.fillStyle = 'rgba(255,215,0,0.2)';
            this.ctx.fillRect(state.hitZoneX - 30, y - 20, 60, 40);
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.strokeRect(state.hitZoneX - 30, y - 20, 60, 40);
        }
        
        // Notes
        state.notes.forEach(note => {
            const y = 150 + note.lane * 80;
            this.ctx.fillStyle = note.hit ? '#00FF00' : '#FF69B4';
            this.ctx.beginPath();
            this.ctx.arc(note.x, y, 15, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
        
        // UI
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(10, 10, 250, 100);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${state.score}`, 20, 30);
        this.ctx.fillText(`Combo: ${state.combo} (Max: ${state.maxCombo})`, 20, 50);
        this.ctx.fillText(`Time: ${Math.ceil(state.time)}s`, 20, 70);
        this.ctx.fillText(`Perfect: ${state.perfect} Good: ${state.good}`, 20, 90);
        
        // Instructions
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Tap the lane when note is in gold zone!', CANVAS_WIDTH/2, 400);
    }

    handlePetRhythmClick(x, y) {
        const state = this.minigameState;
        
        // Determine which lane was tapped
        const lane = y < 190 ? 0 : y < 270 ? 1 : 2;
        
        // Find closest note in that lane
        let closestNote = null;
        let closestDist = Infinity;
        
        state.notes.forEach(note => {
            if (note.lane === lane && !note.hit) {
                const dist = Math.abs(note.x - state.hitZoneX);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestNote = note;
                }
            }
        });
        
        if (closestNote && closestDist < 50) {
            closestNote.hit = true;
            
            if (closestDist < 15) {
                // Perfect hit
                state.perfect++;
                state.score += 100;
                state.combo++;
                this.addParticles(state.hitZoneX, 150 + lane * 80, '#FFD700', 8);
                this.showNotification("PERFECT! 🌟");
            } else if (closestDist < 30) {
                // Good hit
                state.good++;
                state.score += 50;
                state.combo++;
                this.addParticles(state.hitZoneX, 150 + lane * 80, '#00FF00', 5);
            } else {
                // OK hit
                state.score += 25;
                state.combo++;
            }
            
            state.maxCombo = Math.max(state.maxCombo, state.combo);
        }
    }

    endPetRhythm() {
        const state = this.minigameState;
        const total = state.perfect + state.good + state.miss;
        const accuracy = total > 0 ? (state.perfect + state.good) / total * 100 : 0;
        const hearts = Math.floor(state.score / 150);
        
        this.save.currency.hearts += hearts;
        
        let stars = 0;
        if (accuracy >= 70) stars = 1;
        if (accuracy >= 85) stars = 2;
        if (accuracy >= 95) stars = 3;
        
        // Play appropriate sound
        if (stars >= 2) {
            this.sound.play('gameWin');
        } else {
            this.sound.play('gameLose');
        }
        
        if (state.maxCombo > this.save.minigames.petRhythm.bestCombo) {
            this.save.minigames.petRhythm.bestCombo = state.maxCombo;
        }
        
        if (stars > this.save.minigames.petRhythm.stars) {
            this.save.minigames.petRhythm.stars = stars;
            
            if (stars === 3 && !this.save.unlockedTokenSources.includes('rhythmMaster')) {
                this.save.tokens++;
                this.save.unlockedTokenSources.push('rhythmMaster');
                this.showNotification(`🏆 Rhythm Master Token!`);
                this.sound.play('tokenCollect');
            }
        }
        
        this.showNotification(`Accuracy: ${Math.round(accuracy)}% | +${hearts} 💖`);
        this.save.minigames.petRhythm.played++;
        this.endMinigame();
    }

    // Memory Game
    initMemory() {
        const icons = ['💖', '🌟', '🎵', '🍎', '🎮', '🗽'];
        const cards = [];
        
        // Create pairs
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
            canFlip: true
        };
        
        this.showNotification("Match the pairs! 🧠");
    }

    renderMemory() {
        const state = this.minigameState;
        
        // Background
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Title
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Memory Game', CANVAS_WIDTH/2, 30);
        
        // Cards (4x3 grid)
        const cardWidth = 70;
        const cardHeight = 90;
        const startX = 30;
        const startY = 60;
        
        state.cards.forEach((card, index) => {
            const col = index % 4;
            const row = Math.floor(index / 4);
            const x = startX + col * (cardWidth + 15);
            const y = startY + row * (cardHeight + 15);
            
            // Card shadow
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.ctx.fillRect(x + 3, y + 3, cardWidth, cardHeight);
            
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
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, cardWidth, cardHeight);
            
            // Card content
            if (card.flipped || card.matched) {
                this.ctx.font = '30px serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(card.icon, x + cardWidth/2, y + cardHeight/2);
            } else {
                // Card back design
                this.ctx.fillStyle = '#2c3e50';
                for (let py = 10; py < cardHeight - 10; py += 15) {
                    for (let px = 10; px < cardWidth - 10; px += 15) {
                        this.ctx.fillRect(x + px, y + py, 8, 8);
                    }
                }
            }
        });
        
        // Stats
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(10, 380, 340, 30);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '11px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Moves: ${state.moves}`, 20, 398);
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Time: ${elapsed}s`, CANVAS_WIDTH/2, 398);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Pairs: ${state.cards.filter(c => c.matched).length / 2}/6`, CANVAS_WIDTH - 20, 398);
    }

    handleMemoryClick(x, y) {
        const state = this.minigameState;
        if (!state.canFlip || state.flipped.length >= 2) return;
        
        const cardWidth = 70;
        const cardHeight = 90;
        const startX = 30;
        const startY = 60;
        
        // Find clicked card
        for (let index = 0; index < state.cards.length; index++) {
            const card = state.cards[index];
            if (card.matched || card.flipped) continue;
            
            const col = index % 4;
            const row = Math.floor(index / 4);
            const cardX = startX + col * (cardWidth + 15);
            const cardY = startY + row * (cardHeight + 15);
            
            if (x >= cardX && x <= cardX + cardWidth && 
                y >= cardY && y <= cardY + cardHeight) {
                
                card.flipped = true;
                state.flipped.push(index);
                
                if (state.flipped.length === 2) {
                    state.moves++;
                    state.canFlip = false;
                    
                    const card1 = state.cards[state.flipped[0]];
                    const card2 = state.cards[state.flipped[1]];
                    
                    setTimeout(() => {
                        if (card1.icon === card2.icon) {
                            // Match!
                            card1.matched = true;
                            card2.matched = true;
                            this.addParticles(CANVAS_WIDTH/2, 200, '#FFD700', 10);
                            
                            // Check win
                            if (state.cards.every(c => c.matched)) {
                                this.endMemory();
                            }
                        } else {
                            // No match
                            card1.flipped = false;
                            card2.flipped = false;
                        }
                        
                        state.flipped = [];
                        state.canFlip = true;
                    }, 1000);
                }
                
                break;
            }
        }
    }

    endMemory() {
        const state = this.minigameState;
        const time = Math.floor((Date.now() - state.startTime) / 1000);
        const hearts = Math.max(5, Math.floor(200 / (state.moves + time/10)));
        
        this.save.currency.hearts += hearts;
        
        let stars = 0;
        if (time <= 90) stars = 1;
        if (time <= 60) stars = 2;
        if (time <= 40) stars = 3;
        
        // Play appropriate sound
        if (stars >= 2) {
            this.sound.play('gameWin');
        } else {
            this.sound.play('gameLose');
        }
        
        if (time < this.save.minigames.memory.bestTime) {
            this.save.minigames.memory.bestTime = time;
        }
        
        if (stars > this.save.minigames.memory.stars) {
            this.save.minigames.memory.stars = stars;
            
            if (stars === 3 && !this.save.unlockedTokenSources.includes('memoryMaster')) {
                this.save.tokens++;
                this.save.unlockedTokenSources.push('memoryMaster');
                this.showNotification(`🏆 Memory Master Token!`);
                this.sound.play('tokenCollect');
            }
        }
        
        this.showNotification(`Time: ${time}s | Moves: ${state.moves} | +${hearts} 💖`);
        this.save.minigames.memory.played++;
        
        setTimeout(() => this.endMinigame(), 2000);
    }

    // Trivia Game
    initTrivia() {
        const questions = [
            { q: "What's Dario's favorite food?", a: ["Pizza", "Pasta", "Sushi", "Tacos"], correct: 1 },
            { q: "Where would Dario love to travel?", a: ["Paris", "Tokyo", "With Lulu anywhere", "Mars"], correct: 2 },
            { q: "Dario's biggest fear?", a: ["Spiders", "Heights", "Losing Lulu", "Clowns"], correct: 2 },
            { q: "Dario's favorite season?", a: ["Spring", "Summer", "Fall", "Winter"], correct: 1 },
            { q: "What makes Dario happiest?", a: ["Games", "Food", "Lulu's smile", "Sleep"], correct: 2 }
        ];
        
        // Shuffle and pick 5
        const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 5);
        
        this.minigameState = {
            questions: shuffled,
            current: 0,
            correct: 0,
            answered: false
        };
        
        this.showNotification("Answer questions about Dario! ❓");
    }

    renderTrivia() {
        const state = this.minigameState;
        
        // Background
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if (state.current >= state.questions.length) {
            this.endTrivia();
            return;
        }
        
        const q = state.questions[state.current];
        
        // Question box
        this.ctx.fillStyle = 'rgba(255,255,255,0.95)';
        this.ctx.fillRect(20, 40, CANVAS_WIDTH - 40, 100);
        this.ctx.strokeStyle = '#ff70a6';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(20, 40, CANVAS_WIDTH - 40, 100);
        
        // Question
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(q.q, CANVAS_WIDTH/2, 80);
        this.ctx.fillText(`Question ${state.current + 1}/5`, CANVAS_WIDTH/2, 110);
        
        // Answers
        q.a.forEach((answer, i) => {
            const y = 170 + i * 55;
            
            // Highlight correct answer if answered
            if (state.answered) {
                if (i === q.correct) {
                    this.ctx.fillStyle = '#90EE90';
                } else {
                    this.ctx.fillStyle = '#666';
                }
            } else {
                this.ctx.fillStyle = '#34495e';
            }
            
            this.ctx.fillRect(40, y, CANVAS_WIDTH - 80, 45);
            this.ctx.strokeStyle = '#fff';
            this.ctx.strokeRect(40, y, CANVAS_WIDTH - 80, 45);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '11px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(answer, CANVAS_WIDTH/2, y + 25);
        });
        
        // Score
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '14px monospace';
        this.ctx.fillText(`Score: ${state.correct}/${state.current}`, CANVAS_WIDTH/2, 410);
    }

    handleTriviaClick(x, y) {
        const state = this.minigameState;
        if (state.answered) return;
        
        const q = state.questions[state.current];
        
        // Check which answer was clicked
        for (let i = 0; i < 4; i++) {
            const answerY = 170 + i * 55;
            
            if (x >= 40 && x <= CANVAS_WIDTH - 40 && 
                y >= answerY && y <= answerY + 45) {
                
                state.answered = true;
                
                if (i === q.correct) {
                    state.correct++;
                    this.addParticles(CANVAS_WIDTH/2, answerY + 22, '#FFD700', 10);
                    this.showNotification("Correct! 💖");
                } else {
                    this.showNotification("Not quite! 💔");
                }
                
                setTimeout(() => {
                    state.current++;
                    state.answered = false;
                }, 1500);
                
                break;
            }
        }
    }

    endTrivia() {
        const state = this.minigameState;
        const hearts = state.correct * 10;
        
        this.save.currency.hearts += hearts;
        
        let stars = 0;
        if (state.correct >= 3) stars = 1;
        if (state.correct >= 4) stars = 2;
        if (state.correct === 5) stars = 3;
        
        // Play appropriate sound
        if (stars >= 2) {
            this.sound.play('gameWin');
        } else {
            this.sound.play('gameLose');
        }
        
        if (state.correct > this.save.minigames.trivia.bestStreak) {
            this.save.minigames.trivia.bestStreak = state.correct;
        }
        
        if (stars > this.save.minigames.trivia.stars) {
            this.save.minigames.trivia.stars = stars;
            
            if (stars === 3 && !this.save.unlockedTokenSources.includes('triviaMaster')) {
                this.save.tokens++;
                this.save.unlockedTokenSources.push('triviaMaster');
                this.showNotification(`🏆 Trivia Master Token!`);
                this.sound.play('tokenCollect');
            }
        }
        
        this.showNotification(`Score: ${state.correct}/5 | +${hearts} 💖`);
        this.save.minigames.trivia.played++;
        this.endMinigame();
    }

    updateMinigame(deltaTime) {
        switch(this.currentMinigame) {
            case 'feedFrenzy':
                this.updateFeedFrenzy(deltaTime);
                break;
            case 'petRhythm':
                this.updatePetRhythm(deltaTime);
                break;
            case 'danceBattle':
                if (this.danceBattle) {
                    this.danceBattle.update(deltaTime);
                }
                break;
        }
    }

    renderMinigame() {
        switch(this.currentMinigame) {
            case 'feedFrenzy':
                this.renderFeedFrenzy();
                break;
            case 'petRhythm':
                this.renderPetRhythm();
                break;
            case 'memory':
                this.renderMemory();
                break;
            case 'trivia':
                this.renderTrivia();
                break;
            case 'danceBattle':
                if (this.danceBattle) {
                    this.danceBattle.render(this.ctx);
                }
                break;
        }
    }

    handleMinigameClick(x, y) {
        switch(this.currentMinigame) {
            case 'feedFrenzy':
                this.handleFeedFrenzyClick(x);
                break;
            case 'petRhythm':
                this.handlePetRhythmClick(x, y);
                break;
            case 'memory':
                this.handleMemoryClick(x, y);
                break;
            case 'trivia':
                this.handleTriviaClick(x, y);
                break;
            case 'danceBattle':
                if (this.danceBattle) {
                    this.danceBattle.handleClick(x, y);
                }
                break;
        }
    }

    endMinigame() {
        this.currentMinigame = null;
        this.minigameState = null;
        this.currentScreen = 'main';
        this.updateUI();
        this.autoSave();
    }

    // ===== PARTICLES =====
    
    renderParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life / 2000;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        this.ctx.globalAlpha = 1;
    }

    addParticles(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 5 - 2,
                color: color,
                life: 2000
            });
        }
    }

    // ===== GAME ACTIONS =====
    
    feed() {
        if (this.save.stats.hunger < 100) {
            this.save.stats.hunger = Math.min(100, this.save.stats.hunger + 20);
            this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 5);
            this.save.stats.energy = Math.min(100, this.save.stats.energy + 5);
            
            this.sprite.animation = 'eat';
            setTimeout(() => this.sprite.animation = 'idle', 1000);
            
            this.addParticles(this.sprite.x, this.sprite.y - 30, '#FF6B6B', 8);
            this.showNotification("Yummy! Thank you! 😋");
            
            // Gain experience
            this.gainExperience(5);
            
            this.updateUI();
            this.autoSave();
        } else {
            this.showNotification("I'm full! 😊");
        }
    }

    pet() {
        this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 15);
        this.save.stats.energy = Math.min(100, this.save.stats.energy + 5);
        
        this.sprite.animation = 'happy';
        setTimeout(() => this.sprite.animation = 'idle', 1500);
        
        // Heart particles
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.addParticles(
                    this.sprite.x + (Math.random() - 0.5) * 40,
                    this.sprite.y - 30,
                    '#FF69B4',
                    3
                );
            }, i * 100);
        }
        
        const messages = [
            "That feels amazing! 🥰",
            "I love your pets! 💕",
            "More please! 🤗",
            "You're the best, Lulu! 💖"
        ];
        
        this.showNotification(messages[Math.floor(Math.random() * messages.length)]);
        this.gainExperience(3);
        this.updateUI();
        this.autoSave();
    }

    talk() {
        if (this.talkCooldown <= 0) {
            this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 8);
            
            const messages = [
                "I love you so much, Lulu! 💕",
                "You make me the happiest! ✨",
                "Want to explore NYC together? 🗽",
                "I missed you! Did you miss me? 🥺",
                "You're beautiful today! 😍",
                "Let's play a game! 🎮",
                "I wrote you a poem! 📝",
                "Forever yours! 💖",
                "You're my everything! 🌟",
                "Can't wait for our adventures! 🌈"
            ];
            
            this.showNotification(messages[Math.floor(Math.random() * messages.length)]);
            this.talkCooldown = 10000;
            this.gainExperience(2);
            this.updateUI();
            this.autoSave();
        } else {
            this.showNotification("Give me a moment to think... 🤔");
        }
    }

    openMap() {
        this.currentScreen = 'map';
        this.showNotification("Let's explore NYC! 🗽 Use WASD/Arrows!");
    }

    toggleMenu() {
        document.getElementById('menuOverlay').classList.toggle('show');
        this.sound.play('menuOpen');
    }

    photoBooth() {
        this.toggleMenu();
        
        // Take screenshot of current canvas
        this.canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lulu-tiny-you-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
        
        this.showNotification("Photo saved! 📸💖");
    }

    manageSave() {
        this.toggleMenu();
        this.exportSaveData();
    }

    exportSaveData() {
        SaveManager.saveNow(this.save);
        const blob = new Blob([JSON.stringify(this.save, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lulu-tiny-you-save-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification("Save exported! 💾");
    }

    gainExperience(amount) {
        this.save.experience += amount;
        
        // Level up every 100 exp
        const newLevel = Math.floor(this.save.experience / 100) + 1;
        if (newLevel > this.save.level) {
            this.save.level = newLevel;
            this.save.currency.hearts += 50;
            this.showNotification(`Level Up! Now level ${this.save.level}! +50 💖`);
            this.addParticles(this.sprite.x, this.sprite.y, '#FFD700', 20);
        }
    }

    // ===== RING EVENT =====
    
    triggerRingEvent() {
        this.save.inventory.push('Ring');
        
        // Play special ring sound
        this.sound.play('ring');
        
        const ringDiv = document.getElementById('ringEvent');
        ringDiv.innerHTML = `
            <div style="text-align: center; color: white; padding: 30px;">
                <div style="font-size: 18px; margin-bottom: 20px;">
                    💎 CONGRATULATIONS LULU! 💎
                </div>
                <div style="font-size: 50px; margin: 20px 0; animation: bounce 1s infinite;">
                    💍
                </div>
                <div style="font-size: 11px; line-height: 1.8; max-width: 300px; margin: 0 auto;">
                    You've collected all Golden Tokens!<br><br>
                    
                    "Lulu, from the moment we met,<br>
                    you've made every day magical.<br><br>
                    
                    This ring represents my promise:<br>
                    To always be your tiny companion,<br>
                    To make you smile every single day,<br>
                    To love you more with each moment.<br><br>
                    
                    You're my world, my happiness,<br>
                    my everything!<br><br>
                    
                    Forever yours,<br>
                    Tiny Dario 💖"
                </div>
                <button class="modal-button" style="margin-top: 20px;" onclick="game.closeRingEvent()">
                    💕 I LOVE YOU TOO! 💕
                </button>
            </div>
        `;
        
        ringDiv.classList.add('show');
        
        // Confetti explosion
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                this.addParticles(
                    Math.random() * CANVAS_WIDTH,
                    Math.random() * CANVAS_HEIGHT,
                    ['#ff70a6', '#ffd700', '#ff69b4', '#87ceeb'][Math.floor(Math.random() * 4)],
                    1
                );
            }, i * 20);
        }
        
        this.autoSave();
    }

    closeRingEvent() {
        document.getElementById('ringEvent').classList.remove('show');
        this.showNotification("Ring unlocked! You're amazing! 💍✨");
        
        // Max out happiness and give bonus
        this.save.stats.happiness = 100;
        this.save.stats.hunger = 100;
        this.save.stats.energy = 100;
        this.save.currency.hearts += 500;
        this.save.level += 5;
        
        this.updateUI();
    }

    // ===== UI UPDATES =====
    
    updateUI() {
        // Update stat bars
        document.getElementById('hungerBar').style.width = this.save.stats.hunger + '%';
        document.getElementById('energyBar').style.width = this.save.stats.energy + '%';
        document.getElementById('happinessBar').style.width = this.save.stats.happiness + '%';
        
        // Update counters
        document.getElementById('tokenCount').textContent = this.save.tokens;
        document.getElementById('heartCount').textContent = this.save.currency.hearts;
        
        // Change bar colors based on values
        const hungerBar = document.getElementById('hungerBar');
        const energyBar = document.getElementById('energyBar');
        const happyBar = document.getElementById('happinessBar');
        
        if (this.save.stats.hunger < 30) {
            hungerBar.style.background = 'linear-gradient(90deg, #ff0000, #ff6666)';
        } else if (this.save.stats.hunger < 60) {
            hungerBar.style.background = 'linear-gradient(90deg, #ff9900, #ffcc00)';
        }
        
        if (this.save.stats.energy < 30) {
            energyBar.style.background = 'linear-gradient(90deg, #ff6600, #ff9900)';
        }
        
        if (this.save.stats.happiness < 30) {
            happyBar.style.background = 'linear-gradient(90deg, #666666, #999999)';
        }
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

    autoSave() {
        this.save.lastSeenISO = new Date().toISOString();
        this.save.lastUpdateTime = Date.now();
        SaveManager.saveNow(this.save);
    }
}

// Initialize game
let game;
window.addEventListener('DOMContentLoaded', () => {
    try {
        game = new TamagotchiGame();
        console.log('Game initialized successfully');
        
        // Request persistent storage
        if ('storage' in navigator && 'persist' in navigator.storage) {
            navigator.storage.persist();
        }
    } catch (error) {
        console.error('Game initialization error:', error);
        document.getElementById('loadingScreen').style.display = 'none';
    }
});