# Flask + PostgreSQL Starter (v3)

- Minimalist gray/white UI
- **Square, smaller 2×2 buttons**
- Forms A/B/C submit to PostgreSQL
- **Button D shows a combined table** of all records (A, B, C, D)
- Includes a **square logo** in the navbar

## Quickstart
```bash
cp .env.example .env
# Set FLASK_SECRET_KEY and DATABASE_URL

python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python init_db.py --create-admin --email admin@example.com --password admin123
flask --app app run --debug
```

## Render
- Build: `pip install -r requirements.txt`
- Start: `gunicorn app:app --workers 3 --threads 2 --bind 0.0.0.0:$PORT --timeout 120`
- Env: `DATABASE_URL`, `FLASK_SECRET_KEY`
