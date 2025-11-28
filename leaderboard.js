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
    let name = nameInput.value.trim() || "Anonym";
    // Dreamlo mag keine Leerzeichen oder Sonderzeichen im Namen
    name = name.replace(/[^a-zA-Z0-9]/g, "_"); 

    localStorage.setItem('playerName', name);

    const url = `${DREAMLO_URL}${DREAMLO_PRIVATE}/add/${name}/${score}`;

    try {
        submitBtn.disabled = true;
        submitBtn.innerText = "Sende...";

        await fetch(url);
        
        inputSection.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.innerText = "Score senden";
        
        setTimeout(fetchLeaderboard, 500);
        
    } catch (error) {
        console.error("Fehler beim Speichern: ", error);
        alert("Fehler beim Senden. Prüfe deine Internetverbindung.");
        submitBtn.disabled = false;
        submitBtn.innerText = "Score senden";
    }
}

async function fetchLeaderboard() {
    list.innerHTML = "<li>Lade Daten...</li>";
    const url = `${DREAMLO_URL}${DREAMLO_PUBLIC}/json`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        list.innerHTML = "";

        if (!data.dreamlo.leaderboard) {
            list.innerHTML = "<li>Noch keine Einträge.</li>";
            return;
        }

        let entries = data.dreamlo.leaderboard.entry;
        if (!Array.isArray(entries)) {
            entries = [entries];
        }

        entries.slice(0, 10).forEach((entry) => {
            const li = document.createElement("li");
            
            const nameSpan = document.createElement("span");
            nameSpan.textContent = entry.name;
            
            const scoreSpan = document.createElement("span");
            scoreSpan.textContent = entry.score;
            
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            list.appendChild(li);
        });

    } catch (error) {
        console.error("Fehler beim Laden: ", error);
        list.innerHTML = "<li>Konnte Rangliste nicht laden.</li>";
    }
}

submitBtn.addEventListener('click', () => {
    const currentScore = parseInt(scoreDisplay.innerText);
    submitScore(currentScore);
});