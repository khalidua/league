from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base


class JoinRequest(Base):
	__tablename__ = "join_request"

	requestid = Column(Integer, primary_key=True, index=True)
	teamid = Column(Integer, ForeignKey("team.teamid", ondelete="CASCADE"), nullable=False)
	requester_userid = Column(Integer, ForeignKey("users.userid", ondelete="CASCADE"), nullable=False)
	requester_playerid = Column(Integer, ForeignKey("player.playerid", ondelete="SET NULL"), nullable=True)
	status = Column(String(20), nullable=False, default="pending")  # pending|approved|denied|cancelled
	source = Column(String(20), nullable=False, default="player")  # player|captain
	note = Column(String(255), nullable=True)
	createdat = Column(DateTime(timezone=False), nullable=False, server_default=func.current_timestamp())


