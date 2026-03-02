const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Элементы
const mainMenu = document.getElementById('mainMenu');
const levelsMenu = document.getElementById('levelsMenu');
const skinMenu = document.getElementById('skinMenu');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreEl = document.getElementById('score');
const levelGrid = document.getElementById('levelGrid');
const endTitle = document.getElementById('endTitle');
const progressBarFill = document.getElementById('progressBarFill');
const percentText = document.getElementById('percentText');
const currentLevelNameEl = document.getElementById('currentLevelName');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameState = 'MENU';
let score = 0; // Теперь это % прохождения
let rawScore = 0; // Количество прыжков
let animationId;

// === НАСТРОЙКИ УРОВНЕЙ ===
const levels = [
    { id: 1, name: "Stereo Start", color: ["#0055ff", "#002266"], speed: 5, goal: 10 },
    { id: 2, name: "Back On Track", color: ["#ff00ff", "#440044"], speed: 5.5, goal: 15 },
    { id: 3, name: "Polargeist", color: ["#00aa00", "#004400"], speed: 6, goal: 20 },
    { id: 4, name: "Dry Out", color: ["#aa0000", "#440000"], speed: 6.5, goal: 25 },
    { id: 5, name: "Base After Base", color: ["#000000", "#444444"], speed: 7, goal: 30 },
    { id: 6, name: "Can't Let Go", color: ["#ff5500", "#662200"], speed: 7.5, goal: 35 },
    { id: 7, name: "Jumper", color: ["#aa00aa", "#440044"], speed: 8, goal: 40 },
    { id: 8, name: "Time Machine", color: ["#ff0000", "#aa0000"], speed: 8.5, goal: 45 },
    { id: 9, name: "Cycles", color: ["#5555ff", "#0000aa"], speed: 9, goal: 50 },
    { id: 10, name: "xStep", color: ["#222222", "#000000"], speed: 10, goal: 60 } // Demon скорость
];

let currentLevelIndex = 0; // По умолчанию 1 уровень

// Игрок
const player = {
    x: 100, y: 0, width: 40, height: 40, dy: 0,
    jumpPower: 16, gravity: 1.1, grounded: false, angle: 0, color: '#FFFF00'
};

const groundHeight = 100;
let groundY = canvas.height - groundHeight;
const obstacles = [];

// === ИНИЦИАЛИЗАЦИЯ КНОПОК УРОВНЕЙ ===
function initLevels() {
    levelGrid.innerHTML = "";
    levels.forEach((lvl, index) => {
        let btn = document.createElement("button");
        btn.className = "level-btn";
        btn.innerText = lvl.id;
        if (index === currentLevelIndex) btn.classList.add("active");
        
        btn.onclick = () => {
            currentLevelIndex = index;
            currentLevelNameEl.innerText = "Level " + lvl.id + ": " + lvl.name;
            // Обновляем подсветку
            document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            backToMenu();
        };
        levelGrid.appendChild(btn);
    });
}
initLevels();

// === УПРАВЛЕНИЕ ===
document.getElementById('btnPlay').addEventListener('click', startGame);
document.getElementById('btnSkin').addEventListener('click', () => {
    mainMenu.classList.add('hidden'); skinMenu.classList.remove('hidden');
});
document.getElementById('btnLevels').addEventListener('click', () => {
    mainMenu.classList.add('hidden'); levelsMenu.classList.remove('hidden');
});

// Ввод (прыжок)
function handleInput(e) {
    if (gameState === 'PLAY') {
        if (e.type === 'touchstart' || e.code === 'Space' || e.code === 'ArrowUp') {
            if(e.type === 'touchstart') e.preventDefault();
            jump();
        }
    }
}
document.addEventListener('keydown', handleInput);
document.addEventListener('touchstart', handleInput, {passive: false});

// === ЛОГИКА ===
function jump() {
    if (player.grounded) {
        player.dy = -player.jumpPower;
        player.grounded = false;
    }
}

