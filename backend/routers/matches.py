from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from datetime import datetime
from backend.deps import get_db
from backend import models
from backend.schemas import Match as MatchSchema, MatchCreate, MatchUpdate

router = APIRouter()

@router.get("", response_model=List[MatchSchema])
def list_matches(status: Optional[str] = None, round: Optional[str] = None, db: Session = Depends(get_db)):
	query = db.query(models.Match)
	if status:
		query = query.filter(models.Match.status == status)
	if round:
		query = query.filter(models.Match.round == round)
	return query.all()

@router.get("/next-upcoming")
def get_next_upcoming_match(db: Session = Depends(get_db)):
	"""Get the next upcoming match with team and stadium details"""
	now = datetime.now()
	
	# Query for the next upcoming match
	match = db.query(models.Match)\
		.filter(
			and_(
				models.Match.status == "Upcoming",
				models.Match.matchdate > now
			)
		)\
		.order_by(models.Match.matchdate.asc())\
		.first()
	
	if not match:
		return {"message": "No upcoming matches found"}
	
	# Get team and stadium details separately
	hometeam = None
	awayteam = None
	stadium = None
	
	if match.hometeamid:
		hometeam = db.query(models.Team).filter(models.Team.teamid == match.hometeamid).first()
	
	if match.awayteamid:
		awayteam = db.query(models.Team).filter(models.Team.teamid == match.awayteamid).first()
	
	if match.stadiumid:
		stadium = db.query(models.Stadium).filter(models.Stadium.stadiumid == match.stadiumid).first()
	
	# Format the response with team and stadium details
	return {
		"matchid": match.matchid,
		"matchdate": match.matchdate,
		"round": match.round,
		"status": match.status,
		"hometeam": {
			"teamid": hometeam.teamid if hometeam else None,
			"teamname": hometeam.teamname if hometeam else "TBD",
			"logourl": hometeam.logourl if hometeam else None
		} if hometeam else None,
		"awayteam": {
			"teamid": awayteam.teamid if awayteam else None,
			"teamname": awayteam.teamname if awayteam else "TBD",
			"logourl": awayteam.logourl if awayteam else None
		} if awayteam else None,
		"stadium": {
			"stadiumid": stadium.stadiumid if stadium else None,
			"name": stadium.name if stadium else "TBD",
			"location": stadium.location if stadium else "TBD"
		} if stadium else None
	}

@router.post("", response_model=MatchSchema, status_code=201)
def create_match(payload: MatchCreate, db: Session = Depends(get_db)):
	match = models.Match(**payload.model_dump())
	db.add(match)
	db.commit()
	db.refresh(match)
	return match

@router.get("/{matchid}", response_model=MatchSchema)
def get_match(matchid: int, db: Session = Depends(get_db)):
	match = db.query(models.Match).filter(models.Match.matchid == matchid).first()
	if not match:
		raise HTTPException(404, "Match not found")
	return match

@router.patch("/{matchid}", response_model=MatchSchema)
def update_match(matchid: int, payload: MatchUpdate, db: Session = Depends(get_db)):
	match = db.query(models.Match).filter(models.Match.matchid == matchid).first()
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
	match = db.query(models.Match).filter(models.Match.matchid == matchid).first()
	if not match:
		raise HTTPException(404, "Match not found")
	db.delete(match)
	db.commit()
	return None
