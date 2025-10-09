from typing import Optional
from pydantic import BaseModel

class StandingsBase(BaseModel):
	groupid: Optional[int] = None
	teamid: Optional[int] = None
	matchesplayed: Optional[int] = 0
	wins: Optional[int] = 0
	draws: Optional[int] = 0
	losses: Optional[int] = 0
	goalsfor: Optional[int] = 0
	goalsagainst: Optional[int] = 0
	points: Optional[int] = 0

	class Config:
		from_attributes = True

class StandingsCreate(BaseModel):
	groupid: int
	teamid: int
	matchesplayed: Optional[int] = 0
	wins: Optional[int] = 0
	draws: Optional[int] = 0
	losses: Optional[int] = 0
	goalsfor: Optional[int] = 0
	goalsagainst: Optional[int] = 0
	points: Optional[int] = 0

class StandingsUpdate(StandingsBase):
	pass

class Standings(StandingsBase):
	standingid: int
	goaldifference: Optional[int] = None
