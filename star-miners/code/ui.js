
function handleMouseDown(event) {
    // Ignore input during countdown
    if (countdownActive) return;
    
    const rect = canvas.getBoundingClientRect();
    const canvasMouseX = event.clientX - rect.left;
    const canvasMouseY = event.clientY - rect.top;
    
    // Handle reset confirmation dialog clicks first (highest priority)
    if (showResetConfirmation && window.resetConfirmationButtons) {
        const buttons = window.resetConfirmationButtons;
        
        if (canvasMouseX >= buttons.yes.x && canvasMouseX <= buttons.yes.x + buttons.yes.width &&
            canvasMouseY >= buttons.yes.y && canvasMouseY <= buttons.yes.y + buttons.yes.height) {
            // User confirmed reset
            resetAllGameData();
            return;
        }
        
        if (canvasMouseX >= buttons.no.x && canvasMouseX <= buttons.no.x + buttons.no.width &&
            canvasMouseY >= buttons.no.y && canvasMouseY <= buttons.no.y + buttons.no.height) {
            // User cancelled reset
            showResetConfirmation = false;
            return;
        }
        
        // Click outside dialog cancels
        showResetConfirmation = false;
        return;
    }
    
    // Check for rescue button click first
    if (needsRescue && 
        canvasMouseX >= rescueButtonArea.x && canvasMouseX <= rescueButtonArea.x + rescueButtonArea.width &&
        canvasMouseY >= rescueButtonArea.y && canvasMouseY <= rescueButtonArea.y + rescueButtonArea.height) {
        startRescue();
        return;
    }
    
    // Check for mute button click first
    if (canvasMouseX >= muteButtonArea.x && canvasMouseX <= muteButtonArea.x + muteButtonArea.width &&
        canvasMouseY >= muteButtonArea.y && canvasMouseY <= muteButtonArea.y + muteButtonArea.height) {
        audioEnabled = !audioEnabled;
        return;
    }
    
    // Check for achievement button click
    if (canvasMouseX >= achievementButtonArea.x && canvasMouseX <= achievementButtonArea.x + achievementButtonArea.width &&
        canvasMouseY >= achievementButtonArea.y && canvasMouseY <= achievementButtonArea.y + achievementButtonArea.height) {
        if (!challengeActive && !countdownActive) {
            showAchievementMenu = !showAchievementMenu;
            achievementMenuTarget = showAchievementMenu ? 1 : 0;
            // Close other menus if open
            if (showAchievementMenu) {
                showChallengeMenu = false;
                challengeMenuTarget = 0;
                showUpgradeMenu = false;
                upgradeMenuTarget = 0;
                showOptionsMenu = false;
                optionsMenuTarget = 0;
                showHireHelpMenu = false;
                hireHelpMenuTarget = 0;
            }
        }
        return;
    }
    
    // Check for challenge button click
    if (canvasMouseX >= challengeButtonArea.x && canvasMouseX <= challengeButtonArea.x + challengeButtonArea.width &&
        canvasMouseY >= challengeButtonArea.y && canvasMouseY <= challengeButtonArea.y + challengeButtonArea.height) {
        if (!challengeActive) { // Only allow opening menu when not in challenge
            showChallengeMenu = !showChallengeMenu;
            challengeMenuTarget = showChallengeMenu ? 1 : 0;
            // Close other menus if open
            if (showChallengeMenu) {
                showAchievementMenu = false;
                achievementMenuTarget = 0;
                showUpgradeMenu = false;
                upgradeMenuTarget = 0;
                showOptionsMenu = false;
                optionsMenuTarget = 0;
                showHireHelpMenu = false;
                hireHelpMenuTarget = 0;
            }
        }
        return;
    }
    
    // Check for upgrade button click
    if (canvasMouseX >= upgradeButtonArea.x && canvasMouseX <= upgradeButtonArea.x + upgradeButtonArea.width &&
        canvasMouseY >= upgradeButtonArea.y && canvasMouseY <= upgradeButtonArea.y + upgradeButtonArea.height) {
        if (!challengeActive) { // Only allow opening menu when not in challenge
            showUpgradeMenu = !showUpgradeMenu;
            upgradeMenuTarget = showUpgradeMenu ? 1 : 0;
            // Close other menus if open
            if (showUpgradeMenu) {
                showAchievementMenu = false;
                achievementMenuTarget = 0;
                showChallengeMenu = false;
                challengeMenuTarget = 0;
                showOptionsMenu = false;
                optionsMenuTarget = 0;
                showHireHelpMenu = false;
                hireHelpMenuTarget = 0;
            }
        }
        return;
    }
    
    // Check for options button click
    if (canvasMouseX >= optionsButtonArea.x && canvasMouseX <= optionsButtonArea.x + optionsButtonArea.width &&
        canvasMouseY >= optionsButtonArea.y && canvasMouseY <= optionsButtonArea.y + optionsButtonArea.height) {
        if (!challengeActive) { // Only allow opening menu when not in challenge
            showOptionsMenu = !showOptionsMenu;
            optionsMenuTarget = showOptionsMenu ? 1 : 0;
            // Close other menus if open
            if (showOptionsMenu) {
                showAchievementMenu = false;
                achievementMenuTarget = 0;
                showChallengeMenu = false;
                challengeMenuTarget = 0;
                showUpgradeMenu = false;
                upgradeMenuTarget = 0;
                showHireHelpMenu = false;
                hireHelpMenuTarget = 0;
            }
        }
        return;
    }
    
    // Check for hire help button click
    if (canvasMouseX >= hireHelpButtonArea.x && canvasMouseX <= hireHelpButtonArea.x + hireHelpButtonArea.width &&
        canvasMouseY >= hireHelpButtonArea.y && canvasMouseY <= hireHelpButtonArea.y + hireHelpButtonArea.height) {
        if (!challengeActive) { // Only allow opening menu when not in challenge
            showHireHelpMenu = !showHireHelpMenu;
            hireHelpMenuTarget = showHireHelpMenu ? 1 : 0;
            // Close other menus if open
            if (showHireHelpMenu) {
                showAchievementMenu = false;
                achievementMenuTarget = 0;
                showChallengeMenu = false;
                challengeMenuTarget = 0;
                showUpgradeMenu = false;
                upgradeMenuTarget = 0;
                showOptionsMenu = false;
                optionsMenuTarget = 0;
            }
        }
        return;
    }
    
    // Check for challenge menu clicks
    if (challengeMenuAnimation > 0 && handleChallengeClick(canvasMouseX, canvasMouseY)) {
        return; // Don't process movement if clicked on challenge
    }
    
    // Check for upgrade menu clicks
    if (upgradeMenuAnimation > 0 && handleUpgradeClick(canvasMouseX, canvasMouseY)) {
        return; // Don't process movement if clicked on upgrade
    }
    
    // Check for options menu clicks
    if (optionsMenuAnimation > 0 && handleOptionsClick(canvasMouseX, canvasMouseY)) {
        return; // Don't process movement if clicked on options
    }
    
    // Check for hire help menu clicks
    if (hireHelpMenuAnimation > 0 && handleHireHelpClick(canvasMouseX, canvasMouseY)) {
        return; // Don't process movement if clicked on hire help
    }
    
    isMouseDown = true;
    
    // Convert screen coordinates to world coordinates
    mouseX = spaceship.x + (canvasMouseX - centerX) / camera.zoom;
    mouseY = spaceship.y + (canvasMouseY - centerY) / camera.zoom;
}

