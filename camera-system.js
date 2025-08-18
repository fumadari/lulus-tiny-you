// Camera System for Large Map Navigation
class CameraSystem {
    constructor(game) {
        this.game = game;
        
        // Camera position (in pixels)
        this.x = 0;
        this.y = 0;
        
        // Viewport size (in tiles)
        this.viewportWidth = 15;  // Show 15 tiles wide
        this.viewportHeight = 15; // Show 15 tiles tall
        
        // Smooth camera movement
        this.targetX = 0;
        this.targetY = 0;
        this.smoothing = 0.1;
        
        // Bounds
        this.maxX = (window.MAP_WIDTH - this.viewportWidth) * 24;
        this.maxY = (window.MAP_HEIGHT - this.viewportHeight) * 24;
    }
    
    update(playerX, playerY, deltaTime) {
        // Calculate target camera position to center on player
        const tileSize = 24;
        
        // Center camera on player
        this.targetX = (playerX * tileSize) - (this.viewportWidth * tileSize / 2);
        this.targetY = (playerY * tileSize) - (this.viewportHeight * tileSize / 2);
        
        // Clamp to map bounds
        this.targetX = Math.max(0, Math.min(this.maxX, this.targetX));
        this.targetY = Math.max(0, Math.min(this.maxY, this.targetY));
        
        // Smooth camera movement
        this.x += (this.targetX - this.x) * this.smoothing;
        this.y += (this.targetY - this.y) * this.smoothing;
    }
    
    // Convert world position to screen position
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y + 40 // Account for HUD
        };
    }
    
    // Convert screen position to world position
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y - 40
        };
    }
    
    // Check if a tile is visible
    isTileVisible(tileX, tileY) {
        const tileSize = 24;
        const tileWorldX = tileX * tileSize;
        const tileWorldY = tileY * tileSize;
        
        return tileWorldX >= this.x - tileSize && 
               tileWorldX <= this.x + this.viewportWidth * tileSize &&
               tileWorldY >= this.y - tileSize && 
               tileWorldY <= this.y + this.viewportHeight * tileSize;
    }
    
    // Get visible tile range for efficient rendering
    getVisibleTileRange() {
        const tileSize = 24;
        
        return {
            startX: Math.max(0, Math.floor(this.x / tileSize)),
            endX: Math.min(window.MAP_WIDTH, Math.ceil((this.x + this.viewportWidth * tileSize) / tileSize)),
            startY: Math.max(0, Math.floor(this.y / tileSize)),
            endY: Math.min(window.MAP_HEIGHT, Math.ceil((this.y + this.viewportHeight * tileSize) / tileSize))
        };
    }
    
    // Instant camera jump to position
    jumpTo(tileX, tileY) {
        const tileSize = 24;
        this.x = (tileX * tileSize) - (this.viewportWidth * tileSize / 2);
        this.y = (tileY * tileSize) - (this.viewportHeight * tileSize / 2);
        
        // Clamp to bounds
        this.x = Math.max(0, Math.min(this.maxX, this.x));
        this.y = Math.max(0, Math.min(this.maxY, this.y));
        
        this.targetX = this.x;
        this.targetY = this.y;
    }
}

