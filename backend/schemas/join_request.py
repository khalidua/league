from typing import Optional
from pydantic import BaseModel


class JoinRequestBase(BaseModel):
	teamid: int
	note: Optional[str] = None


class JoinRequestCreate(JoinRequestBase):
	pass


class JoinRequestRespond(BaseModel):
	action: str  # approve|deny|cancel
	note: Optional[str] = None


class JoinRequest(BaseModel):
	requestid: int
	teamid: int
	requester_userid: int
	requester_playerid: Optional[int] = None
	status: str
	source: str
	note: Optional[str] = None

	class Config:
		from_attributes = True


