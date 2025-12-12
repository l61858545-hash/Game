# Endless Runner Platformer

Ein webbasierter Endless-Runner mit präziser Physik, prozeduraler Generierung und Online-Rangliste.

## 🚀 Start



## 🎮 Features

*   **Physik-Engine:** Beschleunigung, Reibung, Coyote Time & Jump Buffering für optimales Spielgefühl.
*   **Visuelle Effekte:** "Squash & Stretch" Animationen beim Springen/Landen, Screen Shake und Glassmorphism-UI.
*   **Prozedurale Welt:** Plattformen (statisch, beweglich, zerfallend) werden endlos generiert.
*   **Rangliste:** Lokaler Highscore, "Old"-Score (nach Updates) und globale Online-Rangliste (Dreamlo).
*   **Technik:** Vanilla JavaScript (ES6 Module), HTML5 Canvas, Cache-Busting via Import Maps.

## ⌨️ Steuerung

| Taste | Aktion |
| :--- | :--- |
| **Pfeiltasten / WASD** | Bewegen (Links/Rechts) |
| **Leertaste / Pfeil hoch** | Springen |
| **Enter** | Spiel starten / Neustart / Rangliste öffnen |

## 📂 Projektstruktur

*   **`index.html`**: Einstiegspunkt, HUD, Import-Map Logik.
*   **`style.css`**: Styling für Canvas und UI-Overlays.
*   **`js/`**:
    *   `main.js`: Game-Loop und Initialisierung.
    *   `player.js`: Spieler-Status und Input-Handling.
    *   `physics.js`: Bewegungslogik, Kollisionen, Kamera.
    *   `renderer.js`: Zeichnen auf dem Canvas & HUD-Updates.
    *   `generator.js`: Erstellung der Plattformen.
    *   `leaderboard.js`: API-Kommunikation (Dreamlo).
    *   `storage.js`: Lokales Speichern & Versions-Check.
    *   `config.js`: Globale Spiel-Einstellungen.
