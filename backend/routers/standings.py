from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import Standings as StandingsSchema, StandingsCreate, StandingsUpdate

router = APIRouter()

@router.get("", response_model=List[StandingsSchema])
def list_standings(db: Session = Depends(get_db)):
	return db.query(models.Standings).all()

@router.post("", response_model=StandingsSchema, status_code=201)
def create_standing(payload: StandingsCreate, db: Session = Depends(get_db)):
	standing = models.Standings(**payload.model_dump())
	db.add(standing)
	db.commit()
	db.refresh(standing)
	return standing

@router.get("/{standingid}", response_model=StandingsSchema)
def get_standing(standingid: int, db: Session = Depends(get_db)):
	standing = db.query(models.Standings).filter(models.Standings.standingid == standingid).first()
	if not standing:
		raise HTTPException(404, "Standing not found")
	return standing

@router.patch("/{standingid}", response_model=StandingsSchema)
def update_standing(standingid: int, payload: StandingsUpdate, db: Session = Depends(get_db)):
	standing = db.query(models.Standings).filter(models.Standings.standingid == standingid).first()
	if not standing:
		raise HTTPException(404, "Standing not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(standing, field, value)
	db.add(standing)
	db.commit()
	db.refresh(standing)
	return standing

@router.delete("/{standingid}", status_code=204)
def delete_standing(standingid: int, db: Session = Depends(get_db)):
	standing = db.query(models.Standings).filter(models.Standings.standingid == standingid).first()
	if not standing:
		raise HTTPException(404, "Standing not found")
	db.delete(standing)
	db.commit()
	return None
