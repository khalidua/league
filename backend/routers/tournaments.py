from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import Tournament as TournamentSchema, TournamentCreate, TournamentUpdate

router = APIRouter()

@router.get("/", response_model=List[TournamentSchema])
def list_tournaments(db: Session = Depends(get_db)):
	return db.query(models.Tournament).all()

@router.post("/", response_model=TournamentSchema, status_code=201)
def create_tournament(payload: TournamentCreate, db: Session = Depends(get_db)):
	tournament = models.Tournament(**payload.model_dump())
	db.add(tournament)
	db.commit()
	db.refresh(tournament)
	return tournament

@router.get("/{tournamentid}", response_model=TournamentSchema)
def get_tournament(tournamentid: int, db: Session = Depends(get_db)):
	tournament = db.query(models.Tournament).get(tournamentid)
	if not tournament:
		raise HTTPException(404, "Tournament not found")
	return tournament

@router.patch("/{tournamentid}", response_model=TournamentSchema)
def update_tournament(tournamentid: int, payload: TournamentUpdate, db: Session = Depends(get_db)):
	tournament = db.query(models.Tournament).get(tournamentid)
	if not tournament:
		raise HTTPException(404, "Tournament not found")
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(tournament, field, value)
	db.add(tournament)
	db.commit()
	db.refresh(tournament)
	return tournament

@router.delete("/{tournamentid}", status_code=204)
def delete_tournament(tournamentid: int, db: Session = Depends(get_db)):
	tournament = db.query(models.Tournament).get(tournamentid)
	if not tournament:
		raise HTTPException(404, "Tournament not found")
	db.delete(tournament)
	db.commit()
	return None
