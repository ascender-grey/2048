// 2048 Game JavaScript
// This file contains the structure and placeholder functions for the 2048 game
// All functionality needs to be implemented

// Game state variables
let gameBoard = [];
let score = 0;
let bestScore = 0;
let gameOver = false;
let newTilePositions = [];

// Initialize the game
function initGame() {
    // initialize 4x4 board with zeros
    gameBoard = [];
    for (let r = 0; r < 4; r++) {
        gameBoard[r] = [0, 0, 0, 0];
    }
    score = 0;
    gameOver = false;
    newTilePositions = [];
    // load best score
    const bs = localStorage.getItem('bestScore');
    bestScore = bs ? parseInt(bs, 10) : 0;
    // add two starting tiles
    addRandomTile();
    addRandomTile();
    updateDisplay();
}

// Add a new random tile to the board
function addRandomTile() {
    const empty = getEmptyCells();
    if (empty.length === 0) return;
    const idx = Math.floor(Math.random() * empty.length);
    const cell = empty[idx];
    // 90% chance for 2, 10% for 4
    const value = Math.random() < 0.9 ? 2 : 4;
    gameBoard[cell.r][cell.c] = value;
    newTilePositions.push(`${cell.r}-${cell.c}`);
    updateDisplay();
}

// Move tiles in a specific direction
function moveTiles(direction) {
    if (gameOver) return;
    let moved = false;
    newTilePositions = [];

    // helper to rotate board so we can reuse left move
    const rotateLeft = (board) => {
        const res = [];
        for (let c = 0; c < 4; c++) {
            res[c] = [];
            for (let r = 3; r >= 0; r--) res[c].push(board[r][c]);
        }
        return res;
    };

    const rotateRight = (board) => {
        const res = [];
        for (let c = 3; c >= 0; c--) {
            res[3 - c] = [];
            for (let r = 0; r < 4; r++) res[3 - c].push(board[r][c]);
        }
        return res;
    };

    const reverseRows = (board) => board.map(row => row.slice().reverse());

    let boardCopy = gameBoard.map(r => r.slice());

    let working;
    if (direction === 'left') working = boardCopy;
    else if (direction === 'right') working = reverseRows(boardCopy);
    else if (direction === 'up') working = rotateLeft(boardCopy);
    else if (direction === 'down') working = rotateRight(boardCopy);
    else return;

    // move left on working
    for (let r = 0; r < 4; r++) {
        let row = working[r].slice();
        // compress
        let filtered = row.filter(v => v !== 0);
        for (let i = 0; i < 4; i++) row[i] = filtered[i] || 0;
        // merge
        for (let c = 0; c < 3; c++) {
            if (row[c] !== 0 && row[c] === row[c + 1]) {
                row[c] = row[c] * 2;
                row[c + 1] = 0;
                updateScore(row[c]);
                moved = true;
            }
        }
        // final compress after merges
        filtered = row.filter(v => v !== 0);
        for (let i = 0; i < 4; i++) row[i] = filtered[i] || 0;
        working[r] = row;
    }

    // map working back to boardCopy according to rotation
    let newBoard;
    if (direction === 'left') newBoard = working;
    else if (direction === 'right') newBoard = reverseRows(working);
    else if (direction === 'up') newBoard = (function() {
        // rotate right to map back
        const res = [];
        for (let r = 0; r < 4; r++) res[r] = [];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) res[c][3 - r] = working[r][c];
        return res;
    })();
    else if (direction === 'down') newBoard = (function() {
        const res = [];
        for (let r = 0; r < 4; r++) res[r] = [];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) res[3 - c][r] = working[r][c];
        return res;
    })();

    // check if any tile moved
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        if (newBoard[r][c] !== gameBoard[r][c]) moved = true;
    }

    if (moved) {
        gameBoard = newBoard;
        addRandomTile();
        updateDisplay();
        if (!canMove()) {
            gameOver = true;
            showGameOver();
        }
    }
}

