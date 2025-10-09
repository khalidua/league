from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import init_db
from backend.routers import api_router

app = FastAPI(title="ZC League API", version="1.0.0")

# CORS: allow local dev and any configured origins
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.on_event("startup")
async def on_startup() -> None:
	init_db()
	# basic log of DB used (hide password)
	db_url = settings.database_url
	if "@" in db_url and "://" in db_url:
		try:
			proto, rest = db_url.split("://", 1)
			creds, host = rest.split("@", 1)
			print(f"DB: {proto}://***:***@{host}")
		except Exception:
			print("DB: (sanitized)")
	else:
		print(f"DB: {db_url}")
