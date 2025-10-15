from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from backend.database import Base

class Goal(Base):
    __tablename__ = "goal"

    goalid = Column(Integer, primary_key=True, index=True)
    matchid = Column(Integer, ForeignKey("match.matchid", ondelete="CASCADE"), nullable=False)
    playerid = Column(Integer, ForeignKey("player.playerid", ondelete="CASCADE"), nullable=False)
    teamid = Column(Integer, ForeignKey("team.teamid", ondelete="CASCADE"), nullable=False)
    minute = Column(Integer, nullable=True)  # Minute when goal was scored
    isowngoal = Column(Integer, nullable=False, default=0)  # 0 = regular goal, 1 = own goal
    createdat = Column(DateTime(timezone=True), server_default=func.now())
