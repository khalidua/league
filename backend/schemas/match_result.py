from typing import Optional
from pydantic import BaseModel

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

class MatchResultUpdate(MatchResultBase):
	pass

class MatchResult(MatchResultBase):
	resultid: int
