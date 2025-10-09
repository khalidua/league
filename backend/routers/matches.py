from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import Match as MatchSchema, MatchCreate, MatchUpdate

router = APIRouter()

@router.get("/", response_model=List[MatchSchema])
def list_matches(status: Optional[str] = None, round: Optional[str] = None, db: Session = Depends(get_db)):
	query = db.query(models.Match)
	if status:
		query = query.filter(models.Match.status == status)
	if round:
		query = query.filter(models.Match.round == round)
	return query.all()

@router.post("/", response_model=MatchSchema, status_code=201)
def create_match(payload: MatchCreate, db: Session = Depends(get_db)):
	match = models.Match(**payload.model_dump())
	db.add(match)
	db.commit()
	db.refresh(match)
	return match

@router.get("/{matchid}", response_model=MatchSchema)
def get_match(matchid: int, db: Session = Depends(get_db)):
	match = db.query(models.Match).get(matchid)
	if not match:
		raise HTTPException(404, "Match not found")
	return match

@router.patch("/{matchid}", response_model=MatchSchema)
def update_match(matchid: int, payload: MatchUpdate, db: Session = Depends(get_db)):
	match = db.query(models.Match).get(matchid)
	if not match:
		raise HTTPException(404, "Match not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(match, field, value)
	db.add(match)
	db.commit()
	db.refresh(match)
	return match

@router.delete("/{matchid}", status_code=204)
def delete_match(matchid: int, db: Session = Depends(get_db)):
	match = db.query(models.Match).get(matchid)
	if not match:
		raise HTTPException(404, "Match not found")
	db.delete(match)
	db.commit()
	return None
