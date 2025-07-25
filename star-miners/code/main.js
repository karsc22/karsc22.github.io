const canvas = document.getElementById('solarSystem');
const ctx = canvas.getContext('2d');

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// Camera and minimap settings
const camera = { x: 0, y: 0, zoom: 3 };
const minimap = { x: canvas.width - 200, y: canvas.height - 200, width: 180, height: 180 };

const planets = [
    { name: 'Mercury', distance: 78, size: 3, speed: 0.004, angle: 0, color: '#8C7853' },
    { name: 'Venus', distance: 104, size: 4, speed: 0.003, angle: 0, color: '#FFC649' },
    { name: 'Earth', distance: 130, size: 5, speed: 0.002, angle: 0, color: '#4A90E2' },
    { name: 'Mars', distance: 169, size: 4, speed: 0.0016, angle: 0, color: '#CD5C5C' },
    { name: 'Jupiter', distance: 280, size: 15, speed: 0.001, angle: 0, color: '#D8CA9D' },
    { name: 'Saturn', distance: 340, size: 12, speed: 0.0008, angle: 0, color: '#FAD5A5' },
    { name: 'Uranus', distance: 400, size: 8, speed: 0.0006, angle: 0, color: '#4FD0E3' },
    { name: 'Neptune', distance: 450, size: 8, speed: 0.0004, angle: 0, color: '#4B70DD' }
];

const spaceship = {
    x: centerX + 120,
    y: centerY,
    vx: 0,
    vy: 0,
    fuel: 100,
    maxFuel: 100,
    size: 3,
    angle: 0
};

function getUpgradedMaxFuel() {
    return 100 + (upgrades.fuelTank * 50);
}

function getUpgradedFuelConsumption() {
    return 0.2 * Math.pow(0.8, upgrades.fuelEfficiency);
}

function getUpgradedMiningTime() {
    return 3 - (upgrades.miningSpeed * 0.5);
}

function getUpgradedThrust() {
    return 0.005 * (1 + upgrades.thrustPower * 0.5);
}

function getUpgradedMiningRange() {
    return 10 + upgrades.miningRange * 5;
}
function getUpgradedMultiMine() {
    return 1 + upgrades.multiMine;
}

function getUpgradeCost(upgradeType) {
    if (debugMode) return 0;
    
    // Check if upgrade is at maximum level
    if (upgrades[upgradeType] >= 5) {
        return 0; // No cost for maxed upgrades
    }
    
    const baseCosts = {
        fuelTank: 200,
        fuelEfficiency: 300,
        miningSpeed: 500,
        thrustPower: 400,
        miningRange: 350,
        multiMine: 800
    };
    return baseCosts[upgradeType] * Math.pow(2, upgrades[upgradeType]);
}

let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;
let refuelingPlanet = null;
let thrustParticles = [];

let miningTarget = [];      // Array of asteroid indices being mined
let miningProgress = [];    // Array of progress for each mining target
let miningFeedbacks = [];   // Array of feedback objects {x, y, time}
let money = 100;
let unprocessedAsteroids = 0;
let showUpgradeMenu = false;
let upgradeMenuAnimation = 0; // 0-1, controls slide animation
let upgradeMenuTarget = 0; // target animation value
let upgradeButtonArea = { x: 20, y: 0, width: 120, height: 40 }; // will update y in init

// Challenge mode variables
let gameMode = 'normal'; // 'normal', 'time-trial', 'fuel-endurance'
let showChallengeMenu = false;
let challengeMenuAnimation = 0;
let challengeMenuTarget = 0;
let challengeButtonArea = { x: 20, y: 0, width: 120, height: 40 };
let muteButtonArea = { x: 0, y: 20, width: 60, height: 30 }; // will update x in init
let challengeTimer = 0;
let challengeScore = 0;
let challengeActive = false;
let challengeStartFuel = 0;
let countdownActive = false;
let countdownTimer = 0;
let countdownText = '';

// Auto-save system
let autoSaveTimer = 60; // Save every 60 seconds
let isRefueling = false; // Track refueling state for auto-save

// Achievement system
let achievements = {};
let achievementQueue = []; // Queue for displaying achievement banners
let showAchievementMenu = false;
let achievementMenuAnimation = 0;
let achievementMenuTarget = 0;
let achievementButtonArea = { x: 20, y: 0, width: 120, height: 40 };

// Options menu system
let showOptionsMenu = false;
let optionsMenuAnimation = 0;
let optionsMenuTarget = 0;
let optionsButtonArea = { x: 20, y: 0, width: 120, height: 40 };

// Options settings
let gameOptions = {
    soundEnabled: true,
    showPlanetIndicators: true,
    showMinimap: true
};

// Hire help menu system
let showHireHelpMenu = false;
let hireHelpMenuAnimation = 0;
let hireHelpMenuTarget = 0;
let hireHelpButtonArea = { x: 20, y: 0, width: 120, height: 40 };

// Helper system - now supports multiple ships
let helpers = {
    asteroidCreator: {
        ships: [], // array of active creator ships
        maxTime: 1200, // 20 minutes in seconds
        cost: 1000
    },
    asteroidMiner: {
        ships: [], // array of active miner ships
        maxTime: 300, // 5 minutes in seconds
        cost: 2000
    },
    rescueHelper: {
        hired: false,
        cost: 0 // free
    }
};

// Asteroid spawning system for moving asteroids from planets to belt
let spawnedAsteroids = [];

// Helper ship creation functions
function createAsteroidCreatorShip() {
    const earth = planets.find(p => p.name === 'Earth');
    const earthX = centerX + Math.cos(earth.angle) * earth.distance;
    const earthY = centerY + Math.sin(earth.angle) * earth.distance;
    
    return {
        x: earthX,
        y: earthY,
        vx: 0,
        vy: 0,
        angle: 0,
        size: 5,
        targetPlanet: null,
        state: 'traveling', // 'traveling', 'mining', 'returning'
        miningProgress: 0,
        miningTime: 5, // seconds to mine a planet
        timeLeft: helpers.asteroidCreator.maxTime,
        planetMiningCount: 0, // how many times mined current planet
        maxPlanetMining: 5 // mine each planet 5 times before switching
    };
}

function createAsteroidMinerShip() {
    const earth = planets.find(p => p.name === 'Earth');
    const earthX = centerX + Math.cos(earth.angle) * earth.distance;
    const earthY = centerY + Math.sin(earth.angle) * earth.distance;
    
    return {
        x: earthX,
        y: earthY,
        vx: 0,
        vy: 0,
        angle: 0,
        size: 4,
        targetAsteroid: null,
        state: 'seeking', // 'seeking', 'mining', 'returning'
        miningProgress: 0,
        miningTime: 3, // seconds to mine an asteroid
        timeLeft: helpers.asteroidMiner.maxTime
    };
}

