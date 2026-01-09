const container = document.getElementById('game-container');
const square = document.getElementById('square');
const goal = document.getElementById('goal');
const winMessage = document.getElementById('win-message');
const loseMessage = document.getElementById('lose-message');
const levelDisplay = document.getElementById('level-display');
const houseTimerDisplay = document.getElementById('house-timer');

// Dynamic sizing based on screen
const GRID_CELLS = 30;
let containerSize = 600;
let gridSize = 20;
let step = 20;

// Detect if device supports touch
function isTouchDevice() {
    return ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (navigator.msMaxTouchPoints > 0) ||
           window.matchMedia('(hover: none)').matches;
}

function calculateGameSize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const touchDevice = isTouchDevice();

    if (screenWidth <= 480) {
        // Phone
        containerSize = Math.min(screenWidth * 0.95, screenHeight * 0.5);
    } else if (screenWidth <= 1024 && touchDevice) {
        // Tablet (touch device with medium screen)
        containerSize = Math.min(screenWidth * 0.85, screenHeight * 0.7);
    } else if (screenWidth <= 1024) {
        // Small desktop
        containerSize = Math.min(screenWidth * 0.8, 600);
    } else {
        // Desktop
        containerSize = 600;
    }

    gridSize = containerSize / GRID_CELLS;
    step = gridSize;

    // Update CSS variables
    document.documentElement.style.setProperty('--game-size', containerSize + 'px');
    document.documentElement.style.setProperty('--cell-size', gridSize + 'px');

    // Update container size
    container.style.width = containerSize + 'px';
    container.style.height = containerSize + 'px';
}

// Calculate size on load
calculateGameSize();

// Recalculate on resize (debounced)
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        calculateGameSize();
        rebuildGame();
    }, 250);
});

// Rebuild game elements with new sizes
function rebuildGame() {
    createWalls();

    // Update houses positions
    for (const house of houses) {
        house.element.style.left = house.x * gridSize + 'px';
        house.element.style.top = house.y * gridSize + 'px';
        house.element.style.width = gridSize + 'px';
        house.element.style.height = gridSize + 'px';
    }

    // Update monsters positions
    for (const monster of monsters) {
        monster.element.style.left = monster.x * gridSize + 'px';
        monster.element.style.top = monster.y * gridSize + 'px';
        monster.element.style.width = gridSize + 'px';
        monster.element.style.height = gridSize + 'px';
    }

    // Update player position
    square.style.left = playerX * gridSize + 'px';
    square.style.top = playerY * gridSize + 'px';
    square.style.width = gridSize + 'px';
    square.style.height = gridSize + 'px';

    // Update goal position
    goal.style.left = goalX * gridSize + 'px';
    goal.style.top = goalY * gridSize + 'px';
    goal.style.width = gridSize + 'px';
    goal.style.height = gridSize + 'px';
}

let gameOver = false;
let gamePaused = false;
let currentLevel = 1;
let monsterInterval = null;
let houseTimerInterval = null;
let playerCoins = 0;

// House system
const HOUSE_MAX_STAY = 30; // seconds player can stay in house
const HOUSE_COOLDOWN = 40; // seconds before house can be used again
let playerInHouse = false;
let currentHouseIndex = -1;
let houseStayTimer = 0;

