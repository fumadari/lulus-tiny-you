// Enhanced NYC Map Renderer for Lulu's Tiny You
class MapRenderer {
    constructor(game) {
        this.game = game;
        this.tileSize = 24;
        this.animationTime = 0;
        
        // Tile patterns for better visuals
        this.tilePatterns = {};
        this.initializePatterns();
        
        // Animated elements
        this.animatedTiles = [];
        this.vehicles = [];
        this.birds = [];
        this.clouds = [];
        
        // Lighting
        this.timeOfDay = 'day'; // day, sunset, night, sunrise
        this.lightingAlpha = 0;
        
        // Initialize animated elements
        this.initializeAnimatedElements();
    }
    
    initializePatterns() {
        // Create canvas patterns for different tile types
        this.patterns = {
            grass: this.createGrassPattern(),
            road: this.createRoadPattern(),
            water: this.createWaterPattern(),
            building: this.createBuildingPattern(),
            park: this.createParkPattern(),
            bridge: this.createBridgePattern(),
            plaza: this.createPlazaPattern(),
            subway: this.createSubwayPattern(),
            residential: this.createResidentialPattern(),
            commercial: this.createCommercialPattern()
        };
    }
    
    createGrassPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        
        // Base grass color
        ctx.fillStyle = '#4a7c4e';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Add grass texture
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * this.tileSize;
            const y = Math.random() * this.tileSize;
            const height = 2 + Math.random() * 3;
            
