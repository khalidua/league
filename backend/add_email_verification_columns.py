#!/usr/bin/env python3
"""
Database migration script to add email verification columns to existing users.
Run this script after updating the User model to add the new columns.
"""

import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text

# Import settings directly
import os
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

# Get database URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://neondb_owner:npg_Sc04mylipBkR@ep-sweet-frog-ad9srzts-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
)

def add_email_verification_columns():
    """Add email verification columns to the users table"""
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as connection:
            # Check if columns already exist
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('is_email_verified', 'email_verification_token', 'email_verification_expires')
            """))
            
            existing_columns = [row[0] for row in result]
            
            # Add columns if they don't exist
            if 'is_email_verified' not in existing_columns:
                print("Adding is_email_verified column...")
                connection.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN is_email_verified BOOLEAN NOT NULL DEFAULT FALSE
                """))
                connection.commit()
                print("✓ Added is_email_verified column")
            else:
                print("✓ is_email_verified column already exists")
            
            if 'email_verification_token' not in existing_columns:
                print("Adding email_verification_token column...")
                connection.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN email_verification_token VARCHAR(255)
                """))
                connection.commit()
                print("✓ Added email_verification_token column")
            else:
                print("✓ email_verification_token column already exists")
            
            if 'email_verification_expires' not in existing_columns:
                print("Adding email_verification_expires column...")
                connection.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN email_verification_expires TIMESTAMP
                """))
                connection.commit()
                print("✓ Added email_verification_expires column")
            else:
                print("✓ email_verification_expires column already exists")
            
            # Update existing users to have verified emails (since they were created before verification was required)
            print("Updating existing users to have verified emails...")
            connection.execute(text("""
                UPDATE users 
                SET is_email_verified = TRUE 
                WHERE is_email_verified = FALSE
            """))
            connection.commit()
            
            # Count updated users
            result = connection.execute(text("SELECT COUNT(*) FROM users WHERE is_email_verified = TRUE"))
            verified_count = result.scalar()
            print(f"✓ Updated {verified_count} existing users to have verified emails")
            
        print("\n🎉 Email verification columns migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Starting email verification columns migration...")
    success = add_email_verification_columns()
    if success:
        print("Migration completed successfully!")
    else:
        print("Migration failed!")
        sys.exit(1)