function createSpawnedAsteroid(planetX, planetY) {
    const size = 2 + Math.random() * 4;
    
    // Pick random color palette
    const colorPalettes = [
        { light: '#888888', dark: '#444444', outline: '#222222', detail: '#666666' },
        { light: '#AA7744', dark: '#664422', outline: '#332211', detail: '#885533' },
        { light: '#AA5555', dark: '#663333', outline: '#331111', detail: '#884444' },
        { light: '#6699CC', dark: '#335577', outline: '#113355', detail: '#5588BB' }
    ];
    const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
    
    // Generate crater data
    const craterCount = Math.floor(Math.random() * 4) + 1;
    const craterData = [];
    for (let c = 0; c < craterCount; c++) {
        craterData.push({
            x: (Math.random() - 0.5) * size * 1.2,
            y: (Math.random() - 0.5) * size * 1.2,
            size: Math.random() * size * 0.3 + 0.5
        });
    }
    
    // Generate surface details
    let cracks = null;
    if (Math.random() < 0.3) {
        const crackCount = Math.floor(Math.random() * 3) + 1;
        cracks = [];
        for (let cr = 0; cr < crackCount; cr++) {
            const crackAngle = Math.random() * Math.PI * 2;
            const length = size * (0.4 + Math.random() * 0.6);
            const startX = (Math.random() - 0.5) * size * 0.8;
            const startY = (Math.random() - 0.5) * size * 0.8;
            cracks.push({
                x1: startX,
                y1: startY,
                x2: startX + Math.cos(crackAngle) * length,
                y2: startY + Math.sin(crackAngle) * length
            });
        }
    }
    
    let highlights = null;
    let highlightColor = '#FFD700';
    if (Math.random() < 0.2) {
        const highlightCount = Math.floor(Math.random() * 2) + 1;
        highlights = [];
        const highlightColors = ['#FFD700', '#66FF66', '#FF6666', '#6666FF'];
        highlightColor = highlightColors[Math.floor(Math.random() * highlightColors.length)];
        
        for (let h = 0; h < highlightCount; h++) {
            const hlAngle = Math.random() * Math.PI * 2;
            const length = size * (0.3 + Math.random() * 0.4);
            const startX = (Math.random() - 0.5) * size * 0.6;
            const startY = (Math.random() - 0.5) * size * 0.6;
            highlights.push({
                x1: startX,
                y1: startY,
                x2: startX + Math.cos(hlAngle) * length,
                y2: startY + Math.sin(hlAngle) * length
            });
        }
    }
    
    // Choose random target location in asteroid belt
    const asteroidBeltInner = 200;
    const asteroidBeltOuter = 260;
    const targetDistance = asteroidBeltInner + Math.random() * (asteroidBeltOuter - asteroidBeltInner);
    const targetAngle = Math.random() * Math.PI * 2;
    const targetX = centerX + Math.cos(targetAngle) * targetDistance;
    const targetY = centerY + Math.sin(targetAngle) * targetDistance;
    
    return {
        // Current position (starts at planet)
        x: planetX,
        y: planetY,
        // Target position (in asteroid belt)
        targetX: targetX,
        targetY: targetY,
        // Movement properties
        vx: 0,
        vy: 0,
        speed: 60, // pixels per second
        // Asteroid properties (will be used when it reaches the belt)
        size: size,
        lightColor: palette.light,
        darkColor: palette.dark,
        outlineColor: palette.outline,
        detailColor: palette.detail,
        craters: craterCount,
        craterData: craterData,
        cracks: cracks,
        highlights: highlights,
        highlightColor: highlightColor,
        shape: null,
        rotation: 0,
        rotationSpeed: 0,
        // Final orbital properties
        finalDistance: targetDistance,
        finalAngle: targetAngle,
        finalSpeed: 0.0005 + Math.random() * 0.001
    };
}

// Rescue system
let needsRescue = false;
let rescueButtonArea = { x: 0, y: 0, width: 150, height: 50 };
let rescueShip = null;
let rescueState = 'none'; // 'none', 'dispatched', 'approaching', 'connected', 'towing', 'completed'
let towLine = null;

// Achievement definitions
const ACHIEVEMENTS = {
    'first_asteroid': {
        name: 'Space Miner',
        description: 'Mine your first asteroid',
        icon: '⛏️',
        condition: () => asteroidsMined >= 1
    },
    'asteroid_10': {
        name: 'Asteroid Hunter',
        description: 'Mine 10 asteroids',
        icon: '🚀',
        condition: () => asteroidsMined >= 10
    },
    'asteroid_100': {
        name: 'Mining Expert',
        description: 'Mine 100 asteroids',
        icon: '💎',
        condition: () => asteroidsMined >= 100
    },
    'asteroid_1000': {
        name: 'Asteroid Master',
        description: 'Mine 1000 asteroids',
        icon: '👑',
        condition: () => asteroidsMined >= 1000
    },
    'money_1000': {
        name: 'Wealthy',
        description: 'Accumulate $1,000',
        icon: '💰',
        condition: () => money >= 1000
    },
    'money_10000': {
        name: 'Rich',
        description: 'Accumulate $10,000',
        icon: '💸',
        condition: () => money >= 10000
    },
    'money_100000': {
        name: 'Millionaire',
        description: 'Accumulate $100,000',
        icon: '🏦',
        condition: () => money >= 100000
    },
    'time_trial_10': {
        name: 'Speed Miner',
        description: 'Mine 10 asteroids in Time Trial',
        icon: '⏱️',
        condition: () => (achievements.time_trial_best || 0) >= 10
    },
    'time_trial_25': {
        name: 'Time Master',
        description: 'Mine 25 asteroids in Time Trial',
        icon: '⚡',
        condition: () => (achievements.time_trial_best || 0) >= 25
    },
    'fuel_endurance_10': {
        name: 'Fuel Efficient',
        description: 'Mine 10 asteroids in Fuel Endurance',
        icon: '⛽',
        condition: () => (achievements.fuel_endurance_best || 0) >= 10
    },
    'fuel_endurance_25': {
        name: 'Endurance Master',
        description: 'Mine 25 asteroids in Fuel Endurance',
        icon: '🏃',
        condition: () => (achievements.fuel_endurance_best || 0) >= 25
    },
    'all_upgrades': {
        name: 'Ship Master',
        description: 'Purchase all upgrade types',
        icon: '🛸',
        condition: () => Object.values(upgrades).every(level => level > 0)
    },
    'upgrade_maxed': {
        name: 'Perfectionist',
        description: 'Max out any upgrade (Level 10)',
        icon: '⭐',
        condition: () => Object.values(upgrades).some(level => level >= 10)
    }
};

function saveGameData() {
    const saveData = {
        money: money,
        upgrades: upgrades,
        asteroidsMined: asteroidsMined,
        unprocessedAsteroids: unprocessedAsteroids,
        achievementBests: {
            time_trial_best: achievements.time_trial_best || 0,
            fuel_endurance_best: achievements.fuel_endurance_best || 0
        },
        saveVersion: 1,
        lastSaved: Date.now()
    };
    
    try {
        localStorage.setItem('starMiners_gameData', JSON.stringify(saveData));
        console.log('Game saved successfully');
    } catch (e) {
        console.warn('Failed to save game data:', e);
    }
}

function loadGameData() {
    try {
        const savedData = localStorage.getItem('starMiners_gameData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Validate save data
            if (data.saveVersion === 1 && typeof data.money === 'number' && data.upgrades) {
                money = data.money;
                upgrades = { ...upgrades, ...data.upgrades }; // Merge with defaults
                asteroidsMined = data.asteroidsMined || 0;
                unprocessedAsteroids = data.unprocessedAsteroids || 0;
                
                // Load achievement bests
                if (data.achievementBests) {
                    achievements.time_trial_best = data.achievementBests.time_trial_best || 0;
                    achievements.fuel_endurance_best = data.achievementBests.fuel_endurance_best || 0;
                }
                
                // Update spaceship max fuel based on loaded upgrades
                spaceship.maxFuel = getUpgradedMaxFuel();
                
                console.log('Game loaded successfully');
                return true;
            }
        }
    } catch (e) {
        console.warn('Failed to load game data:', e);
    }
    return false;
}

