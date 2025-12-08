const DREAMLO_PUBLIC = "692962658f40bb18648fdf3e"; 
const DREAMLO_PRIVATE = "Nkn6453l0USHQ6_oZshRtgifkDaWesTU2ctii129Jakw"; 

const DREAMLO_URL = "http://dreamlo.com/lb/";
const PROXY_URL = "https://api.codetabs.com/v1/proxy?quest=";

// DOM Elemente cachen
const elements = {
    overlay: document.getElementById('leaderboardOverlay'),
    title: document.querySelector('#leaderboardOverlay h2'),
    subTitle: document.querySelector('#leaderboardOverlay h3'),
    scoreLabel: document.querySelector('.score-label'), // NEU: Das Label "Dein Score"
    scoreDisplay: document.getElementById('finalScoreDisplay'),
    nameInput: document.getElementById('playerName'),
    submitBtn: document.getElementById('submitScoreBtn'),
    list: document.getElementById('leaderboardList'),
    inputSection: document.getElementById('inputSection'),
    changePlayerBtn: document.getElementById('changePlayerBtn'),
    restartHint: document.querySelector('.restart-hint')
};

let isSubmitting = false;

export function initLeaderboard() {
    // Event Listener für Buttons
    elements.changePlayerBtn.addEventListener('click', resetPlayerName);
    elements.submitBtn.addEventListener('click', () => {
        const currentScore = parseInt(elements.scoreDisplay.innerText);
        submitScore(currentScore);
    });
}

export function showLeaderboard(score, titleText = "GAME OVER", readOnly = false) {
    elements.overlay.classList.remove('hidden');
    elements.scoreDisplay.innerText = score;
    
    // Titel setzen und Farbe anpassen
    if (elements.title) {
        elements.title.innerText = titleText;
        
        // Klassen zurücksetzen
        elements.title.classList.remove('title-green', 'title-blue');

        if (titleText === "START GAME") {
            elements.title.classList.add('title-green');
        } else if (titleText === "Rangliste") {
            elements.title.classList.add('title-blue');
        }
    }

    // Untertitel "Rangliste" ausblenden, wenn der Haupttitel schon "Rangliste" ist
    if (elements.subTitle) {
        if (titleText === "Rangliste") {
            elements.subTitle.classList.add('hidden');
        } else {
            elements.subTitle.classList.remove('hidden');
        }
    }

    // NEU: Label anpassen ("Best" beim Start, sonst "Dein Score")
    if (elements.scoreLabel) {
        if (titleText === "START GAME") {
            elements.scoreLabel.innerText = "Best";
        } else {
            elements.scoreLabel.innerText = "Dein Score";
        }
    }

    // Text für Start vs. Neustart anpassen
    if (elements.restartHint) {
        if (titleText === "START GAME") {
            elements.restartHint.innerHTML = "Drücke <strong>ENTER</strong> zum Starten";
        } else {
            elements.restartHint.innerHTML = "Drücke <strong>ENTER</strong> zum Neustarten";
        }
    }

    // ReadOnly Modus (für In-Game Ansicht)
    if (readOnly) {
        elements.inputSection.classList.add('hidden');
        if (elements.restartHint) elements.restartHint.classList.add('hidden');
        fetchLeaderboard(); // Daten laden
        return; // Hier abbrechen, keine Input-Logik nötig
    } else {
        // Normaler Modus: Alles anzeigen
        elements.inputSection.classList.remove('hidden');
        if (elements.restartHint) elements.restartHint.classList.remove('hidden');
    }
    
    // --- Ab hier normale Game Over Logik ---
    elements.inputSection.style.display = 'block';
    isSubmitting = false;

    const savedName = localStorage.getItem('playerName');
    const personalBest = parseInt(localStorage.getItem('personalBest') || '0');

    if (savedName) {
        elements.nameInput.value = savedName;
        elements.nameInput.disabled = true; 
        elements.changePlayerBtn.classList.remove('hidden');
        elements.submitBtn.classList.add('hidden'); 

        if (score > personalBest) {
            elements.submitBtn.classList.remove('hidden');
            elements.submitBtn.disabled = true;
            elements.submitBtn.innerText = "Neuer Rekord! Sende...";
            submitScore(score);
        } else {
            fetchLeaderboard();
        }
    } else {
        elements.nameInput.value = "";
        elements.nameInput.disabled = false;
        elements.changePlayerBtn.classList.add('hidden');
        elements.submitBtn.classList.remove('hidden');
        elements.submitBtn.innerText = "Score senden";
        elements.submitBtn.disabled = false;
        fetchLeaderboard();
    }
}

