from sqlalchemy import Column, Integer, ForeignKey, Computed
from backend.database import Base

class Standings(Base):
	__tablename__ = "standings"

	standingid = Column(Integer, primary_key=True, index=True)
	groupid = Column(Integer, ForeignKey("tournamentgroup.groupid", ondelete="CASCADE"), nullable=True)
	teamid = Column(Integer, ForeignKey("team.teamid", ondelete="CASCADE"), nullable=True)
	matchesplayed = Column(Integer, nullable=False, default=0)
	wins = Column(Integer, nullable=False, default=0)
	draws = Column(Integer, nullable=False, default=0)
	losses = Column(Integer, nullable=False, default=0)
	goalsfor = Column(Integer, nullable=False, default=0)
	goalsagainst = Column(Integer, nullable=False, default=0)
	goaldifference = Column(Integer, Computed("goalsfor - goalsagainst"))
	points = Column(Integer, nullable=False, default=0)
