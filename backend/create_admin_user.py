#!/usr/bin/env python3
"""
Script to create admin and organizer users for testing purposes.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models
from backend.auth import get_password_hash

def create_admin_users():
    """Create admin and organizer users for testing"""
    db = SessionLocal()
    
    try:
        print("👤 Creating admin and organizer users...")
        
        # Create admin user
        admin_email = "admin@zcleague.com"
        existing_admin = db.query(models.User).filter(models.User.email == admin_email).first()
        
        if not existing_admin:
            admin_user = models.User(
                email=admin_email,
                passwordhash=get_password_hash("admin123"),
                firstname="Admin",
                lastname="User",
                role="Admin",
                status="active",
                profileimage="https://res.cloudinary.com/dns6zhmc2/image/upload/v1760475598/defaultPlayer_vnbpfb.png"
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            # Create admin record
            admin_record = models.Admin(
                userid=admin_user.userid,
                permissionslevel="Full"
            )
            db.add(admin_record)
            print(f"✅ Created admin user: {admin_email}")
        else:
            print(f"ℹ️ Admin user already exists: {admin_email}")
        
        # Create organizer user
        organizer_email = "organizer@zcleague.com"
        existing_organizer = db.query(models.User).filter(models.User.email == organizer_email).first()
        
        if not existing_organizer:
            organizer_user = models.User(
                email=organizer_email,
                passwordhash=get_password_hash("organizer123"),
                firstname="Tournament",
                lastname="Organizer",
                role="Organizer",
                status="active",
                profileimage="https://res.cloudinary.com/dns6zhmc2/image/upload/v1760475598/defaultPlayer_vnbpfb.png"
            )
            db.add(organizer_user)
            print(f"✅ Created organizer user: {organizer_email}")
        else:
            print(f"ℹ️ Organizer user already exists: {organizer_email}")
        
        db.commit()
        print("\n🎉 Admin user creation completed!")
        print("\nLogin credentials:")
        print(f"Admin: {admin_email} / admin123")
        print(f"Organizer: {organizer_email} / organizer123")
        
    except Exception as e:
        print(f"❌ Error creating admin users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_users()