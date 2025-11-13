// Führe den Code aus, sobald die Seite vollständig geladen ist.
window.addEventListener('DOMContentLoaded', () => {

    // Elemente von der HTML-Seite holen
    const currentHighScoreDisplay = document.getElementById('currentHighScore');
    const preUpdateScoreDisplay = document.getElementById('preUpdateScore');
    const saveButton = document.getElementById('saveButton');
    const loadInput = document.getElementById('loadInput');

    // Funktion, um die angezeigten Scores zu aktualisieren
    function updateDisplay() {
        const highScore = localStorage.getItem('platformerHighScore') || 0;
        const preUpdateScore = localStorage.getItem('platformerPreUpdateScore') || 0;
        
        currentHighScoreDisplay.textContent = highScore;
        preUpdateScoreDisplay.textContent = preUpdateScore;
    }

    // Funktion zum Speichern der Scores in einer Datei
    function saveScoresToFile() {
        // 1. Lese die relevanten Daten aus dem localStorage
        const scores = {
            highScore: localStorage.getItem('platformerHighScore') || 0,
            preUpdateScore: localStorage.getItem('platformerPreUpdateScore') || 0,
            version: localStorage.getItem('platformerVersion') || "1.0"
        };

        // 2. Konvertiere das Objekt in einen formatierten JSON-String
        const jsonString = JSON.stringify(scores, null, 2);

        // 3. Erstelle ein "Blob"-Objekt (eine Art Datei im Speicher)
        const blob = new Blob([jsonString], { type: 'application/json' });

        // 4. Erstelle einen temporären Link zum Herunterladen des Blobs
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'platformer_scores.json'; // Dateiname für den Download
        document.body.appendChild(a);
        a.click(); // Simuliere einen Klick auf den Link, um den Download zu starten

        // 5. Räume auf, indem du den Link und die URL entfernst
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Funktion zum Laden der Scores aus einer Datei
    function loadScoresFromFile(event) {
        const file = event.target.files[0];
        if (!file) {
            return; // Beenden, wenn keine Datei ausgewählt wurde
        }

        const reader = new FileReader();

        // Diese Funktion wird ausgeführt, wenn die Datei fertig gelesen wurde
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const loadedScores = JSON.parse(content);

                // Überprüfe, ob die geladene Datei die erwarteten Daten enthält
                if (loadedScores.highScore !== undefined && loadedScores.preUpdateScore !== undefined) {
                    // Speichere die geladenen Werte im localStorage
                    localStorage.setItem('platformerHighScore', loadedScores.highScore);
                    localStorage.setItem('platformerPreUpdateScore', loadedScores.preUpdateScore);
                    localStorage.setItem('platformerVersion', loadedScores.version || "1.0");

                    // Aktualisiere die Anzeige auf der Seite
                    updateDisplay();
                    alert('Scores erfolgreich geladen!');
                } else {
                    alert('Fehler: Die Datei hat ein ungültiges Format.');
                }
            } catch (error) {
                alert('Fehler beim Lesen der Datei. Ist es eine gültige JSON-Datei?');
                console.error("Parse Error:", error);
            }
        };

        // Starte das Lesen der Datei als Text
        reader.readAsText(file);
    }

    // Füge die Funktionen als Event-Listener zu den Buttons hinzu
    saveButton.addEventListener('click', saveScoresToFile);
    loadInput.addEventListener('change', loadScoresFromFile);

    // Rufe die Funktion beim ersten Laden der Seite auf, um die aktuellen Scores anzuzeigen
    updateDisplay();
});