// Labyrinth layout: 1 = wall, 0 = path
// Maze 1 - for odd levels (1, 3, 5, ...)
const maze1 = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,1,0,1],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,1,0,1,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,1],
    [1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,1,1],
    [1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,1,0,1,0,1],
    [1,0,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Maze 2 - for even levels (2, 4, 6, ...)
const maze2 = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1],
    [1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,1,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Maze 3 - copy of old maze1
const maze3 = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1],
    [1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1],
    [1,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,0,1,0,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Current maze (will switch between maze1 and maze2)
let maze = maze1;

// Select maze based on current level (cycles through 3 mazes)
function selectMaze() {
    const mazeIndex = (currentLevel - 1) % 3; // 0, 1, 2, 0, 1, 2, ...

    if (mazeIndex === 0) {
        maze = maze1; // Level 1, 4, 7, 10, ...
    } else if (mazeIndex === 1) {
        maze = maze2; // Level 2, 5, 8, 11, ...
    } else {
        maze = maze3; // Level 3, 6, 9, 12, ...
    }
}

// House positions (placed on wall positions that become accessible)
const housePositions = [
    { x: 9, y: 2 },   // House 1 - upper area
    { x: 9, y: 22 }   // House 2 - lower area
];

// House data
const houses = [];

// Monster data: { x, y, element, direction, isSmart }
const monsters = [];
let smartMonster = null;

// All possible spawn positions for monsters (open path cells, excluding start and goal areas)
const possibleSpawnPositions = [];

// Find all valid spawn positions
function initSpawnPositions() {
    possibleSpawnPositions.length = 0;
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            // Skip walls, houses, player start area, and goal area
            if (maze[y][x] === 0 && !(x <= 2 && y <= 2) && !(x >= 26 && y >= 26)) {
                // Also skip house positions
                const isHouse = housePositions.some(h => h.x === x && h.y === y);
                if (!isHouse) {
                    possibleSpawnPositions.push({ x, y });
                }
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
    // Remove existing walls first
    const existingWalls = container.querySelectorAll('.wall');
    existingWalls.forEach(wall => wall.remove());

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

// Create houses
function createHouses() {
    for (let i = 0; i < housePositions.length; i++) {
        const pos = housePositions[i];
        const houseEl = document.createElement('div');
        houseEl.className = 'house';
        houseEl.style.left = pos.x * gridSize + 'px';
        houseEl.style.top = pos.y * gridSize + 'px';
        houseEl.style.width = gridSize + 'px';
        houseEl.style.height = gridSize + 'px';
        container.appendChild(houseEl);

        houses.push({
            x: pos.x,
            y: pos.y,
            element: houseEl,
            cooldown: 0,
            cooldownInterval: null
        });
    }
}

// Clear all monsters
function clearMonsters() {
    for (const monster of monsters) {
        monster.element.remove();
    }
    monsters.length = 0;
    smartMonster = null;
}

// Reset houses for new level
function resetHouses() {
    for (const house of houses) {
        house.cooldown = 0;
        house.element.classList.remove('cooldown');
        if (house.cooldownInterval) {
            clearInterval(house.cooldownInterval);
            house.cooldownInterval = null;
        }
    }
    playerInHouse = false;
    currentHouseIndex = -1;
    houseStayTimer = 0;
    if (houseTimerInterval) {
        clearInterval(houseTimerInterval);
        houseTimerInterval = null;
    }
    houseTimerDisplay.textContent = '';
}

// Create monsters based on current level
function createMonsters() {
    const monsterCount = currentLevel * 2; // Level 1: 2, Level 2: 4, Level 3: 6, etc.
    const spawnPositions = getRandomSpawnPositions(monsterCount);

    // Create regular monsters
    for (const pos of spawnPositions) {
        const monsterEl = document.createElement('div');
        monsterEl.className = 'monster';
        monsterEl.style.left = pos.x * gridSize + 'px';
        monsterEl.style.top = pos.y * gridSize + 'px';
        monsterEl.style.width = gridSize + 'px';
        monsterEl.style.height = gridSize + 'px';
        container.appendChild(monsterEl);

        monsters.push({
            x: pos.x,
            y: pos.y,
            element: monsterEl,
            direction: Math.floor(Math.random() * 4), // 0=up, 1=down, 2=left, 3=right
            isSmart: false
        });
    }

    // Create smart monster at goal position
    const smartMonsterEl = document.createElement('div');
    smartMonsterEl.className = 'monster smart-monster';
    smartMonsterEl.style.left = goalX * gridSize + 'px';
    smartMonsterEl.style.top = goalY * gridSize + 'px';
    smartMonsterEl.style.width = gridSize + 'px';
    smartMonsterEl.style.height = gridSize + 'px';
    smartMonsterEl.style.backgroundColor = '#808080'; // Gray color
    container.appendChild(smartMonsterEl);

    smartMonster = {
        x: goalX,
        y: goalY,
        element: smartMonsterEl,
        direction: 0,
        isSmart: true
    };
    monsters.push(smartMonster);
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
    square.style.width = gridSize + 'px';
    square.style.height = gridSize + 'px';
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

    // Select maze based on level (odd/even)
    selectMaze();

    // Rebuild walls for the new maze
    createWalls();

    // Reinitialize spawn positions for new maze
    initSpawnPositions();

    clearMonsters();
    resetHouses();
    resetPlayerPosition();
    createMonsters();
    updateLevelDisplay();

    // Clear existing interval and start new one
    if (monsterInterval) {
        clearInterval(monsterInterval);
    }
    monsterInterval = setInterval(moveMonsters, 1000);
}

// Initialize goal position with dynamic sizing
goal.style.left = goalX * gridSize + 'px';
goal.style.top = goalY * gridSize + 'px';
goal.style.width = gridSize + 'px';
goal.style.height = gridSize + 'px';

// Initialize player square with dynamic sizing
square.style.width = gridSize + 'px';
square.style.height = gridSize + 'px';

// Create the labyrinth walls
createWalls();

// Create houses
createHouses();

// Initialize spawn positions
initSpawnPositions();

// Load user coins from localStorage if logged in
function loadUserCoins() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        playerCoins = user.coins || 0;
    }
}

// Initialize user coins
loadUserCoins();

// Start level 1
startLevel();

// Check if a position is valid for player (not a wall, can enter houses)
function canPlayerMove(x, y) {
    if (x < 0 || x >= 30 || y < 0 || y >= 30) return false;

    // Check if it's a house
    for (let i = 0; i < houses.length; i++) {
        if (houses[i].x === x && houses[i].y === y) {
            // Can only enter if not on cooldown
            return houses[i].cooldown === 0;
        }
    }

    return maze[y][x] === 0;
}

// Check if a position is valid for monsters (not a wall, cannot enter houses)
function canMonsterMove(x, y) {
    if (x < 0 || x >= 30 || y < 0 || y >= 30) return false;

    // Monsters cannot enter houses
    for (const house of houses) {
        if (house.x === x && house.y === y) {
            return false;
        }
    }

    return maze[y][x] === 0;
}

// Check if player is in a house
function checkPlayerInHouse() {
    for (let i = 0; i < houses.length; i++) {
        if (houses[i].x === playerX && houses[i].y === playerY) {
            return i;
        }
    }
    return -1;
}

// Start house stay timer
function startHouseStayTimer(houseIndex) {
    playerInHouse = true;
    currentHouseIndex = houseIndex;
    houseStayTimer = HOUSE_MAX_STAY;

    updateHouseTimerDisplay();

    if (houseTimerInterval) {
        clearInterval(houseTimerInterval);
    }

    houseTimerInterval = setInterval(() => {
        houseStayTimer--;
        updateHouseTimerDisplay();

        if (houseStayTimer <= 0) {
            // Force player out - they lose!
            clearInterval(houseTimerInterval);
            houseTimerInterval = null;
            triggerLose();
        }
    }, 1000);
}

// Stop house stay timer and start cooldown
function stopHouseStayTimer() {
    if (houseTimerInterval) {
        clearInterval(houseTimerInterval);
        houseTimerInterval = null;
    }

    if (currentHouseIndex >= 0) {
        const house = houses[currentHouseIndex];
        house.cooldown = HOUSE_COOLDOWN;
        house.element.classList.add('cooldown');

        // Start cooldown timer
        house.cooldownInterval = setInterval(() => {
            house.cooldown--;
            if (house.cooldown <= 0) {
                house.cooldown = 0;
                house.element.classList.remove('cooldown');
                clearInterval(house.cooldownInterval);
                house.cooldownInterval = null;
            }
            updateHouseTimerDisplay();
        }, 1000);
    }

    playerInHouse = false;
    currentHouseIndex = -1;
    houseStayTimer = 0;
    updateHouseTimerDisplay();
}

// Update house timer display
function updateHouseTimerDisplay() {
    let displayText = '';

    if (playerInHouse && houseStayTimer > 0) {
        displayText = `In House: ${houseStayTimer}s`;
    }

    // Show cooldowns for houses
    const cooldowns = houses
        .map((h, i) => h.cooldown > 0 ? `House ${i + 1}: ${h.cooldown}s` : null)
        .filter(c => c !== null);

    if (cooldowns.length > 0) {
        if (displayText) displayText += '\n';
        displayText += 'Cooldown:\n' + cooldowns.join('\n');
    }

    houseTimerDisplay.textContent = displayText;
    houseTimerDisplay.style.whiteSpace = 'pre-line';
}

// Check if player collides with any monster
function checkMonsterCollision() {
    // Player is safe in house
    if (playerInHouse) return false;

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
    if (houseTimerInterval) {
        clearInterval(houseTimerInterval);
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
        if (houseTimerInterval) {
            clearInterval(houseTimerInterval);
        }

        // Award coins based on level (level * 10 coins)
        const coinsEarned = currentLevel * 10;
        playerCoins += coinsEarned;
        winMessage.textContent = `You Win! +${coinsEarned} coins`;
        winMessage.style.display = 'block';

        // Save progress if logged in (save the next level they've unlocked)
        if (typeof saveProgress === 'function') {
            saveProgress(currentLevel + 1, playerCoins);
        }

        // After 2 seconds, advance to next level
        setTimeout(() => {
            currentLevel++;
            startLevel();
        }, 2000);
    }
}

// Move monsters
function moveMonsters() {
    if (gameOver || gamePaused) return;

    for (const monster of monsters) {
        // Get possible directions
        const directions = [
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 }   // right
        ];

        let newX, newY;

        if (monster.isSmart) {
            // Smart monster: move towards player using Euclidean distance
            let bestDirection = -1;
            let bestDistance = Infinity;

            for (let i = 0; i < 4; i++) {
                const d = directions[i];
                const testX = monster.x + d.dx;
                const testY = monster.y + d.dy;

                if (canMonsterMove(testX, testY)) {
                    // Calculate Euclidean distance to player
                    const distance = Math.sqrt(
                        Math.pow(testX - playerX, 2) + Math.pow(testY - playerY, 2)
                    );

                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestDirection = i;
                    }
                }
            }

            if (bestDirection !== -1) {
                const dir = directions[bestDirection];
                newX = monster.x + dir.dx;
                newY = monster.y + dir.dy;
            } else {
                // No valid moves, stay in place
                continue;
            }
        } else {
            // Regular monster: random movement
            // Try current direction first
            let dir = directions[monster.direction];
            newX = monster.x + dir.dx;
            newY = monster.y + dir.dy;

            // If can't move in current direction, pick a new random direction
            if (!canMonsterMove(newX, newY)) {
                // Find all valid directions
                const validDirs = [];
                for (let i = 0; i < 4; i++) {
                    const d = directions[i];
                    if (canMonsterMove(monster.x + d.dx, monster.y + d.dy)) {
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

// Move player in a direction
function movePlayer(direction) {
    if (gameOver || gamePaused) return;

    let newX = playerX;
    let newY = playerY;

    switch (direction) {
        case 'up':
            newY = playerY - 1;
            break;
        case 'down':
            newY = playerY + 1;
            break;
        case 'left':
            newX = playerX - 1;
            break;
        case 'right':
            newX = playerX + 1;
            break;
        default:
            return;
    }

    // Only move if the new position is valid
    if (canPlayerMove(newX, newY)) {
        // Check if leaving a house
        const wasInHouse = playerInHouse;

        playerX = newX;
        playerY = newY;
        square.style.left = playerX * gridSize + 'px';
        square.style.top = playerY * gridSize + 'px';

        // Check if entering a house
        const houseIndex = checkPlayerInHouse();

        if (houseIndex >= 0 && !wasInHouse) {
            // Entering a house
            startHouseStayTimer(houseIndex);
        } else if (houseIndex < 0 && wasInHouse) {
            // Leaving a house
            stopHouseStayTimer();
        }

        // Check collision after player moves
        if (checkMonsterCollision()) {
            triggerLose();
        } else {
            checkWin();
        }
    }
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (gameOver || gamePaused) return;

    let direction = null;

    switch (e.key) {
        case 'ArrowUp':
            direction = 'up';
            break;
        case 'ArrowDown':
            direction = 'down';
            break;
        case 'ArrowLeft':
            direction = 'left';
            break;
        case 'ArrowRight':
            direction = 'right';
            break;
        default:
            return;
    }

    e.preventDefault();
    movePlayer(direction);
});

// Joystick controls
const joystickContainer = document.getElementById('joystick-container');
const joystickKnob = document.getElementById('joystick-knob');
const joystickDirectionDisplay = document.getElementById('joystick-direction');

let joystickActive = false;
let joystickStartX = 0;
let joystickStartY = 0;
let lastJoystickDirection = null;
let joystickMoveInterval = null;
const JOYSTICK_THRESHOLD = 20; // Minimum distance to register a direction
const JOYSTICK_MAX_DISTANCE = 40; // Maximum knob movement
const JOYSTICK_MOVE_DELAY = 150; // Milliseconds between moves when holding

function getJoystickDirection(deltaX, deltaY) {
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < JOYSTICK_THRESHOLD) {
        return null;
    }

    // Determine primary direction based on angle
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    if (angle >= -45 && angle < 45) {
        return 'right';
    } else if (angle >= 45 && angle < 135) {
        return 'down';
    } else if (angle >= -135 && angle < -45) {
        return 'up';
    } else {
        return 'left';
    }
}

function updateJoystickKnob(deltaX, deltaY) {
    // Limit the knob movement
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > JOYSTICK_MAX_DISTANCE) {
        const scale = JOYSTICK_MAX_DISTANCE / distance;
        deltaX *= scale;
        deltaY *= scale;
    }

    joystickKnob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
}

function resetJoystickKnob() {
    joystickKnob.style.transform = 'translate(-50%, -50%)';
}

function startJoystickMove(direction) {
    if (direction && direction !== lastJoystickDirection) {
        // Clear any existing interval
        if (joystickMoveInterval) {
            clearInterval(joystickMoveInterval);
        }

        // Move immediately
        movePlayer(direction);
        lastJoystickDirection = direction;

        // Continue moving while held
        joystickMoveInterval = setInterval(() => {
            if (lastJoystickDirection) {
                movePlayer(lastJoystickDirection);
            }
        }, JOYSTICK_MOVE_DELAY);
    }
}

function stopJoystickMove() {
    if (joystickMoveInterval) {
        clearInterval(joystickMoveInterval);
        joystickMoveInterval = null;
    }
    lastJoystickDirection = null;
}

// Touch events for joystick
joystickContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joystickActive = true;
    const touch = e.touches[0];
    const rect = joystickContainer.getBoundingClientRect();
    joystickStartX = rect.left + rect.width / 2;
    joystickStartY = rect.top + rect.height / 2;
}, { passive: false });

