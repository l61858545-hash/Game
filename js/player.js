import { CONFIG } from './config.js';

export class Player {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
    }

    reset() {
        // Werte aus Config übernehmen
        this.width = CONFIG.PLAYER.width;
        this.height = CONFIG.PLAYER.height;
        this.color = CONFIG.PLAYER.color;
        
        // Positionierung
        this.x = this.canvasWidth / 2 - this.width / 2;
        this.y = this.canvasHeight - 100;
        
        // Physik & Status
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        
        // Timer
        this.coyoteTimeCounter = 0;
        this.jumpBufferTimer = 0;
    }

    // WICHTIG: deltaTime hinzugefügt!
    handleInput(keys, deltaTime) {
        const maxSpeed = CONFIG.PLAYER.speed;
        const accel = CONFIG.PLAYER.acceleration;
        const friction = CONFIG.PLAYER.friction;

        // 1. Beschleunigen
        if (keys.right) {
            this.velocityX += accel * deltaTime;
            if (this.velocityX > maxSpeed) this.velocityX = maxSpeed;
        } 
        else if (keys.left) {
            this.velocityX -= accel * deltaTime;
            if (this.velocityX < -maxSpeed) this.velocityX = -maxSpeed;
        } 
        else {
            // 2. Abbremsen (Reibung), wenn keine Taste gedrückt ist
            if (this.velocityX > 0) {
                this.velocityX -= friction * deltaTime;
                if (this.velocityX < 0) this.velocityX = 0;
            } 
            else if (this.velocityX < 0) {
                this.velocityX += friction * deltaTime;
                if (this.velocityX > 0) this.velocityX = 0;
            }
        }

        // Jump Buffering Input
        if (keys.up) {
            this.jumpBufferTimer = CONFIG.JUMP_BUFFER_TIME;
            keys.up = false; // Input konsumieren
        }
    }

    updateTimers(deltaTime) {
        if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= deltaTime;
        if (this.coyoteTimeCounter > 0) this.coyoteTimeCounter -= deltaTime;
    }
}