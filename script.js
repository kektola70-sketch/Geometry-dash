const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Элементы UI ---
const mainMenu = document.getElementById('mainMenu');
const levelsMenu = document.getElementById('levelsMenu');
const skinMenu = document.getElementById('skinMenu');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreEl = document.getElementById('score');
const levelGrid = document.getElementById('levelGrid');
const currentLevelNameEl = document.getElementById('currentLevelName');
const endTitle = document.getElementById('endTitle');
const progressBarFill = document.getElementById('progressBarFill');
const percentText = document.getElementById('percentText');

// Настройка размеров
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameState = 'MENU'; // MENU, PLAY, GAMEOVER
let score = 0;   // Проценты
let rawScore = 0; // Прыжки
let animationId;

// --- НАСТРОЙКИ УРОВНЕЙ (10 штук) ---
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
    { id: 10, name: "xStep", color: ["#222222", "#000000"], speed: 10, goal: 60 }
];

let currentLevelIndex = 0; // Начинаем с 1 уровня (индекс 0)

// Игрок
const player = {
    x: 100, y: 0, width: 40, height: 40, dy: 0,
    jumpPower: 16.5, gravity: 1.1, grounded: false, angle: 0, color: '#FFFF00'
};

const groundHeight = 100;
let groundY = canvas.height - groundHeight;
const obstacles = [];

// --- ФУНКЦИИ МЕНЮ ---

// Создаем кнопки уровней
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
            
            // Смена активного класса
            document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            backToMenu();
        };
        levelGrid.appendChild(btn);
    });
}
initLevels(); // Запуск при старте

// Обработчики кнопок
document.getElementById('btnPlay').addEventListener('click', startGame);

document.getElementById('btnSkin').addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    skinMenu.classList.remove('hidden');
});

document.getElementById('btnLevels').addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    levelsMenu.classList.remove('hidden');
});

// Глобальная функция для возврата в меню
window.backToMenu = function() {
    skinMenu.classList.add('hidden');
    levelsMenu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreEl.style.display = 'none';
    
    mainMenu.classList.remove('hidden');
    gameState = 'MENU';
    
    // Сброс позиции игрока для красоты в меню
    player.y = groundY - player.height;
    player.angle = 0;
    obstacles.length = 0;
};

// Функция выбора скина
window.setSkin = function(color) {
    player.color = color;
    document.querySelector('.icon-face').style.background = color;
};

window.resetGame = function() {
    startGame();
};

// --- ИГРОВОЙ ПРОЦЕСС ---

function startGame() {
    gameState = 'PLAY';
    mainMenu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreEl.style.display = 'block';
    
    // Сброс переменных
    let lvl = levels[currentLevelIndex];
    rawScore = 0;
    score = 0;
    obstacles.length = 0;
    player.y = groundY - player.height;
    player.dy = 0;
    player.grounded = true;
    player.angle = 0;
    
    scoreEl.innerText = "0%";
    
    spawnObstacle();
    if (!animationId) loop();
}

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

function jump() {
    if (player.grounded) {
        player.dy = -player.jumpPower;
        player.grounded = false;
    }
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

    // Дистанция между шипами зависит от сложности
    let minGap = 250;
    let maxGap = 500;
    if (lvl.id > 5) maxGap = 400; // Сложнее на высоких уровнях

    let distance = Math.random() * (maxGap - minGap) + minGap;
    let timeToNext = (distance / lvl.speed) * 16; 

    setTimeout(spawnObstacle, timeToNext);
}

function update() {
    // В меню мы тоже обновляем позицию, чтобы куб стоял на полу при ресайзе
    if (gameState === 'MENU') {
        player.y = groundY - player.height;
        return;
    }
    if (gameState !== 'PLAY') return;

    let lvl = levels[currentLevelIndex];

    // Физика
    player.dy += player.gravity;
    player.y += player.dy;

    if (player.y + player.height > groundY) {
        player.y = groundY - player.height;
        player.dy = 0;
        player.grounded = true;
        // Выравнивание угла
        player.angle = Math.round(player.angle / (Math.PI/2)) * (Math.PI/2);
    } else {
        player.grounded = false;
        player.angle += 0.15; // Скорость вращения
    }

    // Движение препятствий
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= lvl.speed;

        // Прошел препятствие
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            i--;
            
            rawScore++;
            let percentage = Math.floor((rawScore / lvl.goal) * 100);
            if(percentage > 100) percentage = 100;
            score = percentage;
            scoreEl.innerText = score + "%";

            if (rawScore >= lvl.goal) {
                levelComplete();
            }
        }

        // Коллизия (уменьшенная зона удара)
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
    scoreEl.style.display = 'none';

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

function draw() {
    let lvl = levels[currentLevelIndex];

    // Фон (Градиент)
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

    // Игрок с вращением
    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    ctx.rotate(player.angle);
    ctx.fillStyle = player.color;
    ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.strokeRect(-player.width/2, -player.height/2, player.width, player.height);
    ctx.fillStyle = 'black'; 
    ctx.fillRect(5, -10, 10, 10); // Глаз
    ctx.restore();

    // Шипы
    ctx.fillStyle = '#ff0000';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
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

// Запуск
loop();

// Ресайз
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - groundHeight;
});