function checkAchievements() {
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
        if (!achievements[id] && achievement.condition()) {
            unlockAchievement(id);
        }
    }
}

function unlockAchievement(id) {
    if (achievements[id]) return; // Already unlocked
    
    achievements[id] = {
        unlocked: true,
        timestamp: Date.now()
    };
    
    // Add to queue for display
    achievementQueue.push({
        id: id,
        achievement: ACHIEVEMENTS[id],
        displayTime: 4, // Show for 4 seconds
        animationTime: 0
    });
    
    // Play achievement sound
    playAchievementSound();
    
    // Save achievements
    saveAchievements();
    
    console.log(`Achievement unlocked: ${ACHIEVEMENTS[id].name}`);
}

function updateAchievementStats() {
    // Update challenge bests for achievement checking
    if (gameMode === 'time-trial' && challengeActive) {
        achievements.time_trial_best = Math.max(achievements.time_trial_best || 0, challengeScore);
    } else if (gameMode === 'fuel-endurance' && challengeActive) {
        achievements.fuel_endurance_best = Math.max(achievements.fuel_endurance_best || 0, challengeScore);
    }
}

function saveAchievements() {
    try {
        localStorage.setItem('starMiners_achievements', JSON.stringify(achievements));
    } catch (e) {
        console.warn('Failed to save achievements:', e);
    }
}

function saveOptions() {
    try {
        localStorage.setItem('starMiners_options', JSON.stringify(gameOptions));
        console.log('Options saved successfully');
    } catch (e) {
        console.warn('Failed to save options:', e);
    }
}

function loadOptions() {
    try {
        const saved = localStorage.getItem('starMiners_options');
        if (saved) {
            const loadedOptions = JSON.parse(saved);
            gameOptions = { ...gameOptions, ...loadedOptions }; // Merge with defaults
            
            // Apply loaded options
            audioEnabled = gameOptions.soundEnabled;
            console.log('Options loaded successfully');
        }
    } catch (e) {
        console.warn('Failed to load options:', e);
    }
}

function loadAchievements() {
    try {
        const saved = localStorage.getItem('starMiners_achievements');
        if (saved) {
            achievements = JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Failed to load achievements:', e);
        achievements = {};
    }
}

function checkRescueNeed() {
    // Check if rescue is needed (out of fuel and not in challenge mode)
    if (gameMode === 'normal' && spaceship.fuel <= 0 && !needsRescue && rescueState === 'none') {
        if (helpers.rescueHelper.hired) {
            // Automatically start rescue if helper is hired
            startRescue();
        } else {
            // Show rescue button as before if helper not hired
            needsRescue = true;
            rescueButtonArea.x = canvas.width / 2 - rescueButtonArea.width / 2;
            rescueButtonArea.y = canvas.height / 2 + 100;
        }
    }
}

function startRescue() {
    if (rescueState !== 'none') return;
    
    needsRescue = false;
    rescueState = 'dispatched';
    
    // Find Earth position
    const earth = planets.find(p => p.name === 'Earth');
    const earthX = centerX + Math.cos(earth.angle) * earth.distance;
    const earthY = centerY + Math.sin(earth.angle) * earth.distance;
    
    // Create rescue ship at Earth
    rescueShip = {
        x: earthX,
        y: earthY,
        vx: 0,
        vy: 0,
        angle: 0,
        size: 4,
        state: 'approaching',
        targetX: spaceship.x,
        targetY: spaceship.y,
        approachDistance: 0,
        towDistance: 0
    };
    
    playRescueSound();
    rescueState = 'approaching';
}

function updateRescueShip(deltaTime) {
    if (!rescueShip) return;
    
    if (rescueState === 'approaching') {
        // Move rescue ship toward player
        const dx = spaceship.x - rescueShip.x;
        const dy = spaceship.y - rescueShip.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 20) {
            const speed = 200 * deltaTime; // Faster than normal ship
            rescueShip.angle = Math.atan2(dx, -dy);
            rescueShip.vx = (dx / distance) * speed;
            rescueShip.vy = (dy / distance) * speed;
            rescueShip.x += rescueShip.vx;
            rescueShip.y += rescueShip.vy;
        } else {
            // Arrived at player
            rescueState = 'connected';
            rescueShip.vx = 0;
            rescueShip.vy = 0;
            
            // Create tow line
            towLine = {
                length: distance,
                tension: 0
            };
            
            setTimeout(() => {
                rescueState = 'towing';
            }, 1000); // Wait 1 second before towing
        }
    } else if (rescueState === 'towing') {
        // Move both ships toward Earth
        const earth = planets.find(p => p.name === 'Earth');
        const earthX = centerX + Math.cos(earth.angle) * earth.distance;
        const earthY = centerY + Math.sin(earth.angle) * earth.distance;
        
        const dx = earthX - rescueShip.x;
        const dy = earthY - rescueShip.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > earth.size + 50) {
            const speed = 100 * deltaTime;
            rescueShip.angle = Math.atan2(dx, -dy);
            rescueShip.vx = (dx / distance) * speed;
            rescueShip.vy = (dy / distance) * speed;
            
            // Move rescue ship
            rescueShip.x += rescueShip.vx;
            rescueShip.y += rescueShip.vy;
            
            // Move player ship (being towed)
            spaceship.x += rescueShip.vx * 0.9; // Slightly behind
            spaceship.y += rescueShip.vy * 0.9;
            spaceship.angle = rescueShip.angle;
        } else {
            // Arrived at Earth - complete rescue
            rescueState = 'completed';
            spaceship.fuel = spaceship.maxFuel * 0.5; // Give half fuel
            
            setTimeout(() => {
                rescueShip = null;
                towLine = null;
                rescueState = 'none';
            }, 2000);
        }
    }
}

// High scores
let highScores = {
    timeTrial: parseInt(localStorage.getItem('starMiners_timeTrialScore') || '0'),
    fuelEndurance: parseInt(localStorage.getItem('starMiners_fuelEnduranceScore') || '0')
};

// Audio system
let audioContext = null;
let audioEnabled = true;
let thrustSoundPlaying = false;
let miningSoundPlaying = false;

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Web Audio API not supported');
        audioEnabled = false;
    }
}

function playThrustSound() {
    if (!audioEnabled || !audioContext || thrustSoundPlaying) return;
    
    thrustSoundPlaying = true;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Low rumbling sound for thrust
    oscillator.frequency.setValueAtTime(60, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.1);
    oscillator.type = 'sawtooth';
    
    filter.frequency.setValueAtTime(200, audioContext.currentTime);
    filter.type = 'lowpass';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.15);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
    
    setTimeout(() => { thrustSoundPlaying = false; }, 150);
}

function playMiningSound() {
    if (!audioEnabled || !audioContext || miningSoundPlaying) return;
    
    miningSoundPlaying = true;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Drilling/mining sound
    oscillator.frequency.setValueAtTime(150 + Math.random() * 50, audioContext.currentTime);
    oscillator.type = 'square';
    
    filter.frequency.setValueAtTime(800, audioContext.currentTime);
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(5, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.02, audioContext.currentTime + 0.08);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
    
    setTimeout(() => { miningSoundPlaying = false; }, 80);
}

