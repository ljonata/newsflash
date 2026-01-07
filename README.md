# Newsflash + Labyrinth Game

This repository contains two applications:

## 1. Newsflash (Flask Application)

A Flask web application with PostgreSQL/SQLite backend for keyword-based authentication and journalism-focused data collection forms.

- Minimalist gray/white UI
- Mobile-first, phone-optimized design
- Forms A/B/C submit to PostgreSQL
- Button D shows all Form A records in a list/detail view
- Square logo in the navbar

### Quickstart (Newsflash)
```bash
cp .env.example .env
# Set FLASK_SECRET_KEY and DATABASE_URL

python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python init_db.py
python init_db.py --create-user --email user@example.com --keyword secretword123
flask --app app run --debug
```

### Deployment (Render)
- Build: `pip install -r requirements.txt`
- Start: `gunicorn app:app --workers 3 --threads 2 --bind 0.0.0.0:$PORT --timeout 120`
- Env: `DATABASE_URL`, `FLASK_SECRET_KEY`

---

## 2. Labyrinth Game (`games/01/`)

A browser-based maze game where players navigate a red square through increasingly difficult labyrinths while avoiding monsters.

### Features
- **Level progression**: Monster count increases each level (Level × 3 monsters)
- **Coin rewards**: Earn coins per level (Level × 10 coins)
- **Safe houses**: Temporary refuge with time limits
- **User accounts**: JWT authentication with progress tracking
- **Leaderboard**: Top 10 players by highest level and coins
- **Mobile support**: Touch joystick controls
- **Guest mode**: Play without account (progress not saved)

### Tech Stack
- Node.js + Express.js
- SQLite (via sql.js)
- bcryptjs + JWT authentication
- Vanilla JavaScript frontend

### Quickstart (Labyrinth Game)
```bash
cd games/01
npm install
npm start
```
Server runs at: `http://localhost:3000`

### Game Controls
- **Desktop**: Arrow keys
- **Mobile**: Touch joystick (bottom-left corner)

### API Endpoints
- `POST /api/register` - Create account
- `POST /api/login` - Login, receive JWT
- `GET /api/user/profile` - Get user data (auth required)
- `PUT /api/user/progress` - Save progress (auth required)
- `GET /api/leaderboard` - Top 10 players
