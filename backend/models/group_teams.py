from sqlalchemy import Column, Integer, ForeignKey, PrimaryKeyConstraint
from backend.database import Base

class GroupTeams(Base):
	__tablename__ = "groupteams"

	groupid = Column(Integer, ForeignKey("tournamentgroup.groupid", ondelete="CASCADE"), nullable=False)
	teamid = Column(Integer, ForeignKey("team.teamid", ondelete="CASCADE"), nullable=False)

	__table_args__ = (
		PrimaryKeyConstraint("groupid", "teamid"),
	)