function handleMouseUp(event) {
    isMouseDown = false;
}

function handleMouseMove(event) {
    if (isMouseDown) {
        const rect = canvas.getBoundingClientRect();
        const canvasMouseX = event.clientX - rect.left;
        const canvasMouseY = event.clientY - rect.top;
        
        // Convert screen coordinates to world coordinates
        mouseX = spaceship.x + (canvasMouseX - centerX) / camera.zoom;
        mouseY = spaceship.y + (canvasMouseY - centerY) / camera.zoom;
    }
}


function drawFPS() {
    if (!showFPS) return;
    ctx.save();
    ctx.font = '16px monospace';
    ctx.fillStyle = '#0F0';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${fps}`, 10, 24);
    ctx.restore();
}

function drawFuelBar() {
    const barWidth = 150;
    const barHeight = 20;
    const x = 60;
    const y = 50;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    const fuelPercentage = spaceship.fuel / spaceship.maxFuel;
    const fuelWidth = barWidth * fuelPercentage;
    
    ctx.fillStyle = fuelPercentage > 0.3 ? '#4CAF50' : '#F44336';
    ctx.fillRect(x, y, fuelWidth, barHeight);
    
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Fuel: ${Math.round(spaceship.fuel)}%`, x, y + 35);
}

function drawAchievementBanners() {
    achievementQueue.forEach((banner, index) => {
        const achievement = banner.achievement;
        const animTime = banner.animationTime;
        const totalTime = 4;
        const fadeTime = 0.5;
        
        // Calculate animation values
        let alpha = 1;
        let slideOffset = 0;
        
        if (animTime < fadeTime) {
            // Slide in from top
            alpha = animTime / fadeTime;
            slideOffset = -100 * (1 - alpha);
        } else if (banner.displayTime < fadeTime) {
            // Fade out
            alpha = banner.displayTime / fadeTime;
        }
        
        // Banner dimensions and position
        const bannerWidth = 400;
        const bannerHeight = 80;
        const x = canvas.width / 2 - bannerWidth / 2;
        const y = 50 + index * 90 + slideOffset;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Shiny gold background with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + bannerHeight);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FF8C00');
        ctx.fillStyle = gradient;
        
        // Add glow effect
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.fillRect(x, y, bannerWidth, bannerHeight);
        ctx.shadowBlur = 0;
        
        // Border
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, bannerWidth, bannerHeight);
        
        // Achievement unlocked text
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ACHIEVEMENT UNLOCKED!', x + bannerWidth / 2, y + 20);
        
        // Achievement icon
        ctx.font = '24px Arial';
        ctx.fillText(achievement.icon, x + 40, y + 50);
        
        // Achievement name and description
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(achievement.name, x + 70, y + 42);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#333';
        ctx.fillText(achievement.description, x + 70, y + 60);
        
        ctx.restore();
    });
}

function drawCountdown() {
    if (!countdownActive || !countdownText) return;
    
    ctx.save();
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    
    // Add glow effect
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    
    ctx.strokeText(countdownText, x, y);
    ctx.fillText(countdownText, x, y);
    
    ctx.restore();
}

function drawRescueShip() {
    if (!rescueShip) return;
    
    ctx.save();
    ctx.translate(rescueShip.x, rescueShip.y);
    ctx.rotate(rescueShip.angle);
    
    const size = rescueShip.size;
    
    // Rescue ship body (different color scheme)
    ctx.beginPath();
    ctx.moveTo(0, -size * 2.5);
    ctx.lineTo(-size * 0.8, -size * 1.2);
    ctx.lineTo(-size * 0.8, size * 1.2);
    ctx.lineTo(0, size * 1.5);
    ctx.lineTo(size * 0.8, size * 1.2);
    ctx.lineTo(size * 0.8, -size * 1.2);
    ctx.closePath();
    ctx.fillStyle = '#FF6B35'; // Orange rescue color
    ctx.fill();
    ctx.strokeStyle = '#FF4500';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Rescue ship cockpit
    ctx.beginPath();
    ctx.moveTo(0, -size * 2.5);
    ctx.lineTo(-size * 0.5, -size * 1.5);
    ctx.lineTo(size * 0.5, -size * 1.5);
    ctx.closePath();
    ctx.fillStyle = '#00BFFF'; // Bright blue
    ctx.fill();
    ctx.stroke();
    
    // Emergency lights
    const lightIntensity = (Math.sin(Date.now() * 0.02) + 1) * 0.5;
    ctx.beginPath();
    ctx.arc(-size * 0.6, -size * 0.5, size * 0.2, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255, 0, 0, ${0.5 + lightIntensity * 0.5})`;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(size * 0.6, -size * 0.5, size * 0.2, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255, 0, 0, ${0.5 + lightIntensity * 0.5})`;
    ctx.fill();
    
    ctx.restore();
}

function drawTowLine() {
    if (!towLine || !rescueShip || rescueState !== 'towing') return;
    
    // Draw tow line between rescue ship and player
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(rescueShip.x, rescueShip.y);
    ctx.lineTo(spaceship.x, spaceship.y);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Add some tension effect
    const midX = (rescueShip.x + spaceship.x) / 2;
    const midY = (rescueShip.y + spaceship.y) / 2;
    const tension = Math.sin(Date.now() * 0.01) * 3;
    
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rescueShip.x, rescueShip.y);
    ctx.quadraticCurveTo(midX, midY + tension, spaceship.x, spaceship.y);
    ctx.stroke();
}

function drawRescueStatus() {
    if (rescueState === 'none') return;
    
    ctx.fillStyle = '#FF4500';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    
    let statusText = '';
    switch (rescueState) {
        case 'dispatched':
        case 'approaching':
            statusText = '🚨 RESCUE SHIP DISPATCHED 🚨';
            break;
        case 'connected':
            statusText = '🔗 CONNECTING TOW LINE 🔗';
            break;
        case 'towing':
            statusText = '⚙️ TOWING TO EARTH ⚙️';
            break;
        case 'completed':
            statusText = '✅ RESCUE COMPLETE ✅';
            break;
    }
    
    // Draw with glow effect
    ctx.shadowColor = '#FF4500';
    ctx.shadowBlur = 10;
    ctx.fillText(statusText, canvas.width / 2, 200);
    ctx.shadowBlur = 0;
}

function drawAsteroidCreatorShip() {
    // Draw all asteroid creator ships (rank 1)
    for (const ship of helpers.asteroidCreator.ships) {
        drawSingleAsteroidCreatorShip(ship);
    }
    // Draw all asteroid creator ships (rank 2)
    for (const ship of helpers.asteroidCreator2.ships) {
        drawSingleAsteroidCreatorShip(ship);
    }
}

