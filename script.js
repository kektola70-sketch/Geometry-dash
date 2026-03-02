const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Настройка размеров
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Переменные игры
let score = 0;
let gameSpeed = 5;
let isGameOver = false;
let animationId;

// Игрок (Кубик)
const player = {
    x: 100,
    y: 0, // Будет установлено на землю
    width: 40,
    height: 40,
    dy: 0, // Вертикальная скорость
    jumpPower: 15,
    gravity: 0.8,
    grounded: false,
    color: '#00ff00'
};

// Препятствия
const obstacles = [];

// Уровень земли (чуть выше низа экрана)
const groundHeight = 100;
let groundY = canvas.height - groundHeight;

// Обработка ввода (Touch для Acode/Mobile и Пробел для ПК)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') jump();
});
document.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Чтобы не зумить экран
    jump();
});
// Перезапуск по клику после смерти
document.addEventListener('click', () => {
    if (isGameOver) resetGame();
});

function jump() {
    if (player.grounded && !isGameOver) {
        player.dy = -player.jumpPower;
        player.grounded = false;
    }
}

// Функция спавна препятствий
function spawnObstacle() {
    if (isGameOver) return;
    
    // Создаем шип (треугольник)
    const obstacle = {
        x: canvas.width,
        y: groundY - 40,
        width: 40,
        height: 40,
        type: 'spike'
    };
    obstacles.push(obstacle);

    // Случайное время до следующего препятствия (от 1 до 2.5 секунд)
    const randomDelay = Math.random() * 1500 + 1000;
    setTimeout(spawnObstacle, randomDelay);
}

function update() {
    // 1. Физика игрока
    player.dy += player.gravity; // Применяем гравитацию
    player.y += player.dy;

    // Столкновение с землей
    if (player.y + player.height > groundY) {
        player.y = groundY - player.height;
        player.dy = 0;
        player.grounded = true;
    } else {
        player.grounded = false;
    }

    // 2. Управление препятствиями
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= gameSpeed; // Двигаем влево

        // Удаляем, если ушел за экран
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            i--;
            score++;
            document.getElementById('score').innerText = "Score: " + score;
            gameSpeed += 0.05; // Понемногу ускоряем игру
        }

        // Проверка столкновения (Простая AABB коллизия)
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            gameOver();
        }
    }
}

function draw() {
    // Очистка экрана
    ctx.fillStyle = '#2b2b2b'; // Цвет фона неба
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Рисуем пол
    ctx.fillStyle = '#0000ff'; // Синий пол
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
    
    // Рисуем линию пола (белая)
    ctx.fillStyle = '#fff'; 
    ctx.fillRect(0, groundY, canvas.width, 2);

    // Рисуем игрока
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // Обводка игрока
    ctx.strokeStyle = '#000';
    ctx.strokeRect(player.x, player.y, player.width, player.height);

    // Рисуем препятствия (шипы)
    ctx.fillStyle = '#ff0000';
    obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.fill();
    });
    
    if (isGameOver) {
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("Game Over", canvas.width/2 - 100, canvas.height/2);
        ctx.font = "20px Arial";
        ctx.fillText("Tap to Restart", canvas.width/2 - 70, canvas.height/2 + 40);
    }
}

function gameLoop() {
    if (!isGameOver) {
        update();
        draw();
        animationId = requestAnimationFrame(gameLoop);
    }
}

function gameOver() {
    isGameOver = true;
    draw(); // Рисуем один раз, чтобы показать надпись
}

function resetGame() {
    isGameOver = false;
    score = 0;
    gameSpeed = 5;
    player.y = groundY - player.height;
    player.dy = 0;
    obstacles.length = 0;
    document.getElementById('score').innerText = "Score: 0";
    
    // Перезапуск спавна и цикла
    spawnObstacle();
    gameLoop();
}

// Запуск при старте
player.y = groundY - player.height; // Ставим на пол
spawnObstacle();
gameLoop();

// Адаптация при повороте экрана
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - groundHeight;
    player.y = groundY - player.height; // Сброс позиции, чтобы не провалиться
});