from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

engine = create_engine(
	settings.database_url,
	future=True,
	echo=False,
	pool_pre_ping=True,          # validate connections before use; auto-reconnect on failure
	pool_recycle=300,            # recycle connections periodically to avoid server idle timeouts
	pool_size=5,
	max_overflow=10,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()

def init_db() -> None:
	# Import models so metadata is populated
	from backend import models  # noqa: F401
	Base.metadata.create_all(bind=engine)
