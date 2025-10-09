from sqlalchemy import Column, Integer, ForeignKey
from backend.database import Base

class MatchResult(Base):
	__tablename__ = "matchresult"

	resultid = Column(Integer, primary_key=True, index=True)
	matchid = Column(Integer, ForeignKey("match.matchid", ondelete="CASCADE"), nullable=True)
	homescore = Column(Integer, nullable=False, default=0)
	awayscore = Column(Integer, nullable=False, default=0)
	winnerteamid = Column(Integer, ForeignKey("team.teamid"), nullable=True)
	mvpplayerid = Column(Integer, ForeignKey("player.playerid"), nullable=True)
