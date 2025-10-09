from sqlalchemy import Column, Integer, ForeignKey
from backend.database import Base

class Admin(Base):
	__tablename__ = "admins"

	adminid = Column(Integer, primary_key=True, index=True)
	userid = Column(Integer, ForeignKey("users.userid", ondelete="CASCADE"), nullable=True)
	permissionslevel = Column(Integer, nullable=False, default=1)
