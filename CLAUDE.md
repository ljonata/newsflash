# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a Flask monolith serving two applications:

1. **Newsflash** - Keyword-based authentication system with journalism-focused data collection forms. Users access via `?key=keyword` URLs without login/password.

2. **Labyrinth Game** (`/games/01/`) - Browser-based maze game with JWT authentication, level progression, coin rewards, avatar marketplace, and leaderboards. Static HTML/JS frontend served by Flask.

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
The entire system runs as one Flask app:
- **Lines 86-204**: Newsflash routes (keyword authentication, forms)
- **Lines 206-627**: Labyrinth game routes (JWT auth, game API, avatar system)

### Database Models (`models.py`)
All tables use UUID primary keys with automatic timestamps (`created_at`, `last_update`).

**Newsflash models:**
- `User` - keyword-based auth, email unique
- `FormA/B/C/D` - data collection forms linked to users

**Game models:**
- `GameUser` - game accounts with bcrypt passwords, coins, level tracking
- `Avatar` - marketplace catalog with prices, `is_public` flag for visibility
- `GameUserAvatar` - many-to-many ownership between users and avatars

### Authentication Patterns

**Newsflash** - Keyword-based (`app.py:68-84`):
- `@keyword_required` decorator validates `?key=` parameter
- User stored in `g.current_user`, keyword in `g.keyword`

**Game** - JWT-based (`app.py:224-245`):
- `@game_token_required` decorator validates Bearer token
- User ID stored in `g.game_user_id`, username in `g.game_username`
- 7-day token expiration

### Game Frontend (`games/01/`)
Static HTML files served by Flask at `/games/01/`:
- `login.html` - Login/register UI
- `game.html` - Main game interface
- `home.html` - Dashboard
- `profile.html` - User profile and avatar selection
- `marketplace.html` - Avatar store
- `leaders.html` - Leaderboards
- `move_square.js` - Game logic (maze generation, monster AI, collision detection, touch controls)

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
- `is_public=True` avatars appear in marketplace
- Default avatar (`avatar-default`) always available free
- Prices defined in `Avatar` table, not hardcoded

### Database Migrations
Auto-migration for `game_users` table runs on startup (`app.py:24-57`). New columns added via `ALTER TABLE` with try/catch.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL or SQLite connection string |
| `FLASK_SECRET_KEY` | Session encryption key |
| `GAME_JWT_SECRET` | JWT signing key for game auth |

For development, use SQLite: `DATABASE_URL=sqlite:///local.db`

## Key Implementation Notes

- Database sessions use context managers: `with Session(db_engine) as db_session:`
- Form routes strip whitespace from inputs before validation
- Game leaderboard has two rankings: highest level (tiebreak by earliest date) and most avatars (tiebreak by coins)
- Avatar purchase increments `GameUser.avatars` count for leaderboard tracking
