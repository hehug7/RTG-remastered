/*
    Ideer:
        prøveteste tidsinterval mellom powerups og maxcoins avhengig av lvl.

        TODO Etablere spillgrid
    Etabler spillgrid 20 * 20 ? /50/100

    Highscoretabell
        TODO mulighet til å lagre highscore lokalt
        Localstorage

    Powerups
        TODO Legge til random powerup (hvit - alle farger)
        Velger random en funksjon fra de andre
        TODO legger til en lydsfx for hver powerup

    On completion
        TODO UNLOCKABLES: lage en rainbow colored circle(coin)
        TODO lage lvl 2 hvor du maa samle flere coins
        TODO gamemodes
            Grey obstacles in random sizes each time.
            the powerups are your enemy?
            hardcore: du har bare ett liv
            ++

    FIXING:
        TODO fikse powerup text (litt uklart hva det betydde)
        TODO fikse onclick to start (not on the text) (?)
        TODO fikse at obstacle forsvinner eller skifter farge når du berører det
    Fikse overlapping med powerups, obstacle og coins (z-index)

    gmap:
    gray
    gray (insertbefore elem)
    elem : element som skiller powerup og gray boxes
    powerup
    powerup
    powerup (insertbefore coin)
    coin
 */

/* gamemodes:
    0: startup menu,
    1: game
    2: gamemode??
*/

let modes = [0, 1];
let mode = modes[0];

// game map
let map = document.getElementById("map");
let gMap = document.getElementById("gMap");

// titles
let titles = document.getElementById("titles");
let title1 = document.getElementById("title1");
let title2 = document.getElementById("title2");

// Handles submitting highscore
let regBtn = document.getElementById("regBtn");
let tbody = document.getElementById("tBdy");
let nickInp = document.getElementById("nickInp");

// Status
let antCoins = document.getElementById("antCoins");

let collectedCoins = 0;
let winScore = 100;

// Lives
let antLives = document.getElementById("antLives");
let amountOfLives = 3;
let lives;
let livesColors = ["red", "orange", "yellow", "black"];

// Radius
let obstacleRadius = 50;
let coinRadius = 17;

// PowerUp Spawn Interval
let pusi = 5;
let powerUpInterval;

// powerups [0: green, : blue, 2: orange, 3: red, 4: pink]
let powerUpArray = [];
let powerUpTypes = ["small", "big", "bonus", "loss", "change"];
let powerUpColors = ["#37FF00", "#1100FF" ,"#FF8D00", "#FF0000", "#F400E8"];

// highscore
let highscores = [];
let highscoreRegistered = false;

// Audio elements
let sfx = true;
let music = true;

let coinSound = setAudioElem('coinsound.mp3', 'sfx');
let gameOverSound = setAudioElem('gameover.mp3', 'sfx');
let powerUpSound = setAudioElem('powerup.mp3', 'sfx');
let winSound = setAudioElem('winSound.mp3', 'sfx');
let themeSong = setAudioElem('StreetFighter.mp3', 'themes');
let loseLifeSound = setAudioElem('lose_life.mp3', 'sfx');

/**
 * Setter i gang spillet med modus og reseter attributter
 */
function initGame() {
    // creates powerups
    createPowerUps();

    mode = modes[1];

    // resets map
    gMap.innerHTML = "";

    // Reset radius
    obstacleRadius = 50;
    coinRadius = 17;

    // resets score and lives
    collectedCoins = 0;
    antCoins.innerHTML = collectedCoins;

    lives = amountOfLives;
    antLives.innerHTML = lives;

    // Resets highscoreregister
    highscoreRegistered = false;

    // remove titles
    if (titles.className !== "hidden") {
        titles.setAttribute("class", "hidden");
    }

    // create coin
    if (document.getElementById("coin") === null) {
        createCoin();
    }

    // Spawn powerup (PowerUpSpawnerInterval (pusi) is in seconds)
    powerUpInterval = setInterval(spawnPowerUp, pusi*1000);

    // Audio
    stopAudio(gameOverSound);
    if (music) {
        playAudio(themeSong);
    }
}

/**
 * Avslutter spillet og reseter tilstanden til spillet
 */
