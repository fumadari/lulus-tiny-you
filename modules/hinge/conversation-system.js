// ============================================
// Hinge Conversation System Module
// ============================================

export class ConversationSystem {
    constructor(game) {
        this.game = game;
        this.conversations = this.getConversations();
    }

    getConversations() {
        return {
            french_lulu: {
                name: 'Lulu',
                questions: [
                    {
                        text: "Bonjour! Where should we go for our first date?",
                        options: [
                            { text: "McDonald's", correct: false, response: "Non non! I prefer something more... français 😅" },
                            { text: "A cozy French café", correct: true, response: "Parfait! You understand my heart! 💕" },
                            { text: "Taco Bell", correct: false, response: "Hmm... maybe we should get to know each other better first 😬" }
                        ]
                    },
                    {
                        text: "What's your favorite thing about cats?",
                        options: [
                            { text: "They're independent like me", correct: false, response: "Cats need love too! 😿" },
                            { text: "Their cute little paws and purrs", correct: true, response: "Yes! And when they curl up on your lap! 🐱💕" },
                            { text: "I'm more of a dog person", correct: false, response: "Oh... well... dogs are okay I guess 😐" }
                        ]
                    }
                ]
            },
            foodie_lulu: {
                name: 'Foodie Lulu',
                questions: [
                    {
                        text: "What's the best pizza place in NYC?",
                        options: [
                            { text: "Pizza from Mo", correct: true, response: "YESSS! You get it! Mo's is life! 🍕✨" },
                            { text: "Joe's Pizza", correct: false, response: "Joe's is good but... have you tried Mo's? 🤔" },
                            { text: "Domino's", correct: false, response: "Oh honey... we need to expand your pizza horizons 😅" }
                        ]
                    },
                    {
                        text: "Where do you do your grocery shopping?",
                        options: [
                            { text: "Whole Foods", correct: false, response: "Too expensive! I'm all about those deals! 💸" },
                            { text: "Trader Joe's", correct: true, response: "YES! Two Buck Chuck and everything bagel seasoning! 🛒💕" },
                            { text: "7-Eleven", correct: false, response: "That's... not really grocery shopping? 😬" }
                        ]
                    }
                ]
            },
            travel_lulu: {
                name: 'Travel Lulu',
                questions: [
                    {
                        text: "What's your ideal vacation?",
                        options: [
                            { text: "Exploring new cities with my pets", correct: true, response: "Adventure with furry companions! Perfect! 🐾✈️" },
                            { text: "Staying home and binge-watching", correct: false, response: "But there's so much world to see! 🌍" },
                            { text: "All-inclusive resort", correct: false, response: "That's nice but I love discovering hidden gems! 🗺️" }
                        ]
                    },
                    {
                        text: "Favorite TV show to watch after traveling?",
                        options: [
                            { text: "The Office", correct: false, response: "Good show but... 🤔" },
                            { text: "The Simpsons", correct: true, response: "D'oh! A person of culture! I love Homer! 💛" },
                            { text: "Friends", correct: false, response: "Classic but not my favorite 😊" }
                        ]
                    }
                ]
            },
            shopping_lulu: {
                name: 'Shopping Lulu',
                questions: [
                    {
                        text: "Where do you find the best deals?",
                        options: [
                            { text: "Online Amazon", correct: false, response: "Online is okay but you miss the thrill of the hunt! 📦" },
                            { text: "TJ Maxx treasure hunting", correct: true, response: "YES! The thrill of finding designer for less! 💎🛍️" },
                            { text: "Expensive boutiques", correct: false, response: "Why pay full price when you can find treasures? 💸" }
                        ]
                    },
                    {
                        text: "How would you describe my style?",
                        options: [
                            { text: "Stylish and fashionable", correct: true, response: "Thank you! I work hard on my look! 👗✨" },
                            { text: "A bit chubby but well-dressed", correct: false, response: "That's incredibly hurtful and inappropriate to say!" },
                            { text: "Trendy and confident", correct: true, response: "Confidence is the best accessory! 💃💕" }
                        ]
                    }
                ]
            },
            simpson_lulu: {
                name: 'Simpson Lulu',
                questions: [
                    {
                        text: "Complete this quote: 'D'oh!'",
                        options: [
                            { text: "That's what I say when I mess up", correct: false, response: "Close! But it's Homer's thing! 🍩" },
                            { text: "Homer Simpson's catchphrase!", correct: true, response: "Excellent! *Mr. Burns voice* You know your Simpsons! 💛" },
                            { text: "I don't know", correct: false, response: "Time for a Simpsons marathon! 📺" }
                        ]
                    },
                    {
                        text: "What pairs best with watching Simpsons?",
                        options: [
                            { text: "Beer like Homer", correct: false, response: "Duff is Homer's thing! I prefer... 🍺" },
                            { text: "Fresh tangerine juice", correct: true, response: "Mmm... tangerine juice... *Homer drool* 🍊💕" },
                            { text: "Donuts", correct: false, response: "Donuts are good but tangerine juice is better! 🍩" }
                        ]
                    }
                ]
            },
            rondoudou: {
                name: 'Rondoudou',
                questions: [
                    {
                        text: "Rondoudou rondoudou? 🎵",
                        options: [
                            { text: "Everyone dances!", correct: false, response: "Rondoudou rondoudou! 😴" },
                            { text: "Everyone falls asleep", correct: true, response: "Rondoudou rondoudou! 🌙💤" },
                            { text: "Everyone runs away", correct: false, response: "Rondoudou... 😢" }
                        ]
                    },
                    {
                        text: "Rondoudou rondoudou rondoudou?",
                        options: [
                            { text: "A microphone", correct: false, response: "Rondoudou! 🎤❌" },
                            { text: "My magical voice", correct: true, response: "Rondoudou rondoudou! ✨🎵" },
                            { text: "A guitar", correct: false, response: "Rondoudou rondoudou! 🎸❌" }
                        ]
                    }
                ]
            }
        };
    }

