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

class PlayerWithUser(PlayerBase):
	playerid: int
	firstname: Optional[str] = None
	lastname: Optional[str] = None
	email: Optional[str] = None
	profileimage: Optional[str] = None
	
	@property
	def fullname(self) -> str:
		"""Get the full name of the player"""
		if self.firstname and self.lastname:
			return f"{self.firstname} {self.lastname}"
		elif self.firstname:
			return self.firstname
		elif self.lastname:
			return self.lastname
		else:
			return f"Player {self.playerid}"