function exitGame() {
    // Vis titler
    titles.setAttribute("class", "show");

    // Reset lives color
    antLives.parentNode.style.color = livesColors[livesColors.length-1];

    // reseter mappet
    gMap.innerHTML = "";

    //Slutter å spawne powerups
    clearInterval(powerUpInterval);

    // Audio
    if (sfx && mode === 1) {
        gameOverSound.currentTime = 2;
        playAudio(gameOverSound);
    }
    stopAudio(themeSong);

    // game is off
    mode = modes[0];
}

/**
 * Spiller av vinnmusikk og avslutter spillet
 */
function winGame() {
    if (sfx) {
        playAudio(winSound);
    }
    exitGame();
    title1.innerHTML = "GRATULERER DU VANT!";
    title2.innerHTML = "Skriv inn brukernavn <br> og <br> registrer din highscore!";
}

/**
 * Setter spillmodus til at spillet har startet
 */
function startGame() {
    // If game has already started
    if (mode === 2) {
        return;
    }

    initGame();
}

map.onclick = startGame;
title1.onclick = startGame;
title2.onclick = startGame;
map.onmouseleave = exitGame;

loadHighScore(); // denne setter highscore til noe annet enn array

/**
 * Togglebutton for å skru av og på SFX
 * @param sfxBtn
 */
function toggleSFX(sfxBtn) {
    stopAudio(gameOverSound);
    stopAudio(winSound);
    stopAudio(powerUpSound);
    stopAudio(coinSound);

    sfx ? sfxBtn.innerHTML = "SFX: OFF" : sfxBtn.innerHTML = "SFX: ON";
    sfx = !sfx;
}

/**
 * Togglebutton for å skru av og på musikk
 * @param musicBtn
 */
function toggleMusic(musicBtn) {
    stopAudio(themeSong);

    music ? musicBtn.innerHTML = "Music: OFF" : musicBtn.innerHTML = "Music: ON";
    music = !music;
}

/**
 * Oppdaterer poengsummen dersom den er større enn den registrerte
 * for duplikatnavn
 * @param name
 * @param amountC (antall coins)
 * @returns {boolean}
 */
function updateDuplicateName(name, amountC) {
    for (let i = 0; i < highscores.length; i++) {
        if (highscores[i][0] === name && highscores[i][1] < amountC) {
            highscores[i][1] = amountC;
        }
    }
}

/**
 * Returnerer hvorvidt navnet allerede er registrert
 * @param name
 * @returns {boolean}
 */
function isDuplicateName(name) {
    for (let i = 0; i < highscores.length; i++) {
        if (highscores[i][0] === name) {
            return true;
        }
    }
    return false;
}

/**
 * Oppdaterer poengsummen ut ifra hvor mange mynter brukeren har samlet
 * Sjekker om brukeren har vunnet
 * @param amount
 */
function addAndUpdateScore(amount) {
    let sum = collectedCoins += amount;
    sum < 0 ? antCoins.innerHTML = 0 : antCoins.innerHTML = sum;
    if (sum >= winScore) {
        winGame();
    }
}

/**
 * Lager powerupobjekter som inneholder farger og type
 */
function createPowerUps() {
    for (let i = 0; i < powerUpTypes.length; i++) {
        let powerups = {
            name: powerUpTypes[i],
            color: powerUpColors[i],
            idx: i,
        };

        powerUpArray.push(powerups);
    }
}

/**
 * Gjennoppretter en powerup som bruker objektlista fra createPowerUps()
 * Setter tilfeldig type og tilsvarende farge med gitte attributter
 */
function spawnPowerUp() {
    let powerUpType = Math.floor((Math.random() * 5));
    let powerUp = powerUpArray[powerUpType];
    let xPos = getRandomPos(13);
    let yPos = getRandomPos(13);

    // Create poweruprect
    let pur = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    pur.addEventListener("mouseover", activatePowerUp);
    pur.setAttribute("x", xPos);
    pur.setAttribute("y", yPos);
    pur.setAttribute("fill", powerUp.color);
    pur.setAttribute("height", "25");
    pur.setAttribute("width", "25");
    pur.setAttribute("stroke-width", "3");
    pur.setAttribute("stroke", "#000000");
    gMap.appendChild(pur);

}

/**
 * Funksjon for hva som skjer når musa berører powerup
 * Gir effekt ut ifra type og fjerner powerupen
 * @param evt
 */
