from typing import Optional
from pydantic import BaseModel

class PlayerStatsBase(BaseModel):
	matchesplayed: Optional[int] = 0
	goals: Optional[int] = 0
	assists: Optional[int] = 0
	yellowcards: Optional[int] = 0
	redcards: Optional[int] = 0
	mvpcount: Optional[int] = 0
	ratingaverage: Optional[float] = 0.0

	class Config:
		from_attributes = True

class PlayerStatsCreate(PlayerStatsBase):
	pass

class PlayerStatsUpdate(PlayerStatsBase):
	pass

class PlayerStats(PlayerStatsBase):
	statsid: int
