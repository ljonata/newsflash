import os
from dotenv import load_dotenv

load_dotenv()

def get_database_uri():
    """Get database URI with proper dialect for psycopg 3."""
    uri = os.getenv("DATABASE_URL", "sqlite:///local.db")
    # Render uses postgres:// but SQLAlchemy needs postgresql://
    if uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql+psycopg://", 1)
    # Handle postgresql:// without driver specified
    elif uri.startswith("postgresql://") and "+psycopg" not in uri:
        uri = uri.replace("postgresql://", "postgresql+psycopg://", 1)
    # Handle old psycopg2 dialect
    elif "+psycopg2" in uri:
        uri = uri.replace("+psycopg2", "+psycopg")
    return uri

class Config:
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-key-change-me")
    SQLALCHEMY_DATABASE_URI = get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_HTTPONLY = True
    # For production, consider setting SESSION_COOKIE_SECURE = True