function playMiningCompleteSound() {
    if (!audioEnabled || !audioContext) return;
    
    // Success chime sound
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(523, audioContext.currentTime); // C5
    oscillator1.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
    oscillator1.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
    
    oscillator2.frequency.setValueAtTime(261, audioContext.currentTime); // C4
    oscillator2.frequency.setValueAtTime(330, audioContext.currentTime + 0.1); // E4
    oscillator2.frequency.setValueAtTime(392, audioContext.currentTime + 0.2); // G4
    
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.4);
    oscillator2.stop(audioContext.currentTime + 0.4);
}

function playCountdownSound(isGo = false) {
    if (!audioEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (isGo) {
        // "GO!" sound - higher pitch, longer
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } else {
        // Countdown beep - short, medium pitch
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
}

function playAchievementSound() {
    if (!audioEnabled || !audioContext) return;
    
    // Triumphant fanfare sound
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    
    notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.15);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.15);
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + index * 0.15 + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + index * 0.15 + 0.4);
        
        oscillator.start(audioContext.currentTime + index * 0.15);
        oscillator.stop(audioContext.currentTime + index * 0.15 + 0.4);
    });
}

function playRescueSound() {
    if (!audioEnabled || !audioContext) return;
    
    // Emergency siren sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Alternating high-low siren
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(400, audioContext.currentTime + 0.5);
    oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 1.0);
    oscillator.frequency.linearRampToValueAtTime(400, audioContext.currentTime + 1.5);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 1.4);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1.5);
}
let upgrades = {
    fuelTank: 0,     // Increases max fuel
    fuelEfficiency: 0, // Reduces fuel consumption
    miningSpeed: 0,   // Reduces mining time
    thrustPower: 0,   // Increases thrust
    miningRange: 0,   // Increases mining range
    multiMine: 0      // Increases number of asteroids that can be mined at once
};



function drawSun(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = size;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawOrbit(centerX, centerY, distance, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(centerX, centerY, distance, 0, 2 * Math.PI);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
}

function drawPlanet(planet, centerX, centerY, scale = 1) {
    const x = centerX + Math.cos(planet.angle) * planet.distance * scale;
    const y = centerY + Math.sin(planet.angle) * planet.distance * scale;
    const size = planet.size * scale;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fillStyle = planet.color;
    ctx.fill();
    
    if (planet.name === 'Saturn') {
        ctx.beginPath();
        ctx.ellipse(x, y, size + 5 * scale, size + 2 * scale, 0, 0, 2 * Math.PI);
        ctx.strokeStyle = planet.color;
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
    }
    
    return { x, y };
}

function updateThrustParticles(deltaTime) {
    for (let i = thrustParticles.length - 1; i >= 0; i--) {
        const particle = thrustParticles[i];
        
        particle.x += particle.vx * deltaTime * 60;
        particle.y += particle.vy * deltaTime * 60;
        particle.life -= deltaTime;
        
        if (particle.life <= 0) {
            thrustParticles.splice(i, 1);
        }
    }
}

function drawThrustParticles() {
    thrustParticles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.life;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
        
        const intensity = particle.life;
        if (intensity > 0.7) {
            ctx.fillStyle = '#FFD700'; // Bright yellow/white
        } else if (intensity > 0.4) {
            ctx.fillStyle = '#FF4500'; // Orange
        } else {
            ctx.fillStyle = '#FF0000'; // Red
        }
        ctx.fill();
        
        ctx.restore();
    });
}

function drawSpaceship() {
    ctx.save();
    ctx.translate(spaceship.x, spaceship.y);
    ctx.rotate(spaceship.angle);
    
    const size = spaceship.size;
    
    // Main hull (elongated hexagon)
    ctx.beginPath();
    ctx.moveTo(0, -size * 2.5);
    ctx.lineTo(-size * 0.8, -size * 1.2);
    ctx.lineTo(-size * 0.8, size * 1.2);
    ctx.lineTo(0, size * 1.5);
    ctx.lineTo(size * 0.8, size * 1.2);
    ctx.lineTo(size * 0.8, -size * 1.2);
    ctx.closePath();
    ctx.fillStyle = '#E8E8E8';
    ctx.fill();
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Cockpit/front section
    ctx.beginPath();
    ctx.moveTo(0, -size * 2.5);
    ctx.lineTo(-size * 0.5, -size * 1.5);
    ctx.lineTo(size * 0.5, -size * 1.5);
    ctx.closePath();
    ctx.fillStyle = '#4A90E2';
    ctx.fill();
    ctx.strokeStyle = '#3A7BC8';
    ctx.stroke();
    
    // Engine exhausts
    ctx.beginPath();
    ctx.rect(-size * 0.6, size * 0.8, size * 0.4, size * 0.8);
    ctx.fillStyle = '#666666';
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.rect(size * 0.2, size * 0.8, size * 0.4, size * 0.8);
    ctx.fillStyle = '#666666';
    ctx.fill();
    ctx.stroke();
    
    // Wing details
    ctx.beginPath();
    ctx.moveTo(-size * 0.8, -size * 0.5);
    ctx.lineTo(-size * 1.2, 0);
    ctx.lineTo(-size * 0.8, size * 0.5);
    ctx.fillStyle = '#BBBBBB';
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(size * 0.8, -size * 0.5);
    ctx.lineTo(size * 1.2, 0);
    ctx.lineTo(size * 0.8, size * 0.5);
    ctx.fillStyle = '#BBBBBB';
    ctx.fill();
    ctx.stroke();
    
    // Center line detail
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.5);
    ctx.lineTo(0, size);
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
}


function updateSpaceship(deltaTime) {
    // Don't allow movement during countdown or rescue
    if (countdownActive || rescueState === 'towing') return;
    
    if (isMouseDown && spaceship.fuel > 0 && !needsRescue) {
        const dx = mouseX - spaceship.x;
        const dy = mouseY - spaceship.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            spaceship.angle = Math.atan2(dx, -dy);
            
            // Play thrust sound
            if (Math.random() < 0.3) { // Randomize to avoid too frequent playing
                playThrustSound();
            }
            
            const thrust = getUpgradedThrust();
            spaceship.vx += (dx / distance) * thrust * deltaTime * 60;
            spaceship.vy += (dy / distance) * thrust * deltaTime * 60;
            
            // Create thrust particles
            for (let i = 0; i < 3; i++) {
                const particleSpeed = (0.5 + Math.random() * 0.5) * deltaTime * 60;
                const spread = (Math.random() - 0.5) * 0.3;
                const thrustAngle = spaceship.angle + Math.PI + spread;
                
                thrustParticles.push({
                    x: spaceship.x + Math.sin(spaceship.angle + Math.PI) * spaceship.size,
                    y: spaceship.y - Math.cos(spaceship.angle + Math.PI) * spaceship.size,
                    vx: Math.sin(thrustAngle) * particleSpeed,
                    vy: -Math.cos(thrustAngle) * particleSpeed,
                    life: 1.0,
                    size: Math.random() * 1 + 0.5
                });
            }
            
            // Only consume fuel if not in time trial mode
            if (gameMode !== 'time-trial') {
                spaceship.fuel -= getUpgradedFuelConsumption() * deltaTime * 60;
                if (spaceship.fuel < 0) spaceship.fuel = 0;
            }
        }
    }
    
    spaceship.x += spaceship.vx * deltaTime * 60;
    spaceship.y += spaceship.vy * deltaTime * 60;
    
    if (spaceship.x < 0) spaceship.x = canvas.width;
    if (spaceship.x > canvas.width) spaceship.x = 0;
    if (spaceship.y < 0) spaceship.y = canvas.height;
    if (spaceship.y > canvas.height) spaceship.y = 0;
    
    checkPlanetRefuel(deltaTime);
    checkAsteroidMining(deltaTime);
}

