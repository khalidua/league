from typing import Optional
from pydantic import BaseModel

class TournamentGroupBase(BaseModel):
	tournamentid: Optional[int] = None
	groupname: Optional[str] = None

	class Config:
		from_attributes = True

class TournamentGroupCreate(BaseModel):
	tournamentid: int
	groupname: str

class TournamentGroupUpdate(TournamentGroupBase):
	pass

class TournamentGroup(TournamentGroupBase):
	groupid: int
