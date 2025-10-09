from sqlalchemy import Column, Integer, ForeignKey, PrimaryKeyConstraint
from backend.database import Base

class TournamentTeam(Base):
	__tablename__ = "tournamentteams"

	tournamentid = Column(Integer, ForeignKey("tournament.tournamentid", ondelete="CASCADE"), nullable=False)
	teamid = Column(Integer, ForeignKey("team.teamid", ondelete="CASCADE"), nullable=False)

	__table_args__ = (
		PrimaryKeyConstraint("tournamentid", "teamid"),
	)