function checkPlanetRefuel(deltaTime) {
    refuelingPlanet = null;
    let nearAnyPlanet = false;
    
    planets.forEach(planet => {
        const planetX = centerX + Math.cos(planet.angle) * planet.distance;
        const planetY = centerY + Math.sin(planet.angle) * planet.distance;
        
        const dx = spaceship.x - planetX;
        const dy = spaceship.y - planetY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < planet.size + 15) {
            // Refueling costs $1.00 per unit (disabled in fuel endurance mode)
            if (gameMode !== 'fuel-endurance' && money >= 1 && spaceship.fuel < spaceship.maxFuel) {
                // Auto-save when refueling starts (first time only)
                if (!isRefueling) {
                    isRefueling = true;
                    saveGameData();
                }
                
                spaceship.fuel = Math.min(spaceship.fuel + 0.3 * deltaTime * 60, spaceship.maxFuel);
                money -= 0.3 * deltaTime * 60; // $1.00 per second at 0.3 fuel per frame
                if (money < 0) money = 0;
                money = Math.round(money * 100) / 100; // Round to 2 decimal places
            }
            if (gameMode !== 'fuel-endurance') {
                refuelingPlanet = { x: planetX, y: planetY, color: planet.color };
            }
            nearAnyPlanet = true;
        }
    });
    
    // Check if near Earth for asteroid processing and upgrades
    const earth = planets.find(p => p.name === 'Earth');
    if (earth) {
        const earthX = centerX + Math.cos(earth.angle) * earth.distance;
        const earthY = centerY + Math.sin(earth.angle) * earth.distance;
        
        const dx = spaceship.x - earthX;
        const dy = spaceship.y - earthY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < earth.size + 30) {
            // Process asteroids
            if (unprocessedAsteroids > 0) {
                money += unprocessedAsteroids * 100;
                unprocessedAsteroids = 0;
                
                // Auto-save after processing asteroids for money
                saveGameData();
            }
          
            // Update max fuel if upgraded
            spaceship.maxFuel = getUpgradedMaxFuel();
        }
    }
    
    // Reset refueling flag when not near any planet
    if (!nearAnyPlanet) {
        isRefueling = false;
    }
}


canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mousemove', handleMouseMove);

function updateCamera() {
    camera.x = spaceship.x - centerX;
    camera.y = spaceship.y - centerY;
}

function drawOffScreenIndicators() {
    planets.forEach(planet => {
        const planetX = centerX + Math.cos(planet.angle) * planet.distance;
        const planetY = centerY + Math.sin(planet.angle) * planet.distance;
        
        // Calculate planet position in screen coordinates
        const relativeX = (planetX - spaceship.x) * camera.zoom;
        const relativeY = (planetY - spaceship.y) * camera.zoom;
        const screenX = centerX + relativeX;
        const screenY = centerY + relativeY;
        
        // Check if planet is completely off the main screen (including planet size)
        const planetScreenSize = planet.size * camera.zoom;
        const isOffScreen = screenX + planetScreenSize < 0 ||
                          screenX - planetScreenSize > canvas.width ||
                          screenY + planetScreenSize < 0 ||
                          screenY - planetScreenSize > canvas.height - 200; // Account for minimap
        
        // Only show indicator if planet is completely off-screen
        if (isOffScreen) {
            const dx = planetX - spaceship.x;
            const dy = planetY - spaceship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            const indicatorX = centerX + Math.cos(angle) * (Math.min(centerX, centerY) - 80);
            const indicatorY = centerY + Math.sin(angle) * (Math.min(centerX, centerY) - 80);
            
            ctx.save();
            ctx.translate(indicatorX, indicatorY);
            ctx.rotate(angle + Math.PI / 2);
            
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(-10, 15);
            ctx.lineTo(10, 15);
            ctx.closePath();
            ctx.fillStyle = planet.color;
            ctx.fill();
            ctx.strokeStyle = '#FFF';
            ctx.stroke();
            
            ctx.restore();
            
            ctx.fillStyle = '#FFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(planet.name, indicatorX, indicatorY + 25);
            ctx.fillText(Math.round(distance), indicatorX, indicatorY + 38);
        }
    });
}

function drawMinimap() {
    ctx.save();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(minimap.x, minimap.y, minimap.width, minimap.height);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(minimap.x, minimap.y, minimap.width, minimap.height);
    
    ctx.beginPath();
    ctx.rect(minimap.x, minimap.y, minimap.width, minimap.height);
    ctx.clip();
    
    const minimapCenterX = minimap.x + minimap.width / 2;
    const minimapCenterY = minimap.y + minimap.height / 2;
    const minimapScale = 0.15;
    
    planets.forEach(planet => {
        drawOrbit(minimapCenterX, minimapCenterY, planet.distance * minimapScale, 0.3);
    });
    
    // Draw asteroid belt in minimap
    drawOrbit(minimapCenterX, minimapCenterY, 200 * minimapScale, 0.2);
    drawOrbit(minimapCenterX, minimapCenterY, 260 * minimapScale, 0.2);
    
    drawSun(minimapCenterX, minimapCenterY, 4);
    
    // Draw asteroids in minimap
    asteroids.forEach(asteroid => {
        const asteroidX = minimapCenterX + Math.cos(asteroid.angle) * asteroid.distance * minimapScale;
        const asteroidY = minimapCenterY + Math.sin(asteroid.angle) * asteroid.distance * minimapScale;
        
        ctx.beginPath();
        ctx.arc(asteroidX, asteroidY, 0.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#666666';
        ctx.fill();
    });
    
    planets.forEach(planet => {
        drawPlanet(planet, minimapCenterX, minimapCenterY, minimapScale);
    });
    
    const shipMinimapX = minimapCenterX + (spaceship.x - centerX) * minimapScale;
    const shipMinimapY = minimapCenterY + (spaceship.y - centerY) * minimapScale;
    
    ctx.beginPath();
    ctx.arc(shipMinimapX, shipMinimapY, 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
    
    ctx.restore();
}

// --- Background Stars ---
const STAR_COUNT = 200;
const stars = [];
function generateStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 0.8 + 0.2,
            alpha: Math.random() * 0.5 + 0.5
        });
    }
}
generateStars();

function drawStars() {
    ctx.save();
    ctx.globalAlpha = 1;
    for (const star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
        ctx.fill();
    }
    ctx.restore();
}

// --- FPS Counter & Cap ---
let showFPS = false;
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

// --- Debug Mode ---
let debugMode = false;

// --- FPS cap ---
const FRAME_DURATION = 1000 / 60; // ~16.67ms per frame
let lastRenderTime = performance.now();

window.addEventListener('keydown', (e) => {
    if (e.code === 'F12') {
        showFPS = !showFPS;
        e.preventDefault();
    }
    if (e.code === 'F2') {
        debugMode = !debugMode;
        e.preventDefault();
    }
});


