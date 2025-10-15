#!/usr/bin/env python3
"""
Script to create the Goal table in the database.
Run this script to add the new Goal table for tracking individual goals.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from backend.config import settings
from backend.database import Base
from backend.models.goal import Goal

def create_goal_table():
    """Create the Goal table in the database"""
    try:
        # Create engine
        engine = create_engine(settings.database_url)
        
        # Create the Goal table
        Goal.__table__.create(engine, checkfirst=True)
        
        print("Goal table created successfully!")
        print("The Goal table includes:")
        print("   - goalid (Primary Key)")
        print("   - matchid (Foreign Key to Match)")
        print("   - playerid (Foreign Key to Player)")
        print("   - teamid (Foreign Key to Team)")
        print("   - minute (Goal minute)")
        print("   - isowngoal (0 = regular goal, 1 = own goal)")
        print("   - createdat (Timestamp)")
        
    except Exception as e:
        print(f"Error creating Goal table: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("Creating Goal table for ZC League...")
    success = create_goal_table()
    
    if success:
        print("\nGoal tracking system is now ready!")
        print("You can now:")
        print("   - Track individual goal scorers")
        print("   - Record goal minutes")
        print("   - Mark own goals")
        print("   - Update player statistics automatically")
    else:
        print("\nFailed to create Goal table. Please check the error above.")
        sys.exit(1)