joystickContainer.addEventListener('touchmove', (e) => {
    if (!joystickActive) return;
    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - joystickStartX;
    const deltaY = touch.clientY - joystickStartY;

    updateJoystickKnob(deltaX, deltaY);

    const direction = getJoystickDirection(deltaX, deltaY);
    joystickDirectionDisplay.textContent = direction ? direction.toUpperCase() : '';

    if (direction !== lastJoystickDirection) {
        stopJoystickMove();
        if (direction) {
            startJoystickMove(direction);
        }
    }
}, { passive: false });

joystickContainer.addEventListener('touchend', (e) => {
    e.preventDefault();
    joystickActive = false;
    resetJoystickKnob();
    stopJoystickMove();
    joystickDirectionDisplay.textContent = '';
}, { passive: false });

joystickContainer.addEventListener('touchcancel', (e) => {
    joystickActive = false;
    resetJoystickKnob();
    stopJoystickMove();
    joystickDirectionDisplay.textContent = '';
});

// Mouse events for joystick (for testing on desktop)
joystickContainer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    joystickActive = true;
    const rect = joystickContainer.getBoundingClientRect();
    joystickStartX = rect.left + rect.width / 2;
    joystickStartY = rect.top + rect.height / 2;
});

document.addEventListener('mousemove', (e) => {
    if (!joystickActive) return;

    const deltaX = e.clientX - joystickStartX;
    const deltaY = e.clientY - joystickStartY;

    updateJoystickKnob(deltaX, deltaY);

    const direction = getJoystickDirection(deltaX, deltaY);
    joystickDirectionDisplay.textContent = direction ? direction.toUpperCase() : '';

    if (direction !== lastJoystickDirection) {
        stopJoystickMove();
        if (direction) {
            startJoystickMove(direction);
        }
    }
});

