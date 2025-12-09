// Space Invaders Game

// Game constants
const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;
const PLAYER_SIZE = 30;
const ENEMY_SIZE = 30;
const BULLET_SIZE = 12;
const PLAYER_SPEED = 8;
const ENEMY_SPEED = 2;
const BULLET_SPEED = 7;
const SPAWN_RATE = 1500; // milliseconds

// Game state
let playerX = GAME_WIDTH / 2 - PLAYER_SIZE / 2;
let playerY = GAME_HEIGHT - 60;
let bullets = [];
let enemies = [];
let gameRunning = true;
let gamePaused = false;
let score = 0;
let lives = 3;
let level = 1;
let enemySpawnInterval = null;
let gameLoopInterval = null;
let enemyCount = 0;

// Input tracking
const keys = {};

// DOM elements
let gameContainer;
let playerElement;
let bulletsContainer;
let enemiesContainer;
let scoreDisplay;
let livesDisplay;
let levelDisplay;
let gameOverDisplay;
let restartButton;

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    gameContainer = document.getElementById('space-invaders-game');
    playerElement = document.getElementById('player');
    bulletsContainer = document.getElementById('bullets');
    enemiesContainer = document.getElementById('enemies');
    scoreDisplay = document.getElementById('score');
    livesDisplay = document.getElementById('lives');
    levelDisplay = document.getElementById('level');
    gameOverDisplay = document.getElementById('game-over-si');
    restartButton = document.getElementById('restart-si');
    
    resetGame();
    startGame();
    
    // Setup restart button
    if (restartButton) {
        restartButton.addEventListener('click', restartGame);
    }
});

// Setup keyboard input
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        console.log('Key pressed:', e.key, 'gameRunning:', gameRunning);
        shoot();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function resetGame() {
    playerX = GAME_WIDTH / 2 - PLAYER_SIZE / 2;
    playerY = GAME_HEIGHT - 60;
    bullets = [];
    enemies = [];
    gameRunning = true;
    gamePaused = false;
    score = 0;
    lives = 3;
    level = 1;
    enemyCount = 0;
    
    updateDisplay();
    render();
}

function startGame() {
    // Spawn enemies periodically
    enemySpawnInterval = setInterval(spawnEnemy, SPAWN_RATE - level * 100);
    
    // Main game loop
    gameLoopInterval = setInterval(() => {
        if (!gameRunning) return;
        
        update();
        render();
        checkCollisions();
        checkGameState();
    }, 30);
}

function spawnEnemy() {
    if (!gameRunning) return;
    
    const x = Math.random() * (GAME_WIDTH - ENEMY_SIZE);
    const y = -ENEMY_SIZE;
    
    enemies.push({
        x: x,
        y: y,
        width: ENEMY_SIZE,
        height: ENEMY_SIZE,
        health: 1
    });
    
    enemyCount++;
}

function shoot() {
    if (!gameRunning) return;
    
    const bulletObj = {
        x: playerX + PLAYER_SIZE / 2 - 2,
        y: playerY,
        width: 4,
        height: 12
    };
    
    bullets.push(bulletObj);
    console.log('Shot fired! Total bullets:', bullets.length);
}

function update() {
    // Update player position
    if (keys['ArrowLeft'] || keys['a']) {
        playerX = Math.max(0, playerX - PLAYER_SPEED);
    }
    if (keys['ArrowRight'] || keys['d']) {
        playerX = Math.min(GAME_WIDTH - PLAYER_SIZE, playerX + PLAYER_SPEED);
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= BULLET_SPEED;
        
        // Remove bullets that go off screen
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += ENEMY_SPEED;
        
        // Remove enemies that go off screen (player loses life)
        if (enemies[i].y > GAME_HEIGHT) {
            enemies.splice(i, 1);
            lives--;
        }
    }
}

function checkCollisions() {
    // Check bullet-enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], enemies[j])) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 10 * level;
                break;
            }
        }
    }
    
    // Check player-enemy collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (isColliding(
            { x: playerX, y: playerY, width: PLAYER_SIZE, height: PLAYER_SIZE },
            enemies[i]
        )) {
            enemies.splice(i, 1);
            lives--;
        }
    }
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function checkGameState() {
    updateDisplay();
    
    // Level up every 50 enemies defeated
    if (enemyCount > 0 && enemyCount % 50 === 0 && level < 5) {
        level++;
        // Increase difficulty
        clearInterval(enemySpawnInterval);
        enemySpawnInterval = setInterval(spawnEnemy, Math.max(500, SPAWN_RATE - level * 100));
    }
    
    if (lives <= 0) {
        gameRunning = false;
        endGame();
    }
}

function updateDisplay() {
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    levelDisplay.textContent = level;
}

function endGame() {
    gameRunning = false;
    if (gameOverDisplay) {
        gameOverDisplay.hidden = false;
    }
    clearInterval(enemySpawnInterval);
    clearInterval(gameLoopInterval);
}

function restartGame() {
    clearInterval(enemySpawnInterval);
    clearInterval(gameLoopInterval);
    
    // Clear display
    bulletsContainer.innerHTML = '';
    enemiesContainer.innerHTML = '';
    if (gameOverDisplay) {
        gameOverDisplay.hidden = true;
    }
    
    resetGame();
    startGame();
}

function render() {
    // Update player position
    playerElement.style.left = playerX + 'px';
    playerElement.style.top = playerY + 'px';
    
    // Render bullets
    bulletsContainer.innerHTML = '';
    console.log('Rendering', bullets.length, 'bullets');
    bullets.forEach(bullet => {
        const div = document.createElement('div');
        div.className = 'bullet';
        div.style.left = bullet.x + 'px';
        div.style.top = bullet.y + 'px';
        div.style.width = '4px';
        div.style.height = '12px';
        div.style.backgroundColor = '#00ff00';
        div.style.position = 'absolute';
        bulletsContainer.appendChild(div);
    });
    
    // Render enemies
    enemiesContainer.innerHTML = '';
    enemies.forEach(enemy => {
        const div = document.createElement('div');
        div.className = 'enemy';
        div.textContent = '▼';
        div.style.left = enemy.x + 'px';
        div.style.top = enemy.y + 'px';
        enemiesContainer.appendChild(div);
    });
}
