"""
Migration script to add new columns to game tables and create avatars table.

Run from repo root:
    python scripts/migrate_game_tables.py
"""
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text, inspect
from config import Config

def main():
    """Add missing columns to existing game tables and create avatars table."""
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
    inspector = inspect(engine)

    with engine.connect() as conn:
        # Check if game_users table exists
        if 'game_users' in inspector.get_table_names():
            print("Found game_users table, checking for missing columns...")

            # Get existing columns
            existing_columns = {col['name'] for col in inspector.get_columns('game_users')}

            # Add last_update column if missing
            if 'last_update' not in existing_columns:
                print("Adding last_update column to game_users...")
                conn.execute(text("""
                    ALTER TABLE game_users
                    ADD COLUMN last_update TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
                """))
                conn.commit()
                print("✓ Added last_update column")
            else:
                print("✓ last_update column already exists")

            # Add active column if missing
            if 'active' not in existing_columns:
                print("Adding active column to game_users...")
                conn.execute(text("""
                    ALTER TABLE game_users
                    ADD COLUMN active BOOLEAN DEFAULT TRUE
                """))
                conn.commit()
                print("✓ Added active column")
            else:
                print("✓ active column already exists")

            # Add status column if missing
            if 'status' not in existing_columns:
                print("Adding status column to game_users...")
                conn.execute(text("""
                    ALTER TABLE game_users
                    ADD COLUMN status VARCHAR(100)
                """))
                conn.commit()
                print("✓ Added status column")
            else:
                print("✓ status column already exists")

        # Check if game_user_avatars table exists
        if 'game_user_avatars' in inspector.get_table_names():
            print("\nFound game_user_avatars table, checking for missing columns...")

            existing_columns = {col['name'] for col in inspector.get_columns('game_user_avatars')}

            # Add last_update column if missing
            if 'last_update' not in existing_columns:
                print("Adding last_update column to game_user_avatars...")
                conn.execute(text("""
                    ALTER TABLE game_user_avatars
                    ADD COLUMN last_update TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC')
                """))
                conn.commit()
                print("✓ Added last_update column")
            else:
                print("✓ last_update column already exists")

            # Add active column if missing
            if 'active' not in existing_columns:
                print("Adding active column to game_user_avatars...")
                conn.execute(text("""
                    ALTER TABLE game_user_avatars
                    ADD COLUMN active BOOLEAN DEFAULT TRUE
                """))
                conn.commit()
                print("✓ Added active column")
            else:
                print("✓ active column already exists")

            # Add status column if missing
            if 'status' not in existing_columns:
                print("Adding status column to game_user_avatars...")
                conn.execute(text("""
                    ALTER TABLE game_user_avatars
                    ADD COLUMN status VARCHAR(100)
                """))
                conn.commit()
                print("✓ Added status column")
            else:
                print("✓ status column already exists")

        # Check if avatars table exists
        if 'avatars' not in inspector.get_table_names():
            print("\nCreating avatars table...")
            conn.execute(text("""
                CREATE TABLE avatars (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    avatar_id VARCHAR(100) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    price INTEGER NOT NULL DEFAULT 0,
                    creator_name VARCHAR(255),
                    image_path VARCHAR(500) NOT NULL,
                    is_public BOOLEAN DEFAULT TRUE,
                    number_of_users INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    last_update TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    active BOOLEAN DEFAULT TRUE,
                    status VARCHAR(100)
                )
            """))
            conn.commit()
            print("✓ Created avatars table")
        else:
            print("\n✓ avatars table already exists")

            # Check if is_public column exists in avatars table
            existing_columns = {col['name'] for col in inspector.get_columns('avatars')}
            if 'is_public' not in existing_columns:
                print("Adding is_public column to avatars...")
                conn.execute(text("""
                    ALTER TABLE avatars
                    ADD COLUMN is_public BOOLEAN DEFAULT TRUE
                """))
                conn.commit()
                print("✓ Added is_public column")
            else:
                print("✓ is_public column already exists")

    print("\n✅ Migration completed successfully!")
    print("\nNext steps:")
    print("1. Run: python init_avatars.py")
    print("   This will populate the avatars table with default avatars.")

if __name__ == "__main__":
    main()
