"""
Scan avatar image folders and populate avatars table from image files.
This script will find all images in games/img/avatars and create database entries.
"""
import os
import re
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from config import Config
from models import Avatar

def generate_avatar_id(filename):
    """Generate avatar_id from filename (without extension)."""
    name_without_ext = Path(filename).stem
    # Replace spaces with hyphens and lowercase
    avatar_id = name_without_ext.replace(' ', '-').lower()
    # Remove special characters except hyphens
    avatar_id = re.sub(r'[^a-z0-9\-]', '', avatar_id)
    return avatar_id

def generate_display_name(filename):
    """Generate a nice display name from filename."""
    name_without_ext = Path(filename).stem
    # Replace hyphens and underscores with spaces
    name = name_without_ext.replace('-', ' ').replace('_', ' ')
    # Title case
    return name.title()

def assign_price(avatar_id, is_public):
    """Assign a price based on avatar type and whether it's public."""
    # Default avatar is free
    if 'default' in avatar_id:
        return 0

    # Erik series has specific prices
    if avatar_id.startswith('erik-'):
        erik_prices = {
            'erik-green': 50,
            'erik-smart': 100,
            'erik-rocknroll': 150,
            'erik-kidhappyman': 200,
            'erik-fartman': 250,
            'erik-monsterkey': 300,
            'erik-sickman': 350,
            'erik-richman': 500
        }
        return erik_prices.get(avatar_id, 100)

    # Public avatars: 50-300 coins
    if is_public:
        return 100

    # Private/user avatars: more expensive
    return 500

def main():
    """Scan avatar folders and populate database."""
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)

    # Base path for avatars
    base_path = Path('games/img/avatars')

    if not base_path.exists():
        print(f"Error: Avatar directory not found: {base_path}")
        return

    # Supported image extensions
    image_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}

    avatars_to_add = []

    # Scan public folder
    public_path = base_path / 'public'
    if public_path.exists():
        print(f"\nScanning public folder: {public_path}")
        for img_file in public_path.iterdir():
            if img_file.suffix.lower() in image_extensions:
                avatar_id = generate_avatar_id(img_file.name)
                display_name = generate_display_name(img_file.name)
                relative_path = f"games/img/avatars/public/{img_file.name}"
                price = assign_price(avatar_id, is_public=True)

                avatars_to_add.append({
                    'avatar_id': avatar_id,
                    'name': display_name,
                    'price': price,
                    'creator_name': None,
                    'image_path': relative_path,
                    'is_public': True
                })
                print(f"  Found: {img_file.name} -> {avatar_id} ({display_name}) - {price} coins")

    # Scan users folder
    users_path = base_path / 'users'
    if users_path.exists():
        print(f"\nScanning users folder: {users_path}")
        for img_file in users_path.iterdir():
            if img_file.suffix.lower() in image_extensions:
                avatar_id = generate_avatar_id(img_file.name)
                display_name = generate_display_name(img_file.name)
                relative_path = f"games/img/avatars/users/{img_file.name}"
                price = assign_price(avatar_id, is_public=False)

                # User avatars are private by default
                avatars_to_add.append({
                    'avatar_id': avatar_id,
                    'name': display_name,
                    'price': price,
                    'creator_name': 'User Upload',
                    'image_path': relative_path,
                    'is_public': False  # User avatars are private by default
                })
                print(f"  Found: {img_file.name} -> {avatar_id} ({display_name}) - {price} coins [PRIVATE]")

    # Add to database
    print(f"\n{'='*60}")
    print(f"Found {len(avatars_to_add)} avatar images total")
    print(f"{'='*60}\n")

    with Session(engine) as session:
        added_count = 0
        skipped_count = 0

        for avatar_data in avatars_to_add:
            # Check if already exists
            existing = session.query(Avatar).filter(
                Avatar.avatar_id == avatar_data['avatar_id']
            ).first()

            if existing:
                print(f"⊘ Skipped (already exists): {avatar_data['name']} ({avatar_data['avatar_id']})")
                skipped_count += 1
                continue

            # Create new avatar
            avatar = Avatar(
                avatar_id=avatar_data['avatar_id'],
                name=avatar_data['name'],
                price=avatar_data['price'],
                creator_name=avatar_data['creator_name'],
                image_path=avatar_data['image_path'],
                is_public=avatar_data['is_public'],
                number_of_users=0,
                active=True,
                status='active'
            )
            session.add(avatar)
            print(f"✓ Added: {avatar_data['name']} ({avatar_data['avatar_id']}) - {'PUBLIC' if avatar_data['is_public'] else 'PRIVATE'}")
            added_count += 1

        session.commit()

        print(f"\n{'='*60}")
        print(f"✅ Complete!")
        print(f"   Added: {added_count}")
        print(f"   Skipped: {skipped_count}")
        print(f"   Total: {len(avatars_to_add)}")
        print(f"{'='*60}")

if __name__ == "__main__":
    main()
