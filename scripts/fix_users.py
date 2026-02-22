"""
One-time script: Reset passwords for Mark/mark users and create test user.
Run: python scripts/fix_users.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from config import Config
from models import Base, GameUser

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)


def hash_password(plain):
    return bcrypt.hashpw(plain.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def main():
    with Session(engine) as session:
        # Update password for Mark and mark users
        updated = 0
        for username in ['Mark', 'mark']:
            user = session.query(GameUser).filter(GameUser.username == username).first()
            if user:
                user.password = hash_password('123456')
                updated += 1
                print(f"Updated password for '{username}' (id: {user.id})")
            else:
                print(f"User '{username}' not found — skipping")

        # Create test user (or update if exists)
        test_user = session.query(GameUser).filter(GameUser.username == 'test').first()
        if test_user:
            test_user.password = hash_password('test')
            print(f"User 'test' already exists — password reset")
        else:
            test_user = GameUser(
                name='Test',
                username='test',
                password=hash_password('test'),
                coins=0,
                highest_level=1
            )
            session.add(test_user)
            print(f"Created user 'test'")

        session.commit()
        print(f"\nDone. {updated} password(s) updated, test user ready.")


if __name__ == '__main__':
    main()
