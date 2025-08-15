// Dance Battle Minigame for Lulu's Tiny You
class DanceBattle {
    constructor(game) {
        this.game = game;
        this.state = null;
    }
    
    init() {
        this.state = {
            score: 0,
            combo: 0,
            maxCombo: 0,
            timeLeft: 60,
            danceSequence: [],
            playerSequence: [],
            currentRound: 1,
            roundComplete: false,
            showingSequence: true,
            sequenceIndex: 0,
            lastMoveTime: 0,
            
            // Dance moves
            moves: ['⬆️', '⬇️', '⬅️', '➡️', '🔄', '🎵'],
            moveNames: {
                '⬆️': 'Jump',
                '⬇️': 'Duck',
                '⬅️': 'Left Step',
                '➡️': 'Right Step', 
                '🔄': 'Spin',
                '🎵': 'Pose'
            },
            
            // Visual state
            darioAnimation: 'idle',
            luluAnimation: 'watching',
            particleEffects: [],
            feedback: '',
            feedbackTimer: 0
        };
        
        // Generate first sequence
        this.generateSequence();
        this.showSequence();
    }
    
    generateSequence() {
        const length = Math.min(3 + this.state.currentRound, 8);
        this.state.danceSequence = [];
        
        for (let i = 0; i < length; i++) {
            const randomMove = this.state.moves[Math.floor(Math.random() * this.state.moves.length)];
            this.state.danceSequence.push(randomMove);
        }
        
        this.state.playerSequence = [];
    }
    
    showSequence() {
        this.state.showingSequence = true;
        this.state.sequenceIndex = 0;
        
        const showNext = () => {
            if (this.state.sequenceIndex < this.state.danceSequence.length) {
                const move = this.state.danceSequence[this.state.sequenceIndex];
                this.state.darioAnimation = this.getMoveAnimation(move);
                
                // Play move sound
                if (this.game.sound) {
                    this.game.sound.playTone(440 + this.state.sequenceIndex * 50, 0.2, 'sine');
                }
                
                this.state.sequenceIndex++;
                setTimeout(showNext, 800);
            } else {
                // Sequence complete, player's turn
                this.state.showingSequence = false;
                this.state.darioAnimation = 'idle';
                this.state.luluAnimation = 'dancing';
                this.state.feedback = "Your turn! Copy the moves!";
                this.state.feedbackTimer = 2;
            }
        };
        
        this.state.feedback = `Watch carefully! Round ${this.state.currentRound}`;
        this.state.feedbackTimer = 2;
        setTimeout(showNext, 1000);
    }
    
    getMoveAnimation(move) {
        const animations = {
            '⬆️': 'jump',
            '⬇️': 'duck',
            '⬅️': 'stepLeft',
            '➡️': 'stepRight',
            '🔄': 'spin',
            '🎵': 'pose'
        };
        return animations[move] || 'idle';
    }
    
    handleInput(move) {
        if (this.state.showingSequence || this.state.roundComplete) return;
        
        this.state.playerSequence.push(move);
        this.state.luluAnimation = this.getMoveAnimation(move);
        
        // Play input sound
        if (this.game.sound) {
            this.game.sound.playTone(600, 0.1, 'square', 0.3);
        }
        
        // Check if move is correct
        const index = this.state.playerSequence.length - 1;
        if (this.state.danceSequence[index] === move) {
            // Correct move!
            this.state.score += 10 * (1 + Math.floor(this.state.combo / 5));
            this.state.combo++;
            this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
            
            this.createParticles(180, 300, '#00ff00');
            this.state.feedback = "Perfect!";
            this.state.feedbackTimer = 1;
            
            // Check if sequence complete
            if (this.state.playerSequence.length === this.state.danceSequence.length) {
                this.completeRound();
            }
        } else {
            // Wrong move!
            this.state.combo = 0;
            this.state.feedback = "Oops! Try again!";
            this.state.feedbackTimer = 2;
            this.createParticles(180, 300, '#ff0000');
            
            // Reset for retry
            setTimeout(() => {
                this.state.playerSequence = [];
                this.state.luluAnimation = 'dancing';
            }, 1000);
        }
        
        // Reset animation after a bit
        setTimeout(() => {
            this.state.luluAnimation = 'dancing';
        }, 400);
    }
    
