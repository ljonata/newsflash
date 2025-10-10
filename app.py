from flask import Flask, render_template, redirect, url_for, request, flash, session, g
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
import datetime
from functools import wraps
from models import Base, User, FormA, FormB, FormC, FormD
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

db_engine = create_engine(app.config["SQLALCHEMY_DATABASE_URI"], pool_pre_ping=True)

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
        title = request.form.get("title", "").strip()
        description = request.form.get("description", "").strip()
        notes = request.form.get("notes", "").strip()
        if not title:
            flash("Title is required.", "error")
            return render_template("form_a.html", keyword=g.keyword)
        with Session(db_engine) as db_session:
            record = FormA(user_id=g.current_user.id, title=title, description=description, notes=notes)
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
            records.append({"type": "Form A", "text": rec.title, "created_at": rec.created_at, "id": f"A-{rec.id}"})
        for rec in db_session.query(FormB).filter(FormB.user_id == g.current_user.id).all():
            records.append({"type": "Form B", "text": rec.name, "created_at": rec.created_at, "id": f"B-{rec.id}"})
        for rec in db_session.query(FormC).filter(FormC.user_id == g.current_user.id).all():
            records.append({"type": "Form C", "text": rec.subject, "created_at": rec.created_at, "id": f"C-{rec.id}"})
        for rec in db_session.query(FormD).filter(FormD.user_id == g.current_user.id).all():
            records.append({"type": "Form D", "text": rec.heading, "created_at": rec.created_at, "id": f"D-{rec.id}"})
    records.sort(key=lambda r: r["created_at"] or datetime.datetime.min, reverse=True)
    return render_template("form_d.html", records=records, keyword=g.keyword)

if __name__ == "__main__":
    Base.metadata.create_all(db_engine)
    app.run(debug=True)