function drawMiningFeedbacks(deltaTime) {
    for (let i = miningFeedbacks.length - 1; i >= 0; i--) {
        const fb = miningFeedbacks[i];
        fb.time -= deltaTime;
        if (fb.time <= 0) {
            miningFeedbacks.splice(i, 1);
            continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.min(1, fb.time * 2);
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('+1 asteroid mined!', fb.x, fb.y - 30 - (1 - fb.time) * 30);
        ctx.restore();
    }
}

let miningParticles = []; // {x, y, vx, vy, life, color, size}

function updateMiningParticles(deltaTime) {
    for (let i = miningParticles.length - 1; i >= 0; i--) {
        const p = miningParticles[i];
        p.x += p.vx * deltaTime * 60;
        p.y += p.vy * deltaTime * 60;
        p.life -= deltaTime;
        p.vx *= 0.97;
        p.vy *= 0.97;
        if (p.life <= 0) miningParticles.splice(i, 1);
    }
}

function drawMiningParticles() {
    for (const p of miningParticles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

function updateUpgradeMenuAnimation(deltaTime) {
    const animSpeed = 8; // animation speed
    if (upgradeMenuAnimation < upgradeMenuTarget) {
        upgradeMenuAnimation = Math.min(upgradeMenuTarget, upgradeMenuAnimation + animSpeed * deltaTime);
    } else if (upgradeMenuAnimation > upgradeMenuTarget) {
        upgradeMenuAnimation = Math.max(upgradeMenuTarget, upgradeMenuAnimation - animSpeed * deltaTime);
    }
    
    // Update challenge menu animation
    if (challengeMenuAnimation < challengeMenuTarget) {
        challengeMenuAnimation = Math.min(challengeMenuTarget, challengeMenuAnimation + animSpeed * deltaTime);
    } else if (challengeMenuAnimation > challengeMenuTarget) {
        challengeMenuAnimation = Math.max(challengeMenuTarget, challengeMenuAnimation - animSpeed * deltaTime);
    }
    
    // Update achievement menu animation
    if (achievementMenuAnimation < achievementMenuTarget) {
        achievementMenuAnimation = Math.min(achievementMenuTarget, achievementMenuAnimation + animSpeed * deltaTime);
    } else if (achievementMenuAnimation > achievementMenuTarget) {
        achievementMenuAnimation = Math.max(achievementMenuTarget, achievementMenuAnimation - animSpeed * deltaTime);
    }
    
    // Update options menu animation
    if (optionsMenuAnimation < optionsMenuTarget) {
        optionsMenuAnimation = Math.min(optionsMenuTarget, optionsMenuAnimation + animSpeed * deltaTime);
    } else if (optionsMenuAnimation > optionsMenuTarget) {
        optionsMenuAnimation = Math.max(optionsMenuTarget, optionsMenuAnimation - animSpeed * deltaTime);
    }
    
    // Update hire help menu animation
    if (hireHelpMenuAnimation < hireHelpMenuTarget) {
        hireHelpMenuAnimation = Math.min(hireHelpMenuTarget, hireHelpMenuAnimation + animSpeed * deltaTime);
    } else if (hireHelpMenuAnimation > hireHelpMenuTarget) {
        hireHelpMenuAnimation = Math.max(hireHelpMenuTarget, hireHelpMenuAnimation - animSpeed * deltaTime);
    }
    
    // Update button positions
    upgradeButtonArea.y = canvas.height - 60;
    challengeButtonArea.y = canvas.height - 110;
    achievementButtonArea.y = canvas.height - 160;
    optionsButtonArea.y = canvas.height - 210;
    hireHelpButtonArea.y = canvas.height - 260;
    muteButtonArea.x = canvas.width - 70;
    muteButtonArea.y = 20;
}

function updateAchievements(deltaTime) {
    // Update achievement stats
    updateAchievementStats();
    
    // Check for new achievements
    checkAchievements();
    
    // Update achievement banner queue
    for (let i = achievementQueue.length - 1; i >= 0; i--) {
        const banner = achievementQueue[i];
        banner.displayTime -= deltaTime;
        banner.animationTime += deltaTime;
        
        if (banner.displayTime <= 0) {
            achievementQueue.splice(i, 1);
        }
    }
}

function updateAutoSave(deltaTime) {
    // Only auto-save during normal gameplay (not during challenges)
    if (gameMode === 'normal' && !countdownActive) {
        autoSaveTimer -= deltaTime;
        if (autoSaveTimer <= 0) {
            saveGameData();
            autoSaveTimer = 60; // Reset timer to 60 seconds
        }
    }
}

function updateHelpers(deltaTime) {
    // Only update helpers during normal gameplay
    if (gameMode !== 'normal' || countdownActive) return;
    
    // Update asteroid creator ships
    for (let i = helpers.asteroidCreator.ships.length - 1; i >= 0; i--) {
        const ship = helpers.asteroidCreator.ships[i];
        ship.timeLeft -= deltaTime;
        
        updateAsteroidCreatorShip(ship, deltaTime);
        
        // Remove ship when time runs out
        if (ship.timeLeft <= 0) {
            helpers.asteroidCreator.ships.splice(i, 1);
        }
    }
    
    // Update asteroid miner ships
    for (let i = helpers.asteroidMiner.ships.length - 1; i >= 0; i--) {
        const ship = helpers.asteroidMiner.ships[i];
        ship.timeLeft -= deltaTime;
        
        updateAsteroidMinerShip(ship, deltaTime);
        
        // Remove ship when time runs out
        if (ship.timeLeft <= 0) {
            helpers.asteroidMiner.ships.splice(i, 1);
        }
    }
    
    // Update spawned asteroids moving to belt
    updateSpawnedAsteroids(deltaTime);
}

function updateAsteroidCreatorShip(ship, deltaTime) {
    if (!ship) return;
    
    const speed = 80 * deltaTime;
    
    switch (ship.state) {
        case 'traveling':
            // Find a planet to mine (avoid Earth) or switch if mined enough times
            if (!ship.targetPlanet || ship.planetMiningCount >= ship.maxPlanetMining) {
                const availablePlanets = planets.filter(p => p.name !== 'Earth');
                ship.targetPlanet = availablePlanets[Math.floor(Math.random() * availablePlanets.length)];
                ship.planetMiningCount = 0; // Reset counter for new planet
            }
            
            // Move toward target planet
            const planetX = centerX + Math.cos(ship.targetPlanet.angle) * ship.targetPlanet.distance;
            const planetY = centerY + Math.sin(ship.targetPlanet.angle) * ship.targetPlanet.distance;
            
            const dx = planetX - ship.x;
            const dy = planetY - ship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > ship.targetPlanet.size + 20) {
                ship.angle = Math.atan2(dx, -dy);
                ship.vx = (dx / distance) * speed;
                ship.vy = (dy / distance) * speed;
                ship.x += ship.vx;
                ship.y += ship.vy;
            } else {
                ship.state = 'mining';
                ship.miningProgress = 0;
                ship.vx = 0;
                ship.vy = 0;
            }
            break;
            
        case 'mining':
            ship.miningProgress += deltaTime;
            if (ship.miningProgress >= ship.miningTime) {
                // Create spawned asteroid when mining is complete
                if (asteroids.length + spawnedAsteroids.length < 100 && ship.targetPlanet) {
                    const planetX = centerX + Math.cos(ship.targetPlanet.angle) * ship.targetPlanet.distance;
                    const planetY = centerY + Math.sin(ship.targetPlanet.angle) * ship.targetPlanet.distance;
                    
                    const spawnedAsteroid = createSpawnedAsteroid(planetX, planetY);
                    spawnedAsteroids.push(spawnedAsteroid);
                }
                
                ship.planetMiningCount++;
                ship.miningProgress = 0;
                
                // Continue mining or return based on mining count
                if (ship.planetMiningCount >= ship.maxPlanetMining) {
                    ship.state = 'returning';
                } else {
                    // Stay and mine again after a short pause
                    ship.state = 'mining';
                }
            }
            break;
            
        case 'returning':
            // Return to Earth
            const earth = planets.find(p => p.name === 'Earth');
            const earthX = centerX + Math.cos(earth.angle) * earth.distance;
            const earthY = centerY + Math.sin(earth.angle) * earth.distance;
            
            const dxEarth = earthX - ship.x;
            const dyEarth = earthY - ship.y;
            const distanceEarth = Math.sqrt(dxEarth * dxEarth + dyEarth * dyEarth);
            
            if (distanceEarth > earth.size + 20) {
                ship.angle = Math.atan2(dxEarth, -dyEarth);
                ship.vx = (dxEarth / distanceEarth) * speed;
                ship.vy = (dyEarth / distanceEarth) * speed;
                ship.x += ship.vx;
                ship.y += ship.vy;
            } else {
                ship.state = 'traveling';
                ship.vx = 0;
                ship.vy = 0;
            }
            break;
    }
}

function updateAsteroidMinerShip(ship, deltaTime) {
    if (!ship) return;
    
    const speed = 100 * deltaTime;
    
    switch (ship.state) {
        case 'seeking':
            // Find closest asteroid
            if (asteroids.length === 0) return;
            
            let closestIndex = -1;
            let closestDistance = Infinity;
            
            for (let i = 0; i < asteroids.length; i++) {
                // Skip asteroids that are already being mined
                if (isAsteroidBeingMined(i)) {
                    continue;
                }
                
                const asteroid = asteroids[i];
                const asteroidX = centerX + Math.cos(asteroid.angle) * asteroid.distance;
                const asteroidY = centerY + Math.sin(asteroid.angle) * asteroid.distance;
                
                const dx = asteroidX - ship.x;
                const dy = asteroidY - ship.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = i;
                }
            }
            
            if (closestIndex !== -1) {
                ship.targetAsteroid = closestIndex;
                const asteroid = asteroids[closestIndex];
                const asteroidX = centerX + Math.cos(asteroid.angle) * asteroid.distance;
                const asteroidY = centerY + Math.sin(asteroid.angle) * asteroid.distance;
                
                const dx = asteroidX - ship.x;
                const dy = asteroidY - ship.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > asteroid.size + 15) {
                    ship.angle = Math.atan2(dx, -dy);
                    ship.vx = (dx / distance) * speed;
                    ship.vy = (dy / distance) * speed;
                    ship.x += ship.vx;
                    ship.y += ship.vy;
                } else {
                    ship.state = 'mining';
                    ship.miningProgress = 0;
                    ship.vx = 0;
                    ship.vy = 0;
                }
            }
            break;
            
        case 'mining':
            // Check if target asteroid still exists and isn't being mined by someone else
            if (ship.targetAsteroid === null || !asteroids[ship.targetAsteroid] || 
                (ship.targetAsteroid !== null && isAsteroidBeingMined(ship.targetAsteroid) && 
                 !helpers.asteroidMiner.ships.some(s => s === ship && s.targetAsteroid === ship.targetAsteroid))) {
                // Target is invalid, go back to seeking
                ship.state = 'seeking';
                ship.targetAsteroid = null;
                ship.miningProgress = 0;
                break;
            }
            
            ship.miningProgress += deltaTime;
            if (ship.miningProgress >= ship.miningTime) {
                // Mine the asteroid
                if (ship.targetAsteroid !== null && asteroids[ship.targetAsteroid]) {
                    const removedIndex = ship.targetAsteroid;
                    asteroids.splice(removedIndex, 1);
                    money += 100;
                    playMiningCompleteSound();
                    
                    // Adjust indices for all other auto-miners
                    adjustAutoMinerIndices(removedIndex);
                }
                ship.state = 'returning';
                ship.targetAsteroid = null;
            }
            break;
            
        case 'returning':
            // Return to Earth
            const earth = planets.find(p => p.name === 'Earth');
            const earthX = centerX + Math.cos(earth.angle) * earth.distance;
            const earthY = centerY + Math.sin(earth.angle) * earth.distance;
            
            const dxEarth = earthX - ship.x;
            const dyEarth = earthY - ship.y;
            const distanceEarth = Math.sqrt(dxEarth * dxEarth + dyEarth * dyEarth);
            
            if (distanceEarth > earth.size + 20) {
                ship.angle = Math.atan2(dxEarth, -dyEarth);
                ship.vx = (dxEarth / distanceEarth) * speed;
                ship.vy = (dyEarth / distanceEarth) * speed;
                ship.x += ship.vx;
                ship.y += ship.vy;
            } else {
                ship.state = 'seeking';
                ship.vx = 0;
                ship.vy = 0;
            }
            break;
    }
}

