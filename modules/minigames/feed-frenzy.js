// ============================================
// Feed Frenzy Minigame Module
// ============================================

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../core/constants.js';

export class FeedFrenzy {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.state = null;
    }

    init() {
        this.state = {
            score: 0,
            time: 60,
            basketX: CANVAS_WIDTH / 2,
            items: [],
            speed: 1,
            combo: 0
        };
        this.game.showNotification("Catch good food! Avoid bad! 🍎");
    }

    update(deltaTime) {
        // Update timer
        this.state.time -= deltaTime / 1000;
        if (this.state.time <= 0) {
            this.end();
            return;
        }
        
        // Spawn items
        if (Math.random() < 0.02 + this.state.speed * 0.01) {
            const goodItems = ['🍎', '🍕', '🍰', '🍪', '🍔', '🌮', '🍜'];
            const badItems = ['🥦', '💀', '🗑️', '🦠'];
            const isGood = Math.random() > 0.25;
            
            this.state.items.push({
                x: Math.random() * (CANVAS_WIDTH - 40) + 20,
                y: 0,
                emoji: isGood ? 
                    goodItems[Math.floor(Math.random() * goodItems.length)] :
                    badItems[Math.floor(Math.random() * badItems.length)],
                isGood: isGood,
                speed: 2 + Math.random() * this.state.speed
            });
        }
        
        // Update items
        this.state.items = this.state.items.filter(item => {
            item.y += item.speed;
            
            // Check catch
            if (item.y > 340 && item.y < 380 && 
                Math.abs(item.x - this.state.basketX) < 35) {
                if (item.isGood) {
                    this.state.score += 10 + this.state.combo;
                    this.state.combo++;
                    this.game.addParticles(item.x, item.y, '#FFD700', 5);
                } else {
                    this.state.score = Math.max(0, this.state.score - 20);
                    this.state.combo = 0;
                    this.game.addParticles(item.x, item.y, '#FF0000', 5);
                    this.game.showNotification("Ouch! 🤢");
                }
                return false;
            }
            
            // Missed good item
            if (item.y > CANVAS_HEIGHT && item.isGood) {
                this.state.combo = 0;
            }
            
            return item.y < CANVAS_HEIGHT;
        });
        
        // Increase difficulty
        this.state.speed = 1 + this.state.score / 200;
    }

    render() {
        // Background
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, 380, CANVAS_WIDTH, 40);
        
        // Basket
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(this.state.basketX - 30, 350, 60, 35);
        this.ctx.fillRect(this.state.basketX - 35, 345, 70, 10);
        this.ctx.strokeStyle = '#4A3C28';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.state.basketX - 30, 350, 60, 35);
        
        // Items
        this.ctx.font = '24px serif';
        this.ctx.textAlign = 'center';
        this.state.items.forEach(item => {
            this.ctx.fillText(item.emoji, item.x, item.y);
        });
        
        // UI
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(10, 10, 200, 80);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.state.score}`, 20, 30);
        this.ctx.fillText(`Time: ${Math.ceil(this.state.time)}s`, 20, 50);
        this.ctx.fillText(`Combo: x${this.state.combo}`, 20, 70);
        
        // Instructions
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Click/Tap to move basket!', CANVAS_WIDTH/2, 410);
    }

    handleClick(x, y) {
        this.state.basketX = Math.max(35, Math.min(CANVAS_WIDTH - 35, x));
    }

    end() {
        const score = this.state.score;
        const hearts = Math.floor(score / 30);
        this.game.save.currency.hearts += hearts;
        
        // Stars based on score
        let stars = 0;
        if (score >= 100) stars = 1;
        if (score >= 200) stars = 2;
        if (score >= 300) stars = 3;
        
        // Play appropriate sound
        if (stars >= 2) {
            this.game.sound.play('gameWin');
        } else {
            this.game.sound.play('gameLose');
        }
        
        // Update best
        if (score > this.game.save.minigames.feedFrenzy.bestScore) {
            this.game.save.minigames.feedFrenzy.bestScore = score;
        }
        
        if (stars > this.game.save.minigames.feedFrenzy.stars) {
            this.game.save.minigames.feedFrenzy.stars = stars;
            
            // Token for perfect score
            if (stars === 3 && !this.game.save.unlockedTokenSources.includes('feedMaster')) {
                this.game.save.tokens++;
                this.game.save.unlockedTokenSources.push('feedMaster');
                this.game.showNotification(`🏆 Feed Master Token! Score: ${score}`);
                this.game.sound.play('tokenCollect');
            }
        }
        
        this.game.showNotification(`Score: ${score} | ${'⭐'.repeat(stars)} | +${hearts} 💖`);
        this.game.save.minigames.feedFrenzy.played++;
        this.game.endMinigame();
    }
}