function activatePowerUp(evt) {
    let touchedPowup = evt.target;
    let idx = powerUpColors.indexOf(touchedPowup.getAttribute("fill"));

    // ["obstacle gets smaller", "coin gets bigger", "bonuscoins", "losing coins", "move coin"];
    switch(idx) {
        case 0:
            obstacleRadius-= 3;
            break;
        case 1:
            coinRadius += 2;
            break;
        case 2:
            addAndUpdateScore(3);
            break;
        case 3:
            addAndUpdateScore(-5);
            break;
        case 4:
            changeCoinPos(evt);
            break;
    }

    if (sfx) {
        playAudio(powerUpSound);
    }

    gMap.removeChild(touchedPowup)


}

/**
 * Lager mynten med gitte attributter
 */
function createCoin() {
    let coin = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    coin.addEventListener("mouseover", coinTouched);
    coin.setAttribute("id", "coin");
    coin.setAttribute("fill", "yellow");
    coin.setAttribute("r", coinRadius);
    coin.setAttribute("stroke-width", "1.5");
    coin.setAttribute("stroke", "black");
    resetCoin(coin);

    let amOfElem = gMap.children.length;
    if (amOfElem === 0) {
        gMap.appendChild(coin);
    }

    let refNode = gMap.childNodes[gMap.children.length-1];
    insertAfter(coin, refNode);
}

/**
 * Brukes til å legge coin på toppen av alt.
 * @param newNode
 * @param referenceNode
 */
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/**
 * Når mynten berører får den en ny posisjon og det lages en ny obstacle
 * Oppdaterer poengsummen med +1
 * @param evt
 */
function coinTouched(evt) {
    createObstacle(evt);
    changeCoinPos(evt);
    addAndUpdateScore(1);

    if (sfx) {
        playAudio(coinSound);
    }
}

/**
 * Endrer posisjonen til coin objektet
 * @param evt
 */
function changeCoinPos(evt) {
    let coin = document.getElementById("coin");

    // random positions for cx and cy:
    let rcx = getRandomPos(coinRadius);
    let rcy = getRandomPos(coinRadius);

    // mouseX - offset + coinRadius + 2 <= rcx && mouseX - coinRadius - 2 >= rcx
    // Checks for overlapping with mouse
    while (isOverlapping(evt, coinRadius, rcx, rcy)) {
        rcy = getRandomPos();
        rcx = getRandomPos();
    }

    // sets new position to circle
    coin.setAttribute("cx", rcx);
    coin.setAttribute("cy", rcy);
}

/**
 * Reseter posisjonen til coin objektet
 * @param coin
 */
function resetCoin(coin) {
    coin.setAttribute("cx", "200");
    coin.setAttribute("cy", "200");

}

/**
 * returnerer et tilfeldig tall innenfor spillbrettet
 * @param radius
 * @returns {*}
 */
function getRandomPos(radius) {
    return Math.floor(Math.random() * (400-radius)) + radius;
}

/**
 * Funksjon som sjekker for overlap mellom mus og objektet med radius, x og y koordinater
 * @param evt
 * @param radius
 * @param coordx
 * @param coordy
 * @returns {boolean}
 */
function isOverlapping(evt, radius, coordx, coordy) {
    let mouseX = evt.clientX;
    let mouseY = evt.clientY;

    let offset = gMap.getBoundingClientRect();
    mouseX -= offset.left;
    mouseY -= offset.top;

    if (mouseX + radius + 2 <= coordx && mouseX - radius - 2 >= coordx) {
        return true;
    }

    return (mouseY + radius + 2 <= coordy && mouseY - radius - 2 >= coordy);
}

/**
 * Lag de grå firkantene som obstacles
 * @param evt
 */
function createObstacle(evt) {
    let xPos = getRandomPos(obstacleRadius/2);
    let yPos = getRandomPos(obstacleRadius/2);

    // mouseX - offset + coinRadius + 2 <= rcx && mouseX - coinRadius - 2 >= rcx
    // Checks for overlapping with mouse
    while (isOverlapping(evt, obstacleRadius, xPos, yPos)) {
        xPos = getRandomPos(obstacleRadius/2);
        yPos = getRandomPos(obstacleRadius/2);
    }

    let obs = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    obs.addEventListener("mouseover", loseLife);
    obs.setAttribute("x", xPos);
    obs.setAttribute("y", yPos);
    obs.setAttribute("fill", "#847d7d");
    obs.setAttribute("height", obstacleRadius);
    obs.setAttribute("width", obstacleRadius);
    obs.setAttribute("stroke-width", "3");
    obs.setAttribute("stroke", "#000000");

    // legger til i rekken bak coin slik at coin ligger over gray firkanter
    gMap.insertBefore(obs, document.getElementById("coin"));
}

