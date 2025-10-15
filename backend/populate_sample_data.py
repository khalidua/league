#!/usr/bin/env python3
"""
Script to populate the database with sample data for testing the admin dashboard.
This creates sample teams, tournaments, matches, and users.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models
from backend.auth import get_password_hash
from datetime import datetime, timedelta
import random

def create_sample_data():
    """Create sample data for testing"""
    db = SessionLocal()
    
    try:
        print("🏗️ Creating sample data for ZC League...")
        
        # Create sample teams
        teams_data = [
            {"teamname": "Thunder FC", "description": "Fast and powerful team"},
            {"teamname": "Lightning United", "description": "Quick and agile players"},
            {"teamname": "Storm Riders", "description": "Unstoppable force"},
            {"teamname": "Fire Hawks", "description": "Intense and focused"},
            {"teamname": "Ice Wolves", "description": "Cool and calculated"},
            {"teamname": "Wind Strikers", "description": "Swift and precise"}
        ]
        
        teams = []
        for team_data in teams_data:
            existing_team = db.query(models.Team).filter(models.Team.teamname == team_data["teamname"]).first()
            if not existing_team:
                team = models.Team(**team_data)
                db.add(team)
                teams.append(team)
            else:
                teams.append(existing_team)
        
        db.commit()
        print(f"✅ Created {len(teams)} teams")
        
        # Create sample tournament
        tournament_data = {
            "name": "ZC League Championship 2024",
            "seasonyear": 2024,
            "startdate": datetime.now().date(),
            "enddate": (datetime.now() + timedelta(days=90)).date(),
            "description": "The ultimate championship tournament"
        }
        
        existing_tournament = db.query(models.Tournament).filter(models.Tournament.name == tournament_data["name"]).first()
        if not existing_tournament:
            tournament = models.Tournament(**tournament_data)
            db.add(tournament)
            db.commit()
            db.refresh(tournament)
        else:
            tournament = existing_tournament
        
        print(f"✅ Created tournament: {tournament.name}")
        
        # Create tournament groups
        groups_data = [
            {"groupname": "Group A"},
            {"groupname": "Group B"},
            {"groupname": "Group C"}
        ]
        
        groups = []
        for group_data in groups_data:
            existing_group = db.query(models.TournamentGroup).filter(
                models.TournamentGroup.tournamentid == tournament.tournamentid,
                models.TournamentGroup.groupname == group_data["groupname"]
            ).first()
            
            if not existing_group:
                group = models.TournamentGroup(
                    tournamentid=tournament.tournamentid,
                    groupname=group_data["groupname"]
                )
                db.add(group)
                groups.append(group)
            else:
                groups.append(existing_group)
        
        db.commit()
        print(f"✅ Created {len(groups)} tournament groups")
        
        # Assign teams to tournament
        tournament_teams_created = 0
        for team in teams:
            existing_entry = db.query(models.TournamentTeam).filter(
                models.TournamentTeam.tournamentid == tournament.tournamentid,
                models.TournamentTeam.teamid == team.teamid
            ).first()
            
            if not existing_entry:
                entry = models.TournamentTeam(
                    tournamentid=tournament.tournamentid,
                    teamid=team.teamid
                )
                db.add(entry)
                tournament_teams_created += 1
        
        db.commit()
        print(f"✅ Registered {tournament_teams_created} teams for tournament")
        
        # Assign teams to groups (2 teams per group)
        group_teams_created = 0
        for i, team in enumerate(teams[:6]):  # Assign first 6 teams to groups
            group = groups[i % len(groups)]
            
            existing_assignment = db.query(models.GroupTeams).filter(
                models.GroupTeams.groupid == group.groupid,
                models.GroupTeams.teamid == team.teamid
            ).first()
            
            if not existing_assignment:
                assignment = models.GroupTeams(
                    groupid=group.groupid,
                    teamid=team.teamid
                )
                db.add(assignment)
                group_teams_created += 1
        
        db.commit()
        print(f"✅ Assigned {group_teams_created} teams to groups")
        
        # Initialize standings for teams in groups
        standings_created = 0
        for i, team in enumerate(teams[:6]):  # For teams assigned to groups
            group = groups[i % len(groups)]
            
            # Check if standings already exist
            existing_standing = db.query(models.Standings).filter(
                models.Standings.groupid == group.groupid,
                models.Standings.teamid == team.teamid
            ).first()
            
            if not existing_standing:
                standing = models.Standings(
                    groupid=group.groupid,
                    teamid=team.teamid,
                    matchesplayed=0,
                    wins=0,
                    draws=0,
                    losses=0,
                    goalsfor=0,
                    goalsagainst=0,
                    points=0
                )
                db.add(standing)
                standings_created += 1
        
        db.commit()
        print(f"✅ Created {standings_created} initial standings records")
        
        # Create sample matches
        matches_data = []
        match_dates = [
            datetime.now() + timedelta(days=1),
            datetime.now() + timedelta(days=3),
            datetime.now() + timedelta(days=5),
            datetime.now() + timedelta(days=7),
            datetime.now() - timedelta(days=2),  # Completed match
            datetime.now() - timedelta(days=4),  # Completed match
        ]
        
        for i, match_date in enumerate(match_dates):
            home_team = teams[i % len(teams)]
            away_team = teams[(i + 1) % len(teams)]
            
            status = "Finished" if match_date < datetime.now() else "Upcoming"
            
            match_data = {
                "tournamentid": tournament.tournamentid,
                "hometeamid": home_team.teamid,
                "awayteamid": away_team.teamid,
                "matchdate": match_date,
                "round": "Group",
                "status": status
            }
            
            existing_match = db.query(models.Match).filter(
                models.Match.hometeamid == home_team.teamid,
                models.Match.awayteamid == away_team.teamid,
                models.Match.matchdate == match_date
            ).first()
            
            if not existing_match:
                match = models.Match(**match_data)
                db.add(match)
                matches_data.append(match)
        
        db.commit()
        print(f"✅ Created {len(matches_data)} matches")
        
        # Create match results for finished matches
        completed_matches = [m for m in matches_data if m.status == "Finished"]
        for match in completed_matches:
            existing_result = db.query(models.MatchResult).filter(models.MatchResult.matchid == match.matchid).first()
            if not existing_result:
                home_score = random.randint(0, 4)
                away_score = random.randint(0, 4)
                
                result_data = {
                    "matchid": match.matchid,
                    "homescore": home_score,
                    "awayscore": away_score
                }
                result = models.MatchResult(**result_data)
                db.add(result)
                
                # Update standings for this match result
                update_standings_from_result(db, match, home_score, away_score)
        
        db.commit()
        print(f"✅ Created match results for {len(completed_matches)} finished matches")
        
        # Create sample users
        users_data = [
            {"email": "john.doe@example.com", "firstname": "John", "lastname": "Doe", "role": "Player"},
            {"email": "jane.smith@example.com", "firstname": "Jane", "lastname": "Smith", "role": "Player"},
            {"email": "mike.johnson@example.com", "firstname": "Mike", "lastname": "Johnson", "role": "Player"},
            {"email": "sarah.wilson@example.com", "firstname": "Sarah", "lastname": "Wilson", "role": "Player"},
            {"email": "david.brown@example.com", "firstname": "David", "lastname": "Brown", "role": "Player"},
            {"email": "lisa.davis@example.com", "firstname": "Lisa", "lastname": "Davis", "role": "Player"},
            {"email": "coach.martinez@example.com", "firstname": "Carlos", "lastname": "Martinez", "role": "Coach"},
            {"email": "referee.taylor@example.com", "firstname": "Robert", "lastname": "Taylor", "role": "Player"},
        ]
        
        created_users = []
        for user_data in users_data:
            existing_user = db.query(models.User).filter(models.User.email == user_data["email"]).first()
            if not existing_user:
                user = models.User(
                    email=user_data["email"],
                    passwordhash=get_password_hash("password123"),
                    firstname=user_data["firstname"],
                    lastname=user_data["lastname"],
                    role=user_data["role"],
                    status="active",
                    profileimage="https://res.cloudinary.com/dns6zhmc2/image/upload/v1760475598/defaultPlayer_vnbpfb.png"
                )
                db.add(user)
                created_users.append(user)
        
        db.commit()
        print(f"✅ Created {len(created_users)} users")
        
        # Create player records for some users
        players_created = 0
        for i, user in enumerate(created_users[:6]):  # Create players for first 6 users
            if user.role == "Player":
                existing_player = db.query(models.Player).filter(models.Player.userid == user.userid).first()
                if not existing_player:
                    # Create player stats first
                    stats = models.PlayerStats(
                        matchesplayed=random.randint(0, 10),
                        goals=random.randint(0, 15),
                        assists=random.randint(0, 10),
                        yellowcards=random.randint(0, 3),
                        redcards=random.randint(0, 1),
                        mvpcount=random.randint(0, 2),
                        ratingaverage=round(random.uniform(6.0, 9.5), 1)
                    )
                    db.add(stats)
                    db.commit()
                    db.refresh(stats)
                    
                    # Create player record
                    positions = ["GK", "DEF", "MID", "FWD"]
                    player = models.Player(
                        userid=user.userid,
                        teamid=teams[i % len(teams)].teamid,
                        position=positions[i % len(positions)],
                        jerseynumber=i + 1,
                        statsid=stats.statsid,
                        preferredfoot="Right" if i % 2 == 0 else "Left",
                        height=round(random.uniform(1.70, 1.90), 2),
                        weight=round(random.uniform(65, 85), 1)
                    )
                    db.add(player)
                    players_created += 1
        
        db.commit()
        print(f"✅ Created {players_created} player records")
        
        print("\n🎉 Sample data creation completed!")
        print("\nSummary:")
        print(f"- Teams: {len(teams)}")
        print(f"- Tournament: {tournament.name}")
        print(f"- Groups: {len(groups)}")
        print(f"- Tournament Teams: {tournament_teams_created}")
        print(f"- Group Assignments: {group_teams_created}")
        print(f"- Initial Standings: {standings_created}")
        print(f"- Matches: {len(matches_data)}")
        print(f"- Users: {len(created_users)}")
        print(f"- Players: {players_created}")
        print(f"- Match Results: {len(completed_matches)}")
        
        print("\nYou can now test the admin dashboard with real data!")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

def update_standings_from_result(db: Session, match: models.Match, home_score: int, away_score: int):
    """Update standings for both teams based on match result"""
    
    # Find the group for this match (teams should be in the same group)
    home_team_group = db.query(models.GroupTeams).filter(
        models.GroupTeams.teamid == match.hometeamid
    ).first()
    
    away_team_group = db.query(models.GroupTeams).filter(
        models.GroupTeams.teamid == match.awayteamid
    ).first()
    
    # Both teams should be in the same group
    if not home_team_group or not away_team_group:
        return  # Can't update standings if teams aren't in groups
    
    if home_team_group.groupid != away_team_group.groupid:
        return  # Teams must be in the same group
    
    group_id = home_team_group.groupid
    
    # Get standings for home team
    home_standing = db.query(models.Standings).filter(
        models.Standings.groupid == group_id,
        models.Standings.teamid == match.hometeamid
    ).first()
    
    # Get standings for away team
    away_standing = db.query(models.Standings).filter(
        models.Standings.groupid == group_id,
        models.Standings.teamid == match.awayteamid
    ).first()
    
    if not home_standing or not away_standing:
        return  # Standings should exist from initialization
    
    # Update home team standings
    home_standing.matchesplayed += 1
    home_standing.goalsfor += home_score
    home_standing.goalsagainst += away_score
    
    # Update away team standings
    away_standing.matchesplayed += 1
    away_standing.goalsfor += away_score
    away_standing.goalsagainst += home_score
    
    # Determine winner and update points
    if home_score > away_score:
        # Home team wins
        home_standing.wins += 1
        home_standing.points += 3
        away_standing.losses += 1
    elif away_score > home_score:
        # Away team wins
        away_standing.wins += 1
        away_standing.points += 3
        home_standing.losses += 1
    else:
        # Draw
        home_standing.draws += 1
        home_standing.points += 1
        away_standing.draws += 1
        away_standing.points += 1
    
    # Save changes
    db.add(home_standing)
    db.add(away_standing)

if __name__ == "__main__":
    create_sample_data()
