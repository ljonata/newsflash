from flask import Flask, render_template, redirect, url_for, request, flash, session, g, jsonify, send_from_directory
from sqlalchemy import create_engine, select, text, inspect
from sqlalchemy.orm import Session
import datetime
import os
from functools import wraps
import jwt
import bcrypt
from models import Base, User, FormA, FormB, FormC, FormD, GameUser
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# JWT secret for game authentication
GAME_JWT_SECRET = os.getenv('GAME_JWT_SECRET', 'labyrinth-game-secret-key-change-in-production')

db_engine = create_engine(app.config["SQLALCHEMY_DATABASE_URI"], pool_pre_ping=True)

# Create all tables on startup (safe to run multiple times - only creates if not exists)
Base.metadata.create_all(db_engine)

# Migration: Add missing columns to game_users table
def migrate_game_users_table():
    inspector = inspect(db_engine)
    if 'game_users' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('game_users')]

        with db_engine.connect() as conn:
            # Add highest_level_at column if missing
            if 'highest_level_at' not in columns:
                try:
                    conn.execute(text('ALTER TABLE game_users ADD COLUMN highest_level_at TIMESTAMP'))
                    conn.commit()
                    print("Added highest_level_at column to game_users")
                except Exception as e:
                    print(f"Could not add highest_level_at column: {e}")

            # Add avatars column if missing
            if 'avatars' not in columns:
                try:
                    conn.execute(text('ALTER TABLE game_users ADD COLUMN avatars INTEGER DEFAULT 0'))
                    conn.commit()
                    print("Added avatars column to game_users")
                except Exception as e:
                    print(f"Could not add avatars column: {e}")

migrate_game_users_table()

# Helper function to get user from keyword
def get_user_by_keyword(keyword):
    with Session(db_engine) as db_session:
        user = db_session.query(User).filter(User.keyword == keyword).one_or_none()
        if user:
            # Return a detached copy with only the needed attributes
            return type('obj', (object,), {'id': user.id, 'email': user.email, 'keyword': user.keyword})()
    return None

# Decorator to require keyword authentication
def keyword_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        keyword = request.args.get('key', '').strip()
        if not keyword:
            return render_template("invalid_key.html")

        user = get_user_by_keyword(keyword)
        if not user:
            return render_template("invalid_key.html")

        # Store user in g for access in route handlers
        g.current_user = user
        g.keyword = keyword
        return f(*args, **kwargs)
    return decorated_function

@app.route("/")
def home():
    keyword = request.args.get('key', '').strip()
    if not keyword:
        return render_template("invalid_key.html")

    user = get_user_by_keyword(keyword)
    if not user:
        return render_template("invalid_key.html")

    # Redirect to dashboard with keyword
    return redirect(url_for("dashboard", key=keyword))

@app.route("/dashboard")
@keyword_required
def dashboard():
    return render_template("dashboard.html", user=g.current_user, keyword=g.keyword)

# ---- Form A ----
@app.route("/form/a", methods=["GET", "POST"])
@keyword_required
def form_a():
    if request.method == "POST":
        about = request.form.get("about", "").strip()
        headline = request.form.get("headline", "").strip()
        lede = request.form.get("lede", "").strip()
        nut_graf = request.form.get("nut_graf", "").strip()
        body = request.form.get("body", "").strip()
        conclusion = request.form.get("conclusion", "").strip()
        organizations = request.form.get("organizations", "").strip()
        persons = request.form.get("persons", "").strip()

        if not about:
            flash("About is required.", "error")
            return render_template("form_a.html", keyword=g.keyword)

        with Session(db_engine) as db_session:
            record = FormA(
                user_id=g.current_user.id,
                about=about,
                headline=headline,
                lede=lede,
                nut_graf=nut_graf,
                body=body,
                conclusion=conclusion,
                organizations=organizations,
                persons=persons
            )
            db_session.add(record)
            db_session.commit()
        flash("Form A submitted.", "success")
        return redirect(url_for("dashboard", key=g.keyword))
    return render_template("form_a.html", keyword=g.keyword)

