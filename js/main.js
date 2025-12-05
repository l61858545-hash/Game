import { CONFIG } from './config.js';
import { keys, setupInput } from './input.js';
import { checkVersionAndStorage, getHighScores, saveHighScore } from './storage.js';
import { initLeaderboard, showLeaderboard, hideLeaderboard } from './leaderboard.js';
import { PlatformGenerator } from './generator.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

// State
let player, platforms, score, gameOver;
let highScore, preUpdateScore;
let lastTime = 0;

const generator = new PlatformGenerator(canvas.width);

function init() {
    setupInput();
    initLeaderboard();
    checkVersionAndStorage(); 
    
    const scores = getHighScores();
    highScore = scores.highScore;
    preUpdateScore = scores.preUpdateScore;

    hideLeaderboard();
    resetGame();
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    player = {
        ...CONFIG.PLAYER,
        x: canvas.width / 2 - CONFIG.PLAYER.width / 2,
        y: canvas.height - 100,
        velocityX: 0,
        velocityY: 0,
        isJumping: false,
        coyoteTimeCounter: 0
    };

    platforms = [
        { x: 0, y: canvas.height - 20, width: canvas.width, height: 20, isMoving: false, isTemporary: false }
    ];

    score = 0;
    gameOver = false;
    generator.reset();

    for (let i = 0; i < 10; i++) {
        generator.generate(platforms, player, score);
    }
}

