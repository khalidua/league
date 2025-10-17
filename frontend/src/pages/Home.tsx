import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PlayerCard from '../components/PlayerCard';
import Carousel from '../components/Carousel';
import "./Home.css"
import StandingsTable, { type StandingsTeam } from '../components/StandingsTable';
import AdminDashboard from './AdminDashboard';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import crisLogo from '../assets/cris.png';
import realLogo from '../assets/realLogo.png';
import manLogo from '../assets/manLogo.png';
import reactLogo from '../assets/react.svg';
import lockIcon from '../assets/icons8-lock-24.png';
import defaultTeamLogo from '../assets/default_team.png';
import { capitalizeFirstLetter } from '../utils/nameUtils';
import { getPlayerImage, getTeamLogo } from '../utils/defaultImages';
const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  
  // Debug user data
  console.log('Home page - user data:', user);
  console.log('Home page - isAuthenticated:', isAuthenticated);
  const [upcomingMatch, setUpcomingMatch] = useState<any>(null);
  const [matchLoading, setMatchLoading] = useState(true);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  // Create team inline form state
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  
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

  // Fetch team players when user has a team
  useEffect(() => {
    const fetchTeamPlayers = async () => {
      if (!isAuthenticated || !user?.teamid) return;
      
      try {
        setTeamLoading(true);
        setTeamError(null);
        const players = await api.listPlayers({ teamid: user.teamid });
        setTeamPlayers(players || []);
      } catch (error) {
        console.error('Failed to fetch team players:', error);
        setTeamError('Failed to load team players');
      } finally {
        setTeamLoading(false);
      }
    };

    fetchTeamPlayers();
  }, [isAuthenticated, user?.teamid]);

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
  
  const [groups, setGroups] = useState<{ title: string; teams: StandingsTeam[] }[]>([]);

  useEffect(() => {
    const loadStandings = async () => {
      try {
        const [groupsData, standingsData, teamsData, resultsData, matchesData] = await Promise.all([
          api.listTournamentGroups(),
          api.listStandings(),
          api.listTeams(),
          api.listMatchResults(),
          api.listMatches(),
        ]);

        const teamById: Record<number, any> = {};
        (teamsData || []).forEach((t: any) => { teamById[Number(t.teamid)] = t; });

        // index matches by id for quick lookup (date and teams)
        const matchById: Record<number, any> = {};
        (matchesData || []).forEach((m: any) => { matchById[Number(m.matchid)] = m; });

        const groupsTop: { title: string; teams: StandingsTeam[] }[] = (groupsData || []).map((g: any) => {
          const groupStandings = (standingsData || []).filter((s: any) => s.groupid === g.groupid);
          const sorted = groupStandings.sort((a: any, b: any) => {
            if (b.points !== a.points) return b.points - a.points;
            const gdA = (a.goalsfor || 0) - (a.goalsagainst || 0);
            const gdB = (b.goalsfor || 0) - (b.goalsagainst || 0);
            if (gdB !== gdA) return gdB - gdA;
            return (b.goalsfor || 0) - (a.goalsfor || 0);
          }).slice(0, 3);

          const top3: StandingsTeam[] = sorted.map((s: any) => {
            const team = teamById[Number(s.teamid)] || {};
            const played = (s.wins || 0) + (s.draws || 0) + (s.losses || 0);
            // compute recent form from latest 5 results involving this team
            const teamResults = (resultsData || [])
              .filter((r: any) => {
                const m = matchById[Number(r.matchid)];
                if (!m) return false;
                return Number(m.hometeamid) === Number(s.teamid) || Number(m.awayteamid) === Number(s.teamid);
              })
              .sort((ra: any, rb: any) => {
                const ma = matchById[Number(ra.matchid)];
                const mb = matchById[Number(rb.matchid)];
                const da = ma ? new Date(ma.matchdate).getTime() : 0;
                const db = mb ? new Date(mb.matchdate).getTime() : 0;
                return db - da; // newest first
              })
              .slice(0, 5);

            const formStr = teamResults.map((r: any) => {
              if (r.winnerteamid == null) return 'D';
              return Number(r.winnerteamid) === Number(s.teamid) ? 'W' : 'L';
            }).join('-');
            return {
              id: s.teamid,
              name: team.teamname || `Team ${s.teamid}`,
              logoUrl: team.logourl || defaultTeamLogo,
              played,
              wins: s.wins || 0,
              draws: s.draws || 0,
              losses: s.losses || 0,
              goalsFor: s.goalsfor || 0,
              goalsAgainst: s.goalsagainst || 0,
              goalDifference: (s.goalsfor || 0) - (s.goalsagainst || 0),
              points: s.points || 0,
              form: formStr,
            } as StandingsTeam;
          });

          return { title: g.groupname || `Group ${g.groupid}`, teams: top3 };
        });

        setGroups(groupsTop);
      } catch (e) {
        // keep demo empty if load fails
        setGroups([]);
      }
    };

    loadStandings();
  }, []);

  if (isAdmin) {
    return <AdminDashboard />;
  }

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
                  src={getTeamLogo(upcomingMatch.hometeam?.logourl)} 
                  alt={upcomingMatch.hometeam?.teamname || 'Home Team'}
                />
                <img 
                  className='team2' 
                  src={getTeamLogo(upcomingMatch.awayteam?.logourl)} 
                  alt={upcomingMatch.awayteam?.teamname || 'Away Team'}
                />
              </>
            ) : (
              <>
                <img className='team1' src={getTeamLogo()} alt="Team 1" />
                <img className='team2' src={getTeamLogo()} alt="Team 2" />
              </>
            )}
          </div>
        </div>
        {!isAdmin && (
          <div className='team'>
            <h2>MY TEAM</h2>
            {isAuthenticated && user?.teamid && user?.teamname ? (
              <div className="team-info">
                <img src={getTeamLogo(user.teamlogo)} alt={user.teamname} className="team-logo" />
                <span className="team-name">{user.teamname}</span>
              </div>
            ) : isAuthenticated && user?.teamid ? (
              <div className="team-info">
                <img src={getTeamLogo()} alt="Your Team" className="team-logo" />
                <span className="team-name">Your Team</span>
              </div>
            ) : null}
          </div>
        )}
        <div className="team-section-container">
          {!isAuthenticated ? (
            <>
              <div className="players blurred-section">
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
            </>
          ) : user?.teamid ? (
            <div className="players">
              {teamLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'white' }}>
                  <Spinner color="white" size="md" />
                  <span style={{ marginLeft: '15px' }}>Loading team players...</span>
                </div>
              ) : teamError ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>
                  <p>{teamError}</p>
                </div>
              ) : teamPlayers.length > 0 ? (
                <Carousel autoplayMs={4000} teamId={user?.teamid}>
                  {teamPlayers.map((player: any) => (
                    <PlayerCard 
                      key={player.playerid}
                      player={{
                        playerid: player.playerid,
                        firstname: capitalizeFirstLetter(player.firstname) || '',
                        lastname: capitalizeFirstLetter(player.lastname) || '',
                        position: player.position || 'Unknown',
                        jerseynumber: player.jerseynumber,
                        profileimage: getPlayerImage(player.profileimage)
                      }}
                    />
                  ))}
                </Carousel>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>
                  <p>No players found in your team</p>
                </div>
              )}
            </div>
          ) : (!isAdmin ? (
            <div className="no-team-section">
              <div className="no-team-content">
                <div className="no-team-icon">⚽</div>
                <h3>You're not in a team yet</h3>
                <p>Join a team to start playing and see your teammates here</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/teams" className="join-team-btn">
                    Browse Teams
                  </Link>
                  <button
                    className="join-team-btn"
                    onClick={() => setShowCreate(v => !v)}
                  >
                    {showCreate ? 'Close' : 'Create Team'}
                  </button>
                </div>
                {showCreate && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Enter new team name"
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(243,242,236,0.2)',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#F3F2EC',
                        minWidth: 220
                      }}
                    />
                    <button
                      className="join-team-btn"
                      disabled={creating || !newTeamName.trim()}
                      onClick={async () => {
                        setCreating(true);
                        try {
                          await api.createMyTeam({ teamname: newTeamName.trim() });
                          window.location.reload();
                        } catch {
                        } finally {
                          setCreating(false);
                        }
                      }}
                    >
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null)}
        </div>
      <div className='standing' style={{ marginTop: '24px' }}>
        {(() => {
          const visibleGroups = groups.filter(g => (g.teams && g.teams.length > 0));
          const gridClass = `standing-grid${visibleGroups.length === 1 ? ' single' : ''}`;
          return (
            <div className={gridClass}>
        {visibleGroups.map(g => {
          const top3 = [...g.teams].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
          }).slice(0, 3);
          return (
            <div key={g.title} className='standings-wrapper' style={{ marginBottom: '24px' }}>
              <StandingsTable title={g.title} teams={top3} showForm />
            </div>
          );
        })}
            </div>
          );
        })()}
        <div className='standings-actions'>
          <Link className='standings-cta' to="/standings">See full standings</Link>
        </div>
      </div>
      </div>
    </>
  );
};

export default Home;
