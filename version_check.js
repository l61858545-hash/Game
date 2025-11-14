// Diese Datei wird VOR game.js geladen und prüft, ob sich game.js geändert hat.

(async () => {
    
    const VERSION_KEY = 'platformerVersion';
    const HIGHSCORE_KEY = 'platformerHighScore';
    const PRE_UPDATE_KEY = 'platformerPreUpdateScore';

    try {

        const response = await fetch('game.js', { method: 'HEAD', cache: 'no-cache' });

        const lastModified = response.headers.get('Last-Modified');

        const savedVersion = localStorage.getItem(VERSION_KEY);

        if (lastModified && lastModified !== savedVersion) {
            console.log('Eine neue Version von game.js wurde erkannt! Überprüfe Highscores.');

            
            const currentHighScore = parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0', 10);
            const existingPreUpdateScore = parseInt(localStorage.getItem(PRE_UPDATE_KEY) || '0', 10);

            if (currentHighScore > existingPreUpdateScore) {
                console.log(`Neuer Pre-Update-Rekord! Archiviere ${currentHighScore} über dem alten Wert von ${existingPreUpdateScore}.`);
                localStorage.setItem(PRE_UPDATE_KEY, currentHighScore.toString());
            } else {
                console.log(`Aktueller Highscore (${currentHighScore}) ist nicht besser als der archivierte Score (${existingPreUpdateScore}). Nichts wird geändert.`);
            }

            localStorage.setItem(HIGHSCORE_KEY, '0');

            localStorage.setItem(VERSION_KEY, lastModified);
        }
    } catch (error) {
        console.error('Fehler beim Prüfen der Spielversion:', error);
    }
})();