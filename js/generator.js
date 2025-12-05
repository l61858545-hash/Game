import { CONFIG } from './config.js';

export class PlatformGenerator {
    constructor(canvasWidth) {
        this.canvasWidth = canvasWidth;
        this.reset();
    }

    reset() {
        this.lastJumpWasVertical = false;
        this.lastJumpWasLongJump = false;
        this.jumpsSinceLastLongJump = 6;
    }

    generate(platforms, player, score) {
        const lastPlatform = platforms[platforms.length - 1];
        const difficultyFactor = Math.min(2.5, 1 + score / 5000);
        
        // Physik-Berechnungen basierend auf Config
        const maxJumpHeight = (CONFIG.JUMP_STRENGTH ** 2) / (2 * (CONFIG.GRAVITY * 60));
        const timeToPeak = -CONFIG.JUMP_STRENGTH / (CONFIG.GRAVITY * 60);
        const horizontalReach = CONFIG.PLAYER.speed * timeToPeak;
        
        const minWidth = 50;
        const maxWidth = Math.max(minWidth, 150 - (difficultyFactor - 1) * 50);
        
        const newPlatform = {
            width: Math.random() * (maxWidth - minWidth) + minWidth,
            height: 20,
            y: 0,
            isMoving: false,
            isTemporary: false
        };

        let horizontalShift;
        let verticalGap;

        const longJumpChance = 0.04 + (difficultyFactor - 1) * 0.04;
        const skipChance = 0.1;
        const movingPlatformChance = 0.15 + (difficultyFactor - 1) * 0.1;

        // 1. Typ bestimmen
        if (Math.random() < movingPlatformChance && score > 500 && !lastPlatform.isTemporary && !this.lastJumpWasLongJump) {
            newPlatform.isMoving = true;
            newPlatform.moveSpeed = (Math.random() * 1 + 1) * Math.min(1.5, difficultyFactor);
            newPlatform.moveDirection = Math.random() < 0.5 ? 1 : -1;
            this.jumpsSinceLastLongJump++;
            this.lastJumpWasLongJump = false;

        } else if (Math.random() < longJumpChance && score > 3000 && !this.lastJumpWasVertical && this.jumpsSinceLastLongJump >= 6) {
            newPlatform.isTemporary = true;
            this.jumpsSinceLastLongJump = 0;
            this.lastJumpWasLongJump = true;

        } else if (Math.random() < skipChance && score > 800 && !this.lastJumpWasLongJump) {
            newPlatform.isTemporary = true;
            this.jumpsSinceLastLongJump++;
            this.lastJumpWasLongJump = false;

        } else {
            const temporaryPlatformChance = (difficultyFactor - 1) * 0.1;
            if (Math.random() < temporaryPlatformChance && score > 1000) {
                newPlatform.isTemporary = true;
            }
            this.jumpsSinceLastLongJump++;
            this.lastJumpWasLongJump = false;
        }

        // 2. Platzieren
        if (newPlatform.isMoving) {
            const minVerticalGap = maxJumpHeight * 0.7;
            const maxVerticalGap = maxJumpHeight * 0.9;
            verticalGap = Math.random() * (maxVerticalGap - minVerticalGap) + minVerticalGap;
            
            const platformTravelDistance = newPlatform.moveSpeed * newPlatform.moveDirection * 60 * timeToPeak;
            const minTargetShift = horizontalReach * 0.4;
            const maxTargetShift = horizontalReach * 0.9;
            const targetShiftMagnitude = Math.random() * (maxTargetShift - minTargetShift) + minTargetShift;
            const wallMargin = this.canvasWidth * 0.25;
            let targetDirection = Math.random() < 0.5 ? 1 : -1;
            if (lastPlatform.x < wallMargin) targetDirection = 1;
            else if (lastPlatform.x + lastPlatform.width > this.canvasWidth - wallMargin) targetDirection = -1;
            
            const targetShift = targetShiftMagnitude * targetDirection;
            const lastPlatformCenterX = lastPlatform.x + lastPlatform.width / 2;
            const targetLandingCenterX = lastPlatformCenterX + targetShift;
            const initialPlatformCenterX = targetLandingCenterX - platformTravelDistance;
            newPlatform.x = initialPlatformCenterX - newPlatform.width / 2;
            newPlatform.y = lastPlatform.y - verticalGap;

        } else {
            if (this.lastJumpWasLongJump) {
                // Weitsprung
                verticalGap = Math.random() * 60 - 20;
                newPlatform.width = minWidth;
                const minHorizontalShift = horizontalReach * 0.95;
                const maxHorizontalShift = horizontalReach * 0.99;
                const shiftMagnitude = Math.random() * (maxHorizontalShift - minHorizontalShift) + minHorizontalShift;
                const wallMargin = this.canvasWidth * 0.25;
                if (lastPlatform.x < wallMargin) horizontalShift = shiftMagnitude;
                else if (lastPlatform.x + lastPlatform.width > this.canvasWidth - wallMargin) horizontalShift = -shiftMagnitude;
                else horizontalShift = Math.random() < 0.5 ? shiftMagnitude : -shiftMagnitude;
                this.lastJumpWasVertical = false;
            } else if (newPlatform.isTemporary && !this.lastJumpWasLongJump && !newPlatform.isMoving && Math.random() < 0.5) {
                // Überspringbar
                verticalGap = Math.random() * (maxJumpHeight * 0.6 - 40) + 40;
                const minHorizontalShift = horizontalReach * 0.2;
                const maxHorizontalShift = horizontalReach * 0.8;
                horizontalShift = Math.random() * (maxHorizontalShift - minHorizontalShift) + minHorizontalShift;
                if (Math.random() < 0.5) horizontalShift = -horizontalShift;
            } else {
                // Normal
                const minVerticalGap = maxJumpHeight * 0.7;
                const maxVerticalGap = maxJumpHeight * 0.9;
                verticalGap = Math.random() * (maxVerticalGap - minVerticalGap) + minVerticalGap;
                const minHorizontalShift = horizontalReach * (0.3 * difficultyFactor);
                const maxHorizontalShift = horizontalReach * 0.9;
                const shiftMagnitude = Math.random() * (maxHorizontalShift - minHorizontalShift) + minHorizontalShift;
                const wallMargin = this.canvasWidth * 0.25;
                if (lastPlatform.x < wallMargin) horizontalShift = shiftMagnitude;
                else if (lastPlatform.x + lastPlatform.width > this.canvasWidth - wallMargin) horizontalShift = -shiftMagnitude;
                else horizontalShift = Math.random() < 0.5 ? shiftMagnitude : -shiftMagnitude;
                
                const verticalThreshold = 20;
                if (Math.abs(horizontalShift) < verticalThreshold) {
                    if (this.lastJumpWasVertical) {
                        horizontalShift = (horizontalShift >= 0 ? 1 : -1) * minHorizontalShift;
                        this.lastJumpWasVertical = false;
                    } else { this.lastJumpWasVertical = true; }
                } else { this.lastJumpWasVertical = false; }
            }
            newPlatform.y = lastPlatform.y - verticalGap;
            const lastPlatformCenterX = lastPlatform.x + lastPlatform.width / 2;
            newPlatform.x = (lastPlatformCenterX + horizontalShift) - newPlatform.width / 2;
        }

        if (newPlatform.x < 10) newPlatform.x = 10;
        if (newPlatform.x + newPlatform.width > this.canvasWidth - 10) {
            newPlatform.x = this.canvasWidth - newPlatform.width - 10;
        }
        platforms.push(newPlatform);
    }
}