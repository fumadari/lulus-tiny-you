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
        // For debugging: clear overfed state and reset stats
        this.save.overfed = false;
        if (this.save.stats.hunger > 90) {
            this.save.stats.hunger = 80; // Reset to normal
        }
        // Debug: refresh energy
        this.save.stats.energy = 100;
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
            y: 280, // Move Dario lower on screen
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
        
        // Initialize NPCs
        this.initializeNPCs();
        
        // Initialize daily bonus
        this.checkDailyBonus();
        
        // Start auto-save
        this.startAutoSave();
        
        // Hide loading screen
        this.ui.hideLoadingScreen();
    }
    
    initializeNPCs() {
        // Initialize NPCs with the requested characters
        this.npcs = [
            // Lulu near her apartment in Williamsburg
            {
                x: 47,
                y: 40,
                name: 'Lulu',
                emoji: '👩‍🦰',
                dialogue: [
                    "Hey there, my Tiny Dario! 💕",
                    "I love exploring Williamsburg with you!",
                    "Want to grab some artisanal coffee? ☕",
                    "You're the cutest pixel boyfriend ever!",
                    "Let's go to Smorgasburg this weekend! 🍔"
                ],
                movePattern: 'wander',
                moveRadius: 3
            },
            // Teddy - Asian friend
            {
                x: 22,
                y: 32,
                name: 'Teddy',
                emoji: '👨‍🦱',
                dialogue: [
                    "Yo Dario! What's good bro?",
                    "Want to grab some ramen? 🍜",
                    "Did you see that new tech startup?",
                    "Let's hit up K-town later!",
                    "Bro, you're looking fresh today!"
                ],
                movePattern: 'wander',
                moveRadius: 2
            },
            // Cat in Central Park
            {
                x: 22,
                y: 17,
                name: 'Whiskers',
                emoji: '🐱',
                dialogue: [
                    "*purrs contentedly*",
                    "Meow! 😸",
                    "*rubs against your leg*",
                    "*stretches and yawns*",
                    "*chases a butterfly*"
                ],
                movePattern: 'lazy',
                moveRadius: 1
            },
            // Girl with crush #1 - Near Times Square
            {
                x: 23,
                y: 33,
                name: 'Ashley',
                emoji: '👱‍♀️',
                dialogue: [
                    "OMG is that Dario? You're so cute! 😊",
                    "I follow you on everything! You're amazing!",
                    "Can we take a selfie together? Please?",
                    "You're literally perfect! 💖",
                    "I told all my friends about you!"
                ],
                movePattern: 'pace',
                moveRadius: 2
            },
            // Girl with crush #2 - Upper East Side (RIGHT next to spawn point)
            {
                x: 24,
                y: 16,
                name: 'Madison',
                emoji: '👩',
                dialogue: [
                    "Hey Dario! Fancy seeing you here! 😍",
                    "You always brighten my day!",
                    "I made you cookies! Want some? 🍪",
                    "You're so smart and handsome!",
                    "Maybe we could study together sometime?"
                ],
                movePattern: 'wander',
                moveRadius: 2
            },
            // Girl with crush #3 - Greenwich Village
            {
                x: 19,
                y: 48,
                name: 'Zoe',
                emoji: '👩‍🦱',
                dialogue: [
                    "Dario! I was just thinking about you!",
                    "You're like, totally my type! 🌟",
                    "Want to check out this art gallery with me?",
                    "I wrote a poem about you... 📝",
                    "You have the most amazing energy!"
                ],
                movePattern: 'stationary'
            },
            // Joshua Block - TikTok influencer who loves liquor
            {
                x: 16,
                y: 40,
                name: 'Joshua Block',
                emoji: '🕺',
                dialogue: [
                    "Yo! It's ya boy Joshua Block! 🥃",
                    "Just tried this SICK new whiskey, bro!",
                    "Follow me on TikTok for liquor reviews! 📱",
                    "This bourbon hits different! No cap! 🔥",
                    "Let's do shots! Content baby! 🎬",
                    "Did someone say happy hour? 🍺"
                ],
                movePattern: 'wander',
                moveRadius: 4
            }
        ];
        
        // Initialize NPC positions and states
        this.npcs.forEach(npc => {
            npc.currentX = npc.x;
            npc.currentY = npc.y;
            npc.facing = 'down';
            npc.moveTimer = Math.random() * 120;
            npc.dialogueIndex = 0;
        });
        
        console.log(`Initialized ${this.npcs.length} NPCs`);
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
                this.updateNPCs();
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
        
        // Clear overfed state when hunger drops below 90
        if (this.save.overfed && this.save.stats.hunger <= 90) {
            this.save.overfed = false;
        }
        
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
        this.drawCharacter(this.sprite.x, this.sprite.y, 4.0); // More reasonable size - 2x normal
        
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
        console.log('Rendering minigame:', this.currentMinigame);
        if (this.currentMinigame === 'feedFrenzy') {
            this.minigames.feedFrenzy.render();
        } else if (this.currentMinigame === 'danceBattle' && this.danceBattle) {
            this.danceBattle.render();
        } else {
            // Fallback: clear screen and show message
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, 360, 420);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Minigame: ${this.currentMinigame}`, 180, 210);
            this.ctx.fillText('Press ESC to exit', 180, 240);
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
        
        // Check if overfed for chubby appearance
        const isChubby = this.save.overfed || false;
        const chubbyScaleW = isChubby ? 1.4 : 1.0; // 40% wider when chubby
        const chubbyScaleH = isChubby ? 1.2 : 1.0; // 20% taller when chubby (rounder)
        
        // Shadow (bigger when chubby)
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 30, 15 * scale/2 * chubbyScaleW, 5 * scale/2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Determine mood
        const mood = this.save.isAngry ? 'angry' :
                     this.save.stats.happiness > 70 ? 'happy' : 
                     this.save.stats.happiness < 30 ? 'sad' : 'normal';
        
        // Debug: log happiness and mood occasionally
        if (this.frameCount % 300 === 0) {
            console.log(`Happiness: ${this.save.stats.happiness}, Mood: ${mood}`);
        }
        
        // Mood debugging removed
        
        // Body (circular when chubby, rectangular when normal)
        this.ctx.fillStyle = '#4169E1';
        const bodyWidth = 16 * scale * chubbyScaleW;
        const bodyHeight = 15 * scale * chubbyScaleH;
        
        if (isChubby) {
            // Draw circular belly when chubby
            this.ctx.beginPath();
            this.ctx.ellipse(x, bobY + 2*scale, bodyWidth/2, bodyHeight/2, 0, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Normal rectangular body
            this.ctx.fillRect(x - bodyWidth/2, bobY - 5*scale, bodyWidth, bodyHeight);
        }
        
        // Arms (positioned for chubby body)
        this.ctx.fillStyle = '#FDBCB4';
        const armOffset = Math.sin(this.sprite.frame) * 2;
        const armPosX = 8 * scale * chubbyScaleW + 4 * scale; // Arms moved out for wider body
        this.ctx.fillRect(x - armPosX, bobY - 3*scale + armOffset, 4*scale, 10*scale);
        this.ctx.fillRect(x + armPosX - 4*scale, bobY - 3*scale - armOffset, 4*scale, 10*scale);
        
        // Head (circular when chubby, rectangular when normal)
        const headWidth = 20 * scale * chubbyScaleW;
        const headHeight = 18 * scale * chubbyScaleH;
        
        if (isChubby) {
            // Draw circular face when chubby
            this.ctx.beginPath();
            this.ctx.ellipse(x, bobY - 11*scale, headWidth/2, headHeight/2, 0, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Normal rectangular head
            this.ctx.fillRect(x - headWidth/2, bobY - 20*scale, headWidth, headHeight);
        }
        
        // Hair (matches head shape)
        this.ctx.fillStyle = '#8B4513';
        if (isChubby) {
            // Circular hair for round head
            this.ctx.beginPath();
            this.ctx.ellipse(x, bobY - 15*scale, headWidth/2, headHeight/3, 0, 0, Math.PI, true);
            this.ctx.fill();
        } else {
            // Rectangular hair for normal head
            this.ctx.fillRect(x - headWidth/2, bobY - 20*scale, headWidth, 8*scale);
        }
        
        // Eyes (adjusted for chubby face)
        if (this.sprite.animation !== 'sleep') {
            const eyeSpacing = 6 * scale * chubbyScaleW;
            
            if (this.save.stats.happiness >= 100) {
                // Heart eyes at 100% happiness!
                this.ctx.fillStyle = '#FF69B4';
                this.ctx.font = `${Math.round(8*scale)}px serif`;
                this.ctx.fillText('💖', x - eyeSpacing - 2*scale, bobY - 8*scale);
                this.ctx.fillText('💖', x + eyeSpacing - 5*scale, bobY - 8*scale);
                this.ctx.fillStyle = '#000';
            } else if (mood === 'angry') {
                // Angry eyes - smaller and more intense
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(x - eyeSpacing, bobY - 12*scale, 2*scale, 2*scale);
                this.ctx.fillRect(x + eyeSpacing - 2*scale, bobY - 12*scale, 2*scale, 2*scale);
                // Angry eyebrows (slanted down)
                this.ctx.fillRect(x - 8*scale, bobY - 14*scale, 4*scale, 2*scale);
                this.ctx.fillRect(x + 4*scale, bobY - 14*scale, 4*scale, 2*scale);
            } else {
                // Normal eyes with blinking
                this.ctx.fillStyle = '#000';
                const blink = this.frameCount % 120 < 5;
                if (!blink) {
                    this.ctx.fillRect(x - eyeSpacing, bobY - 12*scale, 3*scale, 3*scale);
                    this.ctx.fillRect(x + eyeSpacing - 3*scale, bobY - 12*scale, 3*scale, 3*scale);
                } else {
                    this.ctx.fillRect(x - eyeSpacing, bobY - 10*scale, 3*scale, 1*scale);
                    this.ctx.fillRect(x + eyeSpacing - 3*scale, bobY - 10*scale, 3*scale, 1*scale);
                }
            }
        } else {
            // Sleeping Z's
            this.ctx.font = '12px monospace';
            this.ctx.fillText('Z', x + 12*scale*chubbyScaleW, bobY - 15*scale);
            this.ctx.font = '10px monospace';
            this.ctx.fillText('z', x + 18*scale*chubbyScaleW, bobY - 20*scale);
        }
        
        // Mouth based on mood
        this.ctx.fillStyle = '#000'; // Black for mouth
        if (mood === 'happy') {
            // Happy smile - clear upside down arch
            if (this.frameCount % 300 === 0) console.log('Drawing happy mouth');
            // Bottom of smile (main horizontal line)
            this.ctx.fillRect(x - 5*scale, bobY - 4*scale, 10*scale, 2*scale);
            // Left side curves up
            this.ctx.fillRect(x - 6*scale, bobY - 5*scale, 2*scale, 1*scale);
            this.ctx.fillRect(x - 7*scale, bobY - 6*scale, 2*scale, 1*scale);
            // Right side curves up  
            this.ctx.fillRect(x + 4*scale, bobY - 5*scale, 2*scale, 1*scale);
            this.ctx.fillRect(x + 5*scale, bobY - 6*scale, 2*scale, 1*scale);
        } else if (mood === 'sad') {
            // Sad frown - curves downward  
            if (this.frameCount % 300 === 0) console.log('Drawing sad mouth');
            // Top of frown (main horizontal line)
            this.ctx.fillRect(x - 4*scale, bobY - 6*scale, 8*scale, 2*scale);
            // Left side curves down
            this.ctx.fillRect(x - 5*scale, bobY - 5*scale, 2*scale, 1*scale);
            this.ctx.fillRect(x - 6*scale, bobY - 4*scale, 2*scale, 1*scale);
            // Right side curves down
            this.ctx.fillRect(x + 3*scale, bobY - 5*scale, 2*scale, 1*scale);
            this.ctx.fillRect(x + 4*scale, bobY - 4*scale, 2*scale, 1*scale);
        } else if (mood === 'angry') {
            // Angry expression - just the frowning mouth (eyes handled above)
            if (this.frameCount % 300 === 0) console.log('Drawing angry mouth');
            // Angry frown
            this.ctx.fillRect(x - 3*scale, bobY - 5*scale, 6*scale, 2*scale);
        } else {
            // Neutral mouth - straight line
            if (this.frameCount % 300 === 0) console.log('Drawing neutral mouth');
            this.ctx.fillRect(x - 3*scale, bobY - 5*scale, 6*scale, 2*scale);
        }
        
        // Legs (positioned for chubby body)
        this.ctx.fillStyle = '#333';
        const legOffset = this.isMoving ? Math.sin(this.sprite.walkFrame * 2) * 2 : 0;
        const legSpacing = 7 * scale * chubbyScaleW;
        this.ctx.fillRect(x - legSpacing, bobY + 10*scale, 5*scale, 8*scale + Math.abs(legOffset));
        this.ctx.fillRect(x + legSpacing - 5*scale, bobY + 10*scale, 5*scale, 8*scale - Math.abs(legOffset));
        
        // Shoes (positioned for chubby legs)
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - legSpacing - scale, bobY + 16*scale + Math.abs(legOffset), 7*scale, 4*scale);
        this.ctx.fillRect(x + legSpacing - 6*scale, bobY + 16*scale - Math.abs(legOffset), 7*scale, 4*scale);
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
        
        // Check for overfeeding
        if (this.save.stats.hunger > 90) {
            this.save.overfed = true;
            this.ui.showNotification('Oof! So full! 🤤');
        } else {
            this.ui.showNotification('Yummy! 🍎');
        }
        
        setTimeout(() => {
            this.sprite.animation = 'idle';
        }, 1000);
    }
    
    pet() {
        if (this.currentScreen !== 'main') return;
        
        const oldHappiness = this.save.stats.happiness;
        
        // Check if Dario is angry - petting helps calm him down
        if (this.save.isAngry) {
            this.save.isAngry = false;
            this.save.licks = 0; // Reset lick counter
            this.save.stats.happiness = Math.min(100, this.save.stats.happiness + STATS_CONFIG.INCREASE_AMOUNTS.PET + 10); // Extra happiness for calming
            this.sprite.animation = 'happy';
            this.sound.play('happy');
            this.ui.showNotification("Thank you for calming me down! 🥰");
            this.addParticles(this.sprite.x, this.sprite.y, '#00FF00', 15); // Green particles for calming
        } else {
            // Normal pet behavior - only affects happiness
            this.save.stats.happiness = Math.min(100, this.save.stats.happiness + STATS_CONFIG.INCREASE_AMOUNTS.PET);
            this.sprite.animation = 'happy';
            this.sound.play('pet');
            this.addParticles(this.sprite.x, this.sprite.y, '#FF69B4', 10);
        }
        
        console.log(`Pet action: happiness ${oldHappiness} -> ${this.save.stats.happiness}`);
        
        // Add hearts
        this.save.currency.hearts++;
        this.ui.createHeartParticle(this.sprite.x, this.sprite.y - 30);
        
        setTimeout(() => {
            this.sprite.animation = 'idle';
        }, 1000);
    }
    
    lick() {
        if (this.currentScreen !== 'main') return;
        
        // Initialize lick tracking if not exists
        if (this.save.licks === undefined) this.save.licks = 0;
        if (this.save.lastLickTime === undefined) this.save.lastLickTime = 0;
        if (this.save.isAngry === undefined) this.save.isAngry = false;
        
        const now = Date.now();
        this.save.licks++;
        this.save.lastLickTime = now;
        
        // Dario doesn't like licks - only affects happiness/mood
        this.save.stats.happiness = Math.max(0, this.save.stats.happiness - 15);
        
        // Check if he gets angry (more than 3 licks in 10 seconds)
        if (this.save.licks >= 3) {
            this.save.isAngry = true;
            this.save.stats.happiness = Math.max(0, this.save.stats.happiness - 25);
            this.sprite.animation = 'angry';
            this.sound.play('sad');
            this.ui.showNotification("Stop licking me! I'm getting angry! 😠");
            this.addParticles(this.sprite.x, this.sprite.y, '#FF0000', 15);
            
            // Stay angry longer
            setTimeout(() => {
                this.sprite.animation = 'idle';
                this.save.isAngry = false;
                // Reset lick counter after anger
                this.save.licks = 0;
            }, 3000);
        } else {
            this.sprite.animation = 'sad';
            this.sound.play('fail');
            this.ui.showNotification("Ew! I don't like licks! 😣");
            this.addParticles(this.sprite.x, this.sprite.y, '#8B4513', 8);
            
            setTimeout(() => {
                if (!this.save.isAngry) this.sprite.animation = 'idle';
            }, 1500);
        }
        
        // Reset lick counter after 10 seconds of no licking
        setTimeout(() => {
            if (Date.now() - this.save.lastLickTime >= 10000) {
                this.save.licks = 0;
            }
        }, 10000);
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
        this.showNotification("Let's explore NYC! 🗽 Use WASD/Arrows!");
        
        // Show map back button
        const backButton = document.getElementById('mapBackButton');
        if (backButton) {
            backButton.style.display = 'block';
        }
        
        console.log(`Map opened - Player at: (${this.save.player.x}, ${this.save.player.y})`);
    }
    
    exitMap() {
        this.currentScreen = 'main';
        
        // Hide map back button
        const backButton = document.getElementById('mapBackButton');
        if (backButton) {
            backButton.style.display = 'none';
        }
        
        this.showNotification("Welcome home! 🏠");
    }
    
    startMinigame(gameType) {
        // Check if this is a "coming soon" game
        if (['petRhythm', 'memory', 'trivia'].includes(gameType)) {
            const gameNames = {
                'petRhythm': '🎵 Pet Rhythm',
                'memory': '🧠 Memory Game',
                'trivia': '❓ Trivia Game'
            };
            this.showNotification(`${gameNames[gameType]} - Coming Soon!`);
            this.ui.toggleMenu(); // Just close the menu
            return;
        }
        
        this.currentMinigame = gameType;
        this.currentScreen = 'minigame';
        this.sound.play('gameStart');
        
        // Show minigame back button
        const backButton = document.getElementById('minigameBackButton');
        if (backButton) {
            backButton.style.display = 'block';
        }
        
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
            default:
                this.showNotification(`${gameType} - Coming Soon!`);
                this.endMinigame(); // Go back to main screen
                return;
        }
        
        this.ui.toggleMenu();
    }
    
    endMinigame() {
        this.currentScreen = 'main';
        this.currentMinigame = null;
        this.minigameState = null;
        
        // Hide minigame back button
        const backButton = document.getElementById('minigameBackButton');
        if (backButton) {
            backButton.style.display = 'none';
        }
        
        SaveManager.saveNow(this.save);
        this.showNotification("Back to main screen! 🏠");
    }
    
    // Menu functions
    toggleMenu() {
        this.ui.toggleMenu();
    }
    
    showHowToPlay() {
        const instructions = `
🎮 HOW TO PLAY TAMAGOTCHI DARIO 🎮

💕 BASIC CARE:
• FEED 🍎 - Keeps Dario full and happy
• PET ✋ - Shows love, increases happiness
• TALK 💬 - Chat with Dario for sweet messages

😠 BE CAREFUL WITH LICKS:
• LICKS 👅 - Dario doesn't like them!
• Too many licks (3+) makes him angry
• PET him to calm him down when angry

🎯 ACTIVITIES:
• GAMES 🎮 - Play minigames to earn hearts
• MAP 🗽 - Explore NYC with Dario
• SELFIE 📸 - Take cute photos together

📊 WATCH HIS STATS:
• 🍎 Hunger - Feed when low
• ⚡ Energy - Let him rest
• 😊 Happiness - Pet and play with him

❤️ GOAL: Keep Dario happy and healthy!
The better you care for him, the happier he'll be!

💖 Made with love for you! 💖`;

        this.ui.showModal('How to Play', instructions, [
            { text: 'Got it! ✨', action: () => this.ui.closeModal() }
        ]);
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
            // Walkable tiles: 0 (grass), 1 (road), 4 (park path), 5 (bridge), 6 (subway), 7 (plaza)
            // Non-walkable tiles: 2 (building), 3 (water), 8 (residential), 9 (commercial)
            const walkableTiles = [0, 1, 4, 5, 6, 7];
            if (walkableTiles.includes(tile)) {
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
                
                // Check for NPC interactions
                this.checkNPCInteraction();
                
                // Debug log
                console.log(`Player moved to: ${this.save.player.x}, ${this.save.player.y}`);
            } else {
                console.log(`Blocked tile at: ${newX}, ${newY} - tile: ${tile}`);
            }
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
                        // Check walkable tiles
                        const walkableTiles = [0, 1, 4, 5, 6, 7];
                        if (walkableTiles.includes(tile)) {
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
                        !NYC_MAP[npc.currentY] || !NYC_MAP[npc.currentY][newX] ||
                        ![0, 1, 4, 5, 6, 7].includes(NYC_MAP[npc.currentY][newX])) {
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
                            if ([0, 1, 4, 5, 6, 7].includes(tile) &&
                                (newX !== this.save.player.x || newY !== this.save.player.y)) {
                                npc.currentX = newX;
                                npc.currentY = newY;
                            }
                        }
                    }
                }
                // stationary NPCs don't move
            }
        });
    }
    
    checkNPCInteraction() {
        // Check if player is near any NPC
        this.npcs.forEach(npc => {
            const dist = Math.abs(this.save.player.x - npc.currentX) + Math.abs(this.save.player.y - npc.currentY);
            if (dist <= 1) {
                // Show dialogue
                const dialogue = npc.dialogue[npc.dialogueIndex];
                this.showNotification(`${npc.name}: ${dialogue}`);
                
                // Cycle through dialogue
                npc.dialogueIndex = (npc.dialogueIndex + 1) % npc.dialogue.length;
                
                // Special interactions
                if (npc.name === 'Lulu') {
                    // Lulu gives extra hearts
                    this.save.currency.hearts += 5;
                    this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 10);
                } else if (npc.name === 'Whiskers') {
                    // Cat interaction
                    this.sound.play('pet');
                } else if (npc.name.includes('Ashley') || npc.name.includes('Madison') || npc.name.includes('Zoe')) {
                    // Girls with crushes boost happiness
                    this.save.stats.happiness = Math.min(100, this.save.stats.happiness + 5);
                }
            }
        });
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
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (window.game.currentScreen === 'minigame') {
            const key = e.key.toLowerCase();
            
            // ESC to exit minigame
            if (key === 'escape') {
                window.game.endMinigame();
                e.preventDefault();
                return;
            }
        } else if (window.game.currentScreen === 'map') {
            const key = e.key.toLowerCase();
            
            // ESC to exit map
            if (key === 'escape') {
                window.game.exitMap();
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