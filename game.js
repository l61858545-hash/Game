// Canvas einrichten
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Spiel-Variablen
let player, platforms, keys, gravity, jumpStrength, score, gameOver;
let highScore;

const coyoteTime = 30;

// Spieler-Eigenschaften
const playerProps = {
    width: 50,
    height: 50,
    color: 'red',
    speed: 10
};

const cameraThreshold = canvas.height / 2;

function init() {
    player = {
        ...playerProps,
        x: canvas.width / 2 - playerProps.width / 2,
        y: canvas.height - 100,
        velocityX: 0,
        velocityY: 0,
        isJumping: false,
        coyoteTimeCounter: 0
    };

    platforms = [
        { x: 0, y: canvas.height - 20, width: canvas.width, height: 20, isMoving: false }
    ];

    keys = {
        right: false,
        left: false,
        up: false
    };

    gravity = 1;
    jumpStrength = -20;
    score = 0;
    gameOver = false;

    highScore = localStorage.getItem('platformerHighScore') || 0;

    for (let i = 0; i < 10; i++) {
        generateNewPlatform();
    }

    // GEÄNDERT: Click-Listener werden nicht mehr benötigt
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    // canvas.removeEventListener('click', handleCanvasClick); // ENTFERNT

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    // canvas.addEventListener('click', handleCanvasClick); // ENTFERNT

    if (!gameLoop.isRunning) {
        gameLoop();
    }
}

function generateNewPlatform() {
    // ... (Diese Funktion bleibt unverändert)
    const lastPlatform = platforms[platforms.length - 1];
    const difficultyFactor = Math.min(2.5, 1 + score / 5000);
    const maxJumpHeight = (jumpStrength ** 2) / (2 * gravity);
    const timeToPeak = -jumpStrength / gravity;
    const horizontalReach = player.speed * timeToPeak;
    const minVerticalGap = 80;
    const maxVerticalGap = (maxJumpHeight * 0.8) * Math.min(1.1, difficultyFactor);
    const verticalGap = Math.random() * (maxVerticalGap - minVerticalGap) + minVerticalGap;
    const minWidth = 50;
    const maxWidth = Math.max(minWidth, 150 - (difficultyFactor - 1) * 50);
    const newPlatformWidth = Math.random() * (maxWidth - minWidth) + minWidth;
    const newPlatform = {
        width: newPlatformWidth,
        height: 20,
        y: lastPlatform.y - verticalGap,
        isMoving: false
    };
    const movingPlatformChance = 0.1 + (difficultyFactor - 1) * 0.1;
    if (Math.random() < movingPlatformChance && score > 500) {
        newPlatform.isMoving = true;
        newPlatform.moveSpeed = (Math.random() * 1 + 1) * Math.min(1.5, difficultyFactor);
        newPlatform.moveDirection = Math.random() < 0.5 ? 1 : -1;
    }
    const minHorizontalShift = horizontalReach * (0.3 * difficultyFactor);
    const maxHorizontalShift = horizontalReach * 0.9;
    let horizontalShift = Math.random() * (maxHorizontalShift - minHorizontalShift) + minHorizontalShift;
    if (Math.random() < 0.5) {
        horizontalShift = -horizontalShift;
    }
    const lastPlatformCenterX = lastPlatform.x + lastPlatform.width / 2;
    newPlatform.x = (lastPlatformCenterX + horizontalShift) - newPlatform.width / 2;
    if (newPlatform.x < 10) newPlatform.x = 10;
    if (newPlatform.x + newPlatform.width > canvas.width - 10) {
        newPlatform.x = canvas.width - newPlatform.width - 10;
    }
    platforms.push(newPlatform);
}

// GEÄNDERT: handleKeyDown prüft jetzt auf "Enter" im Game-Over-Zustand
function handleKeyDown(e) {
    // Neustart-Logik
    if (e.key === 'Enter' && gameOver) {
        init();
        return; // Verhindert, dass andere Tasten gleichzeitig verarbeitet werden
    }

    // Spiel-Steuerung
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keys.up = true;
}

function handleKeyUp(e) {
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') keys.up = false;
}

// ENTFERNT: Diese Funktion wird nicht mehr gebraucht
// function handleCanvasClick() { ... }

function gameLoop() {
    gameLoop.isRunning = true;
    if (gameOver) {
        drawGameOver();
        gameLoop.isRunning = false;
        return;
    }
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // ... (unverändert)
    platforms.forEach(p => {
        if (p.isMoving) {
            p.x += p.moveSpeed * p.moveDirection;
            if (p.x < 0 || p.x + p.width > canvas.width) {
                p.moveDirection *= -1;
            }
        }
    });
    if (keys.right) player.velocityX = player.speed;
    else if (keys.left) player.velocityX = -player.speed;
    else player.velocityX = 0;
    if (keys.up && player.coyoteTimeCounter > 0) {
        player.velocityY = jumpStrength;
        player.isJumping = true;
        player.coyoteTimeCounter = 0;
    }
    keys.up = false;
    player.x += player.velocityX;
    player.velocityY += gravity;
    player.y += player.velocityY;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y < cameraThreshold) {
        const scrollAmount = cameraThreshold - player.y;
        player.y = cameraThreshold;
        score += Math.floor(scrollAmount);
        platforms.forEach(p => p.y += scrollAmount);
    }
    let onPlatform = false;
    let currentPlatform = null;
    platforms.forEach(platform => {
        if (player.velocityY >= 0 && player.x < platform.x + platform.width && player.x + player.width > platform.x && player.y + player.height > platform.y && player.y + player.height < platform.y + platform.height + 15) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            onPlatform = true;
            currentPlatform = platform;
        }
    });
    if (currentPlatform && currentPlatform.isMoving) {
        player.x += currentPlatform.moveSpeed * currentPlatform.moveDirection;
    }
    if (onPlatform) {
        player.isJumping = false;
        player.coyoteTimeCounter = coyoteTime;
    } else {
        if (player.coyoteTimeCounter > 0) {
            player.coyoteTimeCounter--;
        }
    }
    platforms = platforms.filter(p => p.y < canvas.height);
    while (platforms[platforms.length - 1].y > -50) {
        generateNewPlatform();
    }
    if (player.y > canvas.height) {
        gameOver = true;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('platformerHighScore', highScore);
        }
    }
}

function draw() {
    // ... (unverändert)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    platforms.forEach(platform => {
        ctx.fillStyle = platform.isMoving ? '#FFA500' : 'green';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`Best: ${highScore}`, canvas.width - 10, 30);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 60);

    if (score >= highScore && score > 0) {
        ctx.font = '30px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('New High Score!', canvas.width / 2, canvas.height / 2);
    }

    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);

    ctx.font = '20px Arial';
    // GEÄNDERT: Text für den Neustart
    ctx.fillText('Enter drücken zum Neustarten', canvas.width / 2, canvas.height / 2 + 90);
}

// Das Spiel zum ersten Mal starten
init();