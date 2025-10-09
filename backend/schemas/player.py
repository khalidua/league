from typing import Optional, Literal
from pydantic import BaseModel

PreferredFoot = Literal["Left", "Right", "Both"]

class PlayerBase(BaseModel):
	userid: Optional[int] = None
	teamid: Optional[int] = None
	position: Optional[str] = None
	jerseynumber: Optional[int] = None
	statsid: Optional[int] = None
	preferredfoot: Optional[PreferredFoot] = None
	height: Optional[float] = None
	weight: Optional[float] = None

	class Config:
		from_attributes = True

class PlayerCreate(BaseModel):
	userid: int
	statsid: int
	teamid: Optional[int] = None
	position: Optional[str] = None
	jerseynumber: Optional[int] = None
	preferredfoot: Optional[PreferredFoot] = None
	height: Optional[float] = None
	weight: Optional[float] = None

class PlayerUpdate(PlayerBase):
	pass

class Player(PlayerBase):
	playerid: int
