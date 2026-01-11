"""
Migration script to convert game_users.id from INTEGER to UUID.
Also recreates game_user_avatars table with proper UUID foreign key.

Run this on Render shell:
    python migrate_game_users_to_uuid.py

WARNING: This will preserve user data but reset avatar ownership.
"""
import uuid
from sqlalchemy import create_engine, text, inspect
from config import Config

def main():
    engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
    inspector = inspect(engine)

    # Check if game_users table exists
    if 'game_users' not in inspector.get_table_names():
        print("game_users table does not exist. Nothing to migrate.")
        return

    # Check current id column type
    columns = {col['name']: col for col in inspector.get_columns('game_users')}
    id_col = columns.get('id')

    if id_col is None:
        print("No 'id' column found in game_users table.")
        return

    id_type = str(id_col['type']).upper()
    print(f"Current game_users.id type: {id_type}")

    if 'UUID' in id_type:
        print("game_users.id is already UUID. No migration needed.")
        return

    print("\n" + "="*60)
    print("MIGRATING game_users.id from INTEGER to UUID")
    print("="*60)

    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()

        try:
            # Step 1: Backup existing users
            print("\n1. Backing up existing users...")
            users = conn.execute(text("""
                SELECT id, name, username, password, coins, highest_level,
                       highest_level_at, avatars, selected_avatar, created_at,
                       last_update, active, status
                FROM game_users
            """)).fetchall()
            print(f"   Found {len(users)} users to migrate")

            # Step 2: Drop game_user_avatars table (has FK to game_users)
            print("\n2. Dropping game_user_avatars table...")
            conn.execute(text("DROP TABLE IF EXISTS game_user_avatars CASCADE"))

            # Step 3: Drop game_users table
            print("\n3. Dropping old game_users table...")
            conn.execute(text("DROP TABLE IF EXISTS game_users CASCADE"))

            # Step 4: Create new game_users table with UUID
            print("\n4. Creating new game_users table with UUID...")
            conn.execute(text("""
                CREATE TABLE game_users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    coins INTEGER DEFAULT 0,
                    highest_level INTEGER DEFAULT 1,
                    highest_level_at TIMESTAMP,
                    avatars INTEGER DEFAULT 0,
                    selected_avatar VARCHAR(100) DEFAULT 'avatar-default',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    active BOOLEAN DEFAULT TRUE,
                    status VARCHAR(100)
                )
            """))

            # Step 5: Restore users with new UUIDs
            print("\n5. Restoring users with new UUIDs...")
            for user in users:
                new_uuid = uuid.uuid4()
                conn.execute(text("""
                    INSERT INTO game_users (id, name, username, password, coins, highest_level,
                                           highest_level_at, avatars, selected_avatar, created_at,
                                           last_update, active, status)
                    VALUES (:id, :name, :username, :password, :coins, :highest_level,
                            :highest_level_at, :avatars, :selected_avatar, :created_at,
                            :last_update, :active, :status)
                """), {
                    'id': str(new_uuid),
                    'name': user[1],
                    'username': user[2],
                    'password': user[3],
                    'coins': user[4] or 0,
                    'highest_level': user[5] or 1,
                    'highest_level_at': user[6],
                    'avatars': user[7] or 0,
                    'selected_avatar': user[8] or 'avatar-default',
                    'created_at': user[9],
                    'last_update': user[10],
                    'active': user[11] if user[11] is not None else True,
                    'status': user[12]
                })
                print(f"   Migrated: {user[2]} (old id: {user[0]} -> new uuid: {new_uuid})")

            # Step 6: Create game_user_avatars table
            print("\n6. Creating game_user_avatars table...")
            conn.execute(text("""
                CREATE TABLE game_user_avatars (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID NOT NULL REFERENCES game_users(id) ON DELETE CASCADE,
                    avatar_id VARCHAR(100) NOT NULL,
                    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    active BOOLEAN DEFAULT TRUE,
                    status VARCHAR(100)
                )
            """))

            trans.commit()
            print("\n" + "="*60)
            print("Migration completed successfully!")
            print(f"Migrated {len(users)} users to UUID format.")
            print("Note: Avatar ownership has been reset (users can re-purchase).")
            print("="*60)

        except Exception as e:
            trans.rollback()
            print(f"\nERROR: Migration failed - {e}")
            print("Transaction rolled back. No changes made.")
            raise

if __name__ == "__main__":
    main()
