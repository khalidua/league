from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from backend.deps import get_db
from backend import models
from backend.schemas import Player as PlayerSchema, PlayerCreate, PlayerUpdate, PlayerWithUser
from backend.auth import require_authenticated_user
from backend.schemas.notification import NotificationCreate

router = APIRouter()

@router.get("", response_model=List[PlayerWithUser])
def list_players(
	teamid: Optional[int] = Query(None, description="Filter players by team ID"),
	skip: int = Query(0, ge=0, description="Number of records to skip"),
	limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
	db: Session = Depends(get_db)
):
	# Join Player with User and Team to get player names and team info
	query = db.query(models.Player, models.User, models.Team).outerjoin(
		models.User, models.Player.userid == models.User.userid
	).outerjoin(
		models.Team, models.Player.teamid == models.Team.teamid
	)
	
	if teamid is not None:
		query = query.filter(models.Player.teamid == teamid)
	
	results = query.offset(skip).limit(limit).all()
	
	# Convert joined results to PlayerWithUser objects
	players_with_users = []
	for player, user, team in results:
		player_data = {
			"playerid": player.playerid,
			"userid": player.userid,
			"teamid": player.teamid,
			"position": player.position,
			"jerseynumber": player.jerseynumber,
			"statsid": player.statsid,
			"preferredfoot": player.preferredfoot,
			"height": float(player.height) if player.height else None,
			"weight": float(player.weight) if player.weight else None,
			"firstname": user.firstname if user else None,
			"lastname": user.lastname if user else None,
			"email": user.email if user else None,
			"profileimage": user.profileimage if user else None,
			"status": user.status if user else None,
			"teamname": team.teamname if team else None,
			"teamlogo": team.logourl if team else None,
		}
		players_with_users.append(PlayerWithUser(**player_data))
	
	return players_with_users

@router.post("", response_model=PlayerSchema, status_code=201)
def create_player(payload: PlayerCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_authenticated_user)):
	# Prevent duplicate by userid
	if payload.userid is not None:
		existing = db.query(models.Player).filter(models.Player.userid == payload.userid).first()
		if existing:
			raise HTTPException(400, "Player already exists for this user")
	player = models.Player(**payload.model_dump())
	db.add(player)
	db.commit()
	db.refresh(player)
	return player

@router.get("/{playerid}", response_model=PlayerWithUser)
def get_player(playerid: int, db: Session = Depends(get_db)):
	# Join Player with User, Team, and PlayerStats to get complete player info
	result = db.query(models.Player, models.User, models.Team, models.PlayerStats).outerjoin(
		models.User, models.Player.userid == models.User.userid
	).outerjoin(
		models.Team, models.Player.teamid == models.Team.teamid
	).outerjoin(
		models.PlayerStats, models.Player.statsid == models.PlayerStats.statsid
	).filter(models.Player.playerid == playerid).first()
	
	if not result:
		raise HTTPException(404, "Player not found")
	
	player, user, team, stats = result
	
	# Convert joined result to PlayerWithUser object
	player_data = {
		"playerid": player.playerid,
		"userid": player.userid,
		"teamid": player.teamid,
		"position": player.position,
		"jerseynumber": player.jerseynumber,
		"statsid": player.statsid,
		"preferredfoot": player.preferredfoot,
		"height": float(player.height) if player.height else None,
		"weight": float(player.weight) if player.weight else None,
		"firstname": user.firstname if user else None,
		"lastname": user.lastname if user else None,
		"email": user.email if user else None,
		"profileimage": user.profileimage if user else None,
		"status": user.status if user else None,
		"teamname": team.teamname if team else None,
		"teamlogo": team.logourl if team else None,
		# Player statistics
		"matchesplayed": stats.matchesplayed if stats else 0,
		"goals": stats.goals if stats else 0,
		"assists": stats.assists if stats else 0,
		"yellowcards": stats.yellowcards if stats else 0,
		"redcards": stats.redcards if stats else 0,
		"mvpcount": stats.mvpcount if stats else 0,
		"ratingaverage": float(stats.ratingaverage) if stats and stats.ratingaverage else 0.0,
	}
	
	return PlayerWithUser(**player_data)

@router.patch("/{playerid}", response_model=PlayerSchema)
def update_player(playerid: int, payload: PlayerUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(require_authenticated_user)):
	player = db.query(models.Player).filter(models.Player.playerid == playerid).first()
	if not player:
		raise HTTPException(404, "Player not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(player, field, value)
	db.add(player)
	db.commit()
	db.refresh(player)
	return player

@router.delete("/{playerid}", status_code=204)
def delete_player(playerid: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_authenticated_user)):
	player = db.query(models.Player).filter(models.Player.playerid == playerid).first()
	if not player:
		raise HTTPException(404, "Player not found")
	db.delete(player)
	db.commit()
	return None
