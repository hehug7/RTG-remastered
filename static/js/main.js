/*
    Ideer:
        prøveteste tidsinterval mellom powerups og maxcoins avhengig av lvl.
        ordne en ordentlig highscore tabell

    Etabler spillgrid 20 * 20 ? /50/100

    legg til random powerup (velger fra en av de andre)

    countingsort for tabell
    mulighet til å lagre highscore lokalt

    oppdater score på highscorelista med samme navn

 */

// game map
let map = document.getElementById("map");
let gMap = document.getElementById("gMap");
let titles = document.getElementById("titles");

// Handles submitting highscore
let regBtn = document.getElementById("regBtn");
let table = document.getElementById("tbl");
let tbody = document.getElementById("tBdy");
let nickInp = document.getElementById("nickInp");

// CoinsStatus
let coinRadius = 17;
let antCoins = document.getElementById("antCoins");
let collectedCoins = 0;

// Obstacle status
let obstacleRadius = 50;

// powerups [0: green, 1: blue, 2: orange, 3: red, 4: pink]
let powerUpArray = [];
let powerUpTypes = ["small", "big", "bonus", "loss", "change"];
let powerUpColors = ["#37FF00", "#1100FF" ,"#FF8D00", "#FF0000", "#F400E8"];
let powerUpSpawner;

/* gamemodes:
    0: startup menu,
    1: tutorial
    2: game
*/

let modes = [0, 1, 2];

let mode = modes[0];
let sfx = (mode === modes[2]);
let music = (mode === modes[2]);

function initGame() {
    // creates powerups
    createPowerUps();

    mode = modes[2];

    // resets map
    gMap.innerHTML = "";

    // resets score
    collectedCoins = 0;
    antCoins.innerHTML = collectedCoins;

    // remove titles
    if (titles.className !== "hidden") {
        titles.setAttribute("class", "hidden");
    }

    let coin = document.getElementById("coin");
    if (coin === null) {
        createCoin();
    }

    // Spawn powerup
    powerUpSpawner = setInterval(spawnPowerUp, 3000)
}

function exitGame() {
    // game is off
    mode = modes[0];

    // Vis titler
    titles.setAttribute("class", "show");

    // reseter mappet
    gMap.innerHTML = "";

    //Slutter å spawne powerups
    clearInterval(powerUpSpawner);

}

map.onclick = function startGame() {
    // If game has already started
    if (mode === 2) {
        return;
    }

    initGame();

};

map.onmouseleave = exitGame;

function changeSFX(sfxBtn) {
    sfx ? sfxBtn.innerHTML = "SFX: OFF" : sfxBtn.innerHTML = "SFX: ON";
    sfx = !sfx;
}

function changeMusic(musicBtn) {
    music ? musicBtn.innerHTML = "Music: OFF" : musicBtn.innerHTML = "Music: ON";
    music = !music;
}

function isDuplicateName(name) {

    let tdArr = document.getElementsByTagName("td");
    for (let i = 0; i < tdArr.length; i++) {
        if (tdArr[i].innerHTML === name) {
            return true;
        }
    }
    return false;
}

function addAndUpdateScore(amount) {
    let sum = collectedCoins += amount;
    sum < 0 ? antCoins.innerHTML = 0 : antCoins.innerHTML = sum;
}

regBtn.onclick = function(event) {
    event.preventDefault();

    let name = nickInp.value;

    if (name.length === 0 || "Skriv et navn" === name ) {
        name = "Skriv et navn";
        return;
    }

    if(isDuplicateName(name)) {
        return;
    }

    // Lager highscore rad for navn og score
    let tr = document.createElement("tr");
    let td = document.createElement("td");
    td.innerHTML = name;
    tr.appendChild(td);

    td = document.createElement("td");
    td.innerHTML = antCoins.innerHTML;
    tr.appendChild(td);

    tbody.appendChild(tr);
};

// Lager powerups utifra lister som inneholder ulike farger og typer
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
            addAndUpdateScore(7);
            break;
        case 3:
            addAndUpdateScore(-5);
            break;
        case 4:
            changeCoinPos(evt);
            break;
    }


    gMap.removeChild(touchedPowup)


}

function createCoin() {
    coin = document.createElementNS("http://www.w3.org/2000/svg", "circle");
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

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function coinTouched(evt) {
    createObstacle();
    changeCoinPos(evt);
    addAndUpdateScore(1);
}

// Endrer posisjonen til mynten
function changeCoinPos(evt) {
    let mouseX = evt.clientX;
    let mouseY = evt.clientY;

    let offset = gMap.getBoundingClientRect();
    mouseX -= offset.left;
    mouseY -= offset.top;

    let coin = document.getElementById("coin");

    // random positions for cx and cy:
    let rcx = getRandomPos(coinRadius);
    let rcy = getRandomPos(coinRadius);


    // Checks for overlapping with mouse
    while (isOverlapping(mouseY, coinRadius, rcy)) {
        rcy = getRandomPos();
    }

    // mouseX - offset + coinRadius + 2 <= rcx && mouseX - coinRadius - 2 >= rcx
    while (isOverlapping(mouseX, coinRadius, rcx)) {
        rcx = getRandomPos();
    }

    // sets new position to circle
    coin.setAttribute("cx", rcx);
    coin.setAttribute("cy", rcy);
}

function resetCoin(coin) {
    coin.setAttribute("cx", "200");
    coin.setAttribute("cy", "200");

}

function getRandomPos(radius) {
    return Math.floor(Math.random() * (400-radius)) + radius;
}

function isOverlapping(mouseAxis, radius, coord) {
    return mouseAxis + radius + 2 <= coord && mouseAxis - radius - 2 >= coord;
}

function createObstacle() {
    let xPos = getRandomPos(obstacleRadius/2);
    let yPos = getRandomPos(obstacleRadius/2);

    let obs = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    obs.addEventListener("mouseover", exitGame);
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

function setAudioElem(filename) {
    return new Audio(filename);
}

function playAudio(elem) {
    elem.play();
}


function stopAudio(elem) {
    elem.pause();
}