function drawSingleAsteroidCreatorShip(ship) {
    if (!ship) return;
    
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    
    const size = ship.size;
    
    // Industrial mining ship - larger and more angular
    ctx.beginPath();
    ctx.moveTo(0, -size * 2);
    ctx.lineTo(-size * 1.2, -size);
    ctx.lineTo(-size * 1.2, size);
    ctx.lineTo(-size * 0.6, size * 1.8);
    ctx.lineTo(size * 0.6, size * 1.8);
    ctx.lineTo(size * 1.2, size);
    ctx.lineTo(size * 1.2, -size);
    ctx.closePath();
    // Use different colors for rank 2
    const isRank2 = ship.rank === 2;
    ctx.fillStyle = isRank2 ? '#9932CC' : '#FFB347'; // Purple for rank 2, orange for rank 1
    ctx.fill();
    ctx.strokeStyle = isRank2 ? '#4B0082' : '#FF8C00'; // Dark purple for rank 2, dark orange for rank 1
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Mining equipment pods
    ctx.beginPath();
    ctx.rect(-size * 0.8, size * 0.2, size * 0.6, size * 0.8);
    ctx.fillStyle = '#CD853F';
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.rect(size * 0.2, size * 0.2, size * 0.6, size * 0.8);
    ctx.fillStyle = '#CD853F';
    ctx.fill();
    ctx.stroke();
    
    // Cockpit
    ctx.beginPath();
    ctx.moveTo(0, -size * 2);
    ctx.lineTo(-size * 0.6, -size * 1.2);
    ctx.lineTo(size * 0.6, -size * 1.2);
    ctx.closePath();
    ctx.fillStyle = '#87CEEB';
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
    
    // Draw mining beam when mining (outside of ship transformation)
    if (ship.state === 'mining' && ship.targetPlanet) {
        ctx.save();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.01) * 0.4;
        
        // Calculate planet world position
        const planetX = centerX + Math.cos(ship.targetPlanet.angle) * ship.targetPlanet.distance;
        const planetY = centerY + Math.sin(ship.targetPlanet.angle) * ship.targetPlanet.distance;
        
        // Draw beam from ship to planet (both in world coordinates)
        ctx.beginPath();
        ctx.moveTo(ship.x, ship.y);
        ctx.lineTo(planetX, planetY);
        ctx.stroke();
        ctx.restore();
    }
}

function drawAsteroidMinerShip() {
    // Draw all asteroid miner ships (rank 1)
    for (const ship of helpers.asteroidMiner.ships) {
        drawSingleAsteroidMinerShip(ship);
    }
    // Draw all asteroid miner ships (rank 2)
    for (const ship of helpers.asteroidMiner2.ships) {
        drawSingleAsteroidMinerShip(ship);
    }
}

function drawSingleAsteroidMinerShip(ship) {
    if (!ship) return;
    
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    
    const size = ship.size;
    
    // Sleek mining ship - smaller and more agile
    ctx.beginPath();
    ctx.moveTo(0, -size * 2.2);
    ctx.lineTo(-size * 0.9, -size * 0.8);
    ctx.lineTo(-size * 0.9, size * 0.8);
    ctx.lineTo(-size * 0.3, size * 1.5);
    ctx.lineTo(size * 0.3, size * 1.5);
    ctx.lineTo(size * 0.9, size * 0.8);
    ctx.lineTo(size * 0.9, -size * 0.8);
    ctx.closePath();
    // Use different colors for rank 2
    const isRank2 = ship.rank === 2;
    ctx.fillStyle = isRank2 ? '#FF6347' : '#32CD32'; // Red for rank 2, green for rank 1
    ctx.fill();
    ctx.strokeStyle = isRank2 ? '#8B0000' : '#228B22'; // Dark red for rank 2, dark green for rank 1
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Mining drill
    ctx.beginPath();
    ctx.rect(-size * 0.2, size * 0.8, size * 0.4, size * 0.7);
    ctx.fillStyle = '#696969';
    ctx.fill();
    ctx.stroke();
    
    // Side thrusters
    ctx.beginPath();
    ctx.ellipse(-size * 0.9, 0, size * 0.3, size * 0.8, 0, 0, 2 * Math.PI);
    ctx.fillStyle = '#4169E1';
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(size * 0.9, 0, size * 0.3, size * 0.8, 0, 0, 2 * Math.PI);
    ctx.fillStyle = '#4169E1';
    ctx.fill();
    ctx.stroke();
    
    // Cockpit
    ctx.beginPath();
    ctx.moveTo(0, -size * 2.2);
    ctx.lineTo(-size * 0.5, -size * 1.4);
    ctx.lineTo(size * 0.5, -size * 1.4);
    ctx.closePath();
    ctx.fillStyle = '#87CEEB';
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
    
    // Draw mining laser when mining (outside of ship transformation)
    if (ship.state === 'mining' && ship.targetAsteroid !== null && asteroids[ship.targetAsteroid]) {
        ctx.save();
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.02) * 0.3;
        
        // Calculate asteroid world position
        const asteroid = asteroids[ship.targetAsteroid];
        const asteroidX = centerX + Math.cos(asteroid.angle) * asteroid.distance;
        const asteroidY = centerY + Math.sin(asteroid.angle) * asteroid.distance;
        
        // Draw laser from ship to asteroid (both in world coordinates)
        ctx.beginPath();
        ctx.moveTo(ship.x, ship.y);
        ctx.lineTo(asteroidX, asteroidY);
        ctx.stroke();
        ctx.restore();
    }
}

function drawSpawnedAsteroids() {
    // Draw asteroids moving from planets to belt
    for (const spawnedAst of spawnedAsteroids) {
        drawAsteroid(spawnedAst.x, spawnedAst.y, spawnedAst);
    }
}