function isAsteroidBeingMined(asteroidIndex) {
    // Check if player is mining this asteroid
    if (miningTarget.includes(asteroidIndex)) {
        return true;
    }
    
    // Check if any auto-miner is mining this asteroid
    for (const ship of helpers.asteroidMiner.ships) {
        if (ship.targetAsteroid === asteroidIndex) {
            return true;
        }
    }
    
    return false;
}

function adjustAutoMinerIndices(removedIndex) {
    // Adjust all auto-miner ship target indices when an asteroid is removed
    for (const ship of helpers.asteroidMiner.ships) {
        if (ship.targetAsteroid !== null && ship.targetAsteroid > removedIndex) {
            ship.targetAsteroid--;
        } else if (ship.targetAsteroid === removedIndex) {
            // The asteroid they were targeting was removed - reset their state
            ship.targetAsteroid = null;
            ship.state = 'seeking';
            ship.miningProgress = 0;
        }
    }
}

function updateSpawnedAsteroids(deltaTime) {
    for (let i = spawnedAsteroids.length - 1; i >= 0; i--) {
        const spawnedAst = spawnedAsteroids[i];
        
        // Calculate movement toward target
        const dx = spawnedAst.targetX - spawnedAst.x;
        const dy = spawnedAst.targetY - spawnedAst.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            // Move toward target
            const moveSpeed = spawnedAst.speed * deltaTime;
            spawnedAst.vx = (dx / distance) * moveSpeed;
            spawnedAst.vy = (dy / distance) * moveSpeed;
            spawnedAst.x += spawnedAst.vx;
            spawnedAst.y += spawnedAst.vy;
        } else {
            // Arrived at asteroid belt - convert to regular asteroid
            asteroids.push({
                distance: spawnedAst.finalDistance,
                angle: spawnedAst.finalAngle,
                size: spawnedAst.size,
                speed: spawnedAst.finalSpeed,
                lightColor: spawnedAst.lightColor,
                darkColor: spawnedAst.darkColor,
                outlineColor: spawnedAst.outlineColor,
                detailColor: spawnedAst.detailColor,
                craters: spawnedAst.craters,
                craterData: spawnedAst.craterData,
                cracks: spawnedAst.cracks,
                highlights: spawnedAst.highlights,
                highlightColor: spawnedAst.highlightColor,
                shape: null,
                rotation: 0,
                rotationSpeed: 0
            });
            
            // Remove from spawned asteroids
            spawnedAsteroids.splice(i, 1);
        }
    }
}

