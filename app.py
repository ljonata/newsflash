from flask import Flask, render_template, redirect, url_for, request, flash
from flask_login import LoginManager, login_required, current_user
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
import datetime
from models import Base, User, FormA, FormB, FormC, FormD
from config import Config
from auth import bp as auth_bp

app = Flask(__name__)
app.config.from_object(Config)

db_engine = create_engine(app.config["SQLALCHEMY_DATABASE_URI"], pool_pre_ping=True)

login_manager = LoginManager()
login_manager.login_view = "auth.login"
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    with Session(db_engine) as session:
        return session.get(User, int(user_id))

app.register_blueprint(auth_bp)

@app.route("/")
def home():
    return redirect(url_for("auth.login"))

@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html", user=current_user)

# ---- Form A ----
@app.route("/form/a", methods=["GET", "POST"])
@login_required
def form_a():
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        description = request.form.get("description", "").strip()
        notes = request.form.get("notes", "").strip()
        if not title:
            flash("Title is required.", "error")
            return render_template("form_a.html")
        with Session(db_engine) as session:
            record = FormA(user_id=current_user.id, title=title, description=description, notes=notes)
            session.add(record)
            session.commit()
        flash("Form A submitted.", "success")
        return redirect(url_for("dashboard"))
    return render_template("form_a.html")

# ---- Form B ----
@app.route("/form/b", methods=["GET", "POST"])
@login_required
def form_b():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        summary = request.form.get("summary", "").strip()
        comment = request.form.get("comment", "").strip()
        if not name:
            flash("Name is required.", "error")
            return render_template("form_b.html")
        with Session(db_engine) as session:
            record = FormB(user_id=current_user.id, name=name, summary=summary, comment=comment)
            session.add(record)
            session.commit()
        flash("Form B submitted.", "success")
        return redirect(url_for("dashboard"))
    return render_template("form_b.html")

# ---- Form C ----
@app.route("/form/c", methods=["GET", "POST"])
@login_required
def form_c():
    if request.method == "POST":
        subject = request.form.get("subject", "").strip()
        details = request.form.get("details", "").strip()
        extra = request.form.get("extra", "").strip()
        if not subject:
            flash("Subject is required.", "error")
            return render_template("form_c.html")
        with Session(db_engine) as session:
            record = FormC(user_id=current_user.id, subject=subject, details=details, extra=extra)
            session.add(record)
            session.commit()
        flash("Form C submitted.", "success")
        return redirect(url_for("dashboard"))
    return render_template("form_c.html")

# ---- Button D: Records Table ----
@app.route("/form/d", methods=["GET"])
@login_required
def form_d():
    records = []
    with Session(db_engine) as session:
        for rec in session.query(FormA).filter(FormA.user_id == current_user.id).all():
            records.append({"type": "Form A", "text": rec.title, "created_at": rec.created_at, "id": f"A-{rec.id}"})
        for rec in session.query(FormB).filter(FormB.user_id == current_user.id).all():
            records.append({"type": "Form B", "text": rec.name, "created_at": rec.created_at, "id": f"B-{rec.id}"})
        for rec in session.query(FormC).filter(FormC.user_id == current_user.id).all():
            records.append({"type": "Form C", "text": rec.subject, "created_at": rec.created_at, "id": f"C-{rec.id}"})
        for rec in session.query(FormD).filter(FormD.user_id == current_user.id).all():
            records.append({"type": "Form D", "text": rec.heading, "created_at": rec.created_at, "id": f"D-{rec.id}"})
    records.sort(key=lambda r: r["created_at"] or datetime.datetime.min, reverse=True)
    return render_template("form_d.html", records=records)

if __name__ == "__main__":
    Base.metadata.create_all(db_engine)
    app.run(debug=True)
