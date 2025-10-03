import argparse
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash
from config import Config
from models import Base, User

def main():
    parser = argparse.ArgumentParser(description="Initialize database and create admin user.")
    parser.add_argument("--create-admin", action="store_true", help="Create an admin user")
    parser.add_argument("--email", type=str, default="admin@example.com")
    parser.add_argument("--password", type=str, default="admin123")
    args = parser.parse_args()

    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
    Base.metadata.create_all(engine)

    if args.create_admin:
        with Session(engine) as session:
            exists = session.query(User).filter(User.email == args.email.lower()).one_or_none()
            if exists:
                print("User already exists.")
            else:
                user = User(email=args.email.lower(), password_hash=generate_password_hash(args.password))
                session.add(user)
                session.commit()
                print(f"Created admin user {args.email}")

if __name__ == "__main__":
    main()
