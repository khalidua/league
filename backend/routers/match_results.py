from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import MatchResult as MatchResultSchema, MatchResultCreate, MatchResultUpdate
from backend.auth import require_organizer_or_admin, require_authenticated_user

router = APIRouter()

@router.get("", response_model=List[MatchResultSchema])
def list_results(db: Session = Depends(get_db)):
	return db.query(models.MatchResult).all()

@router.post("", response_model=MatchResultSchema, status_code=201)
def create_result(payload: MatchResultCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_organizer_or_admin)):
	# Get the match to find teams and group
	match = db.query(models.Match).filter(models.Match.matchid == payload.matchid).first()
	if not match:
		raise HTTPException(404, "Match not found")
	
	# Create the match result (excluding goal scorers from the main result)
	result_data = payload.model_dump(exclude={'home_goal_scorers', 'away_goal_scorers'})
	result = models.MatchResult(**result_data)
	db.add(result)
	db.commit()
	db.refresh(result)
	
	# Create goal records for home team
	if payload.home_goal_scorers:
		for goal_scorer in payload.home_goal_scorers:
			goal = models.Goal(
				matchid=payload.matchid,
				playerid=goal_scorer.playerid,
				teamid=match.hometeamid,
				minute=goal_scorer.minute,
				isowngoal=goal_scorer.isowngoal or 0
			)
			db.add(goal)
			# Update player stats
			update_player_goal_stats(db, goal_scorer.playerid, goal_scorer.isowngoal or 0)
	
	# Create goal records for away team
	if payload.away_goal_scorers:
		for goal_scorer in payload.away_goal_scorers:
			goal = models.Goal(
				matchid=payload.matchid,
				playerid=goal_scorer.playerid,
				teamid=match.awayteamid,
				minute=goal_scorer.minute,
				isowngoal=goal_scorer.isowngoal or 0
			)
			db.add(goal)
			# Update player stats
			update_player_goal_stats(db, goal_scorer.playerid, goal_scorer.isowngoal or 0)
	
	db.commit()
	
	# Update standings for both teams
	update_standings_from_result(db, match, payload.homescore, payload.awayscore)
	
	return result

@router.get("/{resultid}", response_model=MatchResultSchema)
def get_result(resultid: int, db: Session = Depends(get_db)):
	result = db.query(models.MatchResult).filter(models.MatchResult.resultid == resultid).first()
	if not result:
		raise HTTPException(404, "Result not found")
	return result

@router.patch("/{resultid}", response_model=MatchResultSchema)
def update_result(resultid: int, payload: MatchResultUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(require_organizer_or_admin)):
	result = db.query(models.MatchResult).filter(models.MatchResult.resultid == resultid).first()
	if not result:
		raise HTTPException(404, "Result not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(result, field, value)
	db.add(result)
	db.commit()
	db.refresh(result)
	return result

@router.delete("/{resultid}", status_code=204)
def delete_result(resultid: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_organizer_or_admin)):
	result = db.query(models.MatchResult).filter(models.MatchResult.resultid == resultid).first()
	if not result:
		raise HTTPException(404, "Result not found")
	db.delete(result)
	db.commit()
	return None

def update_standings_from_result(db: Session, match: models.Match, home_score: int, away_score: int):
	"""Update standings for both teams based on match result"""
	
	# Find the group for this match (teams should be in the same group)
	home_team_group = db.query(models.GroupTeams).filter(
		models.GroupTeams.teamid == match.hometeamid
	).first()
	
	away_team_group = db.query(models.GroupTeams).filter(
		models.GroupTeams.teamid == match.awayteamid
	).first()
	
	# Both teams should be in the same group
	if not home_team_group or not away_team_group:
		return  # Can't update standings if teams aren't in groups
	
	if home_team_group.groupid != away_team_group.groupid:
		return  # Teams must be in the same group
	
	group_id = home_team_group.groupid
	
	# Get or create standings for home team
	home_standing = db.query(models.Standings).filter(
		models.Standings.groupid == group_id,
		models.Standings.teamid == match.hometeamid
	).first()
	
	if not home_standing:
		home_standing = models.Standings(
			groupid=group_id,
			teamid=match.hometeamid,
			matchesplayed=0,
			wins=0,
			draws=0,
			losses=0,
			goalsfor=0,
			goalsagainst=0,
			points=0
		)
		db.add(home_standing)
	
	# Get or create standings for away team
	away_standing = db.query(models.Standings).filter(
		models.Standings.groupid == group_id,
		models.Standings.teamid == match.awayteamid
	).first()
	
	if not away_standing:
		away_standing = models.Standings(
			groupid=group_id,
			teamid=match.awayteamid,
			matchesplayed=0,
			wins=0,
			draws=0,
			losses=0,
			goalsfor=0,
			goalsagainst=0,
			points=0
		)
		db.add(away_standing)
	
	# Update home team standings
	home_standing.matchesplayed += 1
	home_standing.goalsfor += home_score
	home_standing.goalsagainst += away_score
	
	# Update away team standings
	away_standing.matchesplayed += 1
	away_standing.goalsfor += away_score
	away_standing.goalsagainst += home_score
	
	# Determine winner and update points
	if home_score > away_score:
		# Home team wins
		home_standing.wins += 1
		home_standing.points += 3
		away_standing.losses += 1
	elif away_score > home_score:
		# Away team wins
		away_standing.wins += 1
		away_standing.points += 3
		home_standing.losses += 1
	else:
		# Draw
		home_standing.draws += 1
		home_standing.points += 1
		away_standing.draws += 1
		away_standing.points += 1
	
	# Save changes
	db.add(home_standing)
	db.add(away_standing)
	db.commit()

def update_player_goal_stats(db: Session, player_id: int, is_own_goal: int, subtract: bool = False):
	"""Update player goal statistics"""
	player = db.query(models.Player).filter(models.Player.playerid == player_id).first()
	if not player:
		return
	
	# Get or create player stats
	stats = db.query(models.PlayerStats).filter(models.PlayerStats.statsid == player.statsid).first()
	if not stats:
		# Create new stats record
		stats = models.PlayerStats(
			matchesplayed=0,
			goals=0,
			assists=0,
			yellowcards=0,
			redcards=0,
			mvpcount=0,
			ratingaverage=0
		)
		db.add(stats)
		db.commit()
		db.refresh(stats)
		
		# Update player with stats ID
		player.statsid = stats.statsid
		db.commit()
	
	# Update goal count
	if is_own_goal == 0:  # Regular goal
		if subtract:
			stats.goals = max(0, stats.goals - 1)
		else:
			stats.goals += 1
	# Note: Own goals don't count towards player's goal tally
	
	db.commit()
