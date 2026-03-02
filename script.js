const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Элементы UI
const mainMenu = document.getElementById('mainMenu');
const skinMenu = document.getElementById('skinMenu');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreEl = document.getElementById('score');

// Настройка размеров
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Состояния игры
let gameState = 'MENU'; // MENU, PLAY, GAMEOVER
let score = 0;
let gameSpeed = 6;
let animationId;

// Игрок
const player = {
    x: 100,
    y: 0,
    width: 40,
    height: 40,
    dy: 0,
    jumpPower: 16.5,     // Сила прыжка как в GD
    gravity: 1.1,        // Тяжелая гравитация для резкости
    grounded: false,
    angle: 0,            // Угол вращения
    color: '#FFFF00'     // Желтый по умолчанию
};

const groundHeight = 100;
let groundY = canvas.height - groundHeight;
const obstacles = [];

// === УПРАВЛЕНИЕ ===

// Нажатие на кнопки меню
document.getElementById('btnPlay').addEventListener('click', startGame);
document.getElementById('btnSkin').addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    skinMenu.classList.remove('hidden');
});
document.getElementById('btnSecret').addEventListener('click', () => {
    alert("Эта функция появится в следующей версии!");
});

// Управление в игре
function handleInput(e) {
    if (gameState === 'PLAY') {
        if (e.type === 'touchstart' || e.code === 'Space' || e.code === 'ArrowUp') {
            // Если тач - предотвращаем скролл
            if(e.type === 'touchstart') e.preventDefault(); 
            jump();
        }
    }
}
document.addEventListener('keydown', handleInput);
document.addEventListener('touchstart', handleInput, {passive: false});

// === ЛОГИКА ИГРЫ ===

function startGame() {
    gameState = 'PLAY';
    mainMenu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreEl.style.display = 'block';
    
    // Сброс параметров
    score = 0;
    gameSpeed = 6;
    obstacles.length = 0;
    player.y = groundY - player.height;
    player.dy = 0;
    player.angle = 0;
    player.grounded = true;
    
    scoreEl.innerText = "Score: 0";
    
    spawnObstacle();
    if (!animationId) loop(); // Запускаем цикл, если он не запущен
}

function setSkin(color) {
    player.color = color;
    // Меняем цвет иконки в меню для наглядности
    document.querySelector('.icon-face').style.background = color;
}

function backToMenu() {
    skinMenu.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreEl.style.display = 'none';
    mainMenu.classList.remove('hidden');
    gameState = 'MENU';
    // Очищаем препятствия, чтобы на фоне было чисто
    obstacles.length = 0;
}

function jump() {
    if (player.grounded) {
        player.dy = -player.jumpPower;
        player.grounded = false;
    }
}

function spawnObstacle() {
    if (gameState !== 'PLAY') return;

    const obstacle = {
        x: canvas.width,
        y: groundY - 40,
        width: 40,
        height: 40,
        type: 'spike'
    };
    obstacles.push(obstacle);

    // Случайная задержка (делаем игру ритмичнее)
    const randomDelay = Math.random() * 1200 + 800;
    setTimeout(spawnObstacle, randomDelay);
}

function update() {
    if (gameState !== 'PLAY') return;

    // Физика игрока
    player.dy += player.gravity;
    player.y += player.dy;

    // Пол
    if (player.y + player.height > groundY) {
        player.y = groundY - player.height;
        player.dy = 0;
        player.grounded = true;
        
        // Округляем угол до ближайших 90 градусов (PI/2) при приземлении
        // Чтобы куб встал ровно
        player.angle = Math.round(player.angle / (Math.PI/2)) * (Math.PI/2);
    } else {
        player.grounded = false;
        // Вращение в полете (примерно 90 градусов за прыжок)
        player.angle += 0.15; 
    }

    // Препятствия
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            i--;
            score++;
            scoreEl.innerText = "Score: " + score;
            if(score % 5 === 0) gameSpeed += 0.2; // Ускорение
        }

        // Коллизия (уменьшаем хитбокс игрока на 6px, чтобы было честнее)
        const hitboxPadding = 6;
        if (
            player.x + hitboxPadding < obs.x + obs.width &&
            player.x + player.width - hitboxPadding > obs.x &&
            player.y + hitboxPadding < obs.y + obs.height &&
            player.y + player.height - hitboxPadding > obs.y
        ) {
            handleGameOver();
        }
    }
}

function handleGameOver() {
    gameState = 'GAMEOVER';
    gameOverScreen.classList.remove('hidden');
}

function resetGame() {
    startGame();
}

function draw() {
    // Фон (Градиент как в GD)
    let bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#0055ff'); // Синий верх
    bgGradient.addColorStop(1, '#002266'); // Темный низ
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Рисуем пол
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
    // Линия пола
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();

    // === РИСУЕМ ИГРОКА С ВРАЩЕНИЕМ ===
    ctx.save(); // Сохраняем состояние канваса
    
    // Перемещаем точку вращения в центр кубика
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    ctx.rotate(player.angle);
    
    // Рисуем кубик (смещаем назад на половину размера, т.к. мы в центре)
    ctx.fillStyle = player.color;
    ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);
    
    // Обводка и "лицо" кубика
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.strokeRect(-player.width/2, -player.height/2, player.width, player.height);
    
    // Глаз (для реализма)
    ctx.fillStyle = 'black';
    ctx.fillRect(5, -10, 10, 10); 
    
    ctx.restore(); // Восстанавливаем состояние канваса (чтобы остальное не вращалось)

    // Рисуем шипы
    ctx.fillStyle = '#ff0000'; // Красный шип
    ctx.strokeStyle = '#ffffff'; // Белая обводка шипа
    ctx.lineWidth = 2;
    
    obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });
}

function loop() {
    update();
    draw();
    animationId = requestAnimationFrame(loop);
}

// Запуск цикла отрисовки (меню будет видно сразу)
loop();

// Ресайз
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - groundHeight;
    if(gameState === 'MENU') player.y = groundY - player.height;
});