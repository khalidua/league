import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import './AdminDashboard.css';

interface DashboardStats {
  totalPlayers: number;
  totalTeams: number;
  totalMatches: number;
  upcomingMatches: number;
  completedMatches: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'player_registered' | 'player_joined_team' | 'match_completed' | 'team_created' | 'tournament_created';
  description: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard statistics
      const [users, players, teams, matches] = await Promise.all([
        api.listUsers(),
        api.listPlayers(),
        api.listTeams(),
        api.listMatches()
      ]);

      const upcomingMatches = matches.filter((match: any) => match.status === 'Upcoming').length;
      const completedMatches = matches.filter((match: any) => match.status === 'Finished').length;

      setStats({
        totalPlayers: players.length,
        totalTeams: teams.length,
        totalMatches: matches.length,
        upcomingMatches,
        completedMatches
      });

      // Generate recent activity from real data
      const activities: RecentActivity[] = [];
      
      // Add recent user registrations
      const recentUsers = users
        .sort((a: any, b: any) => new Date(b.joindate).getTime() - new Date(a.joindate).getTime())
        .slice(0, 3);
      
      recentUsers.forEach((user: any) => {
        activities.push({
          id: `user_${user.userid}`,
          type: 'user_registered',
          description: `New ${user.role.toLowerCase()} ${user.firstname} ${user.lastname} registered`,
          timestamp: user.joindate
        });
      });

      // Add recent matches
      const recentMatches = matches
        .filter((match: any) => match.status === 'Finished')
        .sort((a: any, b: any) => new Date(b.matchdate).getTime() - new Date(a.matchdate).getTime())
        .slice(0, 2);
      
      recentMatches.forEach((match: any) => {
        activities.push({
          id: `match_${match.matchid}`,
          type: 'match_completed',
          description: `Match: ${match.hometeamname} vs ${match.awayteamname} completed`,
          timestamp: match.matchdate
        });
      });

      // Add recent teams
      const recentTeams = teams
        .sort((a: any, b: any) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime())
        .slice(0, 2);
      
      recentTeams.forEach((team: any) => {
        activities.push({
          id: `team_${team.teamid}`,
          type: 'team_created',
          description: `New team "${team.teamname}" created`,
          timestamp: team.createdat
        });
      });

      // Add recent player registrations
      const recentPlayerRegistrations = players
        .filter((player: any) => player.registered_at)
        .sort((a: any, b: any) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime())
        .slice(0, 3);
      
      recentPlayerRegistrations.forEach((player: any) => {
        activities.push({
          id: `player_reg_${player.playerid}`,
          type: 'player_registered',
          description: `Player ${player.firstname} ${player.lastname} registered`,
          timestamp: player.registered_at
        });
      });

      // Add recent team joins
      const recentTeamJoins = players
        .filter((player: any) => player.joined_team_at && player.teamname)
        .sort((a: any, b: any) => new Date(b.joined_team_at).getTime() - new Date(a.joined_team_at).getTime())
        .slice(0, 3);
      
