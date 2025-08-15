// Lulu Interaction System
class LuluInteraction {
    constructor(game) {
        this.game = game;
        this.isVisiting = false;
        this.dialogueIndex = 0;
        this.luluMood = 'happy';
        this.lastVisit = null;
        
        // Lulu's dialogue based on various conditions
        this.dialogues = {
            firstVisit: [
                "Dario! You made it to Brooklyn! 💕",
                "I was wondering when you'd visit me here in Williamsburg!",
                "Come in! I'll make us some coffee ☕",
                "The L train wasn't too bad today, was it?",
                "I'm so happy you're here! 🥰"
            ],
            morningVisit: [
                "Good morning, love! You're up early! ☀️",
                "Want some breakfast? I made avocado toast 🥑",
                "The sunrise looks beautiful from here, doesn't it?",
                "Ready to explore Williamsburg together? 💕"
            ],
            eveningVisit: [
                "Perfect timing! I just got home from work 🌙",
                "Want to grab dinner at that place we love?",
                "The city lights look amazing from my window ✨",
                "Movie night? I'll make popcorn! 🍿"
            ],
            frequentVisitor: [
                "You're becoming a real Brooklynite! 😊",
                "Should we get you a key? 🔑",
                "My roommates love when you visit!",
                "Feel like home yet? 💕"
            ],
            randomChat: [
                "I found this cool vintage shop nearby!",
                "Smorgasburg this weekend?",
                "Let's walk to the waterfront!",
                "Have you tried the coffee at our corner cafe?",
                "I love having you here 💕",
                "Brooklyn suits you!",
                "Want to explore DUMBO later?",
                "The art scene here is amazing!"
            ],
            special: [
                "I love you so much, Dario! 💍",
                "Every day with you is an adventure 💕",
                "You make me so happy! 🥰",
                "Can't wait for our future together ✨"
            ]
        };
        
        // Activities you can do with Lulu
        this.activities = [
            { name: "Have Coffee Together", emoji: "☕", happiness: 10, energy: 5 },
            { name: "Cook Together", emoji: "🍳", happiness: 15, hunger: 20 },
            { name: "Watch Movie", emoji: "🎬", happiness: 20, energy: -10 },
            { name: "Walk in the Neighborhood", emoji: "🚶", happiness: 15, energy: -5 },
            { name: "Just Cuddle", emoji: "🤗", happiness: 25, energy: 10 }
        ];
    }
    
    checkIfAtLulusPlace() {
        // Check if player is at Lulu's apartment coordinates
        const luluHome = MAP_POIS_LARGE.find(poi => poi.id === 'lulu_home');
        if (!luluHome) return false;
        
        const distance = Math.abs(this.game.save.player.x - luluHome.x) + 
                        Math.abs(this.game.save.player.y - luluHome.y);
        
        return distance <= 1;
    }
    
    startVisit() {
        if (!this.checkIfAtLulusPlace()) return;
        
        this.isVisiting = true;
        const hour = new Date().getHours();
        const visits = this.game.save.luluVisits || 0;
        
        // Choose appropriate dialogue
        let dialogue;
        if (visits === 0) {
            dialogue = this.dialogues.firstVisit;
        } else if (hour < 12) {
            dialogue = this.dialogues.morningVisit;
        } else if (hour > 18) {
            dialogue = this.dialogues.eveningVisit;
        } else if (visits > 5) {
            dialogue = this.dialogues.frequentVisitor;
        } else {
            dialogue = this.dialogues.randomChat;
        }
        
        // Show random dialogue
        const message = dialogue[Math.floor(Math.random() * dialogue.length)];
        this.game.showNotification(message);
        
        // Update visit count
        this.game.save.luluVisits = (this.game.save.luluVisits || 0) + 1;
        
        // Special dialogue on milestone visits
        if (this.game.save.luluVisits === 10) {
            setTimeout(() => {
                this.game.showNotification("We've made so many memories here! 💕");
            }, 2000);
        }
        
        // Open activity menu
        setTimeout(() => {
            this.showActivityMenu();
        }, 3000);
    }
    
