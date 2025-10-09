from sqlalchemy import Column, Integer, Numeric
from backend.database import Base

class PlayerStats(Base):
	__tablename__ = "playerstats"

	statsid = Column(Integer, primary_key=True, index=True)
	matchesplayed = Column(Integer, nullable=False, default=0)
	goals = Column(Integer, nullable=False, default=0)
	assists = Column(Integer, nullable=False, default=0)
	yellowcards = Column(Integer, nullable=False, default=0)
	redcards = Column(Integer, nullable=False, default=0)
	mvpcount = Column(Integer, nullable=False, default=0)
	ratingaverage = Column(Numeric(4, 2), nullable=False, default=0)
