# Game 01 - Labyrinth Game

A maze-navigation game where players guide a character through procedurally-structured labyrinths while avoiding monsters. Features JWT authentication, progressive difficulty, coin rewards, and an avatar marketplace.

## How to Play

- **Move**: Arrow keys or WASD
- **Place bomb**: Spacebar (one per level, 5-second fuse)
- **Goal**: Reach the gold tile before monsters catch you
- **Houses**: Enter for up to 30 seconds of safety (40-second cooldown)
- **Mobile**: Touch controls supported

## Rules

- Navigate the 30x30 grid maze from start to goal
- Avoid monsters that patrol and chase you
- One bomb per level — kills monsters in a radius, but can kill you too
- Completing levels earns coins and progresses difficulty
- Two alternating maze layouts (odd/even levels)
- Monster count and difficulty increase each level

## Key Features

- JWT-based authentication (7-day tokens)
- Avatar marketplace with purchasable skins
- Dual leaderboards: highest level and most avatars
- Responsive design (phone, tablet, desktop)
- Bomb system with explosion radius constrained by walls
- Safe house mechanic with timers
- Smart monster AI that hunts toward the player

## File Structure

| File | Purpose |
|------|---------|
| `game.html` | Main game page — 30x30 cell grid layout |
| `move_square.js` | Game engine (~1328 lines) — maze rendering, monster AI, collision, bombs, houses, level progression |
| `home.html` | Post-login dashboard with navigation links |
| `login.html` | Register/Login UI, JWT auth |
| `marketplace.html` | Avatar shop — browse and purchase avatars |
| `leaders.html` | Leaderboard — top 15 by level and by avatars |
| `profile.html` | User stats, avatar gallery, avatar selection, password change |

## Code Structure (move_square.js)

| Section | Description |
|---------|-------------|
| Game State & Sizing | DOM refs, responsive sizing, game flags, bomb/house variables |
| Maze Definitions | `maze1`, `maze2`, `maze3` — 30x30 grid arrays (1=wall, 0=path) |
| Wall Rendering | `createWalls()` renders maze walls as DOM elements |
| Monster AI | `moveMonster()`, `checkMonsterCollision()` — patrol + smart chase |
| Player Movement | `movePlayer()`, `handleKeydown()` — input handling, collision |
| Bomb Mechanics | `placeBomb()`, `triggerExplosion()` — fuse countdown, damage radius |
| House System | `checkHouseCollision()`, `exitHouse()` — safety timer, cooldown |
| Win/Lose | `triggerWin()`, `triggerLose()` — level progression, coin updates |
| Backend Sync | PUT to `/games/01/api/user/progress` to save level and coins |

## API Endpoints Used

All under `/games/01/api/`:
- `POST /register` — Create account
- `POST /login` — Get JWT token
- `GET /user/profile` — User data + avatars
- `PUT /user/progress` — Save level/coins
- `GET /avatars` — All public avatars
- `POST /user/avatars/buy` — Purchase avatar
- `GET /leaderboard` — Top 15 rankings
