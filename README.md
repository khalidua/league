# ZC League

ZC League is a full-stack football league management platform. It includes a FastAPI backend and a React + TypeScript frontend for managing users, teams, tournaments, matches, standings, player stats, join requests, and notifications.

## Project Structure

```text
zc-league/
  backend/        # FastAPI app, SQLAlchemy models, routers, auth, services
  frontend/       # React + Vite TypeScript app
  .github/        # CI/CD workflow (Azure Web App deployment)
```

## Core Features

- Authentication with JWT (register, login, current user, logout)
- Role-based access control (Admin, Organizer, Player)
- Team and player management
- Tournament, group, and fixture management
- Match results, goals, and standings tracking
- Join request/invitation flow
- In-app notifications
- Email verification and resend verification support
- Image upload integration (Cloudinary)

## Tech Stack

### Backend

- FastAPI
- SQLAlchemy
- Pydantic / pydantic-settings
- PostgreSQL (default in current config) or SQLite fallback
- `python-jose` + `passlib` for JWT and password hashing

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- React Bootstrap / React Icons

### Deployment

- GitHub Actions for CI/CD
- Azure Web App deployment workflow in `.github/workflows/main_zc-league.yml`

## Prerequisites

- Python 3.11+ (3.11 is used in CI)
- Node.js 18+ and npm
- Git

## Quick Start (Local Development)

### 1) Clone the repository

```bash
git clone <your-repo-url>
cd zc-league
```

### 2) Backend setup

```bash
# from repository root
python -m venv .venv
```

Activate virtual environment:

- PowerShell:
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- Bash:
  ```bash
  source .venv/bin/activate
  ```

Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

Run backend:

```bash
uvicorn backend.app:app --reload --port 8000
```

Backend URLs:

- API root (with `/api` prefix in routes): `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

### 3) Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL (default Vite): `http://localhost:5173`

## Environment Variables

### Backend (`backend/.env`)

The backend reads variables from `backend/.env` (if present) and system environment.

Common variables used by `backend/config.py`:

- `DATABASE_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `SECRET_KEY`
- `FRONTEND_BASE_URL` (or `PUBLIC_BASE_URL`)
- `BACKEND_BASE_URL`

Example template:

```env
DATABASE_URL=sqlite:///./zc_league.db
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GMAIL_USER=
GMAIL_APP_PASSWORD=
SECRET_KEY=change-me
FRONTEND_BASE_URL=http://localhost:5173
BACKEND_BASE_URL=http://localhost:8000/api
```

### Frontend (`frontend/.env`)

Used variable:

- `VITE_API_BASE` (example: `http://localhost:8000`)

Example:

```env
VITE_API_BASE=http://localhost:8000
```

## Running Tests / Validation

Current repository includes backend utility scripts such as:

- `backend/test_role_access.py`
- `backend/test_profile_update.py`

Run from the project root with your virtual environment activated:

```bash
python backend/test_role_access.py
python backend/test_profile_update.py
```

## API Organization

The backend mounts all routes under `/api` and includes routers for:

- `/auth`
- `/users`
- `/admins`
- `/teams`
- `/players`
- `/playerstats`
- `/stadiums`
- `/tournaments`
- `/tournament-teams`
- `/tournament-groups`
- `/group-teams`
- `/standings`
- `/matches`
- `/match-results`
- `/goals`
- `/events`
- `/upload`
- `/join-requests`
- `/notifications`

Explore interactive docs at `http://localhost:8000/docs`.

## Frontend Routing

Main frontend pages include:

- Public: Home, Players, Player Details, Teams, Team Details, Matches, Tournaments, Standings, Rules
- Auth: Login, Register, Verify Email, Resend Verification
- Protected: Profile, Team Management (Player role), Admin Dashboard (Admin role)

## Build and Production

### Frontend build

```bash
cd frontend
npm run build
npm run preview
```

### Backend production serving

Typical command:

```bash
uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

The GitHub Actions workflow deploys the app to Azure and sets startup command to run Uvicorn.

## Troubleshooting

- Frontend cannot connect to API:
  - Ensure backend is running on `http://localhost:8000`
  - Ensure `frontend/.env` has correct `VITE_API_BASE`
- Auth errors (`401/403`):
  - Verify token exists in browser local storage
  - Confirm user role for protected operations
- Image upload issues:
  - Check Cloudinary env vars in backend config
- Email verification issues:
  - Ensure Gmail env vars are set and valid app password is used
- Database connection failures:
  - Validate `DATABASE_URL`
  - For local fallback, use SQLite value shown in env template

## Security Notes

- Do not commit real credentials or production secrets.
- Rotate any exposed secrets immediately if they were accidentally committed.
- Use a strong `SECRET_KEY` in non-local environments.

## Contribution Workflow

1. Create a feature branch.
2. Make focused changes.
3. Run app/tests locally.
4. Open a pull request with clear description and test steps.

## License

No license file is currently defined in this repository. Add one if you plan to distribute this project publicly.

