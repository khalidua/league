ZC League FastAPI Backend

Setup
- Create a virtualenv and install deps:
  - Windows PowerShell:
    - python -m venv .venv
    - .venv\\Scripts\\Activate.ps1
    - pip install -r backend/requirements.txt

- Configure DB (optional):
  - Set env var DATABASE_URL for PostgreSQL, e.g.
    - setx DATABASE_URL "postgresql+psycopg2://user:pass@localhost:5432/zc_league"
  - Defaults to SQLite file ./zc_league.db

Run
- uvicorn backend.app:app --reload --port 8000
- Visit http://localhost:8000/docs

Notes
- API base path is /api
- Models and routers generated from the provided schema (users, admins, teams, players, playerstats, stadiums, tournaments, tournament-teams, matches, match-results, events)
