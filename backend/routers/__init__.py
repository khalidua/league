from fastapi import APIRouter
from backend.routers import users, admins, teams, playerstats, players, stadiums, tournaments, tournament_teams, tournament_groups, group_teams, standings, matches, match_results, goals, events, upload, auth

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(admins.router, prefix="/admins", tags=["admins"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(playerstats.router, prefix="/playerstats", tags=["playerstats"])
api_router.include_router(players.router, prefix="/players", tags=["players"])
api_router.include_router(stadiums.router, prefix="/stadiums", tags=["stadiums"])
api_router.include_router(tournaments.router, prefix="/tournaments", tags=["tournaments"])
api_router.include_router(tournament_teams.router, prefix="/tournament-teams", tags=["tournament-teams"])
api_router.include_router(tournament_groups.router, prefix="/tournament-groups", tags=["tournament-groups"])
api_router.include_router(group_teams.router, prefix="/group-teams", tags=["group-teams"])
api_router.include_router(standings.router, prefix="/standings", tags=["standings"])
api_router.include_router(matches.router, prefix="/matches", tags=["matches"])
api_router.include_router(match_results.router, prefix="/match-results", tags=["match-results"])
api_router.include_router(goals.router)
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
