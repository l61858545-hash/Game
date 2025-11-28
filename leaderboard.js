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

function showLeaderboard(score) {
    overlay.classList.remove('hidden');
    scoreDisplay.innerText = score;
    
    const savedName = localStorage.getItem('playerName');
    
    if (savedName) {
        nameInput.value = savedName;
        nameInput.disabled = true; 
        changePlayerBtn.classList.remove('hidden');
    } else {
        nameInput.value = "";
        nameInput.disabled = false;
        changePlayerBtn.classList.add('hidden');
    }

    inputSection.style.display = 'block';
    fetchLeaderboard();
}

function hideLeaderboard() {
    overlay.classList.add('hidden');
}

changePlayerBtn.addEventListener('click', () => {
    nameInput.disabled = false;
    nameInput.value = "";
    nameInput.focus();
    changePlayerBtn.classList.add('hidden');
    localStorage.removeItem('playerName');
});

async function submitScore(score) {
    if (DREAMLO_PUBLIC.includes("HIER_DEIN")) {
        alert("Codes fehlen in leaderboard.js!");
        return;
    }

    let name = nameInput.value.trim() || "Anonym";
    name = name.replace(/[^a-zA-Z0-9]/g, "_"); 
    
    localStorage.setItem('playerName', name);

    const targetUrl = `${DREAMLO_URL}${DREAMLO_PRIVATE}/add/${name}/${score}`;
    const finalUrl = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;

    try {
        submitBtn.disabled = true;
        submitBtn.innerText = "Sende...";

        await fetch(finalUrl);
        
        inputSection.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.innerText = "Score senden";
        
        setTimeout(fetchLeaderboard, 1000);
        
    } catch (error) {
        console.error("Fehler:", error);
        setTimeout(fetchLeaderboard, 1000);
        submitBtn.disabled = false;
        submitBtn.innerText = "Score senden";
    }
}

async function fetchLeaderboard() {
    list.innerHTML = "<li>Lade Daten...</li>";
    
    const targetUrl = `${DREAMLO_URL}${DREAMLO_PUBLIC}/json`;
    // Timestamp gegen Caching
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