    startConversation(profileId) {
        const conversation = this.conversations[profileId];
        if (!conversation) {
            console.error(`No conversation found for profile: ${profileId}`);
            return;
        }

        // Initialize conversation state
        if (!this.game.save.hinge.conversations) {
            this.game.save.hinge.conversations = {};
        }
        
        if (!this.game.save.hinge.conversations[profileId]) {
            this.game.save.hinge.conversations[profileId] = {
                currentQuestion: 0,
                correctAnswers: 0,
                completed: false
            };
        }

        const state = this.game.save.hinge.conversations[profileId];
        
        if (state.completed) {
            this.showCompletedConversation(conversation, state);
            return;
        }

        if (state.currentQuestion >= conversation.questions.length) {
            this.completeConversation(profileId, conversation, state);
            return;
        }

        this.showQuestion(profileId, conversation, state);
    }

    showQuestion(profileId, conversation, state) {
        const question = conversation.questions[state.currentQuestion];
        
        const buttons = question.options.map((option, index) => ({
            text: option.text,
            action: () => this.answerQuestion(profileId, conversation, state, index)
        }));

        buttons.push({
            text: 'Maybe later...',
            action: () => this.game.ui.closeModal()
        });

        this.game.ui.showModal(
            `💬 Chatting with ${conversation.name}`,
            `<div style="text-align: center; padding: 10px;">
                <div style="font-size: 9px; margin-bottom: 15px; color: #666;">
                    Question ${state.currentQuestion + 1} of ${conversation.questions.length}
                </div>
                <div style="font-size: 10px; margin-bottom: 15px; line-height: 1.4;">
                    "${question.text}"
                </div>
                <div style="font-size: 8px; color: #888;">
                    Choose your response carefully! 💕
                </div>
            </div>`,
            buttons
        );
    }