# ---- Form B ----
@app.route("/form/b", methods=["GET", "POST"])
@keyword_required
def form_b():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        summary = request.form.get("summary", "").strip()
        comment = request.form.get("comment", "").strip()
        if not name:
            flash("Name is required.", "error")
            return render_template("form_b.html", keyword=g.keyword)
        with Session(db_engine) as db_session:
            record = FormB(user_id=g.current_user.id, name=name, summary=summary, comment=comment)
            db_session.add(record)
            db_session.commit()
        flash("Form B submitted.", "success")
        return redirect(url_for("dashboard", key=g.keyword))
    return render_template("form_b.html", keyword=g.keyword)

# ---- Form C ----
@app.route("/form/c", methods=["GET", "POST"])
@keyword_required
def form_c():
    if request.method == "POST":
        subject = request.form.get("subject", "").strip()
        details = request.form.get("details", "").strip()
        extra = request.form.get("extra", "").strip()
        if not subject:
            flash("Subject is required.", "error")
            return render_template("form_c.html", keyword=g.keyword)
        with Session(db_engine) as db_session:
            record = FormC(user_id=g.current_user.id, subject=subject, details=details, extra=extra)
            db_session.add(record)
            db_session.commit()
        flash("Form C submitted.", "success")
        return redirect(url_for("dashboard", key=g.keyword))
    return render_template("form_c.html", keyword=g.keyword)

# ---- Button D: Records Table ----
@app.route("/form/d", methods=["GET"])
@keyword_required
def form_d():
    records = []
    with Session(db_engine) as db_session:
        for rec in db_session.query(FormA).filter(FormA.user_id == g.current_user.id).all():
            records.append({
                "type": "Form A",
                "uuid": str(rec.id),
                "headline": rec.headline or rec.about[:50],
                "author": rec.author or "N/A",
                "created_at": rec.created_at
            })
    records.sort(key=lambda r: r["created_at"] or datetime.datetime.min, reverse=True)
    return render_template("form_d.html", records=records, keyword=g.keyword)

# ---- Form D Detail View ----
@app.route("/form/d/<uuid:record_id>", methods=["GET"])
@keyword_required
def form_d_detail(record_id):
    with Session(db_engine) as db_session:
        record = db_session.query(FormA).filter(FormA.id == record_id, FormA.user_id == g.current_user.id).one_or_none()
        if not record:
            flash("Record not found.", "error")
            return redirect(url_for("form_d", key=g.keyword))
    return render_template("form_d_detail.html", record=record, keyword=g.keyword)

# ============================================
# LABYRINTH GAME ROUTES
# ============================================

# Serve game static files
GAME_DIR = os.path.join(os.path.dirname(__file__), 'games', '01')
GAME_IMG_DIR = os.path.join(os.path.dirname(__file__), 'games', 'img')

@app.route('/games/img/<path:filename>')
def serve_game_images(filename):
    return send_from_directory(GAME_IMG_DIR, filename)

@app.route('/games/01/')
@app.route('/games/01/<path:filename>')
def serve_game(filename='login.html'):
    return send_from_directory(GAME_DIR, filename)

# Game JWT authentication decorator
def game_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Access token required'}), 401

        try:
            data = jwt.decode(token, GAME_JWT_SECRET, algorithms=['HS256'])
            g.game_user_id = data['id']
            g.game_username = data['username']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 403
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 403

        return f(*args, **kwargs)
    return decorated

# Game API: Register
@app.route('/games/01/api/register', methods=['POST'])
def game_register():
    data = request.get_json()

    name = data.get('name', '').strip()
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not name or not username or not password:
        return jsonify({'error': 'Name, username, and password are required'}), 400

    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400

    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400

    with Session(db_engine) as db_session:
        # Check if username exists
        existing = db_session.query(GameUser).filter(GameUser.username == username).first()
        if existing:
            return jsonify({'error': 'Username already taken'}), 400

        # Hash password
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Create user
        user = GameUser(
            name=name,
            username=username,
            password=hashed.decode('utf-8'),
            coins=0,
            highest_level=1
        )
        db_session.add(user)
        db_session.commit()

        return jsonify({'message': 'User registered successfully', 'userId': user.id}), 201

