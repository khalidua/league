from typing import Optional
from pydantic import BaseModel

class TeamBase(BaseModel):
	teamname: Optional[str] = None
	logourl: Optional[str] = None
	teamcaptainid: Optional[int] = None
	description: Optional[str] = None

	class Config:
		from_attributes = True

class TeamCreate(BaseModel):
	teamname: str
	logourl: Optional[str] = None
	teamcaptainid: Optional[int] = None
	description: Optional[str] = None

class TeamUpdate(TeamBase):
	pass

class Team(TeamBase):
	teamid: int
