from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel

MatchRound = Literal["Group", "Quarter", "Semi", "Final"]
MatchStatus = Literal["Upcoming", "Live", "Finished"]

class MatchBase(BaseModel):
	tournamentid: Optional[int] = None
	hometeamid: Optional[int] = None
	awayteamid: Optional[int] = None
	stadiumid: Optional[int] = None
	matchdate: Optional[datetime] = None
	round: Optional[MatchRound] = None
	status: Optional[MatchStatus] = None

	class Config:
		from_attributes = True

class MatchCreate(BaseModel):
	tournamentid: Optional[int] = None
	hometeamid: Optional[int] = None
	awayteamid: Optional[int] = None
	stadiumid: Optional[int] = None
	matchdate: datetime
	round: Optional[MatchRound] = None
	status: Optional[MatchStatus] = None

class MatchUpdate(MatchBase):
	pass

class Match(MatchBase):
	matchid: int
