# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Flask web application with PostgreSQL backend that provides keyword-based authentication and four data collection forms (A, B, C, D). Users access the application via unique keyword URLs. Forms A-C allow users to submit different types of data, while Form D displays a combined table view of all submitted records across all forms.

## Development Setup

### Initial Setup
```bash
# Copy environment template and configure
cp .env.example .env
# Edit .env: Set FLASK_SECRET_KEY and DATABASE_URL

# Create virtual environment and install dependencies
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# Initialize database and create user with keyword
python init_db.py --create-user --email user@example.com --keyword secretword123
```

### Running the Application
```bash
# Development server (debug mode)
flask --app app run --debug

# Production server (Gunicorn)
gunicorn app:app --workers 3 --threads 2 --bind 0.0.0.0:8000 --timeout 120
```

### Database Management
```bash
# Initialize database tables (creates all tables defined in models.py)
python init_db.py

# Create user with keyword
python init_db.py --create-user --email <email> --keyword <unique_keyword>
```

## Architecture

### Application Structure
- **app.py**: Main Flask application with keyword-based authentication and route handlers for all forms and dashboard
- **models.py**: SQLAlchemy ORM models (User, FormA, FormB, FormC, FormD)
- **config.py**: Configuration loader (reads from environment variables)
- **init_db.py**: Database initialization script with user creation functionality

### Authentication Flow
- URL-based keyword authentication via `?key=keyword` parameter
- `get_user_by_keyword()` helper queries User table by keyword (app.py:15)
- `@keyword_required` decorator validates keyword and stores user in `g.current_user` (app.py:24)
- Invalid/missing keywords display "You were given the wrong link" message (invalid_key.html)
- No login/logout functionality - users access via unique keyword URLs

### Database Architecture
- Uses SQLAlchemy 2.0 with modern typed mappings (`Mapped[]`, `mapped_column()`)
- Session management via context managers (`with Session(db_engine)`)
- User model has unique `keyword` field instead of password_hash
- All form models have foreign key relationship to User model with cascade delete
- Each form model has: `id`, `user_id`, form-specific fields, `created_at`

### Form Data Flow
1. Forms A/B/C (app.py:60-114): POST handlers validate required fields, create records tied to current user, commit to database, redirect to dashboard with keyword parameter
2. Form D (app.py:117-131): GET handler that queries all four form tables filtered by current user, combines into unified list sorted by creation date (newest first), passes to template as `records` list
3. All navigation maintains keyword in URL via `?key=keyword` parameter

### Key Implementation Patterns
- Database sessions created per-request using context managers
- Flash messages for user feedback (success/error categories)
- All user inputs stripped of whitespace before processing
- Form submissions redirect to dashboard on success, re-render form on validation failure
- Keyword parameter passed through all route redirects and template links

## Deployment (Render.com)

Build Command: `pip install -r requirements.txt`

Start Command: `gunicorn app:app --workers 3 --threads 2 --bind 0.0.0.0:$PORT --timeout 120`

Required Environment Variables:
- `DATABASE_URL`: PostgreSQL connection string
- `FLASK_SECRET_KEY`: Secret key for session encryption

## Usage

Users access the application via: `https://yoursite.com/?key=theiruniquekey`

Each user is assigned a unique keyword. The URL with the keyword provides access to their personal dashboard and forms.