function drawGoldenAsteroid(asteroid) {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.rotation || 0);
    
    const size = asteroid.size;
    
    // Generate shape if not cached
    if (!asteroid.shape) {
        const points = 12 + Math.floor(Math.random() * 6); // 12-17 points for more detail
        const angleStep = (Math.PI * 2) / points;
        asteroid.shape = [];
        
        for (let i = 0; i < points; i++) {
            const angle = i * angleStep;
            const radiusVariation = 0.7 + Math.random() * 0.6; // More consistent than regular asteroids
            const radius = size * radiusVariation;
            
            const angleVariation = (Math.random() - 0.5) * 0.2;
            const finalAngle = angle + angleVariation;
            
            asteroid.shape.push({
                x: Math.cos(finalAngle) * radius,
                y: Math.sin(finalAngle) * radius
            });
        }
    }
    
    // Draw the golden asteroid shape
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
    
    // Golden gradient fill
    const gradient = ctx.createRadialGradient(-size * 0.3, -size * 0.3, 0, 0, 0, size);
    gradient.addColorStop(0, '#FFD700'); // Bright gold
    gradient.addColorStop(0.5, '#FFA500'); // Orange-gold
    gradient.addColorStop(1, '#B8860B'); // Dark goldenrod
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Bright golden outline
    ctx.strokeStyle = '#FFFF00'; // Bright yellow outline
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add sparkle effects
    const sparkleCount = 8;
    for (let i = 0; i < sparkleCount; i++) {
        const sparkleAngle = (i / sparkleCount) * Math.PI * 2 + Date.now() * 0.005;
        const sparkleRadius = size * 0.6 + Math.sin(Date.now() * 0.01 + i) * size * 0.2;
        const sparkleX = Math.cos(sparkleAngle) * sparkleRadius;
        const sparkleY = Math.sin(sparkleAngle) * sparkleRadius;
        
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 1 + Math.sin(Date.now() * 0.02 + i) * 0.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
    }
    
    ctx.restore();
    
    // Draw progress bar if being mined (outside of rotation transformation)
    if (asteroid.beingMined) {
        const barWidth = size * 2;
        const barHeight = 6;
        const barX = asteroid.x - barWidth / 2;
        const barY = asteroid.y - size - 20;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Progress
        const progressWidth = barWidth * (asteroid.miningProgress / asteroid.miningTime);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(barX, barY, progressWidth, barHeight);
        
        // Border
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

function drawGoldenAsteroids() {
    // Draw all golden asteroids
    for (const asteroid of goldenAsteroids) {
        drawGoldenAsteroid(asteroid);
    }
}

function drawResourceCounters() {
    ctx.fillStyle = '#FFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    if (challengeActive) {
        ctx.fillText(`Score: ${challengeScore}`, 60, 100);
        
        if (gameMode === 'time-trial') {
            ctx.fillText(`Time: ${Math.ceil(challengeTimer)}s`, 60, 120);
        } else if (gameMode === 'fuel-endurance') {
            ctx.fillText(`Time: ${Math.floor(challengeTimer)}s`, 60, 120);
        }
        
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`High Score: ${gameMode === 'time-trial' ? highScores.timeTrial : highScores.fuelEndurance}`, 60, 140);
    } else {
        ctx.fillText(`Money: ${getFormattedMoneyDisplay()}`, 60, 100);
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`Gold: ${gold}`, 60, 120);
        ctx.fillStyle = '#FFF';
        ctx.fillText(`Asteroids Mined: ${asteroidsMined}`, 60, 140);
        
        // Show asteroid count
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText(`Asteroids: ${asteroids.length}/100`, 60, 160);
        
        if (unprocessedAsteroids > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`Unprocessed: ${unprocessedAsteroids} (Go to Earth!)`, 60, 180);
        }
    }
}

function drawMuteButton() {
    const buttonX = muteButtonArea.x;
    const buttonY = muteButtonArea.y;
    const buttonWidth = muteButtonArea.width;
    const buttonHeight = muteButtonArea.height;
    
    // Button background
    ctx.fillStyle = audioEnabled ? 'rgba(70, 150, 70, 0.8)' : 'rgba(150, 70, 70, 0.8)';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Button text
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(audioEnabled ? '🔊' : '🔇', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 4);
}

function drawRescueButton() {
    if (!needsRescue || helpers.rescueHelper.hired) return;
    
    const buttonX = rescueButtonArea.x;
    const buttonY = rescueButtonArea.y;
    const buttonWidth = rescueButtonArea.width;
    const buttonHeight = rescueButtonArea.height;
    
    // Pulsing emergency button
    const pulseIntensity = (Math.sin(Date.now() * 0.01) + 1) * 0.5;
    
    // Button background - emergency red
    ctx.fillStyle = `rgba(255, ${50 + pulseIntensity * 100}, ${50 + pulseIntensity * 100}, 0.9)`;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Glowing border
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2 + pulseIntensity * 2;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Emergency text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🚨 REQUEST RESCUE 🚨', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 - 5);
    ctx.font = '12px Arial';
    ctx.fillText('OUT OF FUEL', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 10);
}

