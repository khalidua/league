from typing import List
from sqlalchemy import text
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.deps import get_db
from backend import models
from backend.schemas import Team as TeamSchema, TeamCreate, TeamUpdate
from backend.auth import require_organizer_or_admin, require_authenticated_user

router = APIRouter()

@router.get("", response_model=List[TeamSchema])
def list_teams(db: Session = Depends(get_db)):
	return db.query(models.Team).all()

@router.post("", response_model=TeamSchema, status_code=201)
def create_team(payload: TeamCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_organizer_or_admin)):
	team = models.Team(**payload.model_dump())
	db.add(team)
	db.commit()
	db.refresh(team)
	return team

# Players without a team can create a new team and become captain automatically
@router.post("/my", response_model=TeamSchema, status_code=201)
def create_my_team(payload: TeamCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_authenticated_user)):
    # Only non-admin/organizer players without a team may use this
    if current_user.role not in ["Player", "player"]:
        raise HTTPException(403, "Only players can create their own team")

    # Find or create Player record for current_user
    player = db.query(models.Player).filter(models.Player.userid == current_user.userid).first()
    if player and player.teamid:
        raise HTTPException(400, "You are already in a team")

    # Create team
    team = models.Team(**payload.model_dump())
    db.add(team)
    db.commit()
    db.refresh(team)

    # Ensure a player record exists
    if not player:
        player = models.Player(userid=current_user.userid, teamid=None)
        db.add(player)
        db.commit()
        db.refresh(player)

    # Set captain and assign player to team
    team.teamcaptainid = player.playerid
    player.teamid = team.teamid
    db.add(team)
    db.add(player)
    db.commit()
    db.refresh(team)
    return team

@router.post("/{teamid}/disband", status_code=204)
def disband_team(teamid: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_authenticated_user)):
    """Captain-only: remove all players from team and delete the team."""
    team = db.query(models.Team).filter(models.Team.teamid == teamid).first()
    if not team:
        raise HTTPException(404, "Team not found")

    # Ensure current user is captain of this team
    current_player = db.query(models.Player).filter(models.Player.userid == current_user.userid).first()
    if not current_player or current_player.teamid != team.teamid or team.teamcaptainid != current_player.playerid:
        raise HTTPException(403, "Only this team's captain can disband the team")

    # Remove all players from the team
    db.query(models.Player).filter(models.Player.teamid == team.teamid).update({ models.Player.teamid: None })
    # Clear captain ref (not strictly needed before delete, but safe if archiving instead)
    team.teamcaptainid = None
    db.add(team)
    db.commit()

    # Detach team from matches to satisfy FKs (set to NULL)
    try:
        db.execute(text("UPDATE match SET hometeamid = NULL WHERE hometeamid = :tid"), {"tid": team.teamid})
        db.execute(text("UPDATE match SET awayteamid = NULL WHERE awayteamid = :tid"), {"tid": team.teamid})
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(400, "Unable to detach team from matches. Try again or contact admin.")

    # Remove team from match results and tournament/group relations if present
    try:
        # Null out winnerteamid in match results
        db.execute(text("UPDATE matchresult SET winnerteamid = NULL WHERE winnerteamid = :tid"), {"tid": team.teamid})
        try:
            db.query(models.TournamentTeam).filter(models.TournamentTeam.teamid == team.teamid).delete()
        except Exception:
            pass
        try:
            db.query(models.GroupTeam).filter(models.GroupTeam.teamid == team.teamid).delete()
        except Exception:
            pass
        db.commit()
    except Exception:
        db.rollback()
        # Not fatal; continue to attempt delete
        pass

    # Delete the team itself
    db.delete(team)
    db.commit()
    return None

@router.get("/{teamid}", response_model=TeamSchema)
def get_team(teamid: int, db: Session = Depends(get_db)):
	team = db.query(models.Team).filter(models.Team.teamid == teamid).first()
	if not team:
		raise HTTPException(404, "Team not found")
	return team

@router.patch("/{teamid}", response_model=TeamSchema)
def update_team(teamid: int, payload: TeamUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(require_organizer_or_admin)):
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
def delete_team(teamid: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_organizer_or_admin)):
	team = db.query(models.Team).filter(models.Team.teamid == teamid).first()
	if not team:
		raise HTTPException(404, "Team not found")
	db.delete(team)
	db.commit()
	return None
