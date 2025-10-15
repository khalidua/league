from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class GoalBase(BaseModel):
    matchid: int
    playerid: int
    teamid: int
    minute: Optional[int] = None
    isowngoal: Optional[int] = 0

    class Config:
        from_attributes = True

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    minute: Optional[int] = None
    isowngoal: Optional[int] = None

class Goal(GoalBase):
    goalid: int
    createdat: datetime

class GoalWithPlayer(Goal):
    player_name: Optional[str] = None
    team_name: Optional[str] = None