function drawAchievementButton() {
    const buttonX = achievementButtonArea.x;
    const buttonY = achievementButtonArea.y;
    const buttonWidth = achievementButtonArea.width;
    const buttonHeight = achievementButtonArea.height;
    
    // Button background
    ctx.fillStyle = showAchievementMenu ? 'rgba(255, 215, 0, 0.8)' : 'rgba(70, 70, 70, 0.8)';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Button text
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ACHIEVEMENTS', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 4);
    
    // Show notification dot if there are recent achievements
    const recentAchievements = Object.entries(achievements).filter(([id, data]) => {
        return data.unlocked && Date.now() - data.timestamp < 300000; // 5 minutes
    });
    
    if (recentAchievements.length > 0) {
        ctx.beginPath();
        ctx.arc(buttonX + buttonWidth - 5, buttonY + 5, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#FF4444';
        ctx.fill();
    }
}

function drawChallengeButton() {
    const buttonX = challengeButtonArea.x;
    const buttonY = challengeButtonArea.y;
    const buttonWidth = challengeButtonArea.width;
    const buttonHeight = challengeButtonArea.height;
    
    // Button background
    ctx.fillStyle = showChallengeMenu ? 'rgba(255, 150, 100, 0.8)' : 'rgba(70, 70, 70, 0.8)';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Button text
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CHALLENGE', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
}

function drawUpgradeButton() {
    const buttonX = upgradeButtonArea.x;
    const buttonY = upgradeButtonArea.y;
    const buttonWidth = upgradeButtonArea.width;
    const buttonHeight = upgradeButtonArea.height;
    
    // Button background
    ctx.fillStyle = showUpgradeMenu ? 'rgba(100, 150, 255, 0.8)' : 'rgba(70, 70, 70, 0.8)';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Button text
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('UPGRADES', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
}

function drawOptionsButton() {
    const buttonX = optionsButtonArea.x;
    const buttonY = optionsButtonArea.y;
    const buttonWidth = optionsButtonArea.width;
    const buttonHeight = optionsButtonArea.height;
    
    // Button background
    ctx.fillStyle = showOptionsMenu ? 'rgba(150, 100, 255, 0.8)' : 'rgba(70, 70, 70, 0.8)';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Button text
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('OPTIONS', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
}

function drawHireHelpButton() {
    const buttonX = hireHelpButtonArea.x;
    const buttonY = hireHelpButtonArea.y;
    const buttonWidth = hireHelpButtonArea.width;
    const buttonHeight = hireHelpButtonArea.height;
    
    // Button background
    ctx.fillStyle = showHireHelpMenu ? 'rgba(100, 255, 150, 0.8)' : 'rgba(70, 70, 70, 0.8)';
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // Button text
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HIRE HELP', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
}

function drawUpgradeMenu() {
    if (upgradeMenuAnimation <= 0) return;
    
    const menuWidth = 450; // Increased from 400
    const menuHeight = 500; // Increased from 400
    
    // Calculate animated position - slide from button
    const buttonCenterX = upgradeButtonArea.x + upgradeButtonArea.width / 2;
    const buttonCenterY = upgradeButtonArea.y + upgradeButtonArea.height / 2;
    
    const targetX = canvas.width / 2 - menuWidth / 2;
    const targetY = canvas.height / 2 - menuHeight / 2;
    
    const animEase = upgradeMenuAnimation * upgradeMenuAnimation * (3 - 2 * upgradeMenuAnimation); // smooth easing
    const menuX = buttonCenterX + (targetX - buttonCenterX) * animEase;
    const menuY = buttonCenterY + (targetY - buttonCenterY) * animEase;
    
    const scale = 0.3 + 0.7 * animEase;
    
    ctx.save();
    ctx.translate(menuX + menuWidth / 2, menuY + menuHeight / 2);
    ctx.scale(scale, scale);
    ctx.translate(-menuWidth / 2, -menuHeight / 2);
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, menuWidth, menuHeight);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(0, 0, menuWidth, menuHeight);
    
    // Title
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('UPGRADES', menuWidth / 2, 40);
    
    // Upgrades
    const upgradeData = [
        { key: 'fuelTank', name: 'Fuel Tank', desc: `+50 Max Fuel (${upgrades.fuelTank}/5)` },
        { key: 'fuelEfficiency', name: 'Fuel Efficiency', desc: `-20% Fuel Usage (${upgrades.fuelEfficiency}/5)` },
        { key: 'miningSpeed', name: 'Mining Speed', desc: `-0.5s Mining Time (${upgrades.miningSpeed}/5)` },
        { key: 'thrustPower', name: 'Thrust Power', desc: `+50% Thrust (${upgrades.thrustPower}/5)` },
        { key: 'miningRange', name: 'Mining Range', desc: `+5 Range (${upgrades.miningRange}/5)` },
        { key: 'multiMine', name: 'Multi-Mine', desc: `+1 Asteroid at once (${upgrades.multiMine}/5)` }
    ];
    
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    upgradeData.forEach((upgrade, index) => {
        const y = 80 + index * 70; // Increased spacing from 80 to 70
        const cost = getUpgradeCost(upgrade.key);
        const currentLevel = upgrades[upgrade.key];
        const isMaxed = currentLevel >= 5;
        const canAfford = canAffordUpgrade(upgrade.key);
        
        // Upgrade box - different colors for maxed upgrades
        if (isMaxed) {
            ctx.fillStyle = 'rgba(100, 100, 0, 0.3)'; // Gold for maxed
            ctx.strokeStyle = '#FFD700';
        } else {
            ctx.fillStyle = canAfford ? 'rgba(0, 100, 0, 0.3)' : 'rgba(100, 0, 0, 0.3)';
            ctx.strokeStyle = canAfford ? '#0F0' : '#F00';
        }
        ctx.fillRect(20, y, menuWidth - 40, 60);
        ctx.strokeRect(20, y, menuWidth - 40, 60);
      
        // Text
        ctx.fillStyle = '#FFF';
        ctx.fillText(upgrade.name, 30, y + 20);
        ctx.fillText(upgrade.desc, 30, y + 35);
        
        // Show different text for maxed upgrades
        if (isMaxed) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText('MAX LEVEL', 30, y + 50);
        } else {
            ctx.fillStyle = '#FFF';
            const currency = getUpgradeCurrency(upgrade.key);
            const currencySymbol = currency === 'gold' ? '' : '$';
            const currencyName = currency === 'gold' ? ' Gold' : '';
            ctx.fillText(`Cost: ${currencySymbol}${cost}${currencyName}`, 30, y + 50);
        }
      
        // Store click area for later (transform back to screen coordinates)
        const screenX = menuX + 20;
        const screenY = menuY + y;
        upgrade.clickArea = { x: screenX, y: screenY, width: menuWidth - 40, height: 60 };
    });
    
    // Debug mode reset button
    if (debugMode) {
        const resetButtonY = menuHeight - 80;
        const resetButtonHeight = 40;
        const resetButtonWidth = 200;
        const resetButtonX = (menuWidth - resetButtonWidth) / 2;
        
        // Reset button background
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.fillRect(resetButtonX, resetButtonY, resetButtonWidth, resetButtonHeight);
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(resetButtonX, resetButtonY, resetButtonWidth, resetButtonHeight);
        
        // Reset button text
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('RESET ALL UPGRADES', menuWidth / 2, resetButtonY + resetButtonHeight / 2 + 5);
        
        // Store reset button click area
        const resetButtonArea = {
            x: menuX + resetButtonX,
            y: menuY + resetButtonY,
            width: resetButtonWidth,
            height: resetButtonHeight
        };
        window.currentResetButtonArea = resetButtonArea;
    }
    
    // Instructions
    ctx.fillStyle = '#FFD700';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    if (debugMode) {
        ctx.fillText('DEBUG MODE: Upgrades are FREE!', menuWidth / 2, menuHeight - 50);
        ctx.fillText('Click on upgrades to purchase', menuWidth / 2, menuHeight - 30);
    } else {
        ctx.fillText('Click on upgrades to purchase', menuWidth / 2, menuHeight - 20);
    }
    
    ctx.restore();
    
    // Store upgrade data for click handling
    window.currentUpgradeData = upgradeData;
}

function drawChallengeMenu() {
    if (challengeMenuAnimation <= 0) return;
    
    const menuWidth = 400;
    const menuHeight = 350;
    
    // Calculate animated position - slide from button
    const buttonCenterX = challengeButtonArea.x + challengeButtonArea.width / 2;
    const buttonCenterY = challengeButtonArea.y + challengeButtonArea.height / 2;
    
    const targetX = canvas.width / 2 - menuWidth / 2;
    const targetY = canvas.height / 2 - menuHeight / 2;
    
    const animEase = challengeMenuAnimation * challengeMenuAnimation * (3 - 2 * challengeMenuAnimation);
    const menuX = buttonCenterX + (targetX - buttonCenterX) * animEase;
    const menuY = buttonCenterY + (targetY - buttonCenterY) * animEase;
    
    const scale = 0.3 + 0.7 * animEase;
    
    ctx.save();
    ctx.translate(menuX + menuWidth / 2, menuY + menuHeight / 2);
    ctx.scale(scale, scale);
    ctx.translate(-menuWidth / 2, -menuHeight / 2);
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, menuWidth, menuHeight);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(0, 0, menuWidth, menuHeight);
    
    // Title
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CHALLENGE MODES', menuWidth / 2, 40);
    
    // Challenge options
    const challenges = [
        {
            key: 'time-trial',
            name: 'Time Trial',
            desc: 'Mine as many asteroids as possible in 60 seconds',
            record: `Best: ${highScores.timeTrial} asteroids`
        },
        {
            key: 'fuel-endurance',
            name: 'Fuel Endurance',
            desc: 'Mine asteroids without refueling until fuel runs out',
            record: `Best: ${highScores.fuelEndurance} asteroids`
        }
    ];
    
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    challenges.forEach((challenge, index) => {
        const y = 80 + index * 100;
        
        // Challenge box
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.fillRect(20, y, menuWidth - 40, 80);
        ctx.strokeStyle = '#FFF';
        ctx.strokeRect(20, y, menuWidth - 40, 80);
        
        // Text
        ctx.fillStyle = '#FFF';
        ctx.fillText(challenge.name, 30, y + 25);
        ctx.fillText(challenge.desc, 30, y + 45);
        ctx.fillStyle = '#FFD700';
        ctx.fillText(challenge.record, 30, y + 65);
        
        // Store click area
        challenge.clickArea = { x: menuX + 20, y: menuY + y, width: menuWidth - 40, height: 80 };
    });
    
    // Instructions
    ctx.fillStyle = '#FFD700';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click on a challenge mode to start', menuWidth / 2, menuHeight - 20);
    
    ctx.restore();
    
    // Store challenge data for click handling
    window.currentChallengeData = challenges;
}

