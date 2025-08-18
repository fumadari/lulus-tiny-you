// ============================================
// Game Constants Module
// ============================================

export const CANVAS_WIDTH = 360;
export const CANVAS_HEIGHT = 420;
export const TILE_SIZE = 24;

// Game states
export const GAME_STATES = {
    MAIN: 'main',
    MINIGAME: 'minigame',
    MAP: 'map',
    SELFIE: 'selfie',
    MENU: 'menu',
    MODAL: 'modal'
};

// Stats configuration
export const STATS_CONFIG = {
    MAX_HUNGER: 100,
    MAX_ENERGY: 100,
    MAX_HAPPINESS: 100,
    DECAY_RATES: {
        HUNGER: 0.3,
        ENERGY: 0.2,
        HAPPINESS: 0.25
    },
    INCREASE_AMOUNTS: {
        FEED: 20,
        PET: 15,
        PLAY: 25
    }
};

// Animation timing
export const ANIMATION_CONFIG = {
    FRAME_DURATION: 500,
    PARTICLE_LIFETIME: 1000,
    NOTIFICATION_DURATION: 2000,
    TRANSITION_DURATION: 300
};

// Token requirements
export const TOKEN_REQUIREMENTS = {
    RING_COST: 5,
    MAX_TOKENS: 5,
    TOKEN_SOURCES: [
        'dailyStreak',
        'feedFrenzyMaster',
        'petRhythmMaster',
        'memoryMaster',
        'triviaMaster'
    ]
};

// Minigame configurations
export const MINIGAME_CONFIG = {
    FEED_FRENZY: {
        DURATION: 30000,
        SPAWN_RATE: 1000,
        ITEM_SPEED: 2
    },
    PET_RHYTHM: {
        DURATION: 45000,
        BEAT_INTERVAL: 600,
        PERFECT_WINDOW: 100
    },
    MEMORY: {
        GRID_SIZE: 4,
        PEEK_TIME: 3000,
        MAX_TIME: 60000
    },
    TRIVIA: {
        QUESTIONS_PER_ROUND: 10,
        TIME_PER_QUESTION: 15000
    },
    DANCE_BATTLE: {
        ROUNDS: 5,
        SHOW_TIME: 2000,
        INPUT_TIME: 3000
    }
};

// Pet moods and states
export const PET_STATES = {
    IDLE: 'idle',
    HAPPY: 'happy',
    SAD: 'sad',
    SLEEP: 'sleep',
    EAT: 'eat',
    PLAY: 'play',
    SICK: 'sick',
    DANCE: 'dance'
};

// Sound effects list
export const SOUND_EFFECTS = {
    PET: 'pet',
    FEED: 'feed',
    HAPPY: 'happy',
    SAD: 'sad',
    CLICK: 'click',
    SUCCESS: 'success',
    FAIL: 'fail',
    LEVELUP: 'levelup',
    RING: 'ring'
};