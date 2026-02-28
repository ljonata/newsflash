# Game 03 - BlogCraft

A 3D voxel building game rendered with Three.js. Mine blocks, craft items, write blog posts, and explore a procedurally generated world with a day/night cycle, chickens, and a ranking system.

## How to Play

### Desktop
- **Move**: WASD (hold S+W to sprint)
- **Look**: Mouse (pointer lock)
- **Jump**: Space
- **Mine**: Hold left click (progressive mining with crack overlay)
- **Place block**: Right click
- **Select hotbar slot**: 1-9 keys
- **Crafting table**: E
- **Chat**: Q

### Mobile
- **Move**: Left joystick
- **Look**: Drag right side of screen
- **Mine**: Hold tap
- **Place block**: Quick tap
- **Crafting**: E button
- **Jump**: Jump button

## Rules

- Mine blocks to collect resources; place blocks to build
- Craft tools and special items using the 3x3 crafting grid (shape matters)
- Earn coins by crafting blog posts and publishing them (auto-publish every 30s when holding blog posts)
- Gain followers from publishing; rank up as followers grow
- World auto-saves every 30 seconds; manual save on crafting/publishing

## Block Types

Dirt, Grass, Stone, Wood, Leaves, Sand, Cobblestone, Planks, Glass, Iron Ore, Diamond Ore, Gold Ore, Paper, Blog Post, Iron Ingot, Diamond, Gold Ingot, Bookshelf

## Crafting Recipes

| Output | Grid Pattern | Ingredients |
|--------|-------------|-------------|
| Planks (4) | 1x1 | 1 Wood |
| Cobblestone (4) | 1x1 | 1 Stone |
| Glass (2) | 1x1 | 1 Sand |
| Paper (3) | 3x1 row | 3 Planks |
| Blog Post (1) | Paper surrounded by planks | 4 Planks + 1 Paper |
| Bookshelf (1) | 3x3 planks-paper-planks | 6 Planks + 3 Paper |
| Iron Ingot | 1x1 | 1 Iron Ore |
| Diamond | 1x1 | 1 Diamond Ore |
| Gold Ingot | 1x1 | 1 Gold Ore |
| Pickaxe | T-shape | 3 Iron + 2 Planks |

## Ranks

| Rank | Followers Required |
|------|-------------------|
| Newbie | 0 |
| Blogger | 5 |
| Writer | 20 |
| Editor | 50 |
| Journalist | 100 |
| Columnist | 250 |
| Senior Editor | 500 |
| Star Reporter | 1000 |

## Key Features

- **Three.js r128** with InstancedMesh rendering for performance
- **Procedural textures** — all block textures generated pixel-by-pixel on canvas
- **Day/night cycle** — 10 real minutes = 1 game day; sun, moon, stars, and sky color interpolation
- **Clouds** — animated cloud layer that drifts across the sky
- **Progressive mining** — hold to mine with 4-stage crack overlay and progress bar
- **Pickaxe upgrades** — crafted pickaxe speeds up mining by 50%
- **Chickens** — ambient mobs that wander, peck, and cluck
- **Chat system** — local message history with NPC responses (villager, merchant, miner, etc.)
- **Crafting** — 3x3 shape-based grid; recipes must match exact pattern
- **Save/load** — localStorage with IndexedDB for world data
- **Mobile touch controls** — joystick movement, tap to place, hold to mine

## File Structure

| File | Purpose |
|------|---------|
| `game.html` | Complete game — HTML, CSS, and JS in a single file (~2681 lines) |

## Code Structure (game.html)

| Section | Lines | Description |
|---------|-------|-------------|
| CSS | 1-283 | HUD, chat, crosshair, hotbar, crafting panel, start overlay, mobile controls |
| Device Detection | 372-378 | Touch vs. desktop detection |
| Auth | 381-400 | JWT from localStorage, redirect to login if missing |
| Block Types | 402-458 | `BLOCKS` object — 18 block types with color, hardness, drops |
| Recipes | 419-458 | Crafting recipes as 2D grid patterns |
| Ranks | 460-470 | Follower thresholds for 8 rank tiers |
| Game State | 472-517 | World dict, inventory, day/night vars, movement/mining state |
| Three.js Setup | 518-627 | Scene, camera, lighting, fog, sky scene, hand overlay scene |
| World Generation | 628-1100 | Terrain gen, tree/flower placement, texture gen, instanced meshes, crack overlays |
| Chickens | 1101-1261 | Ambient mobs — spawn, wander AI, peck animation, rendering |
| Day/Night Cycle | 1262-1605 | Sun/moon sprites, star field, sky color keyframes, fog updates, cloud system |
| Inventory & Hotbar | 1606-1709 | 9-slot hotbar, block selection, count display |
| Block Interaction | 1710-1768 | Mine block (raycaster), place block (adjacent face), publish blog posts |
| Crafting | 1769-2048 | 3x3 grid UI, pattern matching, recipe lookup, craft execution |
| HUD | 2049-2074 | Username, coins, followers, rank, game time display |
| Chat | 2075-2151 | Message log, NPC auto-responses, open/close with Escape hold-to-quit |
| Save/Load | 2152-2194 | localStorage + IndexedDB for world blocks |
| Physics/Movement | 2195-2273 | Gravity, collision (AABB), sprint, forward/strafe vectors |
| Controls (Keyboard) | 2274-2317 | WASD, Space, number keys, E for craft, Q for chat |
| Controls (Mouse) | 2318-2397 | Pointer lock, mouse look, click to mine/place |
| Controls (Touch) | 2398-2532 | Joystick, tap-to-place, hold-to-mine, mobile buttons |
| Game Loop | 2534-2637 | `requestAnimationFrame` loop — physics, chickens, day/night, mining, hand animation, triple render pass (sky + world + hand) |
| Init | 2653-2677 | Auth, texture gen, world gen/load, chicken spawn, start loop |