function drawAchievementMenu() {
    if (achievementMenuAnimation <= 0) return;
    
    const menuWidth = 500;
    const menuHeight = 600;
    
    // Calculate animated position
    const buttonCenterX = achievementButtonArea.x + achievementButtonArea.width / 2;
    const buttonCenterY = achievementButtonArea.y + achievementButtonArea.height / 2;
    
    const targetX = canvas.width / 2 - menuWidth / 2;
    const targetY = canvas.height / 2 - menuHeight / 2;
    
    const animEase = achievementMenuAnimation * achievementMenuAnimation * (3 - 2 * achievementMenuAnimation);
    const menuX = buttonCenterX + (targetX - buttonCenterX) * animEase;
    const menuY = buttonCenterY + (targetY - buttonCenterY) * animEase;
    
    const scale = 0.3 + 0.7 * animEase;
    
    ctx.save();
    ctx.translate(menuX + menuWidth / 2, menuY + menuHeight / 2);
    ctx.scale(scale, scale);
    ctx.translate(-menuWidth / 2, -menuHeight / 2);
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, menuWidth, menuHeight);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, menuWidth, menuHeight);
    
    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ACHIEVEMENTS', menuWidth / 2, 40);
    
    // Achievement progress
    const totalAchievements = Object.keys(ACHIEVEMENTS).length;
    const unlockedCount = Object.values(achievements).filter(a => a.unlocked).length;
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFF';
    ctx.fillText(`${unlockedCount}/${totalAchievements} Unlocked`, menuWidth / 2, 65);
    
    // Scrollable achievement list
    const startY = 80;
    const itemHeight = 60;
    let currentY = startY;
    
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    
    Object.entries(ACHIEVEMENTS).forEach(([id, achievement], index) => {
        const isUnlocked = achievements[id] && achievements[id].unlocked;
        const y = currentY + index * itemHeight;
        
        if (y > menuHeight - 50) return; // Don't draw if off-screen
        
        // Achievement box
        ctx.fillStyle = isUnlocked ? 'rgba(255, 215, 0, 0.2)' : 'rgba(100, 100, 100, 0.2)';
        ctx.fillRect(20, y, menuWidth - 40, itemHeight - 5);
        ctx.strokeStyle = isUnlocked ? '#FFD700' : '#666';
        ctx.strokeRect(20, y, menuWidth - 40, itemHeight - 5);
        
        // Icon
        ctx.font = '20px Arial';
        ctx.fillStyle = isUnlocked ? '#FFD700' : '#666';
        ctx.textAlign = 'center';
        ctx.fillText(achievement.icon, 50, y + 30);
        
        // Name and description
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = isUnlocked ? '#FFF' : '#888';
        ctx.textAlign = 'left';
        ctx.fillText(achievement.name, 80, y + 22);
        
        ctx.font = '12px Arial';
        ctx.fillStyle = isUnlocked ? '#CCC' : '#666';
        ctx.fillText(achievement.description, 80, y + 38);
        
        // Unlock date
        if (isUnlocked && achievements[id].timestamp) {
            const date = new Date(achievements[id].timestamp);
            ctx.font = '10px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'right';
            ctx.fillText(`Unlocked: ${date.toLocaleDateString()}`, menuWidth - 30, y + 45);
        }
    });
    
    ctx.restore();
}

function drawOptionsMenu() {
    if (optionsMenuAnimation <= 0) return;
    
    const menuWidth = 400;
    const menuHeight = 350; // Increased height for reset button
    
    // Calculate animated position
    const buttonCenterX = optionsButtonArea.x + optionsButtonArea.width / 2;
    const buttonCenterY = optionsButtonArea.y + optionsButtonArea.height / 2;
    
    const targetX = canvas.width / 2 - menuWidth / 2;
    const targetY = canvas.height / 2 - menuHeight / 2;
    
    const animEase = optionsMenuAnimation * optionsMenuAnimation * (3 - 2 * optionsMenuAnimation);
    const menuX = buttonCenterX + (targetX - buttonCenterX) * animEase;
    const menuY = buttonCenterY + (targetY - buttonCenterY) * animEase;
    
    const scale = 0.3 + 0.7 * animEase;
    
    ctx.save();
    ctx.translate(menuX + menuWidth / 2, menuY + menuHeight / 2);
    ctx.scale(scale, scale);
    ctx.translate(-menuWidth / 2, -menuHeight / 2);
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, menuWidth, menuHeight);
    ctx.strokeStyle = '#9966FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, menuWidth, menuHeight);
    
    // Title
    ctx.fillStyle = '#9966FF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('OPTIONS', menuWidth / 2, 40);
    
    // Options
    const optionData = [
        { key: 'soundEnabled', name: 'Sound Effects', desc: 'Enable/disable all sound effects' },
        { key: 'showPlanetIndicators', name: 'Planet Indicators', desc: 'Show arrows pointing to off-screen planets' },
        { key: 'showMinimap', name: 'Minimap', desc: 'Show minimap in bottom-right corner' }
    ];
    
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    optionData.forEach((option, index) => {
        const y = 80 + index * 70;
        const isEnabled = gameOptions[option.key];
        
        // Option box
        ctx.fillStyle = isEnabled ? 'rgba(0, 150, 0, 0.3)' : 'rgba(150, 0, 0, 0.3)';
        ctx.fillRect(20, y, menuWidth - 40, 60);
        ctx.strokeStyle = isEnabled ? '#0F0' : '#F00';
        ctx.strokeRect(20, y, menuWidth - 40, 60);
        
        // Text
        ctx.fillStyle = '#FFF';
        ctx.fillText(option.name, 30, y + 20);
        ctx.fillText(option.desc, 30, y + 35);
        
        // Status
        ctx.fillStyle = isEnabled ? '#0F0' : '#F00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(isEnabled ? 'ON' : 'OFF', menuWidth - 30, y + 20);
        ctx.textAlign = 'left';
        ctx.font = '16px Arial';
        
        // Store click area
        option.clickArea = { x: menuX + 20, y: menuY + y, width: menuWidth - 40, height: 60 };
    });
    
    // Reset All button
    const resetButtonY = 290;
    const resetButtonHeight = 40;
    const resetButtonWidth = menuWidth - 40;
    const resetButtonX = 20;
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fillRect(resetButtonX, resetButtonY, resetButtonWidth, resetButtonHeight);
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(resetButtonX, resetButtonY, resetButtonWidth, resetButtonHeight);
    
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ RESET ALL GAME DATA ⚠️', menuWidth / 2, resetButtonY + 25);
    
    // Store reset button click area
    const resetButtonArea = {
        x: menuX + resetButtonX,
        y: menuY + resetButtonY,
        width: resetButtonWidth,
        height: resetButtonHeight
    };
    window.currentResetButtonArea = resetButtonArea;
    
    // Instructions
    ctx.fillStyle = '#9966FF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click on options to toggle them', menuWidth / 2, resetButtonY - 10);
    
    ctx.restore();
    
    // Store option data for click handling
    window.currentOptionData = optionData;
}

