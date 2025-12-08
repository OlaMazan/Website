const COLUMNS = 10;  // Szerokość siatki
const ROWS = 20;      // Wysokość siatki
const numberOfCells = COLUMNS * ROWS; // 200 komórek

let cells = []; // referencje do wszystkich komórek DOM
let board = new Array(COLUMNS * ROWS).fill(null); // null lub nazwa klasy koloru
let gameOver = false;

function generateCells(count) {
    const playground = document.querySelector('.playground');
    playground.innerHTML = '';
    cells = [];

    for (let i = 0; i < count; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        playground.appendChild(cell);
        cells.push(cell);
    }
}

// Definicje klocków: każda figura ma listę rotacji; rotacja to lista [r,c] offsetów
const SHAPES = {
    I: [
        [[0,-2],[0,-1],[0,0],[0,1]],
        [[-2,0],[-1,0],[0,0],[1,0]]
    ],
    O: [
        [[0,0],[0,1],[1,0],[1,1]]
    ],
    T: [
        [[0,-1],[0,0],[0,1],[1,0]],
        [[-1,0],[0,0],[1,0],[0,1]],
        [[0,-1],[0,0],[0,1],[-1,0]],
        [[-1,0],[0,0],[1,0],[0,-1]]
    ],
    S: [
        [[0,0],[0,1],[1,-1],[1,0]],
        [[-1,0],[0,0],[0,1],[1,1]]
    ],
    Z: [
        [[0,-1],[0,0],[1,0],[1,1]],
        [[-1,1],[0,1],[0,0],[1,0]]
    ],
    J: [
        [[0,-1],[0,0],[0,1],[1,-1]],
        [[-1,0],[0,0],[1,0],[-1,-1]],
        [[-1,1],[0,-1],[0,0],[0,1]],
        [[-1,0],[0,0],[1,0],[1,1]]
    ],
    L: [
        [[0,-1],[0,0],[0,1],[1,1]],
        [[-1,0],[0,0],[1,0],[-1,1]],
        [[-1,-1],[0,-1],[0,0],[0,1]],
        [[-1,0],[0,0],[1,0],[1,-1]]
    ]
};

const COLORS = { I: 'color-I', O: 'color-O', T: 'color-T', S: 'color-S', Z: 'color-Z', J: 'color-J', L: 'color-L' };

let current = null; // bieżący klocek

function spawnPiece(name) {
    const rotations = SHAPES[name];
    const rotationIndex = 0;
    const startRow = 0;
    const startCol = Math.floor(COLUMNS / 2);
    current = { name, rotations, rotationIndex, row: startRow, col: startCol };
    // jeśli przy spawnie występuje kolizja z już zablokowanymi komórkami -> game over
    if (!canMoveTo(current.row, current.col, current.rotationIndex)) {
        gameOver = true;
        renderBoard();
        alert('Game Over');
        return;
    }
    drawCurrent();
}

function indexFromRC(r, c) {
    return r * COLUMNS + c;
}

function renderBoard() {
    // Ustawia klasy DOM zgodnie z tablicą board (zablokowane komórki)
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        // usuń wszystkie kolorowe i stany
        cell.classList.remove('active', 'locked', 'color-I','color-O','color-T','color-S','color-Z','color-J','color-L');
        const colClass = board[i];
        if (colClass) {
            cell.classList.add(colClass, 'locked');
        }
    }
}

function drawCurrent() {
    renderBoard();
    if (!current) return;
    const shape = current.rotations[current.rotationIndex];
    const colorClass = COLORS[current.name];

    shape.forEach(([dr, dc]) => {
        const r = current.row + dr;
        const c = current.col + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLUMNS) {
            const idx = indexFromRC(r, c);
            const cell = cells[idx];
            if (cell) {
                cell.classList.add('active', colorClass);
            }
        }
    });
}

function canMoveTo(row, col, rotationIndex) {
    const shape = current.rotations[rotationIndex];
    for (const [dr, dc] of shape) {
        const r = row + dr;
        const c = col + dc;
        if (c < 0 || c >= COLUMNS || r >= ROWS) return false; // poza siatką
        if (r < 0) continue; // nad siatką - ok
        // sprawdź kolizję z zablokowanymi komórkami
        if (r >= 0) {
            const idx = indexFromRC(r, c);
            if (board[idx]) return false;
        }
    }
    return true;
}

function moveCurrent(deltaR, deltaC) {
    if (!current) return;
    const newRow = current.row + deltaR;
    const newCol = current.col + deltaC;
    if (canMoveTo(newRow, newCol, current.rotationIndex)) {
        current.row = newRow;
        current.col = newCol;
        drawCurrent();
        return true;
    }
    return false;
}

function lockCurrent() {
    if (!current) return;
    const shape = current.rotations[current.rotationIndex];
    const colorClass = COLORS[current.name];
    for (const [dr, dc] of shape) {
        const r = current.row + dr;
        const c = current.col + dc;
        if (r < 0) {
            // element zablokowany powyżej pola = game over
            gameOver = true;
            continue;
        }
        if (r >= 0 && r < ROWS && c >= 0 && c < COLUMNS) {
            const idx = indexFromRC(r, c);
            board[idx] = colorClass;
        }
    }
    current = null;
    renderBoard();
}

function rotateCurrent() {
    if (!current) return;
    const next = (current.rotationIndex + 1) % current.rotations.length;
    if (canMoveTo(current.row, current.col, next)) {
        current.rotationIndex = next;
        drawCurrent();
    }
}

// Basic game loop to test pieces: spawn random and drop
let dropInterval = null;

function startDemo() {
    generateCells(numberOfCells);
    spawnPiece(randomPieceName());
    if (dropInterval) clearInterval(dropInterval);
    dropInterval = setInterval(() => {
        if (gameOver) {
            clearInterval(dropInterval);
            alert('Game Over');
            return;
        }
        const moved = moveCurrent(1, 0);
        if (!moved) {
            // zablokuj bieżący klocek i spawń nowy
            lockCurrent();
            if (gameOver) {
                clearInterval(dropInterval);
                alert('Game Over');
                return;
            }
            spawnPiece(randomPieceName());
        }
    }, 500);
}

function randomPieceName() {
    const keys = Object.keys(SHAPES);
    return keys[Math.floor(Math.random() * keys.length)];
}

document.addEventListener('keydown', (e) => {
    if (!current) return;
    if (e.key === 'ArrowLeft') moveCurrent(0, -1);
    else if (e.key === 'ArrowRight') moveCurrent(0, 1);
    else if (e.key === 'ArrowDown') moveCurrent(1, 0);
    else if (e.key === 'ArrowUp' || e.key === ' ') rotateCurrent();
});

document.addEventListener('DOMContentLoaded', () => {
    startDemo();
});
