# Game 02 - Plant Defense

A Plants vs. Zombies-style tower defense game where players place plants on a 5x10 grid to stop waves of zombies. Features five plant types, progressive wave difficulty, and responsive CSS-only sprite design.

## How to Play

- **Select a plant** from the left panel, then **click a grid cell** to place it
- **Goal**: Prevent zombies from reaching the left edge
- Plants cannot be placed on the last (rightmost) column
- **Sun**: Start with 100 suns; spend suns to place plants
- **Waves**: Survive as many waves as possible

## Plant Types

| Plant | Cost | HP | Special |
|-------|------|----|---------|
| Peashooter | 100 | 1 | Shoots peas every 3s at zombies in its row |
| Sunflower | 50 | 1 | Auto-generates 25 suns every 15s (progress bar shown) |
| Wall-nut | 50 | 15 | Blocks zombies; takes 1 damage per zombie per second |
| Snow Pea | 175 | 1 | Shoots ice peas that slow zombies for 4s |
| Repeater | 200 | 1 | Double-shot (fires two projectiles per interval) |

## Rules

- Zombies spawn on the right (column 9) and move left every 6 seconds
- Slowed zombies move at half speed (skip every other tick)
- Zombie HP scales with wave: `1 + floor((wave - 1) / 2)`
- Each wave has `5 + (wave - 1) * 2` zombies; spawn interval decreases each wave
- 25 bonus suns awarded at the start of each new wave
- Wall-nuts show visual damage at 66% and 33% HP
- Zombies play a chomping animation when eating a plant
- Game over when any zombie reaches column 0

## File Structure

| File | Purpose |
|------|---------|
| `game.html` | Complete game — HTML, CSS, and JS in a single file (~1343 lines) |

## Code Structure (game.html)

| Section | Description |
|---------|-------------|
| CSS Styles | Responsive grid layout (60px/36px/28px cells), CSS-only plant & zombie sprites with gradients and pseudo-elements, chomping animation |
| Auth | Reads JWT from localStorage, displays username/coins, links to shared login |
| Plant Types | `PLANT_TYPES` array — defines cost, HP, shoot interval, special abilities |
| Game State | Grid refs, timer IDs, arrays for `plants`, `zombies`, `projectiles` |
| Plant Panel | Left sidebar with plant selection, sun counter, cost/disabled states |
| Grid Setup | 5x10 DOM grid with alternating row colors and dirt rightmost column |
| Plant Logic | `placePlant()`, `removePlant()` — spawn plants, start shoot/sun timers |
| Sun Logic | `setupSunProgress()` — RAF-based progress bar; `autoGenerateSun()` — adds 25 suns per cycle |
| Projectile Logic | `shootProjectile()`, `moveProjectiles()` — peas move right, check zombie collision |
| Zombie Logic | `spawnZombie()`, `moveZombies()`, `killZombie()` — spawn, move left, check plant collision |
| Wall-nut Durability | `updateWallnutDamage()` — 1 HP per zombie per second, visual damage states |
| Chomping | `updateChompingState()` — toggles CSS animation on zombies sharing a cell with a plant |
| Waves | `nextWave()` — increase zombie count, decrease spawn delay, award bonus suns |
| Game Flow | `triggerLose()`, `restartGame()`, `clearAllTimers()`, `startTimers()` |

## Responsive Breakpoints

| Breakpoint | Cell Size | Plant Size | Zombie Size |
|------------|-----------|------------|-------------|
| Desktop | 60x60px | 40x40px | 36x36px |
| ≤780px | 36x36px | 24x24px | 22x22px |
| ≤480px | 28x28px | 18x18px | 18x18px |
