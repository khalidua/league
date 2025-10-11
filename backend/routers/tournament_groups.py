from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import TournamentGroup as TournamentGroupSchema, TournamentGroupCreate, TournamentGroupUpdate

router = APIRouter()

@router.get("", response_model=List[TournamentGroupSchema])
def list_tournament_groups(db: Session = Depends(get_db)):
	return db.query(models.TournamentGroup).all()

@router.post("", response_model=TournamentGroupSchema, status_code=201)
def create_tournament_group(payload: TournamentGroupCreate, db: Session = Depends(get_db)):
	group = models.TournamentGroup(**payload.model_dump())
	db.add(group)
	db.commit()
	db.refresh(group)
	return group

@router.get("/{groupid}", response_model=TournamentGroupSchema)
def get_tournament_group(groupid: int, db: Session = Depends(get_db)):
	group = db.query(models.TournamentGroup).filter(models.TournamentGroup.groupid == groupid).first()
	if not group:
		raise HTTPException(404, "Tournament group not found")
	return group

@router.patch("/{groupid}", response_model=TournamentGroupSchema)
def update_tournament_group(groupid: int, payload: TournamentGroupUpdate, db: Session = Depends(get_db)):
	group = db.query(models.TournamentGroup).filter(models.TournamentGroup.groupid == groupid).first()
	if not group:
		raise HTTPException(404, "Tournament group not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(group, field, value)
	db.add(group)
	db.commit()
	db.refresh(group)
	return group

@router.delete("/{groupid}", status_code=204)
def delete_tournament_group(groupid: int, db: Session = Depends(get_db)):
	group = db.query(models.TournamentGroup).filter(models.TournamentGroup.groupid == groupid).first()
	if not group:
		raise HTTPException(404, "Tournament group not found")
	db.delete(group)
	db.commit()
	return None
