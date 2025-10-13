from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import User as UserSchema, UserUpdate
from pydantic import BaseModel

router = APIRouter()

class UserWithTeam(BaseModel):
    userid: int
    email: str
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    role: str
    status: str
    profileimage: Optional[str] = None
    teamid: Optional[int] = None
    teamname: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("", response_model=List[UserWithTeam])
def list_users(db: Session = Depends(get_db)):
    # Join User with Player and Team to get team information
    query = db.query(models.User, models.Player, models.Team).outerjoin(
        models.Player, models.User.userid == models.Player.userid
    ).outerjoin(
        models.Team, models.Player.teamid == models.Team.teamid
    )
    
    results = query.all()
    
    # Convert joined results to UserWithTeam objects
    users_with_teams = []
    for user, player, team in results:
        user_data = {
            "userid": user.userid,
            "email": user.email,
            "firstname": user.firstname,
            "lastname": user.lastname,
            "role": user.role,
            "status": user.status,
            "profileimage": user.profileimage,
            "teamid": player.teamid if player else None,
            "teamname": team.teamname if team else None,
        }
        users_with_teams.append(UserWithTeam(**user_data))
    
    return users_with_teams

@router.get("/{userid}", response_model=UserSchema)
def get_user(userid: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.userid == userid).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user

@router.patch("/{userid}", response_model=UserSchema)
def update_user(userid: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.userid == userid).first()
    if not user:
        raise HTTPException(404, "User not found")
    
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user