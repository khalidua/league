from pydantic import BaseModel

class GroupTeamsBase(BaseModel):
	groupid: int
	teamid: int

	class Config:
		from_attributes = True

class GroupTeamsCreate(GroupTeamsBase):
	pass

class GroupTeams(GroupTeamsBase):
	pass
