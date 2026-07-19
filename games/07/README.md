# Game 07 - Ninja Dash

A 2D side-scrolling platformer rendered on an HTML5 canvas. Guide a pixel-art
ninja through a scrolling level: break the floating mystery boxes to grab the
treasures hidden inside, dodge spike beds and spinning saw blades, then reach the
⛩️ gate — but only once you've collected **every** treasure. Pick your challenge
with Easy / Medium / Hard, and play with keyboard or touch.

Inspired by a hand-drawn sketch: a ninja that walks a 2D map collecting items
hidden in boxes and escaping traps, with on-screen controls and an
"ESY / MYd / HARd" difficulty picker.

## How to Play

### Desktop
- **Move**: ← → (or A / D)
- **Jump**: Space, ↑ or W
- **Double jump**: press jump again while in the air for a second, spinning leap
- **Sound**: 🔊 toggle in the top bar

### Mobile / iPad
- **Jump**: JUMP button on the **left** (left hand) — tap again mid-air to
  double-jump
- **Move**: ◀ ▶ D-pad on the **right** (right hand)
- Controls appear automatically on touch devices

## Goal

Collect **all** the treasures in the level, then reach the ⛩️ gate at the far
right. Touching the gate before you've grabbed everything shows a "Need all N!"
reminder — the gate only opens once your box is full.

## Boxes & Treasures

Floating `?` crates each hide one treasure. Touch a box to smash it and collect
the item; each is worth points, and hitting one from below gives a little bounce.

| Treasure | Points |
|----------|--------|
| ⭐ Star Shuriken | 50 |
| 💎 Jade Gem | 80 |
| 📜 Secret Scroll | 60 |
| 🪙 Gold Coin | 40 |
| 🍡 Dango | 30 |
| 🗝️ Dojo Key | 70 |
| 🏮 Lantern | 45 |

## Traps

| Hazard | Behavior |
|--------|----------|
| ▲ Spikes | Static spike beds on the ground — costs a heart on contact |
| ⚙️ Saw blades | Patrol back and forth across platforms — costs a heart on contact |
| Pits | Fall off the world and you lose a heart and respawn |

Taking a hit knocks the ninja back and grants brief invincibility (the sprite
flickers). Lose all your hearts and it's game over.

## Difficulty

| Mode | Lives | Treasures | Traps | Level |
|------|-------|-----------|-------|-------|
| **ESY** (Easy) | 3 ❤️ | 6 | few, slow saws | shorter |
| **MYd** (Medium) | 2 ❤️ | 8 | more, faster saws | longer |
| **HARd** (Hard) | 1 ❤️ | 10 | many, deadly saws | longest |

## Key Features

- **Canvas platformer** — procedurally drawn pixel art (ninja, boxes, spikes,
  saws, torii gate), a night theme with a moon, parallax mountains and stars.
  No image or audio asset files
- **Double jump** — a mid-air second leap with a full-360 spin flourish; forgiving
  feel via coyote-time and jump buffering
- **Mystery boxes** — smash floating crates to reveal hidden treasures, with
  particle bursts and floating score pop-ups
- **Traps** — spike beds, patrolling saw blades, and pits, with knockback and
  invincibility frames
- **Difficulty picker** — Easy / Medium / Hard change lives, treasure count, trap
  density/speed, and level length
- **Synthesized sound** — WebAudio-generated jump, double-jump, collect, hurt,
  land, win and lose cues, plus a persisted 🔊 mute toggle
- **Shared auth** — clearing a level awards coins to the game-wide `coins`
  balance (synced to the backend when logged in); also works as a **Guest**
- **Best times** — fastest clear per difficulty saved to localStorage
  (`ninjaDashBest`)
- **Touch controls** — JUMP button on the left, move D-pad on the right,
  iPad-friendly

## File Structure

| File | Purpose |
|------|---------|
| `game.html` | Complete game — HTML, CSS, and JS in a single file |

## Server

Like games 02, 03 and 05, Ninja Dash is standalone HTML/JS with no dedicated
backend:

- Static route: `/games/07/` → `serve_game_07` in `app.py`
- Optional coin sync uses game 01's `/games/01/api/user/coins` when a JWT token
  is present; otherwise plays as a Guest