function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    update(deltaTime);
    draw(); 

    if (gameOver) {
        drawGameOver(); 
        
        if (keys.enter) {
            keys.enter = false; 
            resetGame();
            hideLeaderboard();
        }
    }

    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // ============================================================
    // SPEZIALFALL: GAME OVER
    // ============================================================
    if (gameOver) {
        player.velocityY += CONFIG.GRAVITY * 60 * deltaTime;
        
        // Terminal Velocity auch im Game Over
        if (player.velocityY > CONFIG.MAX_FALL_SPEED) {
            player.velocityY = CONFIG.MAX_FALL_SPEED;
        }

        player.y += player.velocityY * deltaTime;
        player.x += player.velocityX * deltaTime;

        const cameraThreshold = canvas.height * CONFIG.CAMERA_THRESHOLD_FACTOR;
        
        // Wenn der Spieler unter die Mitte fällt, schieben wir die Welt nach oben
        if (player.y > cameraThreshold) {
            const scrollUpAmount = player.y - cameraThreshold;
            player.y = cameraThreshold; 
            platforms.forEach(p => p.y -= scrollUpAmount); 
        }
        
        // HIER löschen wir Plattformen, die OBEN rausfliegen (die sehen wir eh nie wieder)
        platforms = platforms.filter(p => p.y > -100);

        return; 
    }

    // ============================================================
    // NORMALES SPIELVERHALTEN
    // ============================================================

    platforms.forEach(p => {
        if (p.isDisappearing) p.disappearTimer -= deltaTime;
        if (p.isMoving) {
            p.x += p.moveSpeed * p.moveDirection * 60 * deltaTime;
            if (p.x < 0 || p.x + p.width > canvas.width) p.moveDirection *= -1;
        }
    });

    // Wir löschen nur bröckelnde Plattformen, die verschwunden sind.
    // WICHTIG: Wir löschen NICHT mehr Plattformen, die unten rausfallen!
    platforms = platforms.filter(p => !p.isTemporary || p.disappearTimer > 0 || !p.isDisappearing);


    // Spieler Input
    if (!gameOver) {
        if (keys.right) player.velocityX = player.speed;
        else if (keys.left) player.velocityX = -player.speed;
        else player.velocityX = 0;

        if (keys.up && player.coyoteTimeCounter > 0) {
            player.velocityY = CONFIG.JUMP_STRENGTH;
            player.isJumping = true;
            player.coyoteTimeCounter = 0;
        }
        keys.up = false; 
    }


    // Physik
    player.velocityY += CONFIG.GRAVITY * 60 * deltaTime;
    if (player.velocityY > CONFIG.MAX_FALL_SPEED) {
        player.velocityY = CONFIG.MAX_FALL_SPEED;
    }

    player.x += player.velocityX * deltaTime;
    player.y += player.velocityY * deltaTime;


    // Grenzen
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;


    // Kamera (Aufstieg)
    const cameraThreshold = canvas.height * CONFIG.CAMERA_THRESHOLD_FACTOR;

    if (!gameOver) {
        if (player.y < cameraThreshold) {
            const scrollAmount = cameraThreshold - player.y;
            player.y = cameraThreshold;
            score += Math.floor(scrollAmount);
            platforms.forEach(p => p.y += scrollAmount);
        }
    }


    // Kollisionen & Generierung
    if (!gameOver) {
        let onPlatform = false;
        platforms.forEach(platform => {
            const previousPlayerBottom = (player.y - player.velocityY * deltaTime) + player.height;
            if (
                player.velocityY >= 0 &&
                player.x < platform.x + platform.width && player.x + player.width > platform.x &&
                previousPlayerBottom <= platform.y + 1 &&
                player.y + player.height >= platform.y
            ) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                onPlatform = true;

                if (platform.isMoving) {
                    player.x += platform.moveSpeed * platform.moveDirection * 60 * deltaTime;
                }
                if (platform.isTemporary && !platform.isDisappearing) {
                    platform.isDisappearing = true;
                    platform.disappearTimer = CONFIG.DISAPPEAR_TIME;
                }
            }
        });

        if (onPlatform) {
            player.isJumping = false;
            player.coyoteTimeCounter = CONFIG.COYOTE_TIME;
        } else {
            if (player.coyoteTimeCounter > 0) player.coyoteTimeCounter -= deltaTime;
        }

        // WICHTIG: Die Zeile "platforms = platforms.filter(p => p.y < canvas.height);" wurde ENTFERNT.
        // Stattdessen generieren wir einfach neue, wenn die höchste Plattform zu tief rutscht.
        
        // Wir prüfen die HÖCHSTE Plattform (die mit dem kleinsten Y-Wert)
        // Da das Array sortiert generiert wird, ist die letzte im Array die höchste.
        const highestPlatform = platforms[platforms.length - 1];
        
        // Wenn die höchste Plattform in den sichtbaren Bereich kommt (oder kurz davor), neue generieren
        if (highestPlatform.y > -50) {
            generator.generate(platforms, player, score);
        }

        if (player.y > canvas.height) {
            gameOver = true;
            if (score > highScore) {
                highScore = score;
                saveHighScore(highScore);
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    platforms.forEach(platform => {
        // PERFORMANCE OPTIMIERUNG:
        // Zeichne die Plattform NUR, wenn sie im sichtbaren Bereich ist.
        // Da wir alte Plattformen nicht mehr löschen, ist das wichtig für die FPS.
        if (platform.y > canvas.height || platform.y + platform.height < 0) {
            return;
        }

        if (platform.isTemporary) {
            ctx.fillStyle = '#C2B280';
            if (platform.isDisappearing && platform.disappearTimer < 1 && Math.floor(platform.disappearTimer * 10) % 2 === 0) {
                ctx.fillStyle = 'white';
            }
        } else if (platform.isMoving) {
            ctx.fillStyle = '#FFA500';
        } else {
            ctx.fillStyle = 'green';
        }
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // HUD
    ctx.fillStyle = 'black';
    ctx.font = '24px Poppins, Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`Best: ${highScore}`, canvas.width - 10, 30);
    if (preUpdateScore > 0) {
        ctx.fillStyle = '#555';
        ctx.font = '18px Poppins, Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Pre-Update: ${preUpdateScore}`, canvas.width - 10, 60);
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const overlay = document.getElementById('leaderboardOverlay');
    if (overlay && overlay.classList.contains('hidden')) {
        showLeaderboard(score);
    }
}

init();