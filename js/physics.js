import { CONFIG } from './config.js';

export class Physics {
    static applyGravity(player, deltaTime) {
        player.velocityY += CONFIG.GRAVITY * 60 * deltaTime;
        player.velocityY -= player.velocityY * CONFIG.AIR_RESISTANCE * deltaTime;
    }

    static movePlayer(player, deltaTime, canvasWidth) {
        player.x += player.velocityX * deltaTime;
        player.y += player.velocityY * deltaTime;

        // Wände begrenzen
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvasWidth) player.x = canvasWidth - player.width;
    }

    static handleJump(player) {
        // Bedingung: Buffer aktiv UND Coyote Time aktiv
        if (player.jumpBufferTimer > 0 && player.coyoteTimeCounter > 0) {
            player.velocityY = CONFIG.JUMP_STRENGTH;
            player.isJumping = true;
            player.coyoteTimeCounter = 0;
            player.jumpBufferTimer = 0;
            return true; // Sprung ausgeführt
        }
        return false;
    }

    static checkCollisions(player, platforms, deltaTime) {
        let onPlatform = false;
        
        platforms.forEach(platform => {
            const previousPlayerBottom = (player.y - player.velocityY * deltaTime) + player.height;
            
            // Kollisionslogik (One-Way Platform)
            if (
                player.velocityY >= 0 && // Nur beim Fallen
                player.x < platform.x + platform.width && 
                player.x + player.width > platform.x &&
                previousPlayerBottom <= platform.y + 1 && // War vorher drüber
                player.y + player.height >= platform.y // Ist jetzt drin/drunter
            ) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                onPlatform = true;

                // Bewegliche Plattformen
                if (platform.isMoving) {
                    player.x += platform.moveSpeed * platform.moveDirection * 60 * deltaTime;
                }
                
                // Zerfallende Plattformen
                if (platform.isTemporary && !platform.isDisappearing) {
                    platform.isDisappearing = true;
                    platform.disappearTimer = CONFIG.DISAPPEAR_TIME;
                }
            }
        });

        return onPlatform;
    }

    static updateCamera(player, platforms, canvasHeight) {
        const cameraThreshold = canvasHeight * CONFIG.CAMERA_THRESHOLD_FACTOR;
        let scoreIncrease = 0;

        if (player.y < cameraThreshold) {
            const scrollAmount = cameraThreshold - player.y;
            player.y = cameraThreshold;
            scoreIncrease = Math.floor(scrollAmount);
            platforms.forEach(p => p.y += scrollAmount);
        }
        
        return scoreIncrease;
    }

    static checkGameOver(player, platforms, canvasHeight) {
        let lowestVisiblePlatformY = -Infinity;
        platforms.forEach(p => {
            if (p.y < canvasHeight && p.y > lowestVisiblePlatformY) {
                lowestVisiblePlatformY = p.y;
            }
        });
        if (lowestVisiblePlatformY === -Infinity) lowestVisiblePlatformY = canvasHeight;

        return player.y > lowestVisiblePlatformY + player.height;
    }
}