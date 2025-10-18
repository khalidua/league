from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
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
	# Email verification fields
	is_email_verified = Column(Boolean, nullable=False, default=False)
	email_verification_token = Column(String(255), nullable=True)
	email_verification_expires = Column(DateTime(timezone=False), nullable=True)
	last_verification_email_sent = Column(DateTime(timezone=False), nullable=True)