/**
 * Setter elementene til et audio objekt
 * @param filename
 * @param type
 * @returns {Audio}
 */
function setAudioElem(filename, type) {
    return type === 'sfx' ?
        new Audio('../static/audio/sfx/' + filename) :
        new Audio('../static/audio/themes/' + filename);
}

/**
 * Spill av lyd
 * @param elem
 */
function playAudio(elem) {
    stopAudio(elem);
    elem.play();
}

/**
 * Stop å spill lyd
 * @param elem
 */
function stopAudio(elem) {
    elem.pause();
    elem.currentTime = 0;
}

/**
 * Spiller lyd holder øye med antall liv og avslutter spillet ved liv = 0
 * Endrer farge på lives teksten
 */
function loseLife() {
    playAudio(loseLifeSound);

    lives--;

    if (lives <= 0) {
        exitGame();
        antLives.innerHTML = 0;
    }

    antLives.parentNode.style.color = livesColors[lives];
    antLives.innerHTML = lives;
}

/**
 * Registrerknappen for å lagre highscoren
 * Sjekker for invalid verdier og duplikater.
 * Lager en ny rad med verdi og navn og oppdaterer highscorelista
 * @param event
 */
regBtn.onclick = function(event) {
    event.preventDefault();

    if (highscoreRegistered) {
        return;
    }

    highscoreRegistered = true;

    let name = nickInp.value;
    let amountC = antCoins.innerHTML;

    nickInp.value = "";

    if (name.length === 0 || "Skriv et navn" === name ) {
        name = "Skriv et navn";
        return;
    }

    if (isDuplicateName(name)) {
        updateDuplicateName(name, amountC);
        sortHighscore(highscores);
        return;
    }

    // Lager highscore rad for navn og score
    let tr = createRow(name, amountC);

    tbody.appendChild(tr);
    highscores.push([name, amountC]);
    sortHighscore(highscores);
};

/**
 * Tar inn en liste med highscore rader [[name, antCoins], ...]
 * og legger disse til i highscorelista i tillegg til de som er
 * i sortert rekkefølge
 * @param highscores
 */
function sortHighscore(highscores) {
    let sortedList = [];
    let tempHS = [];
    let len = highscores.length;

    for (let i = 0; i < len; i++) {
        tempHS[i] = highscores[i];
    }

    tbody.innerHTML = "";

    for (let i = 0; i < len; i++) {
        let maxIdx = findMaxIdx(tempHS);
        sortedList.push(tempHS[maxIdx]);
        tempHS.splice(maxIdx,1);
    }

    for (let i = 0; i < len; i++) {
        tbody.appendChild(createRow(sortedList[i][0], sortedList[i][1]));
    }

    console.log(sortedList)
    saveHighScore(sortedList);
}

/**
 * Funksjon som finner posisjonen til den største verdien
 * @param list [[String, number]...]
 * @returns {number}
 */
function findMaxIdx(list) {
    let max = -1;
    let idx = -1;

    for (let i = 0; i < list.length; i++) {
        let cur = parseInt(list[i][1]);
        if (cur > max) {
            max = cur;
            idx = i;
        }
    }

    return idx;
}

/**
 * Lager en rad med to kolonner med verdiene td1 og td2
 * @param td1
 * @param td2
 * @returns {Element}
 */
function createRow(td1, td2) {
    let tr = document.createElement("tr");
    let td = document.createElement("td");
    td.innerHTML = td1;
    tr.appendChild(td);
    td = document.createElement("td");
    td.innerHTML = td2;
    tr.appendChild(td);
    return tr;
}

/**
 * Load highscore from local disk
 *
 */

function loadHighScore() {
    highscores = JSON.parse(localStorage.getItem("hs"));
    if (highscores === null) {
        highscores = [];
    }
    sortHighscore(highscores);
}

/**
 * Save highscores on local disk
 * @param highscores ([[name, score], ...])
 */
function saveHighScore(highscores) {
    localStorage.setItem("hs", JSON.stringify(highscores));
}

/**
 * Deletes local storage
 * Rester highscoretabellen til å være tom
 */
function resetHighscore() {
    let usr = prompt("Skriv 'reset' for å resete highscoretabellen");
    if (usr === "reset") {
        localStorage.clear();
    }
}