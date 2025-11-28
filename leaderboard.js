// leaderboard.js - Version mit Dreamlo

// ==================================================================
// 1. FÜGE HIER DEINE DREAMLO CODES EIN:
// ==================================================================
const DREAMLO_PUBLIC = "692962658f40bb18648fdf3e" ; 
const DREAMLO_PRIVATE = "Nkn6453l0USHQ6_oZshRtgifkDaWesTU2ctii129Jakw" ; 
const DREAMLO_URL = "http://dreamlo.com/lb/" ;
// ==================================================================

const PROXY_URL = "https://api.codetabs.com/v1/proxy?quest=";
// ==================================================================

const overlay = document.getElementById('leaderboardOverlay');
const scoreDisplay = document.getElementById('finalScoreDisplay');
const nameInput = document.getElementById('playerName');
const submitBtn = document.getElementById('submitScoreBtn');
const list = document.getElementById('leaderboardList');
const inputSection = document.getElementById('inputSection');
const changePlayerBtn = document.getElementById('changePlayerBtn');

// Hilfsvariable um zu verhindern, dass wir während des Auto-Submits editieren
let isSubmitting = false;

function showLeaderboard(score) {
    overlay.classList.remove('hidden');
    scoreDisplay.innerText = score;
    
    const savedName = localStorage.getItem('playerName');
    // Wir holen den lokal gespeicherten persönlichen Rekord
    const personalBest = parseInt(localStorage.getItem('personalBest') || '0');

    inputSection.style.display = 'block';
    isSubmitting = false;

    if (savedName) {
        // --- Fall A: Spieler ist bekannt ---
        nameInput.value = savedName;
        nameInput.disabled = true; 
        changePlayerBtn.classList.remove('hidden'); // Stift zeigen
        
        // Standardmäßig Knopf verstecken
        submitBtn.classList.add('hidden'); 

        if (score > personalBest) {
            // Neuer persönlicher Rekord! -> Automatisch senden
            console.log("Neuer persönlicher Rekord! Auto-Submit...");
            
            // Visuelles Feedback: Knopf kurz zeigen mit Status
            submitBtn.classList.remove('hidden');
            submitBtn.disabled = true;
            submitBtn.innerText = "Neuer Rekord! Sende...";
            
            submitScore(score);
        } else {
            // Kein Rekord -> Nur Liste laden, kein Senden möglich
            console.log("Kein neuer Rekord. Zeige nur Liste.");
            fetchLeaderboard();
        }

    } else {
        // --- Fall B: Neuer Spieler (noch kein Name) ---
        nameInput.value = "";
        nameInput.disabled = false;
        changePlayerBtn.classList.add('hidden'); // Stift weg
        submitBtn.classList.remove('hidden'); // Knopf zeigen
        submitBtn.innerText = "Score senden";
        submitBtn.disabled = false;
        
        fetchLeaderboard();
    }
}

function hideLeaderboard() {
    overlay.classList.add('hidden');
}

// Event Listener für den Stift-Knopf (Namen ändern)
changePlayerBtn.addEventListener('click', () => {
    if (isSubmitting) return; // Nicht erlauben während des Sendens

    nameInput.disabled = false; // Entsperren
    nameInput.value = ""; // Leeren
    nameInput.focus(); // Fokus setzen
    
    changePlayerBtn.classList.add('hidden'); // Stift weg
    submitBtn.classList.remove('hidden'); // Senden-Knopf WIEDER ANZEIGEN
    submitBtn.innerText = "Score senden";
    submitBtn.disabled = false;
    
    localStorage.removeItem('playerName'); // Alten Namen vergessen
});

async function submitScore(score) {
    if (DREAMLO_PUBLIC.includes("HIER_DEIN")) {
        alert("Codes fehlen in leaderboard.js!");
        return;
    }

    isSubmitting = true;
    let name = nameInput.value.trim() || "Anonym";
    name = name.replace(/[^a-zA-Z0-9]/g, "_"); 
    
    // Namen speichern
    localStorage.setItem('playerName', name);
    
    // Personal Best aktualisieren, wenn der aktuelle Score höher ist
    const currentBest = parseInt(localStorage.getItem('personalBest') || '0');
    if (score > currentBest) {
        localStorage.setItem('personalBest', score);
    }

    const targetUrl = `${DREAMLO_URL}${DREAMLO_PRIVATE}/add/${name}/${score}`;
    const finalUrl = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;

    try {
        // Button Status aktualisieren (falls er sichtbar ist)
        submitBtn.disabled = true;
        if (submitBtn.innerText !== "Neuer Rekord! Sende...") {
             submitBtn.innerText = "Sende...";
        }

        await fetch(finalUrl);
        
        // Nach dem Senden:
        // Input wieder sperren und Button verstecken
        inputSection.style.display = 'block'; 
        nameInput.disabled = true;
        submitBtn.classList.add('hidden'); // Knopf weg!
        changePlayerBtn.classList.remove('hidden'); // Stift wieder da
        
        isSubmitting = false;
        
        // Liste neu laden
        setTimeout(fetchLeaderboard, 1000);
        
    } catch (error) {
        console.error("Fehler:", error);
        // Bei Fehler Button wieder freigeben
        submitBtn.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerText = "Erneut versuchen";
        isSubmitting = false;
        
        // Trotzdem Liste laden, vielleicht hat es ja doch geklappt
        setTimeout(fetchLeaderboard, 1000);
    }
}

async function fetchLeaderboard() {
    list.innerHTML = "<li>Lade Daten...</li>";
    
    const targetUrl = `${DREAMLO_URL}${DREAMLO_PUBLIC}/json`;
    const targetUrlWithTime = targetUrl + "?date=" + new Date().getTime();
    const finalUrl = `${PROXY_URL}${encodeURIComponent(targetUrlWithTime)}`;

    try {
        const response = await fetch(finalUrl);
        
        if (!response.ok) {
            throw new Error(`Proxy Fehler: ${response.status}`);
        }

        const data = await response.json();

        list.innerHTML = "";

        if (!data.dreamlo || !data.dreamlo.leaderboard) {
            list.innerHTML = "<li>Noch keine Einträge.</li>";
            return;
        }

        let entries = data.dreamlo.leaderboard.entry;
        
        if (!entries) {
             list.innerHTML = "<li>Keine Einträge gefunden.</li>";
             return;
        }
        
        if (!Array.isArray(entries)) {
            entries = [entries];
        }

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
            list.appendChild(li);
        });

    } catch (error) {
        console.error("Fehler beim Laden:", error);
        list.innerHTML = "<li>Konnte Rangliste nicht laden.</li>";
    }
}

submitBtn.addEventListener('click', () => {
    const currentScore = parseInt(scoreDisplay.innerText);
    submitScore(currentScore);
});