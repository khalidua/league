from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import GroupTeams as GroupTeamsSchema, GroupTeamsCreate
from backend.auth import require_organizer_or_admin

router = APIRouter()

@router.get("", response_model=List[GroupTeamsSchema])
def list_group_teams(db: Session = Depends(get_db)):
	return db.query(models.GroupTeams).all()

@router.post("", response_model=GroupTeamsSchema, status_code=201)
def create_group_team(payload: GroupTeamsCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_organizer_or_admin)):
	group_team = models.GroupTeams(**payload.model_dump())
	db.add(group_team)
	db.commit()
	db.refresh(group_team)
	
	# Initialize standings for the team in this group
	initialize_team_standings(db, payload.groupid, payload.teamid)
	
	return group_team

@router.delete("/{groupid}/{teamid}", status_code=204)
def delete_group_team(groupid: int, teamid: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_organizer_or_admin)):
	group_team = db.query(models.GroupTeams).filter(
		models.GroupTeams.groupid == groupid,
		models.GroupTeams.teamid == teamid
	).first()
	if not group_team:
		raise HTTPException(404, "Group team not found")
	db.delete(group_team)
	db.commit()
	return None

def initialize_team_standings(db: Session, group_id: int, team_id: int):
	"""Initialize standings record for a team when assigned to a group"""
	
	# Check if standings already exist
	existing_standing = db.query(models.Standings).filter(
		models.Standings.groupid == group_id,
		models.Standings.teamid == team_id
	).first()
	
	if not existing_standing:
		# Create new standings record
		standing = models.Standings(
			groupid=group_id,
			teamid=team_id,
			matchesplayed=0,
			wins=0,
			draws=0,
			losses=0,
			goalsfor=0,
			goalsagainst=0,
			points=0
		)
		db.add(standing)
		db.commit()
