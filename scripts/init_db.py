import argparse
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from config import Config
from models import Base, User

def main():
    parser = argparse.ArgumentParser(description="Initialize database and create user.")
    parser.add_argument("--create-user", action="store_true", help="Create a user")
    parser.add_argument("--email", type=str, default="user@example.com")
    parser.add_argument("--keyword", type=str, required=False, help="Unique keyword for user access")
    args = parser.parse_args()

    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
    Base.metadata.create_all(engine)
    print("Database tables created successfully.")

    if args.create_user:
        if not args.keyword:
            print("Error: --keyword is required when creating a user")
            return

        with Session(engine) as session:
            # Check if email exists
            exists = session.query(User).filter(User.email == args.email.lower()).one_or_none()
            if exists:
                print(f"User with email {args.email} already exists.")
                return

            # Check if keyword exists
            keyword_exists = session.query(User).filter(User.keyword == args.keyword).one_or_none()
            if keyword_exists:
                print(f"Keyword '{args.keyword}' is already in use.")
                return

            user = User(email=args.email.lower(), keyword=args.keyword)
            session.add(user)
            session.commit()
            print(f"Created user {args.email} with keyword '{args.keyword}'")

if __name__ == "__main__":
    main()
