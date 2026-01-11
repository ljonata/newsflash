"""
Initialize avatars table with default avatars.

Run from repo root:
    python scripts/init_avatars.py
"""
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from config import Config
from models import Avatar

def main():
    """Add default avatars to the database."""
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)

    # Default avatars with their metadata
    # Note: All avatars in /public folder are public by default
    # Avatars in /users folder can be public or private based on is_public flag
    default_avatars = [
        {
            'avatar_id': 'avatar-default',
            'name': 'Default Avatar',
            'price': 0,
            'creator_name': 'System',
            'image_path': 'games/img/avatars/public/avatar-default.png',
            'is_public': True,
            'status': 'active'
        },
        {
            'avatar_id': 'erik-green',
            'name': 'Green Erik',
            'price': 50,
            'creator_name': None,
            'image_path': 'games/img/avatars/public/erik-green.png',
            'is_public': True,
            'status': 'active'
        },
        {
            'avatar_id': 'erik-smart',
            'name': 'Smart Erik',
            'price': 100,
            'creator_name': None,
            'image_path': 'games/img/avatars/public/erik-smart.png',
            'is_public': True,
            'status': 'active'
        },
        {
            'avatar_id': 'erik-rocknroll',
            'name': 'Rock n Roll Erik',
            'price': 150,
            'creator_name': None,
            'image_path': 'games/img/avatars/public/erik-rocknroll.png',
            'is_public': True,
            'status': 'active'
        },
        {
            'avatar_id': 'erik-kidhappyman',
            'name': 'Happy Kid Erik',
            'price': 200,
            'creator_name': None,
            'image_path': 'games/img/avatars/public/erik-kidhappyman.png',
            'is_public': True,
            'status': 'active'
        },
        {
            'avatar_id': 'erik-fartman',
            'name': 'Fart Man Erik',
            'price': 250,
            'creator_name': None,
            'image_path': 'games/img/avatars/public/erik-fartman.png',
            'is_public': True,
            'status': 'active'
        },
        {
            'avatar_id': 'erik-monsterkey',
            'name': 'Monster Key Erik',
            'price': 300,
            'creator_name': None,
            'image_path': 'games/img/avatars/public/erik-monsterkey.png',
            'is_public': True,
            'status': 'active'
        },
        {
            'avatar_id': 'erik-sickman',
            'name': 'Sick Man Erik',
            'price': 350,
            'creator_name': None,
            'image_path': 'games/img/avatars/public/erik-sickman.png',
            'is_public': True,
            'status': 'active'
        },
        {
            'avatar_id': 'erik-richman',
            'name': 'Rich Man Erik',
            'price': 500,
            'creator_name': None,
            'image_path': 'games/img/avatars/public/erik-richman.png',
            'is_public': True,
            'status': 'active'
        }
    ]

    with Session(engine) as session:
        # Check and add each avatar
        for avatar_data in default_avatars:
            existing = session.query(Avatar).filter(
                Avatar.avatar_id == avatar_data['avatar_id']
            ).first()

            if existing:
                print(f"Avatar '{avatar_data['name']}' already exists, skipping...")
                continue

            avatar = Avatar(
                avatar_id=avatar_data['avatar_id'],
                name=avatar_data['name'],
                price=avatar_data['price'],
                creator_name=avatar_data['creator_name'],
                image_path=avatar_data['image_path'],
                is_public=avatar_data.get('is_public', True),
                number_of_users=0,
                active=True,
                status=avatar_data.get('status', 'active')
            )
            session.add(avatar)
            print(f"Added avatar: {avatar_data['name']}")

        session.commit()
        print("\nAvatar initialization complete!")

if __name__ == "__main__":
    main()
