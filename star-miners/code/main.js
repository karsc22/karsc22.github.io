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
    
    if (upgradeType === 'multiMine') {
        // Multi-mine costs gold: level 1 = 1 gold, level 2 = 2 gold, etc.
        return upgrades[upgradeType] + 1;
    }
    
    const baseCosts = {
        fuelTank: 200,
        fuelEfficiency: 300,
        miningSpeed: 500,
        thrustPower: 400,
        miningRange: 350
    };
    return baseCosts[upgradeType] * Math.pow(2, upgrades[upgradeType]);
}

function getUpgradeCurrency(upgradeType) {
    return upgradeType === 'multiMine' ? 'gold' : 'money';
}

function canAffordUpgrade(upgradeType) {
    if (debugMode) return true;
    
    const cost = getUpgradeCost(upgradeType);
    if (cost === 0) return false; // Maxed out
    
    if (upgradeType === 'multiMine') {
        return gold >= cost;
    } else {
        return money >= cost;
    }
}

function formatMoney(amount) {
    // Round down to remove cents
    const rounded = Math.floor(amount);
    
    // Add commas for thousands/millions separator
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function trackMoneyIncome(amount) {
    if (amount > 0) {
        moneyHistory.push({
            time: Date.now(),
            amount: amount
        });
    }
    
    // Clean up entries older than 30 seconds
    const thirtySecondsAgo = Date.now() - 30000;
    moneyHistory = moneyHistory.filter(entry => entry.time >= thirtySecondsAgo);
}

function getMoneyPerMinute() {
    if (moneyHistory.length === 0) return 0;
    
    // Calculate total money earned in the last 30 seconds
    const totalMoney = moneyHistory.reduce((sum, entry) => sum + entry.amount, 0);
    
    // Convert to per-minute rate (30 seconds = 0.5 minutes, so multiply by 2)
    return Math.floor(totalMoney * 2);
}

function getFormattedMoneyDisplay() {
    const formattedMoney = formatMoney(money);
    const incomeRate = getMoneyPerMinute();
    
    if (incomeRate > 0) {
        return `$${formattedMoney} (+${formatMoney(incomeRate)}/min)`;
    } else {
        return `$${formattedMoney}`;
    }
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
let gold = 0;

// Money tracking for income rate calculation
let moneyHistory = []; // Array of {time, amount} entries for the last 30 seconds
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

// Reset confirmation state
let showResetConfirmation = false;

// Hire help menu system
let showHireHelpMenu = false;
let hireHelpMenuAnimation = 0;
let hireHelpMenuTarget = 0;
let hireHelpButtonArea = { x: 20, y: 0, width: 120, height: 40 };

// Helper system - now supports multiple ships and ranks
let helpers = {
    asteroidCreator: {
        ships: [], // array of active creator ships
        maxTime: 1200, // 20 minutes in seconds
        cost: 1000
    },
    asteroidCreator2: {
        ships: [], // array of active rank 2 creator ships
        maxTime: 12000, // 200 minutes (10x longer)
        cost: 10000 // 10x cost
    },
    asteroidMiner: {
        ships: [], // array of active miner ships
        maxTime: 300, // 5 minutes in seconds
        cost: 2000
    },
    asteroidMiner2: {
        ships: [], // array of active rank 2 miner ships
        maxTime: 3000, // 50 minutes (10x longer)
        cost: 20000 // 10x cost
    },
    rescueHelper: {
        hired: false,
        cost: 0 // free
    }
};

// Asteroid spawning system for moving asteroids from planets to belt
let spawnedAsteroids = [];

// Golden asteroids system
let goldenAsteroids = [];
let goldenAsteroidSpawnTimer = 0;
let goldenAsteroidSpawnInterval = 45; // 45 seconds between spawns

// Helper ship creation functions
function createAsteroidCreatorShip(rank = 1) {
    const earth = planets.find(p => p.name === 'Earth');
    const earthX = centerX + Math.cos(earth.angle) * earth.distance;
    const earthY = centerY + Math.sin(earth.angle) * earth.distance;
    
    const helperType = rank === 2 ? 'asteroidCreator2' : 'asteroidCreator';
    
    return {
        x: earthX,
        y: earthY,
        vx: 0,
        vy: 0,
        angle: 0,
        size: rank === 2 ? 7 : 5, // Larger size for rank 2
        targetPlanet: null,
        state: 'traveling', // 'traveling', 'mining', 'returning'
        miningProgress: 0,
        miningTime: rank === 2 ? 3 : 5, // Faster mining for rank 2
        timeLeft: helpers[helperType].maxTime,
        planetMiningCount: 0, // how many times mined current planet
        maxPlanetMining: rank === 2 ? 8 : 5, // More mining per planet for rank 2
        rank: rank,
        purchaseTime: Date.now() // Store when it was purchased
    };
}

function createAsteroidMinerShip(rank = 1) {
    const earth = planets.find(p => p.name === 'Earth');
    const earthX = centerX + Math.cos(earth.angle) * earth.distance;
    const earthY = centerY + Math.sin(earth.angle) * earth.distance;
    
    const helperType = rank === 2 ? 'asteroidMiner2' : 'asteroidMiner';
    
    return {
        x: earthX,
        y: earthY,
        vx: 0,
        vy: 0,
        angle: 0,
        size: rank === 2 ? 6 : 4, // Larger size for rank 2
        targetAsteroid: null,
        state: 'seeking', // 'seeking', 'mining', 'returning'
        miningProgress: 0,
        miningTime: rank === 2 ? 2 : 3, // Faster mining for rank 2
        timeLeft: helpers[helperType].maxTime,
        cargoValue: 0, // Money earned from mining
        rank: rank,
        purchaseTime: Date.now() // Store when it was purchased
    };
}

function createGoldenAsteroid() {
    const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    const size = 8 + Math.random() * 4; // Larger than normal asteroids
    const speed = 25 + Math.random() * 15; // pixels per second, in world coordinates (half speed)
    
    let startX, startY, targetX, targetY;
    
    // Calculate world coordinates based on current spaceship position and camera
    const worldLeft = spaceship.x - canvas.width / (2 * camera.zoom);
    const worldRight = spaceship.x + canvas.width / (2 * camera.zoom);
    const worldTop = spaceship.y - canvas.height / (2 * camera.zoom);
    const worldBottom = spaceship.y + canvas.height / (2 * camera.zoom);
    
    const margin = 100; // Spawn margin outside visible area
    
    // Start from outside the visible world area and travel to the opposite side
    switch (side) {
        case 0: // from top
            startX = worldLeft + Math.random() * (worldRight - worldLeft);
            startY = worldTop - margin;
            targetX = worldLeft + Math.random() * (worldRight - worldLeft);
            targetY = worldBottom + margin;
            break;
        case 1: // from right
            startX = worldRight + margin;
            startY = worldTop + Math.random() * (worldBottom - worldTop);
            targetX = worldLeft - margin;
            targetY = worldTop + Math.random() * (worldBottom - worldTop);
            break;
        case 2: // from bottom
            startX = worldLeft + Math.random() * (worldRight - worldLeft);
            startY = worldBottom + margin;
            targetX = worldLeft + Math.random() * (worldRight - worldLeft);
            targetY = worldTop - margin;
            break;
        case 3: // from left
            startX = worldLeft - margin;
            startY = worldTop + Math.random() * (worldBottom - worldTop);
            targetX = worldRight + margin;
            targetY = worldTop + Math.random() * (worldBottom - worldTop);
            break;
    }
    
    // Calculate direction vector
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return {
        x: startX,
        y: startY,
        vx: (dx / distance) * speed,
        vy: (dy / distance) * speed,
        size: size,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        targetX: targetX,
        targetY: targetY,
        totalDistance: distance,
        traveledDistance: 0,
        beingMined: false,
        miningProgress: 0,
        miningTime: 4, // Takes longer to mine than regular asteroids
        shape: null // Will be generated on first draw
    };
}

function updateGoldenAsteroids(deltaTime) {
    // Spawn new golden asteroids
    if (gameMode === 'normal' && !countdownActive) {
        goldenAsteroidSpawnTimer += deltaTime;
        if (goldenAsteroidSpawnTimer >= goldenAsteroidSpawnInterval) {
            goldenAsteroids.push(createGoldenAsteroid());
            goldenAsteroidSpawnTimer = 0;
            // Vary the next spawn time slightly
            goldenAsteroidSpawnInterval = 40 + Math.random() * 20; // 40-60 seconds
        }
    }
    
    // Update existing golden asteroids
    for (let i = goldenAsteroids.length - 1; i >= 0; i--) {
        const asteroid = goldenAsteroids[i];
        
        // Always move asteroid regardless of mining state
        asteroid.x += asteroid.vx * deltaTime;
        asteroid.y += asteroid.vy * deltaTime;
        asteroid.traveledDistance += Math.sqrt(asteroid.vx * asteroid.vx + asteroid.vy * asteroid.vy) * deltaTime;
        
        // Update rotation
        asteroid.rotation += asteroid.rotationSpeed * deltaTime * 60;
        
        // Remove if it's traveled far enough
        // Only remove due to distance if not being mined and far away
        const distanceFromPlayer = Math.sqrt(
            (asteroid.x - spaceship.x) * (asteroid.x - spaceship.x) + 
            (asteroid.y - spaceship.y) * (asteroid.y - spaceship.y)
        );
        
        if (asteroid.traveledDistance >= asteroid.totalDistance || 
            (!asteroid.beingMined && distanceFromPlayer > 3000)) {
            goldenAsteroids.splice(i, 1);
            continue;
        }
        
        // Check if player is close enough to mine
        const dx = spaceship.x - asteroid.x;
        const dy = spaceship.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < asteroid.size + getUpgradedMiningRange() && !countdownActive) {
            if (!asteroid.beingMined) {
                asteroid.beingMined = true;
                asteroid.miningProgress = 0;
            }
            
            // Continue mining while in range
            asteroid.miningProgress += deltaTime;
            
            // Emit special golden particles while mining
            if (Math.random() < 0.2) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 0.8 + 0.3;
                miningParticles.push({
                    x: asteroid.x,
                    y: asteroid.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.6 + Math.random() * 0.4,
                    color: '#FFD700',
                    size: Math.random() * 1.2 + 0.8
                });
            }
            
            if (asteroid.miningProgress >= asteroid.miningTime) {
                // Successfully mined!
                gold++;
                playMiningCompleteSound();
                
                // Add special golden mining feedback
                miningFeedbacks.push({
                    x: spaceship.x,
                    y: spaceship.y,
                    time: 1.5,
                    isGold: true
                });
                
                // Burst of golden particles
                for (let p = 0; p < 40; p++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 3 + 0.5;
                    miningParticles.push({
                        x: asteroid.x,
                        y: asteroid.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1.0 + Math.random() * 0.8,
                        color: '#FFD700',
                        size: Math.random() * 2.5 + 1.5
                    });
                }
                
                goldenAsteroids.splice(i, 1);
                saveGameData();
            }
        } else {
            // Player moved away, stop mining
            asteroid.beingMined = false;
            asteroid.miningProgress = 0;
        }
    }
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
        gold: gold,
        upgrades: upgrades,
        asteroidsMined: asteroidsMined,
        unprocessedAsteroids: unprocessedAsteroids,
        achievementBests: {
            time_trial_best: achievements.time_trial_best || 0,
            fuel_endurance_best: achievements.fuel_endurance_best || 0
        },
        helpers: {
            asteroidCreator: helpers.asteroidCreator.ships.map(ship => ({
                timeLeft: ship.timeLeft,
                purchaseTime: ship.purchaseTime,
                rank: ship.rank || 1
            })),
            asteroidCreator2: helpers.asteroidCreator2.ships.map(ship => ({
                timeLeft: ship.timeLeft,
                purchaseTime: ship.purchaseTime,
                rank: ship.rank || 2
            })),
            asteroidMiner: helpers.asteroidMiner.ships.map(ship => ({
                timeLeft: ship.timeLeft,
                purchaseTime: ship.purchaseTime,
                rank: ship.rank || 1
            })),
            asteroidMiner2: helpers.asteroidMiner2.ships.map(ship => ({
                timeLeft: ship.timeLeft,
                purchaseTime: ship.purchaseTime,
                rank: ship.rank || 2
            })),
            rescueHelper: {
                hired: helpers.rescueHelper.hired
            }
        },
        saveVersion: 3, // Increment version for helper support
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
            
            // Validate save data (support versions 1, 2, and 3)
            if ((data.saveVersion >= 1 && data.saveVersion <= 3) && typeof data.money === 'number' && data.upgrades) {
                money = data.money;
                gold = data.gold || 0; // Default to 0 if not present (version 1 saves)
                upgrades = { ...upgrades, ...data.upgrades }; // Merge with defaults
                asteroidsMined = data.asteroidsMined || 0;
                unprocessedAsteroids = data.unprocessedAsteroids || 0;
                
                // Load achievement bests
                if (data.achievementBests) {
                    achievements.time_trial_best = data.achievementBests.time_trial_best || 0;
                    achievements.fuel_endurance_best = data.achievementBests.fuel_endurance_best || 0;
                }
                
                // Load helpers and calculate offline progress (version 3+)
                if (data.saveVersion >= 3 && data.helpers) {
                    loadHelpersWithOfflineProgress(data.helpers, data.lastSaved);
                } else {
                    // Clear helpers for older saves
                    helpers.rescueHelper.hired = false;
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

function loadHelpersWithOfflineProgress(savedHelpers, lastSavedTime) {
    const now = Date.now();
    const offlineTime = (now - lastSavedTime) / 1000; // Convert to seconds
    let offlineEarnings = 0;
    
    console.log(`Calculating offline progress: ${Math.floor(offlineTime / 60)} minutes offline`);
    
    // Load rescue helper
    helpers.rescueHelper.hired = savedHelpers.rescueHelper?.hired || false;
    
    // Helper function to calculate mining earnings per second
    const getMiningEarningsPerSecond = () => {
        // Base earnings: ~$10 per asteroid, mined every ~8 seconds (travel + mining)
        // This approximates what an active miner would earn
        return 10 / 8; // $1.25 per second per miner
    };
    
    // Load and process asteroid creators
    const loadCreatorShips = (savedShips, helperType, rank) => {
        for (const savedShip of savedShips || []) {
            const remainingTime = Math.max(0, savedShip.timeLeft - offlineTime);
            if (remainingTime > 0) {
                // Ship is still active - recreate it with updated time
                const ship = createAsteroidCreatorShip(rank);
                ship.timeLeft = remainingTime;
                ship.purchaseTime = savedShip.purchaseTime;
                helpers[helperType].ships.push(ship);
            }
        }
    };
    
    // Load and process asteroid miners with offline earnings
    const loadMinerShips = (savedShips, helperType, rank) => {
        for (const savedShip of savedShips || []) {
            const remainingTime = Math.max(0, savedShip.timeLeft - offlineTime);
            if (remainingTime > 0) {
                // Ship is still active - recreate it and calculate earnings
                const ship = createAsteroidMinerShip(rank);
                ship.timeLeft = remainingTime;
                ship.purchaseTime = savedShip.purchaseTime;
                helpers[helperType].ships.push(ship);
                
                // Calculate offline earnings for this miner
                const timeWorked = Math.min(offlineTime, savedShip.timeLeft);
                const earningsPerSecond = getMiningEarningsPerSecond();
                const minerEarnings = timeWorked * earningsPerSecond;
                offlineEarnings += minerEarnings;
            } else {
                // Ship would have expired, but still calculate earnings for the time it was active
                const timeWorked = savedShip.timeLeft;
                if (timeWorked > 0) {
                    const earningsPerSecond = getMiningEarningsPerSecond();
                    const minerEarnings = timeWorked * earningsPerSecond;
                    offlineEarnings += minerEarnings;
                }
            }
        }
    };
    
    // Load all helper types
    loadCreatorShips(savedHelpers.asteroidCreator, 'asteroidCreator', 1);
    loadCreatorShips(savedHelpers.asteroidCreator2, 'asteroidCreator2', 2);
    loadMinerShips(savedHelpers.asteroidMiner, 'asteroidMiner', 1);
    loadMinerShips(savedHelpers.asteroidMiner2, 'asteroidMiner2', 2);
    
    // Add offline earnings to money
    if (offlineEarnings > 0) {
        money += Math.floor(offlineEarnings);
        trackMoneyIncome(Math.floor(offlineEarnings));
        
        // Show offline earnings notification
        const minutes = Math.floor(offlineTime / 60);
        const hours = Math.floor(minutes / 60);
        let timeText;
        if (hours > 0) {
            timeText = `${hours}h ${minutes % 60}m`;
        } else {
            timeText = `${minutes}m`;
        }
        
        console.log(`Offline earnings: $${Math.floor(offlineEarnings)} from ${timeText} of helper work`);
        
        // Store offline earnings info for display
        window.offlineEarningsInfo = {
            amount: Math.floor(offlineEarnings),
            time: timeText,
            timestamp: now
        };
    }
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

function resetAllGameData() {
    // Reset core game state
    money = 100;
    gold = 0;
    asteroidsMined = 0;
    unprocessedAsteroids = 0;
    moneyHistory = [];
    
    // Reset upgrades
    upgrades = {
        fuelTank: 0,
        fuelEfficiency: 0,
        miningSpeed: 0,
        thrustPower: 0,
        miningRange: 0,
        multiMine: 0
    };
    
    // Reset spaceship
    spaceship.fuel = 100;
    spaceship.maxFuel = 100;
    spaceship.x = centerX + 120;
    spaceship.y = centerY;
    spaceship.vx = 0;
    spaceship.vy = 0;
    spaceship.angle = 0;
    
    // Reset camera
    camera.x = 0;
    camera.y = 0;
    
    // Clear achievements
    achievements = {};
    achievementQueue = [];
    
    // Reset high scores
    highScores.timeTrial = 0;
    highScores.fuelEndurance = 0;
    
    // Clear helpers
    helpers.asteroidCreator.ships = [];
    helpers.asteroidCreator2.ships = [];
    helpers.asteroidMiner.ships = [];
    helpers.asteroidMiner2.ships = [];
    helpers.rescueHelper.hired = false;
    
    // Clear rescue state
    needsRescue = false;
    rescueShip = null;
    rescueState = 'none';
    towLine = null;
    
    // Clear mining state
    miningTarget = [];
    miningProgress = [];
    miningFeedbacks = [];
    miningParticles = [];
    thrustParticles = [];
    
    // Clear golden asteroids
    goldenAsteroids = [];
    goldenAsteroidSpawnTimer = 0;
    
    // Clear spawned asteroids
    spawnedAsteroids = [];
    
    // Reset game mode
    gameMode = 'normal';
    challengeActive = false;
    countdownActive = false;
    challengeScore = 0;
    challengeTimer = 0;
    
    // Clear localStorage
    localStorage.removeItem('starMiners_gameData');
    localStorage.removeItem('starMiners_achievements');
    localStorage.removeItem('starMiners_timeTrialScore');
    localStorage.removeItem('starMiners_fuelEnduranceScore');
    
    // Close confirmation dialog
    showResetConfirmation = false;
    
    console.log('All game data has been reset');
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
            spaceship.vx = 0; // Reset velocity to 0
            spaceship.vy = 0; // Reset velocity to 0
            
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
                const earned = unprocessedAsteroids * 100;
                money += earned;
                trackMoneyIncome(earned);
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
    
    // Draw golden asteroid indicators
    goldenAsteroids.forEach(asteroid => {
        // Calculate asteroid position in screen coordinates
        const relativeX = (asteroid.x - spaceship.x) * camera.zoom;
        const relativeY = (asteroid.y - spaceship.y) * camera.zoom;
        const screenX = centerX + relativeX;
        const screenY = centerY + relativeY;
        
        // Check if golden asteroid is off-screen (with some margin)
        const asteroidScreenSize = asteroid.size * camera.zoom;
        const margin = 50;
        const isOffScreen = screenX + asteroidScreenSize < -margin ||
                          screenX - asteroidScreenSize > canvas.width + margin ||
                          screenY + asteroidScreenSize < -margin ||
                          screenY - asteroidScreenSize > canvas.height - 150; // Account for UI
        
        if (isOffScreen) {
            const dx = asteroid.x - spaceship.x;
            const dy = asteroid.y - spaceship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // Position indicator at screen edge
            const indicatorRadius = Math.min(centerX, centerY) - 60;
            const indicatorX = centerX + Math.cos(angle) * indicatorRadius;
            const indicatorY = centerY + Math.sin(angle) * indicatorRadius;
            
            ctx.save();
            ctx.translate(indicatorX, indicatorY);
            
            // Draw pulsing golden indicator
            const pulseIntensity = (Math.sin(Date.now() * 0.008) + 1) * 0.5;
            const indicatorSize = 12 + pulseIntensity * 4;
            
            // Outer glow
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, indicatorSize + 3, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Main golden circle
            ctx.beginPath();
            ctx.arc(0, 0, indicatorSize, 0, 2 * Math.PI);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Inner shine
            ctx.beginPath();
            ctx.arc(-indicatorSize * 0.3, -indicatorSize * 0.3, indicatorSize * 0.4, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fill();
            
            // Direction arrow
            ctx.rotate(angle + Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, -indicatorSize - 8);
            ctx.lineTo(-6, -indicatorSize + 2);
            ctx.lineTo(6, -indicatorSize + 2);
            ctx.closePath();
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.restore();
            
            // Distance text
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 3;
            ctx.fillText('GOLD', indicatorX, indicatorY + 25);
            ctx.fillText(Math.round(distance), indicatorX, indicatorY + 38);
            ctx.shadowBlur = 0;
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
        ctx.textAlign = 'center';
        
        if (fb.isGold) {
            // Golden asteroid feedback
            ctx.fillStyle = '#FFD700';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.fillText('+1 GOLD!', fb.x, fb.y - 30 - (1 - fb.time) * 30);
            ctx.shadowBlur = 0;
        } else {
            // Regular asteroid feedback
            ctx.fillStyle = '#FFD700';
            ctx.fillText('+1 asteroid mined!', fb.x, fb.y - 30 - (1 - fb.time) * 30);
        }
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
    
    // Update asteroid creator ships (rank 1)
    for (let i = helpers.asteroidCreator.ships.length - 1; i >= 0; i--) {
        const ship = helpers.asteroidCreator.ships[i];
        ship.timeLeft -= deltaTime;
        
        updateAsteroidCreatorShip(ship, deltaTime);
        
        // Remove ship when time runs out
        if (ship.timeLeft <= 0) {
            helpers.asteroidCreator.ships.splice(i, 1);
        }
    }
    
    // Update asteroid creator ships (rank 2)
    for (let i = helpers.asteroidCreator2.ships.length - 1; i >= 0; i--) {
        const ship = helpers.asteroidCreator2.ships[i];
        ship.timeLeft -= deltaTime;
        
        updateAsteroidCreatorShip(ship, deltaTime);
        
        // Remove ship when time runs out
        if (ship.timeLeft <= 0) {
            helpers.asteroidCreator2.ships.splice(i, 1);
        }
    }
    
    // Update asteroid miner ships (rank 1)
    for (let i = helpers.asteroidMiner.ships.length - 1; i >= 0; i--) {
        const ship = helpers.asteroidMiner.ships[i];
        ship.timeLeft -= deltaTime;
        
        updateAsteroidMinerShip(ship, deltaTime);
        
        // Remove ship when time runs out
        if (ship.timeLeft <= 0) {
            helpers.asteroidMiner.ships.splice(i, 1);
        }
    }
    
    // Update asteroid miner ships (rank 2)
    for (let i = helpers.asteroidMiner2.ships.length - 1; i >= 0; i--) {
        const ship = helpers.asteroidMiner2.ships[i];
        ship.timeLeft -= deltaTime;
        
        updateAsteroidMinerShip(ship, deltaTime);
        
        // Remove ship when time runs out
        if (ship.timeLeft <= 0) {
            helpers.asteroidMiner2.ships.splice(i, 1);
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
            // Find an available planet to mine (avoid Earth) or switch if mined enough times
            if (!ship.targetPlanet || ship.planetMiningCount >= ship.maxPlanetMining) {
                const availablePlanets = planets.filter(p => p.name !== 'Earth');
                
                // Find a planet that doesn't already have a creator ship
                let targetPlanet = null;
                for (const planet of availablePlanets) {
                    const hasCreator = helpers.asteroidCreator.ships.some(otherShip => 
                        otherShip !== ship && otherShip.targetPlanet && otherShip.targetPlanet.name === planet.name
                    ) || helpers.asteroidCreator2.ships.some(otherShip => 
                        otherShip !== ship && otherShip.targetPlanet && otherShip.targetPlanet.name === planet.name
                    );
                    if (!hasCreator) {
                        targetPlanet = planet;
                        break;
                    }
                }
                
                // If all planets have creators, pick a random one
                if (!targetPlanet && availablePlanets.length > 0) {
                    targetPlanet = availablePlanets[Math.floor(Math.random() * availablePlanets.length)];
                }
                
                ship.targetPlanet = targetPlanet;
                ship.planetMiningCount = 0; // Reset counter for new planet
            }
            
            if (!ship.targetPlanet) return;
            
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
            // Move with the planet while mining
            if (ship.targetPlanet) {
                const planetX = centerX + Math.cos(ship.targetPlanet.angle) * ship.targetPlanet.distance;
                const planetY = centerY + Math.sin(ship.targetPlanet.angle) * ship.targetPlanet.distance;
                
                // Position ship near the planet
                const offsetAngle = ship.targetPlanet.angle + Math.PI / 4; // Offset position
                const offsetDistance = ship.targetPlanet.size + 25;
                ship.x = planetX + Math.cos(offsetAngle) * offsetDistance;
                ship.y = planetY + Math.sin(offsetAngle) * offsetDistance;
                ship.angle = Math.atan2(planetY - ship.y, planetX - ship.x) + Math.PI / 2;
            }
            
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
            // Find closest asteroid only if we don't have a target
            if (ship.targetAsteroid === null || ship.targetAsteroid >= asteroids.length || !asteroids[ship.targetAsteroid] || isAsteroidBeingMined(ship.targetAsteroid)) {
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
                
                ship.targetAsteroid = closestIndex;
            }
            
            // Move toward the current target
            if (ship.targetAsteroid !== null && ship.targetAsteroid < asteroids.length) {
                const asteroid = asteroids[ship.targetAsteroid];
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
            
            // Move with the asteroid while mining
            const asteroid = asteroids[ship.targetAsteroid];
            const asteroidX = centerX + Math.cos(asteroid.angle) * asteroid.distance;
            const asteroidY = centerY + Math.sin(asteroid.angle) * asteroid.distance;
            
            // Keep ship close to the asteroid
            const dx = asteroidX - ship.x;
            const dy = asteroidY - ship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > asteroid.size + 10) {
                // Move closer to maintain position
                const moveSpeed = speed * 0.5; // Slower movement while mining
                ship.vx = (dx / distance) * moveSpeed;
                ship.vy = (dy / distance) * moveSpeed;
                ship.x += ship.vx;
                ship.y += ship.vy;
            } else {
                // Stay in position relative to asteroid
                ship.vx = 0;
                ship.vy = 0;
            }
            
            ship.miningProgress += deltaTime;
            if (ship.miningProgress >= ship.miningTime) {
                // Mine the asteroid
                if (ship.targetAsteroid !== null && asteroids[ship.targetAsteroid]) {
                    const removedIndex = ship.targetAsteroid;
                    asteroids.splice(removedIndex, 1);
                    playMiningCompleteSound();
                    
                    // Store the money to be paid when returning to Earth
                    ship.cargoValue = (ship.cargoValue || 0) + 100;
                    
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
                // Arrived at Earth - pay out cargo value
                if (ship.cargoValue && ship.cargoValue > 0) {
                    money += ship.cargoValue;
                    trackMoneyIncome(ship.cargoValue);
                    ship.cargoValue = 0;
                    saveGameData(); // Save when money is actually received
                }
                
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
    
    // Check if any auto-miner is mining this asteroid (both ranks)
    for (const ship of helpers.asteroidMiner.ships) {
        if (ship.targetAsteroid === asteroidIndex) {
            return true;
        }
    }
    for (const ship of helpers.asteroidMiner2.ships) {
        if (ship.targetAsteroid === asteroidIndex) {
            return true;
        }
    }
    
    return false;
}

function adjustAutoMinerIndices(removedIndex) {
    // Adjust all auto-miner ship target indices when an asteroid is removed (both ranks)
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
    for (const ship of helpers.asteroidMiner2.ships) {
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
    updateGoldenAsteroids(deltaTime);
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
    
    // Draw golden asteroids in world space
    drawGoldenAsteroids();
    
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
    drawResetConfirmation(); // Draw reset confirmation dialog on top of everything
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