    answerQuestion(profileId, conversation, state, optionIndex) {
        const question = conversation.questions[state.currentQuestion];
        const option = question.options[optionIndex];
        
        if (option.correct) {
            state.correctAnswers++;
            this.game.save.currency.hearts += 2;
            this.game.ui.showNotification(`Great answer! ${conversation.name} likes that! 💕 +2 hearts`);
        } else {
            // Wrong answer - lose hearts
            this.game.save.currency.hearts = Math.max(0, this.game.save.currency.hearts - 2);
            
            // Special penalty for calling someone chubby
            let heartPenalty = -2;
            if (option.text.toLowerCase().includes('chubby') || option.text.toLowerCase().includes('fat')) {
                this.game.save.currency.hearts = Math.max(0, this.game.save.currency.hearts - 3); // Additional penalty
                heartPenalty = -5;
                this.game.ui.showNotification(`${option.response} That's really rude! 😡 ${heartPenalty} hearts`);
            } else {
                this.game.ui.showNotification(`${option.response} 😅 -2 hearts`);
            }
        }

        state.currentQuestion++;
        
        // Save progress
        this.game.saveManager.saveNow(this.game.save);

        setTimeout(() => {
            this.game.ui.closeModal();
            if (state.currentQuestion >= conversation.questions.length) {
                this.completeConversation(profileId, conversation, state);
            } else {
                this.startConversation(profileId); // Continue to next question
            }
        }, 2000);
    }

    completeConversation(profileId, conversation, state) {
        state.completed = true;
        
        const successRate = state.correctAnswers / conversation.questions.length;
        let outcome;
        let bonusHearts = 0;

        if (successRate >= 0.8) {
            outcome = `Amazing! ${conversation.name} is totally smitten! 💖✨`;
            bonusHearts = 10;
        } else if (successRate >= 0.5) {
            outcome = `Nice! ${conversation.name} wants to see you again! 😊💕`;
            bonusHearts = 5;
        } else {
            outcome = `${conversation.name} thinks you're sweet but... maybe as friends? 😅`;
            bonusHearts = 1;
        }

        this.game.save.currency.hearts += bonusHearts;
        this.game.saveManager.saveNow(this.game.save);

        this.game.ui.showModal(
            `💕 Date Complete!`,
            `<div style="text-align: center; padding: 10px;">
                <div style="font-size: 10px; margin-bottom: 15px;">
                    ${outcome}
                </div>
                <div style="font-size: 8px; color: #666; margin-bottom: 10px;">
                    You got ${state.correctAnswers}/${conversation.questions.length} answers right!
                </div>
                <div style="font-size: 9px; color: #ff70a6;">
                    +${bonusHearts} bonus hearts! 💖
                </div>
            </div>`,
            [{ text: 'Sweet! 😊', action: () => this.game.ui.closeModal() }]
        );
    }

    showCompletedConversation(conversation, state) {
        const successRate = state.correctAnswers / conversation.questions.length;
        let message;

        if (successRate >= 0.8) {
            message = `${conversation.name} still thinks you're amazing! 💖`;
        } else if (successRate >= 0.5) {
            message = `${conversation.name} enjoyed your last chat! 😊`;
        } else {
            message = `${conversation.name} is happy to be friends! 👋`;
        }

        this.game.ui.showModal(
            `💬 ${conversation.name}`,
            `<div style="text-align: center; padding: 10px;">
                <div style="font-size: 10px; margin-bottom: 15px;">
                    ${message}
                </div>
                <div style="font-size: 8px; color: #666;">
                    You've already completed this conversation!<br>
                    Try matching with someone else! 💕
                </div>
            </div>`,
            [{ text: 'OK', action: () => this.game.ui.closeModal() }]
        );
    }

    resetAllConversations() {
        if (this.game.save.hinge.conversations) {
            this.game.save.hinge.conversations = {};
        }
        this.game.saveManager.saveNow(this.game.save);
        this.game.ui.showNotification("All conversations reset! Fresh start! 💕");
    }
}