from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from backend.database import Base

class Tournament(Base):
	__tablename__ = "tournament"

	tournamentid = Column(Integer, primary_key=True, index=True)
	name = Column(String(100), nullable=False)
	seasonyear = Column(Integer, nullable=True)
	startdate = Column(Date, nullable=True)
	enddate = Column(Date, nullable=True)
	organizerid = Column(Integer, ForeignKey("users.userid", ondelete="SET NULL"), nullable=True)
	description = Column(Text, nullable=True)
