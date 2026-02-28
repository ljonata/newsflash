# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a Flask monolith serving two applications plus four browser games:

1. **Newsflash** - Keyword-based authentication system with journalism-focused data collection forms. Users access via `?key=keyword` URLs without login/password.

2. **Four browser games** served from `games/` — all share the same Flask server; game 01 has a full Flask backend API, games 02–04 are standalone HTML/JS:

| # | Title | Path | Description |
|---|-------|------|-------------|
| 01 | **Labyrinth Game** | `/games/01/` | Maze game — navigate a square through labyrinths avoiding monsters. JWT auth, level progression, coin rewards, avatar marketplace, leaderboards. |
| 02 | **Plant Defense** | `/games/02/` | Plants vs. Zombies-style tower defense. 5×10 grid; place Peashooter, Sunflower, Wall-nut, Snow Pea, or Repeater plants to stop zombie waves. |
| 03 | **BlogCraft** | `/games/03/` | 3D voxel building game with Three.js. Mine blocks, craft items, write blog posts. Day/night cycle, chickens, ranking system. |
| 04 | **Elf Quest** | `/games/04/` | Top-down action RPG with pixel-art elf on 2D canvas. 40×30 tile overworld, house interiors, 12 missions, Socket.IO multiplayer (up to 4 players). |

Games 02–04 are standalone HTML/JS with no dedicated Flask API. They optionally link to `/games/01/login.html` for shared auth.

## Development Commands

```bash
# Setup
cp .env.example .env  # Configure FLASK_SECRET_KEY and DATABASE_URL
python -m venv .venv && .venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Run development server
flask --app app run --debug

# Initialize database
python scripts/init_db.py
python scripts/init_db.py --create-user --email user@example.com --keyword secretword123

# Populate avatars from image files
python scripts/populate_avatars_from_images.py

# Production (Render.com)
gunicorn app:app --workers 3 --threads 2 --bind 0.0.0.0:$PORT --timeout 120
```

## Architecture

### Single Flask Application (`app.py`)
The entire system runs as one Flask app with two distinct sections:
- **Newsflash routes**: keyword authentication, dashboard, forms A/B/C, records view
- **Game routes**: static file serving for all four games, JWT auth API for game 01

`config.py` handles environment loading and normalizes `DATABASE_URL` to psycopg3 dialect (handles `postgres://`, `postgresql://`, and `postgresql+psycopg2://` variants automatically).

### Database Models (`models.py`)
All tables use UUID primary keys with automatic timestamps (`created_at`, `last_update`).

**Newsflash models:**
- `User` - keyword-based auth, email unique
- `FormA` - article structure form (about, headline, lede, nut_graf, body, conclusion, organizations, persons)
- `FormB` - source/contact form (name, summary, comment)
- `FormC` - tip form (subject, details, extra)
- `FormD` - model exists but has no submission route; `/form/d` is a records *view* that queries `FormA`

**Game models:**
- `GameUser` - game accounts with bcrypt passwords, coins, level tracking
- `Avatar` - marketplace catalog with prices, `is_public` flag for visibility
- `GameUserAvatar` - ownership join table; `avatar_id` is a plain string (not a FK) referencing `Avatar.avatar_id`

### Authentication Patterns

**Newsflash** - Keyword-based:
- `@keyword_required` decorator validates `?key=` parameter against `User.keyword`
- User stored in `g.current_user`, keyword in `g.keyword`

**Game** - JWT-based:
- `@game_token_required` decorator validates `Authorization: Bearer <token>` header
- User ID stored in `g.game_user_id`, username in `g.game_username`
- 7-day token expiration, signed with `GAME_JWT_SECRET`

### Game 01 — Labyrinth Game (`games/01/`)

DOM-based maze game on a 30×30 cell grid. Multiple HTML pages with a shared JWT auth system.

**Files:** `game.html`, `move_square.js` (~1328 lines), `home.html`, `login.html`, `marketplace.html`, `leaders.html`, `profile.html`

**Technical details:**
- Maze rendered as DOM elements; three 30×30 grid arrays (`maze1`, `maze2`, `maze3`) where 1=wall, 0=path
- Two alternating maze layouts (odd/even levels); monster count and difficulty scale per level
- Monster AI: patrol mode + smart chase that hunts toward the player
- Bomb system: one per level, 5-second fuse, explosion radius constrained by walls (can kill the player too)
- Safe house mechanic: 30-second safety timer, 40-second cooldown
- Responsive sizing for phone, tablet, desktop
- Backend sync: PUT to `/games/01/api/user/progress` to save level and coins
- All API calls go to `/games/01/api/`