function handleOptionsClick(x, y) {
    if (optionsMenuAnimation <= 0 || !window.currentOptionData) return false;
    
    // Check for reset button click
    if (window.currentResetButtonArea) {
        const resetArea = window.currentResetButtonArea;
        if (x >= resetArea.x && x <= resetArea.x + resetArea.width &&
            y >= resetArea.y && y <= resetArea.y + resetArea.height) {
            
            // Show confirmation dialog
            showResetConfirmation = true;
            return true;
        }
    }
    
    for (const option of window.currentOptionData) {
        const area = option.clickArea;
        if (x >= area.x && x <= area.x + area.width &&
            y >= area.y && y <= area.y + area.height) {
            
            // Toggle the option
            gameOptions[option.key] = !gameOptions[option.key];
            
            // Apply changes immediately
            if (option.key === 'soundEnabled') {
                audioEnabled = gameOptions.soundEnabled;
            }
            
            // Save options to localStorage
            saveOptions();
            
            return true;
        }
    }
    return false;
}

function drawHireHelpMenu() {
    if (hireHelpMenuAnimation <= 0) return;
    
    const menuWidth = 450;
    const menuHeight = 500; // Increased height for rank 2 helpers
    
    // Calculate animated position
    const buttonCenterX = hireHelpButtonArea.x + hireHelpButtonArea.width / 2;
    const buttonCenterY = hireHelpButtonArea.y + hireHelpButtonArea.height / 2;
    
    const targetX = canvas.width / 2 - menuWidth / 2;
    const targetY = canvas.height / 2 - menuHeight / 2;
    
    const animEase = hireHelpMenuAnimation * hireHelpMenuAnimation * (3 - 2 * hireHelpMenuAnimation);
    const menuX = buttonCenterX + (targetX - buttonCenterX) * animEase;
    const menuY = buttonCenterY + (targetY - buttonCenterY) * animEase;
    
    const scale = 0.3 + 0.7 * animEase;
    
    ctx.save();
    ctx.translate(menuX + menuWidth / 2, menuY + menuHeight / 2);
    ctx.scale(scale, scale);
    ctx.translate(-menuWidth / 2, -menuHeight / 2);
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, menuWidth, menuHeight);
    ctx.strokeStyle = '#66FF99';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, menuWidth, menuHeight);
    
    // Title
    ctx.fillStyle = '#66FF99';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HIRE HELP', menuWidth / 2, 40);
    
    // Helper options
    const helperData = [
        { 
            key: 'asteroidCreator', 
            name: 'Asteroid Creator', 
            desc: 'Mines planets to create asteroids (20 min)', 
            status: helpers.asteroidCreator.ships.length > 0 ? `Active Ships: ${helpers.asteroidCreator.ships.length}` : 'No ships active'
        },
        { 
            key: 'asteroidCreator2', 
            name: 'Asteroid Creator II', 
            desc: 'Advanced planet miner, faster & longer lasting (200 min)', 
            status: helpers.asteroidCreator2.ships.length > 0 ? `Active Ships: ${helpers.asteroidCreator2.ships.length}` : 'No ships active'
        },
        { 
            key: 'asteroidMiner', 
            name: 'Asteroid Miner', 
            desc: 'Automatically mines asteroids for money (5 min)', 
            status: helpers.asteroidMiner.ships.length > 0 ? `Active Ships: ${helpers.asteroidMiner.ships.length}` : 'No ships active'
        },
        { 
            key: 'asteroidMiner2', 
            name: 'Asteroid Miner II', 
            desc: 'Advanced asteroid miner, faster & longer lasting (50 min)', 
            status: helpers.asteroidMiner2.ships.length > 0 ? `Active Ships: ${helpers.asteroidMiner2.ships.length}` : 'No ships active'
        },
        { 
            key: 'rescueHelper', 
            name: 'Rescue Helper', 
            desc: 'Replaces emergency rescue when out of fuel (FREE)', 
            status: helpers.rescueHelper.hired ? 'Hired' : 'Not hired'
        }
    ];
    
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    helperData.forEach((helper, index) => {
        const y = 80 + index * 90;
        const helperObj = helpers[helper.key];
        const isActive = helper.key === 'rescueHelper' ? helperObj.hired : helperObj.ships.length > 0;
        const canAfford = money >= helperObj.cost || helperObj.cost === 0;
        const canHire = canAfford; // Always allow hiring more ships
        
        // Helper box
        if (isActive) {
            ctx.fillStyle = 'rgba(0, 150, 0, 0.3)'; // Green for active
            ctx.strokeStyle = '#0F0';
        } else if (canAfford) {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.3)'; // Gray for available
            ctx.strokeStyle = '#AAA';
        } else {
            ctx.fillStyle = 'rgba(150, 0, 0, 0.3)'; // Red for can't afford
            ctx.strokeStyle = '#F00';
        }
        ctx.fillRect(20, y, menuWidth - 40, 80);
        ctx.strokeRect(20, y, menuWidth - 40, 80);
        
        // Text
        ctx.fillStyle = '#FFF';
        ctx.fillText(helper.name, 30, y + 25);
        ctx.fillText(helper.desc, 30, y + 45);
        ctx.fillText(`Status: ${helper.status}`, 30, y + 60);
        
        // Cost/Action
        if (helper.key === 'rescueHelper') {
            if (helperObj.hired) {
                ctx.fillStyle = '#0F0';
                ctx.fillText('HIRED', menuWidth - 80, y + 25);
            } else {
                ctx.fillStyle = '#66FF99';
                ctx.fillText('FREE', menuWidth - 60, y + 25);
            }
        } else {
            // Check if at maximum capacity for asteroid creators (combined)
            const totalCreatorShips = helpers.asteroidCreator.ships.length + helpers.asteroidCreator2.ships.length;
            if ((helper.key === 'asteroidCreator' || helper.key === 'asteroidCreator2') && totalCreatorShips >= 8) {
                ctx.fillStyle = '#FFD700';
                ctx.fillText('MAX (8)', menuWidth - 80, y + 25);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('ALL PLANETS', menuWidth - 120, y + 45);
            } else {
                // Show cost for hiring additional ships
                ctx.fillStyle = canAfford ? '#FFF' : '#F00';
                ctx.fillText(`$${helperObj.cost}`, menuWidth - 80, y + 25);
                if (isActive) {
                    ctx.fillStyle = '#66FF99';
                    ctx.fillText('HIRE MORE', menuWidth - 100, y + 45);
                } else {
                    ctx.fillStyle = '#AAA';
                    ctx.fillText('HIRE', menuWidth - 60, y + 45);
                }
            }
        }
        
        // Store click area
        helper.clickArea = { x: menuX + 20, y: menuY + y, width: menuWidth - 40, height: 80 };
    });
    
    // Instructions
    ctx.fillStyle = '#66FF99';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click on helpers to hire them', menuWidth / 2, menuHeight - 20);
    
    ctx.restore();
    
    // Store helper data for click handling
    window.currentHelperData = helperData;
}

