from typing import Optional, List
from pydantic import BaseModel

class GoalScorer(BaseModel):
	playerid: int
	player_name: Optional[str] = None
	minute: Optional[int] = None
	isowngoal: Optional[int] = 0

class MatchResultBase(BaseModel):
	matchid: Optional[int] = None
	homescore: Optional[int] = 0
	awayscore: Optional[int] = 0
	winnerteamid: Optional[int] = None
	mvpplayerid: Optional[int] = None

	class Config:
		from_attributes = True

class MatchResultCreate(BaseModel):
	matchid: int
	homescore: Optional[int] = 0
	awayscore: Optional[int] = 0
	winnerteamid: Optional[int] = None
	mvpplayerid: Optional[int] = None
	home_goal_scorers: Optional[List[GoalScorer]] = []
	away_goal_scorers: Optional[List[GoalScorer]] = []

class MatchResultUpdate(MatchResultBase):
	home_goal_scorers: Optional[List[GoalScorer]] = None
	away_goal_scorers: Optional[List[GoalScorer]] = None

class MatchResult(MatchResultBase):
	resultid: int
