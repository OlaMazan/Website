// Space Invaders Game

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 30;
const ENEMY_SIZE = 30;
const BULLET_SIZE = 12;
const PLAYER_SPEED = 8;
const ENEMY_SPEED = 0.5;
const BULLET_SPEED = 7;
const SPAWN_RATE = 1500; // milliseconds
const ENEMY_ROWS = 3;
const ENEMY_COLS = 8;
const ENEMY_SPAWN_X = 50;
const ENEMY_SPAWN_Y = 30;
const ENEMY_SPACING_X = 60;
const ENEMY_SPACING_Y = 60;

// Enemy sprite - ASCII art representation
const ENEMY_SPRITE = [
    "  ███  ",
    " █████ ",
    "███████",
    "█ ███ █"
];

// Enemy sprite grid (each # represents a pixel that needs to be destroyed)
const ENEMY_SPRITE_GRID = [
    [0, 0, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 0, 1]
];

// Game state
let playerX = GAME_WIDTH / 2 - PLAYER_SIZE / 2;
let playerY = GAME_HEIGHT - 60;
let bullets = [];
let enemies = [];
let gameRunning = false;
let gamePaused = false;
let gameStarted = false;
let score = 0;
let lives = 3;
let level = 1;
let enemySpawnInterval = null;
let gameLoopInterval = null;
let enemyCount = 0;
let enemyDirection = 1; // 1 for right, -1 for left

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
let overlayElement;
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
    overlayElement = document.getElementById('start-overlay-si');
    restartButton = document.getElementById('restart-si');
    
    resetGame();
    
    // Setup restart button
    if (restartButton) {
        restartButton.addEventListener('click', restartGame);
    }
});

// Setup keyboard input
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (!gameStarted) {
        // First keypress - start the game
        hideStartOverlay();
        startGame();
        return;
    }
    
    // Game running - handle shooting and movement
    if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
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
    gameRunning = false;
    gamePaused = false;
    gameStarted = false;
    score = 0;
    lives = 3;
    level = 1;
    enemyCount = 0;
    enemyDirection = 1;
    
    // Create initial enemy grid
    for (let row = 0; row < ENEMY_ROWS; row++) {
        for (let col = 0; col < ENEMY_COLS; col++) {
            enemies.push({
                x: ENEMY_SPAWN_X + col * ENEMY_SPACING_X,
                y: ENEMY_SPAWN_Y + row * ENEMY_SPACING_Y,
                width: 35,
                height: 20,
                health: 19, // 19 pixels to destroy (count of 1s in grid)
                damage: JSON.parse(JSON.stringify(ENEMY_SPRITE_GRID)) // Deep copy of sprite grid
            });
        }
    }
    enemyCount = enemies.length;
    
    updateDisplay();
    render();
}

function hideStartOverlay() {
    if (overlayElement) {
        overlayElement.classList.add('hidden');
    }
    gameStarted = true;
}

function startGame() {
    gameRunning = true;
    // Main game loop
    gameLoopInterval = setInterval(() => {
        if (!gameRunning) return;
        
        update();
        render();
        checkCollisions();
        checkGameState();
    }, 30);
}

function moveEnemies() {
    // Move all enemies left or right
    let shouldChangeDirection = false;
    
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].x += ENEMY_SPEED * enemyDirection;
        
        // Check if any enemy hit the edge
        if ((enemyDirection === 1 && enemies[i].x + 40 >= GAME_WIDTH) ||
            (enemyDirection === -1 && enemies[i].x <= 0)) {
            shouldChangeDirection = true;
        }
    }
    
    // Change direction and move down if edge reached
    if (shouldChangeDirection) {
        enemyDirection *= -1;
        for (let i = 0; i < enemies.length; i++) {
            enemies[i].y += 30;
        }
    }
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
    
    // Move enemies in formation
    moveEnemies();
    
    // Check if enemies reached the bottom
    for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].y + 30 > GAME_HEIGHT) {
            gameRunning = false;
        }
    }
}

function checkCollisions() {
    // Check bullet-enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bulletHit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], enemies[j])) {
                // Pixel-based damage
                damageEnemy(enemies[j], bullets[i]);
                bullets.splice(i, 1);
                bulletHit = true;
                
                // Check if enemy is destroyed
                if (enemies[j].health <= 0) {
                    enemies.splice(j, 1);
                    score += 10 * level;
                }
                break;
            }
        }
        if (bulletHit) break;
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

function damageEnemy(enemy, bullet) {
    // Bullet is 4px wide, enemy sprite is 7 characters wide (35px total)
    // Each character in sprite = 5px in display (35px / 7 chars)
    const pixelsPerChar = 5;
    
    // Calculate which sprite column the bullet is hitting
    const bulletLocalX = Math.floor((bullet.x - enemy.x) / pixelsPerChar);
    const bulletLocalY = Math.floor((bullet.y - enemy.y) / pixelsPerChar);
    
    // Check if bullet coordinates are within sprite bounds
    if (bulletLocalY >= 0 && bulletLocalY < enemy.damage.length &&
        bulletLocalX >= 0 && bulletLocalX < enemy.damage[0].length) {
        // Only destroy if there's a pixel at this position
        if (enemy.damage[bulletLocalY][bulletLocalX] === 1) {
            enemy.damage[bulletLocalY][bulletLocalX] = 0; // Destroy this pixel
            enemy.health--;
            return true;
        }
    }
    return false;
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function checkGameState() {
    updateDisplay();
    
    // Level up when all enemies are defeated
    if (enemies.length === 0 && enemyCount > 0) {
        level++;
        ENEMY_SPEED = ENEMY_SPEED + 0.5; // Increase difficulty
        resetGame();
        return;
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
    clearInterval(gameLoopInterval);
}

function restartGame() {
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
        div.style.left = enemy.x + 'px';
        div.style.top = enemy.y + 'px';
        div.style.fontSize = '12px';
        div.style.lineHeight = '1';
        div.style.whiteSpace = 'pre';
        div.style.color = '#ffffff';
        div.style.fontWeight = 'bold';
        div.style.fontFamily = 'monospace';
        
        // Build sprite with damage
        let sprite = [];
        for (let row = 0; row < enemy.damage.length; row++) {
            let line = '';
            for (let col = 0; col < enemy.damage[row].length; col++) {
                line += enemy.damage[row][col] === 1 ? '█' : ' ';
            }
            sprite.push(line);
        }
        
        div.textContent = sprite.join('\n');
        enemiesContainer.appendChild(div);
    });
}
