from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.deps import get_db
from backend import models, schemas
from backend.auth import require_organizer_or_admin

router = APIRouter(prefix="/goals", tags=["goals"])

@router.get("/match/{match_id}", response_model=List[schemas.goal.GoalWithPlayer])
def get_match_goals(match_id: int, db: Session = Depends(get_db)):
    """Get all goals for a specific match"""
    goals = db.query(models.Goal).filter(models.Goal.matchid == match_id).all()
    
    goals_with_players = []
    for goal in goals:
        # Get player name
        player = db.query(models.Player).filter(models.Player.playerid == goal.playerid).first()
        player_name = None
        if player:
            user = db.query(models.User).filter(models.User.userid == player.userid).first()
            if user:
                player_name = f"{user.firstname or ''} {user.lastname or ''}".strip()
        
        # Get team name
        team = db.query(models.Team).filter(models.Team.teamid == goal.teamid).first()
        team_name = team.teamname if team else None
        
        goal_dict = {
            "goalid": goal.goalid,
            "matchid": goal.matchid,
            "playerid": goal.playerid,
            "teamid": goal.teamid,
            "minute": goal.minute,
            "isowngoal": goal.isowngoal,
            "createdat": goal.createdat,
            "player_name": player_name,
            "team_name": team_name
        }
        goals_with_players.append(goal_dict)
    
    return goals_with_players

@router.post("/", response_model=schemas.goal.Goal)
def create_goal(goal: schemas.goal.GoalCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_organizer_or_admin)):
    """Create a new goal record"""
    
    # Verify the match exists
    match = db.query(models.Match).filter(models.Match.matchid == goal.matchid).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Verify the player exists and is on the team
    player = db.query(models.Player).filter(models.Player.playerid == goal.playerid).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    if player.teamid != goal.teamid:
        raise HTTPException(status_code=400, detail="Player is not on the specified team")
    
    # Create the goal
    db_goal = models.Goal(**goal.dict())
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    
    # Update player stats
    update_player_goal_stats(db, goal.playerid, goal.isowngoal)
    
    return db_goal

@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_organizer_or_admin)):
    """Delete a goal record"""
    goal = db.query(models.Goal).filter(models.Goal.goalid == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Update player stats (subtract the goal)
    update_player_goal_stats(db, goal.playerid, goal.isowngoal, subtract=True)
    
    db.delete(goal)
    db.commit()
    
    return {"message": "Goal deleted successfully"}

def update_player_goal_stats(db: Session, player_id: int, is_own_goal: int, subtract: bool = False):
    """Update player goal statistics"""
    player = db.query(models.Player).filter(models.Player.playerid == player_id).first()
    if not player:
        return
    
    # Get or create player stats
    stats = db.query(models.PlayerStats).filter(models.PlayerStats.statsid == player.statsid).first()
    if not stats:
        # Create new stats record
        stats = models.PlayerStats(
            matchesplayed=0,
            goals=0,
            assists=0,
            yellowcards=0,
            redcards=0,
            mvpcount=0,
            ratingaverage=0
        )
        db.add(stats)
        db.commit()
        db.refresh(stats)
        
        # Update player with stats ID
        player.statsid = stats.statsid
        db.commit()
    
    # Update goal count
    if is_own_goal == 0:  # Regular goal
        if subtract:
            stats.goals = max(0, stats.goals - 1)
        else:
            stats.goals += 1
    # Note: Own goals don't count towards player's goal tally
    
    db.commit()
