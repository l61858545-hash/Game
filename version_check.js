// Diese Datei wird VOR game.js geladen und prüft, ob sich game.js geändert hat.

(async () => {
    // Definiere die Schlüssel, die wir im localStorage verwenden, an einer zentralen Stelle.
    const VERSION_KEY = 'platformerVersion';
    const HIGHSCORE_KEY = 'platformerHighScore';
    const PRE_UPDATE_KEY = 'platformerPreUpdateScore';

    try {
        // Mache eine HEAD-Anfrage an game.js.
        // Eine HEAD-Anfrage ist sehr effizient, da sie nur die Header und nicht die ganze Datei lädt.
        const response = await fetch('game.js', { method: 'HEAD', cache: 'no-cache' });

        // Hole den "Last-Modified"-Header aus der Antwort.
        const lastModified = response.headers.get('Last-Modified');

        // Hole die zuletzt gespeicherte Version aus dem localStorage.
        const savedVersion = localStorage.getItem(VERSION_KEY);

        // Wenn der Header existiert UND er sich von der gespeicherten Version unterscheidet...
        if (lastModified && lastModified !== savedVersion) {
            console.log('Eine neue Version von game.js wurde erkannt! Setze Highscore zurück.');

            // Hole den aktuellen Highscore.
            const currentHighScore = localStorage.getItem(HIGHSCORE_KEY) || 0;

            // Wenn ein Highscore existierte, archiviere ihn als "Pre-Update Score".
            if (currentHighScore > 0) {
                localStorage.setItem(PRE_UPDATE_KEY, currentHighScore);
            }

            // Setze den aktiven Highscore für die neue Version auf 0.
            localStorage.setItem(HIGHSCORE_KEY, '0');

            // Speichere den neuen Zeitstempel als die aktuelle Version.
            localStorage.setItem(VERSION_KEY, lastModified);
        }
    } catch (error) {
        console.error('Fehler beim Prüfen der Spielversion:', error);
    }
})();