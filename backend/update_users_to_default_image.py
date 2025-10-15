#!/usr/bin/env python3
"""
Script to update existing users to have the default profile image from assets.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models

def update_users_to_default_image():
    """Update users who don't have the default profile image"""
    db = SessionLocal()
    
    try:
        print("🖼️ Updating users to default profile image...")
        
        # Find users without the default profile image
        users_to_update = db.query(models.User).filter(
            (models.User.profileimage.is_(None)) | 
            (models.User.profileimage == "") |
            (models.User.profileimage != "https://res.cloudinary.com/dns6zhmc2/image/upload/v1760475598/defaultPlayer_vnbpfb.png")
        ).all()
        
        default_image_path = "https://res.cloudinary.com/dns6zhmc2/image/upload/v1760475598/defaultPlayer_vnbpfb.png"
        
        updated_count = 0
        for user in users_to_update:
            user.profileimage = default_image_path
            updated_count += 1
        
        db.commit()
        print(f"✅ Updated {updated_count} users with default profile image")
        
        # Show summary
        total_users = db.query(models.User).count()
        users_with_default = db.query(models.User).filter(
            models.User.profileimage == "https://res.cloudinary.com/dns6zhmc2/image/upload/v1760475598/defaultPlayer_vnbpfb.png"
        ).count()
        
        print(f"\n📊 Profile Image Summary:")
        print(f"- Total users: {total_users}")
        print(f"- Users with default image: {users_with_default}")
        print(f"- Users with custom images: {total_users - users_with_default}")
        
    except Exception as e:
        print(f"❌ Error updating profile images: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_users_to_default_image()
