import { CONFIG } from './config.js';

const KEYS = {
    VERSION: 'platformerVersion',
    HIGHSCORE: 'platformerHighScore',
    PRE_UPDATE: 'platformerPreUpdateScore'
};

export async function checkVersionAndStorage() {
    // 1. Version Check via Header (nur wenn online)
    try {
        // Wir nehmen an, main.js ist die Referenzdatei für Änderungen
        const response = await fetch('js/main.js', { method: 'HEAD', cache: 'no-cache' });
        const lastModified = response.headers.get('Last-Modified');
        const savedVersion = localStorage.getItem(KEYS.VERSION);

        if (lastModified && lastModified !== savedVersion) {
            console.log('Update erkannt!');
            const currentHighScore = parseInt(localStorage.getItem(KEYS.HIGHSCORE) || '0', 10);
            const existingPreUpdateScore = parseInt(localStorage.getItem(KEYS.PRE_UPDATE) || '0', 10);

            if (currentHighScore > existingPreUpdateScore) {
                localStorage.setItem(KEYS.PRE_UPDATE, currentHighScore.toString());
            }
            localStorage.setItem(KEYS.HIGHSCORE, '0');
            localStorage.setItem(KEYS.VERSION, lastModified);
        }
    } catch (e) {
        console.warn("Offline oder lokaler Test: Versionscheck übersprungen.");
    }
}

export function getHighScores() {
    return {
        highScore: parseInt(localStorage.getItem(KEYS.HIGHSCORE) || '0', 10),
        preUpdateScore: parseInt(localStorage.getItem(KEYS.PRE_UPDATE) || '0', 10)
    };
}

export function saveHighScore(score) {
    localStorage.setItem(KEYS.HIGHSCORE, score.toString());
}