import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PlayerCard from '../components/PlayerCard';
import Carousel from '../components/Carousel';
import "./Home.css"
import StandingsTable, { type StandingsTeam } from '../components/StandingsTable';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import crisLogo from '../assets/cris.png';
import realLogo from '../assets/realLogo.png';
import manLogo from '../assets/manLogo.png';
import reactLogo from '../assets/react.svg';
import lockIcon from '../assets/icons8-lock-24.png';
import defaultTeamLogo from '../assets/default_team.png';
const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [upcomingMatch, setUpcomingMatch] = useState<any>(null);
  const [matchLoading, setMatchLoading] = useState(true);
  const [matchError, setMatchError] = useState<string | null>(null);
  
  // Fetch upcoming match data
  useEffect(() => {
    const fetchUpcomingMatch = async () => {
      try {
        setMatchLoading(true);
        setMatchError(null);
        const matchData = await api.getNextUpcomingMatch();
        setUpcomingMatch(matchData);
      } catch (error) {
        console.error('Failed to fetch upcoming match:', error);
        setMatchError('Failed to load upcoming match');
      } finally {
        setMatchLoading(false);
      }
    };

    fetchUpcomingMatch();
  }, []);

  // Helper function to format match date
  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
  };
  
  const demoTeams: StandingsTeam[] = [
    {
      id: 1,
      name: 'CRIS FC',
      logoUrl: crisLogo,
      played: 10,
      wins: 7,
      draws: 2,
      losses: 1,
      goalsFor: 20,
      goalsAgainst: 9,
      goalDifference: 11,
      points: 23,
      form: 'W-W-D-W-W'
    },
    {
      id: 2,
      name: 'React United',
      logoUrl: reactLogo,
      played: 10,
      wins: 6,
      draws: 3,
      losses: 1,
      goalsFor: 18,
      goalsAgainst: 8,
      goalDifference: 10,
      points: 21,
      form: 'W-D-W-W-D'
    },
    {
      id: 3,
      name: 'Vite City',
      logoUrl: reactLogo,
      played: 10,
      wins: 5,
      draws: 3,
      losses: 2,
      goalsFor: 15,
      goalsAgainst: 10,
      goalDifference: 5,
      points: 18,
      form: 'D-W-L-W-D'
    }
  ];
  const groupA: StandingsTeam[] = demoTeams;
  const groupB: StandingsTeam[] = [
    { id: 'b1', name: 'Man Devs', logoUrl: manLogo, played: 10, wins: 6, draws: 2, losses: 2, goalsFor: 17, goalsAgainst: 9, goalDifference: 8, points: 20, form: 'W-W-D-L-W' },
    { id: 'b2', name: 'Real Coders', logoUrl: realLogo, played: 10, wins: 6, draws: 1, losses: 3, goalsFor: 16, goalsAgainst: 12, goalDifference: 4, points: 19, form: 'W-L-W-W-L' },
    { id: 'b3', name: 'Vite City', logoUrl: reactLogo, played: 10, wins: 5, draws: 3, losses: 2, goalsFor: 14, goalsAgainst: 11, goalDifference: 3, points: 18, form: 'D-W-W-L-D' }
  ];

  const groups: { title: string; teams: StandingsTeam[] }[] = [
    { title: 'Group A', teams: groupA },
    { title: 'Group B', teams: groupB }
  ];

  return (
    <>
      <div className='Home'>
        <div className='Hero'>
          <div className='match-details'>
            <h1>Upcoming Match</h1>
            {matchLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Spinner color="white" size="sm" />
                <span>Loading match details...</span>
              </div>
            ) : matchError ? (
              <div>
                <h2>No upcoming matches</h2>
                <p>Check back later for upcoming matches</p>
              </div>
            ) : upcomingMatch && !upcomingMatch.message ? (
              <>
                <h2>
                  <strong>{upcomingMatch.hometeam?.teamname || 'TBD'}</strong> vs <strong>{upcomingMatch.awayteam?.teamname || 'TBD'}</strong>
                </h2>
                <p>📅 {formatMatchDate(upcomingMatch.matchdate)}</p>
                <p>📍 {upcomingMatch.stadium?.name || 'TBD'} {upcomingMatch.stadium?.location ? `— ${upcomingMatch.stadium.location}` : ''}</p>
                <p>🏆 {upcomingMatch.round} Round</p>
                <button>View Full Schedule</button>
              </>
            ) : (
              <div>
                <h2>No upcoming matches</h2>
                <p>Check back later for upcoming matches</p>
              </div>
            )}
          </div>
          <div className='logos'>
            {matchLoading ? (
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spinner color="white" size="sm" />
                </div>
                <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spinner color="white" size="sm" />
                </div>
              </div>
            ) : upcomingMatch && !upcomingMatch.message ? (
              <>
                <img 
                  className='team1' 
                  src={upcomingMatch.hometeam?.logourl || defaultTeamLogo} 
                  alt={upcomingMatch.hometeam?.teamname || 'Home Team'}
                />
                <img 
                  className='team2' 
                  src={upcomingMatch.awayteam?.logourl || defaultTeamLogo} 
                  alt={upcomingMatch.awayteam?.teamname || 'Away Team'}
                />
              </>
            ) : (
              <>
                <img className='team1' src={defaultTeamLogo} alt="Team 1" />
                <img className='team2' src={defaultTeamLogo} alt="Team 2" />
              </>
            )}
          </div>
        </div>
        <div className='team'><h2>MY TEAM</h2></div>
        <div className="team-section-container">
          <div className={`players ${!isAuthenticated ? 'blurred-section' : ''}`}>
            <Carousel autoplayMs={4000}>
              <PlayerCard />
              <PlayerCard />
              <PlayerCard />
              <PlayerCard />
              <PlayerCard />
              <PlayerCard />
              <PlayerCard />
              <PlayerCard />
            </Carousel>
          </div>
          {!isAuthenticated && (
            <div className="login-overlay">
              <div className="login-prompt">
                <div className="login-icon"><img src={lockIcon} alt="Lock" style={{filter: "brightness(0) invert(1)"}}/></div>
                <h3>Login to View Your Team</h3>
                <p>Sign in to see your team players and manage your squad</p>
                <div className="login-actions">
                  <Link to="/login" className="login-btn primary">Login</Link>
                  <Link to="/register" className="login-btn secondary">Register</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      <div className='standing' style={{ marginTop: '24px' }}>
        <div className='standing-grid'>
        {groups.map(g => {
          const top3 = [...g.teams].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
          }).slice(0, 3);
          return (
            <div key={g.title} style={{ marginBottom: '24px' }}>
              <StandingsTable title={g.title} teams={top3} showForm />
            </div>
          );
        })}
        </div>
        <div className='standings-actions'>
          <Link className='standings-cta' to="/standings">See full standings</Link>
        </div>
      </div>
      </div>
    </>
  );
};

export default Home;
