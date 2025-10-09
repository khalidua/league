import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load variables from backend/.env if present
env_path = Path(__file__).parent / ".env"
try:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        print(f"Warning: .env file not found at {env_path}")
except Exception as e:
    print(f"Warning: Could not load .env file: {e}")
    print("Continuing with system environment variables only...")

class Settings(BaseModel):
	database_url: str = os.getenv(
		"DATABASE_URL",
		"postgresql+psycopg2://neondb_owner:npg_Sc04mylipBkR@ep-sweet-frog-ad9srzts-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
	)
	cloudinary_cloud_name: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
	cloudinary_api_key: str = os.getenv("CLOUDINARY_API_KEY", "")
	cloudinary_api_secret: str = os.getenv("CLOUDINARY_API_SECRET", "")

settings = Settings()

# Debug: Print Cloudinary config status (only if credentials are missing)
if not all([settings.cloudinary_cloud_name, settings.cloudinary_api_key, settings.cloudinary_api_secret]):
    print(f"Cloudinary config status:")
    print(f"  Cloud Name: {'✓' if settings.cloudinary_cloud_name else '✗'}")
    print(f"  API Key: {'✓' if settings.cloudinary_api_key else '✗'}")
    print(f"  API Secret: {'✓' if settings.cloudinary_api_secret else '✗'}")
    print(f"  .env file path: {env_path}")
    print(f"  .env file exists: {env_path.exists()}")
    print("  Note: Set CLOUDINARY_* environment variables to enable image uploads")
