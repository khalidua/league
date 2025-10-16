from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from backend.database import Base


class Notification(Base):
	__tablename__ = "notification"

	notificationid = Column(Integer, primary_key=True, index=True)
	recipient_userid = Column(Integer, ForeignKey("users.userid", ondelete="CASCADE"), nullable=False)
	type = Column(String(50), nullable=False)  # join_request|invite|system
	message = Column(String(255), nullable=False)
	# Use attribute name 'meta' to avoid conflict with SQLAlchemy Base.metadata
	meta = Column("metadata", String(1000), nullable=True)  # JSON string if needed
	isread = Column(Boolean, nullable=False, default=False)
	createdat = Column(DateTime(timezone=False), nullable=False, server_default=func.current_timestamp())


