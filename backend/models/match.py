from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from backend.database import Base

class Match(Base):
	__tablename__ = "match"

	matchid = Column(Integer, primary_key=True, index=True)
	tournamentid = Column(Integer, ForeignKey("tournament.tournamentid", ondelete="CASCADE"), nullable=True)
	hometeamid = Column(Integer, ForeignKey("team.teamid"), nullable=True)
	awayteamid = Column(Integer, ForeignKey("team.teamid"), nullable=True)
	stadiumid = Column(Integer, ForeignKey("stadium.stadiumid"), nullable=True)
	matchdate = Column(DateTime(timezone=False), nullable=False)
	round = Column(String(50), nullable=False, default="Group")
	status = Column(String(20), nullable=False, default="Upcoming")
