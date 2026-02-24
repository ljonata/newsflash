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
| 03 | **BlogCraft** | `/games/03/` | Minecraft-style block-building game rendered on a canvas. HUD tracks username, coins, followers, and rank. |
| 04 | **Elf Quest** | `/games/04/` | Side-scrolling action RPG with a pixel-art elf. Backpack/inventory system, heart-based HP, coin collection. |

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

### Game Frontend (`games/01/`)
Static HTML files served by Flask at `/games/01/`. All API calls go to `/games/01/api/`. The entire game logic (maze generation, monster AI, collision detection, touch controls) lives in `move_square.js`.

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
