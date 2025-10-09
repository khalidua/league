from sqlalchemy import Column, Integer, String
from backend.database import Base

class Stadium(Base):
	__tablename__ = "stadium"

	stadiumid = Column(Integer, primary_key=True, index=True)
	name = Column(String(100), nullable=False)
	location = Column(String(150), nullable=True)
	capacity = Column(Integer, nullable=True)
