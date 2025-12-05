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

// Shake Variablen
let impactShakeTimer = 0;
let impactShakeStrength = 0;
let hasHitGround = false;
let currentFallShake = 0;
let maxFallDistance = 0;

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
    
    impactShakeTimer = 0;
    hasHitGround = false;
    currentFallShake = 0;
    maxFallDistance = 0;

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
        // KORREKTUR: Overlay SOFORT anzeigen, nicht auf Aufprall warten
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
    if (impactShakeTimer > 0) {
        impactShakeTimer -= deltaTime;
    }

    // ============================================================
    // SPEZIALFALL: GAME OVER
    // ============================================================
    if (gameOver) {
        if (hasHitGround) return;

        if (keys.right) player.velocityX = CONFIG.PLAYER.speed;
        else if (keys.left) player.velocityX = -CONFIG.PLAYER.speed;
        else player.velocityX = 0;

        // 1. Schwerkraft
        player.velocityY += CONFIG.GRAVITY * 60 * deltaTime;

        // 2. Luftwiderstand (sehr gering -> hohe Geschwindigkeit)
        player.velocityY -= player.velocityY * CONFIG.AIR_RESISTANCE * deltaTime;

        player.x += player.velocityX * deltaTime;
        player.y += player.velocityY * deltaTime;

        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

        // Kamera folgt nach unten
        const cameraThreshold = canvas.height * CONFIG.CAMERA_THRESHOLD_FACTOR;
        
        if (player.y > cameraThreshold) {
            const scrollUpAmount = player.y - cameraThreshold;
            player.y = cameraThreshold; 
            platforms.forEach(p => p.y -= scrollUpAmount); 
        }

        // Boden-Kollision & Shake-Berechnung
        const ground = platforms.find(p => p.isGround);
        
        if (ground) {
            // Shake Intensität berechnen
            const currentDistance = ground.y - (player.y + player.height);
            
            if (maxFallDistance > 0 && currentDistance > 0) {
                const ratio = currentDistance / maxFallDistance;
                let intensity = 1 - ratio;
                intensity = Math.max(0, Math.min(1, intensity));
                intensity = intensity * intensity; 
                currentFallShake = intensity * CONFIG.SHAKE.FALL_MAX_STRENGTH;
            } else {
                currentFallShake = CONFIG.SHAKE.FALL_MAX_STRENGTH;
            }

            // KORREKTUR: Robuste Kollisionserkennung (Anti-Tunneling)
            // Wir prüfen nur: Ist der Spieler horizontal über dem Boden?
            if (player.x < ground.x + ground.width && player.x + player.width > ground.x) {
                
                // Und: Ist der Spieler jetzt TIEFER als die Bodenoberkante?
                // Egal wie tief (auch wenn er schon 500px durchgerauscht ist), wir fangen ihn ab.
                if (player.y + player.height >= ground.y) {
                    
                    player.y = ground.y - player.height; // Auf den Boden setzen
                    player.velocityY = 0;
                    
                    triggerGroundShake();
                    hasHitGround = true;
                    currentFallShake = 0; 
                }
            }
        }
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

    platforms = platforms.filter(p => !p.isTemporary || p.disappearTimer > 0 || !p.isDisappearing);

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

    // Physik Normal
    player.velocityY += CONFIG.GRAVITY * 60 * deltaTime;
    player.velocityY -= player.velocityY * CONFIG.AIR_RESISTANCE * deltaTime;

    player.x += player.velocityX * deltaTime;
    player.y += player.velocityY * deltaTime;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    const cameraThreshold = canvas.height * CONFIG.CAMERA_THRESHOLD_FACTOR;

    if (!gameOver) {
        if (player.y < cameraThreshold) {
            const scrollAmount = cameraThreshold - player.y;
            player.y = cameraThreshold;
            score += Math.floor(scrollAmount);
            platforms.forEach(p => p.y += scrollAmount);
        }
    }

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

    const highestPlatform = platforms[platforms.length - 1];
    if (highestPlatform.y > -50) {
        generator.generate(platforms, player, score);
    }

    // Game Over Bedingung
    let lowestVisiblePlatformY = -Infinity;
    platforms.forEach(p => {
        if (p.y < canvas.height && p.y > lowestVisiblePlatformY) {
            lowestVisiblePlatformY = p.y;
        }
    });
    if (lowestVisiblePlatformY === -Infinity) lowestVisiblePlatformY = canvas.height;

    if (player.y > lowestVisiblePlatformY + player.height) {
        gameOver = true;
        
        const ground = platforms.find(p => p.isGround);
        if (ground) {
            maxFallDistance = ground.y - player.y;
        } else {
            maxFallDistance = 5000; 
        }

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
    ctx.save();

    let shakeX = 0;
    let shakeY = 0;

    // 1. Fall-Shake
    if (gameOver && !hasHitGround && currentFallShake > 0) {
        shakeX += (Math.random() - 0.5) * 2 * currentFallShake;
        shakeY += (Math.random() - 0.5) * 2 * currentFallShake;
    }

    // 2. Impact-Shake
    if (impactShakeTimer > 0) {
        const decay = impactShakeTimer / CONFIG.SHAKE.GROUND_DURATION;
        const currentImpactStrength = impactShakeStrength * decay;
        shakeX += (Math.random() - 0.5) * 2 * currentImpactStrength;
        shakeY += (Math.random() - 0.5) * 2 * currentImpactStrength;
    }

    if (shakeX !== 0 || shakeY !== 0) {
        ctx.translate(shakeX, shakeY);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    platforms.forEach(platform => {
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

    ctx.restore();
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