    completeRound() {
        this.state.roundComplete = true;
        this.state.score += 50 * this.state.currentRound;
        this.state.feedback = `Round ${this.state.currentRound} Complete! +${50 * this.state.currentRound} points!`;
        this.state.feedbackTimer = 2;
        
        // Celebration particles
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createParticles(
                    Math.random() * 360,
                    Math.random() * 420,
                    ['#ff70a6', '#ffd700', '#00ff00'][Math.floor(Math.random() * 3)]
                );
            }, i * 50);
        }
        
        if (this.game.sound) {
            this.game.sound.play('levelUp');
        }
        
        // Next round after delay
        setTimeout(() => {
            this.state.currentRound++;
            this.state.roundComplete = false;
            this.generateSequence();
            this.showSequence();
        }, 2500);
    }
    
    createParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            this.state.particleEffects.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 2,
                color: color,
                life: 1.0
            });
        }
    }
    
    update(deltaTime) {
        // Update timer
        if (!this.state.showingSequence && !this.state.roundComplete) {
            this.state.timeLeft -= deltaTime;
            if (this.state.timeLeft <= 0) {
                this.end();
                return;
            }
        }
        
        // Update feedback timer
        if (this.state.feedbackTimer > 0) {
            this.state.feedbackTimer -= deltaTime;
        }
        
        // Update particles
        this.state.particleEffects = this.state.particleEffects.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3; // gravity
            p.life -= deltaTime * 2;
            return p.life > 0;
        });
    }
    
    render(ctx) {
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 360, 420);
        
        // Dance floor
        const gradient = ctx.createLinearGradient(0, 250, 0, 420);
        gradient.addColorStop(0, '#2a2a3e');
        gradient.addColorStop(1, '#3a3a4e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 250, 360, 170);
        
        // Disco ball
        ctx.fillStyle = '#silver';
        ctx.beginPath();
        ctx.arc(180, 50, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw Dario (left side)
        this.drawCharacter(ctx, 100, 300, this.state.darioAnimation, false);
        
        // Draw Lulu (right side)
        this.drawCharacter(ctx, 260, 300, this.state.luluAnimation, true);
        
        // Draw sequence display
        if (this.state.showingSequence) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(30, 140, 300, 60);
            
            ctx.fillStyle = '#000';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            
            for (let i = 0; i < this.state.danceSequence.length; i++) {
                const x = 60 + i * 40;
                const y = 175;
                
                if (i === this.state.sequenceIndex - 1) {
                    ctx.fillStyle = '#ff70a6';
                    ctx.fillRect(x - 18, y - 25, 36, 36);
                    ctx.fillStyle = '#fff';
                }
                
                ctx.fillText(this.state.danceSequence[i], x, y);
                ctx.fillStyle = '#000';
            }
        }
        
        // Draw player input area
        if (!this.state.showingSequence && !this.state.roundComplete) {
            ctx.fillStyle = 'rgba(255, 112, 166, 0.2)';
            ctx.fillRect(30, 350, 300, 50);
            
            // Draw move buttons
            for (let i = 0; i < this.state.moves.length; i++) {
                const x = 45 + i * 50;
                const y = 375;
                
                ctx.fillStyle = '#ff70a6';
                ctx.fillRect(x - 20, y - 20, 40, 40);
                
                ctx.fillStyle = '#fff';
                ctx.font = '20px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(this.state.moves[i], x, y + 5);
            }
            
            // Show player sequence
            ctx.fillStyle = '#fff';
            ctx.font = '16px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('Your moves: ' + this.state.playerSequence.join(' '), 30, 340);
        }
        
        // Draw particles
        this.state.particleEffects.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        ctx.globalAlpha = 1;
        
        // UI Elements
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${this.state.score}`, 10, 25);
        ctx.fillText(`Combo: ${this.state.combo}`, 10, 40);
        ctx.fillText(`Round: ${this.state.currentRound}`, 10, 55);
        ctx.fillText(`Time: ${Math.ceil(this.state.timeLeft)}s`, 280, 25);
        
        // Feedback message
        if (this.state.feedbackTimer > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.fillRect(60, 90, 240, 40);
            
            ctx.fillStyle = '#ff70a6';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.state.feedback, 180, 115);
        }
    }
    
    drawCharacter(ctx, x, y, animation, isLulu) {
        // Simple character representation
        const color = isLulu ? '#ff70a6' : '#4a90e2';
        
        // Adjust position based on animation
        let offsetY = 0;
        let offsetX = 0;
        
        switch(animation) {
            case 'jump':
                offsetY = -20;
                break;
            case 'duck':
                offsetY = 10;
                break;
            case 'stepLeft':
                offsetX = -10;
                break;
            case 'stepRight':
                offsetX = 10;
                break;
            case 'spin':
                // Rotate character
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(Date.now() / 100);
                ctx.translate(-x, -y);
                break;
        }
        
        // Draw character
        ctx.fillStyle = color;
        ctx.fillRect(x - 15 + offsetX, y - 40 + offsetY, 30, 40);
        
        // Head
        ctx.beginPath();
        ctx.arc(x + offsetX, y - 50 + offsetY, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - 5 + offsetX, y - 52 + offsetY, 4, 4);
        ctx.fillRect(x + 1 + offsetX, y - 52 + offsetY, 4, 4);
        
        if (animation === 'spin') {
            ctx.restore();
        }
    }
    
    handleClick(x, y) {
        // Check if clicking on move buttons
        if (!this.state.showingSequence && !this.state.roundComplete && y >= 355 && y <= 395) {
            for (let i = 0; i < this.state.moves.length; i++) {
                const buttonX = 45 + i * 50;
                if (x >= buttonX - 20 && x <= buttonX + 20) {
                    this.handleInput(this.state.moves[i]);
                    break;
                }
            }
        }
    }
    
    handleKey(key) {
        const keyMap = {
            'ArrowUp': '⬆️',
            'w': '⬆️',
            'ArrowDown': '⬇️',
            's': '⬇️',
            'ArrowLeft': '⬅️',
            'a': '⬅️',
            'ArrowRight': '➡️',
            'd': '➡️',
            ' ': '🔄',
            'Enter': '🎵'
        };
        
        if (keyMap[key]) {
            this.handleInput(keyMap[key]);
        }
    }
    
    end() {
        const hearts = Math.floor(this.state.score / 100);
        this.game.save.currency.hearts += hearts;
        
        // Calculate stars
        let stars = 0;
        if (this.state.score >= 500) stars = 1;
        if (this.state.score >= 1000) stars = 2;
        if (this.state.score >= 1500) stars = 3;
        
        // Update save
        if (!this.game.save.minigames.danceBattle) {
            this.game.save.minigames.danceBattle = { bestScore: 0, stars: 0, played: 0 };
        }
        
        if (this.state.score > this.game.save.minigames.danceBattle.bestScore) {
            this.game.save.minigames.danceBattle.bestScore = this.state.score;
        }
        
        if (stars > this.game.save.minigames.danceBattle.stars) {
            this.game.save.minigames.danceBattle.stars = stars;
        }
        
        this.game.save.minigames.danceBattle.played++;
        
        // Check for token
        if (stars === 3 && !this.game.save.unlockedTokenSources.includes('danceMaster')) {
            this.game.save.tokens++;
            this.game.save.unlockedTokenSources.push('danceMaster');
            this.game.showNotification(`🏆 Dance Master Token!`);
            this.game.sound.play('tokenCollect');
        }
        
        // Play end sound
        if (stars >= 2) {
            this.game.sound.play('gameWin');
        } else {
            this.game.sound.play('gameLose');
        }
        
        // Show results
        this.game.showModal(
            'Dance Battle Complete!',
            `Score: ${this.state.score}\nMax Combo: ${this.state.maxCombo}\nHearts Earned: ${hearts}\nStars: ${'⭐'.repeat(stars)}`
        );
        
        this.game.currentMinigame = null;
        this.game.currentScreen = 'main';
        this.game.updateUI();
    }
}

// Export for use in game
window.DanceBattle = DanceBattle;