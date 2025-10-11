#!/usr/bin/env python3
"""
Local development server runner for ZC League API
"""
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set environment variables for local development
os.environ.setdefault("HOST", "127.0.0.1")
os.environ.setdefault("PORT", "8000")
os.environ.setdefault("DEBUG", "True")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,https://zc-league-axckdddkdkbpeuc3.israelcentral-01.azurewebsites.net")

if __name__ == "__main__":
    import uvicorn
    from app import app
    
    print("Starting ZC League API server for local development...")
    print("Server will be available at: http://127.0.0.1:8000")
    print("API documentation at: http://127.0.0.1:8000/docs")
    print("Press Ctrl+C to stop the server")
    
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="debug"
    )
