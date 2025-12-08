import { CONFIG } from './config.js';
import { keys, setupInput } from './input.js';
import { checkVersionAndStorage, getHighScores, saveHighScore } from './storage.js';
import { initLeaderboard, showLeaderboard, hideLeaderboard, updateScoreDisplay } from './leaderboard.js';
import { PlatformGenerator } from './generator.js';

// NEUE IMPORTS
import { Player } from './player.js';
import { Physics } from './physics.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

// Instanzen
const renderer = new Renderer(canvas, ctx);
const player = new Player(canvas.width, canvas.height);
const generator = new PlatformGenerator(canvas.width);

// State
let platforms = [];
let score = 0;
let gameOver = false;
let highScore = 0;
let preUpdateScore = 0;
let lastTime = 0;

// Status Flags
let isStartScreen = true;
let isLeaderboardActive = false;

// Shake Variablen
let impactShakeTimer = 0;
let impactShakeStrength = 0;
let hasHitGround = false;
let currentFallShake = 0;
let maxFallDistance = 0;

function init() {
    setupInput();
    initLeaderboard();
    checkVersionAndStorage(); 
    
    const scores = getHighScores();
    highScore = scores.highScore;
    preUpdateScore = scores.preUpdateScore;

    renderer.initHUD(preUpdateScore);

    resetGame();
    gameOver = true; 
    isStartScreen = true; 
    
    // Einmal zeichnen für den Hintergrund
    draw();
    renderer.drawGameOverScreen(isStartScreen, score, highScore);
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    player.reset();
    generator.reset();

    platforms = [
        { 
            x: 0, 
            y: canvas.height - 20, 
            width: canvas.width, 
            height: 20, 
            isMoving: false, 
            isTemporary: false,
            isGround: true 
        }
    ];

    score = 0;
    gameOver = false;
    isLeaderboardActive = false;
    
    impactShakeTimer = 0;
    hasHitGround = false;
    currentFallShake = 0;
    maxFallDistance = 0;

    for (let i = 0; i < 10; i++) {
        generator.generate(platforms, player, score);
    }
}

function gameLoop(currentTime) {
    let deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (deltaTime > 0.1) deltaTime = 0.016; 

    update(deltaTime);
    draw(); 

    if (gameOver) {
        renderer.drawGameOverScreen(isStartScreen, score, highScore);
        
        if (keys.enter) {
            keys.enter = false; 
            isStartScreen = false; 
            resetGame();
            hideLeaderboard();
        }
    }

    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    if (impactShakeTimer > 0) impactShakeTimer -= deltaTime;

    // Live Leaderboard Logic
    if (!gameOver && !isStartScreen) {
        if (keys.enter) {
            if (!isLeaderboardActive) {
                showLeaderboard(score, "Rangliste", true); 
                isLeaderboardActive = true;
            } else {
                updateScoreDisplay(score);
            }
        } else {
            if (isLeaderboardActive) {
                hideLeaderboard();
                isLeaderboardActive = false;
            }
        }
    }

    // Game Over / Start Screen Logic
    if (gameOver) {
        if (isStartScreen) return;
        if (hasHitGround) return;

        // Game Over Physik (Fallen)
        // WICHTIG: Auch hier deltaTime übergeben!
        player.handleInput(keys, deltaTime); 
        
        Physics.applyGravity(player, deltaTime);
        Physics.movePlayer(player, deltaTime, canvas.width);
        
        // Kamera folgt beim Fallen
        const cameraThreshold = canvas.height * CONFIG.CAMERA_THRESHOLD_FACTOR;
        if (player.y > cameraThreshold) {
            const scrollUpAmount = player.y - cameraThreshold;
            player.y = cameraThreshold; 
            platforms.forEach(p => p.y -= scrollUpAmount); 
        }

        // Boden-Kollision im Game Over
        const ground = platforms.find(p => p.isGround);
        if (ground) {
            // Shake Berechnung
            const currentDistance = ground.y - (player.y + player.height);
            if (maxFallDistance > 0 && currentDistance > 0) {
                const ratio = currentDistance / maxFallDistance;
                let intensity = (1 - ratio) ** 2;
                currentFallShake = intensity * CONFIG.SHAKE.FALL_MAX_STRENGTH;
            } else {
                currentFallShake = CONFIG.SHAKE.FALL_MAX_STRENGTH;
            }

            // Aufprall
            if (player.x < ground.x + ground.width && player.x + player.width > ground.x) {
                if (player.y + player.height >= ground.y) {
                    player.y = ground.y - player.height; 
                    player.velocityY = 0;
                    triggerGroundShake();
                    hasHitGround = true;
                    currentFallShake = 0; 
                }
            }
        }
        return; 
    }

    // --- NORMALES SPIEL ---

    // 1. Plattformen Update
    platforms.forEach(p => {
        if (p.isDisappearing) p.disappearTimer -= deltaTime;
        if (p.isMoving) {
            p.x += p.moveSpeed * p.moveDirection * 60 * deltaTime;
            if (p.x < 0 || p.x + p.width > canvas.width) p.moveDirection *= -1;
        }
    });
    platforms = platforms.filter(p => !p.isTemporary || p.disappearTimer > 0 || !p.isDisappearing);

    // 2. Spieler Input & Timer
    // WICHTIG: deltaTime übergeben!
    player.handleInput(keys, deltaTime);
    player.updateTimers(deltaTime);

    // 3. Physik (Sprung & Bewegung)
    Physics.handleJump(player);
    Physics.applyGravity(player, deltaTime);
    Physics.movePlayer(player, deltaTime, canvas.width);

    // 4. Kamera Scroll
    const scoreIncrease = Physics.updateCamera(player, platforms, canvas.height);
    score += scoreIncrease;

    // 5. Kollisionen
    const onPlatform = Physics.checkCollisions(player, platforms, deltaTime);
    
    if (onPlatform) {
        player.isJumping = false;
        player.coyoteTimeCounter = CONFIG.COYOTE_TIME;
    }

    // 6. Generator
    const highestPlatform = platforms[platforms.length - 1];
    if (highestPlatform.y > -50) {
        generator.generate(platforms, player, score);
    }

    // 7. Game Over Check
    if (Physics.checkGameOver(player, platforms, canvas.height)) {
        gameOver = true;
        const ground = platforms.find(p => p.isGround);
        maxFallDistance = ground ? (ground.y - player.y) : 5000;

        if (score > highScore) {
            highScore = score;
            saveHighScore(highScore);
        }
    }
}

function triggerGroundShake() {
    impactShakeTimer = CONFIG.SHAKE.GROUND_DURATION;
    impactShakeStrength = CONFIG.SHAKE.GROUND_STRENGTH;
}

function draw() {
    // Shake berechnen
    let shakeX = 0;
    let shakeY = 0;

    if (gameOver && !hasHitGround && currentFallShake > 0) {
        shakeX += (Math.random() - 0.5) * 2 * currentFallShake;
        shakeY += (Math.random() - 0.5) * 2 * currentFallShake;
    }

    if (impactShakeTimer > 0) {
        const decay = impactShakeTimer / CONFIG.SHAKE.GROUND_DURATION;
        const currentImpactStrength = impactShakeStrength * decay;
        shakeX += (Math.random() - 0.5) * 2 * currentImpactStrength;
        shakeY += (Math.random() - 0.5) * 2 * currentImpactStrength;
    }

    // Alles an den Renderer übergeben
    renderer.draw(player, platforms, score, highScore, shakeX, shakeY);
}

init();