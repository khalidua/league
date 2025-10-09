from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import GroupTeams as GroupTeamsSchema, GroupTeamsCreate

router = APIRouter()

@router.get("/", response_model=List[GroupTeamsSchema])
def list_group_teams(db: Session = Depends(get_db)):
	return db.query(models.GroupTeams).all()

@router.post("/", response_model=GroupTeamsSchema, status_code=201)
def create_group_team(payload: GroupTeamsCreate, db: Session = Depends(get_db)):
	group_team = models.GroupTeams(**payload.model_dump())
	db.add(group_team)
	db.commit()
	db.refresh(group_team)
	return group_team

@router.delete("/{groupid}/{teamid}", status_code=204)
def delete_group_team(groupid: int, teamid: int, db: Session = Depends(get_db)):
	group_team = db.query(models.GroupTeams).get((groupid, teamid))
	if not group_team:
		raise HTTPException(404, "Group team not found")
	db.delete(group_team)
	db.commit()
	return None