      recentTeamJoins.forEach((player: any) => {
        activities.push({
          id: `player_join_${player.playerid}`,
          type: 'player_joined_team',
          description: `${player.firstname} ${player.lastname} joined ${player.teamname}`,
          timestamp: player.joined_team_at
        });
      });

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 5)); // Show only 5 most recent

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return '👤';
      case 'player_registered':
        return '⚽';
      case 'player_joined_team':
        return '🤝';
      case 'match_completed':
        return '🏁';
      case 'team_created':
        return '🏆';
      case 'tournament_created':
        return '🎯';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <Spinner color="white" size="lg" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user?.firstname} {user?.lastname}</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          Live Match Dashboard
        </button>
        <button 
          className={`tab ${activeTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          Tournaments
        </button>
        <button 
          className={`tab ${activeTab === 'tournament-teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournament-teams')}
        >
          Tournament Teams
        </button>
        <button 
          className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Groups
        </button>
        <button 
          className={`tab ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          Teams
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 11 11" aria-hidden>
                    <path d="M9 1.25a1.25 1.25 0 1 1-2.5-.001A1.25 1.25 0 0 1 9 1.25zm0 7.23a1 1 0 1 0 0 2a1 1 0 0 0 0-2zm1.81-3.39L8.94 3.18A.48.48 0 0 0 8.56 3H1.51a.5.5 0 0 0 0 1H5L2.07 8.3a.488.488 0 0 0 0 .2a.511.511 0 0 0 1 .21H3L4.16 7H6l-1.93 3.24a.49.49 0 0 0-.07.26a.51.51 0 0 0 1 .2l3.67-6.38l1.48 1.48a.5.5 0 1 0 .7-.71h-.04z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <h3>{stats?.totalPlayers || 0}</h3>
                  <p>Players</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M12 10a4 4 0 1 0 0-8a4 4 0 0 0 0 8Zm-6.5 3a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5ZM21 10.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0Zm-9 .5a5 5 0 0 1 5 5v6H7v-6a5 5 0 0 1 5-5Zm-7 5c0-.693.1-1.362.288-1.994l-.17.014A3.5 3.5 0 0 0 2 17.5V22h3v-6Zm17 6v-4.5a3.5 3.5 0 0 0-3.288-3.494c.187.632.288 1.301.288 1.994v6h3Z"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <h3>{stats?.totalTeams || 0}</h3>
                  <p>Teams</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M2 19c0 1.7 1.3 3 3 3h14c1.7 0 3-1.3 3-3v-8H2zM19 4h-2V3c0-.6-.4-1-1-1s-1 .4-1 1v1H9V3c0-.6-.4-1-1-1s-1 .4-1 1v1H5C3.3 4 2 5.3 2 7v2h20V7c0-1.7-1.3-3-3-3"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <h3>{stats?.totalMatches || 0}</h3>
                  <p>Total Matches</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M12 22q-1.875 0-3.513-.713t-2.85-1.924q-1.212-1.213-1.924-2.85T3 13q0-1.875.713-3.513t1.924-2.85q1.213-1.212 2.85-1.924T12 4q1.875 0 3.513.713t2.85 1.925q1.212 1.212 1.925 2.85T21 13q0 1.875-.713 3.513t-1.924 2.85q-1.213 1.212-2.85 1.925T12 22Zm2.8-4.8l1.4-1.4l-3.2-3.2V8h-2v5.4l3.8 3.8ZM5.6 2.35L7 3.75L2.75 8l-1.4-1.4L5.6 2.35Zm12.8 0l4.25 4.25l-1.4 1.4L17 3.75l1.4-1.4Z"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <h3>{stats?.upcomingMatches || 0}</h3>
                  <p>Upcoming</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M16.972 6.251a1.999 1.999 0 0 0-2.72.777l-3.713 6.682l-2.125-2.125a2 2 0 1 0-2.828 2.828l4 4c.378.379.888.587 1.414.587l.277-.02a2 2 0 0 0 1.471-1.009l5-9a2 2 0 0 0-.776-2.72z"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <h3>{stats?.completedMatches || 0}</h3>
                  <p>Finished</p>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="activity-content">
                      <p>{activity.description}</p>
                      <span className="activity-time">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="matches-tab">
            <MatchManagement onMatchResultEntered={loadDashboardData} />
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="tournaments-tab">
            <TournamentManagement />
          </div>
        )}

        {activeTab === 'tournament-teams' && (
          <div className="tournament-teams-tab">
            <TournamentTeamManagement />
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="groups-tab">
            <GroupManagement />
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="teams-tab">
            <TeamManagement />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-tab">
            <UserManagement />
          </div>
        )}
      </div>
    </div>
  );
};

// Match Management Component (Replaced with simplified live operator dashboard)
const MatchManagement: React.FC<{ onMatchResultEntered?: () => void }> = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [homePlayers, setHomePlayers] = useState<any[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<any[]>([]);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [clockRunning, setClockRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastTick, setLastTick] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [playerId, setPlayerId] = useState<string>('');
  // removed assist selection per request
  const [notes, setNotes] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  const [lastActionAt, setLastActionAt] = useState<number>(0);
  const [selectedEventType, setSelectedEventType] = useState<'goal' | 'yellow' | 'red' | null>(null);
  // MVP selection for finishMatch
  const [mvpPlayerId, setMvpPlayerId] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const m = await api.listMatches();
        setMatches(m || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let raf: number | null = null;
    if (clockRunning) {
      const step = (ts: number) => {
        if (lastTick == null) setLastTick(ts);
        else {
          const d = Math.floor((ts - lastTick) / 1000);
          if (d >= 1) { setElapsedSeconds((s) => s + d); setLastTick(ts); }
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [clockRunning, lastTick]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const r = (s % 60).toString().padStart(2, '0');
    return `${m}:${r}`;
  };

  const loadPlayers = async (match: any) => {
    try {
      const [hp, ap] = await Promise.all([
        api.listPlayers({ teamid: match.hometeamid }),
        api.listPlayers({ teamid: match.awayteamid })
      ]);
      setHomePlayers(hp || []);
      setAwayPlayers(ap || []);
    } catch {}
  };

  const onSelectMatch = async (id: string) => {
    const match = matches.find((m) => String(m.matchid) === id);
    setSelectedMatch(match || null);
    setHomeScore(0);
    setAwayScore(0);
    setElapsedSeconds(0);
    setClockRunning(false);
    setPlayerId('');
    // assist removed
    setNotes('');
    setEvents([]);
    if (match) await loadPlayers(match);
  };

  const throttle = () => {
    const now = Date.now();
    if (now - lastActionAt < 600) return false;
    setLastActionAt(now);
    return true;
  };

  const minuteNow = () => Math.floor(elapsedSeconds / 60);

  const pushEvent = (type: string, opts: { teamid: number; playerid?: number; note?: string; minute: number; goalid?: number; }) => {
    setEvents((ev) => [
      {
        id: opts.goalid ?? `tmp_${Date.now()}`,
        type,
        teamid: opts.teamid,
        playerid: opts.playerid,
        note: opts.note,
        minute: opts.minute,
      },
      ...ev,
    ]);
  };

  const handleSaveEvent = async (type: 'goal' | 'yellow' | 'red') => {
    if (!selectedMatch) return;
    if (!throttle()) return;
    const teamid = selectedTeam === 'home' ? selectedMatch.hometeamid : selectedMatch.awayteamid;
    const minute = minuteNow();
    const playerNum = playerId ? Number(playerId) : undefined;

    if (type === 'goal') {
      if (!playerNum) return;
      try {
        const goal = await api.createGoal({ matchid: selectedMatch.matchid, playerid: playerNum, teamid, minute, isowngoal: 0 });
        if (selectedTeam === 'home') setHomeScore((s) => s + 1); else setAwayScore((s) => s + 1);
        pushEvent('goal', { teamid, playerid: playerNum, note: notes, minute, goalid: goal.goalid });
        // Sync match result homescore/awayscore in DB (create if not exists, else update)
        try {
          const results = await api.listMatchResults();
          const existing = (results || []).find((r: any) => r.matchid === selectedMatch.matchid);
          const hs = selectedTeam === 'home' ? homeScore + 1 : homeScore;
          const as = selectedTeam === 'away' ? awayScore + 1 : awayScore;
          if (existing) {
            await api.updateMatchResult(existing.resultid, { homescore: hs, awayscore: as });
          } else {
            await api.createMatchResult({ matchid: selectedMatch.matchid, homescore: hs, awayscore: as });
          }
        } catch {}
      } catch {}
      return;
    }
    // Update player stats for yellow/red via playerstats when available
    if (playerNum) {
      try {
        // Try to fetch player to get statsid
        const player = await api.getPlayer(playerNum);
        if (player?.statsid) {
          const patch: any = {};
          if (type === 'yellow') patch.yellowcards = (player.yellowcards || player.stats?.yellowcards || 0) + 1;
          if (type === 'red') patch.redcards = (player.redcards || player.stats?.redcards || 0) + 1;
          if (Object.keys(patch).length > 0) {
            await api.updatePlayerStats(player.statsid, patch);
          }
        }
      } catch {}
    }
    pushEvent(type, { teamid, playerid: playerNum, note: notes, minute });
  };

  const undoLast = async () => {
    if (events.length === 0) return;
    const [last, ...rest] = events;
    if (last.type === 'goal' && last.id) {
      try {
        await api.deleteGoal(last.id);
        if (last.teamid === selectedMatch.hometeamid) setHomeScore((s) => Math.max(0, s - 1));
        else setAwayScore((s) => Math.max(0, s - 1));
      } catch {}
    }
    setEvents(rest);
  };

  const finishMatch = async () => {
    if (!selectedMatch) return;
    try {
      const payload: any = {
        matchid: selectedMatch.matchid,
        homescore: homeScore,
        awayscore: awayScore,
        winnerteamid: homeScore > awayScore ? selectedMatch.hometeamid : (awayScore > homeScore ? selectedMatch.awayteamid : null),
        mvpplayerid: mvpPlayerId ? Number(mvpPlayerId) : undefined,
        home_goal_scorers: [],
        away_goal_scorers: [],
      };
      // Create or update existing result
      const results = await api.listMatchResults();
      const existing = (results || []).find((r: any) => r.matchid === selectedMatch.matchid);
      if (existing) {
        await api.updateMatchResult(existing.resultid, payload);
      } else {
        await api.createMatchResult(payload);
      }
      await api.updateMatch(selectedMatch.matchid, { status: 'Finished' });
    } catch {}
  };

  return (
    <div className="match-management">
      <div className="section-header">
        <h2>Live Match Dashboard</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select className="tournament-select" value={selectedMatch?.matchid || ''} onChange={(e) => onSelectMatch(e.target.value)}>
            <option value="">Choose match…</option>
            {matches.filter((m:any) => m.status !== 'Finished').map((m) => (
              <option key={m.matchid} value={m.matchid}>{`${m.hometeamname || 'Home'} vs ${m.awayteamname || 'Away'} (${new Date(m.matchdate).toLocaleDateString()})`}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {selectedMatch && (
        <div className="live-dashboard">
          {/* Header row */}
          <div className="live-header">
            <div className="live-score">
              <span className="team-name">{selectedMatch.hometeamname || 'Team A'}</span>
              <span className="score">{homeScore} - {awayScore}</span>
              <span className="team-name">{selectedMatch.awayteamname || 'Team B'}</span>
            </div>
            <div className="live-clock">
              <span className="clock-time">{formatTime(elapsedSeconds)} ⏱️</span>
              <button className="primary-btn" onClick={async () => {
                if (!clockRunning) {
                  const ok = confirm('Start the match clock and set match status to Live?');
                  if (!ok) return;
                  try {
                    if (selectedMatch?.status !== 'Live') {
                      await api.updateMatch(selectedMatch.matchid, { status: 'Live' });
                      // reflect locally
                      setSelectedMatch({ ...selectedMatch, status: 'Live' });
                    }
                    setClockRunning(true);
                    setLastTick(null);
                  } catch {}
                } else {
                  // pause
                  setClockRunning(false);
                  setLastTick(null);
                }
              }}>{clockRunning ? 'Pause' : 'Start'}</button>
              <button className="secondary-btn" onClick={async () => {
                const ok = confirm('Finish the match, save result, and set status to Finished?');
                if (!ok) return;
                await finishMatch();
              }}>Finish</button>
            </div>
          </div>

          {/* Quick buttons row */}
          <div className="quick-actions">
            <button className="action-btn" onClick={() => handleSaveEvent('goal')}>⚽ Goal (G)</button>
            <button className="action-btn" onClick={() => handleSaveEvent('yellow')}>🟨 Yellow (Y)</button>
            <button className="action-btn" onClick={() => handleSaveEvent('red')}>🟥 Red (R)</button>
          </div>

          {/* Inputs row */}
          <div className="event-bar">
            <div className="team-toggle">
              <button className={`secondary-btn ${selectedTeam === 'home' ? 'active' : ''}`} onClick={() => setSelectedTeam('home')}>{selectedMatch.hometeamname || 'Home'}</button>
              <button className={`secondary-btn ${selectedTeam === 'away' ? 'active' : ''}`} onClick={() => setSelectedTeam('away')}>{selectedMatch.awayteamname || 'Away'}</button>
            </div>
            <select className="select" value={playerId} onChange={(e)=>setPlayerId(e.target.value)}>
              <option value="">Player…</option>
              {(selectedTeam === 'home' ? homePlayers : awayPlayers).map((p) => (
                <option key={p.playerid} value={p.playerid}>{`#${p.jerseynumber || ''} ${p.firstname} ${p.lastname}`}</option>
              ))}
            </select>
            <input className="notes" placeholder="Notes (optional)" value={notes} onChange={(e)=>setNotes(e.target.value)} />
          </div>

          {/* Save / Undo + MVP */}
          <div className="commit-bar" style={{ alignItems: 'center' }}>
            <button className="primary-btn" onClick={() => handleSaveEvent('goal')}>⏺ Save Event</button>
            <button className="secondary-btn" onClick={undoLast}>Undo Last Event</button>
            <div style={{ flex: 1 }} />
            <select
              className="tournament-select"
              value={mvpPlayerId}
              onChange={(e) => setMvpPlayerId(e.target.value)}
            >
              <option value="">MVP (optional)</option>
              {[...homePlayers, ...awayPlayers].map((p) => (
                <option key={p.playerid} value={p.playerid}>{`#${p.jerseynumber || ''} ${p.firstname} ${p.lastname}`}</option>
              ))}
            </select>
          </div>

          {/* Live Feed */}
          <div className="feed">
            <div className="feed-title">Live Feed</div>
            <div className="feed-list">
              {events.length === 0 ? (
                <div className="feed-empty">No events yet</div>
              ) : (
                events.map((ev) => {
                  const teamName = ev.teamid === selectedMatch.hometeamid ? (selectedMatch.hometeamname || 'Home') : (selectedMatch.awayteamname || 'Away');
                  const player = [...homePlayers, ...awayPlayers].find((p) => p.playerid === ev.playerid);
                  const line = `${String(ev.minute).padStart(2,'0')}:${String(0).padStart(2,'0')} ${ev.type.toUpperCase()} - ${teamName}${player ? ` • #${player.jerseynumber || ''} ${player.firstname} ${player.lastname}` : ''}${ev.note ? ` — ${ev.note}` : ''}`;
                  return (
                    <div key={ev.id} className="feed-item">{line}</div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Match Result Form Component
const MatchResultForm: React.FC<{
  match: any;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ match, onClose, onSuccess }) => {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [combinedScore, setCombinedScore] = useState('');
  const [homeGoalScorers, setHomeGoalScorers] = useState<any[]>([]);
  const [awayGoalScorers, setAwayGoalScorers] = useState<any[]>([]);
  const [homePlayers, setHomePlayers] = useState<any[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      loadTeamPlayers();
    }
  }, [match]);

  const loadTeamPlayers = async () => {
    try {
      const [homePlayersData, awayPlayersData] = await Promise.all([
        api.listPlayers({ teamid: match.hometeamid }),
        api.listPlayers({ teamid: match.awayteamid })
      ]);
      setHomePlayers(homePlayersData || []);
      setAwayPlayers(awayPlayersData || []);
    } catch (err) {
      console.error('Failed to load team players:', err);
    }
  };

  const addGoalScorer = (teamType: 'home' | 'away') => {
    const newScorer = {
      playerid: '',
      minute: '',
      isowngoal: 0
    };
    
    if (teamType === 'home') {
      setHomeGoalScorers([...homeGoalScorers, newScorer]);
    } else {
      setAwayGoalScorers([...awayGoalScorers, newScorer]);
    }
  };

  const removeGoalScorer = (teamType: 'home' | 'away', index: number) => {
    if (teamType === 'home') {
      setHomeGoalScorers(homeGoalScorers.filter((_, i) => i !== index));
    } else {
      setAwayGoalScorers(awayGoalScorers.filter((_, i) => i !== index));
    }
  };

  const updateGoalScorer = (teamType: 'home' | 'away', index: number, field: string, value: any) => {
    if (teamType === 'home') {
      const updated = [...homeGoalScorers];
      updated[index] = { ...updated[index], [field]: value };
      setHomeGoalScorers(updated);
    } else {
      const updated = [...awayGoalScorers];
      updated[index] = { ...updated[index], [field]: value };
      setAwayGoalScorers(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!homeScore || !awayScore) {
      setError('Please enter both scores');
      return;
    }

    const homeScoreNum = parseInt(homeScore);
    const awayScoreNum = parseInt(awayScore);

    // Validate goal scorers match the scores
    if (homeGoalScorers.length !== homeScoreNum) {
      setError(`Home team has ${homeScoreNum} goals but ${homeGoalScorers.length} goal scorers specified`);
      return;
    }

    if (awayGoalScorers.length !== awayScoreNum) {
      setError(`Away team has ${awayScoreNum} goals but ${awayGoalScorers.length} goal scorers specified`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create match result with goal scorers
      await api.createMatchResult({
        matchid: match.matchid,
        homescore: homeScoreNum,
        awayscore: awayScoreNum,
        home_goal_scorers: homeGoalScorers.map(scorer => ({
          playerid: parseInt(scorer.playerid),
          minute: scorer.minute ? parseInt(scorer.minute) : null,
          isowngoal: scorer.isowngoal
        })),
        away_goal_scorers: awayGoalScorers.map(scorer => ({
          playerid: parseInt(scorer.playerid),
          minute: scorer.minute ? parseInt(scorer.minute) : null,
          isowngoal: scorer.isowngoal
        }))
      });

      // Update match status to finished
      await api.updateMatch(match.matchid, {
        status: 'Finished'
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save match result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Enter Match Result</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Match: {match?.hometeamname || 'Home Team'} vs {match?.awayteamname || 'Away Team'}</label>
          </div>

          <div className="form-group">
            <label>Score (e.g., 2-1)</label>
            <input
              type="text"
              placeholder="H-A"
              value={combinedScore}
              onChange={(e) => {
                const val = e.target.value.replace(/\s/g, '');
                setCombinedScore(val);
                const parts = val.split('-');
                if (parts.length === 2) {
                  const [h, a] = parts;
                  if (/^\d+$/.test(h)) setHomeScore(h);
                  if (/^\d+$/.test(a)) setAwayScore(a);
                }
              }}
            />
          </div>
          
          <div className="score-inputs">
            <div className="form-group">
              <label>{match?.hometeamname || 'Home Team'} Score</label>
              <input
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>{match?.awayteamname || 'Away Team'} Score</label>
              <input
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Home Team Goal Scorers */}
          <div className="goal-scorers-section">
            <div className="goal-scorers-header">
              <h4>{match?.hometeamname || 'Home Team'} Goal Scorers</h4>
              <button 
                type="button" 
                className="add-scorer-btn"
                onClick={() => addGoalScorer('home')}
              >
                + Add Scorer
              </button>
            </div>
            {homeGoalScorers.map((scorer, index) => (
              <div key={index} className="goal-scorer-row">
                <select
                  value={scorer.playerid}
                  onChange={(e) => updateGoalScorer('home', index, 'playerid', e.target.value)}
                  required
                >
                  <option value="">Select Player</option>
                  {homePlayers.map(player => (
                    <option key={player.playerid} value={player.playerid}>
                      {player.firstname} {player.lastname}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Minute"
                  min="1"
                  max="90"
                  value={scorer.minute}
                  onChange={(e) => updateGoalScorer('home', index, 'minute', e.target.value)}
                />
                <label className="own-goal-checkbox">
                  <input
                    type="checkbox"
                    checked={scorer.isowngoal === 1}
                    onChange={(e) => updateGoalScorer('home', index, 'isowngoal', e.target.checked ? 1 : 0)}
                  />
                  Own Goal
                </label>
                <button 
                  type="button" 
                  className="remove-scorer-btn"
                  onClick={() => removeGoalScorer('home', index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Away Team Goal Scorers */}
          <div className="goal-scorers-section">
            <div className="goal-scorers-header">
              <h4>{match?.awayteamname || 'Away Team'} Goal Scorers</h4>
              <button 
                type="button" 
                className="add-scorer-btn"
                onClick={() => addGoalScorer('away')}
              >
                + Add Scorer
              </button>
            </div>
            {awayGoalScorers.map((scorer, index) => (
              <div key={index} className="goal-scorer-row">
                <select
                  value={scorer.playerid}
                  onChange={(e) => updateGoalScorer('away', index, 'playerid', e.target.value)}
                  required
                >
                  <option value="">Select Player</option>
                  {awayPlayers.map(player => (
                    <option key={player.playerid} value={player.playerid}>
                      {player.firstname} {player.lastname}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Minute"
                  min="1"
                  max="90"
                  value={scorer.minute}
                  onChange={(e) => updateGoalScorer('away', index, 'minute', e.target.value)}
                />
                <label className="own-goal-checkbox">
                  <input
                    type="checkbox"
                    checked={scorer.isowngoal === 1}
                    onChange={(e) => updateGoalScorer('away', index, 'isowngoal', e.target.checked ? 1 : 0)}
                  />
                  Own Goal
                </label>
                <button 
                  type="button" 
                  className="remove-scorer-btn"
                  onClick={() => removeGoalScorer('away', index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Saving...' : 'Save Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Tournament Management Component
const TournamentManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const tournamentsData = await api.listTournaments();
      setTournaments(tournamentsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner color="white" size="lg" />;
  }

  return (
    <div className="tournament-management">
      <div className="section-header">
        <h2>Tournament Management</h2>
        <button className="primary-btn" onClick={() => setShowCreateForm(true)}>
          Create Tournament
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="tournaments-grid">
        {tournaments.map((tournament) => (
          <div key={tournament.tournamentid} className="tournament-card">
            <h3>{tournament.name}</h3>
            <p>Season: {tournament.seasonyear}</p>
            <p>Start: {tournament.startdate ? new Date(tournament.startdate).toLocaleDateString() : 'TBD'}</p>
            <p>End: {tournament.enddate ? new Date(tournament.enddate).toLocaleDateString() : 'TBD'}</p>
            <p>Max Players: {tournament.maxPlayers ?? 8}</p>
            {tournament.description && (
              <p className="description">{tournament.description}</p>
            )}
          </div>
        ))}
      </div>

      {showCreateForm && (
        <TournamentCreateForm 
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadTournaments();
          }}
        />
      )}
    </div>
  );
};

// Tournament Create Form Component
const TournamentCreateForm: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    seasonyear: new Date().getFullYear(),
    startdate: '',
    enddate: '',
    description: '',
    maxPlayers: 8
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      await api.createTournament(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create Tournament</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tournament Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Season Year</label>
            <input
              type="number"
              value={formData.seasonyear}
              onChange={(e) => setFormData({...formData, seasonyear: parseInt(e.target.value)})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={formData.startdate}
              onChange={(e) => setFormData({...formData, startdate: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={formData.enddate}
              onChange={(e) => setFormData({...formData, enddate: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

        <div className="form-group">
          <label>Max Players per Team</label>
          <input
            type="number"
            min="1"
            value={formData.maxPlayers}
            onChange={(e) => setFormData({...formData, maxPlayers: parseInt(e.target.value || '0', 10)})}
            required
          />
        </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Team Management Component
const TeamManagement: React.FC = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const teamsData = await api.listTeams();
      setTeams(teamsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner color="white" size="lg" />;
  }

  return (
    <div className="team-management">
      <div className="section-header">
        <h2>Live Match Dashboard</h2>
        <button className="primary-btn" onClick={() => setShowCreateForm(true)}>
          Create Team
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="teams-grid">
        {teams.map((team) => (
          <div key={team.teamid} className="team-card">
            <div className="team-logo">
              {team.logourl ? (
                <img src={team.logourl} alt={team.teamname} />
              ) : (
                <div className="default-logo">🏆</div>
              )}
            </div>
            <h3>{team.teamname}</h3>
            {team.description && (
              <p className="description">{team.description}</p>
            )}
            <p className="created-date">
              Created: {new Date(team.createdat).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <TeamCreateForm 
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadTeams();
          }}
        />
      )}
    </div>
  );
};

// Team Create Form Component
const TeamCreateForm: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    teamname: '',
    description: '',
    logourl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      await api.createTeam(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create Team</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Team Name</label>
            <input
              type="text"
              value={formData.teamname}
              onChange={(e) => setFormData({...formData, teamname: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Logo URL</label>
            <input
              type="url"
              value={formData.logourl}
              onChange={(e) => setFormData({...formData, logourl: e.target.value})}
              placeholder="https://example.com/logo.png"
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Tournament Team Management Component
const TournamentTeamManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [tournamentTeams, setTournamentTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // removed unused showAssignTeamForm state

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadTournamentTeamData();
    }
  }, [selectedTournament]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const tournamentsData = await api.listTournaments();
      setTournaments(tournamentsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentTeamData = async () => {
    if (!selectedTournament) return;
    
    try {
      setLoading(true);
      const [teamsData, tournamentTeamsData] = await Promise.all([
        api.listTeams(),
        api.listTournamentTeams()
      ]);

      // Filter tournament teams for selected tournament
      const tournamentTeamEntries = tournamentTeamsData.filter((entry: any) => 
        entry.tournamentid === selectedTournament.tournamentid
      );

      setTeams(teamsData || []);
      setTournamentTeams(tournamentTeamEntries);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournament team data');
    } finally {
      setLoading(false);
    }
  };

  const getRegisteredTeams = () => {
    const registeredTeamIds = tournamentTeams.map((tt: any) => tt.teamid);
    return teams.filter((team: any) => registeredTeamIds.includes(team.teamid));
  };

  const getAvailableTeams = () => {
    const registeredTeamIds = tournamentTeams.map((tt: any) => tt.teamid);
    return teams.filter((team: any) => !registeredTeamIds.includes(team.teamid));
  };

  const handleRegisterTeam = async (teamid: number) => {
    try {
      setLoading(true);
      setError(null);

      // Enforce tournament maxPlayers per team
      const maxPlayers = Number(selectedTournament.maxPlayers ?? 8);
      const roster = await api.listPlayers({ teamid });
      const rosterCount = (roster || []).length;
      if (rosterCount > maxPlayers) {
        throw new Error(`Team must have at most ${maxPlayers} players (current: ${rosterCount}).`);
      }

      await api.createTournamentTeam({
        tournamentid: selectedTournament.tournamentid,
        teamid: teamid
      });

      loadTournamentTeamData();
    } catch (err: any) {
      setError(err.message || 'Failed to register team');
    } finally {
      setLoading(false);
    }
  };

  const handleUnregisterTeam = async (teamid: number) => {
    try {
      setLoading(true);
      setError(null);

      await api.deleteTournamentTeam(selectedTournament.tournamentid, teamid);
      loadTournamentTeamData();
    } catch (err: any) {
      setError(err.message || 'Failed to unregister team');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedTournament) {
    return <Spinner color="white" size="lg" />;
  }

  return (
    <div className="tournament-team-management">
      <div className="section-header">
        <h2>Tournament Team Management</h2>
        <p className="section-subtitle">Register teams for tournaments before assigning them to groups</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Tournament Selection */}
      <div className="tournament-selector">
        <label>Select Tournament:</label>
        <select 
          value={selectedTournament?.tournamentid || ''} 
          onChange={(e) => {
            const tournament = tournaments.find(t => t.tournamentid === parseInt(e.target.value));
            setSelectedTournament(tournament);
          }}
          className="tournament-select"
        >
          <option value="">Choose a tournament...</option>
          {tournaments.map((tournament) => (
            <option key={tournament.tournamentid} value={tournament.tournamentid}>
              {tournament.name} ({tournament.seasonyear})
            </option>
          ))}
        </select>
      </div>

      {selectedTournament && (
        <>
          <div className="tournament-info">
            <h3>{selectedTournament.name}</h3>
            <p>Season: {selectedTournament.seasonyear}</p>
            <p>Registered Teams: {tournamentTeams.length}</p>
            <p>Available Teams: {getAvailableTeams().length}</p>
          </div>

          <div className="team-registration-section">
            <div className="registered-teams">
              <div className="section-header-small">
                <h4>Registered Teams ({getRegisteredTeams().length})</h4>
                <p>Teams registered for this tournament</p>
              </div>
              
              {getRegisteredTeams().length === 0 ? (
                <div className="no-teams">
                  <p>No teams registered yet</p>
                  <small>Register teams to make them available for group assignment</small>
                </div>
              ) : (
                <div className="teams-grid">
                  {getRegisteredTeams().map((team: any) => (
                    <div key={team.teamid} className="team-card">
                      <div className="team-logo">
                        {team.logourl ? (
                          <img src={team.logourl} alt={team.teamname} />
                        ) : (
                          <div className="default-logo">🏆</div>
                        )}
                      </div>
                      <h5>{team.teamname}</h5>
                      {team.description && (
                        <p className="description">{team.description}</p>
                      )}
                      <button 
                        className="remove-btn"
                        onClick={() => handleUnregisterTeam(team.teamid)}
                        disabled={loading}
                      >
                        Unregister
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="available-teams">
              <div className="section-header-small">
                <h4>Available Teams ({getAvailableTeams().length})</h4>
                <p>Teams that can be registered for this tournament</p>
              </div>
              
              {getAvailableTeams().length === 0 ? (
                <div className="no-teams">
                  <p>All teams are already registered</p>
                </div>
              ) : (
                <div className="teams-grid">
                  {getAvailableTeams().map((team: any) => (
                    <div key={team.teamid} className="team-card">
                      <div className="team-logo">
                        {team.logourl ? (
                          <img src={team.logourl} alt={team.teamname} />
                        ) : (
                          <div className="default-logo">🏆</div>
                        )}
                      </div>
                      <h5>{team.teamname}</h5>
                      {team.description && (
                        <p className="description">{team.description}</p>
                      )}
                      <button 
                        className="register-btn"
                        onClick={() => handleRegisterTeam(team.teamid)}
                        disabled={loading}
                      >
                        Register
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="tournament-workflow">
            <h4>Tournament Workflow</h4>
            <div className="workflow-steps">
              <div className="workflow-step completed">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h5>Create Tournament</h5>
                  <p>Tournament created: {selectedTournament.name}</p>
                </div>
              </div>
              <div className={`workflow-step ${tournamentTeams.length > 0 ? 'completed' : 'current'}`}>
                <div className="step-number">2</div>
                <div className="step-content">
                  <h5>Register Teams</h5>
                  <p>{tournamentTeams.length} teams registered</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h5>Create Groups</h5>
                  <p>Organize teams into groups</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h5>Schedule Matches</h5>
                  <p>Create match fixtures</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Group Management Component
const GroupManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [tournamentTeams, setTournamentTeams] = useState<any[]>([]);
  const [groupTeams, setGroupTeams] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [showAssignTeamForm, setShowAssignTeamForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadTournamentData();
    }
  }, [selectedTournament]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const tournamentsData = await api.listTournaments();
      setTournaments(tournamentsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentData = async () => {
    if (!selectedTournament) return;
    
    try {
      setLoading(true);
      const [groupsData, teamsData, tournamentTeamsData, groupTeamsData, standingsData, matchesData] = await Promise.all([
        api.listTournamentGroups(),
        api.listTeams(),
        api.listTournamentTeams(),
        api.listGroupTeams(),
        api.listStandings(),
        api.listMatches()
      ]);

      // Filter data for selected tournament
      const tournamentGroups = groupsData.filter((group: any) => group.tournamentid === selectedTournament.tournamentid);
      const tournamentTeamEntries = tournamentTeamsData.filter((entry: any) => entry.tournamentid === selectedTournament.tournamentid);
      const tournamentGroupTeams = groupTeamsData.filter((entry: any) => 
        tournamentGroups.some((group: any) => group.groupid === entry.groupid)
      );
      const tournamentStandings = standingsData.filter((standing: any) => 
        tournamentGroups.some((group: any) => group.groupid === standing.groupid)
      );
      const tournamentMatches = matchesData.filter((match: any) => match.tournamentid === selectedTournament.tournamentid);

      setGroups(tournamentGroups);
      setTeams(teamsData || []);
      setTournamentTeams(tournamentTeamEntries);
      setGroupTeams(tournamentGroupTeams);
      setStandings(tournamentStandings);
      setMatches(tournamentMatches);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const getTeamsInGroup = (groupid: number) => {
    const groupTeamIds = groupTeams
      .filter((gt: any) => gt.groupid === groupid)
      .map((gt: any) => gt.teamid);
    
    return teams.filter((team: any) => groupTeamIds.includes(team.teamid));
  };

  const getGroupStandings = (groupid: number) => {
    const groupStandings = standings.filter((standing: any) => standing.groupid === groupid);
    
    // Sort standings by points, then goal difference, then goals for
    return groupStandings.sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if ((b.goalsfor - b.goalsagainst) !== (a.goalsfor - a.goalsagainst)) {
        return (b.goalsfor - b.goalsagainst) - (a.goalsfor - a.goalsagainst);
      }
      return b.goalsfor - a.goalsfor;
    });
  };

  const getGroupMatches = (groupid: number) => {
    const groupTeamIds = groupTeams
      .filter((gt: any) => gt.groupid === groupid)
      .map((gt: any) => gt.teamid);
    
    return matches.filter((match: any) => 
      groupTeamIds.includes(match.hometeamid) && groupTeamIds.includes(match.awayteamid)
    );
  };

  const getGroupStats = (groupid: number) => {
    const groupMatches = getGroupMatches(groupid);
    const groupStandings = getGroupStandings(groupid);
    
    const totalMatches = groupMatches.length;
    const completedMatches = groupMatches.filter((match: any) => match.status === 'Finished').length;
    const upcomingMatches = groupMatches.filter((match: any) => match.status === 'Upcoming').length;
    
    return {
      totalMatches,
      completedMatches,
      upcomingMatches,
      teamsCount: groupStandings.length
    };
  };

  const getAvailableTeams = () => {
    const tournamentTeamIds = tournamentTeams.map((tt: any) => tt.teamid);
    return teams.filter((team: any) => tournamentTeamIds.includes(team.teamid));
  };

  // removed unused getUnregisteredTeams helper

  if (loading && !selectedTournament) {
    return <Spinner color="white" size="lg" />;
  }

  return (
    <div className="group-management">
      <div className="section-header">
        <h2>Tournament Group Management</h2>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Tournament Selection */}
      <div className="tournament-selector">
        <label>Select Tournament:</label>
        <select 
          value={selectedTournament?.tournamentid || ''} 
          onChange={(e) => {
            const tournament = tournaments.find(t => t.tournamentid === parseInt(e.target.value));
            setSelectedTournament(tournament);
          }}
          className="tournament-select"
        >
          <option value="">Choose a tournament...</option>
          {tournaments.map((tournament) => (
            <option key={tournament.tournamentid} value={tournament.tournamentid}>
              {tournament.name} ({tournament.seasonyear})
            </option>
          ))}
        </select>
      </div>

      {selectedTournament && (
        <>
          <div className="tournament-info">
            <h3>{selectedTournament.name}</h3>
            <p>Season: {selectedTournament.seasonyear}</p>
            <p>Registered Teams: {tournamentTeams.length}</p>
            <p>Groups: {groups.length}</p>
          </div>

          <div className="groups-section">
            <div className="groups-header">
              <div className="groups-title">
                <h3>Groups</h3>
              </div>
              <div className="groups-actions">
                <button 
                  className="secondary-btn"
                  onClick={loadTournamentData}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button 
                  className="primary-btn"
                  onClick={() => setShowCreateGroupForm(true)}
                  disabled={tournamentTeams.length === 0}
                >
                  Create Group
                </button>
              </div>
            </div>

            {tournamentTeams.length === 0 ? (
              <div className="no-groups">
                <p>No teams registered for this tournament yet.</p>
                <p>Go to <strong>Tournament Teams</strong> tab to register teams first, then create groups.</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="no-groups">
                <p>No groups created yet. Create your first group to organize teams.</p>
                <p>{tournamentTeams.length} teams are registered and ready for group assignment.</p>
              </div>
            ) : (
              <div className="simple-groups-grid">
                {groups.map((group) => {
                  const groupTeams = getTeamsInGroup(group.groupid);
                  
                  return (
                    <div key={group.groupid} className="simple-group-card">
                      <div className="simple-group-header">
                        <h4>{group.groupname}</h4>
                        <span className="team-count">{groupTeams.length} teams</span>
                      </div>
                      
                      <div className="simple-group-teams">
                        {groupTeams.length === 0 ? (
                          <p className="no-teams">No teams assigned to this group</p>
                        ) : (
                          <div className="simple-teams-list">
                            {groupTeams.map((team: any) => (
                              <div key={team.teamid} className="simple-team-item">
                                {team.logourl && (
                                  <img src={team.logourl} alt={team.teamname} className="simple-team-logo" />
                                )}
                                <span className="simple-team-name">{team.teamname}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="simple-group-actions">
                        <button 
                          className="manage-teams-btn"
                          onClick={() => {
                            setSelectedGroup(group);
                            setShowAssignTeamForm(true);
                          }}
                        >
                          Manage Teams
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Group Form */}
      {showCreateGroupForm && (
        <CreateGroupForm 
          tournament={selectedTournament}
          onClose={() => setShowCreateGroupForm(false)}
          onSuccess={() => {
            setShowCreateGroupForm(false);
            loadTournamentData();
          }}
        />
      )}

      {/* Assign Team Form */}
      {showAssignTeamForm && (
        <AssignTeamForm 
          group={selectedGroup}
          availableTeams={getAvailableTeams()}
          assignedTeams={getTeamsInGroup(selectedGroup?.groupid)}
          onClose={() => setShowAssignTeamForm(false)}
          onSuccess={() => {
            setShowAssignTeamForm(false);
            loadTournamentData();
          }}
        />
      )}
    </div>
  );
};

// Create Group Form Component
const CreateGroupForm: React.FC<{
  tournament: any;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ tournament, onClose, onSuccess }) => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.createTournamentGroup({
        tournamentid: tournament.tournamentid,
        groupname: groupName.trim()
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create Group</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tournament: {tournament.name}</label>
          </div>
          
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Group A, Group B, etc."
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// New Team Management Modal Component
const AssignTeamForm: React.FC<{
  group: any;
  availableTeams: any[];
  assignedTeams: any[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ group, availableTeams, assignedTeams, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssignTeam = async (teamid: number) => {
    try {
      setLoading(true);
      setError(null);
      await api.createGroupTeam({
        groupid: group.groupid,
        teamid: teamid
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to assign team');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeam = async (teamid: number) => {
    try {
      setLoading(true);
      setError(null);
      await api.deleteGroupTeam(group.groupid, teamid);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to remove team');
    } finally {
      setLoading(false);
    }
  };

  const unassignedTeams = availableTeams.filter(team => 
    !assignedTeams.some(assigned => assigned.teamid === team.teamid)
  );

  return (
    <div className="modal-overlay">
      <div className="simple-modal">
        <div className="modal-header">
          <h3>Manage Teams - {group.groupname}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="modal-content">
          <div className="team-section">
            <h4>Assigned Teams ({assignedTeams.length})</h4>
            {assignedTeams.length === 0 ? (
              <p>No teams assigned</p>
            ) : (
              <div className="team-list">
                {assignedTeams.map((team: any) => (
                  <div key={team.teamid} className="team-item">
                    <span>{team.teamname}</span>
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveTeam(team.teamid)}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="team-section">
            <h4>Available Teams ({unassignedTeams.length})</h4>
            {unassignedTeams.length === 0 ? (
              <p>All teams assigned</p>
            ) : (
              <div className="team-list">
                {unassignedTeams.map((team: any) => (
                  <div key={team.teamid} className="team-item">
                    <span>{team.teamname}</span>
                    <button 
                      className="assign-btn"
                      onClick={() => handleAssignTeam(team.teamid)}
                      disabled={loading}
                    >
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// User Management Component
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await api.listUsers();
      setUsers(usersData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner color="white" size="lg" />;
  }

  return (
    <div className="user-management">
      <div className="section-header">
        <h2>User Management</h2>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Join Date</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userid}>
                <td>{user.firstname} {user.lastname}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td>{new Date(user.joindate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;

// Reusable Match Create/Edit Form
const MatchForm: React.FC<{
  match: any | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ match, onClose, onSuccess }) => {
  const isEdit = !!match;
  const [teams, setTeams] = useState<any[]>([]);
  const [stadiums, setStadiums] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [form, setForm] = useState({
    matchdate: match ? new Date(match.matchdate).toISOString().slice(0,16) : '',
    hometeamid: match?.hometeamid || '',
    awayteamid: match?.awayteamid || '',
    stadiumid: match?.stadiumid || '',
    round: match?.round || 'Group',
    status: match?.status || 'Upcoming',
    tournamentid: match?.tournamentid || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [teamsData, stadiumsData, tournamentsData] = await Promise.all([
          api.listTeams(),
          api.listStadiums(),
          api.listTournaments(),
        ]);
        setTeams(teamsData || []);
        setStadiums(stadiumsData || []);
        setTournaments(tournamentsData || []);
      } catch (err) {
        // ignore
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.hometeamid || !form.awayteamid || !form.matchdate) {
      setError('Home team, away team and date/time are required');
      return;
    }
    if (String(form.hometeamid) === String(form.awayteamid)) {
      setError('Home and Away team cannot be the same');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload: any = {
        hometeamid: Number(form.hometeamid),
        awayteamid: Number(form.awayteamid),
        stadiumid: form.stadiumid ? Number(form.stadiumid) : undefined,
        matchdate: new Date(form.matchdate).toISOString(),
        round: form.round,
        status: form.status,
        tournamentid: form.tournamentid ? Number(form.tournamentid) : undefined,
      };

      if (isEdit) {
        await api.updateMatch(match.matchid, payload);
      } else {
        await api.createMatch(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Match' : 'Create Match'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date & Time</label>
            <input
              type="datetime-local"
              value={form.matchdate}
              onChange={(e) => setForm({ ...form, matchdate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Home Team</label>
            <select
              value={form.hometeamid}
              onChange={(e) => setForm({ ...form, hometeamid: e.target.value })}
              required
            >
              <option value="">Select team</option>
              {teams.map((t) => (
                <option key={t.teamid} value={t.teamid}>{t.teamname}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Away Team</label>
            <select
              value={form.awayteamid}
              onChange={(e) => setForm({ ...form, awayteamid: e.target.value })}
              required
            >
              <option value="">Select team</option>
              {teams.map((t) => (
                <option key={t.teamid} value={t.teamid}>{t.teamname}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Stadium</label>
            <select
              value={form.stadiumid}
              onChange={(e) => setForm({ ...form, stadiumid: e.target.value })}
            >
              <option value="">Select stadium (optional)</option>
              {stadiums.map((s) => (
                <option key={s.stadiumid} value={s.stadiumid}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Round</label>
            <select
              value={form.round}
              onChange={(e) => setForm({ ...form, round: e.target.value })}
            >
              <option value="Group">Group</option>
              <option value="Quarter">Quarter</option>
              <option value="Semi">Semi</option>
              <option value="Final">Final</option>
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Live">Live</option>
              <option value="Finished">Finished</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tournament</label>
            <select
              value={form.tournamentid}
              onChange={(e) => setForm({ ...form, tournamentid: e.target.value })}
            >
              <option value="">Select tournament</option>
              {tournaments.map((t) => (
                <option key={t.tournamentid} value={t.tournamentid}>
                  {t.name} ({t.seasonyear})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="secondary-btn">Cancel</button>
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Match')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Live Match Operator Modal (MVP)
const LiveMatchOperator: React.FC<{
  match: any;
  onClose: () => void;
  onUpdated: () => void;
}> = ({ match, onClose, onUpdated }) => {
  const [homePlayers, setHomePlayers] = useState<any[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<'goal' | 'yellow' | 'red' | 'substitution' | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [clockRunning, setClockRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastTick, setLastTick] = useState<number | null>(null);
  const [mvpPlayerId, setMvpPlayerId] = useState<string>('');
  const [minuteOverride, setMinuteOverride] = useState<string>('');
  const [lastActionAt, setLastActionAt] = useState<number>(0);
  const playerInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [hp, ap] = await Promise.all([
          api.listPlayers({ teamid: match.hometeamid }),
          api.listPlayers({ teamid: match.awayteamid })
        ]);
        setHomePlayers(hp || []);
        setAwayPlayers(ap || []);
      } catch {}
    };
    load();
  }, [match]);

  useEffect(() => {
    let raf: number | null = null;
    if (clockRunning) {
      const step = (ts: number) => {
        if (lastTick == null) {
          setLastTick(ts);
        } else {
          const delta = Math.floor((ts - lastTick) / 1000);
          if (delta >= 1) {
            setElapsedSeconds((s) => s + delta);
            setLastTick(ts);
          }
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [clockRunning, lastTick]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const r = (s % 60).toString().padStart(2, '0');
    return `${m}:${r}`;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); toggleStartPause(); }
      if (e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); stopClock(); }
      if (e.key.toLowerCase() === 'g') { e.preventDefault(); setSelectedEventType('goal'); handleSaveEvent('goal'); }
      if (e.key.toLowerCase() === 'y') { e.preventDefault(); setSelectedEventType('yellow'); handleSaveEvent('yellow'); }
      if (e.key.toLowerCase() === 'r') { e.preventDefault(); setSelectedEventType('red'); handleSaveEvent('red'); }
      if (e.key.toLowerCase() === 's') { e.preventDefault(); setSelectedEventType('substitution'); handleSaveEvent('substitution'); }
      if (e.key.toLowerCase() === 'h') { setSelectedTeam('home'); }
      if (e.key.toLowerCase() === 'a') { setSelectedTeam('away'); }
      if (e.key === '/') { e.preventDefault(); playerInputRef.current?.focus(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undoLast(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); endMatch(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clockRunning, selectedTeam, selectedPlayerId, events, homeScore, awayScore, elapsedSeconds]);

  const toggleStartPause = () => {
    setClockRunning((r) => !r);
    setLastTick(null);
    if (!clockRunning && match.status !== 'Live') {
      api.updateMatch(match.matchid, { status: 'Live' }).catch(() => {});
    }
  };
  const stopClock = () => { setClockRunning(false); setLastTick(null); };
  const minuteNow = () => Math.floor(elapsedSeconds / 60);
  const effectiveMinute = () => {
    const m = minuteOverride.trim();
    if (m && /^\d+$/.test(m)) return parseInt(m, 10);
    return minuteNow();
  };
  const throttleClick = () => {
    const now = Date.now();
    if (now - lastActionAt < 800) return false;
    setLastActionAt(now);
    return true;
  };

  const handleSaveEvent = async (type?: 'goal' | 'yellow' | 'red' | 'substitution') => {
    const eventType = type || selectedEventType;
    if (!eventType) return;
    if (!selectedPlayerId) return;
    if (!throttleClick()) return;
    if (eventType === 'red' && !confirm('Confirm red card?')) return;
    const teamid = selectedTeam === 'home' ? match.hometeamid : match.awayteamid;
    const playerid = Number(selectedPlayerId);
    const minute = effectiveMinute();

    if (eventType === 'goal') {
      try {
        const goal = await api.createGoal({ matchid: match.matchid, playerid, teamid, minute, isowngoal: 0 });
        setEvents((ev) => [{ id: goal.goalid, type: 'goal', teamid, playerid, minute }, ...ev]);
        if (selectedTeam === 'home') setHomeScore((s) => s + 1); else setAwayScore((s) => s + 1);
      } catch {}
      return;
    }
    // For yellow/red/substitution: store locally (backend unchanged)
    setEvents((ev) => [{ id: `tmp_${Date.now()}`, type: eventType, teamid, playerid, minute }, ...ev]);
  };

  const undoLast = async () => {
    if (events.length === 0) return;
    const [last, ...rest] = events;
    if (last.type === 'goal' && last.id) {
      try {
        await api.deleteGoal(last.id);
        if (last.teamid === match.hometeamid) setHomeScore((s) => Math.max(0, s - 1));
        else setAwayScore((s) => Math.max(0, s - 1));
      } catch {}
    }
    setEvents(rest);
  };

  const endMatch = async () => {
    try {
      const winnerteamid =
        homeScore > awayScore ? match.hometeamid :
        awayScore > homeScore ? match.awayteamid : null;

      const payload: any = {
        matchid: match.matchid,
        homescore: homeScore,
        awayscore: awayScore,
        winnerteamid,
        mvpplayerid: mvpPlayerId ? Number(mvpPlayerId) : undefined,
        home_goal_scorers: [],
        away_goal_scorers: [],
      };

      const results = await api.listMatchResults();
      const existing = (results || []).find((r: any) => r.matchid === match.matchid);
      if (existing) {
        await api.updateMatchResult(existing.resultid, payload);
      } else {
        await api.createMatchResult(payload);
      }

      await api.updateMatch(match.matchid, { status: 'Finished' });
      onUpdated();
      onClose();
    } catch {
      onUpdated();
    }
  };

  const playersFor = selectedTeam === 'home' ? homePlayers : awayPlayers;
  const allPlayers = [...homePlayers, ...awayPlayers];

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h3>Live Match Dashboard</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="live-dashboard">
          {/* Header: Scoreboard + MatchClock */}
          <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div className="scoreboard" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontWeight: 600 }}>{match.hometeamname || 'Home'}</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{homeScore} – {awayScore}</div>
              <div style={{ fontWeight: 600 }}>{match.awayteamname || 'Away'}</div>
            </div>
            <div className="match-clock" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 20 }}>{formatTime(elapsedSeconds)}</div>
              <button className="primary-btn" onClick={toggleStartPause}>{clockRunning ? 'Pause' : 'Start'}</button>
              <button className="secondary-btn" onClick={stopClock}>Stop</button>
            </div>
          </div>

          {/* EventInputBar */}
          <div className="event-input-bar" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto auto auto', gap: 10, marginTop: 15 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={`secondary-btn ${selectedTeam === 'home' ? 'active' : ''}`} onClick={() => setSelectedTeam('home')}>Home</button>
              <button className={`secondary-btn ${selectedTeam === 'away' ? 'active' : ''}`} onClick={() => setSelectedTeam('away')}>Away</button>
            </div>
            <div>
              <input ref={playerInputRef} list="player-options" placeholder="Search player or number (/)" value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)} />
              <datalist id="player-options">
                {playersFor.map((p) => (
                  <option key={p.playerid} value={p.playerid}>{`${p.jerseynumber ? p.jerseynumber + ' - ' : ''}${p.firstname} ${p.lastname}`}</option>
                ))}
              </datalist>
            </div>
            <button className="action-btn" onClick={() => { setSelectedEventType('goal'); handleSaveEvent('goal'); }}>Goal (G)</button>
            <button className="action-btn" onClick={() => { setSelectedEventType('yellow'); handleSaveEvent('yellow'); }}>Yellow (Y)</button>
            <button className="remove-btn" onClick={() => { setSelectedEventType('red'); handleSaveEvent('red'); }}>Red (R)</button>
            <button className="secondary-btn" onClick={() => { setSelectedEventType('substitution'); handleSaveEvent('substitution'); }}>Sub (S)</button>
            <input type="number" min="0" placeholder={`Min (${minuteNow()})`} value={minuteOverride} onChange={(e) => setMinuteOverride(e.target.value)} />
          </div>

          {/* EventFeed */}
          <div className="event-feed" style={{ marginTop: 15, maxHeight: 240, overflowY: 'auto' }}>
            {events.length === 0 ? (
              <div className="no-events" style={{ opacity: 0.7 }}>No events yet</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {events.map((ev) => {
                  const teamName = ev.teamid === match.hometeamid ? (match.hometeamname || 'Home') : (match.awayteamname || 'Away');
                  const player = allPlayers.find((p) => p.playerid === ev.playerid);
                  return (
                    <li key={ev.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 110px', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ opacity: 0.8 }}>{String(ev.minute).padStart(2, '0')}'</span>
                      <span style={{ fontWeight: 600 }}>{teamName}</span>
                      <span>{player ? `${player.firstname} ${player.lastname}` : `#${ev.playerid}`}</span>
                      <span style={{ textTransform: 'capitalize', justifySelf: 'end' }}>{ev.type}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* FooterControls */}
          <div className="footer-controls" style={{ display: 'flex', gap: 10, marginTop: 15, alignItems: 'center' }}>
            <button className="secondary-btn" onClick={undoLast}>Undo Last</button>
            <div style={{ flex: 1 }} />
            <input list="mvp-options" placeholder="Select MVP (optional)" value={mvpPlayerId} onChange={(e) => setMvpPlayerId(e.target.value)} />
            <datalist id="mvp-options">
              {allPlayers.map((p) => (
                <option key={p.playerid} value={p.playerid}>{`${p.firstname} ${p.lastname}`}</option>
              ))}
            </datalist>
            <button className="primary-btn" onClick={endMatch}>End Match (Ctrl+Enter)</button>
          </div>
        </div>
      </div>
    </div>
  );
};