function updateChallengeMode(deltaTime) {
    if (countdownActive) {
        countdownTimer -= deltaTime;
        
        if (countdownTimer > 3) {
            countdownText = '3';
        } else if (countdownTimer > 2) {
            countdownText = '2';
        } else if (countdownTimer > 1) {
            countdownText = '1';
        } else if (countdownTimer > 0) {
            countdownText = 'GO!';
        } else {
            // Countdown finished, start challenge
            countdownActive = false;
            challengeActive = true;
            countdownText = '';
        }
        
        // Play countdown sounds
        const prevCountdown = Math.ceil(countdownTimer + deltaTime);
        const currentCountdown = Math.ceil(countdownTimer);
        if (prevCountdown !== currentCountdown && currentCountdown >= 0 && currentCountdown <= 3) {
            if (currentCountdown === 0) {
                playCountdownSound(true); // "GO!" sound
            } else {
                playCountdownSound(false); // countdown beep
            }
        }
        
        return;
    }
    
    if (!challengeActive) return;
    
    if (gameMode === 'time-trial') {
        challengeTimer -= deltaTime;
        if (challengeTimer <= 0) {
            endChallenge();
        }
    } else if (gameMode === 'fuel-endurance') {
        challengeTimer += deltaTime; // Track elapsed time
        if (spaceship.fuel <= 0) {
            endChallenge();
        }
    }
}

function resetGameForChallenge() {
    // Reset spaceship position and velocity
    spaceship.x = centerX + 120;
    spaceship.y = centerY;
    spaceship.vx = 0;
    spaceship.vy = 0;
    spaceship.fuel = spaceship.maxFuel;
    spaceship.angle = 0;
    
    // Clear mining state
    miningTarget = [];
    miningProgress = [];
    miningFeedbacks = [];
    miningParticles = [];
    thrustParticles = [];
    
    // Reset camera
    camera.x = 0;
    camera.y = 0;
}

function startChallenge(mode) {
    // Reset game state
    resetGameForChallenge();
    
    gameMode = mode;
    challengeActive = false; // Will be set to true after countdown
    challengeScore = 0;
    
    // Start countdown
    countdownActive = true;
    countdownTimer = 4; // 3, 2, 1, GO! (4 seconds total)
    
    if (mode === 'time-trial') {
        challengeTimer = 60; // 60 seconds
    } else if (mode === 'fuel-endurance') {
        challengeTimer = 0; // Track time for score
    }
    
    // Close challenge menu
    showChallengeMenu = false;
    challengeMenuTarget = 0;
}

function endChallenge() {
    challengeActive = false;
    const mode = gameMode;
    const finalScore = challengeScore;
    gameMode = 'normal';
    
    // Update challenge best scores for achievements
    if (mode === 'time-trial') {
        achievements.time_trial_best = Math.max(achievements.time_trial_best || 0, finalScore);
        if (finalScore > highScores.timeTrial) {
            highScores.timeTrial = finalScore;
            localStorage.setItem('starMiners_timeTrialScore', finalScore.toString());
        }
    } else if (mode === 'fuel-endurance') {
        achievements.fuel_endurance_best = Math.max(achievements.fuel_endurance_best || 0, finalScore);
        if (finalScore > highScores.fuelEndurance) {
            highScores.fuelEndurance = finalScore;
            localStorage.setItem('starMiners_fuelEnduranceScore', finalScore.toString());
        }
    }
    
    // Save achievements after challenge
    saveAchievements();
    
    // Check for new achievements
    checkAchievements();
    
    alert(`Challenge Complete!\nScore: ${finalScore}\nHigh Score: ${mode === 'time-trial' ? highScores.timeTrial : highScores.fuelEndurance}`);
}

function animate(now = performance.now()) {
    // Cap FPS to 60
    if (now - lastRenderTime < FRAME_DURATION) {
        requestAnimationFrame(animate);
        return;
    }
    // Calculate deltaTime in seconds
    const deltaTime = Math.min((now - lastRenderTime) / 1000, 0.1); // Clamp to avoid spiral of death
    lastRenderTime = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background stars
    drawStars();

    // Update planet orbits with deltaTime
    planets.forEach(planet => {
        planet.angle += planet.speed * deltaTime * 60;
    });

    updateSpaceship(deltaTime);
    updateThrustParticles(deltaTime);
    updateMiningParticles(deltaTime);
    updateUpgradeMenuAnimation(deltaTime);
    updateChallengeMode(deltaTime);
    updateAutoSave(deltaTime);
    updateAchievements(deltaTime);
    updateHelpers(deltaTime);
    checkRescueNeed();
    updateRescueShip(deltaTime);
    updateCamera();
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-spaceship.x, -spaceship.y);
    
    planets.forEach(planet => {
        drawOrbit(centerX, centerY, planet.distance);
    });
    
    // Draw asteroid belt orbit guides
    drawOrbit(centerX, centerY, 200, 0.2);
    drawOrbit(centerX, centerY, 260, 0.2);
    
    drawSun(centerX, centerY, 20);
    
    // Draw asteroids and update their orbits with deltaTime
    drawAsteroids(deltaTime);
    
    // Draw spawned asteroids moving from planets to belt
    drawSpawnedAsteroids();
    
    const visiblePlanets = [];
    planets.forEach(planet => {
        const pos = drawPlanet(planet, centerX, centerY);
        const screenX = (pos.x - camera.x) * camera.zoom + centerX;
        const screenY = (pos.y - camera.y) * camera.zoom + centerY;
        
        if (screenX >= -50 && screenX <= canvas.width + 50 &&
            screenY >= -50 && screenY <= canvas.height + 50) {
            visiblePlanets.push({ planet, pos });
        }
    });
    
    drawSpaceship();
    drawThrustParticles();
    drawRescueShip();
    drawTowLine();
    drawAsteroidCreatorShip();
    drawAsteroidMinerShip();
    
    // Draw mining particles (below asteroids)
    drawMiningParticles();

    // Draw mining feedbacks (after ship, before UI)
    drawMiningFeedbacks(deltaTime);

    ctx.restore();
    
    if (refuelingPlanet) {
        const relativeX = (refuelingPlanet.x - spaceship.x) * camera.zoom;
        const relativeY = (refuelingPlanet.y - spaceship.y) * camera.zoom;
        const refuelScreenX = centerX + relativeX;
        const refuelScreenY = centerY + relativeY;
        
        ctx.strokeStyle = refuelingPlanet.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(refuelScreenX, refuelScreenY);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
    
    if (gameOptions.showPlanetIndicators) {
        drawOffScreenIndicators();
    }
    if (gameOptions.showMinimap) {
        drawMinimap();
    }
    drawFuelBar();
    drawResourceCounters();
    drawMuteButton();
    drawAchievementButton();
    drawChallengeButton();
    drawUpgradeButton();
    drawOptionsButton();
    drawHireHelpButton();
    drawRescueButton();
    drawAchievementMenu();
    drawChallengeMenu();
    drawUpgradeMenu();
    drawOptionsMenu();
    drawHireHelpMenu();
    drawCountdown(); // Draw countdown on top of everything
    drawRescueStatus(); // Draw rescue status
    drawAchievementBanners(); // Draw achievement banners on top of everything
    
    // --- FPS calculation and drawing ---
    frameCount++;
    if (now - lastFrameTime >= 500) {
        fps = Math.round(frameCount * 1000 / (now - lastFrameTime));
        lastFrameTime = now;
        frameCount = 0;
    }
    drawFPS();

    requestAnimationFrame(animate);
}

// Load saved game data on startup
loadGameData();
loadAchievements();
loadOptions();

// Initialize audio on first user interaction
canvas.addEventListener('click', function initAudioOnClick() {
    if (!audioContext) {
        initAudio();
        canvas.removeEventListener('click', initAudioOnClick);
    }
});

animate();