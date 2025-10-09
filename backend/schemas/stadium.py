from typing import Optional
from pydantic import BaseModel

class StadiumBase(BaseModel):
	name: Optional[str] = None
	location: Optional[str] = None
	capacity: Optional[int] = None

	class Config:
		from_attributes = True

class StadiumCreate(BaseModel):
	name: str
	location: Optional[str] = None
	capacity: Optional[int] = None

class StadiumUpdate(StadiumBase):
	pass

class Stadium(StadiumBase):
	stadiumid: int
