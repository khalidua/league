from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import PlayerStats as PlayerStatsSchema, PlayerStatsCreate, PlayerStatsUpdate

router = APIRouter()

@router.get("", response_model=List[PlayerStatsSchema])
def list_playerstats(db: Session = Depends(get_db)):
	return db.query(models.PlayerStats).all()

@router.post("", response_model=PlayerStatsSchema, status_code=201)
def create_playerstats(payload: PlayerStatsCreate, db: Session = Depends(get_db)):
	stats = models.PlayerStats(**payload.model_dump())
	db.add(stats)
	db.commit()
	db.refresh(stats)
	return stats

@router.get("/{statsid}", response_model=PlayerStatsSchema)
def get_playerstats(statsid: int, db: Session = Depends(get_db)):
	stats = db.query(models.PlayerStats).filter(models.PlayerStats.statsid == statsid).first()
	if not stats:
		raise HTTPException(404, "PlayerStats not found")
	return stats

@router.patch("/{statsid}", response_model=PlayerStatsSchema)
def update_playerstats(statsid: int, payload: PlayerStatsUpdate, db: Session = Depends(get_db)):
	stats = db.query(models.PlayerStats).filter(models.PlayerStats.statsid == statsid).first()
	if not stats:
		raise HTTPException(404, "PlayerStats not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(stats, field, value)
	db.add(stats)
	db.commit()
	db.refresh(stats)
	return stats

@router.delete("/{statsid}", status_code=204)
def delete_playerstats(statsid: int, db: Session = Depends(get_db)):
	stats = db.query(models.PlayerStats).filter(models.PlayerStats.statsid == statsid).first()
	if not stats:
		raise HTTPException(404, "PlayerStats not found")
	db.delete(stats)
	db.commit()
	return None