function handleHireHelpClick(x, y) {
    if (hireHelpMenuAnimation <= 0 || !window.currentHelperData) return false;
    
    for (const helper of window.currentHelperData) {
        const area = helper.clickArea;
        if (x >= area.x && x <= area.x + area.width &&
            y >= area.y && y <= area.y + area.height) {
            
            const helperObj = helpers[helper.key];
            
            if (helper.key === 'rescueHelper') {
                // Only hire rescue helper once and if not already hired
                if (!helperObj.hired && money >= helperObj.cost) {
                    money -= helperObj.cost;
                    helperObj.hired = true;
                    saveGameData();
                    return true;
                }
            } else {
                // Allow hiring multiple ships for asteroid creator and miner
                if (money >= helperObj.cost) {
                    // Check limits for asteroid creators (combined)
                    const totalCreatorShips = helpers.asteroidCreator.ships.length + helpers.asteroidCreator2.ships.length;
                    if ((helper.key === 'asteroidCreator' || helper.key === 'asteroidCreator2') && totalCreatorShips >= 8) {
                        return true; // Already at max (8 planets excluding Earth)
                    }
                    
                    money -= helperObj.cost;
                    
                    // Create and add new ship to the array
                    let newShip;
                    if (helper.key === 'asteroidCreator') {
                        newShip = createAsteroidCreatorShip(1);
                    } else if (helper.key === 'asteroidCreator2') {
                        newShip = createAsteroidCreatorShip(2);
                    } else if (helper.key === 'asteroidMiner') {
                        newShip = createAsteroidMinerShip(1);
                    } else if (helper.key === 'asteroidMiner2') {
                        newShip = createAsteroidMinerShip(2);
                    }
                    
                    if (newShip) {
                        helperObj.ships.push(newShip);
                    }
                    
                    saveGameData();
                    return true;
                }
            }
        }
    }
    return false;
}

function handleChallengeClick(x, y) {
    if (challengeMenuAnimation <= 0 || !window.currentChallengeData) return false;
    
    for (const challenge of window.currentChallengeData) {
        const area = challenge.clickArea;
        if (x >= area.x && x <= area.x + area.width &&
            y >= area.y && y <= area.y + area.height) {
            startChallenge(challenge.key);
            return true;
        }
    }
    return false;
}

function handleUpgradeClick(x, y) {
    if (upgradeMenuAnimation <= 0 || !window.currentUpgradeData) return false;
    
    // Check for reset button click in debug mode
    if (debugMode && window.currentResetButtonArea) {
        const resetArea = window.currentResetButtonArea;
        if (x >= resetArea.x && x <= resetArea.x + resetArea.width &&
            y >= resetArea.y && y <= resetArea.y + resetArea.height) {
            
            // Reset all upgrades to 0
            Object.keys(upgrades).forEach(key => {
                upgrades[key] = 0;
            });
            spaceship.maxFuel = getUpgradedMaxFuel();
            
            // Auto-save after reset
            saveGameData();
            
            return true;
        }
    }
    
    for (const upgrade of window.currentUpgradeData) {
        const area = upgrade.clickArea;
        if (x >= area.x && x <= area.x + area.width &&
            y >= area.y && y <= area.y + area.height) {
            
            const cost = getUpgradeCost(upgrade.key);
            const currentLevel = upgrades[upgrade.key];
            
            // Check if upgrade is at maximum level (5)
            if (currentLevel >= 5) {
                return true; // Don't allow further upgrades
            }
            
            if (canAffordUpgrade(upgrade.key) || debugMode) {
                if (!debugMode) {
                    // Deduct the appropriate currency
                    if (upgrade.key === 'multiMine') {
                        gold -= cost;
                    } else {
                        money -= cost;
                    }
                }
                upgrades[upgrade.key]++;
                spaceship.maxFuel = getUpgradedMaxFuel();
                
                // Auto-save after upgrade purchase
                saveGameData();
                
                return true;
            }
        }
    }
    return false;
}

function drawResetConfirmation() {
    if (!showResetConfirmation) return;
    
    // Draw overlay
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dialog dimensions
    const dialogWidth = 400;
    const dialogHeight = 200;
    const dialogX = (canvas.width - dialogWidth) / 2;
    const dialogY = (canvas.height - dialogHeight) / 2;
    
    // Draw dialog background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);
    
    // Warning title
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ WARNING ⚠️', dialogX + dialogWidth/2, dialogY + 40);
    
    // Confirmation text
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText('This will permanently delete all your', dialogX + dialogWidth/2, dialogY + 70);
    ctx.fillText('progress, upgrades, money, and achievements!', dialogX + dialogWidth/2, dialogY + 90);
    ctx.fillText('Are you sure you want to continue?', dialogX + dialogWidth/2, dialogY + 120);
    
    // Buttons
    const buttonWidth = 100;
    const buttonHeight = 40;
    const buttonY = dialogY + dialogHeight - 60;
    const yesButtonX = dialogX + dialogWidth/2 - buttonWidth - 10;
    const noButtonX = dialogX + dialogWidth/2 + 10;
    
    // No button (cancel)
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(noButtonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 2;
    ctx.strokeRect(noButtonX, buttonY, buttonWidth, buttonHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.fillText('Cancel', noButtonX + buttonWidth/2, buttonY + buttonHeight/2 + 6);
    
    // Yes button (confirm)
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(yesButtonX, buttonY, buttonWidth, buttonHeight);
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(yesButtonX, buttonY, buttonWidth, buttonHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('RESET ALL', yesButtonX + buttonWidth/2, buttonY + buttonHeight/2 + 6);
    
    // Store button areas for click detection
    window.resetConfirmationButtons = {
        yes: { x: yesButtonX, y: buttonY, width: buttonWidth, height: buttonHeight },
        no: { x: noButtonX, y: buttonY, width: buttonWidth, height: buttonHeight }
    };
    
    ctx.restore();
}