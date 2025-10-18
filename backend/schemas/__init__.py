from backend.schemas.user import User, UserCreate, UserUpdate, UserResponse
from backend.schemas.admin import Admin, AdminCreate, AdminUpdate, AdminWithUser
from backend.schemas.auth import LoginRequest, RegisterRequest, AuthResponse, TokenData
from backend.schemas.team import Team, TeamCreate, TeamUpdate
from backend.schemas.playerstats import PlayerStats, PlayerStatsCreate, PlayerStatsUpdate
from backend.schemas.player import Player, PlayerCreate, PlayerUpdate, PlayerWithUser
from backend.schemas.stadium import Stadium, StadiumCreate, StadiumUpdate
from backend.schemas.tournament import Tournament, TournamentCreate, TournamentUpdate, TournamentJoinRequest
from backend.schemas.tournament_team import TournamentTeam, TournamentTeamCreate
from backend.schemas.tournament_group import TournamentGroup, TournamentGroupCreate, TournamentGroupUpdate
from backend.schemas.group_teams import GroupTeams, GroupTeamsCreate
from backend.schemas.standings import Standings, StandingsCreate, StandingsUpdate
from backend.schemas.match import Match, MatchCreate, MatchUpdate
from backend.schemas.match_result import MatchResult, MatchResultCreate, MatchResultUpdate
from backend.schemas.goal import Goal, GoalCreate, GoalUpdate, GoalWithPlayer
from backend.schemas.event import Event, EventCreate, EventUpdate

__all__ = [
	"User", "UserCreate", "UserUpdate", "UserResponse",
	"Admin", "AdminCreate", "AdminUpdate", "AdminWithUser",
	"LoginRequest", "RegisterRequest", "AuthResponse", "TokenData",
	"Team", "TeamCreate", "TeamUpdate",
	"PlayerStats", "PlayerStatsCreate", "PlayerStatsUpdate",
	"Player", "PlayerCreate", "PlayerUpdate", "PlayerWithUser",
	"Stadium", "StadiumCreate", "StadiumUpdate",
	"Tournament", "TournamentCreate", "TournamentUpdate", "TournamentJoinRequest",
	"TournamentTeam", "TournamentTeamCreate",
	"TournamentGroup", "TournamentGroupCreate", "TournamentGroupUpdate",
	"GroupTeams", "GroupTeamsCreate",
	"Standings", "StandingsCreate", "StandingsUpdate",
	"Match", "MatchCreate", "MatchUpdate",
	"MatchResult", "MatchResultCreate", "MatchResultUpdate",
	"Goal", "GoalCreate", "GoalUpdate", "GoalWithPlayer",
	"Event", "EventCreate", "EventUpdate",
]
