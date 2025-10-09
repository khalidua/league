from pydantic import BaseModel

class TournamentTeamBase(BaseModel):
	tournamentid: int
	teamid: int

	class Config:
		from_attributes = True

class TournamentTeamCreate(TournamentTeamBase):
	pass

class TournamentTeam(TournamentTeamBase):
	pass
