// leaderboard.js - Version mit Dreamlo

// ==================================================================
// 1. FÜGE HIER DEINE DREAMLO CODES EIN:
// ==================================================================
const DREAMLO_PUBLIC = "692962658f40bb18648fdf3e" ; 
const DREAMLO_PRIVATE = "Nkn6453l0USHQ6_oZshRtgifkDaWesTU2ctii129Jakw" ; 
const DREAMLO_URL = "http://dreamlo.com/lb/" ;
// ==================================================================


const overlay = document.getElementById('leaderboardOverlay');
const scoreDisplay = document.getElementById('finalScoreDisplay');
const nameInput = document.getElementById('playerName');
const submitBtn = document.getElementById('submitScoreBtn');
const list = document.getElementById('leaderboardList');
const inputSection = document.getElementById('inputSection');

function showLeaderboard(score) {
    console.log("Zeige Leaderboard für Score:", score);
    overlay.classList.remove('hidden');
    scoreDisplay.innerText = score;
    
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
        nameInput.value = savedName;
    }

    inputSection.style.display = 'block';
    fetchLeaderboard();
}

function hideLeaderboard() {
    overlay.classList.add('hidden');
}

async function submitScore(score) {
    // Prüfen ob Codes eingefügt wurden
    if (DREAMLO_PUBLIC.includes("HIER_DEIN") || DREAMLO_PRIVATE.includes("HIER_DEIN")) {
        alert("FEHLER: Du hast die Dreamlo-Codes in leaderboard.js noch nicht eingefügt!");
        return;
    }

    let name = nameInput.value.trim() || "Anonym";
    // Nur Buchstaben und Zahlen erlauben, keine Leerzeichen
    name = name.replace(/[^a-zA-Z0-9]/g, "_"); 

    localStorage.setItem('playerName', name);

    // URL bauen
    const url = `${DREAMLO_URL}${DREAMLO_PRIVATE}/add/${name}/${score}`;
    console.log("Sende Score an:", url);

    try {
        submitBtn.disabled = true;
        submitBtn.innerText = "Sende...";

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP Fehler! Status: ${response.status}`);
        }

        console.log("Score erfolgreich gesendet.");
        
        inputSection.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.innerText = "Score senden";
        
        // Kurz warten, dann Liste neu laden
        setTimeout(fetchLeaderboard, 1000);
        
    } catch (error) {
        console.error("Fehler beim Speichern:", error);
        alert("Fehler beim Senden: " + error.message);
        submitBtn.disabled = false;
        submitBtn.innerText = "Score senden";
    }
}

async function fetchLeaderboard() {
    if (DREAMLO_PUBLIC.includes("HIER_DEIN")) {
        list.innerHTML = "<li>Fehler: Public Code fehlt in leaderboard.js</li>";
        return;
    }

    list.innerHTML = "<li>Lade Daten...</li>";
    
    // JSON URL
    const url = `${DREAMLO_URL}${DREAMLO_PUBLIC}/json`;
    console.log("Lade Liste von:", url);

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP Fehler! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Daten empfangen:", data);

        list.innerHTML = "";

        // Fall 1: Liste ist komplett leer
        if (!data.dreamlo || !data.dreamlo.leaderboard) {
            list.innerHTML = "<li>Noch keine Einträge.</li>";
            return;
        }

        let entries = data.dreamlo.leaderboard.entry;

        // Fall 2: Es gibt nur EINEN Eintrag (Dreamlo gibt dann kein Array zurück)
        if (!entries) {
             list.innerHTML = "<li>Keine Einträge gefunden.</li>";
             return;
        }
        
        if (!Array.isArray(entries)) {
            entries = [entries];
        }

        // Sortieren (sicherheitshalber, falls Dreamlo es nicht tut)
        entries.sort((a, b) => parseInt(b.score) - parseInt(a.score));

        // Anzeigen (Max 10)
        entries.slice(0, 10).forEach((entry, index) => {
            const li = document.createElement("li");
            
            // Platzierung Farben
            if (index === 0) li.style.color = "#FFD700"; // Gold
            if (index === 1) li.style.color = "#C0C0C0"; // Silber
            if (index === 2) li.style.color = "#CD7F32"; // Bronze

            const nameSpan = document.createElement("span");
            nameSpan.textContent = entry.name;
            
            const scoreSpan = document.createElement("span");
            scoreSpan.textContent = entry.score;
            scoreSpan.style.fontWeight = "bold";
            
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            list.appendChild(li);
        });

    } catch (error) {
        console.error("Fehler beim Laden:", error);
        list.innerHTML = "<li>Konnte Rangliste nicht laden. (Siehe Konsole F12)</li>";
    }
}

submitBtn.addEventListener('click', () => {
    const currentScore = parseInt(scoreDisplay.innerText);
    submitScore(currentScore);
});