# Game API: Login
@app.route('/games/01/api/login', methods=['POST'])
def game_login():
    data = request.get_json()

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    with Session(db_engine) as db_session:
        user = db_session.query(GameUser).filter(GameUser.username == username).first()

        if not user:
            return jsonify({'error': 'Invalid username or password'}), 401

        if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
            return jsonify({'error': 'Invalid username or password'}), 401

        # Generate JWT token (7 days expiry)
        token = jwt.encode({
            'id': user.id,
            'username': user.username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, GAME_JWT_SECRET, algorithm='HS256')

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user.id,
                'name': user.name,
                'username': user.username,
                'coins': user.coins,
                'highest_level': user.highest_level
            }
        })

# Game API: Get Profile
@app.route('/games/01/api/user/profile', methods=['GET'])
@game_token_required
def game_profile():
    with Session(db_engine) as db_session:
        user = db_session.query(GameUser).filter(GameUser.id == g.game_user_id).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'user': {
                'id': user.id,
                'name': user.name,
                'username': user.username,
                'coins': user.coins,
                'highest_level': user.highest_level,
                'highest_level_at': user.highest_level_at.isoformat() if user.highest_level_at else None
            }
        })

# Game API: Update Coins
@app.route('/games/01/api/user/coins', methods=['PUT'])
@game_token_required
def game_update_coins():
    data = request.get_json()
    coins = data.get('coins')

    if not isinstance(coins, int) or coins < 0:
        return jsonify({'error': 'Invalid coins value'}), 400

    with Session(db_engine) as db_session:
        user = db_session.query(GameUser).filter(GameUser.id == g.game_user_id).first()
        if user:
            user.coins = coins
            db_session.commit()

        return jsonify({'message': 'Coins updated', 'coins': coins})

# Game API: Change Password
@app.route('/games/01/api/user/password', methods=['PUT'])
@game_token_required
def game_change_password():
    data = request.get_json()
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not current_password or not new_password:
        return jsonify({'error': 'Current and new password are required'}), 400

    if len(new_password) < 4:
        return jsonify({'error': 'New password must be at least 4 characters'}), 400

    with Session(db_engine) as db_session:
        user = db_session.query(GameUser).filter(GameUser.id == g.game_user_id).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Verify current password
        if not bcrypt.checkpw(current_password.encode('utf-8'), user.password.encode('utf-8')):
            return jsonify({'error': 'Current password is incorrect'}), 401

        # Hash and save new password
        hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        user.password = hashed.decode('utf-8')
        db_session.commit()

        return jsonify({'message': 'Password updated successfully'})

# Game API: Update Progress
@app.route('/games/01/api/user/progress', methods=['PUT'])
@game_token_required
def game_update_progress():
    data = request.get_json()
    level = data.get('level', 1)
    coins = data.get('coins', 0)

    with Session(db_engine) as db_session:
        user = db_session.query(GameUser).filter(GameUser.id == g.game_user_id).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Update highest level and track when it was achieved
        if level > user.highest_level:
            user.highest_level = level
            user.highest_level_at = datetime.datetime.utcnow()
        user.coins = coins
        db_session.commit()

        return jsonify({
            'message': 'Progress saved',
            'coins': coins,
            'highest_level': user.highest_level
        })

# Game API: Leaderboard
@app.route('/games/01/api/leaderboard', methods=['GET'])
def game_leaderboard():
    with Session(db_engine) as db_session:
        # Ranking 1: Highest level achieved, tie-break by earliest date
        level_leaders = db_session.query(GameUser).order_by(
            GameUser.highest_level.desc(),
            GameUser.highest_level_at.asc()
        ).limit(15).all()

        level_ranking = [{
            'rank': i + 1,
            'name': u.name,
            'highest_level': u.highest_level,
            'achieved_at': u.highest_level_at.strftime('%Y-%m-%d') if u.highest_level_at else None
        } for i, u in enumerate(level_leaders)]

        # Ranking 2: Most avatars, tie-break by coins
        avatar_leaders = db_session.query(GameUser).order_by(
            GameUser.avatars.desc(),
            GameUser.coins.desc()
        ).limit(15).all()

        avatar_ranking = [{
            'rank': i + 1,
            'name': u.name,
            'avatars': u.avatars,
            'coins': u.coins
        } for i, u in enumerate(avatar_leaders)]

        return jsonify({
            'level_ranking': level_ranking,
            'avatar_ranking': avatar_ranking
        })


if __name__ == "__main__":
    Base.metadata.create_all(db_engine)
    app.run(debug=True)
