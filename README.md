# Newsflash + Games

This repository is a Flask monolith serving two applications and four browser games.

---

## Newsflash

A Flask web application with PostgreSQL/SQLite backend for keyword-based authentication and journalism-focused data collection forms.

- Minimalist gray/white UI, mobile-first design
- Users authenticate via `?key=keyword` URL parameter (no login/password)
- Forms A/B/C submit structured data to the database
- Button D shows all Form A records in a list/detail view

### Quickstart

```bash
cp .env.example .env
# Set FLASK_SECRET_KEY and DATABASE_URL in .env

python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt

python scripts/init_db.py
python scripts/init_db.py --create-user --email user@example.com --keyword secretword123
flask --app app run --debug
```

### Deployment (Render)
- Build: `pip install -r requirements.txt`
- Start: `gunicorn app:app --workers 3 --threads 2 --bind 0.0.0.0:$PORT --timeout 120`
- Env vars: `DATABASE_URL`, `FLASK_SECRET_KEY`, `GAME_JWT_SECRET`

---

## Games

Four browser games are served from `games/`. All share the same Flask process.

### Game 01 — Labyrinth Game (`/games/01/`)

Navigate a red square through procedurally generated mazes while avoiding monsters.

- **Level progression**: Monster count and difficulty scale each level
- **Coin rewards**: Earn coins per level completed
- **JWT accounts**: Register/login to save progress
- **Avatar marketplace**: Buy and equip avatars with earned coins
- **Leaderboards**: Top 15 by highest level and most avatars
- **Guest mode**: Play without an account (progress not saved)
- **Mobile**: Touch joystick controls

**Controls**: Arrow keys (desktop) · Touch joystick (mobile)

**API** (all under `/games/01/api/`): register, login, profile, progress, coins, password, avatars CRUD, leaderboard

**Avatars**: Images in `games/img/avatars/public/` (marketplace) and `games/img/avatars/users/` (private). Populate from images with:
```bash
python scripts/populate_avatars_from_images.py
```

---

### Game 02 — Plant Defense (`/games/02/`)

Plants vs. Zombies-style tower defense on a 5×10 grid.

- Place plants in grid cells to stop waves of zombies marching left
- Collect sun currency to afford plants; Sunflowers generate extra sun over time
- Zombie HP scales with wave number; spawn rate increases each wave

**Plants**: Peashooter · Sunflower (sun gen) · Wall-nut (blocker) · Snow Pea (slows) · Repeater (double shot)

Standalone HTML/JS — no dedicated backend. Optional login links to game 01 accounts.

---

### Game 03 — BlogCraft (`/games/03/`)

Minecraft-style block-building game rendered on an HTML5 canvas.

- First-person perspective with crosshair
- Hotbar for block selection
- HUD tracks username, coins, followers, and rank

Standalone HTML/JS — no dedicated backend. Optional login links to game 01 accounts.

---

### Game 04 — Elf Quest (`/games/04/`)

Side-scrolling action RPG with a pixel-art elf character.

- Heart-based HP system (displayed in HUD)
- Backpack/inventory panel for items
- Coin collection and combat

Standalone HTML/JS — no dedicated backend. Optional login links to game 01 accounts.
