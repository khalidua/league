from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base

class Event(Base):
	__tablename__ = "event"

	eventid = Column(Integer, primary_key=True, index=True)
	title = Column(String(150), nullable=True)
	description = Column(Text, nullable=True)
	date = Column(DateTime(timezone=False), nullable=False, server_default=func.current_timestamp())
	organizerid = Column(Integer, ForeignKey("users.userid"), nullable=True)
	image = Column(Text, nullable=True)