**Code sections in `move_square.js`:** Game State & Sizing → Maze Definitions → Wall Rendering (`createWalls()`) → Monster AI (`moveMonster()`, `checkMonsterCollision()`) → Player Movement (`movePlayer()`, `handleKeydown()`) → Bomb Mechanics (`placeBomb()`, `triggerExplosion()`) → House System (`checkHouseCollision()`, `exitHouse()`) → Win/Lose (`triggerWin()`, `triggerLose()`) → Backend Sync

### Game 02 — Plant Defense (`games/02/`)

Single-file tower defense game (`game.html`, ~1370 lines). 5×10 DOM grid with CSS-only sprites.

**Plant types:**

| Plant | Cost | HP | Behavior |
|-------|------|----|----------|
| Peashooter | 100 | 1 | Shoots peas every 3s at zombies in its row |
| Sunflower | 50 | 1 | Auto-generates 25 suns every 15s with RAF progress bar |
| Wall-nut | 50 | 15 | Blocks zombies; 1 HP/zombie/second; visual damage at 66%/33% |
| Snow Pea | 175 | 1 | Shoots ice peas that slow zombies 4s (half speed) |
| Repeater | 200 | 1 | Double-shot per interval |

**Technical details:**
- Starts with 100 suns; 25 bonus suns per wave
- Zombie HP scales with wave: `1 + floor((wave - 1) / 2)`; zombies per wave: `5 + (wave - 1) * 2`
- Zombie movement: 6-second intervals crossing left; slowed zombies skip every other tick
- Sunflower progress bar uses `requestAnimationFrame` loop with `performance.now()` elapsed tracking; RAF must be manually restarted after each 15s cycle
- Zombies show chomping animation (CSS `scaleY` keyframe) when sharing a cell with a plant
- Multiple zombies in same cell get positional margin offsets to show stacking
- CSS-only sprites using gradients, `box-shadow`, and pseudo-elements across 3 responsive breakpoints (60px/36px/28px cells)
- Plants positioned top-left of cell, zombies offset bottom-right for overlap visibility

**Code sections:** Auth → Plant Types (`PLANT_TYPES` array) → Game State → Plant Panel → Grid Setup → Plant Logic (`placePlant()`, `removePlant()`) → Sun Logic (`setupSunProgress()`, `autoGenerateSun()`) → Projectile Logic → Zombie Logic (`spawnZombie()`, `moveZombies()`, `killZombie()`) → Chomping (`updateChompingState()`) → Zombie Offsets (`updateZombieOffsets()`) → Wall-nut Durability → Waves (`nextWave()`) → Game Flow

### Game 03 — BlogCraft (`games/03/`)

Single-file 3D voxel game (`game.html`, ~2681 lines). Three.js r128 with InstancedMesh rendering.

**Technical details:**
- 18 block types (dirt, grass, stone, wood, leaves, sand, cobblestone, planks, glass, iron/diamond/gold ore, paper, blog post, iron/diamond/gold ingot, bookshelf)
- All block textures generated procedurally pixel-by-pixel on canvas (16×16 `TEX_SIZE`)
- InstancedMesh per block type with material cache — drastically reduces draw calls
- Hidden-face culling: blocks surrounded on all 6 sides are not rendered
- Progressive mining with 4-stage crack overlay (hold to mine); pickaxe crafted from iron speeds mining 50%
- 3×3 shape-based crafting grid — recipes must match exact spatial pattern
- Blog publishing: craft blog posts → auto-publish every 30s → earn coins and followers → rank up (8 tiers: Newbie → Star Reporter)
- Day/night cycle: 10 real minutes = 1 game day; separate sky scene for sun, moon, 200 stars; sky color interpolation across 8 keyframes; fog color synced
- Animated cloud layer drifting across the sky
- Chickens: ambient mobs with wander AI, peck animation, clucking
- Chat system: local message history with NPC auto-responses (villager, merchant, miner, etc.)
- Triple render pass: sky scene (no fog) → main scene → hand overlay (separate camera, cleared depth)
- Physics: gravity, AABB collision, sprint mode
- Save/load: localStorage metadata + IndexedDB for world block data
- Mobile: virtual joystick, tap to place, hold to mine, dedicated buttons

**Code sections:** Device Detection → Auth → Block Types (`BLOCKS`) → Recipes → Ranks → Game State → Three.js Setup (scene, camera, lighting, fog, sky scene, hand scene) → World Generation → Textures (`genTextures()`) → Instanced Meshes → Crack Overlays → Chickens → Day/Night Cycle (sun/moon sprites, stars, sky colors, clouds) → Inventory & Hotbar → Block Interaction (mine/place via raycaster) → Crafting → HUD → Chat → Save/Load → Physics/Movement → Controls (keyboard, mouse pointer lock, touch) → Game Loop → Init

