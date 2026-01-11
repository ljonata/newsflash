"""
Reset and repopulate avatars table on production.
This clears all avatars and repopulates from scratch.

Run on Render shell:
    python reset_avatars.py
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from config import Config
from models import Base, Avatar

def main():
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)

    print("="*60)
    print("RESETTING AVATARS TABLE")
    print("="*60)

    with Session(engine) as session:
        # Clear existing avatars
        print("\n1. Clearing existing avatars...")
        deleted = session.query(Avatar).delete()
        session.commit()
        print(f"   Deleted {deleted} avatar records")

    # Recreate table structure
    print("\n2. Ensuring table structure is correct...")
    Base.metadata.create_all(engine)
    print("   Done")

    # Now run populate script
    print("\n3. Populating avatars from image files...")
    import populate_avatars_from_images
    populate_avatars_from_images.main()

    print("\n" + "="*60)
    print("Avatar reset complete!")
    print("="*60)

if __name__ == "__main__":
    main()
