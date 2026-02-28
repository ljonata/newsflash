# Game 04 - Elf Quest

A top-down action RPG with pixel-art graphics rendered on a 2D canvas. Explore a 40x30 tile overworld, enter house interiors, collect items, complete 12 missions, and play cooperatively with up to 4 players via Socket.IO multiplayer.

## How to Play

### Desktop
- **Move**: Arrow keys or WASD
- **Attack** (sword): Space
- **Interact**: E (open chests, enter/exit houses, cut bushes/trees)

### Mobile
- **Move**: D-pad
- **Attack**: A button
- **Interact**: B button
- **Toggle Backpack**: BAG button
- **Toggle Missions**: QUEST button

## Rules

- Explore the overworld map with 4 houses, a lake, a bridge, forests, and scattered chests/bushes
- Enter houses through doors to explore unique interiors (Village Cottage, Elder's Library, Traveler's Inn, Blacksmith's Workshop)
- Open chests for coins and items (sword, shield, key, potion)
- Cut bushes and trees for coins
- HP is tracked with 3 hearts; potions restore 1 heart
- Complete all 12 missions to master the game
- Progress auto-saves to localStorage every 15 seconds

## Missions

| # | Mission | Requirement | Reward |
|---|---------|-------------|--------|
| 1 | First Steps | Walk 10 tiles | 5 coins |
| 2 | Treasure Hunter | Open 1 chest | 10 coins |
| 3 | Swordsman | Find a sword | 10 coins |
| 4 | Path Clearer | Cut 3 bushes | 10 coins |
| 5 | Explorer | Visit 2 houses | 15 coins |
| 6 | Bridge Crosser | Cross the bridge | 10 coins |
| 7 | Lumberjack | Cut 3 trees | 15 coins |
| 8 | Collector | Open 3 chests | 20 coins |
| 9 | Well Equipped | Have sword + shield | 15 coins |
| 10 | Swimmer | Enter the water | 10 coins |
| 11 | Master Explorer | Visit all 4 houses | 25 coins |
| 12 | Completionist | Open all 5 chests | 50 coins |

## Multiplayer

- **Room-based co-op** via Socket.IO (up to 4 players per room)
- On launch, choose "Join Room" with a code or "Play Solo"
- All players share the same world state (chests, bushes, trees)
- Remote players are rendered with interpolated movement and color-coded sprites
- Player count shown in HUD as `[roomcode] 2/4`

## Key Features

- **Pixel-art tile rendering** — all 20+ tile types generated procedurally via canvas (grass, path, tree, water, wall, door, roof, flower, rock, chest, bush, bridge, floor, furniture)
- **5 tree variants** — each with unique trunk height, canopy shape, and leaf colors
- **Elf sprite system** — 4-directional walking animation with sword/shield variants, all drawn pixel-by-pixel
- **House interiors** — 4 unique 10x8 interior maps with furniture (tables, chairs, beds, bookshelves, fireplaces, rugs)
- **Iris wipe transitions** — Star Wars-style circular wipe when entering/exiting houses
- **Day/night cycle** — 10 real seconds = 1 game minute; dark overlay at night
- **Water mechanics** — slower movement, animated wave highlights
- **Backpack inventory** — sidebar showing sword, shield, key, potion, coins with quantities
- **Mission tracker** — sidebar with 12 progressive missions, checkmarks, and coin rewards
- **Touch controls** — D-pad, action buttons, toggleable sidebar panels
- **Save/load** — full state serialization to localStorage with version migration

## File Structure

| File | Purpose |
|------|---------|
| `game.html` | Complete game — HTML, CSS, and JS in a single file (~2688 lines) |

## Code Structure (game.html)

| Section | Lines | Description |
|---------|-------|-------------|
| CSS | 1-284 | HUD, backpack, missions, mobile controls, room overlay, responsive styles |
| Device Detection | 350-354 | Touch vs. desktop detection |
| Auth | 356-402 | JWT from localStorage, coin sync to server API |
| Multiplayer | 404-525 | Socket.IO — room join, player sync, world event broadcast, remote player interpolation |
| Constants | 527-564 | Tile size (16px, 6x scale), map dimensions (40x30), tile ID enum |
| Map | 566-702 | `createMap()` — procedural overworld with paths, houses, river, trees, flowers, rocks, chests, bushes |
| House Interiors | 704-780 | 4 unique 10x8 interior maps, door position mapping |
| Tile Rendering | 782-1257 | `genTileSprite()` — pixel-by-pixel canvas generation for 20+ tile types with variants |
| Elf Sprite | 1258-1600 | 4-directional walking frames, sword/shield overlays, all drawn pixel-by-pixel |
| Items | 1601-1671 | Item icon generation (sword, shield, key, potion, coin) |
| Game State | 1672-1719 | Player position, HP, inventory, movement, sword swing, interior state, transition state |
| Camera & Rendering | 1720-1915 | Camera follow, tile drawing, elf rendering, remote players, night overlay, interaction prompts, HUD hearts |
| Movement & Input | 1916-2129 | Tile-based movement with interpolation, interaction (chests, doors, bushes, trees), sword attack |
| Keyboard Controls | 2130-2169 | Arrow/WASD, Space, E key |
| Mobile Controls | 2170-2222 | D-pad touch, A/B buttons, BAG/QUEST toggles |
| Backpack | 2223-2295 | Inventory sidebar rendering with item icons and counts |
| Missions | 2295-2395 | 12 missions with conditions, rewards, completion tracking |
| HUD | 2396-2428 | Hearts, coins, game time display |
| Notifications | 2429-2439 | Toast-style popup messages |
| Interaction Prompt | 2440-2473 | Context-sensitive "Press E to interact" display |
| Save/Load | 2474-2529 | Full state serialization with version migration |
| Game Loop | 2531-2665 | `requestAnimationFrame` — input, movement interpolation, sword timer, missions, day/night, multiplayer sync, auto-save |
| Init | 2667-2685 | Auth, sprites, map gen, load state, multiplayer UI, start loop |
