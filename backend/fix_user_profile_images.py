#!/usr/bin/env python3
"""
Script to fix existing users who don't have profile images set.
This will set the default profile image for users where profileimage is None or empty.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend import models

def fix_user_profile_images():
    """Fix users who don't have profile images set"""
    db: Session = SessionLocal()
    
    try:
        # Find users with no profile image or empty profile image
        users_without_images = db.query(models.User).filter(
            (models.User.profileimage.is_(None)) | 
            (models.User.profileimage == "") |
            (models.User.profileimage == "null")
        ).all()
        
        print(f"Found {len(users_without_images)} users without profile images")
        
        if users_without_images:
            # Update each user with default profile image
            for user in users_without_images:
                user.profileimage = "/assets/defaultPlayer.png"
                print(f"Updated user {user.userid} ({user.email}) with default profile image")
            
            # Commit all changes
            db.commit()
            print(f"Successfully updated {len(users_without_images)} users with default profile images")
        else:
            print("No users need profile image updates")
            
    except Exception as e:
        print(f"Error fixing user profile images: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_user_profile_images()