            ctx.strokeStyle = `rgba(60, 140, 60, ${0.3 + Math.random() * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 1, y - height);
            ctx.moveTo(x, y);
            ctx.lineTo(x + 1, y - height);
            ctx.stroke();
        }
        
        return canvas;
    }
    
    createRoadPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        
        // Asphalt base
        ctx.fillStyle = '#3d3d3d';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Add road texture
        for (let i = 0; i < 20; i++) {
            ctx.fillStyle = `rgba(50, 50, 50, ${Math.random() * 0.3})`;
            ctx.fillRect(
                Math.random() * this.tileSize,
                Math.random() * this.tileSize,
                1 + Math.random() * 2,
                1 + Math.random() * 2
            );
        }
        
        // Road markings (center line)
        ctx.strokeStyle = '#f0d000';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(this.tileSize / 2, 0);
        ctx.lineTo(this.tileSize / 2, this.tileSize);
        ctx.stroke();
        ctx.setLineDash([]);
        
        return canvas;
    }
    
    createWaterPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        
        // Water base
        const gradient = ctx.createLinearGradient(0, 0, this.tileSize, this.tileSize);
        gradient.addColorStop(0, '#2c5f7c');
        gradient.addColorStop(0.5, '#3d7fa6');
        gradient.addColorStop(1, '#2c5f7c');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Wave pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let y = 4; y < this.tileSize; y += 8) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x <= this.tileSize; x += 4) {
                ctx.lineTo(x, y + Math.sin(x * 0.5) * 2);
            }
            ctx.stroke();
        }
        
        return canvas;
    }
    
    createBuildingPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        
        // Building base
        const gradient = ctx.createLinearGradient(0, 0, 0, this.tileSize);
        gradient.addColorStop(0, '#8a8a8a');
        gradient.addColorStop(1, '#6a6a6a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Windows
        ctx.fillStyle = '#ffeb3b';
        const windowSize = 3;
        const spacing = 6;
        for (let x = 3; x < this.tileSize - 3; x += spacing) {
            for (let y = 3; y < this.tileSize - 3; y += spacing) {
                if (Math.random() > 0.3) { // Some windows are lit
                    ctx.fillStyle = Math.random() > 0.5 ? '#ffeb3b' : '#87ceeb';
                    ctx.fillRect(x, y, windowSize, windowSize);
                } else {
                    ctx.fillStyle = '#2a2a2a';
                    ctx.fillRect(x, y, windowSize, windowSize);
                }
            }
        }
        
        // Building edge highlight
        ctx.strokeStyle = '#9a9a9a';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, this.tileSize, this.tileSize);
        
        return canvas;
    }
    
    createParkPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        
        // Park grass base
        ctx.fillStyle = '#5a8c5e';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Add flowers
        for (let i = 0; i < 3; i++) {
            const x = 4 + Math.random() * (this.tileSize - 8);
            const y = 4 + Math.random() * (this.tileSize - 8);
            
            // Flower petals
            ctx.fillStyle = ['#ff69b4', '#ffeb3b', '#87ceeb'][Math.floor(Math.random() * 3)];
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
                ctx.beginPath();
                ctx.arc(
                    x + Math.cos(angle) * 2,
                    y + Math.sin(angle) * 2,
                    1.5,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
            
            // Flower center
            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Path texture
        ctx.strokeStyle = 'rgba(139, 119, 101, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, this.tileSize / 2);
        ctx.lineTo(this.tileSize, this.tileSize / 2);
        ctx.stroke();
        
        return canvas;
    }
    
    createBridgePattern() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        
        // Bridge deck
        ctx.fillStyle = '#8b7766';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Wood planks
        ctx.strokeStyle = '#6b5746';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.tileSize; x += 4) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.tileSize);
            ctx.stroke();
        }
        
        // Bridge cables (decorative)
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.quadraticCurveTo(this.tileSize / 2, 8, this.tileSize, 4);
        ctx.stroke();
        
        return canvas;
    }

    createPlazaPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');

        // Stone base
        ctx.fillStyle = '#b0b0b0';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Plaza tiles
        ctx.strokeStyle = '#9a9a9a';
        for (let x = 0; x <= this.tileSize; x += 6) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.tileSize);
            ctx.stroke();
        }
        for (let y = 0; y <= this.tileSize; y += 6) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.tileSize, y);
            ctx.stroke();
        }

        return canvas;
    }

    createSubwayPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');

        // Base sidewalk
        ctx.fillStyle = '#666666';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Subway "M"
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', this.tileSize / 2, this.tileSize / 2 + 1);

        return canvas;
    }

    createResidentialPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');

        // Base color
        const gradient = ctx.createLinearGradient(0, 0, 0, this.tileSize);
        gradient.addColorStop(0, '#9d9d9d');
        gradient.addColorStop(1, '#7d7d7d');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Windows
        ctx.fillStyle = '#ffe082';
        const windowSize = 3;
        const spacing = 6;
        for (let x = 3; x < this.tileSize - 3; x += spacing) {
            for (let y = 3; y < this.tileSize - 3; y += spacing) {
                ctx.fillRect(x, y, windowSize, windowSize);
            }
        }

        ctx.strokeStyle = '#bdbdbd';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, this.tileSize, this.tileSize);

        return canvas;
    }

    createCommercialPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');

        // Base color
        const gradient = ctx.createLinearGradient(0, 0, 0, this.tileSize);
        gradient.addColorStop(0, '#6a6a6a');
        gradient.addColorStop(1, '#4a4a4a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Windows
        ctx.fillStyle = '#9ad1ff';
        const windowSize = 3;
        const spacing = 6;
        for (let x = 3; x < this.tileSize - 3; x += spacing) {
            for (let y = 3; y < this.tileSize - 3; y += spacing) {
                if (Math.random() > 0.2) {
                    ctx.fillRect(x, y, windowSize, windowSize);
                }
            }
        }

        ctx.strokeStyle = '#8a8a8a';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, this.tileSize, this.tileSize);

        return canvas;
    }
    
    initializeAnimatedElements() {
        // Clear existing vehicles to prevent duplicates
        this.vehicles = [];
        
        // Add vehicles only on valid road tiles
        // Check the actual map data, not a fixed 15x15 grid
        if (window.NYC_MAP_LARGE) {
            const mapData = window.NYC_MAP_LARGE;
            // Sample some roads to add vehicles, but not too many
            for (let y = 0; y < MAP_HEIGHT; y += 3) {
                for (let x = 0; x < MAP_WIDTH; x += 3) {
                    if (mapData[y] && mapData[y][x] === 1 && Math.random() < 0.05) { // Road tile
                        // Check that adjacent tiles aren't water
                        let validRoad = true;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (mapData[y + dy] && mapData[y + dy][x + dx] === 3) {
                                    validRoad = false;
                                    break;
                                }
                            }
                        }
                        
                        if (validRoad) {
                            this.vehicles.push({
                                x: x * this.tileSize,
                                y: y * this.tileSize,
                                tileX: x,
                                tileY: y,
                                speed: 0.3 + Math.random() * 0.3,
                                direction: Math.random() > 0.5 ? 1 : -1,
                                color: ['#ffeb3b', '#ff0000', '#0000ff', '#00ff00'][Math.floor(Math.random() * 4)],
                                type: Math.random() > 0.6 ? 'taxi' : 'car',
                                isVertical: Math.random() > 0.5
                            });
                        }
                    }
                }
            }
        }
        
        // Add birds
        for (let i = 0; i < 5; i++) {
            this.birds.push({
                x: Math.random() * 360,
                y: Math.random() * 200,
                vx: 1 + Math.random(),
                vy: (Math.random() - 0.5) * 0.5,
                wingPhase: Math.random() * Math.PI * 2
            });
        }
        
        // Add clouds
        for (let i = 0; i < 3; i++) {
            this.clouds.push({
                x: Math.random() * 400,
                y: 20 + Math.random() * 60,
                speed: 0.1 + Math.random() * 0.2,
                size: 20 + Math.random() * 20
            });
        }
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Update vehicles with road constraints
        this.vehicles.forEach(vehicle => {
            if (window.NYC_MAP_LARGE) {
                const mapData = window.NYC_MAP_LARGE;
                
                // Move vehicle along road
                if (vehicle.isVertical) {
                    vehicle.y += vehicle.speed * vehicle.direction;
                    const newTileY = Math.floor(vehicle.y / this.tileSize);
                    
                    // Check if still on road, reverse if not
                    if (newTileY < 0 || newTileY >= MAP_HEIGHT || 
                        !mapData[newTileY] || mapData[newTileY][vehicle.tileX] !== 1) {
                        vehicle.direction *= -1;
                        vehicle.y += vehicle.speed * vehicle.direction * 2;
                    }
                } else {
                    vehicle.x += vehicle.speed * vehicle.direction;
                    const newTileX = Math.floor(vehicle.x / this.tileSize);
                    
                    // Check if still on road, reverse if not
                    if (newTileX < 0 || newTileX >= MAP_WIDTH || 
                        !mapData[vehicle.tileY] || mapData[vehicle.tileY][newTileX] !== 1) {
                        vehicle.direction *= -1;
                        vehicle.x += vehicle.speed * vehicle.direction * 2;
                    }
                }
            }
        });
        
        // Update birds
        this.birds.forEach(bird => {
            bird.x += bird.vx;
            bird.y += bird.vy;
            bird.wingPhase += 0.2;
            
            // Wrap around
            if (bird.x > 380) bird.x = -20;
            
            // Gentle vertical movement
            bird.vy += (Math.random() - 0.5) * 0.1;
            bird.vy = Math.max(-1, Math.min(1, bird.vy));
        });
        
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > 400) cloud.x = -cloud.size * 2;
        });
        
        // Update time of day
        this.updateTimeOfDay();
    }
    
    updateTimeOfDay() {
        const hour = new Date().getHours();
        
        if (hour >= 5 && hour < 7) {
            this.timeOfDay = 'sunrise';
            this.lightingAlpha = 0.3;
        } else if (hour >= 7 && hour < 17) {
            this.timeOfDay = 'day';
            this.lightingAlpha = 0;
        } else if (hour >= 17 && hour < 19) {
            this.timeOfDay = 'sunset';
            this.lightingAlpha = 0.4;
        } else {
            this.timeOfDay = 'night';
            this.lightingAlpha = 0.6;
        }
    }
    
    render(ctx, playerX, playerY, camera, mapData) {
        // Clear and set up
        ctx.fillStyle = this.getSkyColor();
        ctx.fillRect(0, 0, 360, 420);
        
        // Draw clouds
        this.renderClouds(ctx);
        
        // Get visible tile range from camera
        const range = camera ? camera.getVisibleTileRange() : 
                      { startX: 0, endX: 15, startY: 0, endY: 15 };
        
        // Draw only visible map tiles
        for (let y = range.startY; y < range.endY; y++) {
            for (let x = range.startX; x < range.endX; x++) {
                if (mapData[y] && mapData[y][x] !== undefined) {
                    this.renderTile(ctx, x, y, mapData[y][x], camera);
                }
            }
        }
        
        // Draw POI landmarks
        this.renderLandmarks(ctx);
        
        // Draw animated elements
        this.renderVehicles(ctx, camera);
        this.renderBirds(ctx);
        
        // Draw player character FIRST (so NPCs can appear on top)
        this.renderPlayer(ctx, playerX, playerY, camera);
        
        // Draw NPCs after player
        if (this.game && this.game.npcs) {
            this.renderNPCs(ctx, camera);
        }
        
        // Apply lighting overlay
        this.renderLighting(ctx);
        
        // Minimap removed for cleaner view
    }
    
    getSkyColor() {
        switch(this.timeOfDay) {
            case 'sunrise':
                return 'linear-gradient(to bottom, #ff9a9e, #fecfef)';
            case 'sunset':
                return 'linear-gradient(to bottom, #ff6b6b, #feca57)';
            case 'night':
                return 'linear-gradient(to bottom, #0f0c29, #302b63)';
            default:
                return 'linear-gradient(to bottom, #87ceeb, #98d8e8)';
        }
    }
    
    renderTile(ctx, x, y, tileType, camera) {
        let screenX = x * this.tileSize;
        let screenY = y * this.tileSize;
        
        // Apply camera offset if available
        if (camera) {
            const screenPos = camera.worldToScreen(screenX, screenY);
            screenX = screenPos.x;
            screenY = screenPos.y;
        } else {
            screenY += 40; // Offset for HUD when no camera
        }
        
        switch(tileType) {
            case 0: // Grass
                ctx.drawImage(this.patterns.grass, screenX, screenY);
                break;
                
            case 1: // Road
                ctx.drawImage(this.patterns.road, screenX, screenY);
                break;
                
            case 2: // Building
                ctx.drawImage(this.patterns.building, screenX, screenY);
                // Add building height variation
                const height = 10 + Math.sin(x * y) * 5;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(screenX, screenY - height, this.tileSize, height);
                
                // Rooftop details
                ctx.fillStyle = '#5a5a5a';
                ctx.fillRect(screenX + 2, screenY - height, this.tileSize - 4, 2);
                break;
                
            case 3: // Water
                // Animated water
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.translate(this.tileSize/2, this.tileSize/2);
                ctx.rotate(Math.sin(this.animationTime + x * 0.5) * 0.02);
                ctx.translate(-this.tileSize/2, -this.tileSize/2);
                ctx.drawImage(this.patterns.water, 0, 0);
                ctx.restore();
                
                // Water sparkles
                if (Math.sin(this.animationTime * 2 + x * y) > 0.8) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.fillRect(screenX + this.tileSize/2 - 1, screenY + this.tileSize/2 - 1, 2, 2);
                }
                break;
                
            case 4: // Park
                ctx.drawImage(this.patterns.park, screenX, screenY);
                // Animated tree
                this.renderTree(ctx, screenX + this.tileSize/2, screenY + this.tileSize/2);
                break;
                
            case 5: // Bridge
                ctx.drawImage(this.patterns.bridge, screenX, screenY);
                break;

            case 6: // Subway entrance
                ctx.drawImage(this.patterns.subway, screenX, screenY);
                break;

            case 7: // Plaza
                ctx.drawImage(this.patterns.plaza, screenX, screenY);
                break;

            case 8: // Residential building
                ctx.drawImage(this.patterns.residential, screenX, screenY);
                break;

            case 9: // Commercial building
                ctx.drawImage(this.patterns.commercial, screenX, screenY);
                break;
        }
    }
    
    renderTree(ctx, x, y) {
        // Tree trunk
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - 2, y - 4, 4, 8);
        
        // Tree leaves (animated sway)
        const sway = Math.sin(this.animationTime + x * 0.1) * 2;
        ctx.fillStyle = '#2d5a2d';
        ctx.beginPath();
        ctx.arc(x + sway, y - 8, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#3a6b3a';
        ctx.beginPath();
        ctx.arc(x + sway - 2, y - 10, 4, 0, Math.PI * 2);
        ctx.arc(x + sway + 2, y - 10, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderLandmarks(ctx) {
        MAP_POIS.forEach(poi => {
            const x = poi.x * this.tileSize;
            const y = poi.y * this.tileSize + 40;
            
            // Landmark base
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fillRect(x - 2, y - 2, this.tileSize + 4, this.tileSize + 4);
            
            // Specific landmark visuals
            switch(poi.id) {
                case 'liberty':
                    // Statue of Liberty
                    ctx.fillStyle = '#4a9b7c';
                    ctx.fillRect(x + 8, y + 12, 8, 10);
                    ctx.fillRect(x + 10, y + 8, 4, 4);
                    // Torch
                    ctx.fillStyle = '#ffd700';
                    ctx.beginPath();
                    ctx.arc(x + 12, y + 6, 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'empire':
                    // Empire State Building
                    ctx.fillStyle = '#8a8a8a';
                    ctx.fillRect(x + 6, y + 4, 12, 18);
                    ctx.fillRect(x + 10, y, 4, 4);
                    // Windows
                    ctx.fillStyle = '#ffeb3b';
                    for (let wy = 6; wy < 20; wy += 3) {
                        for (let wx = 8; wx < 16; wx += 3) {
                            ctx.fillRect(x + wx, y + wy, 1, 1);
                        }
                    }
                    break;
                    
                case 'bridge':
                    // Brooklyn Bridge cables
                    ctx.strokeStyle = '#4a4a4a';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x, y + 10);
                    ctx.quadraticCurveTo(x + 12, y, x + 24, y + 10);
                    ctx.stroke();
                    break;
                    
                case 'park':
                    // Central Park trees
                    for (let i = 0; i < 3; i++) {
                        this.renderTree(ctx, x + 6 + i * 6, y + 12);
                    }
                    break;
                    
                case 'times':
                    // Times Square screens
                    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
                    for (let i = 0; i < 4; i++) {
                        ctx.fillStyle = colors[i];
                        ctx.fillRect(x + 4 + (i % 2) * 8, y + 4 + Math.floor(i / 2) * 8, 6, 6);
                    }
                    break;
                    
                case 'museum':
                    // Museum columns
                    ctx.fillStyle = '#d4d4d4';
                    for (let i = 0; i < 3; i++) {
                        ctx.fillRect(x + 4 + i * 6, y + 8, 2, 12);
                    }
                    ctx.fillRect(x + 2, y + 6, 20, 2);
                    break;
            }
            
            // POI label with bounce
            const bounce = Math.sin(this.animationTime * 2 + poi.x) * 2;
            ctx.font = '16px sans-serif';
            ctx.fillText(poi.emoji, x + 4, y - 4 + bounce);
        });
    }
    
    renderVehicles(ctx, camera) {
        this.vehicles.forEach(vehicle => {
            // Check if vehicle is visible
            if (camera && !camera.isTileVisible(Math.floor(vehicle.x / this.tileSize), 
                                                Math.floor(vehicle.y / this.tileSize))) {
                return;
            }
            
            let x = vehicle.x;
            let y = vehicle.y;
            
            if (camera) {
                const screenPos = camera.worldToScreen(x, y);
                x = screenPos.x;
                y = screenPos.y;
            } else {
                y += 40;
            }
            
            // Don't render if off screen
            if (x < -20 || x > 380 || y < -20 || y > 440) return;
            
            if (vehicle.type === 'taxi') {
                // Taxi body
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(x, y + 6, 16, 8);
                
                // Taxi sign
                ctx.fillStyle = '#000';
                ctx.fillRect(x + 6, y + 4, 4, 2);
                
                // "TAXI" text
                ctx.fillStyle = '#000';
                ctx.font = '4px sans-serif';
                ctx.fillText('TAXI', x + 2, y + 11);
            } else {
                // Regular car
                ctx.fillStyle = vehicle.color;
                ctx.fillRect(x, y + 8, 12, 6);
            }
            
            // Wheels
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + 3, y + 14, 2, 0, Math.PI * 2);
            ctx.arc(x + 9, y + 14, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Headlights
            if (this.timeOfDay === 'night' || this.timeOfDay === 'sunset') {
                ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
                if (vehicle.direction > 0) {
                    ctx.fillRect(x + 12, y + 9, 8, 4);
                } else {
                    ctx.fillRect(x - 8, y + 9, 8, 4);
                }
            }
        });
    }
    
    renderBirds(ctx) {
        this.birds.forEach(bird => {
            ctx.save();
            ctx.translate(bird.x, bird.y);
            
            // Bird body
            ctx.fillStyle = '#4a4a4a';
            ctx.beginPath();
            ctx.ellipse(0, 0, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Wings (animated)
            const wingSpread = Math.sin(bird.wingPhase) * 4;
            ctx.strokeStyle = '#4a4a4a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-2, 0);
            ctx.lineTo(-2 - wingSpread, -2);
            ctx.moveTo(2, 0);
            ctx.lineTo(2 + wingSpread, -2);
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    renderClouds(ctx) {
        this.clouds.forEach(cloud => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            
            // Draw cloud with multiple circles
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(
                    cloud.x + i * cloud.size * 0.4,
                    cloud.y + Math.sin(i) * 5,
                    cloud.size * 0.4,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        });
    }
    
    renderNPCs(ctx, camera) {
        const npcs = this.game.npcs;
        if (!npcs || !Array.isArray(npcs)) return; // Safety check
        
        const tileSize = this.tileSize;
        
        npcs.forEach(npc => {
            // Get world position
            const worldX = npc.currentX * tileSize;
            const worldY = npc.currentY * tileSize;
            
            // Convert to screen coordinates
            let screenX, screenY;
            if (camera) {
                const screenPos = camera.worldToScreen(worldX, worldY);
                screenX = screenPos.x;
                screenY = screenPos.y;
                
                // Check if NPC is visible
                if (screenX < -tileSize || screenX > 360 || screenY < -tileSize || screenY > 420) {
                    return; // Skip rendering if off-screen
                }
            } else {
                screenX = worldX;
                screenY = worldY + 40;
            }
            
            // Draw NPC emoji
            ctx.save();
            ctx.font = '20px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Add shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillText(npc.emoji, screenX + tileSize/2 + 1, screenY + tileSize/2 + 1);
            
            // Draw emoji
            ctx.fillStyle = 'white';
            ctx.fillText(npc.emoji, screenX + tileSize/2, screenY + tileSize/2);
            
            // Draw name label
            ctx.font = '8px monospace';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(screenX, screenY - 10, tileSize, 10);
            ctx.fillStyle = 'white';
            ctx.fillText(npc.name, screenX + tileSize/2, screenY - 5);
            
            ctx.restore();
        });
    }
    
    renderPlayer(ctx, playerX, playerY, camera) {
        // Calculate screen position with camera
        let x = playerX * this.tileSize + this.tileSize / 2;
        let y = playerY * this.tileSize + this.tileSize / 2;
        
        if (camera) {
            const screenPos = camera.worldToScreen(x, y);
            x = screenPos.x;
            y = screenPos.y;
        } else {
            y += 40; // HUD offset
        }
        
        // Draw a glowing outline to make character more visible
        ctx.save();
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y - 5, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Player shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x, y + 10, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Player body with animation
        const bounce = Math.sin(this.animationTime * 5) * 2;
        
        // Body (larger and more visible)
        ctx.fillStyle = '#ff70a6';
        ctx.fillRect(x - 8, y - 6 + bounce, 16, 14);
        
        // Body outline
        ctx.strokeStyle = '#d1005d';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 8, y - 6 + bounce, 16, 14);
        
        // Head (larger)
        ctx.fillStyle = '#fdbcb4';
        ctx.beginPath();
        ctx.arc(x, y - 12 + bounce, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Head outline
        ctx.strokeStyle = '#e5a09a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y - 12 + bounce, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Eyes (bigger and more visible)
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 4, y - 14 + bounce, 3, 3);
        ctx.fillRect(x + 1, y - 14 + bounce, 3, 3);
        
        // Smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y - 9 + bounce, 3, 0, Math.PI);
        ctx.stroke();
        
        // Hair
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - 8, y - 20 + bounce, 16, 5);
        
        // Name tag above player
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 20, y - 35 + bounce, 40, 12);
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Dario', x, y - 26 + bounce);
        
        // Heart above player (if happy)
        if (this.game && this.game.save.stats.happiness > 80) {
            ctx.fillStyle = '#ff1493';
            ctx.font = '14px sans-serif';
            ctx.fillText('💕', x, y - 40 + bounce);
        }
    }
    
    renderLighting(ctx) {
        if (this.lightingAlpha > 0) {
            // Overall lighting overlay
            ctx.fillStyle = this.getLightingColor();
            ctx.globalAlpha = this.lightingAlpha;
            ctx.fillRect(0, 0, 360, 420);
            ctx.globalAlpha = 1;
            
            // Street lights at night
            if (this.timeOfDay === 'night' && this.game && this.game.camera) {
                ctx.globalCompositeOperation = 'screen';
                
                // Get visible tile range
                const range = this.game.camera.getVisibleTileRange();
                
                // Add street light glows in world coordinates
                for (let y = range.startY; y < range.endY; y++) {
                    for (let x = range.startX; x < range.endX; x++) {
                        if (NYC_MAP[y] && NYC_MAP[y][x] === 1 && (x + y) % 3 === 0) { // Road tiles
                            // World coordinates
                            const worldX = x * this.tileSize + 12;
                            const worldY = y * this.tileSize + 12;
                            
                            // Convert to screen coordinates
                            const screenPos = this.game.camera.worldToScreen(worldX, worldY);
                            
                            // Light glow
                            const gradient = ctx.createRadialGradient(screenPos.x, screenPos.y, 0, screenPos.x, screenPos.y, 30);
                            gradient.addColorStop(0, 'rgba(255, 235, 59, 0.8)');
                            gradient.addColorStop(1, 'rgba(255, 235, 59, 0)');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(screenPos.x - 30, screenPos.y - 30, 60, 60);
                        }
                    }
                }
                
                ctx.globalCompositeOperation = 'source-over';
            }
        }
    }
    
    getLightingColor() {
        switch(this.timeOfDay) {
            case 'sunrise':
                return 'rgba(255, 154, 158, 0.3)';
            case 'sunset':
                return 'rgba(254, 202, 87, 0.4)';
            case 'night':
                return 'rgba(15, 12, 41, 0.6)';
            default:
                return 'rgba(0, 0, 0, 0)';
        }
    }
    
    renderMinimap(ctx, playerX, playerY) {
        const minimapSize = 60;
        const minimapX = 290;
        const minimapY = 50;
        const tileSize = 4;
        
        // Minimap background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(minimapX - 2, minimapY - 2, minimapSize + 4, minimapSize + 4);
        
        // Draw minimap tiles
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 15; x++) {
                const tile = NYC_MAP[y][x];
                
                switch(tile) {
                    case 0: ctx.fillStyle = '#4a7c4e'; break; // Grass
                    case 1: ctx.fillStyle = '#3d3d3d'; break; // Road
                    case 2: ctx.fillStyle = '#6a6a6a'; break; // Building
                    case 3: ctx.fillStyle = '#2c5f7c'; break; // Water
                    case 4: ctx.fillStyle = '#5a8c5e'; break; // Park
                    case 5: ctx.fillStyle = '#8b7766'; break; // Bridge
                    case 6: ctx.fillStyle = '#0000ff'; break; // Subway
                    case 7: ctx.fillStyle = '#b0b0b0'; break; // Plaza
                    case 8: ctx.fillStyle = '#9d9d9d'; break; // Residential
                    case 9: ctx.fillStyle = '#555555'; break; // Commercial
                }
                
                ctx.fillRect(minimapX + x * tileSize, minimapY + y * tileSize, tileSize, tileSize);
            }
        }
        
        // Draw POIs on minimap
        MAP_POIS.forEach(poi => {
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(
                minimapX + poi.x * tileSize - 1,
                minimapY + poi.y * tileSize - 1,
                tileSize + 2,
                tileSize + 2
            );
        });
        
        // Draw player position
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(
            minimapX + playerX * tileSize - 1,
            minimapY + playerY * tileSize - 1,
            tileSize + 2,
            tileSize + 2
        );
        
        // Minimap border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(minimapX - 1, minimapY - 1, minimapSize + 2, minimapSize + 2);
    }
}

// Export for use in game
window.MapRenderer = MapRenderer;

