// Diese Datei wird VOR game.js geladen und prüft, ob sich game.js geändert hat.

(async () => {
    // Definiere die Schlüssel, die wir im localStorage verwenden, an einer zentralen Stelle.
    const VERSION_KEY = 'platformerVersion';
    const HIGHSCORE_KEY = 'platformerHighScore';
    const PRE_UPDATE_KEY = 'platformerPreUpdateScore';

    try {
        // Mache eine HEAD-Anfrage an game.js.
        const response = await fetch('game.js', { method: 'HEAD', cache: 'no-cache' });

        // Hole den "Last-Modified"-Header aus der Antwort.
        const lastModified = response.headers.get('Last-Modified');

        // Hole die zuletzt gespeicherte Version aus dem localStorage.
        const savedVersion = localStorage.getItem(VERSION_KEY);

        // Wenn der Header existiert UND er sich von der gespeicherten Version unterscheidet...
        if (lastModified && lastModified !== savedVersion) {
            console.log('Eine neue Version von game.js wurde erkannt! Überprüfe Highscores.');

            // ==================================================================
            // GEÄNDERTE LOGIK: Vergleiche die Scores, bevor du sie archivierst.
            // ==================================================================
            // Hole den aktuellen Highscore und den bereits archivierten Score als Zahlen.
            const currentHighScore = parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0', 10);
            const existingPreUpdateScore = parseInt(localStorage.getItem(PRE_UPDATE_KEY) || '0', 10);

            // Nur wenn der Highscore der auslaufenden Version BESSER ist, wird er zum neuen Pre-Update Score.
            if (currentHighScore > existingPreUpdateScore) {
                console.log(`Neuer Pre-Update-Rekord! Archiviere ${currentHighScore} über dem alten Wert von ${existingPreUpdateScore}.`);
                localStorage.setItem(PRE_UPDATE_KEY, currentHighScore.toString());
            } else {
                console.log(`Aktueller Highscore (${currentHighScore}) ist nicht besser als der archivierte Score (${existingPreUpdateScore}). Nichts wird geändert.`);
            }
            // ==================================================================

            // Der aktive Highscore wird für die neue Version in jedem Fall zurückgesetzt.
            localStorage.setItem(HIGHSCORE_KEY, '0');

            // Speichere den neuen Zeitstempel als die aktuelle Version.
            localStorage.setItem(VERSION_KEY, lastModified);
        }
    } catch (error) {
        console.error('Fehler beim Prüfen der Spielversion:', error);
    }
})();