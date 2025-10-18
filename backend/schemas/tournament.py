from typing import Optional
from datetime import date
from pydantic import BaseModel

class TournamentBase(BaseModel):
	name: Optional[str] = None
	seasonyear: Optional[int] = None
	startdate: Optional[date] = None
	enddate: Optional[date] = None
	organizerid: Optional[int] = None
	description: Optional[str] = None

	class Config:
		from_attributes = True

class TournamentCreate(BaseModel):
	name: str
	seasonyear: Optional[int] = None
	startdate: Optional[date] = None
	enddate: Optional[date] = None
	organizerid: Optional[int] = None
	description: Optional[str] = None

class TournamentUpdate(TournamentBase):
	pass

class Tournament(TournamentBase):
	tournamentid: int

class TournamentJoinRequest(BaseModel):
	tournamentid: int
	note: Optional[str] = None