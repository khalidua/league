from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import Standings as StandingsSchema, StandingsCreate, StandingsUpdate
from pydantic import BaseModel

router = APIRouter()

class StandingsWithTeam(BaseModel):
	standingid: int
	groupid: Optional[int] = None
	teamid: Optional[int] = None
	matchesplayed: int = 0
	wins: int = 0
	draws: int = 0
	losses: int = 0
	goalsfor: int = 0
	goalsagainst: int = 0
	goaldifference: Optional[int] = None
	points: int = 0
	# Team information
	teamname: Optional[str] = None
	teamlogo: Optional[str] = None
	# Group information
	groupname: Optional[str] = None

	class Config:
		from_attributes = True

@router.get("", response_model=List[StandingsWithTeam])
def list_standings(
	groupid: Optional[int] = Query(None, description="Filter standings by group ID"),
	db: Session = Depends(get_db)
):
	# Join Standings with Team and TournamentGroup to get complete information
	query = db.query(models.Standings, models.Team, models.TournamentGroup).outerjoin(
		models.Team, models.Standings.teamid == models.Team.teamid
	).outerjoin(
		models.TournamentGroup, models.Standings.groupid == models.TournamentGroup.groupid
	)
	
	if groupid is not None:
		query = query.filter(models.Standings.groupid == groupid)
	
	results = query.all()
	
	# Convert joined results to StandingsWithTeam objects
	standings_with_teams = []
	for standing, team, group in results:
		standing_data = {
			"standingid": standing.standingid,
			"groupid": standing.groupid,
			"teamid": standing.teamid,
			"matchesplayed": standing.matchesplayed,
			"wins": standing.wins,
			"draws": standing.draws,
			"losses": standing.losses,
			"goalsfor": standing.goalsfor,
			"goalsagainst": standing.goalsagainst,
			"goaldifference": standing.goaldifference,
			"points": standing.points,
			"teamname": team.teamname if team else None,
			"teamlogo": team.logourl if team else None,
			"groupname": group.groupname if group else None,
		}
		standings_with_teams.append(StandingsWithTeam(**standing_data))
	
	return standings_with_teams

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
