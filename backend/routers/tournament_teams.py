from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import TournamentTeam as TTschema, TournamentTeamCreate

router = APIRouter()

@router.get("/", response_model=List[TTschema])
def list_entries(db: Session = Depends(get_db)):
	return db.query(models.TournamentTeam).all()

@router.post("/", response_model=TTschema, status_code=201)
def create_entry(payload: TournamentTeamCreate, db: Session = Depends(get_db)):
	entry = models.TournamentTeam(**payload.model_dump())
	db.add(entry)
	db.commit()
	db.refresh(entry)
	return entry

@router.delete("/{tournamentid}/{teamid}", status_code=204)
def delete_entry(tournamentid: int, teamid: int, db: Session = Depends(get_db)):
	entry = db.query(models.TournamentTeam).get((tournamentid, teamid))
	if not entry:
		raise HTTPException(404, "Entry not found")
	db.delete(entry)
	db.commit()
	return None
