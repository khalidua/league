import sys
import os
from contextlib import asynccontextmanager

# When running as `python -m uvicorn backend.app:app` from the repo root,
# the backend/ directory is not on sys.path. Insert it so bare sibling
# imports like `from config import settings` resolve correctly.
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import init_db
from routers import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
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
    yield
    # Shutdown (add cleanup here if needed)


app = FastAPI(title="ZC League API", version="1.0.0", lifespan=lifespan)

# CORS: allow all origins (Bearer-token auth, no cookies → credentials=False is correct)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://khalidua.github.io",  # GitHub Pages frontend
        "http://localhost:5173",        # Local Vite dev server
        "http://localhost:3000",        # Alternative local port
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