function startGame() {
    gameState = 'PLAY';
    mainMenu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreEl.style.display = 'block';
    
    // Загрузка параметров уровня
    let lvl = levels[currentLevelIndex];
    rawScore = 0;
    score = 0;
    obstacles.length = 0;
    
    player.y = groundY - player.height;
    player.dy = 0;
    player.angle = 0;
    
    scoreEl.innerText = "0%";
    spawnObstacle();
    if (!animationId) loop();
}

function backToMenu() {
    skinMenu.classList.add('hidden');
    levelsMenu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreEl.style.display = 'none';
    mainMenu.classList.remove('hidden');
    gameState = 'MENU';
    obstacles.length = 0;
}

function spawnObstacle() {
    if (gameState !== 'PLAY') return;
    
    let lvl = levels[currentLevelIndex];

    const obstacle = {
        x: canvas.width,
        y: groundY - 40,
        width: 40,
        height: 40
    };
    obstacles.push(obstacle);

    // Расчет задержки: чем быстрее скорость, тем меньше задержка, чтобы прыгать чаще
    // Но нужно расстояние для прыжка
    let minGap = 250; // Минимум пикселей между шипами
    let maxGap = 500;
    
    // Для сложных уровней делаем шипы ближе друг к другу
    if (lvl.id > 5) maxGap = 400;

    let distance = Math.random() * (maxGap - minGap) + minGap;
    let timeToNext = (distance / lvl.speed) * 16; // Примерный перевод в мс

    setTimeout(spawnObstacle, timeToNext);
}

function update() {
    if (gameState !== 'PLAY') return;

    let lvl = levels[currentLevelIndex];

    // Физика
    player.dy += player.gravity;
    player.y += player.dy;

    if (player.y + player.height > groundY) {
        player.y = groundY - player.height;
        player.dy = 0;
        player.grounded = true;
        player.angle = Math.round(player.angle / (Math.PI/2)) * (Math.PI/2);
    } else {
        player.grounded = false;
        player.angle += 0.15;
    }

    // Препятствия
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= lvl.speed; // Скорость из уровня

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            i--;
            
            // Прогресс
            rawScore++;
            let percentage = Math.floor((rawScore / lvl.goal) * 100);
            if(percentage > 100) percentage = 100;
            score = percentage;
            scoreEl.innerText = score + "%";

            // ПОБЕДА
            if (rawScore >= lvl.goal) {
                levelComplete();
            }
        }

        // Коллизия
        if (
            player.x + 6 < obs.x + obs.width &&
            player.x + player.width - 6 > obs.x &&
            player.y + 6 < obs.y + obs.height &&
            player.y + player.height - 6 > obs.y
        ) {
            handleGameOver(false);
        }
    }
}

function handleGameOver(isWin) {
    gameState = 'GAMEOVER';
    gameOverScreen.classList.remove('hidden');
    
    if (isWin) {
        endTitle.innerText = "LEVEL COMPLETE!";
        endTitle.style.color = "#00ff00";
        score = 100;
    } else {
        endTitle.innerText = "CRASHED!";
        endTitle.style.color = "red";
    }
    
    percentText.innerText = score + "%";
    progressBarFill.style.width = score + "%";
}

function levelComplete() {
    handleGameOver(true);
}

function resetGame() {
    startGame();
}

function draw() {
    let lvl = levels[currentLevelIndex];

    // Динамический фон в зависимости от уровня
    let bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, lvl.color[0]);
    bgGradient.addColorStop(1, lvl.color[1]);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Пол
    ctx.fillStyle = '#000';
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, groundY, canvas.width, 2);

    // Игрок
    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    ctx.rotate(player.angle);
    ctx.fillStyle = player.color;
    ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeRect(-player.width/2, -player.height/2, player.width, player.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(5, -10, 10, 10);
    ctx.restore();

    // Шипы
    ctx.fillStyle = '#ff0000';
    ctx.strokeStyle = '#fff';
    obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.fill();
        ctx.stroke();
    });
}

function loop() {
    update();
    draw();
    animationId = requestAnimationFrame(loop);
}

loop();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - groundHeight;
    if(gameState === 'MENU') player.y = groundY - player.height;
});