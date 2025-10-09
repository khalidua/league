from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class EventBase(BaseModel):
	title: Optional[str] = None
	description: Optional[str] = None
	date: Optional[datetime] = None
	organizerid: Optional[int] = None
	image: Optional[str] = None

	class Config:
		from_attributes = True

class EventCreate(BaseModel):
	title: str
	description: Optional[str] = None
	date: Optional[datetime] = None
	organizerid: Optional[int] = None
	image: Optional[str] = None

class EventUpdate(EventBase):
	pass

class Event(EventBase):
	eventid: int