// Check if the game is over
function checkGameOver() {
    return !canMove();
}

// Update the display
function updateDisplay() {
    const container = document.querySelector('.tile-container');
    // clear existing tiles
    container.innerHTML = '';
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const value = gameBoard[r][c];
            const tile = document.createElement('div');
            tile.classList.add('tile');
            if (value === 0) {
                tile.classList.add('empty');
                tile.textContent = '';
            } else {
                tile.classList.add(`tile-${value}`);
                tile.textContent = value;
            }
            // add new tile animation if recently added
            if (newTilePositions.includes(`${r}-${c}`)) {
                tile.classList.add('new-tile');
            }
            container.appendChild(tile);
        }
    }
    // update score displays
    const scoreEl = document.getElementById('score');
    const bestEl = document.getElementById('best-score');
    if (scoreEl) scoreEl.textContent = score;
    if (bestEl) bestEl.textContent = bestScore;
    // hide/show game over overlay
    const go = document.getElementById('game-over');
    if (go) go.style.display = gameOver ? 'flex' : 'none';
}

// Handle keyboard input
function handleKeyPress(event) {
    const key = event.key;
    let moved = false;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        event.preventDefault();
        moveTiles('left');
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        event.preventDefault();
        moveTiles('right');
    } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        event.preventDefault();
        moveTiles('up');
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        event.preventDefault();
        moveTiles('down');
    }
}

// Start a new game
function newGame() {
    initGame();
    const go = document.getElementById('game-over');
    if (go) go.style.display = 'none';
}

// Show game over screen
function showGameOver() {
    const go = document.getElementById('game-over');
    const final = document.getElementById('final-score');
    if (final) final.textContent = score;
    if (go) go.style.display = 'flex';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // initialize
    initGame();

    // buttons
    const newBtn = document.getElementById('new-game');
    if (newBtn) newBtn.addEventListener('click', newGame);
    const tryBtn = document.getElementById('try-again');
    if (tryBtn) tryBtn.addEventListener('click', newGame);

    // keyboard
    window.addEventListener('keydown', handleKeyPress);

    // touch
    let touchStartX = null;
    let touchStartY = null;
    function handleTouchStartWrapper(e) {
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
    }
    function handleTouchEndWrapper(e) {
        if (touchStartX === null || touchStartY === null) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const threshold = 30; // minimal swipe
        if (Math.max(absX, absY) > threshold) {
            if (absX > absY) {
                if (dx > 0) moveTiles('right'); else moveTiles('left');
            } else {
                if (dy > 0) moveTiles('down'); else moveTiles('up');
            }
        }
        touchStartX = null; touchStartY = null;
    }
    window.addEventListener('touchstart', handleTouchStartWrapper, {passive: true});
    window.addEventListener('touchend', handleTouchEndWrapper, {passive: true});
});

// Touch/swipe support for mobile
function handleTouchStart(event) {
    // not used - wrapper in DOMContentLoaded handles touch
}

function handleTouchEnd(event) {
    // not used - wrapper in DOMContentLoaded handles touch
}

// Utility functions
function getEmptyCells() {
    const empty = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (gameBoard[r][c] === 0) empty.push({r, c});
    return empty;
}

function canMove() {
    // if any empty cell
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (gameBoard[r][c] === 0) return true;
    // check horizontal merges
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) if (gameBoard[r][c] === gameBoard[r][c+1]) return true;
    // check vertical merges
    for (let c = 0; c < 4; c++) for (let r = 0; r < 3; r++) if (gameBoard[r][c] === gameBoard[r+1][c]) return true;
    return false;
}

function updateScore(points) {
    score += points;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore);
    }
    const scoreEl = document.getElementById('score');
    const bestEl = document.getElementById('best-score');
    if (scoreEl) scoreEl.textContent = score;
    if (bestEl) bestEl.textContent = bestScore;
}

// Export functions for testing (if using modules)
// Uncomment if using ES6 modules
// export { initGame, moveTiles, newGame, checkGameOver };