export function updateScoreDisplay(score) {
    if (elements.scoreDisplay) {
        elements.scoreDisplay.innerText = score;
    }
}

export function hideLeaderboard() {
    elements.overlay.classList.add('hidden');
}

function resetPlayerName() {
    if (isSubmitting) return;
    elements.nameInput.disabled = false;
    elements.nameInput.value = "";
    elements.nameInput.focus();
    elements.changePlayerBtn.classList.add('hidden');
    elements.submitBtn.classList.remove('hidden');
    elements.submitBtn.innerText = "Score senden";
    elements.submitBtn.disabled = false;
    localStorage.removeItem('playerName');
}

async function submitScore(score) {
    if (DREAMLO_PUBLIC.includes("HIER_DEIN")) {
        alert("Codes fehlen in js/leaderboard.js!");
        return;
    }
    isSubmitting = true;
    let name = elements.nameInput.value.trim() || "Anonym";
    name = name.replace(/[^a-zA-Z0-9]/g, "_"); 
    localStorage.setItem('playerName', name);
    
    const currentBest = parseInt(localStorage.getItem('personalBest') || '0');
    if (score > currentBest) localStorage.setItem('personalBest', score);

    const targetUrl = `${DREAMLO_URL}${DREAMLO_PRIVATE}/add/${name}/${score}`;
    const finalUrl = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;

    try {
        elements.submitBtn.disabled = true;
        if (elements.submitBtn.innerText !== "Neuer Rekord! Sende...") {
             elements.submitBtn.innerText = "Sende...";
        }
        await fetch(finalUrl);
        
        elements.inputSection.style.display = 'block'; 
        elements.nameInput.disabled = true;
        elements.submitBtn.classList.add('hidden');
        elements.changePlayerBtn.classList.remove('hidden');
        isSubmitting = false;
        setTimeout(fetchLeaderboard, 1000);
    } catch (error) {
        console.error("Fehler:", error);
        elements.submitBtn.classList.remove('hidden');
        elements.submitBtn.disabled = false;
        elements.submitBtn.innerText = "Erneut versuchen";
        isSubmitting = false;
        setTimeout(fetchLeaderboard, 1000);
    }
}

async function fetchLeaderboard() {
    elements.list.innerHTML = "<li>Lade Daten...</li>";
    const targetUrl = `${DREAMLO_URL}${DREAMLO_PUBLIC}/json`;
    const finalUrl = `${PROXY_URL}${encodeURIComponent(targetUrl + "?date=" + new Date().getTime())}`;

    try {
        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error(`Proxy Fehler: ${response.status}`);
        const data = await response.json();
        elements.list.innerHTML = "";

        if (!data.dreamlo || !data.dreamlo.leaderboard) {
            elements.list.innerHTML = "<li>Noch keine Einträge.</li>";
            return;
        }
        let entries = data.dreamlo.leaderboard.entry;
        if (!entries) { elements.list.innerHTML = "<li>Keine Einträge.</li>"; return; }
        if (!Array.isArray(entries)) entries = [entries];

        entries.sort((a, b) => parseInt(b.score) - parseInt(a.score));
        entries.slice(0, 10).forEach((entry, index) => {
            const li = document.createElement("li");
            if (index === 0) li.style.color = "#FFD700"; 
            if (index === 1) li.style.color = "#C0C0C0"; 
            if (index === 2) li.style.color = "#CD7F32"; 
            
            const nameSpan = document.createElement("span");
            nameSpan.textContent = entry.name;
            const scoreSpan = document.createElement("span");
            scoreSpan.textContent = entry.score;
            scoreSpan.style.fontWeight = "bold";
            
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            elements.list.appendChild(li);
        });
    } catch (error) {
        console.error("Fehler:", error);
        elements.list.innerHTML = "<li>Konnte Rangliste nicht laden.</li>";
    }
}