    showActivityMenu() {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'luluActivityMenu';
        modalDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 112, 166, 0.95);
            border: 3px solid #ff1493;
            border-radius: 15px;
            padding: 20px;
            z-index: 10000;
            font-family: 'Press Start 2P', monospace;
            color: white;
            box-shadow: 0 0 20px rgba(255, 20, 147, 0.5);
        `;
        
        modalDiv.innerHTML = `
            <h3 style="text-align: center; margin-bottom: 15px; font-size: 12px;">
                💕 What should we do? 💕
            </h3>
            <div id="activityList" style="display: flex; flex-direction: column; gap: 10px;">
                ${this.activities.map((activity, index) => `
                    <button onclick="game.luluInteraction.doActivity(${index})" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: 2px solid white;
                        color: white;
                        padding: 10px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-family: 'Press Start 2P', monospace;
                        font-size: 10px;
                        transition: all 0.3s;
                    " onmouseover="this.style.background='rgba(255,255,255,0.4)'" 
                       onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                        ${activity.emoji} ${activity.name}
                    </button>
                `).join('')}
            </div>
            <button onclick="game.luluInteraction.closeActivityMenu()" style="
                margin-top: 15px;
                width: 100%;
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid white;
                color: white;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
            ">Leave for now</button>
        `;
        
        document.body.appendChild(modalDiv);
    }
    
    doActivity(index) {
        const activity = this.activities[index];
        if (!activity) return;
        
        // Apply activity effects
        this.game.save.stats.happiness = Math.min(100, 
            this.game.save.stats.happiness + activity.happiness);
        
        if (activity.energy > 0) {
            this.game.save.stats.energy = Math.min(100, 
                this.game.save.stats.energy + activity.energy);
        } else {
            this.game.save.stats.energy = Math.max(0, 
                this.game.save.stats.energy + activity.energy);
        }
        
        if (activity.hunger) {
            this.game.save.stats.hunger = Math.min(100, 
                this.game.save.stats.hunger + activity.hunger);
        }
        
        // Show activity message
        const messages = {
            "Have Coffee Together": [
                "The coffee tastes perfect when I'm with you ☕💕",
                "This local roastery is amazing!",
                "Morning coffee dates are the best!"
            ],
            "Cook Together": [
                "We make a great team in the kitchen! 🍳",
                "This turned out delicious!",
                "Cooking with you is so fun!"
            ],
            "Watch Movie": [
                "This is so cozy 🎬💕",
                "Perfect movie night!",
                "I love our movie marathons!"
            ],
            "Walk in the Neighborhood": [
                "Williamsburg is beautiful today!",
                "I love exploring with you 🚶",
                "Let's check out that new place!"
            ],
            "Just Cuddle": [
                "I could stay like this forever 🤗",
                "You're so warm and comfy!",
                "Best part of my day 💕"
            ]
        };
        
        const activityMessages = messages[activity.name] || ["That was nice! 💕"];
        const message = activityMessages[Math.floor(Math.random() * activityMessages.length)];
        
        this.closeActivityMenu();
        this.game.showNotification(`${activity.emoji} ${message}`);
        
        // Add hearts for doing activities with Lulu
        this.game.save.currency.hearts += 5;
        
        // Update UI
        this.game.updateUI();
        
        // Play happy sound
        if (this.game.sound) {
            this.game.sound.play('love');
        }
        
        // Chance for special moment
        if (Math.random() < 0.1) {
            setTimeout(() => {
                const special = this.dialogues.special[
                    Math.floor(Math.random() * this.dialogues.special.length)
                ];
                this.game.showNotification(special);
                
                // Extra happiness boost
                this.game.save.stats.happiness = 100;
                this.game.updateUI();
            }, 2000);
        }
    }
    
    closeActivityMenu() {
        const menu = document.getElementById('luluActivityMenu');
        if (menu) {
            menu.remove();
        }
        this.isVisiting = false;
    }
    
    // Draw Lulu sprite when visiting
    renderLulu(ctx, x, y) {
        // Draw Lulu character near the player
        const luluX = x + 20;
        const luluY = y;
        
        // Lulu shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(luluX, luluY + 10, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Lulu body
        ctx.fillStyle = '#ff1493';
        ctx.fillRect(luluX - 7, luluY - 5, 14, 12);
        
        // Lulu head
        ctx.fillStyle = '#fdbcb4';
        ctx.beginPath();
        ctx.arc(luluX, luluY - 10, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Hair (blonde)
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(luluX - 7, luluY - 17, 14, 6);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(luluX - 3, luluY - 12, 2, 2);
        ctx.fillRect(luluX + 1, luluY - 12, 2, 2);
        
        // Smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(luluX, luluY - 8, 2, 0, Math.PI);
        ctx.stroke();
        
        // Hearts floating between characters
        const heartY = luluY - 25 + Math.sin(Date.now() / 500) * 3;
        ctx.fillStyle = '#ff1493';
        ctx.font = '12px sans-serif';
        ctx.fillText('💕', luluX - 10, heartY);
    }
}

// Export for use in game
window.LuluInteraction = LuluInteraction;