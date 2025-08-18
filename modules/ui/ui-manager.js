// ============================================
// UI Manager Module
// ============================================

export class UIManager {
    constructor(game) {
        this.game = game;
        this.notificationQueue = [];
        this.currentNotification = null;
        this.notificationTimer = 0;
    }

    showNotification(message, duration = 2000) {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.classList.add('show');
            
            clearTimeout(this.notificationTimer);
            this.notificationTimer = setTimeout(() => {
                notification.classList.remove('show');
            }, duration);
        }
    }

    updateStatsBar(stats) {
        const hungerBar = document.getElementById('hungerBar');
        const energyBar = document.getElementById('energyBar');
        const happinessBar = document.getElementById('happinessBar');
        
        if (hungerBar) hungerBar.style.width = `${stats.hunger}%`;
        if (energyBar) energyBar.style.width = `${stats.energy}%`;
        if (happinessBar) happinessBar.style.width = `${stats.happiness}%`;
    }

    updateCurrency(currency, tokens) {
        const heartCount = document.getElementById('heartCount');
        const tokenCount = document.getElementById('tokenCount');
        
        if (heartCount) heartCount.textContent = currency.hearts;
        if (tokenCount) tokenCount.textContent = tokens;
    }

    showModal(title, text, buttons = [{ text: 'OK', action: () => this.closeModal() }]) {
        const modal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalText = document.getElementById('modalText');
        const modalButtons = document.getElementById('modalButtons');
        
        if (modal && modalTitle && modalText && modalButtons) {
            modalTitle.textContent = title;
            modalText.textContent = text;
            
            // Clear existing buttons
            modalButtons.innerHTML = '';
            
            // Add new buttons
            buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = 'modal-button';
                btn.textContent = button.text;
                btn.onclick = button.action;
                modalButtons.appendChild(btn);
            });
            
            modal.classList.add('show');
        }
    }

    closeModal() {
        const modal = document.getElementById('gameModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    toggleMenu() {
        const menuOverlay = document.getElementById('menuOverlay');
        if (menuOverlay) {
            menuOverlay.classList.toggle('show');
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    updateLoadingProgress(progress, text) {
        const loadingFill = document.getElementById('loadingFill');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingFill) loadingFill.style.width = `${progress}%`;
        if (loadingText) loadingText.textContent = text;
    }

    showRingEvent() {
        const ringEvent = document.getElementById('ringEvent');
        if (ringEvent) {
            ringEvent.classList.add('show');
            
            // Create confetti
            for (let i = 0; i < 30; i++) {
                setTimeout(() => this.createConfetti(), i * 100);
            }
        }
    }

    hideRingEvent() {
        const ringEvent = document.getElementById('ringEvent');
        if (ringEvent) {
            ringEvent.classList.remove('show');
        }
    }

    createConfetti() {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = ['#ff70a6', '#ffd700', '#ff5e96', '#00ff00'][Math.floor(Math.random() * 4)];
        confetti.style.animationDelay = Math.random() + 's';
        
        const container = document.querySelector('.screen');
        if (container) {
            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    createHeartParticle(x, y) {
        const heart = document.createElement('div');
        heart.textContent = '💖';
        heart.style.position = 'absolute';
        heart.style.left = x + 'px';
        heart.style.top = y + 'px';
        heart.style.fontSize = '20px';
        heart.style.pointerEvents = 'none';
        heart.style.animation = 'float-up 2s ease-out forwards';
        heart.style.zIndex = '1000';
        
        const container = document.querySelector('.screen');
        if (container) {
            container.appendChild(heart);
            setTimeout(() => heart.remove(), 2000);
        }
    }
}