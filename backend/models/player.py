from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from backend.database import Base

class Player(Base):
	__tablename__ = "player"

	playerid = Column(Integer, primary_key=True, index=True)
	userid = Column(Integer, ForeignKey("users.userid", ondelete="CASCADE"), nullable=True)
	teamid = Column(Integer, ForeignKey("team.teamid", ondelete="SET NULL"), nullable=True)
	position = Column(String(50), nullable=True)
	jerseynumber = Column(Integer, nullable=True)
	statsid = Column(Integer, ForeignKey("playerstats.statsid", ondelete="CASCADE"), nullable=True)
	preferredfoot = Column(String(10), nullable=False, default="Right")
	height = Column(Numeric(5, 2), nullable=True)
	weight = Column(Numeric(5, 2), nullable=True)
