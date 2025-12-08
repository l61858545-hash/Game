import { CONFIG } from './config.js';
import { showLeaderboard } from './leaderboard.js';

export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // HUD Elemente cachen
        this.hudElements = {
            score: document.getElementById('hudScore'),
            best: document.getElementById('hudBest'),
            preUpdateBox: document.getElementById('hudPreUpdate'),
            preUpdateValue: document.getElementById('hudPreUpdateValue')
        };
    }

    initHUD(preUpdateScore) {
        if (preUpdateScore > 0) {
            this.hudElements.preUpdateBox.classList.remove('hidden');
            this.hudElements.preUpdateValue.innerText = preUpdateScore;
        } else {
            this.hudElements.preUpdateBox.classList.add('hidden');
        }
    }

    draw(player, platforms, score, highScore, shakeX, shakeY) {
        this.ctx.save();

        // 1. Shake anwenden
        if (shakeX !== 0 || shakeY !== 0) {
            this.ctx.translate(shakeX, shakeY);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Plattformen zeichnen
        platforms.forEach(platform => {
            if (platform.y > this.canvas.height || platform.y + platform.height < 0) return;

            if (platform.isTemporary) {
                this.ctx.fillStyle = '#C2B280';
                if (platform.isDisappearing && platform.disappearTimer < 1 && Math.floor(platform.disappearTimer * 10) % 2 === 0) {
                    this.ctx.fillStyle = 'white';
                }
            } else if (platform.isMoving) {
                this.ctx.fillStyle = '#FFA500';
            } else {
                this.ctx.fillStyle = 'green';
            }
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });

        // 3. Spieler zeichnen (Squash & Stretch)
        this.drawPlayer(player);

        // 4. HUD aktualisieren
        if (this.hudElements.score) this.hudElements.score.innerText = score;
        if (this.hudElements.best) this.hudElements.best.innerText = highScore;

        this.ctx.restore();
    }

    drawPlayer(player) {
        this.ctx.save();

        const anchorX = player.x + player.width / 2;
        const anchorY = player.y + player.height; // Füße als Anker

        const refSpeed = 1000;
        const intensity = CONFIG.PLAYER_STRETCH_INTENSITY || 0.2;

        let scaleX = 1 + (Math.abs(player.velocityX) / refSpeed) * intensity 
                       - (Math.abs(player.velocityY) / refSpeed) * intensity;

        scaleX = Math.max(0.6, Math.min(1.4, scaleX));
        let scaleY = 1 / scaleX;

        this.ctx.translate(anchorX, anchorY);
        this.ctx.scale(scaleX, scaleY);

        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(-player.width / 2, -player.height, player.width, player.height);

        this.ctx.restore();
    }

    drawGameOverScreen(isStartScreen, score, highScore) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const overlay = document.getElementById('leaderboardOverlay');
        if (overlay && overlay.classList.contains('hidden')) {
            const title = isStartScreen ? "START GAME" : "GAME OVER";
            const scoreToShow = isStartScreen ? highScore : score;
            showLeaderboard(scoreToShow, title);
        }
    }
}