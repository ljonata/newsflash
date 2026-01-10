"""Initialize avatars table with default avatars."""
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from config import Config
from models import Avatar

def main():
    """Add default avatars to the database."""
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)

    # Default avatars with their metadata
    default_avatars = [
        {
            'avatar_id': 'avatar-default',
            'name': 'Default Avatar',
            'price': 0,
            'creator_name': 'System',
            'image_path': 'img/avatars/public/avatar-default.png',
            'status': 'active'
        },
        {
            'avatar_id': 'erik-green',
            'name': 'Green Erik',
            'price': 50,
            'creator_name': None,
            'image_path': 'img/avatars/public/erik-green.png',
            'status': 'active'
        },
        {
            'avatar_id': 'erik-smart',
            'name': 'Smart Erik',
            'price': 100,
            'creator_name': None,
            'image_path': 'img/avatars/public/erik-smart.png',
            'status': 'active'
        },
        {
            'avatar_id': 'erik-rocknroll',
            'name': 'Rock n Roll Erik',
            'price': 150,
            'creator_name': None,
            'image_path': 'img/avatars/public/erik-rocknroll.png',
            'status': 'active'
        },
        {
            'avatar_id': 'erik-kidhappyman',
            'name': 'Happy Kid Erik',
            'price': 200,
            'creator_name': None,
            'image_path': 'img/avatars/public/erik-kidhappyman.png',
            'status': 'active'
        },
        {
            'avatar_id': 'erik-fartman',
            'name': 'Fart Man Erik',
            'price': 250,
            'creator_name': None,
            'image_path': 'img/avatars/public/erik-fartman.png',
            'status': 'active'
        },
        {
            'avatar_id': 'erik-monsterkey',
            'name': 'Monster Key Erik',
            'price': 300,
            'creator_name': None,
            'image_path': 'img/avatars/public/erik-monsterkey.png',
            'status': 'active'
        },
        {
            'avatar_id': 'erik-sickman',
            'name': 'Sick Man Erik',
            'price': 350,
            'creator_name': None,
            'image_path': 'img/avatars/public/erik-sickman.png',
            'status': 'active'
        },
        {
            'avatar_id': 'erik-richman',
            'name': 'Rich Man Erik',
            'price': 500,
            'creator_name': None,
            'image_path': 'img/avatars/public/erik-richman.png',
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
