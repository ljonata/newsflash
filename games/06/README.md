# Game 06 - City Life

A 3D walk-around life simulator rendered with Three.js. Explore a shared city
from a first-person view — go to work for cash, sleep at home, grab a
meal, and relax in the park while keeping your energy, hunger and mood up. Play
solo or hang out with up to 8 players in a Socket.IO room, complete with chat.

## How to Play

### Desktop
- **Move**: W walk forward, **S sprint**, A/D strafe, ↓ step back (relative to where you're looking)
- **Look around**: drag the mouse (first-person view); arrow Left/Right also turn
- **Interact**: E (work / sleep / eat / relax near a building)
- **Chat**: Enter to open, Enter to send, Esc to cancel (multiplayer rooms only)

### Mobile
- **Move**: on-screen joystick (bottom-left)
- **Look around**: drag on the right half of the screen
- **Interact**: E button (bottom-right)
- **Chat**: CHAT button

## Goal

Keep your character thriving by balancing four stats while earning money:

| Stat | Drains because… | Restore by… |
|------|-----------------|-------------|
| 💵 Cash | spending on food | working at the 🏢 Office |
| ⚡ Energy | time passing, working | sleeping at 🏠 Home |
| 🍔 Hunger | time passing | eating at the 🍔 Diner ($15) |
| 😊 Mood | low hunger, work | relaxing in the 🌳 Park |

Energy and hunger decay as in-game time passes; if hunger hits zero, energy and
mood drain faster. Each action also advances the in-game clock and day/night cycle.

## Buildings

The city has a 4×4 grid of blocks. The four corner blocks are interactive:

| Building | Action | Effect |
|----------|--------|--------|
| 🏠 Home | **Enter the house** | Step inside a furnished room (see below) |
| 🏢 Office | Work a shift | +$40–60, costs energy/hunger, +3 hours |
| 🍔 Diner | Eat ($15) | Hunger → 100, small mood/energy boost |
| 🌳 Park | Relax | +22 mood, small energy cost |

The remaining blocks are decorative high-rise towers with lit windows.

### Inside your house

Press **E** on the Home building to step inside. The interior is a cozy room
(deliberately roomier than the building looks from outside) with walls, a wood
floor, ceiling and a warm light. Three pieces of furniture are interactive:

| Furniture | Action | Effect |
|-----------|--------|--------|
| 🛏️ Bed | Sleep | Energy → 100, advances to next 07:00 |
| 🧊 Fridge | Eat (free) | Hunger → 100, small mood/energy boost |
| 🛋️ Sofa | Relax | +18 mood, small energy boost |

Walk to the 🚪 door and press **E** to leave and return to the city.

## Multiplayer

- **Room-based** via Socket.IO (up to 8 players per room)
- On launch, choose "Join City" with a room code, or "Play Solo"
- The city layout is **deterministic** (seeded), so everyone in a room shares the
  exact same streets and buildings
- Remote players appear as color-coded avatars with floating name labels and
  interpolated movement
- Live text chat is shared across the room
- Player count shown in the HUD as `🌆 roomcode · 2/8`

## Key Features

- **Three.js 3D city** — seeded procedural generation (roads, towers, trees,
  street lamps) so all players see an identical world
- **Enterable house** — step inside the Home for a furnished room (walls, floor,
  ceiling, bed, fridge, sofa); bigger on the inside than the exterior footprint
- **First-person view** — eye-level camera with mouse/touch look; your own body
  is hidden locally. Other players appear as box-built humanoid avatars with a
  walk animation, color-coded per player, with floating name labels
- **Life-sim stats** — cash, energy, hunger, mood with decay, drift and building-driven recovery
- **Day/night cycle** — sky/fog colors, sun arc and light intensity shift over the
  day; street lamps glow at night
- **Shared auth** — cash maps to the game-wide `coins` balance (synced to the
  backend when logged in); also works as a Guest
- **Save/load** — single-player progress persists to localStorage (`citylife_state`)
- **Touch controls** — joystick, camera drag, action and chat buttons

## File Structure

| File | Purpose |
|------|---------|
| `game.html` | Complete game — HTML, CSS, and JS in a single file |

## Server

Unlike games 02/03/05, City Life has server-side logic in `app.py`:

- Static route: `/games/06/` → `serve_game_06`
- Socket.IO handlers (`city_*`): `city_join_room`, `city_player_update`,
  `city_chat`, and shared `disconnect` cleanup
- Room state held in the in-memory `city_rooms` dict
