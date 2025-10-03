from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required
from werkzeug.security import check_password_hash, generate_password_hash
from sqlalchemy.orm import Session
from models import User

bp = Blueprint("auth", __name__)

def get_session(db):
    return Session(db)

@bp.route("/login", methods=["GET", "POST"])
def login():
    from app import db_engine, login_manager
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        with get_session(db_engine) as session:
            user = session.query(User).filter(User.email == email).one_or_none()
            if user and check_password_hash(user.password_hash, password):
                login_user(user)
                return redirect(url_for("dashboard"))
        flash("Invalid credentials", "error")
    return render_template("login.html")

@bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth.login"))

@bp.route("/register", methods=["GET", "POST"])
def register():
    from app import db_engine
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        if not email or not password:
            flash("Email and password are required.", "error")
            return render_template("register.html")
        with get_session(db_engine) as session:
            exists = session.query(User).filter(User.email == email).first()
            if exists:
                flash("User already exists.", "error")
                return render_template("register.html")
            user = User(email=email, password_hash=generate_password_hash(password))
            session.add(user)
            session.commit()
        flash("Account created. Please log in.", "success")
        return redirect(url_for("auth.login"))
    return render_template("register.html")