### Game 04 — Elf Quest (`games/04/`)

Single-file top-down action RPG (`game.html`, ~2688 lines). 2D canvas rendering with pixel-art tile sprites.

**Technical details:**
- 40×30 tile overworld (16px tiles at 6× scale = 96px rendered); 20+ tile types procedurally generated via canvas pixel art
- 5 tree variants with unique trunk height, canopy shape, and leaf color palettes
- 4 houses with unique 10×8 interior maps (Village Cottage, Elder's Library, Traveler's Inn, Blacksmith's Workshop); furniture tiles: table, chair, bed, bookshelf, fireplace, rug
- Elf sprite system: 4-directional walking frames with sword/shield variants, all drawn pixel-by-pixel
- Star Wars-style iris wipe transitions when entering/exiting houses
- 12 progressive missions with coin rewards (First Steps through Completionist)
- Inventory: sword, shield, key, potion, coins — displayed in backpack sidebar
- Day/night cycle: 10 real seconds = 1 game minute; dark overlay at night
- Water mechanics: slower movement (0.45× speed), animated wave highlights
- Tile-based movement with smooth interpolation (`moveProgress` advanced by `MOVE_SPEED * delta`)
- Socket.IO multiplayer (up to 4 players per named room):
  - Room join overlay on launch; "Join Room" or "Play Solo"
  - Events: `elf_join_room`, `elf_player_update` (20Hz), `elf_world_event` (chest/bush/tree sync), `elf_player_joined`, `elf_player_left`, `elf_room_state`
  - Remote players rendered with interpolated movement and color-coded sprites
  - Shared world state: opened chests, cut bushes, cut trees synced across all players
  - Server holds room state in memory dict in `app.py`
- Save/load: full state serialization to localStorage with version migration
- Mobile: D-pad, A/B action buttons, toggleable BAG/QUEST sidebars

**Code sections:** Device Detection → Auth (JWT + coin sync) → Multiplayer (Socket.IO room logic, remote player interpolation) → Constants (tile size, map dimensions, tile IDs) → Map (`createMap()`) → House Interiors (4 maps) → Tile Rendering (`genTileSprite()` for 20+ types) → Elf Sprite → Items → Game State → Camera & Rendering (tile drawing, remote players, night overlay) → Movement & Input → Keyboard/Mobile Controls → Backpack → Missions (12 with conditions/rewards) → HUD → Notifications → Interaction Prompt → Save/Load → Game Loop → Init

### Game API Endpoints
All under `/games/01/api/`:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Create account |
| POST | `/login` | No | Get JWT token |
| GET | `/user/profile` | Yes | User data + avatars |
| PUT | `/user/progress` | Yes | Save level/coins |
| PUT | `/user/coins` | Yes | Update coins |
| PUT | `/user/password` | Yes | Change password |
| GET | `/user/avatars` | Yes | Owned avatars |
| POST | `/user/avatars/buy` | Yes | Purchase avatar |
| PUT | `/user/avatars/select` | Yes | Set active avatar |
| GET | `/avatars` | No | All public avatars |
| GET | `/leaderboard` | No | Top 15 rankings |

### Avatar System
- Images stored in `games/img/avatars/public/` (marketplace) and `games/img/avatars/users/` (private)
- `is_public=True` avatars appear in marketplace; prices defined in `Avatar` table
- Default avatar (`avatar-default`) is always free and always injected into results even if absent from the DB
- The leaderboard's avatar ranking uses a live `COUNT(game_user_avatars.id)` join — not the denormalized `GameUser.avatars` integer column

### Database Migrations
`migrate_game_users_table()` runs on every startup and adds missing columns to `game_users` (`highest_level_at`, `avatars`, `selected_avatar`) via `ALTER TABLE` with try/catch. Add new migration columns here when extending the model.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL or SQLite connection string |
| `FLASK_SECRET_KEY` | Session encryption key |
| `GAME_JWT_SECRET` | JWT signing key for game auth |

For development, use SQLite: `DATABASE_URL=sqlite:///local.db`

## Key Implementation Notes

- Database sessions use context managers: `with Session(db_engine) as db_session:`
- Form routes strip whitespace from all inputs before validation
- Game leaderboard has two rankings: highest level (tiebreak by earliest date) and most avatars (tiebreak by coins)
- `config.py` rewrites `DATABASE_URL` dialect to use psycopg3 (`+psycopg`) at import time — do not use psycopg2-style URIs
