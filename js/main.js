import { CONFIG } from './config.js';
import { keys, setupInput } from './input.js';
import { checkVersionAndStorage, getHighScores, saveHighScore } from './storage.js';
import { initLeaderboard, showLeaderboard, hideLeaderboard, updateScoreDisplay } from './leaderboard.js';
import { PlatformGenerator } from './generator.js';

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

// NEU: Variablen für Fixed Time Step
const FIXED_TIME_STEP = 1 / 60; // Physik läuft immer mit 60 FPS (0.01666s)
let accumulator = 0;

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
    
    // Accumulator resetten
    accumulator = 0;

    for (let i = 0; i < 10; i++) {
        generator.generate(platforms, player, score);
    }
}

function gameLoop(currentTime) {
    let deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Sicherheits-Cap: Wenn der Tab lange im Hintergrund war, nicht versuchen,
    // 1000 Updates auf einmal nachzuholen (verhindert "Spiral of Death")
    if (deltaTime > 0.25) deltaTime = 0.25;

    // Zeit zum Accumulator hinzufügen
    accumulator += deltaTime;

    // WICHTIG: Physik in festen Schritten abarbeiten
    // Solange genug Zeit im "Tank" (Accumulator) ist, führen wir Updates durch.
    while (accumulator >= FIXED_TIME_STEP) {
        update(FIXED_TIME_STEP); // Immer exakt 0.01666s übergeben
        accumulator -= FIXED_TIME_STEP;
    }

    // Zeichnen tun wir so oft der Monitor es erlaubt (Interpolation wäre hier der nächste Pro-Step, aber so reicht es meistens)
    draw(); 

    if (gameOver) {
        renderer.drawGameOverScreen(isStartScreen, score, highScore);
        
        if (keys.enter) {
            // Check ob im Input-Feld
            const activeElement = document.activeElement;
            const nameInput = document.getElementById('playerName');
            
            if (activeElement === nameInput) {
                keys.enter = false;
                requestAnimationFrame(gameLoop); // Loop am Leben halten
                return;
            }

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

        player.handleInput(keys, deltaTime); 
        
        Physics.applyGravity(player, deltaTime);
        Physics.movePlayer(player, deltaTime, canvas.width);
        
        const cameraThreshold = canvas.height * CONFIG.CAMERA_THRESHOLD_FACTOR;
        if (player.y > cameraThreshold) {
            const scrollUpAmount = player.y - cameraThreshold;
            player.y = cameraThreshold; 
            platforms.forEach(p => p.y -= scrollUpAmount); 
        }

        const ground = platforms.find(p => p.isGround);
        if (ground) {
            const currentDistance = ground.y - (player.y + player.height);
            if (maxFallDistance > 0 && currentDistance > 0) {
                const ratio = currentDistance / maxFallDistance;
                let intensity = (1 - ratio) ** 2;
                currentFallShake = intensity * CONFIG.SHAKE.FALL_MAX_STRENGTH;
            } else {
                currentFallShake = CONFIG.SHAKE.FALL_MAX_STRENGTH;
            }

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

    platforms.forEach(p => {
        if (p.isDisappearing) p.disappearTimer -= deltaTime;
        if (p.isMoving) {
            p.x += p.moveSpeed * p.moveDirection * 60 * deltaTime;
            if (p.x < 0 || p.x + p.width > canvas.width) p.moveDirection *= -1;
        }
    });
    platforms = platforms.filter(p => !p.isTemporary || p.disappearTimer > 0 || !p.isDisappearing);

    player.handleInput(keys, deltaTime);
    player.updateTimers(deltaTime);

    Physics.handleJump(player);
    Physics.applyGravity(player, deltaTime);
    Physics.movePlayer(player, deltaTime, canvas.width);

    const scoreIncrease = Physics.updateCamera(player, platforms, canvas.height);
    score += scoreIncrease;

    const onPlatform = Physics.checkCollisions(player, platforms, deltaTime);
    
    if (onPlatform) {
        player.isJumping = false;
        player.coyoteTimeCounter = CONFIG.COYOTE_TIME;
    }

    const highestPlatform = platforms[platforms.length - 1];
    if (highestPlatform.y > -50) {
        generator.generate(platforms, player, score);
    }

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

    renderer.draw(player, platforms, score, highScore, shakeX, shakeY);
}

init();