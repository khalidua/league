from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base

class Team(Base):
	__tablename__ = "team"

	teamid = Column(Integer, primary_key=True, index=True)
	teamname = Column(String(100), unique=True, nullable=False)
	logourl = Column(Text, nullable=True)
	teamcaptainid = Column(Integer, ForeignKey("player.playerid", ondelete="SET NULL"), nullable=True)
	createdat = Column(DateTime(timezone=False), nullable=False, server_default=func.current_timestamp())
	description = Column(Text, nullable=True)