// Fast Travel System
class FastTravelSystem {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        
        // Key locations for fast travel
        this.locations = [
            { name: "Your Apartment (UES)", x: 26, y: 15, emoji: "🏠", unlocked: true },
            { name: "Lulu's Place (Williamsburg)", x: 47, y: 40, emoji: "💕", unlocked: false },
            { name: "Central Park", x: 22, y: 17, emoji: "🌳", unlocked: false },
            { name: "Times Square", x: 22, y: 32, emoji: "🎭", unlocked: false },
            { name: "Brooklyn Bridge", x: 38, y: 50, emoji: "🌉", unlocked: false },
            { name: "Grand Central", x: 24, y: 33, emoji: "🚉", unlocked: false },
        ];
    }
    
    // Unlock a fast travel location when visited
    unlockLocation(poiId) {
        const locationMap = {
            'your_home': 0,
            'lulu_home': 1,
            'central_park': 2,
            'times_square': 3,
            'brooklyn_bridge': 4,
            'grand_central': 5
        };
        
        const index = locationMap[poiId];
        if (index !== undefined) {
            this.locations[index].unlocked = true;
            return this.locations[index].name;
        }
        return null;
    }
    
    // Open fast travel menu
    open() {
        this.isOpen = true;
    }
    
    // Close fast travel menu
    close() {
        this.isOpen = false;
    }
    
    // Travel to a location
    travelTo(index) {
        if (index >= 0 && index < this.locations.length && this.locations[index].unlocked) {
            const loc = this.locations[index];
            
            // Move player
            this.game.save.player.x = loc.x;
            this.game.save.player.y = loc.y;
            
            // Jump camera
            if (this.game.camera) {
                this.game.camera.jumpTo(loc.x, loc.y);
            }
            
            // Play travel sound
            if (this.game.sound) {
                this.game.sound.play('levelUp');
            }
            
            // Show notification
            this.game.showNotification(`Traveled to ${loc.name}! 🚇`);
            
            // Close menu
            this.close();
            
            return true;
        }
        return false;
    }
    
    // Render fast travel menu
    render(ctx) {
        if (!this.isOpen) return;
        
        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, 360, 420);
        
        // Menu box
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(30, 50, 300, 320);
        ctx.strokeStyle = '#ff70a6';
        ctx.lineWidth = 3;
        ctx.strokeRect(30, 50, 300, 320);
        
        // Title
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🚇 FAST TRAVEL 🚇', 180, 75);
        
        // Instructions
        ctx.font = '8px monospace';
        ctx.fillText('Press number key or click to travel', 180, 90);
        
        // Location list
        ctx.textAlign = 'left';
        ctx.font = '10px monospace';
        
        this.locations.forEach((loc, i) => {
            const y = 110 + i * 40;
            
            if (loc.unlocked) {
                // Unlocked location
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(40, y - 15, 280, 35);
                
                ctx.fillStyle = '#fff';
                ctx.fillText(`${i + 1}. ${loc.emoji} ${loc.name}`, 50, y);
                
                // Show if current location
                if (Math.abs(this.game.save.player.x - loc.x) < 2 && 
                    Math.abs(this.game.save.player.y - loc.y) < 2) {
                    ctx.fillStyle = '#00ff00';
                    ctx.fillText('(You are here)', 50, y + 15);
                }
            } else {
                // Locked location
                ctx.fillStyle = '#666';
                ctx.fillText(`${i + 1}. 🔒 ???`, 50, y);
                ctx.font = '8px monospace';
                ctx.fillText('Visit location to unlock', 50, y + 12);
                ctx.font = '10px monospace';
            }
        });
        
        // Close button
        ctx.fillStyle = '#ff70a6';
        ctx.fillRect(140, 335, 80, 25);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = '10px monospace';
        ctx.fillText('ESC to close', 180, 350);
    }
    
    // Handle click on fast travel menu
    handleClick(x, y) {
        if (!this.isOpen) return false;
        
        // Check if clicking on a location
        for (let i = 0; i < this.locations.length; i++) {
            const locY = 110 + i * 40;
            if (x >= 40 && x <= 320 && y >= locY - 15 && y <= locY + 20) {
                this.travelTo(i);
                return true;
            }
        }
        
        // Check close button
        if (x >= 140 && x <= 220 && y >= 335 && y <= 360) {
            this.close();
            return true;
        }
        
        return false;
    }
    
    // Handle keyboard input
    handleKey(key) {
        if (!this.isOpen) return false;
        
        // Number keys for travel
        const num = parseInt(key);
        if (num >= 1 && num <= this.locations.length) {
            this.travelTo(num - 1);
            return true;
        }
        
        // ESC to close
        if (key === 'Escape') {
            this.close();
            return true;
        }
        
        return false;
    }
}

// Export for use
window.CameraSystem = CameraSystem;
window.FastTravelSystem = FastTravelSystem;