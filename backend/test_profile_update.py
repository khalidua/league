#!/usr/bin/env python3
"""
Test script to verify profile picture update works with database
"""

import requests
import json

def test_profile_update():
    """Test updating user profile with new image URL"""
    
    # Test data
    test_update = {
        "profileimage": "https://example.com/test-image.jpg"
    }
    
    # You'll need to replace this with a valid token
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_TOKEN_HERE"
    }
    
    try:
        response = requests.patch(
            "http://localhost:8000/auth/me",
            json=test_update,
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ Profile update successful!")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Profile update failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during profile update: {e}")
        return False

def test_database_connection():
    """Test if we can connect to the database and update user records"""
    from sqlalchemy.orm import Session
    from backend.database import SessionLocal
    from backend import models
    
    db: Session = SessionLocal()
    
    try:
        # Find a test user
        user = db.query(models.User).first()
        
        if not user:
            print("❌ No users found in database")
            return False
            
        print(f"✅ Found user: {user.email} (ID: {user.userid})")
        print(f"Current profileimage: {user.profileimage}")
        
        # Test updating profileimage
        original_image = user.profileimage
        user.profileimage = "https://example.com/test-update.jpg"
        db.commit()
        db.refresh(user)
        
        print(f"✅ Updated profileimage to: {user.profileimage}")
        
        # Restore original value
        user.profileimage = original_image
        db.commit()
        
        print("✅ Restored original profileimage")
        return True
        
    except Exception as e:
        print(f"❌ Error testing database: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🧪 Testing Profile Update Database Connection...")
    
    print("\n🔍 Testing database connection...")
    test_database_connection()
    
    print("\n🔍 Testing API endpoint...")
    print("Note: You need to replace 'YOUR_TOKEN_HERE' with a valid token")
    # test_profile_update()
    
    print("\n✅ Test completed!")
