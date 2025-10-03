# Flask + PostgreSQL Starter

A simple login-protected Flask app with a 2×2 dashboard and four forms.
Submissions are saved to PostgreSQL via SQLAlchemy.

## Features
- User login/logout (Flask-Login)
- 2×2 "big button" dashboard after login
- Four forms (A, B, C, D) with a few text fields each
- Data persisted in PostgreSQL
- Simple styling, Jinja templates

## Quickstart

1. **Create and fill your `.env`**

   ```bash
   cp .env.example .env
   # edit .env: FLASK_SECRET_KEY and DATABASE_URL
   ```

   Example `DATABASE_URL` for local Postgres:
   `postgresql+psycopg2://postgres:postgres@localhost:5432/flask_app`

2. **Create the database (once)**
   - Create a PostgreSQL database named `flask_app` (or use any name, update `.env`).
   - Example using psql:
     ```sql
     CREATE DATABASE flask_app;
     ```

3. **Install dependencies** (recommend a virtualenv):
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Initialize tables and create an admin user:**
   ```bash
   python init_db.py --create-admin --email admin@example.com --password admin123
   ```

5. **Run the app:**
   ```bash
   flask --app app run --debug
   ```

6. **Log in:**
   - Email: the email you created (e.g., `admin@example.com`)
   - Password: the password you set (e.g., `admin123`)

## Project Structure

```
flask_postgres_dashboard/
├── app.py
├── auth.py
├── config.py
├── models.py
├── init_db.py
├── requirements.txt
├── .env.example
├── templates/
│   ├── base.html
│   ├── login.html
│   ├── dashboard.html
│   ├── form_a.html
│   ├── form_b.html
│   ├── form_c.html
│   └── form_d.html
└── static/
    └── css/
        └── style.css
```

## Notes
- This is a minimal, production-ready *starting point*. For production you may want to add: gunicorn, reverse proxy, HTTPS, stricter session config, CSRF protection, and rate limiting.
