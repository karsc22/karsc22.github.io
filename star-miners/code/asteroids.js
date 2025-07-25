let asteroids = [];
let asteroidsMined = 0;


function drawAsteroid(x, y, asteroid) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(asteroid.rotation || 0);
    
    // Use cached shape if available, otherwise generate one
    if (!asteroid.shape) {
        asteroid.shape = generateAsteroidShape(asteroid.size);
        asteroid.rotation = Math.random() * Math.PI * 2;
        asteroid.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }
    
    // Draw the asteroid shape
    ctx.beginPath();
    const shape = asteroid.shape;
    for (let i = 0; i < shape.length; i++) {
        const point = shape[i];
        if (i === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    }
    ctx.closePath();
    
    // Fill with gradient for depth
    const gradient = ctx.createRadialGradient(-asteroid.size * 0.3, -asteroid.size * 0.3, 0, 0, 0, asteroid.size);
    gradient.addColorStop(0, asteroid.lightColor);
    gradient.addColorStop(1, asteroid.darkColor);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add darker outline
    ctx.strokeStyle = asteroid.outlineColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Add some surface details - craters
    ctx.strokeStyle = asteroid.detailColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < asteroid.craters; i++) {
        const crater = asteroid.craterData[i];
        ctx.beginPath();
        ctx.arc(crater.x, crater.y, crater.size, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // Add surface cracks/lines for more detail
    if (asteroid.cracks) {
        ctx.strokeStyle = asteroid.outlineColor;
        ctx.lineWidth = 0.3;
        ctx.globalAlpha = 0.6;
        for (let crack of asteroid.cracks) {
            ctx.beginPath();
            ctx.moveTo(crack.x1, crack.y1);
            ctx.lineTo(crack.x2, crack.y2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
    
    // Add highlights on some asteroids for mineral veins
    if (asteroid.highlights) {
        ctx.strokeStyle = asteroid.highlightColor;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.7;
        for (let highlight of asteroid.highlights) {
            ctx.beginPath();
            ctx.moveTo(highlight.x1, highlight.y1);
            ctx.lineTo(highlight.x2, highlight.y2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
    
    ctx.restore();
}

function generateAsteroidShape(baseSize) {
    const points = 8 + Math.floor(Math.random() * 8); // 8-15 points
    const angleStep = (Math.PI * 2) / points;
    const shape = [];
    
    for (let i = 0; i < points; i++) {
        const angle = i * angleStep;
        const radiusVariation = 0.6 + Math.random() * 0.8; // Vary radius significantly
        const radius = baseSize * radiusVariation;
        
        // Add some angular variation for more irregular shapes
        const angleVariation = (Math.random() - 0.5) * 0.3;
        const finalAngle = angle + angleVariation;
        
        shape.push({
            x: Math.cos(finalAngle) * radius,
            y: Math.sin(finalAngle) * radius
        });
    }
    
    return shape;
}

function drawAsteroids(deltaTime) {
  asteroids.forEach((asteroid, index) => {
        asteroid.angle += asteroid.speed * deltaTime * 60;
        
        // Update rotation
        if (asteroid.rotationSpeed) {
            asteroid.rotation = (asteroid.rotation || 0) + asteroid.rotationSpeed * deltaTime * 60;
        }
        
        const asteroidX = centerX + Math.cos(asteroid.angle) * asteroid.distance;
        const asteroidY = centerY + Math.sin(asteroid.angle) * asteroid.distance;
        
        // Draw the asteroid using the new system
        drawAsteroid(asteroidX, asteroidY, asteroid);
        
        // Show mining progress if being mined
        if (miningTarget.includes(index)) {
            // Draw mining line from ship to asteroid
            ctx.save();
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(spaceship.x, spaceship.y);
            ctx.lineTo(asteroidX, asteroidY);
            ctx.stroke();
            ctx.restore();

            // Highlight outline
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw progress bar above asteroid
            const barWidth = 30;
            const barHeight = 4;
            const barX = asteroidX - barWidth / 2;
            const barY = asteroidY - asteroid.size - 15;
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Progress
            const i = miningTarget.indexOf(index);
            const progressWidth = barWidth * (miningProgress[i] / getUpgradedMiningTime());
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(barX, barY, progressWidth, barHeight);

            // Border
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    })
}

// Generate asteroid belt
function generateAsteroids() {
    const asteroidBeltInner = 200;
    const asteroidBeltOuter = 260;
    
    // Define asteroid color palettes
    const colorPalettes = [
        // Gray rocky asteroids
        {
            light: '#888888',
            dark: '#444444',
            outline: '#222222',
            detail: '#666666'
        },
        // Brown metallic asteroids
        {
            light: '#AA7744',
            dark: '#664422',
            outline: '#332211',
            detail: '#885533'
        },
        // Reddish iron asteroids
        {
            light: '#AA5555',
            dark: '#663333',
            outline: '#331111',
            detail: '#884444'
        },
        // Bluish ice asteroids
        {
            light: '#6699CC',
            dark: '#335577',
            outline: '#113355',
            detail: '#5588BB'
        }
    ];
    
    for (let i = 0; i < 100; i++) {
        const distance = asteroidBeltInner + Math.random() * (asteroidBeltOuter - asteroidBeltInner);
        const angle = Math.random() * Math.PI * 2;
        const size = 2 + Math.random() * 4; // Slightly larger for better detail visibility
        const speed = 0.0005 + Math.random() * 0.001;
        
        // Pick random color palette
        const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
        
        // Generate crater data
        const craterCount = Math.floor(Math.random() * 4) + 1; // 1-4 craters
        const craterData = [];
        for (let c = 0; c < craterCount; c++) {
            craterData.push({
                x: (Math.random() - 0.5) * size * 1.2,
                y: (Math.random() - 0.5) * size * 1.2,
                size: Math.random() * size * 0.3 + 0.5
            });
        }
        
        // Generate surface cracks (30% chance)
        let cracks = null;
        if (Math.random() < 0.3) {
            const crackCount = Math.floor(Math.random() * 3) + 1;
            cracks = [];
            for (let cr = 0; cr < crackCount; cr++) {
                const angle = Math.random() * Math.PI * 2;
                const length = size * (0.4 + Math.random() * 0.6);
                const startX = (Math.random() - 0.5) * size * 0.8;
                const startY = (Math.random() - 0.5) * size * 0.8;
                cracks.push({
                    x1: startX,
                    y1: startY,
                    x2: startX + Math.cos(angle) * length,
                    y2: startY + Math.sin(angle) * length
                });
            }
        }
        
        // Generate mineral highlights (20% chance)
        let highlights = null;
        let highlightColor = '#FFD700';
        if (Math.random() < 0.2) {
            const highlightCount = Math.floor(Math.random() * 2) + 1;
            highlights = [];
            // Different highlight colors for different asteroid types
            const highlightColors = ['#FFD700', '#66FF66', '#FF6666', '#6666FF'];
            highlightColor = highlightColors[Math.floor(Math.random() * highlightColors.length)];
            
            for (let h = 0; h < highlightCount; h++) {
                const angle = Math.random() * Math.PI * 2;
                const length = size * (0.3 + Math.random() * 0.4);
                const startX = (Math.random() - 0.5) * size * 0.6;
                const startY = (Math.random() - 0.5) * size * 0.6;
                highlights.push({
                    x1: startX,
                    y1: startY,
                    x2: startX + Math.cos(angle) * length,
                    y2: startY + Math.sin(angle) * length
                });
            }
        }
        
        asteroids.push({
            distance: distance,
            angle: angle,
            size: size,
            speed: speed,
            lightColor: palette.light,
            darkColor: palette.dark,
            outlineColor: palette.outline,
            detailColor: palette.detail,
            craters: craterCount,
            craterData: craterData,
            cracks: cracks,
            highlights: highlights,
            highlightColor: highlightColor,
            shape: null, // Will be generated on first draw
            rotation: 0,
            rotationSpeed: 0
        });
    }
}

generateAsteroids();


function checkAsteroidMining(deltaTime) {
    // Don't mine during countdown
    if (countdownActive) return;
    
    // Remove invalid or out-of-range mining targets
    for (let i = miningTarget.length - 1; i >= 0; i--) {
        const idx = miningTarget[i];
        if (idx >= asteroids.length) {
            miningTarget.splice(i, 1);
            miningProgress.splice(i, 1);
            continue;
        }
        const asteroid = asteroids[idx];
        const asteroidX = centerX + Math.cos(asteroid.angle) * asteroid.distance;
        const asteroidY = centerY + Math.sin(asteroid.angle) * asteroid.distance;
        const dx = spaceship.x - asteroidX;
        const dy = spaceship.y - asteroidY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // --- Mining particles while mining ---
        if (distance < asteroid.size + getUpgradedMiningRange()) {
            // Play mining sound occasionally
            if (Math.random() < 0.1) {
                playMiningSound();
            }
            
            // Emit a few mining particles per frame
            for (let p = 0; p < 1; p++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 0.5 + 0.2;
                miningParticles.push({
                    x: asteroidX,
                    y: asteroidY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.4 + Math.random() * 0.3,
                    color: '#FFD700',
                    size: Math.random() * 0.6 + 0.4
                });
            }

            miningProgress[i] += deltaTime;
            if (miningProgress[i] >= getUpgradedMiningTime()) {
                // Play completion sound
                playMiningCompleteSound();
                
                asteroids.splice(idx, 1);
                asteroidsMined++;
                if (challengeActive) {
                    challengeScore++;
                } else {
                    unprocessedAsteroids++;
                }
                // Add mining feedback at ship position
                miningFeedbacks.push({
                    x: spaceship.x,
                    y: spaceship.y,
                    time: 1.0 // seconds to display
                });
                // --- Burst of particles on completion ---
                for (let p = 0; p < 30; p++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 2.5 + 0.5;
                    miningParticles.push({
                        x: asteroidX,
                        y: asteroidY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 0.7 + Math.random() * 0.5,
                        color: Math.random() < 0.5 ? '#FFD700' : '#FFF',
                        size: Math.random() * 2 + 1.5
                    });
                }
                miningTarget.splice(i, 1);
                miningProgress.splice(i, 1);
                // Adjust indices for all remaining miningTarget entries > idx
                for (let j = 0; j < miningTarget.length; j++) {
                    if (miningTarget[j] > idx) miningTarget[j]--;
                }
                // Also adjust auto-miner ship indices
                adjustAutoMinerIndices(idx);
            }
        } else {
            miningTarget.splice(i, 1);
            miningProgress.splice(i, 1);
        }
    }

    // Try to start mining new asteroids if we have slots
    let canMine = getUpgradedMultiMine() - miningTarget.length;
    if (canMine > 0) {
        let found = 0;
        for (let index = 0; index < asteroids.length && found < canMine; index++) {
            if (miningTarget.includes(index)) continue;
            const asteroid = asteroids[index];
            const asteroidX = centerX + Math.cos(asteroid.angle) * asteroid.distance;
            const asteroidY = centerY + Math.sin(asteroid.angle) * asteroid.distance;
            const dx = spaceship.x - asteroidX;
            const dy = spaceship.y - asteroidY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < asteroid.size + getUpgradedMiningRange()) {
                miningTarget.push(index);
                miningProgress.push(0);
                found++;
            }
        }
    }
}
