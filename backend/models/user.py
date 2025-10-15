from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from backend.database import Base

class User(Base):
	__tablename__ = "users"

	userid = Column(Integer, primary_key=True, index=True)
	email = Column(String(100), unique=True, nullable=False, index=True)
	passwordhash = Column(Text, nullable=False)
	role = Column(String(20), nullable=False, default="Player")
	profileimage = Column(Text, nullable=True, default="https://res.cloudinary.com/dns6zhmc2/image/upload/v1760475598/defaultPlayer_vnbpfb.png")
	joindate = Column(DateTime(timezone=False), nullable=False, server_default=func.current_timestamp())
	status = Column(String(20), nullable=False, default="active")
	firstname = Column(String(50), nullable=True)
	lastname = Column(String(50), nullable=True)
