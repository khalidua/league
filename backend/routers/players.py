from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import Player as PlayerSchema, PlayerCreate, PlayerUpdate

router = APIRouter()

@router.get("/", response_model=List[PlayerSchema])
def list_players(
	teamid: Optional[int] = Query(None, description="Filter players by team ID"),
	skip: int = Query(0, ge=0, description="Number of records to skip"),
	limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
	db: Session = Depends(get_db)
):
	query = db.query(models.Player)
	if teamid is not None:
		query = query.filter(models.Player.teamid == teamid)
	return query.offset(skip).limit(limit).all()

@router.post("/", response_model=PlayerSchema, status_code=201)
def create_player(payload: PlayerCreate, db: Session = Depends(get_db)):
	player = models.Player(**payload.model_dump())
	db.add(player)
	db.commit()
	db.refresh(player)
	return player

@router.get("/{playerid}", response_model=PlayerSchema)
def get_player(playerid: int, db: Session = Depends(get_db)):
	player = db.query(models.Player).get(playerid)
	if not player:
		raise HTTPException(404, "Player not found")
	return player

@router.patch("/{playerid}", response_model=PlayerSchema)
def update_player(playerid: int, payload: PlayerUpdate, db: Session = Depends(get_db)):
	player = db.query(models.Player).get(playerid)
	if not player:
		raise HTTPException(404, "Player not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(player, field, value)
	db.add(player)
	db.commit()
	db.refresh(player)
	return player

@router.delete("/{playerid}", status_code=204)
def delete_player(playerid: int, db: Session = Depends(get_db)):
	player = db.query(models.Player).get(playerid)
	if not player:
		raise HTTPException(404, "Player not found")
	db.delete(player)
	db.commit()
	return None
