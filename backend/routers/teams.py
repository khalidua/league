from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import Team as TeamSchema, TeamCreate, TeamUpdate

router = APIRouter()

@router.get("", response_model=List[TeamSchema])
def list_teams(db: Session = Depends(get_db)):
	return db.query(models.Team).all()

@router.post("", response_model=TeamSchema, status_code=201)
def create_team(payload: TeamCreate, db: Session = Depends(get_db)):
	team = models.Team(**payload.model_dump())
	db.add(team)
	db.commit()
	db.refresh(team)
	return team

@router.get("/{teamid}", response_model=TeamSchema)
def get_team(teamid: int, db: Session = Depends(get_db)):
	team = db.query(models.Team).filter(models.Team.teamid == teamid).first()
	if not team:
		raise HTTPException(404, "Team not found")
	return team

@router.patch("/{teamid}", response_model=TeamSchema)
def update_team(teamid: int, payload: TeamUpdate, db: Session = Depends(get_db)):
	team = db.query(models.Team).filter(models.Team.teamid == teamid).first()
	if not team:
		raise HTTPException(404, "Team not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(team, field, value)
	db.add(team)
	db.commit()
	db.refresh(team)
	return team

@router.delete("/{teamid}", status_code=204)
def delete_team(teamid: int, db: Session = Depends(get_db)):
	team = db.query(models.Team).filter(models.Team.teamid == teamid).first()
	if not team:
		raise HTTPException(404, "Team not found")
	db.delete(team)
	db.commit()
	return None
