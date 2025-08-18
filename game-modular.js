// ============================================
// LULU'S TINY YOU - Modular Version
// ============================================

import { SAVE_KEY, SaveManager } from './modules/core/save-manager.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, GAME_STATES, STATS_CONFIG } from './modules/core/constants.js';
import { SPRITES } from './modules/data/sprites.js';
import { TRIVIA_QUESTIONS } from './modules/data/trivia-questions.js';
import { UIManager } from './modules/ui/ui-manager.js';
import { FeedFrenzy } from './modules/minigames/feed-frenzy.js';

// Use the NYC map data that's already loaded globally
const NYC_MAP = window.NYC_MAP_LARGE;
const MAP_POIS = window.MAP_POIS_LARGE;
const MAP_WIDTH = window.MAP_WIDTH;
const MAP_HEIGHT = window.MAP_HEIGHT;

// Main Game Class - Refactored
class TamagotchiGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // Initialize managers
        this.save = SaveManager.loadSave();
        this.ui = new UIManager(this);
        
        // Game state
        this.currentScreen = 'main';  // Use string like original
        this.lastUpdateTime = Date.now();
        this.frameCount = 0;
        this.particles = [];
        
        // Initialize sound system (already loaded globally)
        this.sound = new SoundSystem();
        
        // Initialize map renderer (already loaded globally)
        this.mapRenderer = new MapRenderer(this);
        
        // Initialize camera system (already loaded globally)
        this.camera = new CameraSystem(this);
        // Update camera bounds with the correct map size
        this.camera.maxX = (MAP_WIDTH - this.camera.viewportWidth) * 24;
        this.camera.maxY = (MAP_HEIGHT - this.camera.viewportHeight) * 24;
        
        // Jump camera to player position (UES street)
        const playerX = this.save.player?.x || 24;
        const playerY = this.save.player?.y || 15;
        this.camera.jumpTo(playerX, playerY);
        
        // Ensure player position is valid - Always start at UES apartment street
        if (!this.save.player || !this.save.player.x || !this.save.player.y || 
            this.save.player.x === 0 || this.save.player.y === 0) {
            this.save.player = {
                x: 24, // UES avenue (vertical road at x=24)
                y: 15, // UES street (horizontal road at y=15)
                facing: 'down'
            };
            console.log('Player spawned at Upper East Side intersection: (24, 15)');
        }
        
        // Initialize minigames
        this.minigames = {
            feedFrenzy: new FeedFrenzy(this),
            danceBattle: null // Will use the global DanceBattle
        };
        
        // Character/sprite state
        this.sprite = {
            x: CANVAS_WIDTH / 2,
            y: 280,
            animation: 'idle',
            frame: 0,
            walkFrame: 0
        };
        this.isMoving = false;
        
        // Pet state (for compatibility)
        this.petState = 'idle';
        this.animationFrame = 0;
        this.animationTimer = 0;
        
        // Initialize other properties
        this.currentMinigame = null;
        this.minigameState = null;
        this.isDragging = false;
        
        // Initialize daily bonus
        this.checkDailyBonus();
        
        // Start auto-save
        this.startAutoSave();
        
        // Hide loading screen
        this.ui.hideLoadingScreen();
    }
    
    checkDailyBonus() {
        const today = new Date().toISOString().split('T')[0];
        if (this.save.streak.lastDayISO !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            if (this.save.streak.lastDayISO === yesterday) {
                this.save.streak.current++;
                this.ui.showNotification(`🔥 ${this.save.streak.current} day streak! +${this.save.streak.current * 10} 💖`);
                this.save.currency.hearts += this.save.streak.current * 10;
                
                // Token for 7 day streak
                if (this.save.streak.current === 7 && !this.save.unlockedTokenSources.includes('weekStreak')) {
                    this.save.tokens++;
                    this.save.unlockedTokenSources.push('weekStreak');
                    this.ui.showNotification('🏆 Week Streak Token earned!');
                }
            } else {
                this.save.streak.current = 1;
                this.ui.showNotification('Welcome back! +10 💖');
                this.save.currency.hearts += 10;
            }
            
            this.save.streak.lastDayISO = today;
            SaveManager.saveNow(this.save);
        }
    }
    
    startAutoSave() {
        setInterval(() => {
            SaveManager.saveNow(this.save);
        }, 30000); // Auto-save every 30 seconds
    }
    
    // Core game loop
    update() {
        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;
        this.lastUpdateTime = now;
        this.frameCount++;
        
        // Update based on current screen
        switch(this.currentScreen) {
            case 'main':
                this.updateMain(deltaTime);
                break;
            case 'minigame':
                this.updateMinigame(deltaTime);
                break;
            case 'map':
                this.mapRenderer.update(deltaTime);
                this.camera.update(this.save.player.x, this.save.player.y, deltaTime);
                break;
        }
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update UI
        this.ui.updateStatsBar(this.save.stats);
        this.ui.updateCurrency(this.save.currency, this.save.tokens);
        
        // Continue game loop
        requestAnimationFrame(() => this.update());
    }
    
    updateMain(deltaTime) {
        // Update animation
        this.animationTimer += deltaTime;
        if (this.animationTimer > 500) {
            this.animationTimer = 0;
            this.animationFrame = (this.animationFrame + 1) % 2;
            this.sprite.frame = (this.sprite.frame + 1) % 2;
        }
        
        // Decay stats
        const decayFactor = deltaTime / 60000; // Per minute
        this.save.stats.hunger = Math.max(0, this.save.stats.hunger - STATS_CONFIG.DECAY_RATES.HUNGER * decayFactor);
        this.save.stats.energy = Math.max(0, this.save.stats.energy - STATS_CONFIG.DECAY_RATES.ENERGY * decayFactor);
        this.save.stats.happiness = Math.max(0, this.save.stats.happiness - STATS_CONFIG.DECAY_RATES.HAPPINESS * decayFactor);
        
        // Update pet state based on stats
        const avgStat = (this.save.stats.hunger + this.save.stats.energy + this.save.stats.happiness) / 3;
        if (avgStat < 20) {
            this.petState = 'sad';
        } else if (avgStat > 80) {
            this.petState = 'happy';
        } else if (this.save.stats.energy < 30) {
            this.petState = 'sleep';
        } else {
            this.petState = 'idle';
        }
    }
    
    updateMinigame(deltaTime) {
        if (this.currentMinigame === 'feedFrenzy') {
            this.minigames.feedFrenzy.update(deltaTime);
        } else if (this.currentMinigame === 'danceBattle' && this.danceBattle) {
            this.danceBattle.update(deltaTime);
        }
    }
    
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime;
            particle.y -= particle.speed * deltaTime / 16;
            particle.x += particle.vx * deltaTime / 16;
            return particle.life > 0;
        });
    }
    
    // Rendering
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Render based on current screen
        switch(this.currentScreen) {
            case 'main':
                this.renderMain();
                break;
            case 'minigame':
                this.renderMinigame();
                break;
            case 'map':
                this.renderMap();
                break;
        }
        
        // Render particles
        this.renderParticles();
    }
    
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
    
    renderMap() {
        this.mapRenderer.render(
            this.ctx,
            this.save.player.x,
            this.save.player.y,
            this.camera,
            NYC_MAP
        );
    }
    
    renderMinigame() {
        if (this.currentMinigame === 'feedFrenzy') {
            this.minigames.feedFrenzy.render();
        } else if (this.currentMinigame === 'danceBattle' && this.danceBattle) {
            this.danceBattle.render();
        }
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life / 1000;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        });
        this.ctx.globalAlpha = 1;
    }
    
    // Character drawing
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
        this.ctx.fillRect(x - 7*scale, bobY + 10*scale, 5*scale, 8*scale + Math.abs(legOffset));
        this.ctx.fillRect(x + 2*scale, bobY + 10*scale, 5*scale, 8*scale - Math.abs(legOffset));
        
        // Shoes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - 8*scale, bobY + 16*scale + Math.abs(legOffset), 7*scale, 4*scale);
        this.ctx.fillRect(x + 1*scale, bobY + 16*scale - Math.abs(legOffset), 7*scale, 4*scale);
    }
    
    drawSpeechBubble(x, y, text) {
        const padding = 8;
        const width = text.length * 7 + padding * 2;
        const height = 25;
        
        // Bubble
        this.ctx.fillStyle = 'rgba(255,255,255,0.95)';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(x - width/2, y, width, height, 5);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Tail
        this.ctx.beginPath();
        this.ctx.moveTo(x - 5, y + height);
        this.ctx.lineTo(x + 5, y + height);
        this.ctx.lineTo(x, y + height + 8);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Text
        this.ctx.fillStyle = '#333';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y + height/2);
    }
    
    // Particle system
    addParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                speed: 1 + Math.random(),
                color: color,
                life: 1000
            });
        }
    }
    
    // User interactions
    feed() {
        if (this.currentScreen !== 'main') return;
        
        this.save.stats.hunger = Math.min(100, this.save.stats.hunger + STATS_CONFIG.INCREASE_AMOUNTS.FEED);
        this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 5);
        this.sprite.animation = 'eat';
        this.sound.play('eat');
        this.addParticles(this.sprite.x, this.sprite.y, '#FFD700', 10);
        this.ui.showNotification('Yummy! 🍎');
        
        setTimeout(() => {
            this.sprite.animation = 'idle';
        }, 1000);
    }
    
    pet() {
        if (this.currentScreen !== 'main') return;
        
        this.save.stats.happiness = Math.min(100, this.save.stats.happiness + STATS_CONFIG.INCREASE_AMOUNTS.PET);
        this.save.stats.energy = Math.min(100, this.save.stats.energy + 5);
        this.sprite.animation = 'happy';
        this.sound.play('pet');
        this.addParticles(this.sprite.x, this.sprite.y, '#FF69B4', 10);
        
        // Add hearts
        this.save.currency.hearts++;
        this.ui.createHeartParticle(this.sprite.x, this.sprite.y - 30);
        
        setTimeout(() => {
            this.sprite.animation = 'idle';
        }, 1000);
    }
    
    talk() {
        if (this.currentScreen !== 'main') return;
        
        const messages = [
            "I love you Lulu! 💕",
            "You're the best! 🥰",
            "Miss you! 😘",
            "Let's play! 🎮",
            "Thinking of you! 💭",
            "You make me happy! 😊"
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        this.ui.showNotification(message);
        this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 10);
        this.sound.play('talk');
    }
    
    startSelfie() {
        if (this.currentScreen !== 'main') return;
        
        // Simple selfie simulation
        this.ui.showNotification('📸 Say cheese!');
        this.sound.play('camera');
        
        // Flash effect
        this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        setTimeout(() => {
            this.ui.showNotification('Perfect shot! +5 💖');
            this.save.currency.hearts += 5;
        }, 500);
    }
    
    openMap() {
        this.currentScreen = 'map';  // Use string like the original, not GAME_STATES.MAP
        
        // Ensure player is at valid location (UES street if position is invalid)
        if (!this.save.player.x || !this.save.player.y) {
            this.save.player.x = 24;
            this.save.player.y = 15;
        }
        
        this.camera.jumpTo(this.save.player.x, this.save.player.y);  // Center camera on player
        this.showNotification("Let's explore NYC! 🗽 Use WASD/Arrows! (ESC to exit)");
        console.log(`Map opened - Player at: (${this.save.player.x}, ${this.save.player.y})`);
    }
    
    startMinigame(gameType) {
        this.currentMinigame = gameType;
        this.currentScreen = 'minigame';
        this.sound.play('gameStart');
        
        switch(gameType) {
            case 'feedFrenzy':
                this.minigames.feedFrenzy.init();
                this.minigameState = this.minigames.feedFrenzy.state;
                break;
            case 'danceBattle':
                if (!this.danceBattle) {
                    this.danceBattle = new DanceBattle(this);
                }
                this.danceBattle.init();
                this.minigameState = this.danceBattle.state;
                break;
        }
        
        this.ui.toggleMenu();
    }
    
    endMinigame() {
        this.currentScreen = 'main';
        this.currentMinigame = null;
        this.minigameState = null;
        SaveManager.saveNow(this.save);
    }
    
    // Menu functions
    toggleMenu() {
        this.ui.toggleMenu();
    }
    
    manageSave() {
        this.ui.showModal('Save Data', 'Choose an option:', [
            { 
                text: 'Export Save', 
                action: () => {
                    SaveManager.exportSave(this.save);
                    this.ui.closeModal();
                    this.ui.showNotification('Save exported!');
                }
            },
            { 
                text: 'Import Save', 
                action: () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = async (e) => {
                        try {
                            const file = e.target.files[0];
                            const data = await SaveManager.importSave(file);
                            this.save = data;
                            this.ui.showNotification('Save imported!');
                            this.ui.closeModal();
                            location.reload();
                        } catch (err) {
                            this.ui.showNotification('Import failed!');
                        }
                    };
                    input.click();
                }
            },
            { text: 'Cancel', action: () => this.ui.closeModal() }
        ]);
    }
    
    // Utility functions
    showNotification(message, duration) {
        this.ui.showNotification(message, duration);
    }
    
    closeModal() {
        this.ui.closeModal();
    }
    
    // Input handling
    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
        const y = (event.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
        
        if (this.currentScreen === 'minigame') {
            this.handleMinigameClick(x, y);
        } else if (this.currentScreen === 'map') {
            this.mapRenderer.handleClick(x, y);
        }
    }
    
    handleMinigameClick(x, y) {
        if (this.currentMinigame === 'feedFrenzy') {
            this.minigames.feedFrenzy.handleClick(x, y);
        } else if (this.currentMinigame === 'danceBattle' && this.danceBattle) {
            this.danceBattle.handleClick(x, y);
        }
    }
    
    // Map movement
    movePlayer(dx, dy) {
        const newX = this.save.player.x + dx;
        const newY = this.save.player.y + dy;
        
        // Check bounds
        if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
            // Check if tile is walkable
            const tile = NYC_MAP[newY][newX];
            if (tile !== '#' && tile !== '~' && tile !== '^') {  // Not building, water, or mountain
                this.save.player.x = newX;
                this.save.player.y = newY;
                
                // Update facing direction
                if (dx > 0) this.save.player.facing = 'right';
                else if (dx < 0) this.save.player.facing = 'left';
                else if (dy > 0) this.save.player.facing = 'down';
                else if (dy < 0) this.save.player.facing = 'up';
                
                // Immediately update camera to follow player
                this.camera.update(this.save.player.x, this.save.player.y, 16);
                
                // Check for POI interactions
                this.checkPOIInteraction();
                
                // Debug log
                console.log(`Player moved to: ${this.save.player.x}, ${this.save.player.y}`);
            } else {
                console.log(`Blocked tile at: ${newX}, ${newY} - tile: ${tile}`);
            }
        }
    }
    
    checkPOIInteraction() {
        // Check if player is near any POI
        for (let poi of MAP_POIS) {
            const dist = Math.abs(this.save.player.x - poi.x) + Math.abs(this.save.player.y - poi.y);
            if (dist <= 2) {
                if (!this.save.map.visitedPOIs.includes(poi.name)) {
                    this.save.map.visitedPOIs.push(poi.name);
                    this.ui.showNotification(`Discovered ${poi.name}! ${poi.emoji} +10 💖`);
                    this.save.currency.hearts += 10;
                    this.sound.play('discover');
                }
            }
        }
    }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.game = new TamagotchiGame();
    
    // Set up event listeners
    window.game.canvas.addEventListener('click', (e) => window.game.handleClick(e));
    window.game.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const clickEvent = new MouseEvent('click', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        window.game.handleClick(clickEvent);
    });
    
    // Keyboard controls for map movement
    document.addEventListener('keydown', (e) => {
        if (window.game.currentScreen === 'map') {
            const key = e.key.toLowerCase();
            
            // ESC to exit map
            if (key === 'escape') {
                window.game.currentScreen = 'main';
                window.game.showNotification("Back home!");
                e.preventDefault();
                return;
            }
            
            let dx = 0, dy = 0;
            
            if (key === 'w' || key === 'arrowup') dy = -1;
            if (key === 's' || key === 'arrowdown') dy = 1;
            if (key === 'a' || key === 'arrowleft') dx = -1;
            if (key === 'd' || key === 'arrowright') dx = 1;
            
            if (dx !== 0 || dy !== 0) {
                window.game.movePlayer(dx, dy);
                e.preventDefault();
            }
        }
    });
    
    // Start game loop
    window.game.update();
    
    // Start rendering
    function renderLoop() {
        window.game.render();
        requestAnimationFrame(renderLoop);
    }
    renderLoop();
});