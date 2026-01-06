const container = document.getElementById('game-container');
const square = document.getElementById('square');
const goal = document.getElementById('goal');
const winMessage = document.getElementById('win-message');
const loseMessage = document.getElementById('lose-message');
const levelDisplay = document.getElementById('level-display');

const gridSize = 20;
const step = 20;
const containerSize = 600;

let gameOver = false;
let currentLevel = 1;
let monsterInterval = null;

// Labyrinth layout: 1 = wall, 0 = path
const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1],
    [1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
    [1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,0,1,0,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Monster data: { x, y, element, direction }
const monsters = [];

// All possible spawn positions for monsters (open path cells, excluding start and goal areas)
const possibleSpawnPositions = [];

// Find all valid spawn positions
function initSpawnPositions() {
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            // Skip walls, player start area, and goal area
            if (maze[y][x] === 0 && !(x <= 2 && y <= 2) && !(x >= 26 && y >= 26)) {
                possibleSpawnPositions.push({ x, y });
            }
        }
    }
}

// Get random spawn positions for monsters
function getRandomSpawnPositions(count) {
    const positions = [];
    const available = [...possibleSpawnPositions];

    for (let i = 0; i < count && available.length > 0; i++) {
        const index = Math.floor(Math.random() * available.length);
        positions.push(available[index]);
        available.splice(index, 1);
    }

    return positions;
}

// Create walls from maze array
function createWalls() {
    for (let row = 0; row < maze.length; row++) {
        for (let col = 0; col < maze[row].length; col++) {
            if (maze[row][col] === 1) {
                const wall = document.createElement('div');
                wall.className = 'wall';
                wall.style.left = col * gridSize + 'px';
                wall.style.top = row * gridSize + 'px';
                wall.style.width = gridSize + 'px';
                wall.style.height = gridSize + 'px';
                container.appendChild(wall);
            }
        }
    }
}

// Clear all monsters
function clearMonsters() {
    for (const monster of monsters) {
        monster.element.remove();
    }
    monsters.length = 0;
}

// Create monsters based on current level
function createMonsters() {
    const monsterCount = currentLevel * 3; // Level 1: 3, Level 2: 6, Level 3: 9, etc.
    const spawnPositions = getRandomSpawnPositions(monsterCount);

    for (const pos of spawnPositions) {
        const monsterEl = document.createElement('div');
        monsterEl.className = 'monster';
        monsterEl.style.left = pos.x * gridSize + 'px';
        monsterEl.style.top = pos.y * gridSize + 'px';
        container.appendChild(monsterEl);

        monsters.push({
            x: pos.x,
            y: pos.y,
            element: monsterEl,
            direction: Math.floor(Math.random() * 4) // 0=up, 1=down, 2=left, 3=right
        });
    }
}

// Player starting position
let playerX = 1;
let playerY = 1;

// Goal position
const goalX = 28;
const goalY = 28;

// Initialize positions
function resetPlayerPosition() {
    playerX = 1;
    playerY = 1;
    square.style.left = playerX * gridSize + 'px';
    square.style.top = playerY * gridSize + 'px';
}

// Update level display
function updateLevelDisplay() {
    levelDisplay.textContent = `Level: ${currentLevel}`;
}

// Start a new level
function startLevel() {
    gameOver = false;
    winMessage.style.display = 'none';
    loseMessage.style.display = 'none';

    clearMonsters();
    resetPlayerPosition();
    createMonsters();
    updateLevelDisplay();

    // Clear existing interval and start new one
    if (monsterInterval) {
        clearInterval(monsterInterval);
    }
    monsterInterval = setInterval(moveMonsters, 1000);
}

// Initialize goal position
goal.style.left = goalX * gridSize + 'px';
goal.style.top = goalY * gridSize + 'px';

// Create the labyrinth walls
createWalls();

// Initialize spawn positions
initSpawnPositions();

// Start level 1
startLevel();

// Check if a position is valid (not a wall)
function canMove(x, y) {
    if (x < 0 || x >= 30 || y < 0 || y >= 30) return false;
    return maze[y][x] === 0;
}

// Check if player collides with any monster
function checkMonsterCollision() {
    for (const monster of monsters) {
        if (monster.x === playerX && monster.y === playerY) {
            return true;
        }
    }
    return false;
}

// Handle losing the game
function triggerLose() {
    gameOver = true;
    if (monsterInterval) {
        clearInterval(monsterInterval);
    }
    loseMessage.style.display = 'block';
}

// Check if player reached the goal
function checkWin() {
    if (playerX === goalX && playerY === goalY) {
        gameOver = true;
        if (monsterInterval) {
            clearInterval(monsterInterval);
        }
        winMessage.style.display = 'block';

        // After 2 seconds, advance to next level
        setTimeout(() => {
            currentLevel++;
            startLevel();
        }, 2000);
    }
}

// Move monsters
function moveMonsters() {
    if (gameOver) return;

    for (const monster of monsters) {
        // Get possible directions
        const directions = [
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 }   // right
        ];

        // Try current direction first
        let dir = directions[monster.direction];
        let newX = monster.x + dir.dx;
        let newY = monster.y + dir.dy;

        // If can't move in current direction, pick a new random direction
        if (!canMove(newX, newY)) {
            // Find all valid directions
            const validDirs = [];
            for (let i = 0; i < 4; i++) {
                const d = directions[i];
                if (canMove(monster.x + d.dx, monster.y + d.dy)) {
                    validDirs.push(i);
                }
            }

            if (validDirs.length > 0) {
                monster.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
                dir = directions[monster.direction];
                newX = monster.x + dir.dx;
                newY = monster.y + dir.dy;
            } else {
                // No valid moves, stay in place
                continue;
            }
        }

        // Move monster
        monster.x = newX;
        monster.y = newY;
        monster.element.style.left = monster.x * gridSize + 'px';
        monster.element.style.top = monster.y * gridSize + 'px';
    }

    // Check collision after monsters move
    if (checkMonsterCollision()) {
        triggerLose();
    }
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (gameOver) return;

    let newX = playerX;
    let newY = playerY;

    switch (e.key) {
        case 'ArrowUp':
            newY = playerY - 1;
            break;
        case 'ArrowDown':
            newY = playerY + 1;
            break;
        case 'ArrowLeft':
            newX = playerX - 1;
            break;
        case 'ArrowRight':
            newX = playerX + 1;
            break;
        default:
            return;
    }

    e.preventDefault();

    // Only move if the new position is valid
    if (canMove(newX, newY)) {
        playerX = newX;
        playerY = newY;
        square.style.left = playerX * gridSize + 'px';
        square.style.top = playerY * gridSize + 'px';

        // Check collision after player moves
        if (checkMonsterCollision()) {
            triggerLose();
        } else {
            checkWin();
        }
    }
});
