import { CONFIG } from './config.js';

const KEYS = {
    VERSION: 'platformerVersion',
    HIGHSCORE: 'platformerHighScore',
    PRE_UPDATE: 'platformerPreUpdateScore',
    // Wir brauchen Zugriff auf den Key aus leaderboard.js, 
    // auch wenn er dort hardcoded ist, wissen wir, dass er 'personalBest' heißt.
    PERSONAL_BEST: 'personalBest' 
};

export async function checkVersionAndStorage() {
    // 1. Version Check via Header (nur wenn online)
    try {
        // Wir nehmen an, main.js ist die Referenzdatei für Änderungen
        const response = await fetch('js/main.js', { method: 'HEAD', cache: 'no-cache' });
        const lastModified = response.headers.get('Last-Modified');
        const savedVersion = localStorage.getItem(KEYS.VERSION);

        if (lastModified && lastModified !== savedVersion) {
            console.log('Update erkannt! Setze Scores zurück...');
            
            const currentHighScore = parseInt(localStorage.getItem(KEYS.HIGHSCORE) || '0', 10);
            const existingPreUpdateScore = parseInt(localStorage.getItem(KEYS.PRE_UPDATE) || '0', 10);

            // Den alten Highscore als "Old" speichern
            if (currentHighScore > existingPreUpdateScore) {
                localStorage.setItem(KEYS.PRE_UPDATE, currentHighScore.toString());
            }
            
            // Lokalen Highscore resetten
            localStorage.setItem(KEYS.HIGHSCORE, '0');
            
            // WICHTIG: Auch den Vergleichswert für das Leaderboard resetten!
            // Damit fängt man in der neuen Version auch online wieder bei 0 an.
            localStorage.removeItem(KEYS.PERSONAL_BEST);

            // Neue Version speichern
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