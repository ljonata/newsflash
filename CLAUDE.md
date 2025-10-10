# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Newsflash** is a Flask web application with PostgreSQL/SQLite backend that provides keyword-based authentication and journalism-focused data collection forms. Users access the application via unique keyword URLs without traditional login/password. The application features a mobile-first, phone-optimized UI with image-based navigation buttons.

## Tech Stack

### Backend
- **Python 3.x**
- **Flask 3.0.3** - Web framework
- **SQLAlchemy 2.0.34** - ORM with typed mappings
- **Flask-Login 0.6.3** - User session management
- **psycopg2-binary 2.9.9** - PostgreSQL adapter
- **python-dotenv 1.0.1** - Environment variable management
- **Gunicorn 21.2.0** - Production WSGI server

### Frontend
- **Jinja2 Templates** - Server-side rendering
- **Custom CSS** - Mobile-first responsive design
- **Unsplash Images** - Background images for navigation buttons

### Database
- **PostgreSQL** (production) or **SQLite** (development)
- **UUID Primary Keys** - All tables use UUID instead of integer IDs
- **Automatic Timestamps** - `created_at` and `last_update` fields with auto-updates

## Development Setup

### Initial Setup
```bash
# Copy environment template and configure
cp .env.example .env
# Edit .env: Set FLASK_SECRET_KEY and DATABASE_URL

# For local development, use SQLite:
DATABASE_URL=sqlite:///local.db

# For production, use PostgreSQL:
DATABASE_URL=postgresql+psycopg2://username:password@host:port/database_name

# Create virtual environment and install dependencies
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# Initialize database and create user with keyword
python init_db.py
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
# Initialize all database tables
python init_db.py

# Create user with unique keyword
python init_db.py --create-user --email <email> --keyword <unique_keyword>
```

## File Structure

```
newsflash/
├── app.py                 # Main Flask application, routes, authentication
├── models.py              # SQLAlchemy ORM models (5 tables)
├── config.py              # Configuration from environment variables
├── init_db.py             # Database initialization script
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (not in git)
├── .env.example           # Environment template
├── CLAUDE.md              # This file
├── static/
│   ├── css/
│   │   └── style.css      # Mobile-first responsive styles
│   └── img/
│       ├── foot.png       # Logo image
│       └── logo.png       # Backup logo
└── templates/
    ├── base.html          # Base template with nav and layout
    ├── dashboard.html     # Main menu with 4 image buttons
    ├── form_a.html        # Form A input template
    ├── form_b.html        # Form B input template
    ├── form_c.html        # Form C input template
    ├── form_d.html        # Form D list view (table)
    ├── form_d_detail.html # Form D detail view (single record)
    └── invalid_key.html   # Error page for wrong/missing keywords
```

## Database Architecture

### Common Fields (All Tables)
Every table includes these fields:
- `id` (UUID, primary key) - Auto-generated unique identifier
- `user_id` (UUID, foreign key) - Links to users table
- `author` (String 255) - Author name/identifier
- `created_at` (DateTime) - Record creation timestamp
- `last_update` (DateTime) - Auto-updates on modification
- `active` (Boolean) - Active/inactive flag (default: True)
- `status` (String 100) - Status field (e.g., "draft", "published", "archived")

### Table: `users`
User accounts with keyword-based authentication.

**Fields:**
- `id` (UUID, PK)
- `email` (String 255, unique, required)
- `keyword` (String 255, unique, required) - URL access keyword
- `author` (String 255)
- `created_at` (DateTime)
- `last_update` (DateTime)
- `active` (Boolean)
- `status` (String 100)

### Table: `form_a`
Journalism article structure with full news story fields.

**Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `about` (String 200, **required**) - Story topic/subject
- `headline` (String 200) - Article headline
- `lede` (Text) - Opening paragraph
- `nut_graf` (Text) - Nut graf (essence of story)
- `body` (Text) - Main article body
- `conclusion` (Text) - Closing paragraph
- `organizations` (Text) - Organizations mentioned
- `persons` (Text) - People mentioned
- `author` (String 255)
- `created_at` (DateTime)
- `last_update` (DateTime)
- `active` (Boolean)
- `status` (String 100)

**Purpose:** Full journalism article submission with structured news story components.

### Table: `form_b`
Simple data entry form.

**Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `name` (String 200, **required**)
- `summary` (Text)
- `comment` (Text)
- `author` (String 255)
- `created_at` (DateTime)
- `last_update` (DateTime)
- `active` (Boolean)
- `status` (String 100)

**Purpose:** General-purpose data collection.

### Table: `form_c`
Subject-based data entry.

**Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `subject` (String 200, **required**)
- `details` (Text)
- `extra` (Text)
- `author` (String 255)
- `created_at` (DateTime)
- `last_update` (DateTime)
- `active` (Boolean)
- `status` (String 100)

**Purpose:** Topic-focused data collection.

### Table: `form_d`
Heading-based data entry.

**Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → users.id)
- `heading` (String 200, **required**)
- `body` (Text)
- `tag` (String 100)
- `author` (String 255)
- `created_at` (DateTime)
- `last_update` (DateTime)
- `active` (Boolean)
- `status` (String 100)

**Purpose:** Currently unused for data entry. The "Form D" route displays Form A records in a list/detail view.

## Application Structure

### Authentication System (app.py:15-39)
- **Keyword-based authentication** - No passwords, users access via `?key=keyword` URL parameter
- `get_user_by_keyword()` - Queries database for user by keyword
- `@keyword_required` decorator - Protects routes, validates keyword, stores user in `g.current_user`
- Invalid keywords show "You were given the wrong link" error page
- Keyword maintained throughout navigation automatically

**Access URL Format:** `https://yoursite.com/?key=secretword123`

### Routes

#### Public Routes
- `/` - Home route, validates keyword and redirects to dashboard

#### Protected Routes (require `?key=` parameter)
- `/dashboard` - Main menu with 4 image-based navigation buttons
- `/form/a` - Form A submission (GET: show form, POST: save data)
- `/form/b` - Form B submission (GET: show form, POST: save data)
- `/form/c` - Form C submission (GET: show form, POST: save data)
- `/form/d` - Form D list view (shows table of Form A records)
- `/form/d/<uuid>` - Form D detail view (shows all fields of single Form A record)

### Form Behavior

#### Form A (Journalism Article)
**Purpose:** Submit complete news articles with structured fields.

**Required:** About field (mandatory)

**Optional:** Headline, Lede, Nut graf, Body, Conclusion, Organizations, Persons

**Flow:**
1. User fills form → POST to `/form/a`
2. Validation: "About" field required
3. Success: Flash message, redirect to dashboard
4. Error: Flash message, re-render form

**Route:** app.py:60-93

#### Form B (General Data)
**Purpose:** Simple data collection.

**Required:** Name field

**Optional:** Summary, Comment

**Route:** app.py:96-108

#### Form C (Subject Data)
**Purpose:** Topic-focused entries.

**Required:** Subject field

**Optional:** Details, Extra

**Route:** app.py:111-131

#### Form D (Records View)
**Purpose:** Display and view Form A submissions.

**List View (`/form/d`):**
- Shows table with: UUID (truncated), Headline, Author, Created At
- Rows are clickable
- Sorted by creation date (newest first)

**Detail View (`/form/d/<uuid>`):**
- Shows all fields of selected Form A record
- Includes: About, Headline, Lede, Nut graf, Body, Conclusion, Organizations, Persons
- Shows metadata: Author, Status, Active, Created At, Last Update
- "Back to List" button to return

**Routes:** app.py:134-159

### UI/UX Design

**Mobile-First Philosophy:**
- Max container width: 600px
- Vertical button layout (no grid)
- Large touch-friendly buttons (3:1 aspect ratio)
- Optimized for phone screens

**Navigation Buttons:**
- Full-width rectangular buttons with 3:1 ratio
- Background images from Unsplash
- Semi-transparent overlay (70% opacity)
- White text with shadow for readability
- Smooth hover animations

**Color Scheme:**
- Background: Light gray (#f5f5f5)
- Cards: White (#ffffff)
- Text: Dark gray (#1f2937)
- Borders: Light gray (#e5e7eb)

**Typography:**
- System fonts for performance
- Responsive font sizing
- Mobile optimizations at 600px breakpoint

### Key Implementation Patterns
- Database sessions created per-request using context managers (`with Session()`)
- Flash messages for user feedback (success/error categories)
- All user inputs stripped of whitespace before processing
- Form submissions redirect to dashboard on success, re-render on validation failure
- Keyword parameter passed through all route redirects and template links
- UUID primary keys ensure unique, distributed identifiers
- `last_update` auto-updates via SQLAlchemy `onupdate` parameter

## Deployment (Render.com)

### Build Command
```bash
pip install -r requirements.txt
```

### Start Command
```bash
gunicorn app:app --workers 3 --threads 2 --bind 0.0.0.0:$PORT --timeout 120
```

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `FLASK_SECRET_KEY` - Secret key for session encryption (generate random string)

### Database Initialization on Render
After deployment, run via Render shell:
```bash
python init_db.py
python init_db.py --create-user --email admin@example.com --keyword yoursecretkey
```

## Usage

### Creating Users
Each user needs a unique keyword for access:
```bash
python init_db.py --create-user --email journalist@example.com --keyword newskey123
```

### Accessing the Application
Users visit: `https://newsflash.com/?key=newskey123`

### User Workflow
1. Access site with keyword URL
2. See dashboard with 4 action buttons (A, B, C, All Records)
3. Click button to access form or view records
4. Submit forms → redirected to dashboard
5. View records → click row for details → back to list

### Important Notes
- Keywords must be unique across all users
- No password reset or recovery (by design)
- All navigation maintains keyword in URL
- Invalid keywords show error message immediately
- Records are user-isolated (users only see their own data)