document.addEventListener('mouseup', () => {
    if (joystickActive) {
        joystickActive = false;
        resetJoystickKnob();
        stopJoystickMove();
        joystickDirectionDisplay.textContent = '';
    }
});

// Pause/Continue functionality
function togglePause() {
    if (gameOver) return;

    const pauseBtn = document.getElementById('pause-btn');
    gamePaused = !gamePaused;

    if (gamePaused) {
        // Pause the game
        if (monsterInterval) {
            clearInterval(monsterInterval);
            monsterInterval = null;
        }
        if (houseTimerInterval) {
            clearInterval(houseTimerInterval);
            houseTimerInterval = null;
        }
        // Pause house cooldowns
        for (const house of houses) {
            if (house.cooldownInterval) {
                clearInterval(house.cooldownInterval);
                house.cooldownInterval = null;
            }
        }
        pauseBtn.textContent = 'Continue';
        pauseBtn.classList.add('paused');
    } else {
        // Resume the game
        monsterInterval = setInterval(moveMonsters, 1000);

        // Resume house stay timer if player was in house
        if (playerInHouse && houseStayTimer > 0) {
            houseTimerInterval = setInterval(() => {
                houseStayTimer--;
                updateHouseTimerDisplay();
                if (houseStayTimer <= 0) {
                    clearInterval(houseTimerInterval);
                    houseTimerInterval = null;
                    triggerLose();
                }
            }, 1000);
        }

        // Resume house cooldowns
        for (const house of houses) {
            if (house.cooldown > 0) {
                house.cooldownInterval = setInterval(() => {
                    house.cooldown--;
                    if (house.cooldown <= 0) {
                        house.cooldown = 0;
                        house.element.classList.remove('cooldown');
                        clearInterval(house.cooldownInterval);
                        house.cooldownInterval = null;
                    }
                    updateHouseTimerDisplay();
                }, 1000);
            }
        }

        pauseBtn.textContent = 'Pause';
        pauseBtn.classList.remove('paused');
    }
}

// Restart level functionality
function restartLevel() {
    // Only allow restart if player is alive
    if (gameOver) return;

    // Reset pause state
    gamePaused = false;
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.textContent = 'Pause';
    pauseBtn.classList.remove('paused');

    // Restart the current level
    startLevel();
}
