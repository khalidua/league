from sqlalchemy import Column, Integer, String, ForeignKey
from backend.database import Base

class TournamentGroup(Base):
	__tablename__ = "tournamentgroup"

	groupid = Column(Integer, primary_key=True, index=True)
	tournamentid = Column(Integer, ForeignKey("tournament.tournamentid", ondelete="CASCADE"), nullable=True)
	groupname = Column(String(50), nullable=False)
