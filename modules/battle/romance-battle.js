// ============================================
// Romance Battle System - Pokemon Style
// ============================================

export class RomanceBattle {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.opponent = null;
        this.playerHp = 100;
        this.opponentHp = 100;
        this.playerLevel = 1;
        this.experience = 0;
        this.battleTurn = 'player';
        this.battleLog = [];
        this.animations = [];
    }

    getRandomOpponent() {
        const opponents = [
            {
                name: 'Zoe',
                fullName: 'Brooklyn Hipster Girl',
                type: 'Artsy',
                sprite: '👩‍🎨',
                level: Math.floor(Math.random() * 3) + 1,
                moves: [
                    { name: 'Green Card Offer', damage: 15, description: '"Do you want a green card? I can help..."' },
                    { name: 'Coffee Shop Invite', damage: 20, description: '"Wanna grab coffee at my favorite spot?"' },
                    { name: 'Art Gallery Suggestion', damage: 18, description: '"There\'s this amazing gallery opening..."' },
                    { name: 'Pretentious Quote', damage: 12, description: '"As Kafka once said..."' }
                ],
                weakness: 'call_lulu',
                personality: 'intellectual'
            },
            {
                name: 'Madison',
                fullName: 'Manhattan Finance Bro',
                type: 'Corporate',
                sprite: '👩‍💼',
                level: Math.floor(Math.random() * 4) + 2,
                moves: [
                    { name: 'Salary Flex', damage: 25, description: '"I just got a huge bonus..."' },
                    { name: 'Expensive Restaurant Invite', damage: 22, description: '"Let me take you to Mo\'s for pizza"' },
                    { name: 'Stock Tip', damage: 15, description: '"I have insider info on this stock..."' },
                    { name: 'Name Drop', damage: 18, description: '"I know the CEO personally"' }
                ],
                weakness: 'im_gay',
                personality: 'materialistic'
            },
            {
                name: 'Tiffany',
                fullName: 'Queens Workout Enthusiast',
                type: 'Fitness',
                sprite: '💪',
                level: Math.floor(Math.random() * 3) + 1,
                moves: [
                    { name: 'Gym Buddy Invite', damage: 20, description: '"You should come work out with me!"' },
                    { name: 'Protein Shake Offer', damage: 15, description: '"Want to try my post-workout smoothie?"' },
                    { name: 'Flex Appeal', damage: 18, description: '*flexes biceps* "Feel how strong I am!"' },
                    { name: 'Marathon Training', damage: 16, description: '"Training for NYC Marathon, join me?"' }
                ],
                weakness: 'scream',
                personality: 'energetic'
            },
            {
                name: 'Brooklyn',
                fullName: 'Williamsburg Foodie',
                type: 'Culinary',
                sprite: '🍕',
                level: Math.floor(Math.random() * 3) + 2,
                moves: [
                    { name: 'Restaurant Recommendation', damage: 17, description: '"I know this hidden gem in Chinatown..."' },
                    { name: 'Cooking Class Invite', damage: 19, description: '"Let me teach you my pasta recipe"' },
                    { name: 'Food Instagram', damage: 14, description: '"Check out my food blog!"' },
                    { name: 'Wine Tasting', damage: 21, description: '"This wine pairs perfectly with..."' }
                ],
                weakness: 'fake_phone_call',
                personality: 'sophisticated'
            },
            {
                name: 'Skyler',
                fullName: 'East Village Musician',
                type: 'Creative',
                sprite: '🎸',
                level: Math.floor(Math.random() * 4) + 1,
                moves: [
                    { name: 'Song Dedication', damage: 23, description: '"I wrote this song about you..."' },
                    { name: 'Concert Invite', damage: 18, description: '"Come to my show at Mercury Lounge"' },
                    { name: 'Guitar Serenade', damage: 20, description: '*starts playing acoustic guitar*' },
                    { name: 'Record Deal Mention', damage: 16, description: '"My label wants to sign me..."' }
                ],
                weakness: 'awkward_dance',
                personality: 'romantic'
            },
            {
                name: 'Chanel',
                fullName: 'Upper East Side Socialite',
                type: 'Elite',
                sprite: '💎',
                level: Math.floor(Math.random() * 5) + 3,
                moves: [
                    { name: 'Exclusive Party Invite', damage: 28, description: '"Come to my rooftop party in the Hamptons"' },
                    { name: 'Designer Name Drop', damage: 22, description: '"This dress is vintage Chanel..."' },
                    { name: 'Charity Gala', damage: 24, description: '"Be my date to the Met Gala after-party"' },
                    { name: 'Trust Fund Flex', damage: 26, description: '"Money is never an issue for me"' }
                ],
                weakness: 'talk_about_taxes',
                personality: 'entitled'
            }
        ];
        
        return opponents[Math.floor(Math.random() * opponents.length)];
    }

    getPlayerMoves() {
        return [
            {
                name: 'Call Lulu',
                damage: 30,
                description: '"Sorry, my girlfriend is calling!"',
                type: 'loyalty',
                effectiveness: {
                    'Artsy': 2.0,
                    'Corporate': 1.5,
                    'Fitness': 1.2,
                    'Culinary': 1.8,
                    'Creative': 2.2,
                    'Elite': 1.0
                }
            },
            {
                name: 'Tell Them I\'m Gay',
                damage: 35,
                description: '"Actually, I\'m not into girls..."',
                type: 'deflection',
                effectiveness: {
                    'Artsy': 1.2,
                    'Corporate': 2.5,
                    'Fitness': 1.8,
                    'Culinary': 1.5,
                    'Creative': 1.3,
                    'Elite': 2.0
                }
            },
            {
                name: 'Scream',
                damage: 25,
                description: '"AHHHHHHH!" *runs away*',
                type: 'panic',
                effectiveness: {
                    'Artsy': 1.0,
                    'Corporate': 1.2,
                    'Fitness': 2.0,
                    'Culinary': 1.3,
                    'Creative': 1.1,
                    'Elite': 0.8
                }
            },
            {
                name: 'Fake Phone Call',
                damage: 20,
                description: '"Oh wow, urgent work call!"',
                type: 'escape',
                effectiveness: {
                    'Artsy': 1.1,
                    'Corporate': 0.8,
                    'Fitness': 1.4,
                    'Culinary': 2.0,
                    'Creative': 1.6,
                    'Elite': 1.2
                }
            },
            {
                name: 'Awkward Dance',
                damage: 18,
                description: '*does weird robot dance*',
                type: 'cringe',
                effectiveness: {
                    'Artsy': 1.3,
                    'Corporate': 1.8,
                    'Fitness': 1.1,
                    'Culinary': 1.4,
                    'Creative': 2.2,
                    'Elite': 1.9
                }
            },
            {
                name: 'Talk About Joshua',
                damage: 40,
                description: '"So my friend Joshua has this really interesting story..."',
                type: 'boring',
                effectiveness: {
                    'Artsy': 1.8,
                    'Corporate': 0.5,
                    'Fitness': 2.1,
                    'Culinary': 1.9,
                    'Creative': 2.3,
                    'Elite': 2.5
                }
            },
            {
                name: 'Show Lulu Photos',
                damage: 45,
                description: '"Look how beautiful my girlfriend is!"',
                type: 'loyalty',
                effectiveness: {
                    'Artsy': 2.1,
                    'Corporate': 1.7,
                    'Fitness': 1.5,
                    'Culinary': 2.0,
                    'Creative': 2.4,
                    'Elite': 1.3
                }
            },
            {
                name: 'Sniff Them',
                damage: 28,
                description: '*leans in and takes a deep sniff* "Mmm, you smell interesting..."',
                type: 'creepy',
                effectiveness: {
                    'Artsy': 1.4,
                    'Corporate': 2.1,
                    'Fitness': 0.9,
                    'Culinary': 2.8,
                    'Creative': 1.6,
                    'Elite': 2.4
                }
            }
        ];
    }

    startBattle(opponent = null) {
        if (this.isActive) return;
        
        this.isActive = true;
        this.opponent = opponent || this.getRandomOpponent();
        this.playerHp = 100;
        this.opponentHp = 100;
        this.battleTurn = 'player';
        this.battleLog = [];
        
        // Level up opponent based on player level
        this.opponent.level = Math.max(this.opponent.level, Math.floor(this.playerLevel * 0.8));
        
        this.showBattleUI();
        this.game.sound.playSound('battle_start');
    }

    showBattleUI() {
        const battleHTML = `
            <div id="battleScreen" style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #ff6b9d, #c44569);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                padding: 10px;
                font-family: 'Press Start 2P', monospace;
                color: white;
            ">
                <!-- Battle Arena -->
                <div style="
                    flex: 1;
                    background: linear-gradient(180deg, #87CEEB 0%, #98FB98 70%, #228B22 100%);
                    border: 4px solid #333;
                    border-radius: 10px;
                    position: relative;
                    margin-bottom: 10px;
                ">
                    <!-- Opponent -->
                    <div style="
                        position: absolute;
                        top: 20px;
                        right: 30px;
                        text-align: center;
                    ">
                        <div style="font-size: 24px; margin-bottom: 5px;">
                            ${this.opponent.sprite}
                        </div>
                        <div style="font-size: 6px; margin-bottom: 3px;">
                            ${this.opponent.name}
                        </div>
                        <div style="font-size: 5px; margin-bottom: 5px;">
                            Lv.${this.opponent.level} ${this.opponent.type}
                        </div>
                        <!-- Opponent HP Bar -->
                        <div style="
                            width: 80px;
                            height: 8px;
                            background: #333;
                            border-radius: 4px;
                            overflow: hidden;
                            border: 1px solid #000;
                        ">
                            <div id="opponentHpBar" style="
                                width: ${this.opponentHp}%;
                                height: 100%;
                                background: linear-gradient(90deg, #4CAF50, #8BC34A);
                                transition: width 0.5s ease;
                            "></div>
                        </div>
                        <div style="font-size: 4px; margin-top: 2px;">
                            HP: <span id="opponentHpText">${this.opponentHp}</span>/100
                        </div>
                    </div>
                    
                    <!-- Player -->
                    <div style="
                        position: absolute;
                        bottom: 20px;
                        left: 30px;
                        text-align: center;
                    ">
                        <div style="font-size: 20px; margin-bottom: 5px;">
                            🤵
                        </div>
                        <div style="font-size: 6px; margin-bottom: 3px;">
                            Dario
                        </div>
                        <div style="font-size: 5px; margin-bottom: 5px;">
                            Lv.${this.playerLevel} Loyal BF
                        </div>
                        <!-- Player HP Bar -->
                        <div style="
                            width: 80px;
                            height: 8px;
                            background: #333;
                            border-radius: 4px;
                            overflow: hidden;
                            border: 1px solid #000;
                        ">
                            <div id="playerHpBar" style="
                                width: ${this.playerHp}%;
                                height: 100%;
                                background: linear-gradient(90deg, #2196F3, #03DAC6);
                                transition: width 0.5s ease;
                            "></div>
                        </div>
                        <div style="font-size: 4px; margin-top: 2px;">
                            HP: <span id="playerHpText">${this.playerHp}</span>/100
                        </div>
                    </div>
                </div>
                
                <!-- Battle Interface -->
                <div style="
                    background: #2c3e50;
                    border: 3px solid #34495e;
                    border-radius: 8px;
                    padding: 10px;
                    height: 140px;
                ">
                    <!-- Battle Log -->
                    <div id="battleLogContainer" style="
                        background: #1a1a1a;
                        border: 2px solid #333;
                        border-radius: 5px;
                        padding: 8px;
                        height: 60px;
                        overflow-y: auto;
                        margin-bottom: 10px;
                        font-size: 6px;
                        line-height: 1.3;
                    ">
                        <div id="battleLog">
                            Wild ${this.opponent.fullName || this.opponent.name} appeared!<br>
                            ${this.opponent.name}: "Hey there, cutie! 😘"
                        </div>
                    </div>
                    
                    <!-- Battle Actions -->
                    <div id="battleActions" style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 5px;
                    ">
                        ${this.generateMoveButtons()}
                    </div>
                </div>
                
                <!-- Battle Stats -->
                <div style="
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    font-size: 5px;
                    background: rgba(0,0,0,0.7);
                    padding: 5px;
                    border-radius: 5px;
                ">
                    EXP: ${this.experience} | Next: ${this.getExpForNextLevel()}
                </div>
            </div>
        `;
        
        // Add to screen
        const screenElement = document.querySelector('.screen');
        screenElement.insertAdjacentHTML('beforeend', battleHTML);
    }

    generateMoveButtons() {
        const moves = this.getPlayerMoves();
        const availableMoves = moves.slice(0, 4); // Show first 4 moves
        
        return availableMoves.map((move, index) => `
            <button onclick="game.romanceBattle.playerAttack(${index})" style="
                background: linear-gradient(135deg, #ff70a6, #ff5e96);
                color: white;
                border: 2px solid #e91e63;
                border-radius: 5px;
                padding: 8px 4px;
                font-family: 'Press Start 2P', monospace;
                font-size: 5px;
                cursor: pointer;
                transition: all 0.2s;
                line-height: 1.2;
            " onmouseover="this.style.background='linear-gradient(135deg, #ff5e96, #ff4586)'"
               onmouseout="this.style.background='linear-gradient(135deg, #ff70a6, #ff5e96)'">
                ${move.name}
            </button>
        `).join('');
    }

    playerAttack(moveIndex) {
        if (this.battleTurn !== 'player') return;
        
        const moves = this.getPlayerMoves();
        const move = moves[moveIndex];
        const effectiveness = move.effectiveness[this.opponent.type] || 1.0;
        const damage = Math.floor(move.damage * effectiveness * (0.8 + Math.random() * 0.4));
        
        this.opponentHp = Math.max(0, this.opponentHp - damage);
        this.updateBattleLog(`Dario used ${move.name}!`);
        this.updateBattleLog(`${move.description}`);
        
        if (effectiveness > 1.5) {
            this.updateBattleLog("It's super effective!");
        } else if (effectiveness < 0.8) {
            this.updateBattleLog("It's not very effective...");
        }
        
        this.updateBattleLog(`${this.opponent.name} took ${damage} damage!`);
        this.updateHpBars();
        
        if (this.opponentHp <= 0) {
            this.playerWins();
            return;
        }
        
        this.battleTurn = 'opponent';
        setTimeout(() => this.opponentAttack(), 2000);
    }

    opponentAttack() {
        if (this.battleTurn !== 'opponent') return;
        
        const move = this.opponent.moves[Math.floor(Math.random() * this.opponent.moves.length)];
        const damage = Math.floor(move.damage * (0.9 + Math.random() * 0.2));
        
        this.playerHp = Math.max(0, this.playerHp - damage);
        this.updateBattleLog(`${this.opponent.name} used ${move.name}!`);
        this.updateBattleLog(`${move.description}`);
        this.updateBattleLog(`Dario took ${damage} damage!`);
        this.updateHpBars();
        
        if (this.playerHp <= 0) {
            this.playerLoses();
            return;
        }
        
        this.battleTurn = 'player';
    }

    updateBattleLog(message) {
        const logElement = document.getElementById('battleLog');
        if (logElement) {
            logElement.innerHTML += `<br>${message}`;
            logElement.scrollTop = logElement.scrollHeight;
        }
    }

    updateHpBars() {
        const playerHpBar = document.getElementById('playerHpBar');
        const opponentHpBar = document.getElementById('opponentHpBar');
        const playerHpText = document.getElementById('playerHpText');
        const opponentHpText = document.getElementById('opponentHpText');
        
        if (playerHpBar) playerHpBar.style.width = `${this.playerHp}%`;
        if (opponentHpBar) opponentHpBar.style.width = `${this.opponentHp}%`;
        if (playerHpText) playerHpText.textContent = this.playerHp;
        if (opponentHpText) opponentHpText.textContent = this.opponentHp;
    }

    playerWins() {
        const expGained = Math.floor(this.opponent.level * 15 + Math.random() * 20);
        this.experience += expGained;
        
        this.updateBattleLog(`${this.opponent.name} fainted!`);
        this.updateBattleLog(`Dario gained ${expGained} EXP!`);
        
        // Add hearts for winning
        this.game.save.currency.hearts += 3;
        
        // Check for level up
        if (this.experience >= this.getExpForNextLevel()) {
            this.playerLevel++;
            this.experience = 0;
            this.updateBattleLog(`Dario leveled up! Now level ${this.playerLevel}!`);
            this.game.ui.showNotification(`Level Up! You're now level ${this.playerLevel}! 🎉`);
        }
        
        setTimeout(() => {
            this.endBattle();
            this.game.ui.showNotification(`You successfully avoided temptation! +3 hearts 💖`);
        }, 3000);
    }

    playerLoses() {
        this.updateBattleLog(`Dario fainted!`);
        this.updateBattleLog(`${this.opponent.name}: "Call me sometime! 😘"`);
        
        // Lose some hearts for losing
        this.game.save.currency.hearts = Math.max(0, this.game.save.currency.hearts - 2);
        
        setTimeout(() => {
            this.endBattle();
            this.game.ui.showNotification(`You got distracted... -2 hearts 💔`);
        }, 3000);
    }

    endBattle() {
        const battleScreen = document.getElementById('battleScreen');
        if (battleScreen) {
            battleScreen.remove();
        }
        
        this.isActive = false;
        this.opponent = null;
        this.playerHp = 100;
        this.opponentHp = 100;
        this.battleTurn = 'player';
        
        // Save progress
        this.game.save.romanceBattle = {
            level: this.playerLevel,
            experience: this.experience
        };
        this.game.saveManager.saveNow(this.game.save);
    }

    getExpForNextLevel() {
        return this.playerLevel * 100;
    }

    // Load player stats from save
    loadPlayerStats() {
        if (this.game.save.romanceBattle) {
            this.playerLevel = this.game.save.romanceBattle.level || 1;
            this.experience = this.game.save.romanceBattle.experience || 0;
        }
    }

    // Trigger random encounter (called from map movement)
    triggerRandomEncounter() {
        // 15% chance of encounter when moving
        if (Math.random() < 0.15) {
            const encounter = this.getRandomOpponent();
            setTimeout(() => {
                this.startBattle(encounter);
            }, 500);
            return true;
        }
        return false;
    }
}